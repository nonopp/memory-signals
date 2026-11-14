# Cómo contribuir

Memory Signals crece añadiendo objetos, no reescribiendo la aplicación.

## Añadir un objeto nuevo

Edita **solo** `web/datos/contenido.json`.

```json
{
  "id": "surveyor-1",
  "nombre": "Surveyor 1",
  "cuerpo": "Luna",
  "lugar": "Oceanus Procellarum",
  "anio": "1966",
  "color": "#7fb7ff",
  "ficha_resumen": "Una frase que resuma qué es y por qué importa.",
  "estado_texto": {
    "texto_explorador": "Cómo está hoy, en palabras sencillas.",
    "texto_cientifico": "Cómo está hoy, con el dato técnico."
  },
  "personas": [
    { "nombre": "Nombre real", "rol": "papel en la misión" }
  ],
  "fuentes": [
    { "texto": "NASA Science — Surveyor 1", "url": "https://science.nasa.gov/..." }
  ],
  "turnos": [
    {
      "id": "encuentro",
      "pregunta": "¿Quién anda ahí?",
      "texto_explorador": "≤ 40 palabras, frases cortas, sin siglas sin explicar.",
      "texto_cientifico": "≤ 70 palabras, con la cifra y el término técnico.",
      "opciones": ["Hola, vengo de la Tierra", "¿Cuánto tiempo llevas aquí?"],
      "fuente": "NASA Science — Surveyor 1"
    }
  ]
}
```

Después añade `"surveyor-1"` a la lista `aparatos` del destino correspondiente en `destinos`.

## Las seis preguntas de cada objeto

1. **Encuentro** — quién es y dónde está.
2. **Cómo llegué** — el viaje y el aterrizaje.
3. **Qué hacía cada día** — el trabajo para el que se construyó.
4. **La persona** — alguien real de su misión, con nombre y papel.
5. **Lo que descubrí** — el hallazgo, con su cifra.
6. **Cierre** — cómo está hoy y qué deja.

## Reglas que no se negocian

- **Sin fuente no hay turno.** Cada `turno` y cada `fuentes` apuntan a NASA, JPL o LPI.
- **Dos niveles, un guion.** El mismo turno en dos registros; nunca dos versiones distintas de los hechos.
- **Nada de texto en el código.** Si una frase no está en el JSON, no existe.
- **Personas reales verificables.** Nombre y papel tal como aparecen en la fuente.
- **Voyager 1 es la excepción honesta**: no está abandonada, sigue transmitiendo. El objeto lo dice.

## Probar los cambios

```bash
cd web && python3 -m http.server 8123
```

Recorre los tres destinos y las dos versiones de cada turno antes de abrir el pull request.
