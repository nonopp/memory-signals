/* Memory Signals — visor 3D del objeto.
   Usa <model-viewer> y los modelos oficiales de NASA 3D Resources.
   Si un aparato no tiene modelo publicado por la NASA, lo dice en vez de inventarlo. */
(function () {
  'use strict';

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
            foto.alt = (e.nombre_modelo || 'Fotografía oficial') + ' de ' + a.nombre;
            foto.hidden = false;
            sin.querySelector('.sin-modelo-texto').textContent = e.nota || '';
            sin.querySelector('.orbe').style.display = 'none';
            cred.style.display = '';
            cred.textContent = e.credito || 'Fotografía: NASA';
          } else {
            foto.hidden = true; foto.removeAttribute('src');
            sin.querySelector('.orbe').style.display = '';
            sin.querySelector('.sin-modelo-texto').textContent = 'Sin modelo 3D oficial de la NASA para este aparato.';
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
      cred.textContent = (m._credito || 'Modelo 3D: NASA') + ' · ' + e.nombre_modelo;
      mv.setAttribute('alt', 'Modelo 3D interactivo de ' + a.nombre);
      if (mv.getAttribute('src') !== e.glb) mv.setAttribute('src', e.glb);
      try { mv.autoRotate = girando; } catch (err) {}
    });
  }

  function conectarBoton() {
    var b = document.getElementById('visor-girar');
    var mv = document.getElementById('mv-objeto');
    if (!b || !mv) return;
    b.addEventListener('click', function () {
      girando = !girando;
      b.setAttribute('aria-pressed', girando ? 'true' : 'false');
      b.style.opacity = girando ? '1' : '.55';
      try { mv.autoRotate = girando; } catch (err) {}
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', conectarBoton);
  } else {
    conectarBoton();
  }

  window.Visor3D = { pintar: pintar };
})();
