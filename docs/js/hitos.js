/* Memory Signals — carrusel de hitos del objeto.
   Tres tarjetas por aparato, con forma de bocadillo: habla el aparato.
   Cinco segundos por tarjeta. Se para al pasar el ratón o al llegar con el tabulador,
   se desliza con el dedo y no avanza sola si el sistema pide reducir movimiento. */
(function () {
  'use strict';

  var MS_HITO = 5000;
  var reloj = null;
  var actual = 0;
  var tarjetas = [];
  var pausado = false;
  var nodo = null;

  function reduceMovimiento() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function pintarPuntos() {
    var puntos = document.getElementById('hitos-puntos');
    if (!puntos) return;
    puntos.innerHTML = '';
    tarjetas.forEach(function (_, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hito-punto' + (i === actual ? ' activo' : '');
      b.setAttribute('aria-label', 'Hito ' + (i + 1) + ' de ' + tarjetas.length);
      b.setAttribute('aria-current', i === actual ? 'true' : 'false');
      b.addEventListener('click', function () { ir(i, true); });
      puntos.appendChild(b);
    });
  }

  function ensenar(i) {
    tarjetas.forEach(function (t, j) {
      var activa = j === i;
      t.classList.toggle('activa', activa);
      t.setAttribute('aria-hidden', activa ? 'false' : 'true');
    });
    pintarPuntos();
  }

  function ir(i, manual) {
    if (!tarjetas.length) return;
    actual = (i + tarjetas.length) % tarjetas.length;
    ensenar(actual);
    if (manual) arrancarReloj();
  }

  function arrancarReloj() {
    parar();
    if (reduceMovimiento() || tarjetas.length < 2) return;
    reloj = window.setInterval(function () {
      if (pausado) return;
      actual = (actual + 1) % tarjetas.length;
      ensenar(actual);
    }, MS_HITO);
  }

  function parar() {
    if (reloj) { window.clearInterval(reloj); reloj = null; }
  }

  function conectar() {
    nodo = document.getElementById('hitos-objeto');
    if (!nodo || nodo.dataset.listo === '1') return;
    nodo.dataset.listo = '1';

    var prev = document.getElementById('hitos-prev');
    var next = document.getElementById('hitos-next');
    if (prev) prev.addEventListener('click', function () { ir(actual - 1, true); });
    if (next) next.addEventListener('click', function () { ir(actual + 1, true); });

    nodo.addEventListener('mouseenter', function () { pausado = true; });
    nodo.addEventListener('mouseleave', function () { pausado = false; });
    nodo.addEventListener('focusin', function () { pausado = true; });
    nodo.addEventListener('focusout', function () { pausado = false; });

    nodo.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowLeft') { ir(actual - 1, true); }
      else if (ev.key === 'ArrowRight') { ir(actual + 1, true); }
    });

    /* dedo: se desliza en horizontal */
    var x0 = null;
    nodo.addEventListener('touchstart', function (ev) {
      if (ev.touches.length === 1) x0 = ev.touches[0].clientX;
    }, { passive: true });
    nodo.addEventListener('touchend', function (ev) {
      if (x0 === null) return;
      var x1 = (ev.changedTouches[0] || {}).clientX;
      if (typeof x1 === 'number') {
        var d = x1 - x0;
        if (Math.abs(d) > 40) ir(actual + (d < 0 ? 1 : -1), true);
      }
      x0 = null;
    });
  }

  function pintar(a) {
    conectar();
    var caja = document.getElementById('hitos-pista');
    if (!caja) return;
    parar();
    caja.innerHTML = '';
    tarjetas = [];
    actual = 0;
    pausado = false;

    var lista = (a && a.hitos) ? a.hitos : [];
    if (!lista.length) {
      nodo.hidden = true;
      return;
    }
    nodo.hidden = false;

    lista.forEach(function (h, i) {
      var t = document.createElement('article');
      t.className = 'hito' + (i === 0 ? ' activa' : '');
      t.setAttribute('aria-hidden', i === 0 ? 'false' : 'true');
      t.setAttribute('role', 'group');
      t.setAttribute('aria-label', 'Hito ' + (i + 1) + ' de ' + lista.length);
      if (h.fuente) t.title = 'Fuente: ' + h.fuente;

      var tit = document.createElement('h3');
      tit.className = 'hito-titulo';
      tit.textContent = h.titulo || '';
      var txt = document.createElement('p');
      txt.className = 'hito-texto';
      txt.textContent = h.texto || '';
      t.appendChild(tit);
      t.appendChild(txt);
      caja.appendChild(t);
      tarjetas.push(t);
    });

    pintarPuntos();
    arrancarReloj();
  }

  window.Hitos = { pintar: pintar, parar: parar };
})();
