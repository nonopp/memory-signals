# Historial de versiones — Memory Signals

La versión vive en `docs/VERSION` y se muestra en el pie de la aplicación.
Cada versión lleva su etiqueta en el repositorio (`v1.0.0`, `v1.1.0`, …) y un archivo
comprimido guardado fuera del servidor, en `gdrive:Backups/memory-signals/`.

Criterio de numeración:

- **1.0.0 → 1.1.0**: mejoras y añadidos que no rompen lo anterior (aparatos nuevos, pantallas nuevas).
- **1.0.0 → 1.0.1**: correcciones de fallos y retoques de texto.
- **1.1.0 → 2.0.0**: cambios de fondo que alteran cómo funciona la aplicación.

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
