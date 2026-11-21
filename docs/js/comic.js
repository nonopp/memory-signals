/* Memory Signals — el cómic del objeto.
   Un botón en la ficha abre, a ancho completo, la tira del objeto: nueve viñetas en rejilla 3x3
   (una sola columna en el móvil), la franja de cierre y el enlace al PDF del idioma en curso.
   Las imágenes vienen sin texto; los bocadillos y las cartelas son texto real del catálogo. */
(function () {
  'use strict';

  var datos = null, cargando = null, objetoActual = null, montadoPara = null, abierto = false;
  var seccion, rejilla, franja, pie, boton;

  function T(clave, vals) {
    return (window.MS_Idioma && window.MS_Idioma.t) ? window.MS_Idioma.t(clave, vals) : (clave || '');
  }
  function idioma() {
    return (window.MS_Idioma && window.MS_Idioma.actual && window.MS_Idioma.actual()) || 'es';
  }
  function texto(campo) {
    if (!campo) return '';
    if (typeof campo === 'string') return campo;
    return campo[idioma()] || campo.es || '';
  }

  function cargar() {
    if (datos) return Promise.resolve(datos);
    if (cargando) return cargando;
    cargando = fetch('datos/comics.json?v=' + (window.__MSV || ''))
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { datos = j; return datos; })
      .catch(function (e) { console.warn('comics: ' + e.message); datos = {}; return datos; });
    return cargando;
  }

  function hayComic(id) {
    return !!(datos && datos[id] && (datos[id].vinetas || []).length);
  }

  function crear() {
    if (seccion) return;
    seccion = document.createElement('section');
    seccion.className = 'comic';
    seccion.id = 'comic';
    seccion.hidden = true;
    seccion.setAttribute('aria-labelledby', 'comic-titulo');
    seccion.innerHTML =
      '<div class="comic-cabecera">' +
        '<div>' +
          '<h3 class="comic-titulo" id="comic-titulo"></h3>' +
          '<p class="comic-subtitulo"></p>' +
        '</div>' +
        '<button type="button" class="comic-cerrar" aria-label="' + (T('comic.cerrar') || 'Cerrar') + '">' +
          '<span aria-hidden="true">×</span></button>' +
      '</div>' +
      '<div class="comic-rejilla"></div>' +
      '<figure class="comic-franja"><img alt="" loading="lazy"><p class="comic-cierre"></p></figure>' +
      '<div class="comic-pie"></div>';
    var cont = document.getElementById('p-objeto');
    if (cont) cont.appendChild(seccion); else document.body.appendChild(seccion);
    rejilla = seccion.querySelector('.comic-rejilla');
    franja = seccion.querySelector('.comic-franja');
    pie = seccion.querySelector('.comic-pie');
    seccion.querySelector('.comic-cerrar').addEventListener('click', function () {
      abierto = false;
      seccion.hidden = true;
      if (boton) { boton.setAttribute('aria-expanded', 'false'); boton.focus(); }
    });
  }

  function montar(id) {
    crear();
    var c = datos[id];
    var v = window.__MSV || '';
    seccion.querySelector('.comic-titulo').textContent = texto(c.titulo);
    seccion.querySelector('.comic-subtitulo').textContent = texto(c.subtitulo);

    rejilla.innerHTML = (c.vinetas || []).map(function (vi, i) {
      var img = (c.imagenes || [])[i] || '';
      return '<figure class="vineta">' +
        '<img src="' + img + '?v=' + v + '" alt="' + (T('comic.vineta', { n: vi.n }) || ('Viñeta ' + vi.n)) +
          '" width="840" height="1120" loading="lazy">' +
        '<figcaption class="cartela">' + texto(vi.cartela) +
          (texto(vi.dato) ? '<span class="dato-vineta">' + texto(vi.dato) + '</span>' : '') + '</figcaption>' +
        (texto(vi.bocadillo) ? '<p class="bocadillo">' + texto(vi.bocadillo) + '</p>' : '') +
      '</figure>';
    }).join('');

    if (c.franja) {
      franja.hidden = false;
      franja.querySelector('img').src = c.franja + '?v=' + v;
      franja.querySelector('.comic-cierre').textContent = texto(c.cierre);
    } else {
      franja.hidden = true;
    }

    var pdf = (c.pdf || {})[idioma()] || (c.pdf || {}).es || '';
    var enlaces = '';
    if (pdf) {
      enlaces += '<a class="comic-pdf" href="' + pdf + '?v=' + v + '" download>' +
        (T('comic.descargar') || 'Descargar en PDF') + '</a>';
    }
    if ((c.fuentes || []).length) {
      enlaces += '<p class="comic-fuentes">' + (T('comic.fuentes') || 'Fuentes') + ': ' +
        c.fuentes.map(function (u) {
          var d = u.replace(/^https?:\/\//, '').replace(/\/$/, '');
          return '<a href="' + u + '" rel="noopener" target="_blank">' + d + '</a>';
        }).join(' · ') + '</p>';
    }
    pie.innerHTML = enlaces;
    montadoPara = id;
  }

  function alternar() {
    if (!objetoActual) return;
    crear();
    if (!abierto || montadoPara !== objetoActual) {
      montar(objetoActual);
      seccion.hidden = false;
      abierto = true;
      if (boton) boton.setAttribute('aria-expanded', 'true');
      /* la página se abre donde empieza el cómic, no en mitad de la rejilla */
      setTimeout(function () { seccion.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
    } else {
      abierto = false;
      seccion.hidden = true;
      if (boton) boton.setAttribute('aria-expanded', 'false');
    }
  }

  function alCambiarIdioma() {
    if (abierto && objetoActual && hayComic(objetoActual)) montar(objetoActual);
    if (boton) boton.textContent = T('comic.boton') || 'Cómic';
  }

  document.addEventListener('ms:aparato', function (ev) {
    var id = (ev && ev.detail && ev.detail.id) || '';
    objetoActual = id;
    cargar().then(function () {
      if (!boton) boton = document.getElementById('btn-comic');
      if (!boton) return;
      var tiene = hayComic(id);
      boton.hidden = !tiene;
      boton.setAttribute('aria-expanded', 'false');
      /* si cambias de objeto, el cómic anterior se cierra */
      if (abierto) { abierto = false; if (seccion) seccion.hidden = true; }
    });
  });

  document.addEventListener('ms:idioma', alCambiarIdioma);

  document.addEventListener('DOMContentLoaded', function () {
    boton = document.getElementById('btn-comic');
    if (boton) {
      boton.hidden = true;
      boton.addEventListener('click', alternar);
    }
    cargar();
  });
})();
