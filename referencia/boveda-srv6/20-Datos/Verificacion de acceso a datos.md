---
fecha: 2026-11-13
titulo: Verificacion de acceso a datos (pruebas reales)
tipo: prueba-tecnica
etiquetas: ['#nasa', '#datos', '#apis', '#verificado']
estado: verificado
---

# Verificacion de acceso a datos

#nasa #datos #apis

Pruebas ejecutadas el **2026-11-13** desde el servidor del equipo. Objetivo: saber que APIs
responden **sin credenciales** antes de comprometerse con un desafio.

## Resultados

| Fuente | Endpoint | Sin clave | Resultado |
|---|---|---|---|
| JPL Horizons | ssd.jpl.nasa.gov/api/horizons.api | SI | 200 + efemerides reales |
| NASA POWER | power.larc.nasa.gov/api/temporal/daily/point | SI | 200, datos MERRA-2 por punto |
| GIBS (imagenes) | gibs.earthdata.nasa.gov/wmts/epsg4326/best/ | SI | 200, JPEG servido |
| NASA Open APIs | api.nasa.gov (DEMO_KEY) | SI (limitada) | 200 |
| NAIF SPICE kernels | naif.jpl.nasa.gov/pub/naif/generic_kernels/spk/planets/ | SI | 200 (de440s.bsp) |
| NASA FIRMS | firms.modaps.eosdis.nasa.gov/api/area/ | **NO** | 400 "Invalid MAP_KEY" |
| GES DISC / MERRA-2 | goldsmr4.gesdisc.eosdis.nasa.gov | **NO** | 404/401, requiere Earthdata Login |

## Hallazgo clave: #11 Lunar Landing Site Navigator es viable hoy

Consulta real de azimut/elevacion del Sol desde un sitio en el polo sur lunar (89.9S, 0E)
para las fechas del hackathon:

```
2026-Nov-14 12:00  az=59.479  el=-1.609  dist=1941.824 Gm
2026-Nov-15 12:00  az=71.662  el=-1.589  dist=1941.375 Gm
2026-Nov-16 12:00  az=83.839  el=-1.566  dist=1940.847 Gm
```

Elevacion negativa = Sol **bajo el horizonte**. Es exactamente el problema del desafio
(iluminacion extrema en el polo sur): sirve como caso de prueba y como demo del nucleo
del algoritmo, sin descargar un solo raster.

Query que funciona (reutilizable):

```
https://ssd.jpl.nasa.gov/api/horizons.api?format=text
  &COMMAND='10'            # Sol
  &OBJ_DATA='NO'
  &MAKE_EPHEM='YES'
  &EPHEM_TYPE='OBSERVER'
  &CENTER='coord@301'      # 301 = Luna
  &COORD_TYPE='GEODETIC'
  &SITE_COORD='0,89.9,0'   # lon, lat, alt
  &TLIST='2461359.0'
  &QUANTITIES='4,13'       # 4 = az/el aparente, 13 = distancia
```

Para la Tierra vista desde la Luna: mismo patron con `COMMAND='399'` y `CENTER='coord@301'`.
Esto da la ventana de comunicacion directa a Tierra.

## Fricciones detectadas

- **FIRMS exige MAP_KEY** (registro gratuito). No bloquea el desafio #8, pero es un paso previo obligatorio: solicitarlo el dia 1, no el dia 2.
- **GES DISC / Earthdata** requiere cuenta Earthdata + aceptar acuerdos por aplicacion. Evitar si se puede usar POWER/GIBS/Horizons.
- **DEMO_KEY** de api.nasa.gov tiene limite por hora: pedir clave propia al inicio del evento.

## Implicacion para la shortlist

- #11 Lunar Landing Site Navigator: **datos confirmados accesibles**. Se puede prototipar el motor de geometria hoy mismo.
- #8 Hot Spots: viable pero con registro previo.
- #6 Field Shift: POWER confirmado, sin friccion (buen plan B).
