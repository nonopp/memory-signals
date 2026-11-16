/* Memory Signals · formulario «Participa»
   Envía a WordPress (mu-plugin memory-signals-contribuciones) y no guarda nada en el navegador.
   Todo el texto visible sale del diccionario de idioma (js/idioma-paginas.js): aquí no hay
   ninguna frase escrita en español a mano, para que el formulario hable el mismo idioma que la app. */
(function () {
  'use strict';

  var ENDPOINT = 'https://nasa.gesemweb.es/wp-json/memory-signals/v1/contribucion';
  var MAX_FOTOS = 25 * 1024 * 1024;   // 25 MB
  var MAX_DOC = 10 * 1024 * 1024;     // 10 MB
  var MAX_DOCS = 3;

  var form = document.getElementById('form-contribucion');
  var gracias = document.getElementById('gracias');
  if (!form || !gracias) { return; }

  /* ---------- idioma ---------- */
  var IDIOMA = window.MS_Idioma;

  function tr(clave, datos) {
    if (IDIOMA) { return IDIOMA.t(clave, datos); }
    return clave;
  }

  function idioma() {
    return IDIOMA ? IDIOMA.actual() : 'es';
  }

  /* el formulario tiene que verse desde el principio: la pantalla de gracias es la que se oculta */
  form.hidden = false;
  gracias.hidden = true;

  var t0 = Date.now();
  var empezado = false; // el envío es válido a partir de 3 s de relleno
  var enviando = false; // hay una petición en curso: no se tocan avisos ni estados
  var idEnvio = null;   // identificador de la propuesta enviada, para repintar la pantalla de gracias

  function $(id) { return document.getElementById(id); }

  function errorEn(campo, mensaje) {
    var caja = document.getElementById(campo);
    var p = document.getElementById(campo + '-error');
    if (caja && caja.closest) {
      var envoltorio = caja.closest('.campo');
      if (envoltorio) { envoltorio.classList.add('con-error'); }
    }
    if (p) { p.textContent = mensaje; p.hidden = false; }
  }

  function limpiarErrores() {
    var e = form.querySelectorAll('.error');
    for (var i = 0; i < e.length; i++) { if (e[i].id !== 'error-general') { e[i].hidden = true; e[i].textContent = ''; } }
    var c = form.querySelectorAll('.con-error');
    for (var j = 0; j < c.length; j++) { c[j].classList.remove('con-error'); }
    var g = $('error-general');
    if (g) { g.hidden = true; g.textContent = ''; }
  }

  /* ---------- contador del nombre del objeto ---------- */
  var objeto = $('objeto'), cuenta = $('objeto-cuenta');
  if (objeto && cuenta) {
    objeto.addEventListener('input', function () {
      cuenta.textContent = String(objeto.value.length);
      empezado = true;
    });
  }

  /* ---------- hitos: hasta tres filas ---------- */
  var lista = $('hitos-lista');
  var anadir = $('anadir-hito');
  var nHito = 0;   // contador propio: si se quita una fila del medio no se repiten los identificadores

  /* rótulos y ayudas de una fila de hito, según el idioma activo */
  function aplicarFila(div, n) {
    var campos = [
      ['hito-titulo-' + n, 'p.hito.titulo', 'p.hito.titulo.ph'],
      ['hito-fuente-' + n, 'p.hito.fuente', 'p.hito.fuente.ph'],
      ['hito-texto-' + n, 'p.hito.texto', 'p.hito.texto.ph']
    ];
    campos.forEach(function (c) {
      var campo = div.querySelector('#' + c[0]);
      var etiqueta = div.querySelector('label[for="' + c[0] + '"]');
      if (etiqueta) { etiqueta.textContent = tr(c[1]); }
      if (campo) { campo.setAttribute('placeholder', tr(c[2])); }
    });
    var quitar = div.querySelector('.quitar');
    if (quitar) { quitar.textContent = tr('p.hito.quitar'); }
  }

  function filaHito(n) {
    var div = document.createElement('div');
    div.className = 'hito-fila';
    div.innerHTML =
      '<div class="campo"><label for="hito-titulo-' + n + '"></label>' +
      '<input type="text" id="hito-titulo-' + n + '" maxlength="60"></div>' +
      '<div class="campo"><label for="hito-fuente-' + n + '"></label>' +
      '<input type="url" id="hito-fuente-' + n + '"></div>' +
      '<div class="campo hito-texto-fila"><label for="hito-texto-' + n + '"></label>' +
      '<textarea id="hito-texto-' + n + '" rows="2" maxlength="400"></textarea></div>' +
      '<button type="button" class="quitar"></button>';
    div.querySelector('.quitar').addEventListener('click', function () { div.remove(); refrescaAnadir(); });
    aplicarFila(div, n);
    return div;
  }

  function refrescaAnadir() {
    if (!anadir || !lista) { return; }
    var cuantos = lista.querySelectorAll('.hito-fila').length;
    anadir.textContent = cuantos >= 3 ? tr('p.hito.max') : tr('p.hito.anadir');
    anadir.disabled = cuantos >= 3;
  }

  if (anadir && lista) {
    anadir.addEventListener('click', function () {
      var cuantos = lista.querySelectorAll('.hito-fila').length;
      if (cuantos >= 3) { return; }
      lista.appendChild(filaHito(++nHito));
      refrescaAnadir();
    });
    lista.appendChild(filaHito(++nHito));
    refrescaAnadir();
  }

  /* ---------- archivos ---------- */
  var fotos = $('fotos'), zona = $('zona-fotos'), estadoFotos = $('fotos-estado');
  var docs = $('documentos'), estadoDocs = $('docs-estado');

  function mb(bytes) { return (bytes / (1024 * 1024)).toFixed(1).replace('.0', '') + ' MB'; }

  function revisarFotos() {
    if (!fotos || !fotos.files.length) {
      estadoFotos.textContent = tr('p.estado.vacio');
      estadoFotos.classList.remove('ok');
      return true;
    }
    var f = fotos.files[0];
    if (!/\.zip$/i.test(f.name)) {
      errorEn('fotos', tr('p.err.fotos.zip'));
      estadoFotos.textContent = tr('p.estado.nozip', { nombre: f.name, mb: mb(f.size) });
      estadoFotos.classList.remove('ok');
      return false;
    }
    if (f.size > MAX_FOTOS) {
      errorEn('fotos', tr('p.err.fotos.grande', { mb: mb(f.size) }));
      estadoFotos.textContent = tr('p.estado.grande', { nombre: f.name, mb: mb(f.size) });
      estadoFotos.classList.remove('ok');
      return false;
    }
    estadoFotos.textContent = tr('p.estado.fotos.ok', { nombre: f.name, mb: mb(f.size) });
    estadoFotos.classList.add('ok');
    return true;
  }

  function revisarDocs() {
    if (!docs || !docs.files.length) {
      estadoDocs.textContent = tr('p.estado.vacio');
      estadoDocs.classList.remove('ok');
      return true;
    }
    if (docs.files.length > MAX_DOCS) {
      errorEn('documentos', tr('p.err.docs.tres', { n: docs.files.length }));
      estadoDocs.textContent = tr('p.estado.docs.cuantos', { n: docs.files.length });
      estadoDocs.classList.remove('ok');
      return false;
    }
    var total = 0, nombres = [];
    for (var i = 0; i < docs.files.length; i++) {
      var f = docs.files[i];
      if (f.size > MAX_DOC) {
        errorEn('documentos', tr('p.err.docs.grande', { nombre: f.name, mb: mb(f.size) }));
        return false;
      }
      if (!/\.(pdf|doc|docx|txt|md)$/i.test(f.name)) {
        errorEn('documentos', tr('p.err.docs.tipo', { nombre: f.name }));
        return false;
      }
      total += f.size; nombres.push(f.name);
    }
    estadoDocs.textContent = nombres.join(' · ') + ' · ' + mb(total);
    estadoDocs.classList.add('ok');
    return true;
  }

  if (fotos) { fotos.addEventListener('change', function () { revisarFotos(); }); }
  if (docs) { docs.addEventListener('change', function () { revisarDocs(); }); }
  if (zona) {
    ['dragenter', 'dragover'].forEach(function (ev) {
      zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.add('sobre'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      zona.addEventListener(ev, function (e) { e.preventDefault(); zona.classList.remove('sobre'); });
    });
    zona.addEventListener('drop', function (e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length && fotos) {
        fotos.files = e.dataTransfer.files;
        revisarFotos();
      }
    });
  }

  /* ---------- el botón solo se activa con las dos casillas ---------- */
  var casillas = [$('acepta_privacidad'), $('mayor_de_edad')];
  var enviar = $('enviar');

  function revisaCasillas() {
    var listo = casillas.every(function (c) { return c && c.checked; });
    if (enviar) { enviar.disabled = !listo; }
    return listo;
  }
  casillas.forEach(function (c) { if (c) { c.addEventListener('change', revisaCasillas); } });
  revisaCasillas();

  /* ---------- pantalla de gracias (se reescribe en el idioma activo) ---------- */
  function pintarGracias() {
    var ul = $('gracias-lista');
    if (!ul) { return; }
    ul.innerHTML = '';
    ['p.gracias.item1', 'p.gracias.item2', 'p.gracias.item3', 'p.gracias.item4'].forEach(function (clave) {
      var li = document.createElement('li');
      if (clave === 'p.gracias.item1') {
        li.innerHTML = tr(clave, { id: idEnvio || '—' });
      } else {
        li.textContent = tr(clave);
      }
      ul.appendChild(li);
    });
  }

  /* ---------- enviar ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    limpiarErrores();

    var ok = true;

    if (!objeto.value.trim() || objeto.value.trim().length < 3) {
      errorEn('objeto', tr('p.err.objeto'));
      ok = false;
    }
    var correo = $('email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
      errorEn('email', tr('p.err.email'));
      ok = false;
    }
    var fuente = $('fuente_url').value.trim();
    if (fuente && !/^https?:\/\/.+\..+/i.test(fuente)) {
      errorEn('fuente_url', tr('p.err.fuente'));
      ok = false;
    }
    if (!revisarFotos()) { ok = false; }
    if (!revisarDocs()) { ok = false; }
    if (!revisaCasillas()) {
      $('error-general').textContent = tr('p.err.casillas');
      $('error-general').hidden = false;
      ok = false;
    }

    var transcurrido = Date.now() - t0;
    if (transcurrido < 3000) {
      $('error-general').textContent = tr('p.err.rapido');
      $('error-general').hidden = false;
      ok = false;
    }

    if (!ok) {
      var primero = form.querySelector('.con-error input, .con-error select, .con-error textarea');
      if (primero) { primero.focus(); primero.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      return;
    }

    var datos = new FormData();
    datos.append('objeto', objeto.value.trim());
    datos.append('email', correo);
    ['mision', 'agencia', 'cuerpo', 'anio', 'lugar', 'estado_objeto', 'resumen', 'credito'].forEach(function (k) {
      var el = $(k);
      if (el && el.value) { datos.append(k, el.value.trim()); }
    });
    if (fuente) { datos.append('fuente_url', fuente); }
    datos.append('acepta_privacidad', '1');
    datos.append('mayor_de_edad', '1');
    datos.append('t0', String(t0));
    datos.append('web', $('web') ? $('web').value : '');
    datos.append('idioma', idioma());

    var hitos = [];
    if (lista) {
      var filas = lista.querySelectorAll('.hito-fila');
      for (var i = 0; i < filas.length; i++) {
        var ht = filas[i].querySelector('input[type=text]').value.trim();
        var hu = filas[i].querySelector('input[type=url]').value.trim();
        var hx = filas[i].querySelector('textarea').value.trim();
        if (ht || hx) { hitos.push({ titulo: ht, texto: hx, fuente: hu }); }
      }
    }
    datos.append('hitos', JSON.stringify(hitos));

    if (fotos && fotos.files.length) { datos.append('fotos', fotos.files[0]); }
    if (docs && docs.files.length) {
      for (var d = 0; d < docs.files.length; d++) { datos.append('documentos[]', docs.files[d]); }
    }

    enviando = true;
    enviar.disabled = true;
    var estado = $('estado-envio');
    estado.textContent = tr('p.env.enviando');

    fetch(ENDPOINT, { method: 'POST', body: datos, mode: 'cors' })
      .then(function (r) {
        return r.json().then(function (j) { return { status: r.status, cuerpo: j }; })
          .catch(function () { return { status: r.status, cuerpo: { recibido: r.ok } }; });
      })
      .then(function (res) {
        var j = res.cuerpo || {};
        if (!j.recibido) {
          /* el servidor contesta en español; fuera del español se usa el aviso traducido */
          var msg = (idioma() === 'es' && j.error) ? j.error : tr('p.err.generico');
          if (j.campo) { errorEn(j.campo, msg); } else {
            $('error-general').textContent = msg;
            $('error-general').hidden = false;
          }
          estado.textContent = '';
          enviar.disabled = false;
          enviando = false;
          revisaCasillas();
          return;
        }
        idEnvio = j.id || '—';
        pintarGracias();
        $('gracias-texto').textContent = (idioma() === 'es' && j.mensaje) ? j.mensaje : tr('p.gracias.texto');
        enviando = false;
        form.hidden = true;
        gracias.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function () {
        $('error-general').textContent = tr('p.err.conexion');
        $('error-general').hidden = false;
        estado.textContent = '';
        enviar.disabled = false;
        enviando = false;
        revisaCasillas();
      });
  });

  /* ---------- enviar otra ---------- */
  var otra = $('otra');
  if (otra) {
    otra.addEventListener('click', function () {
      form.reset();
      limpiarErrores();
      idEnvio = null;
      var l = $('hitos-lista');
      if (l) { l.innerHTML = ''; nHito = 0; l.appendChild(filaHito(++nHito)); refrescaAnadir(); }
      if (estadoFotos) { estadoFotos.textContent = tr('p.estado.vacio'); estadoFotos.classList.remove('ok'); }
      if (estadoDocs) { estadoDocs.textContent = tr('p.estado.vacio'); estadoDocs.classList.remove('ok'); }
      if (cuenta) { cuenta.textContent = '0'; }
      $('estado-envio').textContent = '';
      gracias.hidden = true;
      form.hidden = false;
      t0 = Date.now();
      revisaCasillas();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- al cambiar de idioma, el formulario se repinta sin perder lo escrito ---------- */
  document.addEventListener('ms:idioma', function () {
    if (lista) {
      var filas = lista.querySelectorAll('.hito-fila');
      for (var i = 0; i < filas.length; i++) {
        var primera = filas[i].querySelector('input[id^="hito-titulo-"]');
        var n = primera ? primera.id.replace('hito-titulo-', '') : String(i + 1);
        aplicarFila(filas[i], n);
      }
    }
    refrescaAnadir();
    /* los avisos y estados visibles estaban en el idioma anterior: se rehacen en el nuevo */
    if (!enviando) {
      limpiarErrores();
      revisarFotos();
      revisarDocs();
    }
    pintarGracias();
  });

  pintarGracias();

  /* si el envío falla por el tiempo mínimo, el formulario sigue vivo */
  window.addEventListener('focus', function () { empezado = true; });
})();
