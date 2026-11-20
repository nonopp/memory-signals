# Memory Signals

**Objetos abandonados de la NASA que todavía siguen ahí fuera.**

Proyecto para el reto *NASA's Discarded Equipment Storytelling* del **NASA Space Apps Challenge 2026**.

La NASA dejó en la Luna, en Marte y en el espacio profundo equipo que ya no funciona pero que sigue
en su sitio. En Memory Signals un astronauta te invita a viajar hasta allí y a conversar con esos
objetos: cómo llegaron, qué hacían cada día, qué descubrieron y **quién trabajó de verdad en su misión**.

## Cómo verlo

Es una web estática: no necesita servidor, ni base de datos, ni compilación.

```bash
cd docs
python3 -m http.server 8123
# abre http://127.0.0.1:8123
```

Publicado en **dos sitios**, desde el mismo código:

- https://nonopp.github.io/memory-signals/ — GitHub Pages, se actualiza en cada push a `main`
- https://nasa.gesemweb.es/app/ — servidor propio, copia estática

## Plan de trabajo

El estado, las decisiones abiertas y las **tandas de objetos pendientes** están en el roadmap del
proyecto, en la bóveda de trabajo: `Proyectos/NASA-APP/ROADMAP - Memory Signals.md`. Ese documento es
la fuente única del plan; el `CHANGELOG.md` cuenta lo que ya está publicado y con qué número de versión.

## Qué tiene dentro

- **Siete pantallas** con una máquina de estados: intro → edad → gusto → destino → crucero →
  destellos → objeto → pausa.
- **Dos niveles de lectura**: *Explorador* (8-11 años) y *Científico* (12-15). El conmutador está
  siempre visible y **no reinicia el viaje**: solo cambia el texto del turno en curso.
- **Cinco objetos con guion completo** (30 turnos, 60 textos): Surveyor 3 y el rover lunar del
  Apolo 17 en la Luna; Opportunity e InSight en Marte; Voyager 1 en el espacio profundo.
- **Voz opcional** con `speechSynthesis`; los subtítulos siempre están visibles.
- **Todo con clics**: nadie tiene que escribir nada.
- **Ficha y fuentes** por objeto: cada turno cita NASA, JPL o LPI. Si un dato no se puede citar,
  no se cuenta.
- **Sin dependencias**: JavaScript de navegador, sin frameworks ni CDN.

## Estructura

```
docs/
  index.html              pantallas y estructura
  css/estilo.css          tema espacial, responsive, accesible
  js/motor.js             máquina de estados, niveles, voz, ficha
  js/escena.js            canvas: cielo, crucero y superficie con destellos
  datos/contenido.json    TODO el texto de la experiencia
  datos/objetos-v0.json   catálogo de los 60 objetos del prototipo anterior
```

**Aquí no hay ni una frase escrita en el código.** Todo el guion vive en `datos/contenido.json`.

## Añadir un objeto

1. Copia un bloque de `aparatos` en `datos/contenido.json` y cámbialo.
2. Escribe los seis turnos: `pregunta`, `opciones` (dos), `texto_explorador`, `texto_cientifico` y `fuente`.
3. Añade el `id` al destino que le corresponda.
4. Comprueba que la página sigue bien: `python3 -m http.server` y abre el destino.

No hay que tocar el motor. Ver [CONTRIBUTING.md](CONTRIBUTING.md).

## Reglas de contenido

- Cada turno cita su fuente. Sin fuente, el turno no existe.
- Textos cortos: Explorador ≤ 40 palabras, Científico ≤ 70.
- Personas reales con nombre y papel en la misión, sin inventar.
- Nada de datos que no se puedan verificar en NASA, JPL o LPI.

## Créditos

Datos de NASA Science, NASA History, JPL y el Lunar and Planetary Institute.
Imágenes y nombres de misiones pertenecen a la NASA. Código bajo licencia MIT.
