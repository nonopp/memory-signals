/* Memory Signals · idiomas
   Tres idiomas de serie: español, inglés y alemán. El texto de la aplicación sale de aquí;
   el contenido de los objetos, de datos/contenido.<idioma>.json; y la voz, de la voz del
   sistema que corresponda a ese idioma. */
(function () {
  'use strict';

  var CLAVE = 'ms_idioma';
  var IDIOMAS = ['es', 'en', 'de'];
  var NOMBRES = { es: 'Español', en: 'English', de: 'Deutsch' };

  var TEXTOS = {
    es: {
      'inicio': 'Volver al inicio',
      'idioma': 'Idioma',
      'explorador': 'Explorador',
      'cientifico': 'Científico',
      'modo.explorador': 'Modo explorador',
      'modo.cientifico': 'Modo científico',
      'voz.titulo': 'Activar o silenciar la voz',
      'participa.titulo': 'Propón un objeto olvidado y aporta material',
      'participa': 'Participa',
      'privacidad': 'Privacidad',
      'que.es.esto': '¿Qué es esto?',
      'mirar.ventana': 'Mirar por la ventana',
      'girar': 'Parar o reanudar el giro',
      'pie.nivel.explorador': 'modo explorar · información sencilla',
      'pie.nivel.cientifico': 'modo científico · información especializada',
      'pie.version': 'versión de la aplicación',
      'chat.preguntame': 'Pregúntame',
      'chat.abrir': 'Preguntar al objeto',
      'chat.sub': 'pregunta y te contesto con mi ficha',
      'chat.sub.objeto': 'habla conmigo: te contesto con mi ficha',
      'chat.modo.explorar': 'modo explorar',
      'chat.modo.cientifico': 'modo científico',
      'chat.placeholder': '¿Qué quieres saber de mí?',
      'chat.placeholder.escucho': 'Te escucho…',
      'chat.enviar': 'Enviar pregunta',
      'chat.cerrar': 'Cerrar la ventana',
      'chat.voz.on': 'Dejar de leer las respuestas',
      'chat.voz.off': 'Leer las respuestas en voz alta',
      'chat.micro': 'Dictar la pregunta',
      'chat.micro.parar': 'Parar de dictar',
      'chat.pie': 'Responde con la ficha del objeto y cita la fuente.',
      'chat.fuente': 'Fuente: ',
      'chat.aviso': 'Ficha del prototipo: sin cotejar con la NASA.',
      'chat.no.consta': 'Eso no consta en mi ficha. Pregúntame por lo que hice, quién me construyó o dónde estoy.',
      'chat.no.consta.voz': 'Eso no consta en mi ficha.',
      'chat.error.bd': 'No he podido consultar la base de conocimiento',
      'micro.preparando': 'Preparando el micrófono…',
      'micro.habla': 'Habla ahora y pulsa el micrófono otra vez al terminar.',
      'micro.escuchando': 'Escuchando la grabación…',
      'micro.revisa': 'Revisa la pregunta y pulsa enviar.',
      'micro.vacio': 'No te he oído nada. Prueba otra vez o escríbela.',
      'micro.sin.permiso': 'No has dado permiso al micrófono. Puedes escribir la pregunta.',
      'micro.sin.micro': 'No he podido abrir el micrófono. Escribe la pregunta.',
      'micro.no.graba': 'Este navegador no puede grabar. Escribe la pregunta.',
      'micro.no.transcribe': 'No se ha podido transcribir. Escribe la pregunta.',
      'micro.saturado': 'El transcriptor está saturado. Escribe la pregunta o prueba en un momento.',
      'saludo': 'Hola, soy {objeto}. Pregúntame lo que quieras de mí.',
      'sigues.ahi': '¿Sigues ahí? ',
      'ficha.cerrar': 'Cerrar',
            "titulo": "Hay cosas nuestras<br>todavía ahí fuera",
      'subtitulo': 'Memory Signals · objetos abandonados de la NASA',
      'destino.titulo': 'Elige destino',
      'destino.otro': '← Elegir otro destino',
      'destino.cambiar': 'Cambiar de destino',
      'destino.volver': '← Volver a los objetos',
      'crucero.titulo': 'En crucero',
      'pausa.titulo': 'Un momento de calma',
      'pausa.dejarlo': 'Dejarlo aquí',
      'objeto.brilla': 'Algo brilla ahí abajo',
      'objeto.ficha': 'Ver ficha y fuentes',
      'objeto.nivel': 'Nivel de lectura',
      'que.titulo': 'Qué estás viendo',
      "que.p1": "Esto es <strong>Memory Signals</strong>, un proyecto del reto <em>NASA's Discarded Equipment Storytelling</em> del NASA Space Apps Challenge 2026.",
      'que.p2': 'La NASA dejó en la Luna, en Marte y más allá equipo que ya no funciona pero que sigue en su sitio. Aquí puedes viajar hasta allí y hablar con esos objetos: te cuentan cómo llegaron, qué hacían cada día, qué descubrieron y quién trabajó en su misión.',
      "que.l1": "<strong>Dos niveles de lectura:</strong> Explorador y Científico. El conmutador está siempre arriba a la derecha y no reinicia el viaje.",
      "que.l2": "<strong>Todo verificado:</strong> cada turno tiene su fuente (NASA, JPL, LPI). Si un dato no se puede citar, no se cuenta.",
      "que.l3": "<strong>Ampliable:</strong> el contenido vive en <code>datos/contenido.json</code>. Cualquiera puede añadir un objeto sin tocar el motor.",
      "que.l4": "<strong>Sin escribir nada:</strong> toda la navegación es con clics o toques. La voz es opcional.",
      'pie.datos': 'Memory Signals · NASA Space Apps Challenge 2026 · datos de NASA, JPL y LPI · modelos 3D de NASA 3D Resources',
      "chat.saludo": "Pregúntame lo que quieras de mí: qué hice, quién me construyó o dónde estoy ahora.",
      "chat.sug1": "¿Qué hiciste?",
      "chat.sug2": "¿Quién te construyó?",
      "chat.sug3": "¿Dónde estás ahora?",
      "chat.micro.titulo": "Dictar la pregunta con el micrófono",
      "chat.escribe": "Escribe la pregunta.",
      'comun': 'Común'
    },
    en: {
      'inicio': 'Back to the start',
      'idioma': 'Language',
      'explorador': 'Explorer',
      'cientifico': 'Scientist',
      'modo.explorador': 'Explorer mode',
      'modo.cientifico': 'Scientist mode',
      'voz.titulo': 'Turn the voice on or off',
      'participa.titulo': 'Propose a forgotten object and contribute material',
      'participa': 'Take part',
      'privacidad': 'Privacy',
      'que.es.esto': 'What is this?',
      'mirar.ventana': 'Look out of the window',
      'girar': 'Pause or resume the rotation',
      'pie.nivel.explorador': 'explorer mode · plain information',
      'pie.nivel.cientifico': 'scientist mode · specialised information',
      'pie.version': 'application version',
      'chat.preguntame': 'Ask me',
      'chat.abrir': 'Ask the object',
      'chat.sub': 'ask and I answer with my record',
      'chat.sub.objeto': 'talk to me: I answer with my record',
      'chat.modo.explorar': 'explorer mode',
      'chat.modo.cientifico': 'scientist mode',
      'chat.placeholder': 'What do you want to know about me?',
      'chat.placeholder.escucho': 'I am listening…',
      'chat.enviar': 'Send question',
      'chat.cerrar': 'Close the window',
      'chat.voz.on': 'Stop reading the answers',
      'chat.voz.off': 'Read the answers aloud',
      'chat.micro': 'Dictate the question',
      'chat.micro.parar': 'Stop dictating',
      'chat.pie': 'Answers come from the object record and cite the source.',
      'chat.fuente': 'Source: ',
      'chat.aviso': 'Prototype record: not checked against NASA.',
      'chat.no.consta': 'That is not in my record. Ask me what I did, who built me or where I am.',
      'chat.no.consta.voz': 'That is not in my record.',
      'chat.error.bd': 'I could not reach the knowledge base',
      'micro.preparando': 'Getting the microphone ready…',
      'micro.habla': 'Speak now and press the microphone again when you finish.',
      'micro.escuchando': 'Listening to the recording…',
      'micro.revisa': 'Check the question and press send.',
      'micro.vacio': 'I did not hear anything. Try again or type it.',
      'micro.sin.permiso': 'You have not allowed the microphone. You can type the question.',
      'micro.sin.micro': 'I could not open the microphone. Type the question.',
      'micro.no.graba': 'This browser cannot record. Type the question.',
      'micro.no.transcribe': 'The recording could not be transcribed. Type the question.',
      'micro.saturado': 'The transcriber is busy. Type the question or try in a moment.',
      'saludo': 'Hello, I am {objeto}. Ask me anything you want to know about me.',
      'sigues.ahi': 'Are you still there? ',
      'ficha.cerrar': 'Close',
            "titulo": "Some of our things<br>are still out there",
      'subtitulo': 'Memory Signals · abandoned NASA objects',
      'destino.titulo': 'Choose a destination',
      'destino.otro': '← Choose another destination',
      'destino.cambiar': 'Change destination',
      'destino.volver': '← Back to the objects',
      'crucero.titulo': 'In transit',
      'pausa.titulo': 'A moment of calm',
      'pausa.dejarlo': 'Pause here',
      'objeto.brilla': 'Something is shining down there',
      'objeto.ficha': 'See record and sources',
      'objeto.nivel': 'Reading level',
      'que.titulo': 'What you are seeing',
      "que.p1": "This is <strong>Memory Signals</strong>, a project for the <em>NASA's Discarded Equipment Storytelling</em> challenge of the NASA Space Apps Challenge 2026.",
      'que.p2': 'NASA left equipment on the Moon, on Mars and further out that no longer works but is still there. Here you can travel to it and talk to those objects: they tell you how they got there, what they did every day, what they found out and who worked on their mission.',
      "que.l1": "<strong>Two reading levels:</strong> Explorer and Scientist. The switch is always at the top right and does not restart the journey.",
      "que.l2": "<strong>All verified:</strong> every turn has its source (NASA, JPL, LPI). If a fact cannot be cited, it is not told.",
      "que.l3": "<strong>Extensible:</strong> the content lives in <code>datos/contenido.json</code>. Anyone can add an object without touching the engine.",
      "que.l4": "<strong>No typing needed:</strong> all navigation is by click or tap. The voice is optional.",
      'pie.datos': 'Memory Signals · NASA Space Apps Challenge 2026 · NASA, JPL and LPI data · 3D models from NASA 3D Resources',
      "chat.saludo": "Ask me anything: what I did, who built me or where I am now.",
      "chat.sug1": "What did you do?",
      "chat.sug2": "Who built you?",
      "chat.sug3": "Where are you now?",
      "chat.micro.titulo": "Dictate the question with the microphone",
      "chat.escribe": "Type the question.",
      'comun': 'Shared'
    },
    de: {
      'inicio': 'Zurück zum Anfang',
      'idioma': 'Sprache',
      'explorador': 'Entdecker',
      'cientifico': 'Wissenschaft',
      'modo.explorador': 'Entdecker-Modus',
      'modo.cientifico': 'Wissenschafts-Modus',
      'voz.titulo': 'Stimme ein- oder ausschalten',
      'participa.titulo': 'Schlage ein vergessenes Objekt vor und liefere Material',
      'participa': 'Mitmachen',
      'privacidad': 'Datenschutz',
      'que.es.esto': 'Was ist das?',
      'mirar.ventana': 'Aus dem Fenster schauen',
      'girar': 'Drehung anhalten oder fortsetzen',
      'pie.nivel.explorador': 'Entdecker-Modus · einfache Informationen',
      'pie.nivel.cientifico': 'Wissenschafts-Modus · fachliche Informationen',
      'pie.version': 'Version der Anwendung',
      'chat.preguntame': 'Frag mich',
      'chat.abrir': 'Das Objekt fragen',
      'chat.sub': 'frag und ich antworte mit meiner Akte',
      'chat.sub.objeto': 'sprich mit mir: ich antworte mit meiner Akte',
      'chat.modo.explorar': 'Entdecker-Modus',
      'chat.modo.cientifico': 'Wissenschafts-Modus',
      'chat.placeholder': 'Was möchtest du über mich wissen?',
      'chat.placeholder.escucho': 'Ich höre zu…',
      'chat.enviar': 'Frage senden',
      'chat.cerrar': 'Fenster schließen',
      'chat.voz.on': 'Antworten nicht mehr vorlesen',
      'chat.voz.off': 'Antworten vorlesen',
      'chat.micro': 'Frage diktieren',
      'chat.micro.parar': 'Diktat beenden',
      'chat.pie': 'Antwortet mit der Akte des Objekts und nennt die Quelle.',
      'chat.fuente': 'Quelle: ',
      'chat.aviso': 'Prototyp-Akte: nicht mit der NASA abgeglichen.',
      'chat.no.consta': 'Das steht nicht in meiner Akte. Frag mich, was ich getan habe, wer mich gebaut hat oder wo ich bin.',
      'chat.no.consta.voz': 'Das steht nicht in meiner Akte.',
      'chat.error.bd': 'Ich konnte die Wissensbasis nicht abfragen',
      'micro.preparando': 'Mikrofon wird vorbereitet…',
      'micro.habla': 'Sprich jetzt und drücke das Mikrofon am Ende noch einmal.',
      'micro.escuchando': 'Aufnahme wird angehört…',
      'micro.revisa': 'Prüfe die Frage und drücke Senden.',
      'micro.vacio': 'Ich habe nichts gehört. Versuch es noch einmal oder tippe die Frage.',
      'micro.sin.permiso': 'Du hast das Mikrofon nicht erlaubt. Du kannst die Frage tippen.',
      'micro.sin.micro': 'Ich konnte das Mikrofon nicht öffnen. Tippe die Frage.',
      'micro.no.graba': 'Dieser Browser kann nicht aufnehmen. Tippe die Frage.',
      'micro.no.transcribe': 'Die Aufnahme konnte nicht umgewandelt werden. Tippe die Frage.',
      'micro.saturado': 'Der Umwandler ist ausgelastet. Tippe die Frage oder versuch es gleich noch einmal.',
      'saludo': 'Hallo, ich bin {objeto}. Frag mich alles, was du über mich wissen willst.',
      'sigues.ahi': 'Bist du noch da? ',
      'ficha.cerrar': 'Schließen',
            "titulo": "Manches von uns<br>ist noch da draußen",
      'subtitulo': 'Memory Signals · verlassene Objekte der NASA',
      'destino.titulo': 'Ziel wählen',
      'destino.otro': '← Anderes Ziel wählen',
      'destino.cambiar': 'Ziel wechseln',
      'destino.volver': '← Zurück zu den Objekten',
      'crucero.titulo': 'Unterwegs',
      'pausa.titulo': 'Ein Moment der Ruhe',
      'pausa.dejarlo': 'Hier pausieren',
      'objeto.brilla': 'Da unten glänzt etwas',
      'objeto.ficha': 'Akte und Quellen ansehen',
      'objeto.nivel': 'Lesestufe',
      'que.titulo': 'Was du hier siehst',
      "que.p1": "Das ist <strong>Memory Signals</strong>, ein Projekt zur Aufgabe <em>NASA's Discarded Equipment Storytelling</em> des NASA Space Apps Challenge 2026.",
      'que.p2': 'Die NASA hat auf dem Mond, auf dem Mars und weiter draußen Geräte zurückgelassen, die nicht mehr arbeiten, aber noch dort stehen. Hier kannst du dorthin reisen und mit diesen Objekten sprechen: sie erzählen, wie sie ankamen, was sie jeden Tag taten, was sie entdeckt haben und wer an ihrer Mission mitgearbeitet hat.',
      "que.l1": "<strong>Zwei Lesestufen:</strong> Entdecker und Wissenschaft. Der Schalter ist immer oben rechts und startet die Reise nicht neu.",
      "que.l2": "<strong>Alles belegt:</strong> jede Aussage hat ihre Quelle (NASA, JPL, LPI). Was sich nicht belegen lässt, wird nicht erzählt.",
      "que.l3": "<strong>Erweiterbar:</strong> die Inhalte liegen in <code>datos/contenido.json</code>. Jeder kann ein Objekt ergänzen, ohne den Motor anzufassen.",
      "que.l4": "<strong>Ohne Tippen:</strong> die ganze Navigation läuft über Klicken oder Tippen. Die Stimme ist optional.",
      'pie.datos': 'Memory Signals · NASA Space Apps Challenge 2026 · Daten von NASA, JPL und LPI · 3D-Modelle von NASA 3D Resources',
      "chat.saludo": "Frag mich alles: was ich getan habe, wer mich gebaut hat oder wo ich jetzt bin.",
      "chat.sug1": "Was hast du getan?",
      "chat.sug2": "Wer hat dich gebaut?",
      "chat.sug3": "Wo bist du jetzt?",
      "chat.micro.titulo": "Die Frage mit dem Mikrofon diktieren",
      "chat.escribe": "Tippe die Frage.",
      'comun': 'Gemeinsam'
    }
  };

  /* el idioma del navegador sirve de pista la primera vez */
  function leer() {
    var guardado = null;
    try { guardado = localStorage.getItem(CLAVE); } catch (e) {}
    if (guardado && IDIOMAS.indexOf(guardado) !== -1) return guardado;
    var nav = String(navigator.language || 'es').slice(0, 2).toLowerCase();
    return IDIOMAS.indexOf(nav) !== -1 ? nav : 'es';
  }

  var actual = leer();

  function t(clave, datos) {
    var texto = (TEXTOS[actual] && TEXTOS[actual][clave]) || TEXTOS.es[clave] || clave;
    if (datos) {
      Object.keys(datos).forEach(function (k) { texto = texto.replace('{' + k + '}', datos[k]); });
    }
    return texto;
  }

  function aplicar() {
    document.documentElement.lang = actual;
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n]'), function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-html]'), function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-title]'), function (el) {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-aria]'), function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-idioma]'), function (b) {
      var sel = b.getAttribute('data-idioma') === actual;
      b.classList.toggle('activo', sel);
      b.setAttribute('aria-pressed', sel ? 'true' : 'false');
    });
    var rotulo = document.getElementById('idioma-actual');
    if (rotulo) rotulo.textContent = actual.toUpperCase();
  }

  function poner(idioma) {
    if (IDIOMAS.indexOf(idioma) === -1 || idioma === actual) return;
    actual = idioma;
    try { localStorage.setItem(CLAVE, idioma); } catch (e) {}
    aplicar();
    document.dispatchEvent(new CustomEvent('ms:idioma', { detail: { idioma: idioma } }));
  }

  window.MS_Idioma = {
    idiomas: IDIOMAS,
    nombres: NOMBRES,
    actual: function () { return actual; },
    t: t,
    poner: poner,
    aplicar: aplicar
  };

  /* el selector de la cabecera se conecta aquí mismo */
  function conectarSelector() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-idioma]'), function (b) {
      b.addEventListener('click', function () { poner(b.getAttribute('data-idioma')); });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', conectarSelector);
  } else {
    conectarSelector();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', aplicar);
  } else {
    aplicar();
  }
})();
