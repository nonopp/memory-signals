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
    /* algunos textos vienen con los dos niveles y otros son una sola frase: antes la frase se perdía */
    if (typeof objeto === 'string') return objeto;
    return objeto['texto_' + estado.nivel] || objeto[estado.nivel] || '';
  }

  /* ---------- voz ---------- */
  /* ---------- elección de la voz: fuera las roncas y las de broma ---------- */
  /* Antes se cogía la PRIMERA voz del idioma que apareciera en la lista; en macOS y en iOS
     eso suele ser «Albert», que suena ronco. Ahora se puntúan todas y se elige la mejor. */
  var VOCES = {};          /* idioma → voz elegida */
  var VOZ_RONCA = /albert|bad ?news|bahh|bells|boing|bubbles|cellos|deranged|fred|good ?news|hysterical|jester|organ|superstar|trinoids|whisper|wobble|zarvox|ralph|kathy|princess|junior|grandma|grandpa|rocko|shelley|sandy|flo|eddy|reed|grandmaster|novelty|pipe/i;
  var VOZ_CLARA = /google|samantha|ava|allison|susan|serena|daniel|karen|moira|tessa|fiona|alex|tom|aria|zira|guy|jenny|sonia|libby|ryan|diego|m[oó]nica|paulina|marisol|jorge|helena|katja|anna|petra|conchita|luc[ií]a|valentina|elvira|estrella|sabina|am[ée]lie|audrey|natural|neural/i;
  /* saludo del objeto y aviso de inactividad: una vez por visita, y sin insistir si el visitante
     ha apagado la voz a mano */
  var mudoPorUsuario = false;
  var saludoDichoEn = '';
  var avisoInactividadDicho = '';
  var temporizadorInactividad = null;
  var ultimaActividad = 0;
  var LANG = { es: 'es-ES', en: 'en-GB', de: 'de-DE' };
  function idiomaActual() {
    return (window.MS_Idioma && window.MS_Idioma.actual && window.MS_Idioma.actual()) || 'es';
  }
  function T(clave, datos) {
    if (window.MS_Idioma && window.MS_Idioma.t) return window.MS_Idioma.t(clave, datos);
    return '';
  }
  function puntuaVoz(v, pre, exacto) {
    var n = String(v.name || ''), l = String(v.lang || '').toLowerCase().replace(/_/g, '-');
    if (VOZ_RONCA.test(n)) return -100;          /* voces roncas o de broma: nunca */
    var s;
    if (l === exacto) s = 6;                     /* el idioma exacto, por delante */
    else if (l.indexOf(pre) === 0) s = 3;        /* mismo idioma, otra región */
    else return -1;
    if (VOZ_CLARA.test(n)) s += 5;               /* voces que suenan bien conocidas */
    if (/natural|neural|premium|enhanced/i.test(n)) s += 4;
    if (!v.localService) s += 2;                 /* las de red suenan mejor en casi todos los equipos */
    if (/compact|eloquence|espeak/i.test(n)) s -= 3;
    return s;
  }
  function elegirVoz() {
    if (!('speechSynthesis' in window)) return;
    var voces = window.speechSynthesis.getVoices() || [];
    Object.keys(LANG).forEach(function (idi) {
      var mejor = null, mejorPuntos = 0;
      voces.forEach(function (v) {
        var pts = puntuaVoz(v, idi, String(LANG[idi]).toLowerCase());
        if (pts > mejorPuntos) { mejorPuntos = pts; mejor = v; }
      });
      VOCES[idi] = mejor;   /* si no hay ninguna buena, se queda la del sistema */
    });
  }
  function hablar(texto) {
    if (!estado.voz || !('speechSynthesis' in window) || !texto) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(texto);
      u.lang = LANG[idiomaActual()] || 'es-ES';
      u.rate = 0.98;
      u.pitch = 1;
      var v = VOCES[idiomaActual()];
      if (v) u.voice = v;
      window.speechSynthesis.speak(u);
    } catch (e) {}
  }
  function callar() {
    if ('speechSynthesis' in window) { try { window.speechSynthesis.cancel(); } catch (e) {} }
  }

  /* ---------- la voz es una sola para toda la app: la cabecera y el chat la comparten ---------- */
  var oyentesVoz = [];
  function avisarVoz() {
    oyentesVoz.forEach(function (f) { try { f(!!estado.voz); } catch (e) {} });
  }
  function pintaBotonVoz() {
    var b = document.getElementById('btn-voz');
    if (!b) return;
    b.setAttribute('aria-pressed', estado.voz ? 'true' : 'false');
    if (b.firstChild) b.firstChild.nodeValue = estado.voz ? '🔊' : '🔇';
  }
  /* silencioso = no repintar la pantalla (el chat no quiere que le lea todo el objeto encima) */
  function alternarVoz(silencioso) {
    estado.voz = !estado.voz;
    mudoPorUsuario = !estado.voz;
    pintaBotonVoz();
    avisarVoz();
    if (estado.voz) { if (!silencioso) repintarPantallaActual(); } else callar();
    return estado.voz;
  }
  /* «Hola, soy <objeto>. Pregúntame lo que quieras de mí.» */
  function saludoDelObjeto(a) {
    var t = T('saludo', { objeto: a.nombre });
    return t || ('Hola, soy ' + a.nombre + '. Pregúntame lo que quieras de mí.');
  }
  function enObjeto() {
    var p = document.getElementById('p-objeto');
    return !!(p && p.classList.contains('activa'));
  }
  /* 20 s sin mover el ratón, sin teclear y sin mensajes nuevos en el chat */
  function armarInactividad() {
    if (temporizadorInactividad) { clearTimeout(temporizadorInactividad); temporizadorInactividad = null; }
    if (!enObjeto() || !estado.aparato) return;
    temporizadorInactividad = setTimeout(function () {
      temporizadorInactividad = null;
      if (!enObjeto() || !estado.aparato) return;
      if (mudoPorUsuario) return;                                   // lo ha apagado: se calla
      if (avisoInactividadDicho === estado.aparato.id) return;        // solo una vez por objeto
      avisoInactividadDicho = estado.aparato.id;
      if (!estado.voz) alternarVoz(true);                            // se enciende para poder decirlo
      hablar((T('sigues.ahi') || '¿Sigues ahí? ') + saludoDelObjeto(estado.aparato));
    }, 20000);
  }
  function hayActividad() {
    var ahora = Date.now();
    if (ahora - ultimaActividad < 400) return;   // no rearmar en cada píxel que se mueve el ratón
    ultimaActividad = ahora;
    armarInactividad();
  }

  window.MS_Voz = {
    hablar: hablar,
    callar: callar,
    activa: function () { return !!estado.voz; },
    alternar: alternarVoz,
    encender: function (silencioso) { if (!estado.voz) { estado.voz = true; pintaBotonVoz(); avisarVoz(); if (!silencioso) repintarPantallaActual(); } return estado.voz; },
    alCambiar: function (f) { if (typeof f === 'function') oyentesVoz.push(f); }
  };

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
    /* y al cambiar de pantalla, de objeto o al volver al inicio, la ventana del chat se cierra:
       no se queda abierta encima de la pantalla nueva */
    if (window.ChatObjeto && window.ChatObjeto.cerrar) {
      window.ChatObjeto.cerrar();
    }
    if (id !== 'objeto') {
      /* fuera de la ficha no hay saludo ni aviso pendiente */
      saludoDichoEn = '';
      avisoInactividadDicho = '';
      if (temporizadorInactividad) { clearTimeout(temporizadorInactividad); temporizadorInactividad = null; }
    }
    $$('.pantalla').forEach(function (p) { p.classList.remove('activa'); });
    controlVideo(id === 'intro');
    var destino = $('#p-' + id);
    if (destino) {
      destino.classList.add('activa');
      var foco = destino.querySelector('h1, h2, button');
      if (foco) foco.focus({ preventScroll: true });
    }
    /* el fondo de plano técnico solo va en la pantalla del objeto */
    document.body.classList.toggle('viendo-objeto', id === 'objeto');
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
    $('#pie-nivel').textContent = T(esExp ? 'pie.nivel.explorador' : 'pie.nivel.cientifico') ||
      (esExp ? 'modo explorar · información sencilla' : 'modo científico · información especializada');
    /* en la portada, el elegido va encendido y el otro apagado, igual que en la cabecera */
    $$('#acciones-intro [data-modo]').forEach(function (b) {
      var sel = (b.dataset.modo === 'explorador') === esExp;
      b.classList.toggle('activo', sel);
      b.setAttribute('aria-pressed', sel ? 'true' : 'false');
    });
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
      if (hud) hud.textContent = T('hud.toca') || 'toca un punto para acercarte';
      if (window.Escena) window.Escena.parar();
    }, 2300);
  }

  function pintaCrucero() {
    var d = estado.destino || datos.destinos[0];
    var texto = txt(datos.astronauta.lineas.despegue) + ' ' + txt(datos.astronauta.lineas.crucero);
    $('#txt-crucero').textContent = texto;
    hablar(texto);
    /* el nombre del destino lleva artículo en español e inglés («la Luna», «the Moon») y no en
       alemán, donde el artículo lo pone la plantilla («zum Mond»). Se elige la forma que lee bien. */
    var i = idiomaActual();
    var largo = d.nombre || d.corto || '';
    /* solo se pasa a minúscula el artículo («la Luna», «the Moon»): los nombres propios de planeta
       van con mayúscula, «Marte» no «marte» */
    var nombreDestino = (i === 'de')
      ? (d.corto || d.nombre)
      : (/^(La|El|Los|Las|The|Der|Die|Das)\s/.test(largo)
          ? largo.replace(/^./, function (c) { return c.toLowerCase(); })
          : largo);
    $('#t-crucero').textContent = T('crucero.hacia', { destino: nombreDestino });
    $('#hud-crucero').textContent = T('hud.acercandonos', { destino: nombreDestino });
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

  /* Sitios donde aparecen los destellos. Con tres objetos valían tres posiciones fijas; en cuanto
     un destino tiene más, se repetían y los nombres se montaban unos encima de otros. Ahora se
     reparten en filas de tres, y si hay pocos se usan las de siempre. */
  function posicionesDestellos(n) {
    if (n <= POSICIONES.length) return POSICIONES.slice(0, n);
    var filas = Math.ceil(n / 3);
    var salida = [];
    for (var i = 0; i < n; i++) {
      var fila = Math.floor(i / 3), col = i % 3;
      var enFila = Math.min(3, n - fila * 3);
      /* si la última fila lleva uno o dos, se centran */
      var centro = enFila === 1 ? 0.5 : (enFila === 2 ? 0.38 + col * 0.24 : 0.2 + col * 0.3);
      var y = filas === 1 ? 0.72 : 0.4 + (fila / (filas - 1)) * 0.5;
      salida.push({ x: centro + (fila % 2 ? 0.03 : -0.03), y: y });
    }
    return salida;
  }

  function pintaDestellos() {
    var d = estado.destino || datos.destinos[0];
    var texto = txt(datos.astronauta.lineas.destellos);
    $('#txt-destellos').textContent = texto;
    hablar(texto);
    var aparatos = d.aparatos.map(function (id) {
      return datos.aparatos.filter(function (a) { return a.id === id; })[0];
    }).filter(Boolean);

    var sitios = posicionesDestellos(aparatos.length);
    var puntos = aparatos.map(function (a, i) {
      return { x: sitios[i].x, y: sitios[i].y, color: a.color };
    });
    setTimeout(function () { window.Escena.superficie(d.color, puntos); }, 60);

    var cont = $('#marcadores');
    cont.innerHTML = '';
    aparatos.forEach(function (a, i) {
      var p = sitios[i];
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
      /* en el campo de destellos manda el nombre corto: los largos se cortaban todos igual y no
         se distinguían entre ellos */
      etq.textContent = a.nombre_mapa || a.nombre;
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
      etq.textContent = (a.anio_tipo === 'llegada' ? T('anio.llegada') : T('anio.lanzamiento')) + ' · ' + a.anio;
      etq.style.setProperty('--c', a.color);
    }
    var primero = a.turnos && a.turnos[0];
    /* Al entrar en un objeto se enciende la voz y saluda. Al repintar por cambiar de modo no se
       repite: solo saluda cuando el objeto es otro o cuando se vuelve a entrar. */
    if (saludoDichoEn !== a.id) {
      saludoDichoEn = a.id;
      avisoInactividadDicho = '';
      armarInactividad();
      if (!mudoPorUsuario && window.MS_Voz && window.MS_Voz.encender) {
        window.MS_Voz.encender(true);   // sin repintar: ya estamos pintando
      }
      hablar(saludoDelObjeto(a));
    } else {
      armarInactividad();
    }

    /* visor 3D en el centro, mapa a la izquierda y chat a la derecha */
    pintarBotonSketch(a);
    if (window.Visor3D) window.Visor3D.pintar(a);
    if (window.Hitos) window.Hitos.pintar(a);
    if (window.ChatObjeto) {
      window.ChatObjeto.ancorar($('#col-chat'));
      window.ChatObjeto.activar(a);
      /* la ficha de un objeto abre el chat sola: no hay que buscar «Pregúntame».
         sin foco, para que en el móvil no salga el teclado encima del modelo */
      window.ChatObjeto.abrir(true);
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
    var opciones = [];
    /* primero, volver al objeto que se estaba viendo: antes no había forma de regresar */
    if (estado.aparato) {
      opciones.push({ etiqueta: T('pausa.volverObjeto'), principal: true, accion: function () {
          ir('objeto'); pintaObjeto();
        } });
    }
    opciones.push(
      { etiqueta: T('pausa.otroDestino'), accion: function () { ir('destino'); pintaDestino(); } },
      { etiqueta: T('pausa.otroObjeto'), accion: function () { ir('destellos'); pintaDestellos(); } },
      { etiqueta: T('pausa.terminar'), accion: function () {
          var d = txt(datos.astronauta.lineas.despedida);
          $('#txt-pausa').textContent = d; hablar(d);
          cont.innerHTML = '';
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'principal'; b.textContent = T('pausa.inicio');
          b.addEventListener('click', function () { ir('intro'); pintaIntro(); });
          cont.appendChild(b);
          if (estado.aparato) {
            var bv = document.createElement('button');
            bv.type = 'button'; bv.className = 'opcion'; bv.textContent = T('pausa.volverObjeto');
            bv.addEventListener('click', function () { ir('objeto'); pintaObjeto(); });
            cont.appendChild(bv);
          }
        } }
    );
    opciones.forEach(function (o) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'opcion' + (o.principal ? ' principal' : ''); b.textContent = o.etiqueta;
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
    var donde = txt(a.estado_texto) || a.ficha_resumen;
    estadoTxt.textContent = donde;
    cuerpo.appendChild(estadoTxt);

    /* el resumen solo si aporta algo: antes salía repetido cuando faltaba el estado */
    if (a.ficha_resumen && a.ficha_resumen !== donde) {
      var resumen = document.createElement('p');
      resumen.textContent = a.ficha_resumen;
      cuerpo.appendChild(resumen);
    }

    var h3p = document.createElement('h3'); h3p.textContent = T('ficha.quien');
    cuerpo.appendChild(h3p);
    var ul = document.createElement('ul');
    (a.personas || []).forEach(function (p) {
      var li = document.createElement('li');
      var quien = document.createElement('strong');
      quien.textContent = p.nombre || '';
      li.appendChild(quien);
      /* el papel viene como «papel» en unos aparatos y como «rol» en otros: antes salía «undefined» */
      var papel = p.papel || p.rol || p.cargo || '';
      if (papel) li.appendChild(document.createTextNode(' — ' + papel));
      ul.appendChild(li);
    });
    cuerpo.appendChild(ul);

    var h3f = document.createElement('h3'); h3f.textContent = T('ficha.fuentes');
    cuerpo.appendChild(h3f);
    var fuentes = a.fuentes || [];
    if (!fuentes.length) {
      var sinFuentes = document.createElement('p');
      sinFuentes.className = 'tenue';
      sinFuentes.textContent = T('ficha.noConsta');
      cuerpo.appendChild(sinFuentes);
    }
    fuentes.forEach(function (f) {
      /* admite la forma nueva {texto, url} y la vieja, que era solo el texto */
      var et = (typeof f === 'string') ? f : (f.texto || '');
      var u = (typeof f === 'string') ? '' : (f.url || '');
      var nodo = document.createElement(u ? 'a' : 'span');
      nodo.className = 'fuente-item';
      if (u) { nodo.href = u; nodo.target = '_blank'; nodo.rel = 'noopener noreferrer'; }
      nodo.textContent = et || u;
      cuerpo.appendChild(nodo);
    });

    modal.hidden = false;
    $('#modal-cerrar').focus();
  }
  function cerrarFicha() { $('#modal').hidden = true; }

  /* ---------- el sketch técnico del aparato, para verlo y descargarlo ---------- */
  var sketchesListos = null;
  var sketchDe = null;   /* el que se está enseñando, para el botón de descargar */

  function cargarSketches() {
    if (sketchesListos) return sketchesListos;
    sketchesListos = fetch('datos/sketches.json?v=' + (window.__MSV || ''))
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .catch(function () { return {}; });
    return sketchesListos;
  }

  /* el sketch del aparato: uno solo, el mismo en los tres idiomas */
  function sketchPara(aparato) {
    return cargarSketches().then(function (todos) {
      var e = todos && todos[aparato.id];
      if (!e || !e.archivo) return null;
      return { datos: e, objeto: aparato };
    });
  }

  function pintaSketch() {
    if (!sketchDe) return;
    var d = sketchDe.datos, img = $('#sketch-imagen');
    $('#sketch-titulo').textContent = sketchDe.objeto.nombre;
    img.src = d.archivo + '?v=' + (window.__MSV || '');
    img.alt = T('sketch.alt', { objeto: sketchDe.objeto.nombre });
    img.hidden = false;
    var aviso = $('#sketch-aviso'); aviso.hidden = true; aviso.textContent = '';
    var nota = $('#sketch-nota');
    if (nota) { nota.hidden = false; nota.textContent = T('sketch.nota'); }
    var enlace = $('#sketch-descargar');
    enlace.hidden = false;
    enlace.href = d.archivo;
    enlace.setAttribute('download', d.archivo.split('/').pop());
    $('#sketch-credito').textContent = '';
    $('#visor-sketch').hidden = false;
    $('#sketch-cerrar').focus();
  }

  function abrirSketch() {
    if (sketchDe) { pintaSketch(); return; }
    var a = estado.aparato;
    if (!a) return;
    sketchPara(a).then(function (sk) { if (sk) { sketchDe = sk; pintaSketch(); } });
  }
  function cerrarSketch() {
    $('#visor-sketch').hidden = true;
    $('#sketch-imagen').removeAttribute('src');
  }
  function pintarBotonSketch(a) {
    var boton = $('#btn-sketch');
    if (!boton) return;
    boton.hidden = false;      /* los 22 aparatos tienen sketch */
    sketchDe = null;
    sketchPara(a).then(function (sk) {
      /* si el visitante ya ha cambiado de objeto mientras se cargaba el índice, no se toca */
      if (!sk || !estado.aparato || estado.aparato.id !== a.id) return;
      sketchDe = sk;
      /* el sketch del aparato es también el fondo de la ficha.
         La ruta va absoluta: una url() relativa dentro de una variable CSS se resuelve
         contra la hoja de estilos (/css/) y no contra la página, y no cargaría. */
      var urlFondo = new URL(sk.datos.archivo, location.href).href;
      document.documentElement.style.setProperty(
        '--fondo-objeto', 'url("' + urlFondo + '?v=' + (window.__MSV || '') + '")');
    });
  }

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
    /* la inactividad se mide con esto: ratón, teclado, rueda, tacto y lo que pase en el chat */
    ['mousemove', 'mousedown', 'keydown', 'wheel', 'touchstart', 'scroll'].forEach(function (ev) {
      document.addEventListener(ev, hayActividad, { passive: true });
    });
    document.addEventListener('ms:chat', hayActividad);
    $('#btn-explorador').addEventListener('click', function () { cambiarNivel('explorador'); });
    $('#btn-cientifico').addEventListener('click', function () { cambiarNivel('cientifico'); });
    $('#btn-voz').addEventListener('click', function () { alternarVoz(false); });
    $('#btn-ficha').addEventListener('click', abrirFicha);
    if ($('#btn-sketch')) $('#btn-sketch').addEventListener('click', abrirSketch);
    if ($('#sketch-cerrar')) $('#sketch-cerrar').addEventListener('click', cerrarSketch);
    if ($('#visor-sketch')) {
      $('#visor-sketch').addEventListener('click', function (ev) {
        if (ev.target === this || ev.target.classList.contains('infografia-lienzo')) cerrarSketch();
      });
    }
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      if ($('#visor-sketch') && !$('#visor-sketch').hidden) { cerrarSketch(); return; }
      if ($('#modal') && !$('#modal').hidden) cerrarFicha();
    });
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

  /* la versión la pone index.html en window.__MSV: al subir versión se cambia ahí y en docs/VERSION */
  function ficheroContenido() {
    var l = idiomaActual();
    return 'datos/contenido' + (l === 'es' ? '' : '.' + l) + '.json?v=' + (window.__MSV || '');
  }
  /* al cambiar de idioma se recarga el contenido y se repinta la pantalla; si estamos
     dentro de un objeto, se vuelve a presentar en el idioma nuevo */
  document.addEventListener('ms:idioma', function () {
    elegirVoz();
    fetch(ficheroContenido(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) {
        /* los objetos guardados en el estado son los del idioma anterior: se vuelven a enlazar
           con los nuevos por su id, o la pantalla y la ficha seguirían en el idioma de antes */
        var idAparato = estado.aparato ? estado.aparato.id : null;
        var idDestino = estado.destino ? estado.destino.id : null;
        datos = j;
        window.__MSmodos = j.modos || null;
        if (idDestino) {
          var dNuevo = (j.destinos || []).filter(function (x) { return x.id === idDestino; })[0];
          if (dNuevo) estado.destino = dNuevo;
        }
        if (idAparato) {
          var aNuevo = (j.aparatos || []).filter(function (x) { return x.id === idAparato; })[0];
          estado.aparato = aNuevo || null;
        }
        if (typeof repintarPantallaActual === 'function') repintarPantallaActual();
        /* el pie y el rótulo del modo se escriben aparte: hay que rehacerlos o se quedan en el idioma anterior */
        if (typeof pintarNivel === 'function') pintarNivel();
        /* el menú de destinos se construye una sola vez: hay que forzar que se rehaga con los nombres nuevos */
        menuListo = false;
        if (typeof pintarMenu === 'function') pintarMenu();
        if (window.ChatObjeto && window.ChatObjeto.rehacer) window.ChatObjeto.rehacer();
        /* si la ficha verificable estaba abierta, se rehace en el idioma nuevo */
        if ($('#visor-sketch') && !$('#visor-sketch').hidden && estado.aparato) {
          /* el sketch abierto se repinta con el nombre del aparato en el idioma nuevo */
          sketchPara(estado.aparato).then(function (sk) {
            sketchDe = sk || null;
            if (sketchDe) pintaSketch(); else cerrarSketch();
          });
        }
        var modalAbierto = $('#modal') && !$('#modal').hidden;
        if (modalAbierto && typeof abrirFicha === 'function' && estado.aparato) abrirFicha();
        if (enObjeto() && estado.aparato) {
          avisoInactividadDicho = '';
          saludoDichoEn = estado.aparato.id;
          if (!mudoPorUsuario) window.MS_Voz.encender(true);
          hablar(saludoDelObjeto(estado.aparato));
          armarInactividad();
        }
      })
      .catch(function (e) { console.warn('idioma: ' + e.message); });
  });

  fetch(ficheroContenido())
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (j) { datos = j; window.__MS = estado; window.__MSmodos = j.modos || null; arrancar(); })
    .catch(function (e) {
      $('#txt-intro').textContent = 'No se ha podido cargar el contenido (' + e.message + '). Abre el sitio desde un servidor, no como archivo local.';
    });
})();
