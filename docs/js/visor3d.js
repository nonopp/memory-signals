/* Memory Signals — visor 3D del objeto.
   Usa <model-viewer> y los modelos oficiales de NASA 3D Resources.
   Si un aparato no tiene modelo publicado por la NASA, lo dice en vez de inventarlo. */
(function () {
  'use strict';

  /* texto de interfaz en el idioma activo */
  function T(clave, datos) {
    if (window.MS_Idioma && window.MS_Idioma.t) return window.MS_Idioma.t(clave, datos);
    return '';
  }

  /* nombre del modelo o de la foto en el idioma activo: si solo hay uno, se usa ese */
  function nombreModelo(e) {
    if (!e) return '';
    var l = (window.MS_Idioma && window.MS_Idioma.actual) ? window.MS_Idioma.actual() : 'es';
    return e['nombre_modelo_' + l] || e.nombre_modelo || '';
  }

  var mapa = null;
  var girando = true;

  var mvListo = null;
  function cargarModelViewer() {
    if (mvListo) return mvListo;
    mvListo = new Promise(function (resolver) {
      var s = document.createElement('script');
      s.type = 'module';
      s.src = 'js/model-viewer.min.js';
      s.onload = function () { resolver(true); };
      s.onerror = function () { resolver(false); };
      document.head.appendChild(s);
    });
    return mvListo;
  }

  function cargarMapa() {
    if (mapa) return Promise.resolve(mapa);
    return fetch('datos/modelos.json?v=' + (window.__MSV || ''))
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { mapa = j; return j; })
      .catch(function () { mapa = {}; return mapa; });
  }

  /* ---------- puntos interactivos sobre el modelo ---------- */
  var ficha = null;
  function cerrarFicha() {
    if (!ficha) ficha = document.getElementById('punto-ficha');
    if (ficha) ficha.hidden = true;
  }
  function abrirFicha(p) {
    if (!ficha) ficha = document.getElementById('punto-ficha');
    if (!ficha) return;
    ficha.querySelector('.punto-ficha-titulo').textContent = p.titulo;
    ficha.querySelector('.punto-ficha-texto').textContent = p.texto;
    ficha.hidden = false;
  }
  /* Los puntos viven en el propio modelo (slots de model-viewer): la librería los pega a una
     coordenada en 3D y los trae y los lleva con el giro. Solo se ponen si el objeto los trae
     en datos/contenido.json; si no, el visor se queda como estaba. */
  function ponerPuntos(mv, a) {
    Array.prototype.slice.call(mv.querySelectorAll('[slot^="hotspot"]')).forEach(function (n) {
      n.parentNode.removeChild(n);
    });
    cerrarFicha();
    var lista = (a && a.puntos3d) || [];
    lista.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'punto-3d';
      b.setAttribute('slot', 'hotspot-' + i);
      b.setAttribute('data-position', p.pos.join(' '));
      if (p.normal) { b.setAttribute('data-normal', p.normal.join(' ')); }
      b.setAttribute('aria-label', p.titulo + '. ' + p.texto);
      b.title = p.titulo;
      var gota = document.createElement('span');
      gota.className = 'punto-3d-gota';
      gota.setAttribute('aria-hidden', 'true');
      b.appendChild(gota);
      /* el título de la pieza, que se enciende al pasar por el centro y al pasar el ratón */
      var etq = document.createElement('span');
      etq.className = 'punto-3d-etq';
      etq.setAttribute('aria-hidden', 'true');
      etq.textContent = p.titulo;
      b.appendChild(etq);
      b.addEventListener('click', function (ev) { ev.stopPropagation(); abrirFicha(p); });
      mv.appendChild(b);
    });
    if (lista.length) { bucleCentro(); }
  }

  /* ---------- el título del punto que pasa por el centro ----------
     El modelo gira solo, así que cada poco se mira en qué punto de la pantalla está cada
     punto: el que entra en la banda del 10 % central enciende su título, los demás lo apagan.
     Se enciende uno solo —el más centrado—, como en los mapas, para que no se amontonen. */
  var vigilando = false;
  function vigilarCentro() {
    var mv = document.getElementById('mv-objeto');
    if (!mv) { return; }
    var puntos = mv.querySelectorAll('.punto-3d');
    if (!puntos.length) { return; }
    var caja = mv.getBoundingClientRect();
    if (!caja.width) { return; }
    var centro = caja.left + caja.width / 2;
    var banda = caja.width * 0.10;
    var mejor = null;
    var menor = Infinity;
    for (var i = 0; i < puntos.length; i++) {
      var r = puntos[i].getBoundingClientRect();
      if (!r.width && !r.height) { continue; }          // punto escondido tras el modelo
      var x = r.left + r.width / 2;
      var d = Math.abs(x - centro);
      if (d <= banda && d < menor) { menor = d; mejor = puntos[i]; }
    }
    for (var j = 0; j < puntos.length; j++) {
      puntos[j].classList.toggle('cerca', puntos[j] === mejor);
    }
  }
  function bucleCentro() {
    if (vigilando) { return; }
    vigilando = true;
    var ultima = 0;
    function paso() {
      var pantalla = document.getElementById('p-objeto');
      if (!pantalla || !pantalla.classList.contains('activa')) {
        vigilando = false;
        return;                                        // fuera de la ficha: se para el bucle
      }
      var ahora = Date.now();
      if (ahora - ultima > 90) { ultima = ahora; vigilarCentro(); }
      requestAnimationFrame(paso);
    }
    requestAnimationFrame(paso);
  }

  function pintar(a) {
    var mv = document.getElementById('mv-objeto');
    var sin = document.getElementById('visor-sinmodelo');
    var cred = document.getElementById('visor-credito');
    if (!mv || !sin) return;

    Promise.all([cargarMapa(), cargarModelViewer()]).then(function (r) {
      var m = r[0];
      var e = m[a.id];
      var foto = document.getElementById('visor-foto');
      if (!e || !e.glb) {
        try { mv.removeAttribute('src'); } catch (err) {}
        mv.style.display = 'none';
        sin.hidden = false;
        cred.style.display = 'none';
        cred.textContent = '';
        // si la NASA no tiene modelo 3D pero sí fotografía oficial, se enseña la foto
        if (foto) {
          if (e && e.foto) {
            foto.src = e.foto;
            foto.alt = nombreModelo(e) ? (nombreModelo(e) + ' · ' + a.nombre) : T('visor.fotoAlt', { objeto: a.nombre });
            foto.hidden = false;
            sin.querySelector('.sin-modelo-texto').textContent = e.nota || '';
            sin.querySelector('.orbe').style.display = 'none';
            cred.style.display = '';
            cred.textContent = e.credito || T('visor.fotoCredito');
          } else {
            foto.hidden = true; foto.removeAttribute('src');
            sin.querySelector('.orbe').style.display = '';
            sin.querySelector('.sin-modelo-texto').textContent = T('visor.sinModelo');
          }
        }
        var orbe = sin.querySelector('.orbe');
        if (orbe) {
          orbe.style.background = 'radial-gradient(circle at 34% 30%, #fff, ' + (a.color || '#63e0c8') + ' 48%, #12161f 100%)';
        }
        return;
      }
      mv.style.display = 'block';
      sin.hidden = true;
      if (foto) { foto.hidden = true; }
      cred.style.display = '';
      cred.textContent = T('visor.modeloCredito') + ' 3D Resources' + (nombreModelo(e) ? ' · ' + nombreModelo(e) : '');
      mv.setAttribute('alt', T('visor.modeloAlt', { objeto: a.nombre }));
      mv.setAttribute('data-cuerpo', String(a.cuerpo || '').toLowerCase());
      if (mv.getAttribute('src') !== e.glb) mv.setAttribute('src', e.glb);
      try { mv.autoRotate = girando; } catch (err) {}
      ponerPuntos(mv, a);
    });
  }

  function conectarBoton() {
    var b = document.getElementById('visor-girar');
    var mv = document.getElementById('mv-objeto');
    if (b && mv) {
      b.addEventListener('click', function () {
        girando = !girando;
        b.setAttribute('aria-pressed', girando ? 'true' : 'false');
        b.style.opacity = girando ? '1' : '.55';
        try { mv.autoRotate = girando; } catch (err) {}
      });
    }
    /* la ficha del punto se cierra con su aspa o con Escape */
    var cerrar = document.getElementById('punto-ficha-cerrar');
    if (cerrar) { cerrar.addEventListener('click', cerrarFicha); }
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') cerrarFicha();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', conectarBoton);
  } else {
    conectarBoton();
  }

  window.Visor3D = { pintar: pintar };
})();
