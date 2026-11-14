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
    $('#pie-nivel').textContent = 'nivel: ' + (esExp ? 'explorador (8-11)' : 'científico (12-15)');
  }
  function cambiarNivel(nivel) {
    if (estado.nivel === nivel) return;
    estado.nivel = nivel;
    guardar(CLAVE_NIVEL, nivel);
    pintarNivel();
    repintarPantallaActual();
  }
  /* conmutar el nivel NO reinicia el recorrido: solo cambia el texto */
  function repintarPantallaActual() {
    var activa = $('.pantalla.activa');
    if (!activa) return;
    var id = activa.id.replace('p-', '');
    if (id === 'intro') pintaIntro();
    else if (id === 'edad') pintaEdad();
    else if (id === 'destino') pintaDestino();
    else if (id === 'crucero') pintaCrucero();
    else if (id === 'destellos') pintaDestellos();
    else if (id === 'objeto') pintaObjeto();
    else if (id === 'pausa') pintaPausa();
  }

  /* ---------- pantallas ---------- */
  function pintaIntro() {
    var l = datos.astronauta.lineas.intro;
    var texto = txt(l) + (estado.visitados.length ? ' ' + (estado.nivel === 'explorador'
      ? 'Veo que ya has estado aquí antes. ¿Seguimos donde lo dejamos?'
      : 'Registros de tu visita anterior encontrados. Podemos continuar la exploración.') : '');
    $('#txt-intro').textContent = texto;
    hablar(texto);
  }

  function pintaEdad() {
    var texto = txt(datos.astronauta.lineas.edad_pregunta);
    $('#txt-edad').textContent = texto;
    hablar(texto);
    var cont = $('#opciones-edad');
    cont.innerHTML = '';
    [
      { etiqueta: 'Menos de 10 años', valor: 'menos', nivel: 'explorador' },
      { etiqueta: '10 años o más', valor: 'mas', nivel: null }
    ].forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opcion'; b.textContent = o.etiqueta;
      b.addEventListener('click', function () {
        estado.edad = o.valor;
        if (o.valor === 'menos') { estado.nivel = 'explorador'; guardar(CLAVE_NIVEL, 'explorador'); pintarNivel(); }
        ir('destino'); pintaDestino();
      });
      cont.appendChild(b);
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

  function pintaCrucero() {
    var d = estado.destino || datos.destinos[0];
    var texto = txt(datos.astronauta.lineas.despegue) + ' ' + txt(datos.astronauta.lineas.crucero);
    $('#txt-crucero').textContent = texto;
    hablar(texto);
    $('#t-crucero').textContent = 'En crucero hacia ' + d.nombre.toLowerCase();
    $('#hud-crucero').textContent = 'acercándonos a ' + d.nombre.toLowerCase() + '…';
    /* la escena se dibuja cuando el contenedor ya es visible */
    setTimeout(function () { window.Escena.crucero(d.color, d.globo); }, 60);
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

  function pintaObjeto() {
    var a = estado.aparato;
    if (!a) { ir('destino'); pintaDestino(); return; }
    var turno = a.turnos[estado.turno];
    if (!turno) { ir('pausa'); pintaPausa(); return; }

    $('#t-objeto').textContent = a.nombre;
    $('#meta-objeto').textContent = a.cuerpo + ' · ' + a.lugar + ' · ' + a.anio;
    $('#turno-objeto').textContent = 'turno ' + (estado.turno + 1) + ' de ' + a.turnos.length;
    var orbe = $('#orbe-objeto');
    orbe.style.setProperty('--c', a.color);
    orbe.style.background = 'radial-gradient(circle at 34% 30%, #fff, ' + a.color + ' 48%, #12161f 100%)';

    var globo = $('#texto-objeto');
    globo.style.setProperty('--c', a.color);
    globo.textContent = turno.pregunta + ' ' + txt(turno);
    hablar(turno.pregunta + '. ' + txt(turno));

    var cont = $('#opciones-objeto');
    cont.innerHTML = '';
    (turno.opciones || ['Seguir']).forEach(function (etiqueta) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opcion'; b.textContent = etiqueta;
      b.addEventListener('click', function () {
        estado.turno += 1;
        if (estado.turno >= a.turnos.length) { ir('pausa'); pintaPausa(); }
        else pintaObjeto();
      });
      cont.appendChild(b);
    });
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
      if (id === 'edad') pintaEdad();
      else if (id === 'destino') pintaDestino();
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

  function arrancar() {
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
    .then(function (j) { datos = j; window.__MS = estado; arrancar(); })
    .catch(function (e) {
      $('#txt-intro').textContent = 'No se ha podido cargar el contenido (' + e.message + '). Abre el sitio desde un servidor, no como archivo local.';
    });
})();
