# Historial de versiones — Memory Signals

La versión vive en `docs/VERSION` y se muestra en el pie de la aplicación.
Cada versión lleva su etiqueta en el repositorio (`v1.0.0`, `v1.1.0`, …) y un archivo
comprimido guardado fuera del servidor, en `gdrive:Backups/memory-signals/`.

Criterio de numeración:

- **1.0.0 → 1.1.0**: mejoras y añadidos que no rompen lo anterior (aparatos nuevos, pantallas nuevas).
- **1.0.0 → 1.0.1**: correcciones de fallos y retoques de texto.
- **1.1.0 → 2.0.0**: cambios de fondo que alteran cómo funciona la aplicación.

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
