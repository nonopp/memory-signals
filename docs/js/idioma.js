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
      'voz.ayuda.titulo': 'La voz',
      'voz.ayuda.texto': 'Lee en voz alta lo que dice el astronauta en cada pantalla. Usa la voz del navegador: no hay que instalar ni descargar nada.',
      'voz.ayuda.subtitulos': 'Los subtítulos siguen visibles con la voz encendida o apagada.',
      'voz.ayuda.estado.on': 'Ahora mismo: voz encendida.',
      'voz.ayuda.estado.off': 'Ahora mismo: voz silenciada.',
      'participa.titulo': 'Propón un objeto olvidado y aporta material',
      'participa': 'Participa',
      'participa.oculto': ' · propón un objeto olvidado',
      'doc.titulo': 'Memory Signals · objetos abandonados de la NASA',
      'privacidad': 'Privacidad',
      'pie.indice': 'Índice de objetos',
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
      'chat.sin.datos': 'Eso no está en mi ficha. Pero puedo contarte otras cosas:',
      'chat.sin.aporta': '¿Tienes tú el dato? Cuéntamelo en «Participa»',
      'chat.buscar.fuera': '🔎 Buscar fuera de mi ficha',
      'chat.buscar.buscando': 'buscando fuera de mi ficha…',
      'chat.buscar.externo': 'Esto no está en mi ficha: lo he buscado fuera y viene de estas fuentes.',
      'chat.buscar.nada': 'He buscado fuera y no he encontrado nada que pueda contarte sin inventármelo.',
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
      'destino.volver': '← Objetos',
      'objeto.compartir': 'Compartir',
      'compartir.ok': 'Enlace copiado',
      'compartir.copiar': 'Copiar el enlace de este objeto',
      'compartir.manual': 'Copia el enlace de este objeto:',
      'compartir.noexiste': 'Ese objeto ya no está en el catálogo',
            'comic.boton': 'Cómic',
      'comic.cerrar': 'Cerrar el cómic',
      'comic.descargar': 'Descargar el cómic en PDF',
      'comic.fuentes': 'Fuentes',
      'comic.vineta': 'Viñeta {n} del cómic',
