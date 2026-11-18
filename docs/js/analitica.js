/* Matomo propio, alojado en analytics.gesemweb.es — y sin cookies.
   Solo cuenta la visita: página, idioma, país aproximado, qué aparato se ha abierto y el
   tiempo. No pone ni lee cookies en el navegador (`disableCookies`), respeta la cabecera
   Do Not Track y no guarda nada que permita identificar a la persona. Por eso no hay banner
   de aceptación: no se recogen cookies. Lo que se envía está contado en privacidad.html. */
(function () {
  'use strict';
  if (location.protocol.indexOf('http') !== 0) { return; }

  /* ojo: Matomo sustituye window._paq al cargarse, así que aquí siempre se usa
     window._paq y no una copia local, o los avisos posteriores se pierden */
  window._paq = window._paq || [];
  var _paq = window._paq;
  _paq.push(['disableCookies']);        /* ninguna cookie, ni de sesión */
  _paq.push(['setDoNotTrack', true]);   /* si el navegador pide no ser seguido, no se cuenta */
  _paq.push(['setTrackerUrl', 'https://analytics.gesemweb.es/matomo.php']);
  _paq.push(['setSiteId', '3']);        /* Memory Signals · NASA Space Apps 2026 */
  _paq.push(['trackPageView']);
  _paq.push(['enableLinkTracking']);

  var primero = document.getElementsByTagName('script')[0];
  var etiqueta = document.createElement('script');
  etiqueta.async = true;
  etiqueta.src = 'https://analytics.gesemweb.es/matomo.js';
  primero.parentNode.insertBefore(etiqueta, primero);

  /* la app es de una sola página: cuando se abre un aparato se cuenta como página vista,
     con su nombre en la dirección, para saber qué fichas se miran */
  document.addEventListener('ms:aparato', function (ev) {
    var d = (ev && ev.detail) || {};
    if (!d.id || !window._paq) { return; }
    window._paq.push(['setCustomUrl', location.origin + location.pathname + '#objeto-' + d.id]);
    window._paq.push(['setDocumentTitle', (d.nombre || d.id) + ' · Memory Signals']);
    window._paq.push(['trackPageView']);
    window._paq.push(['setCustomUrl', location.origin + location.pathname]);
  });
})();
