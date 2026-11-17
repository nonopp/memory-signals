/* Memory Signals — texto contextual del botón de la voz.
   Al pasar el ratón (o al llegar con el tabulador) explica qué hace el altavoz.
   Se redibuja al cambiar de idioma, así que el texto llega siempre traducido.
   En pantalla táctil, donde no hay ratón, el toque enciende o apaga la voz y deja
   la explicación cuatro segundos a la vista. */
(function () {
  'use strict';

  var btn = null, caja = null, estadoEl = null, temporizador = null;

  function T(clave) {
    return (window.MS_Idioma && window.MS_Idioma.t) ? window.MS_Idioma.t(clave) : '';
  }

  function pintaEstado() {
    if (!estadoEl) return;
    var encendida = !!(window.MS_Voz && window.MS_Voz.activa && window.MS_Voz.activa());
    estadoEl.textContent = T(encendida ? 'voz.ayuda.estado.on' : 'voz.ayuda.estado.off');
    estadoEl.classList.toggle('encendida', encendida);
  }

  function abrir(conTiempo) {
    if (!caja) return;
    pintaEstado();
    caja.hidden = false;
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
    if (conTiempo) temporizador = setTimeout(cerrar, 4000);
  }

  function cerrar() {
    if (!caja) return;
    caja.hidden = true;
    if (temporizador) { clearTimeout(temporizador); temporizador = null; }
  }

  function conectar() {
    btn = document.getElementById('btn-voz');
    caja = document.getElementById('ayuda-voz');
    estadoEl = document.getElementById('ayuda-voz-estado');
    if (!btn || !caja) return;

    /* ratón: entra y sale */
    btn.addEventListener('mouseenter', function () { abrir(false); });
    btn.addEventListener('mouseleave', function () { if (!temporizador) cerrar(); });
    /* tabulador: se ve al llegar y se va al salir */
    btn.addEventListener('focus', function () { abrir(false); });
    btn.addEventListener('blur', function () { if (!temporizador) cerrar(); });
    /* el toque no tiene ratón: se deja unos segundos. El clic sigue encendiendo o apagando la voz. */
    btn.addEventListener('click', function (ev) {
      if (ev.pointerType === 'touch' || (window.matchMedia && window.matchMedia('(hover: none)').matches)) {
        abrir(true);
      }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') cerrar();
    });
    /* si el texto está abierto y se enciende o apaga la voz, cambia la última línea */
    if (window.MS_Voz && window.MS_Voz.alCambiar) {
      window.MS_Voz.alCambiar(function () { if (!caja.hidden) pintaEstado(); });
    }
    /* al cambiar de idioma, la línea de estado se reescribe (el resto lo traduce idioma.js) */
    document.addEventListener('ms:idioma', function () { if (!caja.hidden) pintaEstado(); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', conectar);
  } else {
    conectar();
  }
})();
