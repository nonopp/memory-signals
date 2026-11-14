# Base de conocimiento · Memory Signals

Fichas de los aparatos que la NASA dejó en la Luna, en Marte y más allá, para que el chatbot
responda con datos citables en lugar de improvisar.

**74 fichas**: 14 cotejadas una a una contra las fuentes NASA del reto y 60 procedentes del
catálogo del prototipo, aún sin cotejar.

## Cómo lo consulta el chatbot (protocolo de dos pasos)

```
1) GET kb/indice.json          → ~44 KB con todas las fichas resumidas
2) GET kb/<ruta de la ficha>   → el .md completo, solo del objeto del que se habla
```

Regla: **nunca cargar las 74 fichas**. El índice trae `titulo`, `alias`, `palabras_clave`,
`cuerpo`, `resumen` y `ruta` de cada una; con eso se busca por palabras y se carga únicamente
la ficha elegida. Dos peticiones por pregunta, no setenta y cuatro.

## Qué significa `verificacion` en cada ficha

| Valor | Qué garantiza |
|---|---|
| `verificado` | Cada dato se cotejó contra la fuente NASA enlazada en `fuente_principal` y en `otras_fuentes`. Son los 14 objetos oficiales del reto. |
| `prototipo` | Procede del catálogo del prototipo. **No** está cotejado con NASA. El chatbot debe decirlo al usuario si responde con una de estas fichas. |

Un dato que no aparece en la fuente no se inventa: la ficha dice literalmente
«No consta en las fuentes consultadas».

## Estructura de una ficha

```yaml
---
id: surveyor-3                     # identificador estable, igual al nombre del fichero
titulo: Surveyor 3
cuerpo: Luna                       # Luna · Marte · Espacio · espacio interestelar…
tipo: módulo de descenso no tripulado
anio: 1967
estado: fuera de servicio · sigue en la Luna
lugar: Oceanus Procellarum, 3° S / 23,41° O
mision: Surveyor
verificacion: verificado           # verificado | prototipo
fuente_principal: https://science.nasa.gov/mission/surveyor-3/
otras_fuentes:
  - https://…
alias: ["Surveyor 3", "Surveyor-C"]
palabras_clave: ["luna", "alunizaje", "apolo 12"]
personas:
  - nombre: Pete Conrad
    rol: comandante del Apolo 12, retiró piezas de Surveyor 3 en 1969
resumen: Una o dos frases con lo esencial.
---
```

Secciones del cuerpo, siempre en este orden: **Qué es · Cómo llegó · Qué hacía ·
Qué descubrió · Dónde está hoy · Personas · Datos técnicos · Fuentes**.

## Reglas de contenido

1. **Sin fuente no hay dato.** Cada sección se apoya en `fuente_principal` u `otras_fuentes`.
2. **Personas reales, sin inventar.** Nombre y papel tal como aparecen en la fuente. El aparato
   habla en primera persona; las personas reales no: se describe lo que hicieron, no se les
   pone en la boca nada que no esté documentado. Banerdt, Lognonné y Squyres están vivos.
3. **Nada de futuro.** Una ficha describe lo comprobado, no lo previsto.
4. **Español de España**, frases cortas, cifras con unidad.

## Cómo añadir o corregir una ficha

1. Copia una ficha existente del mismo cuerpo y cámbiala.
2. El nombre del fichero es el `id` más `.md`.
3. Vuelve a construir el índice (o pide que se reconstruya): `indice.json` se genera leyendo el
   frontmatter de todas las fichas.
4. Comprueba que el `id` no está repetido: el índice falla si hay duplicados.

## Origen de los datos

- Recursos oficiales del reto: NSSDCA (`nssdc.gsfc.nasa.gov`), NASA Science
  (`science.nasa.gov`), NASA History y JPL. La lista completa está en
  `../referencia/objetos-web-v0.json` y en la ficha del reto en spaceappschallenge.org.
- APIs verificadas para ampliar datos: JPL Horizons, JPL SBDB, CelesTrak SATCAT y GP,
  NSSDCA NMC, NASA Image Library, NASA Exoplanet Archive, Gaia DR3, MAST y Launch Library 2.
