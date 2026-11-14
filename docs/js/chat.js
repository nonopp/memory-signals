/* Memory Signals — el objeto te habla.
   Ventana flotante (como el widget de botu.es): burbuja abajo a la derecha y panel de chat.
   Dos capas:
     1. recuperación en el navegador: índice de 74 fichas -> la ficha -> la sección -> los párrafos.
     2. redacción del modelo: el fragmento viaja a /api/chat.php y vuelve escrito en primera persona.
   Si el modelo no está (sin red, límite, error), contesta la capa 1: nunca se queda callado. */
(function () {
  'use strict';

  /* mismo origen en gesemweb; en GitHub Pages, al endpoint de srv2 */
  var API = /(^|\.)gesemweb\.es$/.test(location.hostname)
    ? 'api/chat.php'
    : 'https://nasa.gesemweb.es/app/api/chat.php';

  var indice = null;
  var actual = null;
  var fichasCargadas = {};
  var panelAbierto = false;
  var ocupado = false;

  var EQUIVALENCIA = {
    'modulo-lunar': 'apolo-modulo-lunar',
    'near-shoemaker': 'near-shoemaker',
    pioneer10: 'pioneer-10-11',
    dawn: 'dawn',
    opportunity: 'spirit-opportunity',
    insight: 'phoenix-insight',
    voyager1: null
  };

  var VACIAS = ['que', 'como', 'cuando', 'donde', 'quien', 'cuanto', 'cuanta', 'porque', 'para',
                'los', 'las', 'del', 'una', 'unos', 'unas', 'este', 'esta', 'esto', 'eso', 'esa',
                'the', 'and', 'con', 'sin', 'mas', 'muy', 'fue', 'era', 'son', 'hay',
                'saber', 'dime', 'cuentame', 'puedes', 'sobre', 'tiene', 'tienen', 'hace', 'hacia',
                'hecho', 'hecha', 'hiciste', 'hicieron', 'eres', 'fuiste', 'estas', 'sirve',
                'sirves', 'sabes', 'quiero', 'quisiera', 'algo', 'otra', 'otro', 'cual', 'cuales',
                'hablame', 'hablar', 'dame', 'explica', 'explicame', 'explicar'];

  function normaliza(s) {
    return (s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }
  function palabras(s) {
    return normaliza(s).split(' ').filter(function (w) { return w.length > 2 && VACIAS.indexOf(w) === -1; });
  }
  /* palabras que el visitante escribió con mayúscula: pueden ser nombres propios sueltos
     («Francia») o cosas del propio aparato («Júpiter»). Se decide mirando la ficha. */
  function palabrasCapitalizadas(s) {
    return (s || '').split(/\s+/).map(function (bruto) {
      var limpio = bruto.replace(/[¿?¡!.,;:()"']/g, '');
      if (!limpio || !/^[A-ZÁÉÍÓÚÑ]/.test(limpio)) return null;
      var w = normaliza(limpio);
      if (w.length < 3 || VACIAS.indexOf(w) !== -1) return null;
      return w;
    }).filter(Boolean);
  }

  /* todas las palabras útiles, incluidas las que el mapa de sinónimos usa
     («dónde», «quién», «cuándo»): sin esto, «¿dónde te posaste?» no encontraba sección */
  function palabrasBrutas(s) {
    return normaliza(s).split(' ').filter(function (w) { return w.length > 2; });
  }

  function palabrasSinNombres(s) {
    return (s || '').split(/\s+/).map(function (bruto) {
      var limpio = bruto.replace(/[¿?¡!.,;:()"']/g, '');
      if (!limpio || /^[A-ZÁÉÍÓÚÑ]/.test(limpio)) return null;
      var w = normaliza(limpio);
      if (w.length < 3 || VACIAS.indexOf(w) !== -1) return null;
      return w;
    }).filter(Boolean);
  }

  function cargarIndice() {
    if (indice) return Promise.resolve(indice);
    return fetch('kb/indice.json')
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { indice = j; return j; });
  }
  function cargarFicha(ruta) {
    if (fichasCargadas[ruta]) return Promise.resolve(fichasCargadas[ruta]);
    return fetch(ruta).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function (t) { fichasCargadas[ruta] = t; return t; });
  }

  function puntuar(ficha, terminos) {
    var texto = normaliza([ficha.titulo, (ficha.alias || []).join(' '),
      (ficha.palabras_clave || []).join(' '), ficha.resumen, ficha.cuerpo].join(' '));
    var puntos = 0;
    terminos.forEach(function (t) {
      if (texto.indexOf(t) !== -1) puntos += 2;
      if (normaliza(ficha.titulo).indexOf(t) !== -1) puntos += 3;
    });
    return puntos;
  }

  function secciones(md) {
    return md.split(/\n##\s+/).slice(1).map(function (p) {
      var i = p.indexOf('\n');
      return { titulo: (i === -1 ? p : p.slice(0, i)).trim(), cuerpo: (i === -1 ? '' : p.slice(i + 1)).trim() };
    });
  }
  function sinFormato(t) {
    return t.replace(/\*\*/g, '').replace(/`/g, '').replace(/^[-*]\s+/gm, '· ').replace(/\n{2,}/g, '\n').trim();
  }

  var SECCION_POR_TERMINO = [
    { re: /^(quien|quienes|trabajo|trabajaron|trabajaba|equipo|cientifico|cientificos|investigador|investigadores|persona|personas|gente|nombre|construyo|diseno|creo)$/, sec: /^Personas$/i },
    { re: /^(donde|lugar|sitio|ahora|hoy|posicion|coordenadas|encuentra|encuentras|estas|quedaste|rodea|rodeaba|rodean|alrededor|alrededores|paisaje|entorno|vista)$/, sec: /^Dónde está hoy$/i },
    { re: /^(llego|llegaste|lanzamiento|lanzaron|despego|viaje|aterrizo|aterrizaste|aterrizaje|llegada|cohete|salida)$/, sec: /^Cómo llegó$/i },
    { re: /^(descubrio|descubriste|descubrimiento|hallazgo|encontro|encontraste|resultado|resultados|ciencia|cientifica|serviste)$/, sec: /^Qué descubrió$/i },
    { re: /^(pesa|pesas|peso|pesaba|pesabas|pesaban|pesaste|masa|mide|mides|medias|media|medías|tamano|tamano|instrumento|instrumentos|potencia|tecnico|tecnicos|datos|cifra|cifras)$/, sec: /^Datos técnicos$/i },
    { re: /^(hacia|hacias|dia|dias|trabajaba|haciais|rutina|mision|hice|hizo|hiciste|hicieron|hacian|estuvo|estuviste|estuvieron|estuvimos)$/, sec: /^Qué hacía$/i }
  ];
  /* preguntas de identidad: «¿quién eres?» no pregunta por la tripulación */
  var SECCION_IDENTIDAD = /quien\s+(eres|es|soy|fue)|que\s+eres|presentate|identificate|como\s+te\s+llamas|quien\s+soy/;
  function seccionForzada(texto) {
    return SECCION_IDENTIDAD.test(normaliza(texto)) ? /^Qué es$/i : null;
  }

  function seccionPedida(terminos) {
    for (var i = 0; i < SECCION_POR_TERMINO.length; i++) {
      for (var j = 0; j < terminos.length; j++) {
        if (SECCION_POR_TERMINO[i].re.test(terminos[j])) return SECCION_POR_TERMINO[i].sec;
      }
    }
    return null;
  }

  function mejoresParrafos(cuerpo, terminos, enfoque) {
    var bloques = cuerpo.split(/\n\n|\n(?=[-*·])/).map(function (b) { return b.trim(); }).filter(Boolean);
    if (!bloques.length) return cuerpo;
    var foco = enfoque ? normaliza(enfoque) : null;
    var puntuados = bloques.map(function (b, i) {
      var t = normaliza(b), p = 0;
      terminos.forEach(function (w) { if (t.indexOf(w) !== -1) p += 1; });
      if (foco && t.indexOf(foco) !== -1) p += 3;
      return { b: b, p: p, i: i };
    });
    var conPuntos = puntuados.filter(function (x) { return x.p > 0; })
      .sort(function (a, b) { return b.p - a.p; }).slice(0, 3)
      .sort(function (a, b) { return a.i - b.i; });
    return (conPuntos.length ? conPuntos : puntuados.slice(0, 2)).map(function (x) { return x.b; }).join('\n');
  }

  function elegirSeccion(secs, terminos) {
    var pedida = seccionPedida(terminos);
    var mejor = null, mejorPuntos = 0;
    secs.forEach(function (s) {
      if (/^Fuentes$/i.test(s.titulo)) return;
      var texto = normaliza(s.titulo + ' ' + s.cuerpo);
      var p = 0;
      terminos.forEach(function (t) {
        if (normaliza(s.titulo).indexOf(t) !== -1) p += 5;
        if (texto.indexOf(t) !== -1) p += 1;
      });
      if (pedida && pedida.test(s.titulo)) p += 8;
      if (p > mejorPuntos) { mejorPuntos = p; mejor = s; }
    });
    return mejor || secs.filter(function (s) { return /^Qué es$/i.test(s.titulo); })[0] || secs[0] || null;
  }

  function fuentePrincipal(md) {
    var m = md.match(/fuente_principal:\s*"?([^"\n]+)"?/);
    return m ? m[1].trim() : '';
  }

  /* ---------- piezas del widget ---------- */
  function escapar(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function $(id) { return document.getElementById(id); }
  function nivelActual() {
    try {
      var v = JSON.parse(localStorage.getItem('ms_nivel') || '"explorador"');
      return v === 'cientifico' ? 'cientifico' : 'explorador';
    } catch (e) { return 'explorador'; }
  }

  function construir() {
    if ($('ms-widget')) return;
    var caja = document.createElement('div');
    caja.className = 'ms-widget';
    caja.id = 'ms-widget';
    caja.innerHTML =
      '<button type="button" class="ms-burbuja" id="ms-burbuja" aria-expanded="false" aria-controls="ms-panel" aria-label="Preguntar al objeto">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true" width="26" height="26"><path fill="currentColor" d="M4 3h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 4v-4H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 6a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 7 9Zm5 0a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 12 9Zm5 0a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 17 9Z"/></svg>' +
        '<span class="ms-burbuja-etq">Pregúntame</span>' +
      '</button>' +
      '<section class="ms-panel" id="ms-panel" role="dialog" aria-labelledby="ms-panel-titulo" hidden>' +
        '<header class="ms-cabecera">' +
          '<span class="ms-punto" aria-hidden="true"></span>' +
          '<div class="ms-titulos"><strong id="ms-panel-titulo">Memory Signals</strong>' +
          '<span id="ms-panel-sub">pregunta y te contesto con mi ficha</span></div>' +
          '<span class="ms-modo" id="ms-modo">explorar</span>' +
          '<button type="button" class="ms-cerrar" id="ms-cerrar" aria-label="Cerrar la ventana">&times;</button>' +
        '</header>' +
        '<div class="ms-mensajes" id="ms-mensajes" aria-live="polite"></div>' +
        '<form class="ms-form" id="ms-form" autocomplete="off">' +
          '<label for="ms-input" class="oculto">Tu pregunta</label>' +
          '<input type="text" id="ms-input" name="pregunta" maxlength="180" placeholder="¿Qué quieres saber de mí?">' +
          '<button type="submit" class="ms-enviar" aria-label="Enviar pregunta">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true" width="20" height="20"><path fill="currentColor" d="M3 20.5 21 12 3 3.5v6.3l11 2.2-11 2.2Z"/></svg>' +
          '</button>' +
        '</form>' +
        '<p class="ms-pie">Responde con la ficha del objeto y cita la fuente.</p>' +
      '</section>';
    document.body.appendChild(caja);

    $('ms-burbuja').addEventListener('click', function () { panelAbierto ? cerrar() : abrir(); });
    $('ms-cerrar').addEventListener('click', cerrar);
    $('ms-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var entrada = $('ms-input');
      var texto = (entrada.value || '').trim();
      if (!texto || ocupado) return;
      entrada.value = '';
      preguntar(texto);
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && panelAbierto) cerrar();
    });
    /* si el visitante cambia de pantalla, la ventana se cierra sola */
    document.addEventListener('click', function (ev) {
      if (ev.target.closest && ev.target.closest('[data-ir]')) mostrar(false);
    });
  }

  function abrir() {
    construir();
    var p = $('ms-panel');
    if (!p) return;
    p.hidden = false;
    panelAbierto = true;
    $('ms-burbuja').setAttribute('aria-expanded', 'true');
    $('ms-widget').classList.add('abierto');
    document.body.classList.add('chat-abierto');
    refrescarModo();
    setTimeout(function () { var i = $('ms-input'); if (i) i.focus(); }, 60);
  }
  function cerrar() {
    var p = $('ms-panel');
    if (p) p.hidden = true;
    panelAbierto = false;
    if ($('ms-burbuja')) $('ms-burbuja').setAttribute('aria-expanded', 'false');
    if ($('ms-widget')) $('ms-widget').classList.remove('abierto');
    document.body.classList.remove('chat-abierto');
  }
  function mostrar(visible) {
    construir();
    var w = $('ms-widget');
    if (!w) return;
    w.classList.toggle('visible', !!visible);
    if (!visible) cerrar();
  }

  function burbuja(clase, html) {
    var cont = $('ms-mensajes');
    if (!cont) return null;
    var d = document.createElement('div');
    d.className = 'ms-burbuja-txt' + (clase ? ' ' + clase : '');
    d.innerHTML = html;
    cont.appendChild(d);
    cont.scrollTop = cont.scrollHeight;
    return d;
  }

  function pensando() {
    var d = burbuja('objeto pensando', '<span class="ms-puntos"><i></i><i></i><i></i></span>');
    return d;
  }

  function refrescarModo() {
    var etq = document.getElementById('ms-modo');
    if (!etq) return;
    var exp = nivelActual() === 'explorador';
    etq.textContent = exp ? 'modo explorar' : 'modo científico';
    etq.classList.toggle('es-cientifico', !exp);
  }

  function saludar() {
    var cont = $('ms-mensajes');
    if (!cont || !actual) return;
    cont.innerHTML = '';
    var nombre = actual.nombre || 'este aparato';
    /* el modo elegido en la portada cambia también cómo habla el chat */
    var modos = window.__MSmodos || {};
    var modo = modos[nivelActual()] || {};
    var etq = document.getElementById('ms-modo');
    if (etq) {
      etq.textContent = nivelActual() === 'explorador' ? 'modo explorar' : 'modo científico';
      etq.classList.toggle('es-cientifico', nivelActual() !== 'explorador');
    }
    var saludo = modo.saludo || 'Pregúntame lo que quieras de mí: qué hice, quién me construyó o dónde estoy ahora.';
    burbuja('objeto', '<strong>' + escapar(nombre) + '</strong><br>' + escapar(saludo));
    actualizarSugerencias();
  }

  function pintarRespuesta(rec, textoModelo, fuente, verificacion) {
    var html = '';
    if (textoModelo) {
      html += '<p>' + escapar(textoModelo).replace(/\n/g, '<br>') + '</p>';
    } else {
      html += '<strong>' + escapar(rec.ficha.titulo) + (rec.seccion ? ' · ' + escapar(rec.seccion.titulo) : '') + '</strong><br>' +
              escapar(rec.texto).replace(/\n/g, '<br>');
    }
    if (fuente) {
      /* solo se enlaza lo que está cotejado: las URLs del prototipo apuntan a la web
         vieja y algunas ya no existen, así que se citan sin enlace */
      if (verificacion === 'verificado') {
        html += '<span class="ms-fuente">Fuente: <a href="' + escapar(fuente) + '" target="_blank" rel="noopener noreferrer">' +
                escapar(fuente.replace(/^https?:\/\//, '')) + '</a></span>';
      } else {
        html += '<span class="ms-fuente">Fuente: ' + escapar(fuente.replace(/^https?:\/\//, '')) + '</span>';
      }
    }
    if (verificacion !== 'verificado') {
      html += '<span class="ms-aviso">Ficha del prototipo: sin cotejar con la NASA.</span>';
    }
    burbuja('objeto', html);
  }

  /* ---------- la pregunta ---------- */
  function responder(pregunta) {
    var terminos = palabras(pregunta);
    return cargarIndice().then(function (idx) {
      var lista = idx.fichas || [];
      var idActual = actual ? EQUIVALENCIA[actual.id] : null;
      var propia = idActual ? lista.filter(function (f) { return f.id === idActual; })[0] : null;

      var candidatas = lista.map(function (f) { return { f: f, p: puntuar(f, terminos) }; })
        .filter(function (x) { return x.p > 0; })
        .sort(function (a, b) { return b.p - a.p; });

      var elegida = null;
      if (candidatas.length && candidatas[0].p >= 4) elegida = candidatas[0].f;

      if (!elegida) {
        var porNombre = (actual && !propia)
          ? lista.filter(function (f) { return normaliza(f.titulo).indexOf(normaliza(actual.nombre)) !== -1; })[0]
          : null;
        var objetivo = propia || porNombre;
        if (objetivo) {
          return cargarFicha(objetivo.ruta).then(function (md0) {
            var util = secciones(md0).filter(function (s) { return !/^(Personas|Fuentes)$/i.test(s.titulo); })
              .map(function (s) { return s.cuerpo; }).join(' ');
            var texto = normaliza(util);
            var propios = palabrasSinNombres(pregunta);
            /* un nombre propio se acepta solo si el aparato lo repite: así «Júpiter» entra
               y «Francia» (que solo era el país de un investigador) no arrastra la respuesta */
            palabrasCapitalizadas(pregunta).forEach(function (t) {
              var veces = (texto.match(new RegExp('\\b' + t + '\\b', 'g')) || []).length;
              if (veces >= 2) propios.push(t);
            });
            var aciertos = propios.filter(function (t) { return texto.indexOf(t) !== -1; }).length;
            /* los términos que piden sección («dónde», «quién», «cuánto») cuentan aunque sean palabras vacías */
            var deSeccion = palabrasBrutas(pregunta).filter(function (w) { return !!seccionPedida([w]); });
            if (!propios.length || (aciertos === 0 && !deSeccion.length)) return null;
            return preparar(objetivo, md0, propios.concat(deSeccion), actual ? actual.nombre : null,
              seccionForzada(pregunta));
          });
        }
        if (candidatas.length) elegida = candidatas[0].f;
      }
      if (!elegida) return null;
      return cargarFicha(elegida.ruta).then(function (md) { return preparar(elegida, md, terminos); });
    });
  }

  /* cuando la pregunta no encuentra nada (un «hola, ¿quién eres?» del guion), contesta la ficha del
     aparato que está delante: el modelo dirá que no consta si el fragmento no responde */
  function responderDelAparato(pregunta, contexto) {
    return cargarIndice().then(function (idx) {
      var lista = idx.fichas || [];
      var idActual = actual ? EQUIVALENCIA[actual.id] : null;
      var propia = idActual ? lista.filter(function (f) { return f.id === idActual; })[0] : null;
      if (!propia) return null;
      return cargarFicha(propia.ruta).then(function (md) {
        var deSeccion = palabrasBrutas(pregunta).filter(function (w) { return !!seccionPedida([w]); });
        var terminos = palabrasSinNombres(pregunta).concat(deSeccion);
        /* si la pregunta es corta («¿fue difícil?») manda el tema que se está contando en el turno */
        var ctx = contexto || contextoActual();
        if (ctx) {
          terminos = terminos.concat(palabrasBrutas(ctx).filter(function (w) { return w.length > 4; }));
        }
        /* en el respaldo se manda la ficha entera (sin Personas ni Fuentes): así el modelo
           encuentra el dato si está, y sigue negándose si no está */
        var secs = secciones(md);
        var util = secs.filter(function (s) { return !/^(Personas|Fuentes)$/i.test(s.titulo); });
        var forzada = seccionForzada(pregunta);
        var sec = (forzada ? secs.filter(function (s) { return forzada.test(s.titulo); })[0] : null)
          || elegirSeccion(secs, terminos);
        var completo = util.map(function (s) { return '## ' + s.titulo + '\n' + s.cuerpo; }).join('\n\n');
        return {
          ficha: propia,
          seccion: sec,
          texto: sec ? sinFormato(mejoresParrafos(sec.cuerpo, terminos, actual ? actual.nombre : null)).slice(0, 700) : '',
          fragmento: sinFormato(completo).slice(0, 3500),
          fuente: fuentePrincipal(md) || propia.fuente_principal || '',
          verificacion: propia.verificacion
        };
      });
    });
  }

  function preparar(ficha, md, terminos, enfoque, forzada) {
    var secs = secciones(md);
    var sec = (forzada ? secs.filter(function (s) { return forzada.test(s.titulo); })[0] : null)
      || elegirSeccion(secs, terminos);
    var fragmento = sec ? mejoresParrafos(sec.cuerpo, terminos, enfoque) : md;
    return {
      ficha: ficha,
      seccion: sec,
      texto: sinFormato(fragmento).slice(0, 700),
      fragmento: sinFormato(fragmento).slice(0, 3500),
      fuente: fuentePrincipal(md) || ficha.fuente_principal || '',
      verificacion: ficha.verificacion
    };
  }

  function preguntar(texto, deSugerencia) {
    if (!texto || ocupado) return;
    if (!panelAbierto) abrir();
    ocupado = true;
    burbuja('visita', escapar(texto));
    var esperando = pensando();

    responder(texto).then(function (rec) {
      return rec || responderDelAparato(texto, contextoActual());
    }).then(function (rec) {
      if (!rec) {
        if (esperando) esperando.remove();
        burbuja('objeto', 'Eso no consta en mi ficha. Pregúntame por lo que hice, quién me construyó o dónde estoy.');
        return;
      }
      if (esperando) esperando.remove();
      var esperando2 = pensando();
      var ctx = contextoActual();
      var fragmento = rec.fragmento + (ctx ? '\n\nLO QUE ACABO DE DECIRLE AL VISITANTE:\n' + ctx : '');
      return fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: texto,
          ficha: rec.ficha.titulo,
          fragmento: fragmento,
          nivel: nivelActual()
        })
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (j) {
        if (esperando2) esperando2.remove();
        pintarRespuesta(rec, (j && j.respuesta) || '', rec.fuente, rec.verificacion);
      }).catch(function () {
        /* sin modelo: la ficha responde tal cual, que es mejor que un error */
        if (esperando2) esperando2.remove();
        pintarRespuesta(rec, '', rec.fuente, rec.verificacion);
      });
    }).catch(function (e) {
      if (esperando) esperando.remove();
      burbuja('objeto', 'No he podido consultar la base de conocimiento (' + escapar(e.message) + ').');
    }).then(function () {
      ocupado = false;
    });
  }

  /* lo que el aparato está diciendo ahora mismo en el contenido, para que la respuesta encaje */
  function contextoActual() {
    var e = window.__MS, a = e && e.aparato;
    if (!a || !a.turnos) return '';
    var t = a.turnos[e.turno || 0];
    if (!t) return '';
    var nivel = nivelActual();
    return (t.pregunta || '') + ' ' + (t['texto_' + nivel] || t.texto_explorador || '');
  }

  /* responde con la ficha y, si el servidor puede, con el modelo.
     Devuelve { rec, modelo } para poder pintarlo aquí o donde lo pida el contenido. */
  function resolver(texto, contexto) {
    return responder(texto).then(function (rec) {
      return rec || responderDelAparato(texto, contexto);
    }).then(function (rec) {
      if (!rec) return { rec: null, modelo: '' };
      var fragmento = rec.fragmento;
      var ctx = contexto || contextoActual();
      if (ctx) fragmento += '\n\nLO QUE ACABO DE DECIRLE AL VISITANTE:\n' + ctx;
      return fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pregunta: texto,
          ficha: rec.ficha.titulo,
          fragmento: fragmento,
          nivel: nivelActual()
        })
      }).then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      }).then(function (j) { return { rec: rec, modelo: (j && j.respuesta) || '' }; })
        .catch(function () { return { rec: rec, modelo: '' }; });
    });
  }

  /* las preguntas sugeridas salen del turno que se está viendo: contenido y chat dicen lo mismo */
  var giroSugerencias = 0;
  function sugerenciasDelTurno() {
    var e = window.__MS;
    var a = e && e.aparato;
    var modos = window.__MSmodos || {};
    var modo = modos[nivelActual()] || {};
    var base = (modo.sugerencias || []).slice(0, 3);
    if (!a || !a.turnos) return base.length ? base : null;
    /* del guion solo valen las que son preguntas: «soy un visitante» es una respuesta, no una pregunta.
       se juntan las de todos los turnos y se van rotando, para no proponer siempre las mismas */
    var preguntas = [];
    a.turnos.forEach(function (t) {
      (t.opciones || []).forEach(function (o) {
        if (o.indexOf('?') !== -1 && preguntas.indexOf(o) === -1) preguntas.push(o);
      });
    });
    if (!preguntas.length) return base.length ? base : null;
    var desde = (giroSugerencias++ % preguntas.length);
    var dos = preguntas.slice(desde, desde + 2);
    if (dos.length < 2) dos = dos.concat(preguntas.slice(0, 2 - dos.length));
    return dos.concat(base.filter(function (b) { return dos.indexOf(b) === -1; }).slice(0, 1));
  }

  function actualizarSugerencias() {
    var cont = $('ms-mensajes');
    if (!cont) return;
    var viejo = cont.querySelector('.ms-sugerencias');
    if (viejo) viejo.remove();
    var sugerencias = sugerenciasDelTurno();
    if (!sugerencias) {
      var modos = window.__MSmodos || {};
      sugerencias = (modos[nivelActual()] || {}).sugerencias || ['¿Qué hiciste?', '¿Quién te construyó?', '¿Dónde estás ahora?'];
    }
    var caja = document.createElement('div');
    caja.className = 'ms-sugerencias';
    sugerencias.forEach(function (t) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = t;
      b.addEventListener('click', function () { preguntar(t, true); });
      caja.appendChild(b);
    });
    cont.appendChild(caja);
  }

  /* el panel del chat puede ir en su columna de la ficha o volver al botón flotante */
  function ancorar(destino) {
    construir();
    var p = $('ms-panel'), w = $('ms-widget');
    if (!p || !w) return;
    if (destino) {
      if (p.parentNode !== destino) destino.appendChild(p);
      p.classList.add('en-columna');
      p.hidden = false;
      w.classList.add('en-columna');
    } else {
      if (p.parentNode !== w) w.appendChild(p);
      p.classList.remove('en-columna');
      w.classList.remove('en-columna');
    }
  }

  function activar(a) {
    var mismo = !!(actual && a && actual.id === a.id);
    actual = a;
    mostrar(!!a);
    if (a) {
      construir();
      var t = $('ms-panel-titulo'), s = $('ms-panel-sub');
      if (t) t.textContent = a.nombre || 'Memory Signals';
      if (s) s.textContent = 'habla conmigo: te contesto con mi ficha';
      /* al cambiar de turno no se borra la conversación: solo se refrescan las sugerencias */
      if (mismo) { actualizarSugerencias(); refrescarModo(); } else { saludar(); }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { construir(); mostrar(false); });
  } else {
    construir(); mostrar(false);
  }

  window.ChatObjeto = { activar: activar, preguntar: preguntar, resolver: resolver, ancorar: ancorar, abrir: abrir, cerrar: cerrar };
})();
