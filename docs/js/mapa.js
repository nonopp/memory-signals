/* Memory Signals — mapa del destino.
   A la izquierda del objeto: un globo (Luna o Marte) con un punto por aparato,
   o un cielo estrellado con los objetos del espacio profundo ordenados por año.
   Los puntos son botones: al pulsarlos se salta a ese objeto.
   Las coordenadas salen de las fichas; si un aparato no tiene, no se pone punto. */
(function () {
  'use strict';

  var caja, lienzo, ctx, capa, titulo;
  var aparatos = [], actual = null, alElegir = null;
  var rot = 0.6, girando = true, arrastrando = false, xInicial = 0, rotInicial = 0;
  var bolitas = [];
  /* textos de la interfaz en el idioma elegido (los pone js/idioma.js) */
  function T(clave) {
    return (window.MS_Idioma && window.MS_Idioma.t) ? window.MS_Idioma.t(clave) : '';
  }
  var quieto = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function crear() {
    if (caja) return;
    caja = document.createElement('aside');
    caja.className = 'mapa-destino';
    caja.id = 'mapa-destino';
    caja.innerHTML =
      '<h2 class="mapa-titulo" id="mapa-titulo">' + (T('mapa.titulo') || 'Dónde estamos') + '</h2>' +
      '<div class="mapa-marco">' +
        '<canvas id="mapa-lienzo" aria-hidden="true"></canvas>' +
        '<div class="mapa-pins" id="mapa-pins"></div>' +
      '</div>' +
      '<p class="mapa-pie" id="mapa-pie">Toca un punto para acercarte a otro aparato.</p>';
    var marco = document.getElementById('col-mapa');
    if (marco) marco.appendChild(caja);
    lienzo = document.getElementById('mapa-lienzo');
    capa = document.getElementById('mapa-pins');
    titulo = document.getElementById('mapa-titulo');
    ctx = lienzo && lienzo.getContext('2d');
    conectarArrastre();
    window.addEventListener('resize', pintar);
  }

  function tipo() {
    var conMapa = aparatos.filter(function (a) { return a.mapa; })[0];
    return conMapa ? conMapa.mapa.tipo : 'espacio';
  }

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
    var w = t.w, h = t.h, cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;
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
      b.style.setProperty('--c', a.color || '#63e0c8');
      /* desfase del latido: el índice del aparato, para que no vayan todos a la vez */
      b.style.setProperty('--retardo', ((i % 5) * 0.52).toFixed(2) + 's');
      b.setAttribute('aria-label', 'Ir a ' + a.nombre);
      b.title = a.nombre;
      b.innerHTML = '<span class="mapa-pin-punto"></span><span class="mapa-pin-etq">' + a.nombre + '</span>';
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        if (actual && a.id === actual.id) return;
        if (alElegir) alElegir(a);
      });
      capa.appendChild(b);
      bolitas.push({ el: b, a: a });
    });
  }

  function moverPins(t) {
    if (!bolitas.length) return;
    if (tipo() === 'espacio') {
      var lista = aparatos.slice().sort(function (x, y) { return (x.anio || 0) - (y.anio || 0); });
      var n = lista.length;
      lista.forEach(function (a, i) {
        var b = bolitas.filter(function (x) { return x.a.id === a.id; })[0];
        if (!b) return;
        var fx = 0.22 + (n === 1 ? 0.2 : (i / (n - 1)) * 0.66);
        var fy = 0.74 - (n === 1 ? 0 : (i / (n - 1)) * 0.52);
        b.el.style.left = (fx * t.w) + 'px';
        b.el.style.top = (fy * t.h) + 'px';
        b.el.style.opacity = '1';
        b.el.style.transform = 'translate(-50%,-50%)';
      });
      return;
    }
    var g = { cx: t.w / 2, cy: t.h / 2, R: Math.min(t.w, t.h) * 0.42 };
    bolitas.forEach(function (b) {
      var m = b.a.mapa;
      if (!m || typeof m.lat !== 'number') { b.el.style.opacity = '0'; b.el.style.pointerEvents = 'none'; return; }
      var p = proyecta(m.lat, m.lon, g.cx, g.cy, g.R);
      if (p.z <= 0.02) { b.el.style.opacity = '0'; b.el.style.pointerEvents = 'none'; return; }
      /* el marco es redondo y recorta: un punto pegado al borde se ve a medias y no se puede
         pulsar. Si cae fuera del disco, se esconde hasta que el giro lo traiga dentro. */
      var dist = Math.sqrt(Math.pow(p.x - g.cx, 2) + Math.pow(p.y - g.cy, 2));
      var radioMarco = (capa && capa.clientWidth ? capa.clientWidth : Math.min(t.w, t.h)) / 2;
      if (dist > radioMarco - 9) { b.el.style.opacity = '0'; b.el.style.pointerEvents = 'none'; return; }
      b.el.style.opacity = String(0.55 + 0.45 * p.z);
      b.el.style.pointerEvents = 'auto';
      b.el.style.left = p.x + 'px';
      b.el.style.top = p.y + 'px';
      /* cerca del borde derecho, el nombre va hacia dentro: si no, se sale del marco.
         el punto sigue clavado en su coordenada: con el nombre a la izquierda el ancla pasa a ser
         el borde derecho de la caja, y eso se compensa en el translate. */
      b.el.classList.toggle('etq-izquierda', p.x > t.w * 0.62);
      b.el.style.transform = 'translate(' + (p.x > t.w * 0.62 ? '-100%' : '-50%') + ',-50%) scale(' + (0.8 + 0.25 * p.z) + ')';
    });
  }

  function dibujar() {
    if (!ctx || !lienzo) return;
    var t = tamano();
    var cuerpo = tipo();
    if (cuerpo === 'espacio') pintaCielo(t); else pintaGlobo(t, cuerpo);
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
    if (titulo) {
      titulo.textContent = c === 'luna' ? (T('mapa.luna') || 'El mapa de la Luna')
        : c === 'marte' ? (T('mapa.marte') || 'El mapa de Marte') : (T('mapa.espacio') || 'Hacia fuera del sistema solar');
    }
    var pie = document.getElementById('mapa-pie');
    if (pie) {
      pie.textContent = c === 'espacio'
        ? (T('mapa.pie.espacio') || 'Ordenados por año de salida. Toca un punto para acercarte.')
        : (T('mapa.pie') || 'Toca un punto para acercarte a otro aparato. Arrastra para girar.');
    }
    colocar();
    dibujar();
  }

  function conectarArrastre() {
    if (!lienzo) return;
    lienzo.style.touchAction = 'pan-y';
    lienzo.addEventListener('pointerdown', function (ev) {
      if (tipo() === 'espacio') return;
      arrastrando = true; xInicial = ev.clientX; rotInicial = rot;
    });
    window.addEventListener('pointermove', function (ev) {
      if (!arrastrando) return;
      rot = rotInicial + (ev.clientX - xInicial) * 0.006;
      dibujar();
    });
    window.addEventListener('pointerup', function () { arrastrando = false; });
    lienzo.addEventListener('pointerleave', function () { arrastrando = false; });
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
