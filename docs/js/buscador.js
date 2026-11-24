/* Memory Signals — buscador de objetos.
   Una lupa en la cabecera abre un panel con el campo, los filtros por destino y la lista de
   resultados. La lista se construye con el catálogo que ya tiene cargado el motor: 42 objetos,
   nada que pedir al servidor y ninguna librería. */
(function () {
  'use strict';

  var panel, entrada, lista, cuenta, chipsCaja, ayuda, abierto = false;
  var filtro = 'todo', seleccion = 0, resultados = [];

  /* El estado viene traducido en cada catálogo («funciona», «works», «funktioniert»): esta es
     la única lista que hay que tocar si algún día se añade otro idioma. */
  var EN_SERVICIO = ['funciona', 'works', 'funktioniert'];
  function sigueFuncionando(a) {
    return !!a && EN_SERVICIO.indexOf(a.estado) !== -1;
  }

  function T(clave, datos) {
    return (window.MS_Idioma && window.MS_Idioma.t) ? window.MS_Idioma.t(clave, datos) : '';
  }
  /* sin tildes y sin mayúsculas: «modulo lunar» tiene que encontrar «Módulo lunar» */
  function norm(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  function objetos() { return (window.MS_Buscar && window.MS_Buscar.lista()) || []; }
  function destinoDe(id) { return (window.MS_Buscar && window.MS_Buscar.destinoDe) ? window.MS_Buscar.destinoDe(id) : 'espacio'; }
  /* el nombre sale del catálogo (La Luna / Marte / Otros destinos), ya traducido por el motor */
  function nombreDestino(id) { return (window.MS_Buscar && window.MS_Buscar.nombreDestino && window.MS_Buscar.nombreDestino(id)) || T('destino.' + id) || id; }

  /* texto en el que se busca: nombre y nombre de mapa pesan, pero también el sitio, el año, la
     ficha, las personas reales de la misión y los hitos */
  function textoDe(a) {
    return norm([
      a.nombre, a.nombre_mapa, a.cuerpo, a.lugar, a.anio, a.ficha_resumen,
      (a.personas || []).map(function (p) { return p.nombre + ' ' + p.papel; }).join(' '),
      (a.hitos || []).map(function (h) { return h.titulo + ' ' + h.texto; }).join(' ')
    ].join(' '));
  }

  function crear() {
    if (panel) return;
    panel = document.createElement('div');
    panel.className = 'buscador';
    panel.id = 'buscador';
    panel.hidden = true;
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.innerHTML =
      '<div class="buscador-caja">' +
        '<div class="buscador-barra">' +
          '<span class="buscador-lupa" aria-hidden="true">⌕</span>' +
          '<input type="search" id="buscador-campo" autocomplete="off" spellcheck="false" aria-label="' +
            (T('buscar.abrir') || 'Buscar') + '">' +
          '<button type="button" class="buscador-cerrar" id="buscador-cerrar" aria-label="' +
            (T('buscar.cerrar') || 'Cerrar') + '"><span aria-hidden="true">×</span></button>' +
        '</div>' +
        '<div class="buscador-chips" id="buscador-chips" role="group"></div>' +
        '<p class="buscador-cuenta" id="buscador-cuenta"></p>' +
        '<div class="buscador-lista" id="buscador-lista" role="listbox" aria-label="' +
          (T('buscar.titulo') || 'Buscar objetos') + '"></div>' +
      '</div>';
    document.body.appendChild(panel);
    entrada = document.getElementById('buscador-campo');
    lista = document.getElementById('buscador-lista');
    cuenta = document.getElementById('buscador-cuenta');
    chipsCaja = document.getElementById('buscador-chips');
    ayuda = document.createElement('p');

    document.getElementById('buscador-cerrar').addEventListener('click', cerrar);
    panel.addEventListener('click', function (ev) { if (ev.target === panel) cerrar(); });
    entrada.addEventListener('input', function () { seleccion = 0; pinta(); });
    entrada.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { cerrar(); return; }
      if (ev.key === 'ArrowDown') { ev.preventDefault(); mueve(1); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); mueve(-1); }
      else if (ev.key === 'Enter') {
        ev.preventDefault();
        if (resultados[seleccion]) ir(resultados[seleccion].id);
      }
    });
    chipsCaja.addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-filtro]');
      if (!b) return;
      filtro = b.getAttribute('data-filtro');
      seleccion = 0;
      pinta();
    });
    pintarChips();
  }

  function pintarChips() {
    var opciones = [
      ['todo', T('buscar.todo') || 'Todo'],
      ['luna', T('destino.luna') || nombreDestino('luna')],
      ['marte', T('destino.marte') || nombreDestino('marte')],
      ['espacio', T('destino.espacio') || nombreDestino('espacio')],
      ['funciona', T('buscar.funciona') || 'Solo lo que aún funciona']
    ];
    chipsCaja.innerHTML = opciones.map(function (o) {
      return '<button type="button" class="buscador-chip' + (filtro === o[0] ? ' on' : '') +
        '" data-filtro="' + o[0] + '" aria-pressed="' + (filtro === o[0]) + '">' + o[1] + '</button>';
    }).join('');
  }

  function filtra() {
    var q = norm(entrada.value).trim();
    var todos = objetos();
    var salida = todos.filter(function (a) {
      if (filtro === 'funciona') { if (!sigueFuncionando(a)) return false; }
      else if (filtro !== 'todo') { if (destinoDe(a.id) !== filtro) return false; }
      if (!q) return true;
      return textoDe(a).indexOf(q) !== -1;
    });
    if (q) {
      /* relevancia: 1º la palabra en el nombre, 2º en el sitio o el cuerpo (luna, marte, Tierra),
         3º solo porque aparezca en la ficha o en los hitos */
      function peso(a) {
        if (norm(a.nombre + ' ' + (a.nombre_mapa || '')).indexOf(q) !== -1) return 0;
        if (norm((a.cuerpo || '') + ' ' + (a.lugar || '')).indexOf(q) !== -1) return 1;
        return 2;
      }
      salida.sort(function (x, y) { return peso(x) - peso(y); });
    }
    return salida;
  }

  function pinta() {
    if (!panel || panel.hidden) return;
    resultados = filtra();
    var total = objetos().length;
    var q = entrada.value.trim();
    cuenta.textContent = (resultados.length === total && !q && filtro === 'todo')
      ? (T('buscar.ayuda', { n: total }) || total + ' objetos')
      : (T('buscar.cuenta', { n: resultados.length, total: total }) || (resultados.length + ' de ' + total));
    if (!resultados.length) {
      lista.innerHTML = '<p class="buscador-vacio">' + (T('buscar.vacio') || 'Nada con eso.') + '</p>';
      return;
    }
    lista.innerHTML = resultados.map(function (a, i) {
      var funciona = sigueFuncionando(a);
      return '<button type="button" class="buscador-res' + (i === seleccion ? ' sel' : '') +
        '" role="option" aria-selected="' + (i === seleccion) + '" data-id="' + a.id + '">' +
        '<span class="buscador-punto" style="background:' + (a.color || '#63e0c8') + '"></span>' +
        '<span class="buscador-textos">' +
          '<span class="buscador-nombre">' + (a.nombre_mapa || a.nombre) + '</span>' +
          '<span class="buscador-meta">' + a.cuerpo + ' · ' + a.anio +
            (funciona ? ' · ' + (T('buscar.sigue') || 'sigue funcionando') : '') +
            (a.excepcion ? ' · ' + (T('buscar.excepcion') || 'excepción') : '') + '</span>' +
          '<span class="buscador-resumen">' + (a.ficha_resumen || '') + '</span>' +
        '</span></button>';
    }).join('');
    Array.prototype.forEach.call(lista.querySelectorAll('.buscador-res'), function (b) {
      b.addEventListener('click', function () { ir(b.getAttribute('data-id')); });
    });
    if (lista.children[seleccion] && lista.children[seleccion].scrollIntoView) {
      lista.children[seleccion].scrollIntoView({ block: 'nearest' });
    }
  }

  function mueve(paso) {
    if (!resultados.length) return;
    seleccion = (seleccion + paso + resultados.length) % resultados.length;
    pinta();
  }

  function ir(id) {
    cerrar();
    if (window.MS_Buscar && window.MS_Buscar.irA) window.MS_Buscar.irA(id);
  }

  function abrir(termino) {
    crear();
    panel.hidden = false;
    abierto = true;
    document.body.classList.add('buscando');
    pintarChips();
    if (typeof termino === 'string') entrada.value = termino;
    pinta();
    entrada.focus();
    if (entrada.setSelectionRange) {
      var n = entrada.value.length;
      try { entrada.setSelectionRange(n, n); } catch (e) {}
    }
  }

  function cerrar() {
    if (!panel) return;
    panel.hidden = true;
    abierto = false;
    document.body.classList.remove('buscando');
  }

  document.addEventListener('keydown', function (ev) {
    if ((ev.ctrlKey || ev.metaKey) && (ev.key === 'k' || ev.key === 'K')) {
      ev.preventDefault();
      if (abierto) cerrar(); else abrir();
    } else if (ev.key === 'Escape' && abierto) {
      cerrar();
    }
  });

  document.addEventListener('ms:idioma', function () {
    if (!panel) return;
    entrada.setAttribute('aria-label', T('buscar.abrir') || 'Buscar');
    pintarChips();
    pinta();
  });

  window.MS_Buscador = { abrir: abrir, cerrar: cerrar, alternar: function () { if (abierto) cerrar(); else abrir(); } };

  document.addEventListener('DOMContentLoaded', function () {
    var b = document.getElementById('btn-buscar');
    if (b) b.addEventListener('click', function () { window.MS_Buscador.alternar(); });
    /* enlace compartible: ?buscar=agua abre el panel con esa búsqueda */
    var m = /[?&]buscar=([^&]+)/.exec(location.search);
    if (m) {
      var espera = setInterval(function () {
        if (window.MS_Buscar && window.MS_Buscar.lista && window.MS_Buscar.lista().length) {
          clearInterval(espera);
          abrir(decodeURIComponent(m[1].replace(/\+/g, ' ')));
        }
      }, 200);
      setTimeout(function () { clearInterval(espera); }, 8000);
    }
  });
})();
