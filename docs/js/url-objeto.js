/* Memory Signals — una dirección por objeto.
   ?objeto=<id> abre la ficha directamente; al navegar, la barra de direcciones se actualiza
   (history.replaceState, sin recargar); el título, la descripción y las metas sociales pasan a
   hablar del objeto y no de la portada, y el botón Compartir copia ese enlace.
   No toca el motor: escucha el aviso `ms:aparato` que ya emite al pintar la ficha y mira la
   clase `viendo-objeto` del body para saber cuándo se sale. */
(function () {
  'use strict';

  var SITIO = 'https://nasa.gesemweb.es/app/';
  var tituloBase = document.title;
  var metaBase = (document.querySelector('meta[name="description"]') || {}).content || '';
  var actual = null;          /* id del objeto en pantalla */
  var aviso = null;

  function T(clave, vals) {
    return (window.MS_Idioma && window.MS_Idioma.t) ? window.MS_Idioma.t(clave, vals) : '';
  }
  function idioma() {
    return (window.MS_Idioma && window.MS_Idioma.actual && window.MS_Idioma.actual()) || 'es';
  }
  function param(nombre) {
    var m = new RegExp('[?&]' + nombre + '=([^&]*)').exec(location.search);
    return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
  }
  function aparato(id) {
    var lista = (window.MS_Buscar && window.MS_Buscar.lista) ? window.MS_Buscar.lista() : [];
    for (var i = 0; i < lista.length; i++) { if (lista[i].id === id) return lista[i]; }
    return null;
  }
  /* dirección canónica del objeto: sin hash y con el idioma solo si no es español */
  function urlDe(id) {
    var u = location.pathname + '?objeto=' + encodeURIComponent(id);
    var l = idioma();
    if (l && l !== 'es') { u += '&lang=' + l; }
    return u;
  }
  function urlCompleta(id) { return location.origin + urlDe(id); }

  function meta(nombre, valor, propiedad) {
    if (!valor) { return; }
    var sel = propiedad ? 'meta[property="' + nombre + '"]' : 'meta[name="' + nombre + '"]';
    var n = document.querySelector(sel);
    if (!n) {
      n = document.createElement('meta');
      n.setAttribute(propiedad ? 'property' : 'name', nombre);
      document.head.appendChild(n);
    }
    n.setAttribute('content', valor);
  }
  function canonical(href) {
    var l = document.querySelector('link[rel="canonical"]');
    if (!l) { l = document.createElement('link'); l.rel = 'canonical'; document.head.appendChild(l); }
    l.href = href;
  }

  /* título y metas del objeto; con id nulo se vuelve a los de la portada */
  function pintarMetas(id) {
    var a = id ? aparato(id) : null;
    if (!a) {
      document.title = tituloBase;
      meta('description', metaBase);
      meta('og:title', tituloBase, true);
      meta('og:description', metaBase, true);
      meta('og:url', SITIO, true);
      canonical(SITIO);
      return;
    }
    var resumen = (a.ficha_resumen || '').replace(/\s+/g, ' ').trim();
    if (resumen.length > 155) { resumen = resumen.slice(0, 152).replace(/[,;.\s]+\S*$/, '') + '…'; }
    var titulo = a.nombre + ' · ' + (a.cuerpo || '') + ' · Memory Signals';
    var imagen = SITIO + 'img/fondo-' + a.id + '.jpg';
    document.title = titulo;
    meta('description', resumen);
    meta('og:title', titulo, true);
    meta('og:description', resumen, true);
    meta('og:url', urlCompleta(a.id), true);
    meta('og:type', 'article', true);
    meta('og:image', imagen, true);
    meta('twitter:card', 'summary_large_image');
    meta('twitter:title', titulo);
    meta('twitter:description', resumen);
    meta('twitter:image', imagen);
    canonical(urlCompleta(a.id));
  }

  /* la barra de direcciones, sin recargar ni ensuciar el historial */
  function sincronizaUrl(id) {
    try {
      var u = id ? urlDe(id) : (location.pathname + (idioma() !== 'es' ? '?lang=' + idioma() : ''));
      history.replaceState({ objeto: id || null }, '', u);
    } catch (e) { /* file:// o navegadores sin replaceState */ }
  }

  function avisar(texto) {
    if (aviso) { aviso.parentNode.removeChild(aviso); }
    aviso = document.createElement('div');
    aviso.className = 'aviso-compartir';
    aviso.setAttribute('role', 'status');
    aviso.textContent = texto;
    document.body.appendChild(aviso);
    setTimeout(function () { if (aviso && aviso.parentNode) { aviso.parentNode.removeChild(aviso); } aviso = null; }, 2600);
  }

  function copiar(url, a) {
    function hecho() { avisar(T('compartir.ok') || 'Enlace copiado'); }
    function aMano() {
      /* último recurso: seleccionar el texto para que el usuario lo copie */
      window.prompt(T('compartir.manual') || 'Copia el enlace:', url);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(hecho, aMano);
    } else { aMano(); }
  }

  function compartir() {
    var id = actual || param('objeto');
    var a = id ? aparato(id) : null;
    var url = id ? urlCompleta(id) : location.href;
    var titulo = a ? (a.nombre + ' · ' + (a.cuerpo || '')) : document.title;
    if (navigator.share) {
      navigator.share({ title: titulo, text: a ? (a.ficha_resumen || '') : '', url: url })
        .catch(function () { /* el usuario canceló: no se avisa de nada */ });
      return;
    }
    copiar(url, a);
  }

  window.MS_Url = { compartir: compartir, urlDe: urlCompleta, actual: function () { return actual; } };

  /* el motor avisa al pintar la ficha: es el momento de cambiar dirección y metas */
  document.addEventListener('ms:aparato', function (ev) {
    var id = (ev && ev.detail && ev.detail.id) || '';
    if (!id) { return; }
    actual = id;
    sincronizaUrl(id);
    pintarMetas(id);
  });

  /* al salir de la pantalla del objeto (la clase la pone y la quita el motor) se limpia la dirección */
  function vigilarSalida() {
    if (!window.MutationObserver) { return; }
    var dentro = document.body.classList.contains('viendo-objeto');
    new MutationObserver(function () {
      var ahora = document.body.classList.contains('viendo-objeto');
      if (ahora === dentro) { return; }
      dentro = ahora;
      if (!ahora && actual) {
        actual = null;
        sincronizaUrl(null);
        pintarMetas(null);
      }
    }).observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }

  /* enlace directo: ?objeto=<id> abre esa ficha cuando el catálogo ya está cargado */
  function enlaceDirecto() {
    var id = param('objeto');
    if (!id) { return; }
    var intentos = 0;
    var espera = setInterval(function () {
      intentos++;
      var listo = window.MS_Buscar && window.MS_Buscar.irA && window.MS_Buscar.lista && window.MS_Buscar.lista().length;
      if (listo) {
        clearInterval(espera);
        if (window.MS_Buscar.irA(id) === false) {
          /* el id no existe (enlace viejo o mal copiado): se avisa y se queda en la portada */
          avisar(T('compartir.noexiste') || 'Ese objeto ya no está en el catálogo');
        }
      } else if (intentos > 60) { clearInterval(espera); }
    }, 200);
  }

  document.addEventListener('ms:idioma', function () {
    /* al cambiar de idioma, la dirección del objeto se reescribe con el idioma nuevo */
    if (actual) { sincronizaUrl(actual); }
  });

  document.addEventListener('DOMContentLoaded', function () {
    vigilarSalida();
    var b = document.getElementById('btn-compartir');
    if (b) {
      b.addEventListener('click', compartir);
      if (!navigator.share) { b.title = T('compartir.copiar') || 'Copiar el enlace'; }
    }
    enlaceDirecto();
  });
})();