'buscar.abrir': 'Buscar objetos',
      'buscar.cerrar': 'Cerrar la búsqueda',
      'buscar.titulo': 'Buscar objetos',
      'buscar.placeholder': 'Nombre, lugar, año, persona…',
      'buscar.todo': 'Todo',
      'buscar.funciona': 'Solo lo que aún funciona',
      'buscar.sigue': 'sigue funcionando',
      'buscar.ayuda': 'Escribe para buscar entre los {n} objetos',
      'buscar.cuenta': '{n} de {total} objetos',
      'buscar.vacio': 'Nada con eso. Prueba con otra palabra o quita el filtro.',
      'destino.luna': 'La Luna',
      'destino.marte': 'Marte',
      'destino.espacio': 'Otros destinos',
      'crucero.titulo': 'En crucero',
      'destellos.titulo': 'Algo brilla ahí abajo',
      'crucero.hacia': 'En crucero hacia {destino}',
      'hud.acercandonos': 'acercándonos a {destino}…',
      'pausa.titulo': 'Un momento de calma',
      'pausa.dejarlo': 'Dejarlo aquí',
      'pausa.otroDestino': 'Viajar a otro destino',
      'pausa.otroObjeto': 'Ver otro objeto de aquí',
      'pausa.terminar': 'Terminar la visita',
      'pausa.inicio': 'Volver al inicio',
      'pausa.volverObjeto': 'Volver al objeto visitado',
      'ficha.quien': 'Quién trabajó en su misión',
      'ficha.fuentes': 'Fuentes de este objeto',
      'ficha.noConsta': 'No consta en las fuentes consultadas.',
      'ficha.excepcion': 'Sigue funcionando: por qué está aquí',
      'buscar.excepcion': 'excepción',
      'anio.llegada': 'Llegada',
      'anio.lanzamiento': 'Lanzamiento',
      'visor.fotoAlt': 'Fotografía oficial de {objeto}',
      'visor.fotoCredito': 'Fotografía: NASA',
      'visor.sinModelo': 'Sin modelo 3D oficial de la NASA para este aparato.',
      'visor.modeloAlt': 'Modelo 3D interactivo de {objeto}',
      'visor.modeloCredito': 'Modelo 3D: NASA',
      'hitos.fuente': 'Fuente',
      'chat.leer': 'Leer las respuestas en voz alta',
      'chat.dejarLeer': 'Dejar de leer las respuestas',
      'chat.buscarNada': 'He buscado fuera y no he encontrado nada que pueda contarte sin inventármelo.',
      'objeto.brilla': 'Algo brilla ahí abajo',
      'objeto.ficha': 'Ver ficha',
      'objeto.infografia': 'Ver infografía',
      'objeto.sketch': 'Sketch',
      'sketch.descargar': 'Descargar',
      'sketch.cerrar': 'Cerrar el sketch',
      'sketch.alt': 'Sketch técnico de {objeto}',
      'sketch.nota': 'Dibujo técnico a mano alzada. Se descarga en JPG de 1920 px de ancho.',
      'sketch.aviso.de': 'Este dibujo está en alemán. La versión en español llegará con una próxima tanda.',
      'sketch.aviso.es': 'Este dibujo está en español.',
      'infografia.titulo': 'Infografía',
      'infografia.descargar': 'Descargar',
      'infografia.cerrar': 'Cerrar la infografía',
      'infografia.soloEs': 'Esta infografía está solo en español.',
      'infografia.alt': 'Infografía de {objeto}',
      'infografia.proximamente': 'Próximamente disponible 23-11-2026',
      'infografia.proximamente.nota': 'Todavía no está publicada. Mientras tanto puedes ver su ficha, sus fuentes y su modelo 3D.',
      'objeto.nivel': 'Nivel de lectura',
      'que.titulo': 'Qué estás viendo',
      'que.equipo': 'Equipo',
      "que.p1": "Esto es <strong>Memory Signals</strong>, un proyecto del reto <em>NASA's Discarded Equipment Storytelling</em> del NASA Space Apps Challenge 2026.",
      'que.p2': 'La NASA dejó en la Luna, en Marte y más allá equipo que ya no funciona pero que sigue en su sitio. Aquí puedes viajar hasta allí y hablar con esos objetos: te cuentan cómo llegaron, qué hacían cada día, qué descubrieron y quién trabajó en su misión.',
      "que.l1": "<strong>Dos niveles de lectura:</strong> Explorador y Científico. El conmutador está siempre arriba a la derecha y no reinicia el viaje.",
      "que.l2": "<strong>Todo verificado:</strong> cada turno tiene su fuente (NASA, JPL, LPI). Si un dato no se puede citar, no se cuenta.",
      "que.l3": "<strong>Ampliable:</strong> el contenido vive en <code>datos/contenido.json</code>. Cualquiera puede añadir un objeto sin tocar el motor.",
      "que.l4": "<strong>Sin escribir nada:</strong> toda la navegación es con clics o toques. La voz es opcional.",
      "que.l5": "<strong>Sigue funcionando:</strong> no todo lo que hay aquí está muerto. Cuando un aparato todavía trabaja, su ficha lo advierte y explica por qué está en la web.",
      'pie.datos': 'Memory Signals · NASA Space Apps Challenge 2026 · datos de NASA, JPL y LPI · modelos 3D de NASA 3D Resources',
      "chat.saludo": "Pregúntame lo que quieras de mí: qué hice, quién me construyó o dónde estoy ahora.",
      "chat.sug1": "¿Qué hiciste?",
      "chat.sug2": "¿Quién te construyó?",
      "chat.sug3": "¿Dónde estás ahora?",
      "chat.micro.titulo": "Dictar la pregunta con el micrófono",
      "chat.escribe": "Escribe la pregunta.",
            "mapa.titulo": "Dónde estamos",
      "mapa.luna": "El mapa de la Luna",
      "mapa.marte": "El mapa de Marte",
      "mapa.espacio": "Otros destinos",
      "mapa.pie.espacio": "Ordenados por año de salida. Acerca con + / − y arrastra para separar los puntos.",
      "mapa.pie": "Toca un punto para acercarte a otro aparato. Arrastra para girar.",
      "mapa.credito.luna": "Imagen: NASA/USGS · LRO LROC WAC Global Morphology Mosaic (≈100 m/px)",
      "mapa.credito.marte": "Imagen: NASA/USGS · Viking MDIM 2.1 en color (≈232 m/px)",
      "mapa.zum.mas": "Acercar el mapa",
      "mapa.zum.menos": "Alejar el mapa",
      "hud.toca": "toca un punto para acercarte",
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
      'voz.ayuda.titulo': 'The voice',
      'voz.ayuda.texto': 'Reads aloud what the astronaut says on each screen. It uses the browser voice: nothing to install or download.',
      'voz.ayuda.subtitulos': 'The subtitles stay visible whether the voice is on or off.',
      'voz.ayuda.estado.on': 'Right now: voice on.',
      'voz.ayuda.estado.off': 'Right now: voice muted.',
      'participa.titulo': 'Propose a forgotten object and contribute material',
      'participa': 'Take part',
      'participa.oculto': ' · propose a forgotten object',
      'doc.titulo': 'Memory Signals · abandoned NASA objects',
      'privacidad': 'Privacy',
      'pie.indice': 'Object index',
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
      'chat.sin.datos': 'That is not in my record. But I can tell you other things:',
      'chat.sin.aporta': 'Do you know it? Tell us on «Participa»',
      'chat.buscar.fuera': '🔎 Search outside my record',
      'chat.buscar.buscando': 'searching outside my record…',
      'chat.buscar.externo': 'This is not in my record: I searched outside and it comes from these sources.',
      'chat.buscar.nada': 'I searched outside and found nothing I can tell you without making it up.',
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
      'destino.volver': '← Objects',
      'objeto.compartir': 'Share',
      'compartir.ok': 'Link copied',
      'compartir.copiar': 'Copy the link to this object',
      'compartir.manual': 'Copy the link to this object:',
      'compartir.noexiste': 'That object is no longer in the catalogue',
            'comic.boton': 'Cartoon',
      'comic.cerrar': 'Close the cartoon',
      'comic.descargar': 'Download the cartoon as PDF',
      'comic.fuentes': 'Sources',
      'comic.vineta': 'Panel {n} of the cartoon',
