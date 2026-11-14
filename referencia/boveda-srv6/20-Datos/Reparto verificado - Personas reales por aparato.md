---
fecha: 2026-11-14
titulo: Reparto verificado - Personas reales por aparato
tipo: datos-verificados
etiquetas: ['#nasa', '#hackathon', '#datos', '#reto-1', '#personas', '#exactitud']
estado: verificado
fuentes: [science.nasa.gov, jpl.nasa.gov, nssdc.gsfc.nasa.gov]
---
# Reparto verificado — Personas reales por aparato

#nasa #hackathon #datos #reto-1

Base para la mecanica de rotacion de la idea de Paco: cada aparato abandonado pregunta al
visitante por **una persona real del equipo de su mision**, y la respuesta desbloquea un
trozo de su historia. Todo citable a fuente NASA/JPL/NSSDC: nada de personajes inventados.

**Decision registrada (2026-11-14):** "el equipo" = el grupo real de personas de la NASA
(y sus contratistas) involucrado en la mision a la que pertenecio el objeto. No es el
equipo del hackathon.

## Regla de exactitud (la mas importante)

El aparato habla en primera persona; las personas reales **no**. Se puede decir
"Conrad y Bean caminaron hasta mi" (hecho verificable), nunca poner frases inventadas en
boca de una persona real ("Conrad me dijo: ..."). Si hace falta voz humana, se cita
literalmente una frase documentada, o se describe lo que hizo. Vivir: Banerdt,
Lognonne, Squyres estan vivos: una cita inventada es un fallo grave de exactitud.

## Aparato 1 — Surveyor 3 (Luna, Oceanus Procellarum)

**Estado:** posado desde el 20 de abril de 1967; ultimo contacto el 4 de mayo de 1967
(la noche lunar lo apago). Sigue alli.

| Persona | Papel real | Que puede contar el aparato |
|---|---|---|
| Charles "Pete" Conrad Jr. | Comandante del Apollo 12 | "Dos personas caminaron hasta mi en noviembre de 1969" |
| Alan L. Bean | Piloto del modulo lunar Apollo 12 | Se llevaron mi camara de TV y mi pala a la Tierra: las unicas piezas mias que volvieron |
| NASA / JPL (equipo Surveyor) | Diseno y gestion de la mision | Por que me enviaron: probar si el suelo aguantaba un modulo lunar |

**Datos duros para la ficha:** 6.326 imagenes de TV; 4 trincheras excavadas; el suelo
resulto como arena mojada, ~10 psi: solido para sostener el LM del Apollo. El Apollo 12
aterrizo a ~180 m de mi y, en su segunda salida (19 nov 1969), Conrad y Bean caminaron
hasta mi y se llevaron la pala de suelo y el sistema de camara para estudiar el efecto de
2,5 anos de exposicion.
**Fuentes:** https://science.nasa.gov/mission/surveyor-3 ·
https://www.nasa.gov/history/55-years-ago-apollo-12-makes-a-pinpoint-landing-on-the-moon/
**Gancho de rotacion:** "¿Sabes quien vino a visitarme? Fue el unico aparato que las
personas visitaron en otro mundo."

## Aparato 2 — LRV del Apollo 17 (Luna, Taurus-Littrow)

**Estado:** aparcado desde diciembre de 1972 en el valle Taurus-Littrow. Ultimo coche
conducido en la Luna.

| Persona | Papel real | Que puede contar el aparato |
|---|---|---|
| Eugene A. Cernan | Comandante del Apollo 17 | Fui su coche en sus tres paseos; el ultimo hombre en dejar la Luna |
| Harrison H. Schmitt | Piloto del LM, geologo | Me condujo para recoger muestras de roca: era el unico cientifico que fue a la Luna |
| Boeing + Delco (GM) | Contratistas que construyeron los 4 LRV | Cuatro coches construidos, ~38 M$ final; plegado en el modulo |

**Fuentes:** https://nssdc.gsfc.nasa.gov/planetary/lunar/apollo_lrv.html ·
https://www.nasa.gov/history/50-years-ago-apollo-17-lands-at-taurus-littrow
**Gancho de rotacion:** "¿Sabes quien me condujo el ultimo dia? Despues de mi, nadie ha
vuelto a conducir aqui arriba."

## Aparato 3 — InSight (Marte, Elysium Planitia)

**Estado:** aterrizo el 26 de noviembre de 2018; fin de mision el 15 de diciembre de 2022
(el polvo cubrio los paneles). Sigue en Elysium Planitia.

| Persona | Papel real | Que puede contar el aparato |
|---|---|---|
| Bruce Banerdt (JPL) | Investigador principal de la mision | "Escuchaba mis temblores": convirtio Marte en un planeta con sismologia |
| Philippe Lognonne (IPGP, Francia) | Investigador principal del sismometro SEIS | El instrumento que puso mi brazo de 1,8 m sobre el suelo |
| Equipo CNES / IPGP / Imperial College / Cornell | Socios que aportaron instrumentos | La mision no fue de una sola agencia: fue un equipo de varios paises |

**Datos duros para la ficha:** primer sismometro desplegado en otro planeta; primer sonido
del viento marciano captado (1 dic 2018); midio el interior de Marte.
**Fuentes:** https://science.nasa.gov/mission/insight/ ·
https://www.jpl.nasa.gov/news/nasas-insight-places-first-instrument-on-mars/ ·
https://science.nasa.gov/resource/inside-insight-french-scientist-aims-to-detect-quakes-on-mars/
**Gancho de rotacion:** "¿Sabes quien escuchaba mis temblores desde la Tierra?"

## Suplente — Sojourner / Mars Pathfinder (Marte, Ares Vallis)

**Estado:** aterrizo el 4 de julio de 1997; primer rover que rodo en otro planeta.
Se perdio el contacto en septiembre de 1997. Queda en Ares Vallis.

| Persona | Papel real |
|---|---|
| Donna Shirley | Dirigio el equipo del microrover Sojourner (JPL); primera mujer al frente de un programa de exploracion de Marte en el JPL |
| Tony Spear | Jefe de proyecto de Mars Pathfinder |
| Matthew Golombek | Cientifico del proyecto (seleccion del sitio de aterrizaje) |
| Brian Muirhead | Jefe de sistemas / ingenieria del proyecto |

**Fuente:** https://www.jpl.nasa.gov/news/pathfinder-leaders-take-their-place-among-the-stars/
(el JPL nombro cuatro asteroides con sus nombres: 5649 Shirley entre ellos)

## Como usar esto en la mecanica de rotacion

1. Cada aparato tiene **3 personas** y por tanto **3 conversaciones** distintas.
2. En la primera visita el aparato pregunta por una persona al azar; el navegador recuerda
   en `localStorage` que ya te la conto y en la siguiente visita pregunta por otra.
3. Estructura de cada conversacion (6-8 turnos):
   saludo → "¿de donde vienes?" → presentacion → **pregunta al visitante** → respuesta del
   aparato con la historia real → puente ingenieria-ciencia → ficha con fuente citada.
4. La pregunta al visitante es siempre **de opciones grandes y pulsables**, nunca texto
   libre: el publico escolar no escribe.

## Pendiente antes de publicar

- [x] Camara de TV del Surveyor 3 devuelta a la Tierra: confirmado en NASA Science
      ("recovered parts, including the soil scoop and camera system", EVA-2, 19 nov 1969).
- [ ] Confirmar cifras del LRV del Apollo 17 (km recorridos) en la ficha de NSSDC.
- [ ] Revisar que cada frase del guion tenga su fuente en la ficha del aparato.
