---
fecha: 2026-11-14
titulo: APIs de objetos espaciales (verificadas con curl)
tipo: prueba-tecnica
etiquetas: ['#nasa', '#datos', '#apis', '#catalogo', '#verificado']
estado: verificado
---

# APIs de objetos espaciales

#nasa #datos #apis #catalogo

Sondas ejecutadas el **2026-11-14** desde el servidor del equipo (curl, sin credenciales salvo
donde se indica). Objetivo: saber que fuente da **ficha detallada por objeto** (no solo imagenes).

## Responden sin credenciales (200 hoy)

| Fuente | Endpoint | Que devuelve por objeto | Prueba real |
|---|---|---|---|
| JPL Horizons | `ssd.jpl.nasa.gov/api/horizons.api` | Efemerides + ficha fisica de cualquier cuerpo **y de naves** (`COMMAND='-31'` = Voyager 1) | 200, ficha de Voyager 1 |
| JPL SBDB | `ssd-api.jpl.nasa.gov/sbdb.api?sstr=433&phys-par=1` | Asteroide/cometa: orbita, elementos, parametros fisicos, descubrimiento | 200 - Eros: diametro 16.84 km, densidad 2.67 g/cm3, rotacion 5.27 h, polo 11.37/17.22 |
| JPL SBDB Query | `ssd-api.jpl.nasa.gov/sbdb_query.api?fields=...&sb-kind=a` | Consulta filtrada sobre todo el catalogo de cuerpos menores | 200, Ceres primero |
| JPL CAD | `ssd-api.jpl.nasa.gov/cad.api?date-min=...&dist-max=...` | Aproximaciones cercanas: fecha, distancia, velocidad relativa | 200, 34 pasos < 0.05 AU desde hoy |
| CelesTrak GP | `celestrak.org/NORAD/elements/gp.php?CATNR=14780&FORMAT=JSON` | Elementos orbitales (OMM/TLE) de cualquier objeto catalogado | 200, Landsat 5 epoch 2026-11-14T05:50 |
| CelesTrak SATCAT | `celestrak.org/satcat/records.php?CATNR=5&FORMAT=JSON` | Ficha de catalogo: tipo, dueño, fecha de lanzamiento, decaimiento, apogeo/perigeo, RCS | 200, Vanguard 1: 1958-03-17, sin decay, 3819 x 651 km, 34.24 deg |
| NASA NSSDCA NMC | `nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=<COSPAR>` | Ficha historica de la nave (no es API, es HTML) | 200 - ojo: ID malo tambien da 200 con "Please search again" |
| NASA Image Library | `images-api.nasa.gov/search?q=<texto>&media_type=image` | Fotos con descripcion, centro y fecha | 200 |
| NASA Open APIs | `api.nasa.gov/neo/rest/v1/neo/<id>?api_key=DEMO_KEY` | Objetos cercanos a la Tierra con pasos y diametros | 200 (DEMO_KEY limitada) |
| NASA Exoplanet Archive | `exoplanetarchive.ipac.caltech.edu/TAP/sync?query=...&format=json` | Tabla de planetas con parametros estelares y planetarios | 200, **40.414** planetas confirmados |
| Gaia DR3 (ESA) | `gea.esac.esa.int/tap-server/tap/sync` (ADQL) | Astrometria y fotometria de estrellas | 200, **1.811.709.771** fuentes |
| MAST | `mast.stsci.edu/api/v0/invoke` | Observaciones HST/JWST/TESS por cono de busqueda | 200, devuelve filas TESS |
| Launch Library 2 | `ll.thespacedevs.com/2.2.0/launch/previous/` | Lanzamientos, vehiculos, misiones | 200, 7.663 lanzamientos |

## Requieren registro (fallan hoy sin credencial)

| Fuente | Endpoint | Error hoy | Tramite |
|---|---|---|---|
| ESA DISCOSweb | `discosweb.esoc.esa.int/api/objects` | 401 `Authentication is required` | Token gratuito por registro de email. Es la mejor fuente de **caracteristicas fisicas de debris** (masa, area, material). |
| Space-Track | `space-track.org/basicspacedata/query/...` | 401 `You must be logged in` | Cuenta gratuita (requiere email + aprobacion). Catalogo completo y decaimientos. |
| N2YO | `api.n2yo.com/rest/v1/satellite/positions/...` | 200 con `No API Key provided` | API key gratuita; posiciones en tiempo real. |

## Caidas hoy (no es culpa del codigo)

- **SIMBAD y VizieR (CDS)** devuelven pagina "Page unavailable - CDS" (HTTP 404) y el host
  `simbad.u-strasbg.fr` no responde. Sirven para identificadores y bibliografia de objetos
  galaticos; reintentar mas tarde, no bloquear el diseno por ellas.

## Combinacion recomendada para el reto #1 (hardware abandonado)

Una ficha por aparato sale de cuatro fuentes, todas sin clave:

1. **CelesTrak SATCAT** -> datos de catalogo (lanzamiento, estado, orbita, sin decaimiento).
2. **CelesTrak GP** -> posicion orbital actual, propagable en el navegador con satellite.js.
3. **JPL Horizons** -> si la nave salio de orbita terrestre (Voyager, Pioneer), su posicion real.
4. **NSSDCA NMC** -> ficha historica + **NASA Image Library** para foto con credito.

Regla: cada cifra que diga un personaje en la demo se cita de una de estas cuatro, con su URL.
