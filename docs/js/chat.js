/* Memory Signals — chatbot del objeto.
   Responde con la base de conocimiento (kb/): índice de 74 fichas + la ficha que toque.
   Sin modelo de lenguaje y sin inventar: recupera el fragmento que responde y cita la fuente.
   Si la ficha viene del prototipo y no está cotejada, lo advierte. */
(function () {
  'use strict';

  var indice = null;
  var actual = null;          // aparato abierto en la app
  var fichasCargadas = {};    // caché de .md ya leídos

  /* aparato de la app -> id de ficha en la base de conocimiento */
  var EQUIVALENCIA = {
    surveyor3: 'surveyor-3',
    lrv17: 'rover-lunar-lrv',
    opportunity: 'spirit-opportunity',
    insight: 'phoenix-insight',
    voyager1: null
  };

  var VACIAS = ['que', 'como', 'cuando', 'donde', 'quien', 'cuanto', 'cuanta', 'porque', 'para',
                'los', 'las', 'del', 'una', 'unos', 'unas', 'este', 'esta', 'esto', 'eso', 'esa',
                'the', 'and', 'con', 'sin', 'mas', 'muy', 'fue', 'era', 'son', 'hay',
                'saber', 'dime', 'cuentame', 'puedes', 'sobre', 'tiene', 'tienen', 'hace', 'hacia',
                'hecho', 'hecha', 'hiciste', 'hicieron', 'eres', 'fuiste', 'estas', 'estas', 'sirve',
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

  /* igual, pero descartando los nombres propios (van en mayúscula): «Francia», «Surveyor»…
     esos los usa la búsqueda de fichas, no la comprobación de si la pregunta va del aparato abierto */
  function palabrasSinNombres(s) {
    return (s || '').split(/\s+/).map(function (bruto) {
      var limpio = bruto.replace(/[¿?¡!.,;:()"']/g, '');
      if (!limpio) return null;
      if (/^[A-ZÁÉÍÓÚÑ]/.test(limpio)) return null;
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

  /* puntúa cada ficha contra las palabras de la pregunta */
  function puntuar(ficha, terminos) {
    var campos = [ficha.titulo, (ficha.alias || []).join(' '), (ficha.palabras_clave || []).join(' '), ficha.resumen, ficha.cuerpo]
      .join(' ');
    var texto = normaliza(campos);
    var puntos = 0;
    terminos.forEach(function (t) {
      if (texto.indexOf(t) !== -1) puntos += 2;
      if (normaliza(ficha.titulo).indexOf(t) !== -1) puntos += 3;
    });
    return puntos;
  }

  /* separa la ficha en secciones "## Título" */
  function secciones(md) {
    var partes = md.split(/\n##\s+/);
    var salida = [];
    partes.slice(1).forEach(function (p) {
      var i = p.indexOf('\n');
      var titulo = (i === -1 ? p : p.slice(0, i)).trim();
      var cuerpo = (i === -1 ? '' : p.slice(i + 1)).trim();
      salida.push({ titulo: titulo, cuerpo: cuerpo });
    });
    return salida;
  }

  function sinFormato(t) {
    return t.replace(/\*\*/g, '').replace(/`/g, '').replace(/^[-*]\s+/gm, '· ').replace(/\n{2,}/g, '\n').trim();
  }

  function recorta(t, max) {
    t = sinFormato(t);
    if (t.length <= max) return t;
    var corte = t.slice(0, max);
    var punto = corte.lastIndexOf('. ');
    if (punto > max * 0.5) corte = corte.slice(0, punto + 1);
    return corte + ' […]';
  }

  /* sinónimos: el visitante pregunta «quién trabajó», la ficha lo cuenta en «Personas» */
  var SECCION_POR_TERMINO = [
    { re: /^(quien|quienes|trabajo|trabajaron|trabajaba|equipo|cientifico|cientificos|investigador|investigadores|persona|personas|gente|nombre)$/, sec: /^Personas$/i },
    { re: /^(donde|lugar|sitio|ahora|hoy|posicion|coordenadas|encuentra|encuentras|estas)$/, sec: /^Dónde está hoy$/i },
    { re: /^(llego|llegaste|lanzamiento|lanzaron|despego|viaje|aterrizo|aterrizaste|aterrizaje|llegada|cohete)$/, sec: /^Cómo llegó$/i },
    { re: /^(descubrio|descubriste|descubrimiento|hallazgo|encontro|encontraste|resultado|resultados|ciencia|cientifica)$/, sec: /^Qué descubrió$/i },
    { re: /^(pesa|pesas|peso|masa|mide|mides|tamano|instrumento|instrumentos|potencia|tecnico|tecnicos|datos|cifra|cifras)$/, sec: /^Datos técnicos$/i },
    { re: /^(hacia|hacias|dia|dias|trabajaba|haciais|rutina|mision)$/, sec: /^Qué hacía$/i }
  ];
  function seccionPedida(terminos) {
    for (var i = 0; i < SECCION_POR_TERMINO.length; i++) {
      for (var j = 0; j < terminos.length; j++) {
        if (SECCION_POR_TERMINO[i].re.test(terminos[j])) return SECCION_POR_TERMINO[i].sec;
      }
    }
    return null;
  }

  /* dentro de la sección, quedarse con los párrafos que responden a la pregunta */
  function mejoresParrafos(cuerpo, terminos, enfoque) {
    var bloques = cuerpo.split(/\n\n|\n(?=[-*·])/).map(function (b) { return b.trim(); }).filter(Boolean);
    if (!bloques.length) return cuerpo;
    var foco = enfoque ? normaliza(enfoque) : null;
    var puntuados = bloques.map(function (b, i) {
      var t = normaliza(b), p = 0;
      terminos.forEach(function (w) { if (t.indexOf(w) !== -1) p += 1; });
      /* si la ficha cubre varios aparatos, mandan los párrafos del que está delante */
      if (foco && t.indexOf(foco) !== -1) p += 3;
      return { b: b, p: p, i: i };
    });
    var conPuntos = puntuados.filter(function (x) { return x.p > 0; })
                             .sort(function (a, b) { return b.p - a.p; }).slice(0, 3)
                             .sort(function (a, b) { return a.i - b.i; });
    if (conPuntos.length) return conPuntos.map(function (x) { return x.b; }).join('\n');
    return bloques.slice(0, 2).join('\n');
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
    if (mejor) return mejor;
    return secs.filter(function (s) { return /^Qué es$/i.test(s.titulo); })[0] || secs[0] || null;
  }

  function fuentePrincipal(md) {
    var m = md.match(/fuente_principal:\s*"?([^"\n]+)"?/);
    return m ? m[1].trim() : '';
  }

  function insertar(clase, html) {
    var cont = document.getElementById('chat-respuesta');
    if (!cont) return null;
    var d = document.createElement('div');
    d.className = 'burbuja' + (clase ? ' ' + clase : '');
    d.innerHTML = html;
    cont.appendChild(d);
    cont.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    return d;
  }

  function escapar(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function sinFicha() {
    insertar('', 'No tengo ficha de eso. Solo respondo de los objetos del catálogo y de sus fuentes: la Luna, Marte y el espacio profundo.');
  }

  function contestar(ficha, md, terminos, enfoque) {
    var secs = secciones(md);
    var sec = elegirSeccion(secs, terminos);
    var cuerpo = sec ? recorta(mejoresParrafos(sec.cuerpo, terminos, enfoque), 480) : recorta(md, 480);
    var fuente = fuentePrincipal(md) || ficha.fuente_principal || '';
    var html = '<strong>' + escapar(ficha.titulo) + (sec ? ' · ' + escapar(sec.titulo) : '') + '</strong><br>' +
               escapar(cuerpo).replace(/\n/g, '<br>');
    if (fuente) {
      html += '<span class="fuente">Fuente: <a href="' + escapar(fuente) + '" target="_blank" rel="noopener noreferrer">' +
              escapar(fuente.replace(/^https?:\/\//, '')) + '</a></span>';
    }
    if (ficha.verificacion !== 'verificado') {
      html += '<span class="aviso">Ficha del prototipo: todavía no está cotejada con la NASA.</span>';
    }
    insertar('', html);

    var otras = secs.filter(function (s) { return s !== sec && !/^Fuentes$/i.test(s.titulo); })
                    .slice(0, 3).map(function (s) { return s.titulo; });
    if (otras.length) {
      var chips = document.createElement('div');
      chips.className = 'acciones';
      otras.forEach(function (t) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'secundario';
        b.style.padding = '10px 16px'; b.style.fontSize = '.86rem';
        b.textContent = t;
        b.addEventListener('click', function () { preguntar(t + ' de ' + ficha.titulo); });
        chips.appendChild(b);
      });
      document.getElementById('chat-respuesta').appendChild(chips);
    }
  }

  function responder(pregunta) {
    var terminos = palabras(pregunta);
    insertar('pregunta', escapar(pregunta));

    return cargarIndice().then(function (idx) {
      var lista = idx.fichas || [];
      var idActual = actual ? EQUIVALENCIA[actual.id] : null;
      var propia = idActual ? lista.filter(function (f) { return f.id === idActual; })[0] : null;

      // ¿la pregunta va de otro objeto?
      var candidatas = lista.map(function (f) { return { f: f, p: puntuar(f, terminos) }; })
        .filter(function (x) { return x.p > 0; })
        .sort(function (a, b) { return b.p - a.p; });

      var elegida = null;
      var mejorPuntos = candidatas.length ? candidatas[0].p : 0;
      if (mejorPuntos >= 4) elegida = candidatas[0].f;

      // si la pregunta no nombra otro objeto, se responde del que está delante,
      // pero solo si sus palabras aparecen de verdad en la ficha
      if (!elegida) {
        var porNombre = (actual && !propia)
          ? lista.filter(function (f) { return normaliza(f.titulo).indexOf(normaliza(actual.nombre)) !== -1; })[0]
          : null;
        var objetivo = propia || porNombre;
        if (objetivo) {
          return cargarFicha(objetivo.ruta).then(function (md0) {
            /* la coincidencia tiene que estar en el contenido del aparato, no en la lista de personas
               ni en las fuentes: si no, «¿la capital de Francia?» acabaría respondiendo por «Francia»
               que solo aparece como país del investigador del sismómetro */
            var util = secciones(md0).filter(function (s) { return !/^(Personas|Fuentes)$/i.test(s.titulo); })
                                     .map(function (s) { return s.cuerpo; }).join(' ');
            var texto = normaliza(util);
            var propios = palabrasSinNombres(pregunta);
            var aciertos = propios.filter(function (t) { return texto.indexOf(t) !== -1; }).length;
            var haySeccion = !!seccionPedida(propios);
            if (!propios.length || (aciertos === 0 && !haySeccion)) { sinFicha(); return; }
            return contestar(objetivo, md0, propios, actual ? actual.nombre : null);
          });
        }
        if (candidatas.length) elegida = candidatas[0].f;
      }

      if (!elegida) { sinFicha(); return; }

      return cargarFicha(elegida.ruta).then(function (md) {
        contestar(elegida, md, terminos);
      });

    }).catch(function (e) {
      insertar('', 'No he podido consultar la base de conocimiento (' + escapar(e.message) + ').');
    });
  }

  function preguntar(texto) {
    if (!texto || !texto.trim()) return;
    var entrada = document.getElementById('chat-input');
    if (entrada) entrada.value = '';
    responder(texto.trim());
  }

  function conectar() {
    var form = document.getElementById('chat-form');
    var entrada = document.getElementById('chat-input');
    if (!form || !entrada) return;
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      preguntar(entrada.value);
    });
    cargarIndice().catch(function () {});   // precalentar el índice
  }

  function activar(a) { actual = a; }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', conectar);
  else conectar();

  window.ChatObjeto = { activar: activar, preguntar: preguntar };
})();