'buscar.abrir': 'Search objects',
      'buscar.cerrar': 'Close search',
      'buscar.titulo': 'Search objects',
      'buscar.placeholder': 'Name, place, year, person…',
      'buscar.todo': 'All',
      'buscar.funciona': 'Only still working',
      'buscar.sigue': 'still working',
      'buscar.ayuda': 'Type to search the {n} objects',
      'buscar.cuenta': '{n} of {total} objects',
      'buscar.vacio': 'Nothing for that. Try another word or clear the filter.',
      'destino.luna': 'The Moon',
      'destino.marte': 'Mars',
      'destino.espacio': 'Other destinations',
      'crucero.titulo': 'In transit',
      'destellos.titulo': 'Something is glowing down there',
      'crucero.hacia': 'In transit to {destino}',
      'hud.acercandonos': 'approaching {destino}…',
      'pausa.titulo': 'A moment of calm',
      'pausa.dejarlo': 'Pause here',
      'pausa.otroDestino': 'Travel to another destination',
      'pausa.otroObjeto': 'See another object from here',
      'pausa.terminar': 'End the visit',
      'pausa.inicio': 'Back to the start',
      'pausa.volverObjeto': 'Back to the object you were visiting',
      'ficha.quien': 'Who worked on its mission',
      'ficha.fuentes': 'Sources for this object',
      'ficha.noConsta': 'Not stated in the sources consulted.',
      'ficha.excepcion': 'Still working: why it is here',
      'buscar.excepcion': 'exception',
      'anio.llegada': 'Arrival',
      'anio.lanzamiento': 'Launch',
      'visor.fotoAlt': 'Official photograph of {objeto}',
      'visor.fotoCredito': 'Photograph: NASA',
      'visor.sinModelo': 'No official NASA 3D model for this object.',
      'visor.modeloAlt': 'Interactive 3D model of {objeto}',
      'visor.modeloCredito': '3D model: NASA',
      'hitos.fuente': 'Source',
      'chat.leer': 'Read the answers aloud',
      'chat.dejarLeer': 'Stop reading the answers aloud',
      'chat.buscarNada': 'I searched outside the record and found nothing I can tell you without making it up.',
      'objeto.brilla': 'Something is shining down there',
      'objeto.ficha': 'See record',
      'objeto.infografia': 'See infographic',
      'objeto.sketch': 'Sketch',
      'sketch.descargar': 'Download',
      'sketch.cerrar': 'Close the sketch',
      'sketch.alt': 'Technical sketch of {objeto}',
      'sketch.nota': 'Hand-drawn technical drawing. Downloads as a 1920 px wide JPG.',
      'sketch.aviso.de': 'This drawing is in German. The English version will come with a later batch.',
      'sketch.aviso.es': 'This drawing is in Spanish. The English version will come with a later batch.',
      'infografia.titulo': 'Infographic',
      'infografia.descargar': 'Download',
      'infografia.cerrar': 'Close the infographic',
      'infografia.soloEs': 'This infographic is only available in Spanish.',
      'infografia.alt': 'Infographic of {objeto}',
      'infografia.proximamente': 'Coming soon, 23-11-2026',
      'infografia.proximamente.nota': 'Not published yet. In the meantime you can see its record, its sources and its 3D model.',
      'objeto.nivel': 'Reading level',
      'que.titulo': 'What you are seeing',
      'que.equipo': 'Team',
      "que.p1": "This is <strong>Memory Signals</strong>, a project for the <em>NASA's Discarded Equipment Storytelling</em> challenge of the NASA Space Apps Challenge 2026.",
      'que.p2': 'NASA left equipment on the Moon, on Mars and further out that no longer works but is still there. Here you can travel to it and talk to those objects: they tell you how they got there, what they did every day, what they found out and who worked on their mission.',
      "que.l1": "<strong>Two reading levels:</strong> Explorer and Scientist. The switch is always at the top right and does not restart the journey.",
      "que.l2": "<strong>All verified:</strong> every turn has its source (NASA, JPL, LPI). If a fact cannot be cited, it is not told.",
      "que.l3": "<strong>Extensible:</strong> the content lives in <code>datos/contenido.json</code>. Anyone can add an object without touching the engine.",
      "que.l4": "<strong>No typing needed:</strong> all navigation is by click or tap. The voice is optional.",
      "que.l5": "<strong>Still working:</strong> not everything here is dead. When a device is still operating, its record says so and explains why it is on the site.",
      'pie.datos': 'Memory Signals · NASA Space Apps Challenge 2026 · NASA, JPL and LPI data · 3D models from NASA 3D Resources',
      "chat.saludo": "Ask me anything: what I did, who built me or where I am now.",
      "chat.sug1": "What did you do?",
      "chat.sug2": "Who built you?",
      "chat.sug3": "Where are you now?",
      "chat.micro.titulo": "Dictate the question with the microphone",
      "chat.escribe": "Type the question.",
            "mapa.titulo": "Where we are",
      "mapa.luna": "The map of the Moon",
      "mapa.marte": "The map of Mars",
      "mapa.espacio": "Other destinations",
      "mapa.pie.espacio": "Ordered by launch year. Zoom with + / − and drag to separate the points.",
      "mapa.pie": "Tap a point to move to another object. Drag to rotate.",
      "mapa.credito.luna": "Imagery: NASA/USGS · LRO LROC WAC Global Morphology Mosaic (≈100 m/px)",
      "mapa.credito.marte": "Imagery: NASA/USGS · Viking MDIM 2.1 colour (≈232 m/px)",
      "mapa.zum.mas": "Zoom in",
      "mapa.zum.menos": "Zoom out",
      "hud.toca": "tap a point to move closer",
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
      'voz.ayuda.titulo': 'Die Stimme',
      'voz.ayuda.texto': 'Liest laut vor, was der Astronaut auf jedem Bildschirm sagt. Sie nutzt die Stimme des Browsers: nichts zu installieren oder herunterzuladen.',
      'voz.ayuda.subtitulos': 'Die Untertitel bleiben sichtbar, egal ob die Stimme an oder aus ist.',
      'voz.ayuda.estado.on': 'Gerade jetzt: Stimme an.',
      'voz.ayuda.estado.off': 'Gerade jetzt: Stimme stumm.',
      'participa.titulo': 'Schlage ein vergessenes Objekt vor und liefere Material',
      'participa': 'Mitmachen',
      'participa.oculto': ' · schlage ein vergessenes Objekt vor',
      'doc.titulo': 'Memory Signals · verlassene Objekte der NASA',
      'privacidad': 'Datenschutz',
      'pie.indice': 'Objektindex',
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
      'chat.sin.datos': 'Das steht nicht in meiner Akte. Aber ich kann dir anderes erzählen:',
      'chat.sin.aporta': 'Weißt du es? Erzähl es uns auf «Participa»',
      'chat.buscar.fuera': '🔎 Außerhalb meiner Akte suchen',
      'chat.buscar.buscando': 'ich suche außerhalb meiner Akte…',
      'chat.buscar.externo': 'Das steht nicht in meiner Akte: ich habe außerhalb gesucht, und es stammt aus diesen Quellen.',
      'chat.buscar.nada': 'Ich habe außerhalb gesucht und nichts gefunden, was ich dir ohne Erfindung sagen könnte.',
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
      'destino.volver': '← Objekte',
      'objeto.compartir': 'Teilen',
      'compartir.ok': 'Link kopiert',
      'compartir.copiar': 'Link zu diesem Objekt kopieren',
      'compartir.manual': 'Link zu diesem Objekt kopieren:',
      'compartir.noexiste': 'Dieses Objekt ist nicht mehr im Katalog',
            'comic.boton': 'Comic',
      'comic.cerrar': 'Comic schliessen',
      'comic.descargar': 'Comic als PDF herunterladen',
      'comic.fuentes': 'Quellen',
      'comic.vineta': 'Bild {n} des Comics',
