/* Memory Signals · formulario «Participa»
   Envía a WordPress (mu-plugin memory-signals-contribuciones) y no guarda nada en el navegador. */
(function () {
  'use strict';

  var ENDPOINT = 'https://nasa.gesemweb.es/wp-json/memory-signals/v1/contribucion';
  var MAX_FOTOS = 25 * 1024 * 1024;   // 25 MB
  var MAX_DOC = 10 * 1024 * 1024;     // 10 MB
  var MAX_DOCS = 3;

  var form = document.getElementById('form-contribucion');
  var gracias = document.getElementById('gracias');
  if (!form || !gracias) { return; }

  var t0 = Date.now();
  var empezado = false; // el envío es válido a partir de 3 s de relleno

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

  function filaHito(n) {
    var div = document.createElement('div');
    div.className = 'hito-fila';
    div.innerHTML =
      '<div class="campo"><label for="hito-titulo-' + n + '">Título</label>' +
      '<input type="text" id="hito-titulo-' + n + '" maxlength="60" placeholder="Objetivo, Mi motor…"></div>' +
      '<div class="campo"><label for="hito-fuente-' + n + '">Fuente</label>' +
      '<input type="url" id="hito-fuente-' + n + '" placeholder="https://…"></div>' +
      '<div class="campo hito-texto-fila"><label for="hito-texto-' + n + '">Frase (12-18 palabras)</label>' +
      '<textarea id="hito-texto-' + n + '" rows="2" maxlength="400" placeholder="Lo que diría el aparato en primera persona…"></textarea></div>' +
      '<button type="button" class="quitar">Quitar este hito</button>';
    div.querySelector('.quitar').addEventListener('click', function () { div.remove(); refrescaAnadir(); });
    return div;
  }

  function refrescaAnadir() {
    var cuantos = lista.querySelectorAll('.hito-fila').length;
    anadir.textContent = cuantos >= 3 ? 'Máximo tres hitos' : '+ Añadir otro hito';
    anadir.disabled = cuantos >= 3;
  }

  if (anadir && lista) {
    anadir.addEventListener('click', function () {
      var cuantos = lista.querySelectorAll('.hito-fila').length;
      if (cuantos >= 3) { return; }
      lista.appendChild(filaHito(cuantos + 1));
      refrescaAnadir();
    });
    lista.appendChild(filaHito(1));
    refrescaAnadir();
  }

  /* ---------- archivos ---------- */
  var fotos = $('fotos'), zona = $('zona-fotos'), estadoFotos = $('fotos-estado');
  var docs = $('documentos'), estadoDocs = $('docs-estado');

  function mb(bytes) { return (bytes / (1024 * 1024)).toFixed(1).replace('.0', '') + ' MB'; }

  function revisarFotos() {
    if (!fotos || !fotos.files.length) { estadoFotos.textContent = 'Ningún archivo elegido.'; estadoFotos.classList.remove('ok'); return true; }
    var f = fotos.files[0];
    if (!/\.zip$/i.test(f.name)) {
      errorEn('fotos', 'El archivo de fotos tiene que ser un .zip (comprime las imágenes antes de subirlas).');
      estadoFotos.textContent = f.name + ' · ' + mb(f.size) + ' · no es un zip';
      estadoFotos.classList.remove('ok');
      return false;
    }
    if (f.size > MAX_FOTOS) {
      errorEn('fotos', 'El zip pesa ' + mb(f.size) + ' y el máximo es 25 MB.');
      estadoFotos.textContent = f.name + ' · ' + mb(f.size) + ' · demasiado grande';
      estadoFotos.classList.remove('ok');
      return false;
    }
    estadoFotos.textContent = f.name + ' · ' + mb(f.size) + ' de 25 MB';
    estadoFotos.classList.add('ok');
    return true;
  }

  function revisarDocs() {
    if (!docs || !docs.files.length) { estadoDocs.textContent = 'Ningún archivo elegido.'; estadoDocs.classList.remove('ok'); return true; }
    if (docs.files.length > MAX_DOCS) {
      errorEn('documentos', 'Como mucho tres documentos: has elegido ' + docs.files.length + '.');
      estadoDocs.textContent = docs.files.length + ' archivos · máximo 3';
      estadoDocs.classList.remove('ok');
      return false;
    }
    var total = 0, nombres = [];
    for (var i = 0; i < docs.files.length; i++) {
      var f = docs.files[i];
      if (f.size > MAX_DOC) {
        errorEn('documentos', '«' + f.name + '» pesa ' + mb(f.size) + ' y el máximo por documento es 10 MB.');
        return false;
      }
      if (!/\.(pdf|doc|docx|txt|md)$/i.test(f.name)) {
        errorEn('documentos', '«' + f.name + '» no es PDF, DOC, DOCX, TXT ni MD.');
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
    enviar.disabled = !listo;
    return listo;
  }
  casillas.forEach(function (c) { if (c) { c.addEventListener('change', revisaCasillas); } });
  revisaCasillas();

  /* ---------- enviar ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    limpiarErrores();

    var ok = true;

    if (!objeto.value.trim() || objeto.value.trim().length < 3) {
      errorEn('objeto', 'Escribe el nombre del objeto (al menos 3 caracteres).');
      ok = false;
    }
    var correo = $('email').value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(correo)) {
      errorEn('email', 'Esa dirección de correo no parece válida.');
      ok = false;
    }
    var fuente = $('fuente_url').value.trim();
    if (fuente && !/^https?:\/\/.+\..+/i.test(fuente)) {
      errorEn('fuente_url', 'La dirección de la fuente tiene que empezar por http:// o https://.');
      ok = false;
    }
    if (!revisarFotos()) { ok = false; }
    if (!revisarDocs()) { ok = false; }
    if (!revisaCasillas()) {
      $('error-general').textContent = 'Hacen falta las dos casillas marcadas para poder enviar.';
      $('error-general').hidden = false;
      ok = false;
    }

    var transcurrido = Date.now() - t0;
    if (transcurrido < 3000) {
      $('error-general').textContent = 'Tómate unos segundos: el formulario acaba de abrirse. Vuelve a pulsar enviar.';
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

    var hitos = [];
    if (lista) {
      var filas = lista.querySelectorAll('.hito-fila');
      for (var i = 0; i < filas.length; i++) {
        var t = filas[i].querySelector('input[type=text]').value.trim();
        var u = filas[i].querySelector('input[type=url]').value.trim();
        var x = filas[i].querySelector('textarea').value.trim();
        if (t || x) { hitos.push({ titulo: t, texto: x, fuente: u }); }
      }
    }
    datos.append('hitos', JSON.stringify(hitos));

    if (fotos && fotos.files.length) { datos.append('fotos', fotos.files[0]); }
    if (docs && docs.files.length) {
      for (var d = 0; d < docs.files.length; d++) { datos.append('documentos[]', docs.files[d]); }
    }

    enviar.disabled = true;
    var estado = $('estado-envio');
    estado.textContent = 'Enviando… si llevas fotos, puede tardar un poco.';

    fetch(ENDPOINT, { method: 'POST', body: datos, mode: 'cors' })
      .then(function (r) {
        return r.json().then(function (j) { return { status: r.status, cuerpo: j }; })
          .catch(function () { return { status: r.status, cuerpo: { recibido: r.ok } }; });
      })
      .then(function (res) {
        var j = res.cuerpo || {};
        if (!j.recibido) {
          var msg = j.error || 'No se ha podido enviar la propuesta. Inténtalo otra vez en un momento.';
          if (j.campo) { errorEn(j.campo, msg); } else {
            $('error-general').textContent = msg;
            $('error-general').hidden = false;
          }
          estado.textContent = '';
          enviar.disabled = false;
          return;
        }
        $('gracias-id').textContent = j.id || '—';
        $('gracias-texto').textContent = j.mensaje || 'Gracias. El equipo revisará tu propuesta.';
        form.hidden = true;
        gracias.hidden = false;
        window.scrollTo({ top: 0, behavior: 'smooth' });
      })
      .catch(function () {
        $('error-general').textContent = 'No se ha podido conectar con el servidor. Comprueba tu conexión y vuelve a intentarlo.';
        $('error-general').hidden = false;
        estado.textContent = '';
        enviar.disabled = false;
      });
  });

  /* ---------- enviar otra ---------- */
  var otra = $('otra');
  if (otra) {
    otra.addEventListener('click', function () {
      form.reset();
      limpiarErrores();
      var l = $('hitos-lista');
      if (l) { l.innerHTML = ''; l.appendChild(filaHito(1)); refrescaAnadir(); }
      if (estadoFotos) { estadoFotos.textContent = 'Ningún archivo elegido.'; estadoFotos.classList.remove('ok'); }
      if (estadoDocs) { estadoDocs.textContent = 'Ningún archivo elegido.'; estadoDocs.classList.remove('ok'); }
      if (cuenta) { cuenta.textContent = '0'; }
      $('estado-envio').textContent = '';
      gracias.hidden = true;
      form.hidden = false;
      t0 = Date.now();
      revisaCasillas();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* si el envío falla por el tiempo mínimo, el formulario sigue vivo */
  window.addEventListener('focus', function () { empezado = true; });
})();
