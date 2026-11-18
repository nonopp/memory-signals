## v3.13.0 — 2026-11-18

- **El equipo figura en la pantalla «¿Qué es esto?»**: Antonio Pérez, Jesús Serrano, Carlota Díaz, Francisco Díaz y Simon Preißler, como etiquetas bajo el epígrafe *Equipo* (ES) / *Team* (EN, DE). Los nombres no se traducen.
- Sin roles ni funciones asignadas: solo constan los nombres, que es lo que hay confirmado.

## v3.12.1 — 2026-11-18

- **Arreglo de la analítica por aparato.** El aviso de «qué objeto se ha abierto» se perdía: Matomo sustituye `window._paq` cuando carga su propia biblioteca, y el código guardaba una copia local del vector, así que lo que se empujaba después caía en un vector huérfano. Ahora se empuja siempre sobre `window._paq`. Sin esto, el informe de aparatos más vistos se habría quedado vacío.
- El correo de Matomo sale ya como **Gesemweb · Analítica web** desde `info@gesemweb.net` (IONOS, puerto 587, TLS), y el usuario `nono` tiene ese buzón como dirección de aviso.

## v3.12.0 — 2026-11-18

- **Analítica de visitas propia y sin cookies.** La app manda las visitas a un **Matomo instalado en srv8** (https://analytics.gesemweb.es, Matomo 5.14.2), dado de alta como tercer sitio, *«Memory Signals · NASA Space Apps 2026»*, con las dos direcciones del proyecto: `nasa.gesemweb.es/app` y `nonopp.github.io/memory-signals`.
- **Sin cookies y sin banner**: el código va con `disableCookies`, respeta la señal *Do Not Track* del navegador, no usa identificadores que sigan a la persona de una visita a otra, no hay perfilado ni publicidad y no se cruza con otros sitios. Como no se pone ninguna cookie, no hay nada que aceptar.
- **Cuenta también qué aparato se abre**: al entrar en una ficha se envía una página vista con el nombre del objeto, así se ve qué aparatos se miran más.
- **Política de privacidad actualizada en los tres idiomas**: se explica qué se mide y qué no, se corrige la frase que decía que no había analítica y se sube la fecha al 18 de noviembre de 2026.
- El archivo de informes de Matomo ya corría por cron cada hora; no hay que tocar nada más en el servidor.

## v3.11.1 — 2026-11-17

- **El pie cabe en una sola línea.** La letra baja de 0,8 rem a 0,7 rem (11,2 px), el bloque de la derecha ya no se parte en dos filas y se recorta el relleno lateral. Con la letra anterior el pie necesitaba unos 1.330 px de ancho y saltaba a dos líneas por debajo de ~1.350 px; ahora necesita unos 1.150, así que se queda en una línea incluso con la ventana a 1.200 px. En el móvil sigue igual que estaba.
- **El botón pasa a «← Objetos»** («← Objects» en inglés, «← Objekte» en alemán), que se lee mejor y ocupa menos.

## v3.11.0 — 2026-11-17

- **Botón «Sketch» en lugar de «Ver infografía»**: en la ficha del objeto, el botón abre el **dibujo técnico a mano alzada** de ese aparato a pantalla completa, con su nombre y un enlace **«Descargar»** que se lleva el JPG, igual que hacía el de la infografía. En alemán el botón dice «Skizze».
- **Los 22 sketches están dentro**: `docs/img/fondo-<id>.jpg`, 1920 px de ancho, entre 320 y 410 KB cada uno. Índice en `docs/datos/sketches.json`.
- **El fondo de la ficha es el sketch del aparato que se está viendo**, no una imagen fija: al cambiar de objeto cambia el dibujo (el módulo lunar, el Intrepid, el Opportunity…). El velo negro y la opacidad de los paneles, como quedaron en la 3.10.0.
- El índice de infografías, las imágenes y sus traducciones siguen en el repositorio sin usarse, por si se quieren recuperar.

## v3.10.0 — 2026-11-17

- **La ficha del objeto se apoya en un plano técnico.** En la pantalla de las tres columnas, el fondo es el plano del módulo lunar (vistas de alzado, perfil y planta, con sus cotas de 7,0 m) a línea blanca: cubre toda la pantalla y lleva un **velo negro al 70 %** encima, con la imagen fija al desplazar.
- **Los contenedores quedan al 85 % de opacidad** (15 % de transparencia): el título y el año, el mapa del destino, el visor 3D, la tarjeta del carrusel con rabillo, la respuesta del chat y el panel del chat. Así el dibujo se ve en los huecos entre columnas y se adivina detrás de los paneles, sin quitarle sitio al texto.
- **Los botones y el carrusel recuperan fondo propio**: sobre una imagen, los botones secundarios —«Volver a los objetos», «Ver ficha», «Ver infografía», «Dejarlo aquí»— y las flechas y puntos del carrusel iban transparentes y se los comía el dibujo. Ahora llevan fondo del mismo tono al 85 % y borde visible.
- La barra de arriba se oscurece un poco en esta pantalla para no mezclarse con el plano.
- El fondo solo aparece en la ficha del objeto: en la portada, el crucero, los destellos y las demás pantallas todo sigue como estaba.

## v3.9.2 — 2026-11-17

- **La voz ya no se elige a ciegas.** Antes se cogía la **primera** voz que apareciera en el idioma; en macOS y en iOS esa primera suele ser «Albert», que suena ronco y apagado — de ahí la sensación de afonía en inglés. Ahora se puntúan todas las voces del equipo y se elige la mejor: se descartan las roncas y las de broma (Albert, Fred, Zarvox, Whisper, Bells…), se prefieren las que suenan bien conocidas (Google, Samantha, Daniel, Serena, Zira, Sabina, Anna, Helena, Mónica, Diego…) y las «natural», «neural», «premium» o «enhanced», y en igualdad se prefiere la de red, que en casi todos los equipos suena mejor.
- Cada idioma tiene su propia voz: español, inglés y alemán se eligen por separado y se vuelven a elegir al cambiar de idioma. Si en un equipo no hay ninguna voz aceptable, se deja la del sistema antes que poner una ronca.
- Comprobado con las listas de voces típicas de macOS/iOS, Chrome, Android y Windows: donde antes salía «Albert» ahora sale Daniel en inglés, Diego en español y Anna en alemán.

## v3.9.1 — 2026-11-17

- **Los puntos de los cuatro módulos lunares ya nombran piezas**, no momentos de la misión. Los del Apolo 12, 14, 16 y 17 decían cosas como «Fra Mauro», «La despedida» o «Cambio de plan» —textos de relato, como los del carrusel—. Ahora señalan la **etapa de descenso**, el **motor**, las **patas**, la **escalerilla**, los **instrumentos**, el **radar de aterrizaje**, los **paquetes de experimentos**, los **sismómetros** o el **rover**, con la explicación tomada de la ficha de cada aparato. Los seis del módulo lunar del Apolo 11 no se han tocado.
- El modelo 3D de los cuatro es el mismo que el del módulo lunar del Apolo 11, así que las piezas se colocan en las mismas posiciones ya comprobadas; los puntos que sobran en cada aparato simplemente no se ponen (el Orion se queda con tres: no hay más piezas de las que hable su ficha).

## v3.9.0 — 2026-11-17

- **El título de cada punto del 3D se enciende al pasar por el centro**: como el modelo gira solo, cada poco se mira en qué parte de la pantalla está cada punto y el que entra en la banda del **10 % central** muestra su título —«Etapa de descenso», «Retrorreflector láser», «Carolyn Porco»— encima de la gota. Se enciende uno solo, el más centrado, para que no se amontonen; al pulsarlo se abre la caja con la explicación, como antes.
- **El título también sale al pasar el ratón** por encima del punto, y al llegar con el tabulador: no hace falta esperar a que el giro lo traiga al centro. El punto encendido se pone por delante para que su título no quede tapado por los vecinos.
- **En los mapas el nombre se enciende igual al acercar el ratón**, sin necesidad de que el giro lleve el objeto al centro, y ahora **el propio nombre se puede pulsar**: el blanco del ratón pasa de 9 a 14 px alrededor del punto y la etiqueta, cuando está a la vista, también recibe el clic.
- **Puntos del Voyager 1 y del Galileo recolocados**: sus modelos llevan el cuerpo en una zona y los mástiles muy largos en otra, y los puntos caían sobre el mástil. Ahora se colocan con una **rejilla de densidad de vértices** que dice dónde hay geometría de verdad: en el Voyager 1 sobre el cuerpo y el plato (z negativa), y en el Galileo sobre la esfera, el brazo y el mástil.

## v3.8.3 — 2026-11-17

- **La página ya no se queda en una versión vieja**: si el navegador guardó `index.html` en caché y el servidor tiene otra versión, la propia página pregunta por `VERSION` al cargarse y, si no coincide con la suya, se recarga una sola vez con un parámetro nuevo. Antes había que forzar la recarga a mano: quien tuviera la aplicación abierta desde antes seguía viendo el menú y la cabecera antiguos aunque lo publicado ya fuera lo nuevo.

## v3.8.2 — 2026-11-17

- **El agradecimiento del formulario se traduce al cambiar de idioma**: el título y la lista de la pantalla de gracias ya cambiaban, pero el párrafo del medio se quedaba en el idioma en que se envió la propuesta. Ahora se reescribe con el resto de la pantalla, así que quien envíe en español y luego cambie a alemán ve el agradecimiento y el aviso de contacto en alemán.

## v3.8.1 — 2026-11-17

- **Los puntos se recolocan sobre los aparatos**: el reparto automático se hacía desde la caja envolvente de cada modelo, y en los que llevan mástiles o brazos largos —Voyager 1, Cassini, MESSENGER, Pioneer 10, Skylab— el centro de esa caja cae en el aire, así que algunos puntos quedaban flotando fuera de la figura. Ahora el centro y el tamaño salen de **los vértices reales del modelo** (media y percentiles 5–95 %, leídos tras descomprimir los GLB), de modo que el cuerpo del aparato manda y los salientes finos casi no cuentan; los cuatro modelos más tercos (Voyager 1, Pioneer 10 y Galileo) llevan además las coordenadas puestas a mano. Los 126 puntos se comprobaron uno a uno sobre la figura, con la misma cámara de la aplicación.

## v3.8.0 — 2026-11-17

- **Puntos interactivos en los 21 aparatos restantes** (120 puntos nuevos, 5 o 6 por aparato, 126 en total con los seis del módulo lunar), en los tres idiomas: cada punto lleva un título corto y un texto de una o dos frases salido **solo de la ficha del propio aparato** —su resumen, sus tres hitos, su estado y las personas que aparecen en ella—, sin datos de fuera. Se colocan sobre el modelo en coordenadas del propio GLB, sacadas de su caja envolvente y, donde el mástil o los brazos largos descuadraban la caja, puestas a mano y comprobadas sobre la figura.
- **La cabecera en móvil pasa a dos líneas**: arriba el logotipo completo —ya no solo el emblema— a la izquierda y el selector de idiomas alineado a la derecha; debajo, en una sola línea que se desliza si no cabe, el nivel de lectura, la voz, «Participa» y, cuando toca, el menú de destinos. Antes las opciones se amontonaban y descuadraban la pantalla; en escritorio la barra sigue igual, en una línea.
- **Las tres tarjetas de destino van en horizontal en móvil**: el icono a la izquierda y el nombre del destino a la derecha, en lugar del icono encima del título.
- **Pantalla de gracias del formulario**: al enviarse una propuesta se agradece la colaboración («¡Gracias por tu colaboración!») y se avisa de que **nos pondremos en contacto con esa persona lo antes posible, una vez valorada su aportación**, en los tres idiomas. El aviso sale siempre, también cuando el servidor añade su propio mensaje.

## v3.7.2 — 2026-11-17

- **El bocadillo del chat se traduce al cambiar de idioma**: si aún no se ha hablado, el saludo y las sugerencias se rehacen en el idioma nuevo. Si ya hay conversación, se respeta lo escrito y solo cambian los rótulos y las sugerencias. Antes el saludo se quedaba en el idioma anterior porque el propio saludo contaba como conversación.

## v3.7.1 — 2026-11-17

- **El mapa enseña todos los nombres al abrirse**, durante 5 segundos, repartidos en tres alturas según su longitud para que se lean aunque los objetos estén amontonados. Después se apagan y vuelve el turno de los que el giro lleva al centro.
- **La ventana del nombre pasa de 2 a 5 segundos**: en la Luna se enciende al llegar al centro y dura 5 s; en Marte empieza 1 s antes del centro y se apaga a los 5 s.

## v3.7.0 — 2026-11-17

- **Puntos interactivos en el modelo 3D**, como los del mapa: en el módulo lunar del Apolo 11 hay seis puntos celestes que laten y se mueven con el giro del modelo; al tocarlos se abre una ficha con el nombre de la pieza y una explicación corta. Son la cabina de ascenso, la etapa de descenso, el motor, el retrorreflector láser, las antenas y la escalerilla (con el dato de que el Apolo 11 no llevó rover y no se alejaron más de 60 m).
- El contenido de cada punto vive en `datos/contenido.json` (y sus versiones en inglés y alemán), en el campo `puntos3d` del aparato: posición y normal en coordenadas del modelo, título y texto. Un aparato sin ese campo se queda como estaba, sin puntos.
- La ficha se cierra con su aspa, con Escape o al cambiar de objeto, y **se traduce al cambiar de idioma** igual que el resto de la ficha. En Marte los puntos saldrán en el rojo oscuro del mapa.

## v3.6.1 — 2026-11-17

- **Imagen de vista previa para redes** (`img/og-memory-signals.jpg`, 1200 × 630 con el logotipo sobre el fondo #040d14): es la que se ve al compartir el enlace en WhatsApp, Telegram, X o Facebook. **No sustituye al logotipo de la cabecera**, que sigue siendo `logo-memory-signals.png`.
- **Metadatos de compartición limpios**: había dos `og:title`, dos `og:description` y dos `og:type` duplicados; ahora hay un juego solo, con `og:url`, `og:site_name`, `og:locale`, dimensiones y texto alternativo de la imagen, más el juego completo de Twitter (`twitter:title`, `twitter:description`, `twitter:image`) y `<link rel="canonical">`.
- **Meta descripción reescrita** con lo que la app ofrece de verdad: 22 aparatos, ficha, modelo 3D, fuentes verificables y tres idiomas.

## v3.6.0 — 2026-11-17

- **Los puntos del mapa cambian de color**: el tono claro (casi blanco) se perdía sobre la cara iluminada de la Luna. Ahora van en **celeste con aro azul oscuro** en la Luna y en **rojo oscuro con aro claro** en Marte, y la onda del latido va en ese mismo color.
- **El nombre de cada objeto solo se enciende cuando el giro lo trae al centro** de la cara visible. En la Luna se enciende al llegar al centro y dura 2 s; en Marte empieza 1 s antes y se apaga 1 s después. Con los objetos nuevos amontonados en la misma zona, los nombres a la vez eran una maraña ilegible. Al pasar el ratón o al llegar con el tabulador se sigue viendo, y si dos coinciden en el centro solo se enciende uno.
- **Texto contextual del altavoz**: al pasar el ratón sobre el icono de la voz sale una explicación de lo que hace —lee en alto lo que dice el astronauta, usa la voz del navegador, los subtítulos siguen visibles— y en qué estado está ahora mismo. Se traduce al cambiar de idioma, incluso con el texto abierto. En pantalla táctil, el toque sigue encendiendo o apagando la voz y deja la explicación cuatro segundos.

## v3.5.6 — 2026-11-16

- **Infografía española del módulo lunar, traducida de la inglesa corregida** con un pliego de 44 cadenas cerradas: cabecera, seis paneles y las diez etiquetas de la barra de datos. Números a la española (15.103 · 2.445 · 8.248 · 6,65 m³ · 45.000 N · 21,55 kg · 0,67416° N), «Apolo» por «Apollo» y ningún rover: el panel 5 lleva la antena de radar y el ordenador.
- Quedan dos defectos conocidos en la imagen, a la espera de decidir si se remiendan o se regeneran: el panel 2 dice «2,0 m de alto» cuando son 2,8 m, y la celda del alunizaje de la barra conserva el rótulo inglés («Moon Landing: Alunizaje: 20 de July 20, 1969, 20:17:40 UT»).
- Las tres infografías del Apolo 11 (es, en, de) están publicadas y con el visor arreglado (enlace celeste, aspa sin montarse, barra fija).

## v3.5.5 — 2026-11-16

- El enlace **«Descargar»** del visor de infografías pasa de azul oscuro a **celeste claro** (#8fd8ff, y #d0f0ff al pasar por encima): sobre el fondo negro del visor no se leía.
- En el móvil el **aspa de cerrar ya no se superpone** al enlace de descarga: deja de flotar en la esquina y se coloca en la misma fila, detrás de «Descargar».

## v3.5.4 — 2026-11-16

- **Vuelve la infografía inglesa del módulo lunar**, regenerada y corregida. Se retiró en la 3.5.3 porque traía rótulos en español («Astronauta», «Retrorreflector laser a 5 m al NNO»), palabras corruptas («communimental», «Coracimos de condonción órcastes», «Comentanios retroreflectons»), un «aerozine aerozine» duplicado y un rover dibujado en el panel 5 que el Apolo 11 no llevaba. Corregidos los nueve fallos en tres rondas: ahora el panel 5 lleva una antena de radar y un ordenador en lugar del rover, y el panel 6 dice «No rover on board».
- El original inglés llega a 1536 × 2752 (el triple que las otras dos), así que al ampliarla se lee bien.
- Las tres infografías del módulo lunar (es, en, de) están publicadas. Se acabó el aviso de «solo disponible en español».

## v3.5.3 — 2026-11-16

- La infografía inglesa del módulo lunar **se retira temporalmente**: sus paneles 5 y 6 traen rótulos en español («Astronauta», «Retrorreflector laser a 5 m al NNO») y palabras corruptas («communimental», «Coracimos de condonción órcastes», «Comentanios retroreflectons»), además de un «Rover transport» que el Apolo 11 no llevaba. En inglés se enseña la española con el aviso de idioma, que es lo honesto.
- Se mantienen la española y la alemana. La alemana está limpia; la española tiene tres rótulos corruptos en el panel 6 (detalle en el informe del 16-11).

## v3.5.2 — 2026-11-16

- El botón de la ficha pasa a llamarse **«Ver ficha»** («See record», «Akte ansehen») en los tres idiomas. Con el botón nuevo de la infografía, el nombre largo se partía en dos líneas. Los cuatro botones de la ficha del objeto caben ahora en una línea, comprobado en español, inglés y alemán y en pantalla de móvil.

## v3.5.1 — 2026-11-16

- Infografía del módulo lunar del Apolo 11 en **los tres idiomas**: español, inglés y alemán.
- El botón **Ver infografía** sale en todos los aparatos. En los que aún no la tienen, al pulsarlo anuncia **«Próximamente disponible 23-11-2026»** con una nota que remite a la ficha, las fuentes y el modelo 3D. La fecha se cambia en un solo sitio: `_proximamente` de `datos/infografias.json`.
- El visor se ha reordenado: el crédito de fuentes ya no se monta encima de la imagen y la descarga se oculta cuando no hay nada que descargar.

### Pendiente de la imagen del Apolo 11
Los datos son correctos y están cotejados con el NSSDCA, pero quedan rótulos corruptos en las ilustraciones pequeñas de los paneles 5 y 6 (detalle en el informe del 16-11). Se corregirán cuando llegue la versión regenerada.

## v3.5.0 — 2026-11-16

**Infografías descargables, traducciones completas y modelos ligeros.**

### Añadido
- Infografía descargable por aparato: botón **Ver infografía** en la ficha, entre «Ver ficha y fuentes» y «Dejarlo aquí». Solo aparece si ese aparato tiene infografía.
- Visor a pantalla completa con aspa, cierre con Escape o tocando el fondo, y botón de **descarga** del original.
- Índice `datos/infografias.json`: un fichero por idioma (`infografias/<id>.<idioma>.webp`). Si falta el idioma del visitante se enseña la española y se avisa. El original sin comprimir se guarda en `fuentes/infografias/`, fuera de lo publicado.
- Primera infografía: módulo lunar del Apolo 11, en español. Contenido verificado contra la ficha del NSSDCA de la nave 1969-059C.
- Cuarto botón en «Dejarlo aquí»: **Volver al objeto visitado**. Antes no había forma de regresar al objeto desde esa pantalla.

### Corregido
- Los tres botones de «Dejarlo aquí» y el «Volver al inicio» estaban escritos en español en el JS: ahora salen de claves en los tres idiomas.
- El botón «Ver ficha y fuentes» no tenía `data-i18n`, por eso se quedaba en español en inglés y alemán.
- Los dos rótulos de la ficha verificable, el «No consta en las fuentes consultadas», el «Fuente:» del carrusel de hitos, cinco textos del visor 3D y el año del objeto («Lanzamiento ·», «Llegada ·»), también en español a mano: pasados a los tres idiomas.
- Al cambiar de idioma, la pantalla y la ficha se quedaban en el idioma anterior porque el estado seguía apuntando a los objetos viejos. Ahora se vuelven a enlazar por su id y se repinta todo, ficha e infografía abiertas incluidas.
- Traducciones que faltaban: **112 cadenas en inglés y 38 en alemán**. Incluye el `estado_texto` en texto plano de siete aparatos (Apolo 11, NEAR Shoemaker, Pioneer 10, Dawn, Viking, Kepler e Ingenuity), que salía en español en los tres idiomas, y las fichas enteras de Intrepid, Antares, Huygens, Magellan y Skylab.
- «Apolo» → «Apollo» en inglés y alemán (15 apariciones), y etiquetas de fuentes mal traducidas.

### Cambiado
- Los 19 modelos 3D pasan de **27,1 MB a 5,0 MB** (81 % menos): texturas duplicadas que la NASA dejó sin usar eliminadas, las que quedan en WebP a 2k y geometría con Draco. La geometría no se ha tocado. Originales guardados en `fuentes/` del respaldo local.
- `herramientas/verifica-estado.py`: retrato del estado de la aplicación para comparar antes y después de un cambio ajeno.

# Historial de versiones — Memory Signals

La versión vive en `docs/VERSION` y se muestra en el pie de la aplicación.
Cada versión lleva su etiqueta en el repositorio (`v1.0.0`, `v1.1.0`, …) y un archivo
comprimido guardado fuera del servidor, en `gdrive:Backups/memory-signals/`.

Criterio de numeración:

- **1.0.0 → 1.1.0**: mejoras y añadidos que no rompen lo anterior (aparatos nuevos, pantallas nuevas).
- **1.0.0 → 1.0.1**: correcciones de fallos y retoques de texto.
- **1.1.0 → 2.0.0**: cambios de fondo que alteran cómo funciona la aplicación.

---

## v3.4.3 — 16 de noviembre de 2026

- **Los nombres del campo de destellos se cortaban todos igual** («Etapa de descenso del …» cuatro
  veces) y no había forma de distinguirlos. Ahí también manda el nombre corto: Intrepid, Antares,
  Orion y Challenger.

---

## v3.4.2 — 16 de noviembre de 2026

- **«En crucero hacia marte»**: al pasar el nombre a minúscula se comía la mayúscula de los planetas.
  Ahora solo se pasa a minúscula el artículo («la Luna», «the Moon»); «Marte» va con mayúscula.

---

## v3.4.1 — 16 de noviembre de 2026

- **«En crucero hacia Luna»** se leía mal: al usar el nombre corto del destino se perdía el artículo.
  Ahora en español e inglés se usa el nombre completo («la Luna», «the Moon») y en alemán la
  plantilla pone el artículo («zum Mond»).
- **El rótulo de aproximación** del crucero («acercándonos a …») estaba escrito en español a mano;
  ahora es una cadena más y se traduce.

---

## v3.4.0 — 16 de noviembre de 2026

**Primera tanda de objetos nuevos: de 10 a 22 aparatos, todos con modelo 3D oficial de la NASA.**

El reto pide objetos abandonados, así que solo entran aparatos que se quedaron, murieron o se
destruyeron al final de su misión. Nada que siga en activo.

- **Luna (4 nuevos, 5 en total).** Las etapas de descenso del Intrepid (Apolo 12), Antares (Apolo 14),
  Orion (Apolo 16) y Challenger (Apolo 17). Están posadas donde las dejaron, con sus coordenadas reales.
- **Marte (1 nuevo, 5 en total).** Spirit, atascado en la arena desde 2009 y sin señal desde marzo de 2010.
- **Espacio profundo (7 nuevos, 12 en total).** Galileo y Cassini, desintegradas a propósito en Júpiter y
  Saturno; Huygens, apagada en Titán; MESSENGER, estrellada contra Mercurio; Magellan, quemada en la
  atmósfera de Venus; Skylab, caída sobre Australia en 1979; y Deep Impact, en silencio desde 2013.
- **Modelos.** Los doce salen de NASA 3D Resources y se sirven desde `docs/modelos/`. Los cuatro módulos
  lunares comparten un único `apollo-lm-descenso.glb` (el modelo genérico del LM) y el Spirit usa el del
  vehículo gemelo; las dos cosas se dicen en el crédito.
- **Contenido en tres idiomas.** Ficha, tres hitos y tres turnos por objeto, traducidos al inglés y al
  alemán. Se corrigieron 24 textos ingleses que el traductor había dejado en español.
- **El nombre que chocaba con otro se esconde.** Con cinco puntos en la Luna y doce en el cielo, los
  nombres se montaban unos sobre otros. Ahora se coloca primero el del objeto abierto y se ocultan los
  que chocan; al pasar el ratón vuelven. Los puntos del mapa llevan nombre corto (Intrepid, Antares,
  Orion, Challenger, Apolo 11).
- **Los destellos se reparten.** Las tres posiciones fijas de la pantalla de destellos se repetían a
  partir del cuarto objeto. Ahora se reparten en filas de tres.
- **El título del crucero estaba escrito en español a mano** («En crucero hacia …»): en inglés y en
  alemán salía en español. Ahora es una cadena más del diccionario.
- **El título de la pantalla de destellos** tampoco estaba traducido.
- **Nombres y lugares de los diez objetos anteriores** seguían en español en los ficheros inglés y
  alemán (Módulo lunar del Apolo 11, Mar de la Tranquilidad, Telescopio Kepler…). Corregidos.
- **La dirección de los recursos** llevaba la versión antigua grabada a mano en `index.html`, y
  `window.__MSV` se había quedado en 3.3.3, con lo que los JSON se servían de caché vieja. Ahora hay un
  script, `herramientas/sella-version.py`, que lo pone todo al día desde `docs/VERSION`.

---

## v3.3.3 — 16 de noviembre de 2026

- **El menú de destinos se quedaba en español al cambiar de idioma.** Se construye una sola vez y no se
  rehacía, así que los nombres cortos nuevos no llegaban a verse hasta recargar. Ahora se reconstruye con
  el idioma elegido.

---

## v3.3.2 — 16 de noviembre de 2026

- **El pie de página se quedaba en el idioma anterior.** Al cambiar de idioma, el rótulo del nivel
  («modo explorar · información sencilla») seguía escrito en el idioma de antes, porque se pinta en una
  función aparte que no se volvía a llamar. Ahora se rehace con el resto.

---

## v3.3.1 — 16 de noviembre de 2026

- **La cabecera ya no corta los destinos en inglés y alemán.** El menú usaba la primera palabra del nombre,
  que en español funciona («La Luna» → «Luna») pero en inglés dejaba «The» y «Deep», y en alemán «Der». Ahora
  cada destino lleva su nombre corto en los tres idiomas: Luna/Moon/Mond, Marte/Mars/Mars,
  Espacio/Deep space/Tiefenraum.
- **«← Volver a los objetos» se traduce.** Era el único botón de la aplicación sin marca de traducción y se
  quedaba en español con la interfaz en inglés o alemán.

---

## v3.3.0 — 16 de noviembre de 2026

- **El formulario «Participa» y la política de privacidad hablan los tres idiomas** (español, inglés y alemán),
  como el resto de la aplicación. Si alguien navega en inglés y pulsa «Take part», el formulario sale en inglés:
  rótulos, ayudas, opciones de los desplegables, avisos de validación, mensajes de archivos y pantalla de gracias.
- El selector **ES · EN · DE** está también en la cabecera de las dos páginas, y el idioma viaja en la dirección
  (`?lang=en`) para que un enlace compartido abra el formulario ya traducido.
- El título de la pestaña y la descripción de las páginas se traducen con el resto, y los enlaces internos
  conservan el idioma al saltar de la aplicación al formulario y de ahí a la política de privacidad.
- Los textos de página viven en `js/idioma-paginas.js` (diccionario propio, cargado solo en esas dos páginas);
  `js/idioma.js` gana `MS_Idioma.anadir()` y el soporte de `?lang=`.
- Al cambiar de idioma con el formulario a medio rellenar **no se pierde nada**: se repintan rótulos,
  ayudas y filas de hitos, y lo escrito se queda.
- Corregido de paso: si se quitaba un hito del medio y se añadía otro, se repetían los identificadores
  de los campos (`hito-titulo-3` dos veces).
- Los avisos de error que devuelve el servidor siguen llegando en español; el formulario envía el campo
  `idioma` para que el mu-plugin pueda contestar en el idioma del visitante cuando se actualice.

---

## v3.2.3 — 16 de noviembre de 2026

- Cuando la respuesta es «Eso no está en mi ficha», **ya no se cita ninguna fuente**: no hay nada que citar
  y resultaba contradictorio. La cita sale en las respuestas que sí salen de la ficha y en las búsquedas
  externas.

---

## v3.2.2 — 16 de noviembre de 2026

- Al cambiar de idioma con el chat abierto **ya no se pierde la conversación**: se reescriben los rótulos,
  las sugerencias y el pie del panel, y los mensajes se quedan. Solo se vuelve a saludar si aún no se había
  hablado.
- También se refresca el pie del panel («Responde con la ficha del objeto y cita la fuente»), que se quedaba
  en el idioma anterior.

---

## v3.2.1 — 16 de noviembre de 2026

- **Arreglado: al cambiar de idioma con el chat abierto, los rótulos se quedaban en el idioma anterior**
  (el campo de preguntar seguía diciendo «¿Qué quieres saber de mí?» con la interfaz en alemán). La función
  que debía rehacer el panel no hacía nada porque el panel ya existía. Ahora se reescriben los rótulos, el
  botón del micrófono, el altavoz y las sugerencias, y **la conversación se conserva**.
- El botón de enviar no tenía identificador, así que su rótulo de accesibilidad tampoco se refrescaba.

---

## v3.2.0 — 16 de noviembre de 2026

- **Vuelve la cita en todas las respuestas del chat.** Desde la 3.0.1 la fuente solo salía si se pedía;
  ahora sale siempre, al pie de la respuesta, en pequeño.
- **La fuente ya no compite en tamaño con nada:** baja de `.74rem` a `.62rem` (de 11,8 a 9,9 píxeles),
  se parte si es una dirección larga y usa un gris más discreto. El resultado de «búsqueda externa»
  lleva su propio aviso en el mismo tamaño pequeño.
- **Botón «🔎 Buscar fuera de mi ficha»** dentro de la tarjeta de salidas. Solo busca si el visitante lo
  pulsa: la pregunta se manda al buscador de Ollama Cloud (tarifa plana) y el modelo **solo puede redactar
  con lo que traigan esas fuentes**, citando `[1]`, `[2]`… Si no cita al menos una fuente real, no hay
  respuesta: se dice que no se ha encontrado nada y no se inventa nada.
- Salvaguardas del servidor (`api/buscar.php`): respuestas **cacheadas 7 días** por pregunta e idioma,
  **8 búsquedas cada 10 minutos por visitante**, **400 al día en total**, se prefieren dominios de la NASA,
  el JPL, el LPI, la ESA y enciclopedias, y solo se enlazan las fuentes que el modelo cita de verdad.
- Cada búsqueda queda anotada en `busquedas.jsonl` (objeto, pregunta, idioma y resultado) para saber qué
  preguntas sigue sin cubrir la base.

---

## v3.1.0 — 16 de noviembre de 2026

- **Cuando la ficha no tiene la respuesta, el aparato ya no cierra la puerta.** En vez de un «Eso no consta
  en mi ficha» y punto, ofrece **tres preguntas que sí puede contestar** (sacadas de su propio guion y del
  modo activo) y un enlace a **Participa** para aportar el dato que falta.
- Se hace en los dos caminos: cuando el motor del navegador no encuentra nada y cuando el modelo contesta que
  no consta, con las tres frases (español, inglés y alemán).
- Las preguntas que **no encuentran fragmento** también se apuntan al registro del resumen semanal; antes solo
  se anotaban las que llegaban al modelo y volvían con «no consta», así que el correo de los lunes se perdía
  justo las más difíciles.
- Corregida la frase de la regla 9 del prompt, que en español devolvía la versión inglesa.
- Textos nuevos en los tres idiomas: `chat.sin.datos` y `chat.sin.aporta`.

---

## v3.0.5 — 15 de noviembre de 2026

- **Se pulsa el punto, no el nombre**: la caja del botón era tan ancha como el nombre y, cuando dos aparatos
  caían cerca, el nombre de uno tapaba el punto del otro. Ahora la caja no recibe clics y solo responde el
  punto con su halo: cada punto se pulsa en su sitio y ninguno roba el clic del vecino.

---

## v3.0.4 — 15 de noviembre de 2026

- **Los puntos del mapa ya no van por detrás del giro**: el CSS animaba el `transform` durante 200 ms y el giro
  reescribe la posición cada 40 ms, así que el punto (y su zona de pulsación) se quedaba atrás justo cuando
  cambiaba de lado el nombre. Ahora solo se anima la opacidad.

---

## v3.0.3 — 15 de noviembre de 2026

- **Arreglado el mapa**: en la 3.0.1 se quedó sin definir la función de traducción dentro de `mapa.js`, así que
  el mapa no llegaba a construirse y después del zoom solo se veía el planeta, sin puntos donde pulsar. Ahora
  vuelve a salir el mapa con sus puntos en la Luna, en Marte y en el espacio profundo.

---

## v3.0.2 — 15 de noviembre de 2026

- **Resumen semanal por correo de las preguntas sin respuesta.** Cuando un objeto contesta «eso no consta en mi
  ficha» (en cualquiera de los tres idiomas), la pregunta queda apuntada **sin ningún dato del visitante**: solo
  el objeto, el texto, el idioma y la fecha. Cada **lunes a las 08:00** (hora de Madrid) sale un correo a
  **nonopp@gmail.com** con: cuántos intentos y preguntas distintas hubo, qué objetos acumulan más huecos y una
  tabla con cada pregunta, cuántas veces se repitió, cuándo fue la última vez y en qué idioma.
  El fichero de la semana se archiva en el servidor y el contador vuelve a cero.
- **Política de privacidad actualizada**: se dice qué se guarda de esas preguntas sin respuesta (nada personal,
  sin IP), para qué y cuánto tiempo (12 meses).

---

## v3.0.1 — 15 de noviembre de 2026

- **El planeta queda centrado** al acabar el zoom del crucero: fuera el texto que iba al lado del mapa y que
  lo empujaba a la izquierda. La pista «toca un punto para acercarte» baja al pie de la ventana y va centrada.
- **El chat ya no enseña la fuente en cada respuesta**: solo aparece si el visitante la pide («fuente», «de
  dónde», «quién lo dice», «source», «Quelle»…). El aviso de ficha sin cotejar se mantiene.
- **Al cambiar de idioma se rehace el panel del chat**: rótulos, sugerencias y saludo salen en el idioma nuevo,
  y los textos del mapa (título, pie y pista del crucero) también se traducen.

---

## v3.0.0 — 15 de noviembre de 2026

- **Multidiomas: español, inglés y alemán**, de texto y de voz. Selector **ES · EN · DE** en la cabecera;
  el idioma se recuerda entre visitas y la primera vez se deduce del navegador.
- **Contenido traducido entero**: los 10 aparatos, los 30 hitos, los textos de los dos niveles, las
  presentaciones y las sugerencias del chat viajan en `datos/contenido.json` (español),
  `datos/contenido.en.json` y `datos/contenido.de.json`. La estructura es idéntica y **no se ha tocado ni
  una cifra, un nombre de nave ni una fecha**: se comprobó que los números de cada frase son los mismos
  que en el original.
- **La interfaz también**: títulos, botones del pie, conmutador de nivel, pantalla «Qué estás viendo» y
  todos los avisos del chat y del micrófono.
- **Voz en el idioma elegido**: el navegador usa su voz española, inglesa o alemana, y el saludo del objeto
  y el aviso de inactividad se dicen en ese idioma.
- **El chat contesta en el idioma del visitante**: el fragmento de la ficha sigue en español y el modelo
  lo redacta en inglés o alemán sin cambiar nombres propios ni cifras.
- Las páginas **Participa** y **Privacidad** siguen solo en español (son textos legales).

---

## v2.2.1 — 15 de noviembre de 2026

- **Al entrar en un objeto, la voz se enciende sola y el aparato se presenta**: «Hola, soy <nombre del
  objeto>. Pregúntame lo que quieras de mí.» Antes se leía la ficha entera del tirón.
- **Aviso de inactividad**: si pasan **20 segundos** en la ficha del objeto sin mover el ratón, sin teclear
  y sin mensajes nuevos en el chat, se dice «¿Sigues ahí?» y se repite la presentación. **Una sola vez por
  visita**: ni cada 20 s, ni al volver a moverse. Al cambiar de objeto o volver a entrar, la cuenta empieza
  de nuevo.
- Si el visitante **apaga la voz a mano**, se respeta: ni el saludo ni el aviso de inactividad suenan. Ese
  apagado vale para toda la sesión de la página.
- El saludo no se repite al cambiar de modo (explorador/científico): solo al entrar, no en cada repintado.

---

## v2.2.0 — 15 de noviembre de 2026

**Portada más clara.**

- El botón de la portada pasa a llamarse **«Modo explorador»**, igual que «Modo científico»: antes decía
  «Explorar» y parecía una acción, no un modo.
- **El modo elegido va encendido y el otro apagado**, como en la cabecera: antes los dos salían con el mismo
  relleno verde y no se sabía cuál estaba puesto.
- **Fuera el botón «¿Qué es esto?»** de la portada: el enlace baja al pie, junto a Participa y Privacidad.
- En el mapa, los puntos que caen fuera del disco ya no se quedan visibles sin poder pulsarse (el marco es
  redondo y recorta): se ocultan hasta que el giro los trae dentro. Barrido de 12 muestras seguidas: todos
  los puntos visibles responden al clic.

---

## v2.1.7 — 15 de noviembre de 2026

- Un punto pegado al borde del disco se veía a medias y **no se podía pulsar**: el marco es redondo y recorta
  lo que sobresale. Ahora, mientras el giro no lo trae dentro del disco, ese punto se esconde en vez de
  quedarse ahí como un señuelo. Comprobado: todos los puntos visibles responden al clic en su sitio.

---

## v2.1.6 — 15 de noviembre de 2026

- Con los nombres siempre visibles, la caja de un nombre podía tapar el punto de otro aparato y el clic se
  iba al equivocado. Ahora el nombre **no recibe clics** y el punto tiene una **zona de pulsación de 29 px**
  a su alrededor: se acierta en el punto, y el nombre solo sirve para leer.

---

## v2.1.5 — 15 de noviembre de 2026

- Corregido lo de la 2.1.4: al poner el nombre a la izquierda con `row-reverse`, el punto se iba al otro
  extremo de la caja y dejaba de estar sobre su coordenada (y en el borde derecho quedaba fuera del marco,
  sin poder pulsarse). Ahora el ancla se compensa con el `translate` y el punto sigue clavado en su sitio.

---

## v2.1.4 — 15 de noviembre de 2026

- El nombre de los puntos pegados al borde derecho del mapa se pone hacia dentro (a la izquierda del punto):
  antes, como el nombre estaba casi siempre oculto, no se notaba; ahora que se ve siempre, se salía del marco.

---

## v2.1.3 — 15 de noviembre de 2026

- En el mapa, los otros aparatos se distinguen por color y por nombre, no solo por el latido: el punto
  lleva **aro blanco** y la onda va en el **verde de la interfaz**, que no aparece en ningún planeta, así
  que no se confunde con un cráter (los cráteres se dibujan con aros grises). Y **el nombre se ve siempre**,
  tenue, y se enciende al pasar el ratón.

---

## v2.1.2 — 15 de noviembre de 2026

- Corregido lo que rompí en la 2.1.1: el JS del mapa coloca cada pin en cada fotograma con `transform` y
  `opacity` en línea, así que animar el propio pin lo sacaba de su sitio y le quitaba el fundido por
  profundidad. El latido pasa a un **anillo en un pseudo-elemento** del punto: se abre y se apaga como un
  radar, sin tocar la posición ni el tamaño que calcula el mapa.
- Los puntos de la cara visible del planeta ya no se apagan tanto al girar (opacidad mínima de 0,35 → 0,55):
  siguen teniendo profundidad, pero se leen.

---

## v2.1.1 — 15 de noviembre de 2026

- **El mapa del objeto se lee mejor.** Los puntos de los *otros* aparatos ahora **laten**: crecen y se
  encienden cada 2,6 s, cada uno con su propio desfase para que no parpadeen todos a la vez. Así se distingue
  de un vistazo lo que es un botón de lo que es un cráter o una sombra del planeta.
- Al pasar el ratón o llegar con el tabulador el latido se acelera, se enciende el punto y aparece el nombre.
  El aparato que se está viendo queda fijo, más marcado y sin latido: es donde estás.
- Con «reducir movimiento» activado no hay latido: el punto lleva un anillo fijo más grueso, que se distingue
  igual sin animación.

---

## v2.1.0 — 15 de noviembre de 2026

**El aviso de cada propuesta trae los archivos, con enlace.**

- Nuevo **`/app/api/descarga.php`**: sirve los adjuntos de una propuesta desde fuera de la carpeta pública,
  solo con un **enlace firmado** (HMAC-SHA256 con una clave guardada en el servidor, `~/.ms/descarga.key`, 600).
  El enlace **caduca a los 30 días**, y no vale ni con la firma cambiada, ni caducado, ni con otra ruta, ni
  con un identificador inventado: 404 en todos esos casos (probado).
- El correo de aviso ya no dice solo «1 zip y 3 documentos»: lista cada archivo con su nombre y su enlace de
  descarga, y advierte de que los enlaces no se publican.
- La carpeta de propuestas **sigue cerrada a la web** (`/contribuciones/…` da 404); lo que se abre es el
  enlace firmado, uno por archivo.
- Probado con un envío real de fotos (zip con 3 imágenes), un PDF, un MD y un TXT: los cuatro enlaces
  descargan el archivo exacto (sha256 idéntico al original).

---

## v2.0.2 — 15 de noviembre de 2026

- La pista del modo «Explorador» ya no dice «El aparato te hablará como si tuvieras menos de 10 años».
  Queda: «Información más sencilla: frases cortas y palabras claras, como para escolares y estudiantes.»

---

## v2.0.1 — 15 de noviembre de 2026

- Corregido: si la grabadora se paraba sola (se corta la pista de audio, se alcanza el tope de 30 s o
  falla el dispositivo) el botón del micrófono se quedaba en rojo, como si siguiera escuchando. Ahora el
  estado se apaga siempre al enviar la grabación, venga de donde venga el final.

---

## v2.0.0 — 15 de noviembre de 2026

**El chat se usa hablando.**

- **Micrófono en el chat.** Se dicta la pregunta y el texto aparece escrito en la caja, donde se puede
  corregir antes de enviar. La transcripción la hace `gpt-transcribe` (OpenAI) desde un endpoint propio
  (`/app/api/voz.php`); el audio **se borra en el acto** y no se guarda en ningún sitio.
- **El objeto contesta en voz alta.** Al recibir una respuesta se lee con la voz del sistema, sin servicios
  de pago. El altavoz de la cabecera del chat y el de la cabecera de la página son **el mismo interruptor**.
  El dictado enciende la voz solo, para que la conversación sea de ida y vuelta.
- **Respuestas habladas más cortas.** Cuando la voz está puesta, la petición viaja con `voz:1` y el modelo
  contesta en dos frases y menos de 40 palabras, con los números dichos enteros («setecientos cincuenta y
  seis segundos»), que es lo que se puede escuchar con sentido.
- **La ficha de un objeto abre el chat sola.** Ya no hay que buscar el botón «Pregúntame»; se abre sin
  llevarse el foco, para que en el móvil no aparezca el teclado encima del modelo. Sigue cerrándose al
  cambiar de objeto, de pantalla o al volver al inicio, y al cerrar se calla la voz y se suelta el micrófono.
- **Privacidad** actualizada: qué audio se envía, a quién, para qué y que se borra al transcribirlo.

---

## v1.3.4 — 15 de noviembre de 2026

- El aviso de cada propuesta vuelve a **nonopp@gmail.com**, como estaba: el correo de la primera prueba
  sí había llegado, solo que Gmail lo clasificó y apareció en otra pestaña de la bandeja.
- Comprobado con un registro temporal en WordPress: el aviso sale `para=nonopp@gmail.com` y con el
  correo de quien envía en `Reply-To`, que es lo que hace la respuesta directa.

---

## v1.3.3 — 15 de noviembre de 2026

- **Arreglado: el formulario de «Participa» no se veía.** Nacía con el atributo `hidden` pensado para
  la pantalla de gracias, y nadie lo quitaba: el visitante solo veía la introducción y el aviso. Ahora
  el formulario se ve desde el primer momento y lo que se oculta es la pantalla de gracias.
- El aviso de cada propuesta pasa a **info@nonopp.com**, comprobado de punta a punta: el servidor de
  nonopp.com recibe el mensaje y lo reenvía a la cuenta de Gmail, que lo acepta.
- Comprobado el envío completo desde el navegador: formulario relleno, botón bloqueado hasta marcar
  las dos casillas y pantalla de gracias con el identificador del envío.

---

## v1.3.2 — 15 de noviembre de 2026

- El chat se cierra solo al cambiar de objeto, de pantalla o al volver al inicio: ya no se queda
  abierto encima de lo nuevo. Se cierra en el único punto por el que pasan todos los cambios de
  pantalla, así no hay ruta que se escape.
- En la ficha, la tercera columna ya no queda vacía con el chat cerrado: muestra una tarjeta
  «Pregúntame» que lo abre. El chat deja de flotar en esa pantalla y pasa a formar parte de la página.
- El pie se recoloca en una sola línea: enlaces de Participa y Privacidad, nivel y versión.

---

## v1.3.1 — 15 de noviembre de 2026

- En el móvil y la tableta, la ficha del objeto cambia de orden: primero el modelo 3D, después el
  título y el año, luego el chat, después el carrusel de hitos y por último los botones. El mapa, que
  no estaba en la lista, queda al final.
- En pantalla grande no cambia nada: siguen las tres columnas de 300, 800 y 392 píxeles.
- Se consigue con `display:contents` en las columnas y orden explícito, sin duplicar contenido ni
  tocar el HTML.

---

## v1.3.0 — 15 de noviembre de 2026

**Formulario «Participa»**

- Botón «Participa» en la cabecera, a la derecha de los controles, y enlace en el pie.
- Página nueva `participa.html` con las condiciones acordadas: objeto y correo obligatorios; misión,
  agencia, cuerpo, año, lugar, estado, resumen, fuente y crédito opcionales; hasta tres hitos con su
  fuente; zip de fotos de 25 MB y hasta tres documentos de 10 MB.
- Zona de arrastre para el zip con contador de tamaño, errores en línea sin perder lo escrito, botón
  bloqueado hasta marcar las dos casillas y pantalla de gracias con el identificador del envío.
- Aviso honesto sobre el 3D: hacen falta entre 40 y 60 fotos con 70 % de solape; no se promete modelo
  automático.
- Sin cookies y sin guardar nada en el navegador.

**Recepción en WordPress (srv2)**

- `servidor/mu-plugin/memory-signals-contribuciones.php`, instalado como mu-plugin: ruta pública
  `POST /wp-json/memory-signals/v1/contribucion`.
- Guarda cada envío en `/home/gesemweb-nasa/contribuciones/<id>/` con `envio.json` y los adjuntos,
  **fuera de la carpeta pública** y con permisos restringidos.
- Comprueba el tipo real de los archivos (no la extensión), valida el zip (sin rutas raras, sin
  comprimidos dentro, tope de entradas y de imágenes) y renombra todo.
- Antispam: campo trampa, tiempo mínimo de relleno y límite de 1 envío por hora y 5 al día por IP
  (guardada cifrada).
- Aviso por correo con `wp_mail()` y WP Mail SMTP (IONOS), con el correo de quien envía en `Reply-To`.
  Los adjuntos no viajan por correo: se quedan en el servidor.
- CORS limitado a los orígenes propios.

**Privacidad**

- `privacidad.html` nueva, con el responsable y el correo `info@gesemweb.net`, RGPD y LOPDGDD,
  conservación de 12 meses, licencia CC BY-SA 4.0, regla de mayores de 18 años y el detalle real de
  quién aloja qué: el formulario en Oracle Cloud (Alemania, UE), el correo en IONOS (UE), la copia
  estática en GitHub (EEUU) y el chat en un proveedor externo de modelos de lenguaje.

**Servidor**

- La raíz de `nasa.gesemweb.es` redirige a `/app/`: quien entre por el dominio ve la aplicación y no
  WordPress.
- `client_max_body_size 48m` en el sitio, porque el valor por defecto de nginx (1 MB) habría rechazado
  cualquier subida.

---

## v1.2.2 — 15 de noviembre de 2026

- El logotipo crece un 20 %: pasa de 44 a 53 píxeles de alto, 135 de ancho en pantalla de escritorio. La barra
  superior sube de 72 a 81 píxeles y el texto del logotipo se lee con holgura.
- En el móvil el emblema pasa de 34 a 41 píxeles.

---

## v1.2.1 — 15 de noviembre de 2026

- Fuera el icono redondo que había encima del titular de la portada. Con él se va su código de estilo.
- Se actualizan las descripciones del sitio, que ya no hablan de un astronauta de bienvenida.

---

## v1.2.0 — 15 de noviembre de 2026

**Logotipo**

- El logotipo de Memory Signals sustituye al texto de la marca, arriba a la izquierda.
- Se ha recortado el fondo oscuro del original y se ha convertido en PNG con transparencia, para que se
  apoye limpiamente sobre el fondo de la aplicación sin caja ni halo. Se conserva el brillo original.
- En pantallas pequeñas se muestra solo el emblema redondo, que se lee mejor a ese tamaño.
- Icono de pestaña y de pantalla de inicio a partir del emblema, y etiquetas para compartir el enlace.
- Ficheros: `img/logo-memory-signals.png` (logotipo completo), `img/logo-emblem.png` (emblema),
  `img/favicon-64.png` y `img/apple-touch-icon.png`.

---

## v1.1.0 — 15 de noviembre de 2026

**Hitos del aparato en bocadillo**

- Cada uno de los diez aparatos tiene tres tarjetas con hitos de su historia, en la columna central,
  debajo del modelo 3D y encima de los botones.
- Forma de bocadillo con rabillo arriba a la izquierda, fondo azul marino y borde azul claro, los del chat:
  parece que habla el propio aparato.
- Contenido: el objetivo o el motivo de la misión, el avance o el hito del aparato y la consecuencia o el
  descubrimiento. Un solo registro, lenguaje llano, entre 23 y 53 palabras por tarjeta.
- Quince segundos por tarjeta, con puntos y flechas, se detiene al pasar el ratón o al enfocar, se pasa con
  el dedo en el móvil y respeta la preferencia de reducir movimiento.
- El texto va justificado con partición de palabras: las líneas llegan al borde derecho.
- Cada tarjeta guarda su fuente en los datos. Los mitos se cuentan con la corrección dentro: el velcro lo
  patentó George de Mestral y fue el Apolo el que lo popularizó, no al revés.

**Arreglos**

- En la ficha del objeto, el papel de las personas salía como «undefined» en siete aparatos: el dato venía
  como `rol` en unos y como `papel` en otros.
- La lista «Fuentes de este objeto» salía vacía: ahora cada fuente lleva su enlace, sacado de la ficha del
  aparato, y si un aparato no tiene fuentes lo dice en vez de dejar el título solo.
- La frase de estado del aparato no se mostraba cuando venía como una sola frase, y el resumen salía repetido.
- Todos los recursos llevan la versión en la dirección (`?v=1.1.0`), así el navegador no puede servir una
  copia vieja del CSS o del JS después de un despliegue.

---

## v1.0.0 — 15 de noviembre de 2026

Primera versión cerrada y numerada. Es la aplicación completa y funcionando, publicada en
https://nasa.gesemweb.es/app/ y https://nonopp.github.io/memory-signals/.

**Recorrido**

- 10 aparatos reales abandonados, todos con modelo 3D oficial de NASA 3D Resources:
  módulo lunar del Apolo 11 (Luna); Opportunity, InSight, Viking 1 y 2, Ingenuity (Marte);
  Voyager 1, NEAR Shoemaker, Pioneer 10, Dawn y Kepler (espacio profundo).
- Portada con tres botones: Explorar, Modo científico y ¿Qué es esto? Cada botón explica al pasar
  el ratón qué información va a recibir el visitante. Sin pantalla de edad.
- Pantalla del aparato en tres columnas: mapa del destino con puntos clicables, aparato en 3D y
  chatbot. Título, lugar y año de lanzamiento o llegada arriba de la primera columna.
- El zoom del crucero termina en el mapa del destino, con un punto por aparato en sus coordenadas
  reales y clicables.
- Sin modelo 3D oficial no hay ficha navegable: Surveyor 3, LRV del Apolo 17, ALSEP, Sojourner y
  Phoenix quedan fuera (la NASA no publica modelo de ninguno de los cinco).

**Chatbot**

- Recupera la ficha y los párrafos en el navegador; el servidor solo redacta sobre ese fragmento.
- Dos registros distintos, comprobados: explorador (primera persona, palabras de todos los días,
  comparaciones cotidianas) y científico (terminología, cifras con unidades, causa y efecto).
- El modo elegido viaja con cada pregunta y el panel muestra en cuál está hablando.
- Preguntas sugeridas tomadas del guion del propio aparato, rotando para no repetir siempre las mismas.
- Si el endpoint no está disponible, responde con el texto de la ficha.
- Límite de 15 preguntas cada 10 minutos por IP, sin registro de preguntas.

**Base de conocimiento**

- 74 fichas, 14 marcadas como verificadas y 60 como prototipo, con índice de búsqueda.

**Servidor**

- Endpoint PHP en srv2, clave del modelo fuera del docroot, CORS limitado a los orígenes propios.
- Petición al modelo con `think: false`, que evita respuestas vacías y cortadas y baja la latencia
  de 2-4 s a 0,7-1,5 s.
