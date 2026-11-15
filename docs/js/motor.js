/* Memory Signals — motor de la experiencia.
   Máquina de estados: intro → edad → destino → crucero → destellos → objeto → pausa.
   Todo el texto vive en datos/contenido.json: aquí no hay ni una frase. */
(function () {
  'use strict';

  var CLAVE_NIVEL = 'ms_nivel';
  var CLAVE_VISITAS = 'ms_visitados';

  var estado = {
    nivel: 'explorador',
    edad: null,
    destino: null,
    aparato: null,
    turno: 0,
    visitados: [],
    voz: false
  };
  var datos = null;

  /* ---------- utilidades ---------- */
  function $(sel) { return document.querySelector(sel); }
  function $$(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }
  function leer(clave, porDefecto) {
    try { var v = localStorage.getItem(clave); return v === null ? porDefecto : JSON.parse(v); }
    catch (e) { return porDefecto; }
  }
  function guardar(clave, valor) {
    try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
  }
  /* un guion, dos textos */
  function txt(objeto) {
    if (!objeto) return '';
    return objeto['texto_' + estado.nivel] || objeto[estado.nivel] || '';
  }

  /* ---------- voz ---------- */
  var vozES = null;
  function elegirVoz() {
    if (!('speechSynthesis' in window)) return;
    var voces = window.speechSynthesis.getVoices() || [];
    vozES = voces.filter(function (v) { return /^es/i.test(v.lang); })[0] || null;
  }
  function hablar(texto) {
    if (!estado.voz || !('speechSynthesis' in window) || !texto) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(texto);
      u.lang = 'es-ES';
      u.rate = 0.98;
      u.pitch = 1;
      if (vozES) u.voice = vozES;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function callar() {
    if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }

  /* ---------- fondo de vídeo: solo en la portada ---------- */
  var cajaVideo = null, video = null;
  function controlVideo(esIntro) {
    if (!cajaVideo) cajaVideo = document.getElementById('fondo-video');
    if (!video) video = document.getElementById('video-fondo');
    if (!cajaVideo || !video) return;
    if (window.Escena && window.Escena.quieto) { cajaVideo.hidden = true; try { video.pause(); } catch (e) {} return; }
    cajaVideo.hidden = !esIntro;
    if (esIntro) {
      if (!video.getAttribute('src') && video.querySelector('source')) {
        video.load();
      }
      try { var p = video.play(); if (p && p.catch) p.catch(function () { cajaVideo.hidden = true; }); } catch (e) {}
    } else {
      try { video.pause(); } catch (e) {}
    }
  }

  function ir(id) {
    /* fuera de la ficha del objeto el chat vuelve a ser el botón flotante */
    if (id !== 'objeto' && window.ChatObjeto && window.ChatObjeto.ancorar) {
      window.ChatObjeto.ancorar(null);
    }
    $$('.pantalla').forEach(function (p) { p.classList.remove('activa'); });
    controlVideo(id === 'intro');
    var destino = $('#p-' + id);
    if (destino) {
      destino.classList.add('activa');
      var foco = destino.querySelector('h1, h2, button');
      if (foco) foco.focus({ preventScroll: true });
    }
    if (id !== 'crucero' && id !== 'destellos') window.Escena.parar();
    pintarMenu();
  }

  /* ---------- menú de destinos (cabecera) ---------- */
  var menuListo = false;
  function etiquetaCorta(d) {
    if (d.corto) return d.corto;
    return (d.nombre || '').replace(/^La\s+/i, '').split(' ')[0];
  }
  function pintarMenu() {
    var nav = $('#menu-destinos');
    if (!nav || !datos) return;
    if (!menuListo) {
      nav.innerHTML = '';
      datos.destinos.forEach(function (d) {
        var b = document.createElement('button');
        b.type = 'button';
        b.setAttribute('data-destino', d.id);
        b.setAttribute('aria-label', 'Ir a ' + d.nombre);
        var punto = document.createElement('span');
        punto.className = 'punto-menu';
        punto.style.setProperty('--c', d.color || '#ffffff');
        var t = document.createElement('span');
        t.textContent = etiquetaCorta(d);
        b.appendChild(punto); b.appendChild(t);
        b.addEventListener('click', function () { irADestino(d); });
        nav.appendChild(b);
      });
      menuListo = true;
    }
    var activa = $('.pantalla.activa');
    var pantalla = activa ? activa.id.replace('p-', '') : 'intro';
    nav.hidden = !estado.destino || ['crucero', 'destellos', 'objeto', 'pausa'].indexOf(pantalla) === -1;
    Array.prototype.forEach.call(nav.children, function (b) {
      var actual = estado.destino && b.getAttribute('data-destino') === estado.destino.id;
      if (actual) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
  }
  /* saltar de un destino a otro sin reiniciar el viaje ni perder el nivel */
  function irADestino(d) {
    if (!d) return;
    estado.destino = d;
    estado.aparato = null;
    estado.turno = 0;
    ir('destellos');
    pintaDestellos();
  }
  /* volver al principio: la marca de la cabecera hace esto */
  function reiniciar() {
    estado.destino = null;
    estado.aparato = null;
    estado.turno = 0;
    callar();
    ir('intro');
    pintaIntro();
  }

  /* ---------- nivel ---------- */
  function pintarNivel() {
    var ex = $('#btn-explorador'), ci = $('#btn-cientifico');
    var esExp = estado.nivel === 'explorador';
    ex.classList.toggle('activo', esExp);   ex.setAttribute('aria-pressed', esExp ? 'true' : 'false');
    ci.classList.toggle('activo', !esExp);  ci.setAttribute('aria-pressed', !esExp ? 'true' : 'false');
    $('#pie-nivel').textContent = esExp ? 'modo explorar · información sencilla' : 'modo científico · información especializada';
  }
  function cambiarNivel(nivel) {
    if (estado.nivel === nivel) return;
    estado.nivel = nivel;
    guardar(CLAVE_NIVEL, nivel);
    pintarNivel();
    repintarPantallaActual();
  }
  /* elegir modo en la portada: fija el nivel aunque coincida con el que ya había */
  function elegirNivel(nivel) {
    estado.nivel = nivel;
    guardar(CLAVE_NIVEL, nivel);
    pintarNivel();
  }

  /* conmutar el nivel NO reinicia el recorrido: solo cambia el texto */
  function repintarPantallaActual() {
    var activa = $('.pantalla.activa');
    if (!activa) return;
    var id = activa.id.replace('p-', '');
    if (id === 'intro') pintaIntro();
    else if (id === 'destino') pintaDestino();
    else if (id === 'crucero') pintaCrucero();
    else if (id === 'destellos') pintaDestellos();
    else if (id === 'objeto') pintaObjeto();
    else if (id === 'pausa') pintaPausa();
  }

  /* ---------- pantallas ---------- */
  /* al pasar el ratón (o al llegar con el tabulador) los botones de modo se explican */
  var pistaCaja = null;
  function conectarPistas() {
    if (!datos.modos || !document.getElementById('acciones-intro')) return;
    if (!pistaCaja) {
      pistaCaja = document.createElement('div');
      pistaCaja.className = 'pista-modo';
      pistaCaja.id = 'pista-modo';
      pistaCaja.setAttribute('role', 'tooltip');
      pistaCaja.hidden = true;
      document.body.appendChild(pistaCaja);
    }
    $$('#acciones-intro [data-modo]').forEach(function (b) {
      var modo = datos.modos[b.dataset.modo];
      if (!modo) return;
      b.setAttribute('aria-describedby', 'pista-modo');
      b.setAttribute('aria-label', modo.etiqueta + ': ' + modo.pista);
      function abrir() {
        pistaCaja.textContent = modo.pista;
        pistaCaja.hidden = false;
        var r = b.getBoundingClientRect();
        var ancho = Math.min(330, window.innerWidth - 24);
        pistaCaja.style.width = ancho + 'px';
        var x = Math.min(Math.max(12, r.left + r.width / 2 - ancho / 2), window.innerWidth - ancho - 12);
        var alto = pistaCaja.offsetHeight || 96;
        var y = r.top - alto - 12;
        if (y < 12) y = r.bottom + 12;
        pistaCaja.style.left = x + 'px';
        pistaCaja.style.top = y + 'px';
        pistaCaja.style.setProperty('--flecha', Math.round(r.left + r.width / 2 - x) + 'px');
      }
      function cerrar() { pistaCaja.hidden = true; }
      b.addEventListener('mouseenter', abrir);
      b.addEventListener('focus', abrir);
      b.addEventListener('mouseleave', cerrar);
      b.addEventListener('blur', cerrar);
      b.addEventListener('click', cerrar);
    });
  }

  function pintaIntro() {
    conectarPistas();
    var l = datos.astronauta.lineas;
    var texto = txt(l.intro);
    if (estado.visitados.length) texto += ' ' + txt(l.vuelta);
    /* la pregunta con la que acaba la portada: de ella salen los dos modos */
    texto += ' ' + txt(l.elegir_modo);
    $('#txt-intro').textContent = texto;
    hablar(texto);

    /* «Explorar» lee como si tuviera menos de 10 años; «Modo científico», como un adulto.
       Ya no hay pantalla de edad: se elige aquí. */
    $$('#acciones-intro [data-modo]').forEach(function (b) {
      if (b.dataset.listo) return;
      b.dataset.listo = '1';
      b.addEventListener('click', function () {
        elegirNivel(b.dataset.modo);
        estado.edad = b.dataset.modo === 'explorador' ? 'menos' : 'mas';
        ir('destino');
        pintaDestino();
      });
    });
  }

  function pintaDestino() {
    var texto = txt(datos.astronauta.lineas.destino_pregunta);
    $('#txt-destino').textContent = texto;
    hablar(texto);
    var cont = $('#lista-destinos');
    cont.innerHTML = '';
    datos.destinos.forEach(function (d) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'destino';
      var bola = document.createElement('div');
      bola.className = 'bola';
      bola.style.background = 'radial-gradient(circle at 32% 28%, #fff, ' + d.color + ' 45%, #12161f 100%)';
      var t = document.createElement('strong'); t.textContent = d.nombre;
      var s = document.createElement('span'); s.textContent = d.rumbo;
      b.appendChild(bola); b.appendChild(t); b.appendChild(s);
      b.addEventListener('click', function () {
        estado.destino = d;
        ir('crucero'); pintaCrucero();
      });
      cont.appendChild(b);
    });
  }

  function pintCruceroMapa(d) {
    var capa = $('#ventana-mapa');
    var lienzo = $('#ventana');
    var hud = $('#hud-crucero');
    if (!capa || !lienzo) return;
    /* al entrar de nuevo, la ventana vuelve a empezar: sale el planeta y se va el mapa */
    capa.hidden = true;
    capa.classList.remove('visible');
    lienzo.classList.remove('atenuado');
    if (estado.temporizadorMapa) clearTimeout(estado.temporizadorMapa);
    estado.temporizadorMapa = setTimeout(function () {
      if (!document.getElementById('p-crucero').classList.contains('activa')) return;
      var hermanos = hermanosDe(d);
      window.MapaObjetos.ancorar(capa);
      window.MapaObjetos.activar(hermanos, null, cambiarAparato);
      capa.hidden = false;
      lienzo.classList.add('atenuado');
      requestAnimationFrame(function () { capa.classList.add('visible'); });
      if (hud) hud.textContent = 'toca un punto para acercarte';
      if (window.Escena) window.Escena.parar();
    }, 2300);
  }

  function pintaCrucero() {
    var d = estado.destino || datos.destinos[0];
    var texto = txt(datos.astronauta.lineas.despegue) + ' ' + txt(datos.astronauta.lineas.crucero);
    $('#txt-crucero').textContent = texto;
    hablar(texto);
    $('#t-crucero').textContent = 'En crucero hacia ' + d.nombre.toLowerCase();
    $('#hud-crucero').textContent = 'acercándonos a ' + d.nombre.toLowerCase() + '…';
    /* la escena se dibuja cuando el contenedor ya es visible */
    setTimeout(function () { window.Escena.crucero(d.color, d.globo); }, 60);
    /* y el zoom del planeta acaba siendo el mapa del destino, con sus puntos */
    if (window.MapaObjetos) pintCruceroMapa(d);
  }

  /* los aparatos de un destino, resueltos contra el catálogo */
  function hermanosDe(d) {
    if (!d) return [];
    return (d.aparatos || []).map(function (id) {
      return datos.aparatos.filter(function (x) { return x.id === id; })[0];
    }).filter(Boolean);
  }

  var POSICIONES = [{ x: 0.3, y: 0.62 }, { x: 0.68, y: 0.72 }, { x: 0.5, y: 0.86 }];

  function pintaDestellos() {
    var d = estado.destino || datos.destinos[0];
    var texto = txt(datos.astronauta.lineas.destellos);
    $('#txt-destellos').textContent = texto;
    hablar(texto);
    var aparatos = d.aparatos.map(function (id) {
      return datos.aparatos.filter(function (a) { return a.id === id; })[0];
    }).filter(Boolean);

    var puntos = aparatos.map(function (a, i) {
      var p = POSICIONES[i % POSICIONES.length];
      return { x: p.x, y: p.y, color: a.color };
    });
    setTimeout(function () { window.Escena.superficie(d.color, puntos); }, 60);

    var cont = $('#marcadores');
    cont.innerHTML = '';
    aparatos.forEach(function (a, i) {
      var p = POSICIONES[i % POSICIONES.length];
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'marcador';
      b.style.left = (p.x * 100) + '%';
      b.style.top = (p.y * 100) + '%';
      b.style.setProperty('--c', a.color);
      b.setAttribute('aria-label', 'Acercarse a ' + a.nombre);
      var punto = document.createElement('span');
      punto.className = 'punto-glow';
      var etq = document.createElement('span');
      etq.className = 'etq';
      etq.textContent = a.nombre;
      b.appendChild(punto); b.appendChild(etq);
      b.addEventListener('click', function () {
        estado.aparato = a; estado.turno = 0;
        if (estado.visitados.indexOf(a.id) === -1) {
          estado.visitados.push(a.id); guardar(CLAVE_VISITAS, estado.visitados);
        }
        ir('objeto'); pintaObjeto();
      });
      cont.appendChild(b);
    });
  }

  /* volver de un objeto a la lista de objetos de ese mismo destino */
  function volverAObjetos() {
    estado.aparato = null;
    estado.turno = 0;
    ir('destellos');
    pintaDestellos();
  }

  /* saltar a otro aparato del mismo destino desde el mapa de la izquierda */
  function cambiarAparato(a) {
    if (!a) return;
    estado.aparato = a;
    estado.turno = 0;
    if (estado.visitados.indexOf(a.id) === -1) {
      estado.visitados.push(a.id);
      guardar(CLAVE_VISITAS, estado.visitados);
    }
    ir('objeto');
    pintaObjeto();
  }

  function pintaObjeto() {
    var a = estado.aparato;
    if (!a) { ir('destino'); pintaDestino(); return; }

    /* la ficha del objeto ya no lleva guion: el título y el año van arriba de la columna
       del mapa, el 3D en el centro y las preguntas las hace el chat */
    var orbe = $('#orbe-objeto');
    if (orbe) {
      orbe.style.setProperty('--c', a.color);
      orbe.style.background = 'radial-gradient(circle at 34% 30%, #fff, ' + a.color + ' 48%, #12161f 100%)';
    }
    if ($('#t-objeto')) $('#t-objeto').textContent = a.nombre;
    if ($('#meta-objeto')) $('#meta-objeto').textContent = a.cuerpo + ' · ' + a.lugar;
    var etq = $('#anio-objeto');
    if (etq) {
      etq.textContent = (a.anio_tipo === 'llegada' ? 'Llegada · ' : 'Lanzamiento · ') + a.anio;
      etq.style.setProperty('--c', a.color);
    }
    var primero = a.turnos && a.turnos[0];
    hablar(a.nombre + '. ' + a.cuerpo + '. ' + a.lugar + '. ' + (a.anio_tipo === 'llegada' ? 'Llegada en ' : 'Lanzamiento en ') + a.anio + '.');

    /* visor 3D en el centro, mapa a la izquierda y chat a la derecha */
    if (window.Visor3D) window.Visor3D.pintar(a);
    if (window.Hitos) window.Hitos.pintar(a);
    if (window.ChatObjeto) {
      window.ChatObjeto.ancorar($('#col-chat'));
      window.ChatObjeto.activar(a);
    }
    if (window.MapaObjetos) {
      /* el mapa puede venir de la ventana del crucero: vuelve a su sitio en la ficha */
      window.MapaObjetos.ancorar(null);
      var destinoActual = datos.destinos.filter(function (x) { return x.id === (estado.destino || {}).id; })[0];
      var hermanos = destinoActual ? hermanosDe(destinoActual) : [a];
      window.MapaObjetos.activar(hermanos, a, cambiarAparato);
    }
  }

  function pintaPausa() {
    var texto = txt(datos.astronauta.lineas.pausa);
    $('#txt-pausa').textContent = texto;
    hablar(texto);
    var cont = $('#opciones-pausa');
    cont.innerHTML = '';
    var opciones = [
      { etiqueta: 'Viajar a otro destino', accion: function () { ir('destino'); pintaDestino(); } },
      { etiqueta: 'Ver otro objeto de aquí', accion: function () { ir('destellos'); pintaDestellos(); } },
      { etiqueta: 'Terminar la visita', accion: function () {
          var d = txt(datos.astronauta.lineas.despedida);
          $('#txt-pausa').textContent = d; hablar(d);
          cont.innerHTML = '';
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'principal'; b.textContent = 'Volver al inicio';
          b.addEventListener('click', function () { ir('intro'); pintaIntro(); });
          cont.appendChild(b);
        } }
    ];
    opciones.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opcion'; b.textContent = o.etiqueta;
      b.addEventListener('click', o.accion);
      cont.appendChild(b);
    });
  }

  /* ---------- ficha verificable ---------- */
  function abrirFicha() {
    var modal = $('#modal'), cuerpo = $('#modal-cuerpo'), titulo = $('#modal-titulo');
    var a = estado.aparato;
    cuerpo.innerHTML = '';
    if (!a) return;
    titulo.textContent = a.nombre;

    var meta = document.createElement('p');
    meta.innerHTML = '<span class="etiqueta">' + a.cuerpo + '</span><span class="etiqueta">' + a.lugar +
      '</span><span class="etiqueta">' + a.anio + '</span>';
    cuerpo.appendChild(meta);

    var estadoTxt = document.createElement('p');
    estadoTxt.textContent = txt(a.estado_texto) || a.ficha_resumen;
    cuerpo.appendChild(estadoTxt);

    var resumen = document.createElement('p');
    resumen.textContent = a.ficha_resumen;
    cuerpo.appendChild(resumen);

    var h3p = document.createElement('h3'); h3p.textContent = 'Quién trabajó en su misión';
    cuerpo.appendChild(h3p);
    var ul = document.createElement('ul');
    (a.personas || []).forEach(function (p) {
      var li = document.createElement('li');
      li.innerHTML = '<strong>' + p.nombre + '</strong> — ' + p.rol;
      ul.appendChild(li);
    });
    cuerpo.appendChild(ul);

    var h3f = document.createElement('h3'); h3f.textContent = 'Fuentes de este objeto';
    cuerpo.appendChild(h3f);
    (a.fuentes || []).forEach(function (f) {
      var a2 = document.createElement('a');
      a2.className = 'fuente-item';
      a2.href = f.url; a2.target = '_blank'; a2.rel = 'noopener noreferrer';
      a2.textContent = f.texto;
      cuerpo.appendChild(a2);
    });

    modal.hidden = false;
    $('#modal-cerrar').focus();
  }
  function cerrarFicha() { $('#modal').hidden = true; }

  /* ---------- arranque ---------- */
  function conectar() {
    $('#btn-inicio').addEventListener('click', reiniciar);
    document.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-ir]');
      if (!b) return;
      var id = b.getAttribute('data-ir');
      if (id === 'intro') { reiniciar(); return; }
      ir(id);
      if (id === 'destino') pintaDestino();
      else if (id === 'destellos') pintaDestellos();
      else if (id === 'pausa') pintaPausa();
    });
    $('#btn-explorador').addEventListener('click', function () { cambiarNivel('explorador'); });
    $('#btn-cientifico').addEventListener('click', function () { cambiarNivel('cientifico'); });
    $('#btn-voz').addEventListener('click', function () {
      estado.voz = !estado.voz;
      this.setAttribute('aria-pressed', estado.voz ? 'true' : 'false');
      this.firstChild.nodeValue = estado.voz ? '🔊' : '🔇';
      if (estado.voz) repintarPantallaActual(); else callar();
    });
    $('#btn-ficha').addEventListener('click', abrirFicha);
    $('#btn-volver-objetos').addEventListener('click', volverAObjetos);
    $('#modal-cerrar').addEventListener('click', cerrarFicha);
    $('#modal').addEventListener('click', function (ev) { if (ev.target === this) cerrarFicha(); });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') cerrarFicha(); });
  }

  /* la versión sale del fichero VERSION, para no tener el número escrito en dos sitios */
  function pintaVersion() {
    var nodo = $('#pie-version');
    if (!nodo) return;
    fetch('VERSION', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (v) {
        v = (v || '').trim();
        if (v) { nodo.textContent = 'v' + v; nodo.title = 'versión ' + v; }
      })
      .catch(function () { nodo.textContent = ''; });
  }

  function arrancar() {
    pintaVersion();
    estado.nivel = leer(CLAVE_NIVEL, 'explorador');
    if (datos.reglas && datos.reglas.niveles.indexOf(estado.nivel) === -1) estado.nivel = 'explorador';
    estado.visitados = leer(CLAVE_VISITAS, []);
    pintarNivel();
    conectar();
    window.Escena.cielo();
    controlVideo(true);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = elegirVoz;
      elegirVoz();
    }
    pintaIntro();
  }

  fetch('datos/contenido.json')
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (j) { datos = j; window.__MS = estado; window.__MSmodos = j.modos || null; arrancar(); })
    .catch(function (e) {
      $('#txt-intro').textContent = 'No se ha podido cargar el contenido (' + e.message + '). Abre el sitio desde un servidor, no como archivo local.';
    });
})();
