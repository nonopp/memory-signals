/* Memory Signals — mapa del destino.
   A la izquierda del objeto: un globo (Luna o Marte) con un punto por aparato,
   o un cielo estrellado con los objetos del espacio profundo ordenados por año.
   Los puntos son botones: al pulsarlos se salta a ese objeto.
   Las coordenadas salen de las fichas; si un aparato no tiene, no se pone punto. */
(function () {
  'use strict';

  var caja, lienzo, ctx, capa, titulo, globo;
  var aparatos = [], actual = null, alElegir = null;
  var rot = 0.6, girando = true, arrastrando = false, xInicial = 0, rotInicial = 0;
  /* acercamiento: en el globo separa los pines apiñados; en el cielo de otros destinos
     hace lo mismo, con más recorrido porque allí los doce objetos van en fila */
  var zum = 1, ZUM_MAX = 4, ZUM_ESPACIO = 6, cuerpoAnterior = '';
  /* desplazamiento del cielo cuando está acercado: sin él, lo que se sale del marco no se alcanza.
     `ultimoArrastre` evita que soltar un arrastre encima de un pin cuente como pulsación. */
  var desp = { x: 0, y: 0 }, despInicial = { x: 0, y: 0 }, yInicial = 0, ultimoArrastre = 0;
  /* ancho de cada nombre, medido una vez: leerlo en cada fotograma obligaría a recalcular el diseño */
  var anchosEtq = (typeof WeakMap === 'function') ? new WeakMap() : { get: function () { return null; }, set: function () {} };
  var bolitas = [];
  /* textos de la interfaz en el idioma elegido (los pone js/idioma.js) */
  function T(clave) {
    return (window.MS_Idioma && window.MS_Idioma.t) ? window.MS_Idioma.t(clave) : '';
  }
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Color de los puntos en cada globo. En blanco no se distinguían sobre la cara iluminada. */
  var PALETA = { luna: '#57c7ff', marte: '#a01f12' };
  /* Ventana en la que se enciende el nombre, en radianes de giro: el globo gira a 0,04 rad/s
     (0,0016 cada 40 ms), así que 0,2 rad = 5 s y 0,04 rad = 1 s. */
  var VENTANA = {
    luna: { antes: 0.005, despues: 0.2 },   /* al llegar al centro: 5 s */
    marte: { antes: 0.04, despues: 0.16 }   /* 1 s antes del centro y 4 s después (5 s en total) */
  };
  /* Al abrir el mapa se enseñan todos los nombres 5 s, para ver de un vistazo qué hay.
     Después se apagan y solo se encienden los que el giro va llevando al centro. */
  var REVELADO = 5000;
  var revelarHasta = 0;
  var relojRevelado = null;

  function crear() {
    if (caja) return;
    caja = document.createElement('aside');
    caja.className = 'mapa-destino';
    caja.id = 'mapa-destino';
    caja.innerHTML =
      '<h2 class="mapa-titulo" id="mapa-titulo">' + (T('mapa.titulo') || 'Dónde estamos') + '</h2>' +
      '<div class="mapa-marco">' +
        '<canvas id="mapa-lienzo" aria-hidden="true"></canvas>' +
        '<canvas id="mapa-globo" aria-hidden="true"></canvas>' +
        '<div class="mapa-pins" id="mapa-pins"></div>' +
      '</div>' +
      '<div class="mapa-zum" hidden>' +
        '<button type="button" class="mapa-zum-btn" data-zum="1"' +
          ' aria-label="' + (T('mapa.zum.mas') || 'Acercar') + '" title="' + (T('mapa.zum.mas') || 'Acercar') + '">+</button>' +
        '<button type="button" class="mapa-zum-btn" data-zum="-1"' +
          ' aria-label="' + (T('mapa.zum.menos') || 'Alejar') + '" title="' + (T('mapa.zum.menos') || 'Alejar') + '">−</button>' +
      '</div>' +
      '<p class="mapa-pie" id="mapa-pie">Toca un punto para acercarte a otro aparato.</p>' +
      '<p class="mapa-credito" id="mapa-credito" hidden></p>';
    var marco = document.getElementById('col-mapa');
    if (marco) marco.appendChild(caja);
    lienzo = document.getElementById('mapa-lienzo');
    globo = document.getElementById('mapa-globo');
    capa = document.getElementById('mapa-pins');
    titulo = document.getElementById('mapa-titulo');
    ctx = lienzo && lienzo.getContext('2d');
    var capaZum = caja.querySelector('.mapa-zum');
    if (capaZum) {
      capaZum.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-zum]');
        if (!b) return;
        ev.stopPropagation();
        var signo = Number(b.getAttribute('data-zum'));
        ponZum(signo > 0 ? zum * 1.5 : zum / 1.5);
      });
    }
    conectarArrastre();
    window.addEventListener('resize', pintar);
  }

  function tipo() {
    var conMapa = aparatos.filter(function (a) { return a.mapa; })[0];
    return conMapa ? conMapa.mapa.tipo : 'espacio';
  }

  /* el radio del globo, con el acercamiento aplicado: lo usan el dibujo, el 3D y los pines */
  function radioDe(t) { return Math.min(t.w, t.h) * 0.42 * zum; }

  function tamano() {
    var w = lienzo.parentNode.clientWidth || 280;
    var h = lienzo.parentNode.clientHeight || 280;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    lienzo.width = Math.round(w * dpr);
    lienzo.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { w: w, h: h };
  }

  /* ---------- globo (Luna / Marte) ---------- */
  function proyecta(lat, lon, cx, cy, R) {
    var la = lat * Math.PI / 180, lo = (lon * Math.PI / 180) + rot;
    var x = Math.cos(la) * Math.sin(lo);
    var y = Math.sin(la);
    var z = Math.cos(la) * Math.cos(lo);
    return { x: cx + R * x, y: cy - R * y, z: z };
  }

  var cráteres = null;
  function sembrarCráteres() {
    cráteres = [];
    var s = 12345;
    function rnd() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    for (var i = 0; i < 26; i++) {
      cráteres.push({ la: (rnd() * 160 - 80), lo: (rnd() * 360), r: 0.03 + rnd() * 0.10 });
    }
  }

  function pintaGlobo(t, cuerpo) {
    var w = t.w, h = t.h, cx = w / 2, cy = h / 2, R = radioDe(t);
    ctx.clearRect(0, 0, w, h);

    /* halo */
    var halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.5);
    halo.addColorStop(0, cuerpo === 'marte' ? 'rgba(214,120,80,.20)' : 'rgba(180,205,225,.16)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2); ctx.fill();

    /* esfera */
    var g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.15, cx, cy, R);
    if (cuerpo === 'marte') {
      g.addColorStop(0, '#e8a17c'); g.addColorStop(0.55, '#b5623c'); g.addColorStop(1, '#3a1a10');
    } else {
      g.addColorStop(0, '#e8eef5'); g.addColorStop(0.55, '#9aa8b8'); g.addColorStop(1, '#20262e');
    }
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.fill();

    /* cráteres / manchas, solo la cara visible */
    if (!cráteres) sembrarCráteres();
    cráteres.forEach(function (c) {
      var p = proyecta(c.la, c.lo, cx, cy, R);
      if (p.z <= 0.05) return;
      var rr = c.r * R * p.z;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
      ctx.fillStyle = cuerpo === 'marte'
        ? 'rgba(90,40,25,' + (0.10 + 0.22 * p.z) + ')'
        : 'rgba(60,70,85,' + (0.10 + 0.24 * p.z) + ')';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.05 + 0.10 * p.z) + ')';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    /* terminador: sombra a la derecha */
    var sombra = ctx.createLinearGradient(cx - R, cy, cx + R, cy);
    sombra.addColorStop(0, 'rgba(0,0,0,0)');
    sombra.addColorStop(0.62, 'rgba(0,0,0,0.05)');
    sombra.addColorStop(1, 'rgba(0,0,0,0.55)');
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = sombra; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
    ctx.restore();

    return { cx: cx, cy: cy, R: R };
  }


  /* ---------- globo con imágenes reales de la NASA ----------
     Antes el globo se dibujaba por código y los cráteres eran inventados. Ahora la esfera
     lleva el mapa de verdad:
       Luna  · LRO LROC WAC Global Morphology Mosaic  (NASA/USGS, ≈100 m/px)
       Marte · Viking MDIM 2.1 en color               (NASA/USGS, ≈232 m/px)
     Se pinta con WebGL (three.js). Si el navegador no lo admite o la librería no llega,
     se queda el globo dibujado de antes: nadie se queda sin mapa. */
  var MAPAS = {
    luna:  { 1: 'img/planeta-luna-1k.jpg',  2: 'img/planeta-luna-2k.jpg',  4: 'img/planeta-luna-4k.jpg' },
    marte: { 1: 'img/planeta-marte-1k.jpg', 2: 'img/planeta-marte-2k.jpg', 4: 'img/planeta-marte-4k.jpg' }
  };
  var t3 = { listo: false, roto: false, pedido: false, escena: null, camara: null,
             malla: null, pintador: null, texturas: {} };

  function hayWebGL() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext &&
                (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { return false; }
  }

  /* la librería se pide solo cuando hace falta el globo, para no frenar la carga */
  function pedirThree() {
    if (t3.pedido || t3.roto || window.THREE) return;
    t3.pedido = true;
    var s = document.createElement('script');
    s.src = 'js/vendor/three.min.js?v=' + (window.__MSV || '');
    s.async = true;
    s.onload = function () { dibujar(); };
    s.onerror = function () { t3.roto = true; dibujar(); };
    document.head.appendChild(s);
  }

  function prepara3D() {
    if (t3.listo || t3.roto) return t3.listo;
    if (!window.THREE || !globo || !hayWebGL()) return false;
    try {
      t3.pintador = new THREE.WebGLRenderer({ canvas: globo, alpha: true, antialias: true });
      t3.pintador.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      if ('outputEncoding' in t3.pintador) t3.pintador.outputEncoding = THREE.sRGBEncoding;
      t3.pintador.setClearColor(0x000000, 0);
      t3.escena = new THREE.Scene();
      /* cámara ortográfica con una unidad = un píxel CSS: así el disco cae exactamente
         donde lo espera proyecta(), y los pines siguen clavados sin tocar su matemática */
      t3.camara = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
      t3.camara.position.z = 10;
      t3.malla = new THREE.Mesh(
        new THREE.SphereGeometry(1, 96, 64),
        new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 2, specular: 0x0a0f18 })
      );
      t3.escena.add(t3.malla);
      /* Luz de estudio, no de telescopio: el mapa se lee en una tarjeta oscura y con
         media esfera a oscuras no se distinguen los mares ni los puntos.
         (valores probados en una página aparte comparando tres variantes) */
      var sol = new THREE.DirectionalLight(0xffffff, 0.75);
      sol.position.set(-0.55, 0.3, 1);
      t3.escena.add(sol);
      t3.escena.add(new THREE.AmbientLight(0xffffff, 0.95));
      t3.listo = true;
    } catch (e) { t3.roto = true; t3.listo = false; }
    return t3.listo;
  }

  function textura(cuerpo, nivel) {
    var clave = cuerpo + ':' + nivel;
    if (t3.texturas[clave]) return t3.texturas[clave];
    var tex = new THREE.TextureLoader().load(MAPAS[cuerpo][nivel]);
    if ('encoding' in tex) tex.encoding = THREE.sRGBEncoding;
    try { tex.anisotropy = Math.min(4, t3.pintador.capabilities.getMaxAnisotropy()); } catch (e) {}
    t3.texturas[clave] = tex;
    return tex;
  }

  /* el halo de siempre, dibujado en el lienzo de abajo: el WebGL va encima y es transparente */
  function pintaHalo(t, cuerpo) {
    var w = t.w, h = t.h, cx = w / 2, cy = h / 2, R = radioDe(t);
    ctx.clearRect(0, 0, w, h);
    var halo = ctx.createRadialGradient(cx, cy, R * 0.9, cx, cy, R * 1.5);
    halo.addColorStop(0, cuerpo === 'marte' ? 'rgba(214,120,80,.20)' : 'rgba(180,205,225,.16)');
    halo.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2); ctx.fill();
  }

  function pintaGlobo3D(t, cuerpo) {
    var w = t.w, h = t.h, R = radioDe(t);
    var cam = t3.camara;
    cam.left = -w / 2; cam.right = w / 2; cam.top = h / 2; cam.bottom = -h / 2;
    /* la cámara TIENE que quedar fuera de la esfera: con la cámara dentro solo se ve el
       borde iluminado y el resto sale negro (fallo detectado en la primera prueba) */
    cam.near = R * 0.5; cam.far = R * 6;
    cam.position.z = R * 3;
    cam.updateProjectionMatrix();
    t3.pintador.setSize(w, h, false);
    t3.malla.scale.setScalar(R);
    /* el 1K son 249 KB entre los dos mapas; se sube de nivel solo si el globo se pinta
       grande de verdad (pantalla grande o mucho acercamiento) */
    var px = R * 2 * Math.min(window.devicePixelRatio || 1, 2);
    var tex = textura(cuerpo, px > 1100 ? 4 : px > 640 ? 2 : 1);
    if (t3.malla.material.map !== tex) {
      t3.malla.material.map = tex;
      t3.malla.material.needsUpdate = true;
    }
    /* misma orientación que proyecta(): el meridiano 0 al frente y el giro en el mismo sentido */
    t3.malla.rotation.y = -Math.PI / 2 + rot;
    t3.pintador.render(t3.escena, cam);
  }

  function puede3D() {
    if (t3.roto) return false;
    if (!t3.listo) {
      if (!window.THREE) { pedirThree(); return false; }
      if (!prepara3D()) { if (!t3.listo) return false; }
    }
    return true;
  }

  /* ---------- cielo profundo: por año de salida ---------- */
  var estrellas = null;
  function pintaCielo(t) {
    var w = t.w, h = t.h;
    ctx.clearRect(0, 0, w, h);
    if (!estrellas) {
      estrellas = [];
      var s = 777;
      function rnd() { s = (s * 48271) % 2147483647; return s / 2147483647; }
      for (var i = 0; i < 90; i++) estrellas.push({ x: rnd(), y: rnd(), r: rnd() * 1.3 + 0.3, a: 0.25 + rnd() * 0.6 });
    }
    estrellas.forEach(function (e) {
      ctx.beginPath();
      ctx.arc(e.x * w, e.y * h, e.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(220,235,255,' + e.a + ')';
      ctx.fill();
    });
    /* el Sol, a la izquierda */
    var sol = ctx.createRadialGradient(16, h * 0.86, 2, 16, h * 0.86, 54);
    sol.addColorStop(0, 'rgba(255,226,150,.95)');
    sol.addColorStop(0.35, 'rgba(255,180,80,.30)');
    sol.addColorStop(1, 'rgba(255,150,50,0)');
    ctx.fillStyle = sol;
    ctx.beginPath(); ctx.arc(16, h * 0.86, 54, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,235,190,.9)';
    ctx.font = '10px system-ui, sans-serif';
    ctx.fillText('Sol', 10, h - 6);
  }

  /* ---------- puntos ---------- */
  function colocar() {
    if (!capa) return;
    capa.innerHTML = '';
    bolitas = [];
    aparatos.forEach(function (a, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'mapa-pin' + (actual && a.id === actual.id ? ' activo' : '');
      var c = tipo();
      b.style.setProperty('--c', c === 'espacio' ? (a.color || '#63e0c8') : (PALETA[c] || '#63e0c8'));
      /* desfase del latido: el índice del aparato, para que no vayan todos a la vez */
      b.style.setProperty('--retardo', ((i % 5) * 0.52).toFixed(2) + 's');
      b.setAttribute('aria-label', 'Ir a ' + a.nombre);
      b.title = a.nombre;
      /* en el mapa manda el nombre corto: con varios objetos en el mismo sitio los
         nombres largos se pisaban entre ellos */
      b.innerHTML = '<span class="mapa-pin-punto"></span><span class="mapa-pin-etq">' +
                    (a.nombre_mapa || a.nombre) + '</span>';
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        /* acabas de desplazar el cielo: soltar encima de un pin no es elegirlo */
        if (Date.now() - ultimoArrastre < 300) return;
        if (actual && a.id === actual.id) return;
        if (alElegir) alElegir(a);
      });
      capa.appendChild(b);
      bolitas.push({ el: b, a: a, punto: b.querySelector('.mapa-pin-punto') });
    });
  }

  /* Con varios objetos juntos los nombres se pisaban unos a otros (los cuatro sitios del Apolo
     caben en un puño, y en el cielo profundo se alinean doce). Se coloca primero el nombre del
     objeto abierto y después los demás de delante hacia atrás; el que choca con uno ya puesto se
     queda sin nombre hasta que se pasa el ratón por encima. */
  function reparteEtiquetas(visibles, revelando) {
    var puestos = [];
    /* en el revelado el orden va por longitud: es fijo y no cambia con el giro, así los nombres
       no bailan de sitio en cada fotograma mientras el globo da vueltas */
    if (revelando) {
      visibles.sort(function (x, y) { return (x.lon || 0) - (y.lon || 0); });
    } else {
      visibles.sort(function (x, y) { return (y.activo ? 1 : 0) - (x.activo ? 1 : 0) || y.z - x.z; });
    }
    visibles
      .forEach(function (v, indice) {
        var ancho = anchosEtq.get(v.el);
        if (!ancho) {
          var etq = v.el.querySelector('.mapa-pin-etq');
          ancho = (etq && etq.offsetWidth) || 72;
          anchosEtq.set(v.el, ancho);
        }
        var dy = 0;
        /* En el revelado se enseñan todos los nombres y se reparten en tres alturas según su
           longitud: al ser un orden fijo, cada nombre se queda siempre en su sitio aunque el
           globo gire, y los que caen en el mismo punto se leen sin taparse. */
        if (revelando) {
          dy = ((indice % 3) - 1) * 18;
          ponerDesfase(v.el, dy);
          v.el.classList.remove('etq-tapada');
          return;
        }
        ponerDesfase(v.el, 0);
        var r = { x1: v.x - ancho / 2, x2: v.x + ancho / 2, y1: v.y - 9, y2: v.y + 9 };
        var choca = puestos.some(function (c) {
          return !(r.x2 < c.x1 || r.x1 > c.x2 || r.y2 < c.y1 || r.y1 > c.y2);
        });
        if (choca && !v.activo) { v.el.classList.add('etq-tapada'); }
        else { v.el.classList.remove('etq-tapada'); puestos.push(r); }
      });
  }

  /* el nombre se separa del punto sin mover el punto: el desfase va en la etiqueta */
  function ponerDesfase(el, dy) {
    var etq = el.querySelector('.mapa-pin-etq');
    if (etq) { etq.style.setProperty('--dy', dy + 'px'); }
  }

  function moverPins(t) {
    if (!bolitas.length) return;
    var revelando = Date.now() < revelarHasta;
    if (tipo() === 'espacio') {
      /* el marco del cielo es rectangular (sin disco que recorte), así que acercar separa los
         pines del centro y desplazar los lleva de un extremo a otro. El desplazamiento se
         limita a lo que sobresale del marco: nunca se pierden los extremos de la fila. */
      var topeX = (t.w / 2) * (zum - 1), topeY = (t.h / 2) * (zum - 1);
      desp.x = Math.max(-topeX, Math.min(topeX, desp.x));
      desp.y = Math.max(-topeY, Math.min(topeY, desp.y));
      var lista = aparatos.slice().sort(function (x, y) { return (x.anio || 0) - (y.anio || 0); });
      var n = lista.length;
      var enCielo = [];
      lista.forEach(function (a, i) {
        var b = bolitas.filter(function (x) { return x.a.id === a.id; })[0];
        if (!b) return;
        /* reparto en cuadrícula holgada con un desorden fijo (mismo dibujo siempre) que ocupa todo
           el marco: con 31 aparatos, tres filas dejaban 19 px entre pin y pin y se pisaban */
        var cols = Math.max(1, Math.round(Math.sqrt(n * (t.w / t.h) * 1.15)));
        var filas = Math.ceil(n / cols);
        var col = i % cols, fila = Math.floor(i / cols);
        var enFila = Math.min(cols, n - fila * cols);
        var pasoX = 0.88 / cols, pasoY = 0.82 / Math.max(1, filas);
        var jx = (((i * 37) % 7) / 6 - 0.5) * pasoX * 0.18;
        var jy = (((i * 53) % 7) / 6 - 0.5) * pasoY * 0.18;
        var fx = 0.06 + pasoX / 2 + col * pasoX + (cols - enFila) * pasoX / 2 + jx;
        var fy = 0.09 + pasoY / 2 + fila * pasoY + jy;
        var x = t.w / 2 + (fx * t.w - t.w / 2) * zum + desp.x;
        var y = t.h / 2 + (fy * t.h - t.h / 2) * zum + desp.y;
        b.el.style.left = x + 'px';
        b.el.style.top = y + 'px';
        b.el.style.opacity = '1';
        b.el.style.transform = 'translate(-50%,-50%)';
        enCielo.push({ el: b.el, x: x, y: y, z: 1 - i / (n + 1),
                       activo: b.el.classList.contains('activo') });
      });
      reparteEtiquetas(enCielo, revelando);
      return;
    }
    var g = { cx: t.w / 2, cy: t.h / 2, R: radioDe(t) };
    var visibles = [];
    bolitas.forEach(function (b) {
      var m = b.a.mapa;
      if (!m || typeof m.lat !== 'number') { b.el.style.opacity = '0'; b.el.style.pointerEvents = 'none'; if (b.punto) b.punto.style.pointerEvents = 'none'; return; }
      var p = proyecta(m.lat, m.lon, g.cx, g.cy, g.R);
      if (p.z <= 0.02) { b.el.style.opacity = '0'; b.el.style.pointerEvents = 'none'; if (b.punto) b.punto.style.pointerEvents = 'none'; return; }
      /* el marco es redondo y recorta: un punto pegado al borde se ve a medias y no se puede
         pulsar. Si cae fuera del disco, se esconde hasta que el giro lo traiga dentro. */
      var dist = Math.sqrt(Math.pow(p.x - g.cx, 2) + Math.pow(p.y - g.cy, 2));
      var radioMarco = (capa && capa.clientWidth ? capa.clientWidth : Math.min(t.w, t.h)) / 2;
      if (dist > radioMarco - 9) { b.el.style.opacity = '0'; b.el.style.pointerEvents = 'none'; if (b.punto) b.punto.style.pointerEvents = 'none'; return; }
      b.el.style.opacity = String(0.55 + 0.45 * p.z);
      /* la caja del botón no recibe clics (el nombre es ancho y tapaba puntos vecinos): solo el punto */
      b.el.style.pointerEvents = 'none';
      if (b.punto) b.punto.style.pointerEvents = 'auto';
      b.el.style.left = p.x + 'px';
      b.el.style.top = p.y + 'px';
      /* cerca del borde derecho, el nombre va hacia dentro: si no, se sale del marco.
         el punto sigue clavado en su coordenada: con el nombre a la izquierda el ancla pasa a ser
         el borde derecho de la caja, y eso se compensa en el translate. */
      b.el.classList.toggle('etq-izquierda', p.x > t.w * 0.62);
      b.el.style.transform = 'translate(' + (p.x > t.w * 0.62 ? '-100%' : '-50%') + ',-50%) scale(' + (0.8 + 0.25 * p.z) + ')';
      /* El nombre solo se enciende cuando el giro trae el punto al centro de la cara visible.
         Con ocho o diez objetos en la misma zona, los nombres a la vez eran una maraña. */
      var v = VENTANA[tipo()] || VENTANA.luna;
      var lo = (b.a.mapa.lon * Math.PI / 180) + rot;
      lo = Math.atan2(Math.sin(lo), Math.cos(lo));
      b.el.classList.toggle('etq-cerca', p.z > 0 && lo >= -v.antes && lo <= v.despues);
      visibles.push({ el: b.el, x: p.x, y: p.y, z: p.z, lon: b.a.mapa.lon,
                      activo: b.el.classList.contains('activo') });
    });
    reparteEtiquetas(visibles, revelando);
  }

  function dibujar() {
    if (!ctx || !lienzo) return;
    var t = tamano();
    var cuerpo = tipo();
    if (cuerpo === 'espacio') {
      pintaCielo(t);
      if (globo) globo.style.display = 'none';
    } else if (puede3D()) {
      pintaHalo(t, cuerpo);
      if (globo) globo.style.display = '';
      pintaGlobo3D(t, cuerpo);
    } else {
      pintaGlobo(t, cuerpo);
      if (globo) globo.style.display = 'none';
    }
    moverPins(t);
  }

  function bucle() {
    if (!girando || quieto) return;
    if (tipo() !== 'espacio' && !arrastrando) { rot += 0.0016; dibujar(); }
  }

  function pintar() {
    crear();
    if (!caja) return;
    if (!aparatos.length) { caja.style.display = 'none'; return; }
    caja.style.display = '';
    var c = tipo();
    caja.classList.toggle('es-espacio', c === 'espacio');
    caja.classList.toggle('cuerpo-luna', c === 'luna');
    caja.classList.toggle('cuerpo-marte', c === 'marte');
    if (titulo) {
      titulo.textContent = c === 'luna' ? (T('mapa.luna') || 'El mapa de la Luna')
        : c === 'marte' ? (T('mapa.marte') || 'El mapa de Marte') : (T('mapa.espacio') || 'Otros destinos');
    }
    var pie = document.getElementById('mapa-pie');
    if (pie) {
      pie.textContent = c === 'espacio'
        ? (T('mapa.pie.espacio') || 'Ordenados por año de salida. Toca un punto para acercarte.')
        : (T('mapa.pie') || 'Toca un punto para acercarte a otro aparato. Arrastra para girar.');
    }
    /* al cambiar de cuerpo (Luna, Marte, cielo) el zoom vuelve a 1; al saltar de un aparato
       a otro del mismo cuerpo se conserva, que es cuando hace falta para separar los pines */
    if (c !== cuerpoAnterior) { zum = 1; desp.x = 0; desp.y = 0; cuerpoAnterior = c; }
    var capaZum = caja.querySelector('.mapa-zum');
    if (capaZum) {
      capaZum.hidden = false;
      capaZum.classList.toggle('con-zum', zum > 1.01);
    }
    var credito = document.getElementById('mapa-credito');
    if (credito) {
      credito.textContent = c === 'luna' ? T('mapa.credito.luna')
        : c === 'marte' ? T('mapa.credito.marte') : '';
      credito.hidden = !credito.textContent;
    }
    colocar();
    /* cada vez que se abre el mapa se enseñan todos los nombres unos segundos; después
       se apagan y vuelve el turno de los que pasan por el centro */
    revelarHasta = Date.now() + REVELADO;
    caja.classList.add('revelando');
    dibujar();
    if (relojRevelado) { clearTimeout(relojRevelado); }
    relojRevelado = setTimeout(function () {
      revelarHasta = 0;
      if (caja) { caja.classList.remove('revelando'); }
      dibujar();
    }, REVELADO);
  }

  function ponZum(nuevo) {
    /* el cielo admite más recorrido que el globo: allí los doce objetos van en fila y hay que
       separarlos de verdad para acertar con el dedo */
    var tope = tipo() === 'espacio' ? ZUM_ESPACIO : ZUM_MAX;
    var z = Math.max(1, Math.min(tope, nuevo));
    if (Math.abs(z - zum) < 0.001) return;
    zum = z;
    if (z <= 1.01) { desp.x = 0; desp.y = 0; }
    var cajaZum = caja && caja.querySelector('.mapa-zum');
    if (cajaZum) cajaZum.classList.toggle('con-zum', zum > 1.01);
    dibujar();
  }

  function conectarArrastre() {
    if (!lienzo) return;
    lienzo.style.touchAction = 'pan-y';
    lienzo.addEventListener('pointerdown', function (ev) {
      if (tipo() === 'espacio') {
        /* en el cielo el arrastre desplaza la fila de pines (solo tiene sentido acercado) */
        if (zum <= 1.01) return;
        arrastrando = true;
        xInicial = ev.clientX; yInicial = ev.clientY;
        despInicial.x = desp.x; despInicial.y = desp.y;
        return;
      }
      arrastrando = true; xInicial = ev.clientX; rotInicial = rot;
    });
    window.addEventListener('pointermove', function (ev) {
      if (!arrastrando) return;
      if (tipo() === 'espacio') {
        var dx = ev.clientX - xInicial, dy = ev.clientY - yInicial;
        if (Math.abs(dx) > 5 || Math.abs(dy) > 5) ultimoArrastre = Date.now();
        desp.x = despInicial.x + dx;
        desp.y = despInicial.y + dy;
        dibujar();
        return;
      }
      rot = rotInicial + (ev.clientX - xInicial) * 0.006;
      dibujar();
    });
    window.addEventListener('pointerup', function () { arrastrando = false; });
    lienzo.addEventListener('pointerleave', function () { arrastrando = false; });
    /* rueda del ratón: acerca sin mover la página */
    lienzo.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      ponZum(zum * (ev.deltaY < 0 ? 1.15 : 1 / 1.15));
    }, { passive: false });
    /* dos dedos separándose acercan (el gesto va sobre el lienzo, que es el que recibe) */
    var dedos = {}, distPellizco = 0, zumPellizco = 1;
    lienzo.addEventListener('pointerdown', function (ev) {
      if (ev.pointerType === 'mouse') return;
      dedos[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      var ids = Object.keys(dedos);
      if (ids.length === 2) {
        var a = dedos[ids[0]], b = dedos[ids[1]];
        distPellizco = Math.hypot(a.x - b.x, a.y - b.y);
        zumPellizco = zum;
        arrastrando = false;
      }
    });
    lienzo.addEventListener('pointermove', function (ev) {
      if (!dedos[ev.pointerId]) return;
      dedos[ev.pointerId] = { x: ev.clientX, y: ev.clientY };
      var ids = Object.keys(dedos);
      if (ids.length !== 2 || !distPellizco) return;
      var a = dedos[ids[0]], b = dedos[ids[1]];
      var d = Math.hypot(a.x - b.x, a.y - b.y);
      ponZum(zumPellizco * (d / distPellizco));
    });
    function sueltaDedo(ev) {
      delete dedos[ev.pointerId];
      if (Object.keys(dedos).length < 2) { distPellizco = 0; }
    }
    window.addEventListener('pointerup', sueltaDedo);
    window.addEventListener('pointercancel', sueltaDedo);
  }

  /* el mismo mapa sirve en la ficha del objeto y en la ventana del crucero:
     se mueve el nodo a donde toque en vez de duplicarlo */
  function ancorar(destino) {
    crear();
    if (!caja) return;
    if (destino) {
      caja.classList.add('en-ventana');
      if (caja.parentNode !== destino) destino.appendChild(caja);
    } else {
      caja.classList.remove('en-ventana');
      var marco = document.getElementById('col-mapa');
      if (marco && caja.parentNode !== marco) marco.appendChild(caja);
    }
    pintar();
  }

  /* giro inicial: se centra la cara visible en la media de las longitudes,
     para que los puntos del destino se vean sin tener que arrastrar */
  function centrar() {
    var con = aparatos.filter(function (a) { return a.mapa && typeof a.mapa.lat === 'number'; });
    if (!con.length) return;
    var sx = 0, sy = 0;
    con.forEach(function (a) {
      var lo = a.mapa.lon * Math.PI / 180;
      sx += Math.cos(lo); sy += Math.sin(lo);
    });
    var media = Math.atan2(sy / con.length, sx / con.length);
    rot = -media;
  }

  function activar(lista, a, cb) {
    aparatos = (lista || []).filter(Boolean);
    actual = a || null;
    alElegir = cb || null;
    if (tipo() !== 'espacio') centrar();
    pintar();
  }

  /* giro continuo suave */
  setInterval(bucle, 40);

  window.MapaObjetos = { activar: activar, ancorar: ancorar, pintar: pintar };
})();