'buscar.abrir': 'Objekte suchen',
      'buscar.cerrar': 'Suche schliessen',
      'buscar.titulo': 'Objekte suchen',
      'buscar.placeholder': 'Name, Ort, Jahr, Person…',
      'buscar.todo': 'Alle',
      'buscar.funciona': 'Nur noch funktionierende',
      'buscar.sigue': 'funktioniert noch',
      'buscar.ayuda': 'Tippen, um die {n} Objekte zu durchsuchen',
      'buscar.cuenta': '{n} von {total} Objekten',
      'buscar.vacio': 'Nichts gefunden. Anderes Wort probieren oder den Filter lösen.',
      'destino.luna': 'Der Mond',
      'destino.marte': 'Mars',
      'destino.espacio': 'Andere Ziele',
      'crucero.titulo': 'Unterwegs',
      'destellos.titulo': 'Da unten leuchtet etwas',
      'crucero.hacia': 'Unterwegs zum {destino}',
      'hud.acercandonos': 'Anflug auf {destino}…',
      'pausa.titulo': 'Ein Moment der Ruhe',
      'pausa.dejarlo': 'Hier pausieren',
      'pausa.otroDestino': 'Zu einem anderen Ziel reisen',
      'pausa.otroObjeto': 'Ein anderes Objekt von hier ansehen',
      'pausa.terminar': 'Besuch beenden',
      'pausa.inicio': 'Zurück zum Anfang',
      'pausa.volverObjeto': 'Zurück zum besuchten Objekt',
      'ficha.quien': 'Wer an seiner Mission arbeitete',
      'ficha.fuentes': 'Quellen zu diesem Objekt',
      'ficha.noConsta': 'In den herangezogenen Quellen nicht angegeben.',
      'ficha.excepcion': 'Funktioniert noch: warum sie hier ist',
      'buscar.excepcion': 'Ausnahme',
      'anio.llegada': 'Ankunft',
      'anio.lanzamiento': 'Start',
      'visor.fotoAlt': 'Offizielles Foto von {objeto}',
      'visor.fotoCredito': 'Foto: NASA',
      'visor.sinModelo': 'Kein offizielles 3D-Modell der NASA für dieses Objekt.',
      'visor.modeloAlt': 'Interaktives 3D-Modell von {objeto}',
      'visor.modeloCredito': '3D-Modell: NASA',
      'hitos.fuente': 'Quelle',
      'chat.leer': 'Antworten vorlesen',
      'chat.dejarLeer': 'Vorlesen beenden',
      'chat.buscarNada': 'Ich habe außerhalb der Akte gesucht und nichts gefunden, was ich dir sagen könnte, ohne es zu erfinden.',
      'objeto.brilla': 'Da unten glänzt etwas',
      'objeto.ficha': 'Akte ansehen',
      'objeto.infografia': 'Infografik ansehen',
      'objeto.sketch': 'Skizze',
      'sketch.descargar': 'Herunterladen',
      'sketch.cerrar': 'Skizze schließen',
      'sketch.alt': 'Technische Skizze von {objeto}',
      'sketch.nota': 'Handgezeichnete technische Zeichnung. Wird als JPG mit 1920 px Breite heruntergeladen.',
      'sketch.aviso.de': '',
      'sketch.aviso.es': 'Diese Zeichnung ist auf Spanisch.',
      'infografia.titulo': 'Infografik',
      'infografia.descargar': 'Herunterladen',
      'infografia.cerrar': 'Infografik schließen',
      'infografia.soloEs': 'Diese Infografik gibt es nur auf Spanisch.',
      'infografia.alt': 'Infografik von {objeto}',
      'infografia.proximamente': 'Demnächst verfügbar, 23.11.2026',
      'infografia.proximamente.nota': 'Noch nicht veröffentlicht. In der Zwischenzeit kannst du die Akte, die Quellen und das 3D-Modell ansehen.',
      'objeto.nivel': 'Lesestufe',
      'que.titulo': 'Was du hier siehst',
      'que.equipo': 'Team',
      "que.p1": "Das ist <strong>Memory Signals</strong>, ein Projekt zur Aufgabe <em>NASA's Discarded Equipment Storytelling</em> des NASA Space Apps Challenge 2026.",
      'que.p2': 'Die NASA hat auf dem Mond, auf dem Mars und weiter draußen Geräte zurückgelassen, die nicht mehr arbeiten, aber noch dort stehen. Hier kannst du dorthin reisen und mit diesen Objekten sprechen: sie erzählen, wie sie ankamen, was sie jeden Tag taten, was sie entdeckt haben und wer an ihrer Mission mitgearbeitet hat.',
      "que.l1": "<strong>Zwei Lesestufen:</strong> Entdecker und Wissenschaft. Der Schalter ist immer oben rechts und startet die Reise nicht neu.",
      "que.l2": "<strong>Alles belegt:</strong> jede Aussage hat ihre Quelle (NASA, JPL, LPI). Was sich nicht belegen lässt, wird nicht erzählt.",
      "que.l3": "<strong>Erweiterbar:</strong> die Inhalte liegen in <code>datos/contenido.json</code>. Jeder kann ein Objekt ergänzen, ohne den Motor anzufassen.",
      "que.l4": "<strong>Ohne Tippen:</strong> die ganze Navigation läuft über Klicken oder Tippen. Die Stimme ist optional.",
      "que.l5": "<strong>Funktioniert noch:</strong> Nicht alles hier ist tot. Wenn ein Gerät noch arbeitet, sagt seine Akte es und erklärt, warum es auf dieser Website steht.",
      'pie.datos': 'Memory Signals · NASA Space Apps Challenge 2026 · Daten von NASA, JPL und LPI · 3D-Modelle von NASA 3D Resources',
      "chat.saludo": "Frag mich alles: was ich getan habe, wer mich gebaut hat oder wo ich jetzt bin.",
      "chat.sug1": "Was hast du getan?",
      "chat.sug2": "Wer hat dich gebaut?",
      "chat.sug3": "Wo bist du jetzt?",
      "chat.micro.titulo": "Die Frage mit dem Mikrofon diktieren",
      "chat.escribe": "Tippe die Frage.",
            "mapa.titulo": "Wo wir sind",
      "mapa.luna": "Die Karte des Mondes",
      "mapa.marte": "Die Karte des Mars",
      "mapa.espacio": "Weitere Ziele",
      "mapa.pie.espacio": "Nach Startjahr geordnet. Zoome mit + / − und ziehe, um die Punkte zu trennen.",
      "mapa.pie": "Tippe auf einen Punkt, um zu einem anderen Gerät zu kommen. Ziehen zum Drehen.",
      "mapa.credito.luna": "Bild: NASA/USGS · LRO LROC WAC Global Morphology Mosaic (≈100 m/px)",
      "mapa.credito.marte": "Bild: NASA/USGS · Viking MDIM 2.1 in Farbe (≈232 m/px)",
      "mapa.zum.mas": "Näher heranzoomen",
      "mapa.zum.menos": "Herauszoomen",
      "hud.toca": "tippe auf einen Punkt",
      'comun': 'Gemeinsam'
    }
  };

  /* el idioma del navegador sirve de pista la primera vez;
     un ?lang=en en la dirección manda sobre lo guardado (enlaces compartidos) */
  function leer() {
    var enlace = null;
    try {
      var q = String(window.location.search || '');
      var m = q.match(/[?&](?:lang|idioma)=([a-zA-Z-]{2,5})/);
      if (m) {
        var corto = m[1].slice(0, 2).toLowerCase();
        if (IDIOMAS.indexOf(corto) !== -1) { enlace = corto; }
      }
    } catch (e) {}
    if (enlace) {
      try { localStorage.setItem(CLAVE, enlace); } catch (e) {}
      return enlace;
    }
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
    Array.prototype.forEach.call(document.querySelectorAll('[data-i18n-ph]'), function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    /* título de la pestaña y descripción de las páginas con formulario */
    var docTitulo = document.querySelector('[data-i18n-doc-titulo]');
    if (docTitulo) { document.title = t(docTitulo.getAttribute('data-i18n-doc-titulo')); }
    var docMeta = document.querySelector('[data-i18n-doc-meta]');
    if (docMeta) {
      var meta = document.querySelector('meta[name="description"]');
      if (meta) { meta.setAttribute('content', t(docMeta.getAttribute('data-i18n-doc-meta'))); }
    }
    /* los enlaces internos conservan el idioma en la dirección */
    Array.prototype.forEach.call(document.querySelectorAll('a[href$=".html"]'), function (a) {
      var href = a.getAttribute('href');
      if (!href || href.indexOf('?') !== -1) { return; }
      a.setAttribute('href', href + '?lang=' + actual);
    });
    var rotulo = document.getElementById('idioma-actual');
    if (rotulo) rotulo.textContent = actual.toUpperCase();
  }

  /* diccionarios de página: cada página suma los suyos antes de aplicar */
  function anadir(extra) {
    Object.keys(extra).forEach(function (idioma) {
      if (!TEXTOS[idioma]) { TEXTOS[idioma] = {}; }
      Object.keys(extra[idioma]).forEach(function (clave) {
        TEXTOS[idioma][clave] = extra[idioma][clave];
      });
    });
    aplicar();
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
    anadir: anadir,
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
