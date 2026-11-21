#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Genera el encargo de imágenes (10 viñetas por objeto) para todos los objetos sin cómic.

Lee el catálogo y escribe un fichero de texto con:
  - el bloque de estilo fijo, que se pega delante de cada escena
  - por objeto, la referencia visual y las diez escenas con sus datos reales

Uso:  python3 herramientas/encargo_comics.py > /tmp/encargo.txt
"""
import json
import os
import re

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENIDO = os.path.join(RAIZ, 'docs', 'datos', 'contenido.json')
COMICS = os.path.join(RAIZ, 'docs', 'datos', 'comics.json')
BASE = 'https://nasa.gesemweb.es/app/img/'

MOMENTOS = [
    'ORIGEN · la idea y la intención',
    'LOS PLANOS · el proceso de diseño',
    'LAS MANOS · quiénes y dónde lo hicieron',
    'EL DÍA · el lanzamiento',
    'EL CAMINO · la travesía al destino',
    'LA LLEGADA · las primeras horas',
    'LO QUE HIZO · su trabajo',
    'EL FINAL · cómo acabó la misión',
    'LO QUE QUEDA · dónde está ahora',
    'CIERRE · franja apaisada con la frase final',
]


def numeros(texto):
    """Cifras con unidad, tal y como aparecen en la ficha, para elegir el dato de cada viñeta."""
    unidades = (r'kilómetros por hora|km/h|kilómetros|kilómetro|km|metros|metro|centímetros|cm|'
                r'milímetros|mm|kilogramos|kilos|kg|toneladas|segundos|minutos|horas|h|días|meses|'
                r'años|año|millones|billones|billonésima|milésima|grados|°|por ciento|%|'
                r'unidades astronómicas|UA|vatios|W|Mbps|GB|MB|K|veces|personas|órbitas')
    patron = r'\d[\d.,]*\s?(?:' + unidades + r')'
    return re.findall(patron, texto or '', flags=re.IGNORECASE)


def frases(texto, n=2, maximo=230):
    """Recorta un texto largo quedándose con las primeras frases completas."""
    if not texto:
        return ''
    partes = re.split(r'(?<=[.;])\s+', str(texto))
    salida = ''
    for p in partes:
        if len(salida) + len(p) > maximo and salida:
            break
        salida += (' ' if salida else '') + p
        if salida.count('.') + salida.count(';') >= n:
            break
    return salida.strip()


def bloque(a, indice):
    lineas = []
    personas = a.get('personas') or []
    hitos = a.get('hitos') or []
    cuerpo = a.get('cuerpo') or ''
    lugar = a.get('lugar') or ''
    estado = a.get('estado') or ''
    año = a.get('anio') or ''
    tipo_año = a.get('anio_tipo') or ''
    resumen = a.get('ficha_resumen') or ''
    estado_texto = a.get('estado_texto') or {}
    if isinstance(estado_texto, dict):
        estado_texto = estado_texto.get('texto_explorador') or estado_texto.get('texto_cientifico') or ''

    quiénes = '; '.join(f'{p.get("nombre")} ({frases(p.get("papel"), 1, 90)})' for p in personas[:3])
    datos = numeros(' '.join([resumen, estado_texto] + [h.get('texto', '') for h in hitos]))
    # quitar repetidos conservando el orden
    vistos, datos_lim = set(), []
    for d in datos:
        if d not in vistos:
            vistos.add(d)
            datos_lim.append(d)

    lineas.append('')
    lineas.append('=' * 78)
    lineas.append(f'{indice}. {a["nombre"].upper()} · {año} · {cuerpo}'.rstrip(' ·'))
    lineas.append(f'   id: {a["id"]}')
    lineas.append('=' * 78)
    lineas.append(f'REFERENCIA VISUAL (adjúntala en todas las viñetas de este objeto):')
    lineas.append(f'   {BASE}fondo-{a["id"]}.jpg')
    lineas.append(f'   (lámina técnica del aparato; el dibujo generado tiene que parecerse a esto)')
    lineas.append('')
    lineas.append(f'DÓNDE ESTÁ / CÓMO ACABÓ: {lugar} · estado: {estado}')
    if datos_lim:
        lineas.append(f'CIFRAS DISPONIBLES (una por viñeta, no más): {", ".join(datos_lim[:10])}')
    lineas.append('')

    # 1 · ORIGEN
    lineas.append(f'  1 · {MOMENTOS[0]}')
    lineas.append(f'      ESCENA: {frases(resumen, 1) or "[SIN DATO EN LA FICHA]"}')
    # 2 · DISEÑO
    lineas.append(f'  2 · {MOMENTOS[1]}')
    lineas.append('      ESCENA: mesa de planos con el perfil del aparato visto de lado y en sección,')
    lineas.append('              manos con regla de cálculo, tazas de café. [SIN DATO EN LA FICHA:')
    lineas.append('              el problema de ingeniería concreto hay que sacarlo de las fuentes]')
    # 3 · LAS MANOS
    lineas.append(f'  3 · {MOMENTOS[2]}')
    lineas.append(f'      ESCENA: taller o sala blanca donde se montó el aparato; en primer plano,'
                  f' los que lo hicieron: {quiénes or "[SIN NOMBRES EN LA FICHA]"}')
    # 4 · EL DÍA
    lineas.append(f'  4 · {MOMENTOS[3]}')
    lineas.append(f'      ESCENA: el día del {tipo_año or "lanzamiento"} ({año}): la rampa, el humo,'
                  f' la llamarada y el aparato yéndose. [El sitio exacto de lanzamiento no está en la')
    lineas.append('              ficha: si hace falta, se busca en la fuente]')
    # 5 · EL CAMINO
    lineas.append(f'  5 · {MOMENTOS[4]}')
    lineas.append(f'      ESCENA: el aparato solo en el trayecto hacia {cuerpo}; escala desmedida,'
                  f' el destino asomando al fondo')
    # 6 · LA LLEGADA
    lineas.append(f'  6 · {MOMENTOS[5]}')
    lineas.append(f'      ESCENA: la llegada a {cuerpo}; el aparato diminuto frente al destino'
                  f' o el momento de posarse/tocar')
    # 7 · LO QUE HIZO
    if hitos:
        lineas.append(f'  7 · {MOMENTOS[6]}  (una sola viñeta: elige la escena que mejor cuente el trabajo)')
        for h in hitos[:3]:
            lineas.append(f'      · {h.get("titulo","")} — {frases(h.get("texto"), 1, 190)}')
    else:
        lineas.append(f'  7 · {MOMENTOS[6]}')
        lineas.append('      ESCENA: [SIN DATOS EN LA FICHA]')
    # 8 · EL FINAL
    lineas.append(f'  8 · {MOMENTOS[7]}')
    lineas.append(f'      ESCENA: {frases(estado_texto, 2) or "[SIN DATO]"}')
    # 9 · LO QUE QUEDA
    lineas.append(f'  9 · {MOMENTOS[8]}')
    if estado == 'funciona':
        matiz = 'una luz de instrumento encendida, todavía en marcha'
    elif estado == 'abandonado':
        matiz = 'el aparato parado, en silencio, sin luz'
    else:
        matiz = 'el aparato apagado o destruido, sin luz'
    lineas.append(f'      ESCENA: {lugar} · {matiz}')
    # 10 · CIERRE
    lineas.append(f' 10 · {MOMENTOS[9]}')
    lineas.append('      ESCENA: franja 6:1, silueta del aparato en línea fina a la izquierda y el')
    lineas.append('              resto vacío para la frase de cierre.')
    lineas.append('')
    urls = []
    for f in (a.get('fuentes') or []):
        urls.append(f.get('url', '') if isinstance(f, dict) else str(f))
    lineas.append(f'  fuentes: {" · ".join(u for u in urls if u)}')
    return lineas


def main():
    contenido = json.load(open(CONTENIDO, encoding='utf-8'))
    try:
        comics = json.load(open(COMICS, encoding='utf-8'))
    except FileNotFoundError:
        comics = {}
    hechos = {k for k in comics if not k.startswith('_')}
    pendientes = [a for a in contenido['aparatos'] if a['id'] not in hechos]

    salida = []
    salida.append('MEMORY SIGNALS · ENCARGO DE VIÑETAS PARA LOS OBJETOS QUE FALTAN')
    salida.append(f'{len(pendientes)} objetos · 10 viñetas cada uno = {len(pendientes)*10} imágenes')
    salida.append('')
    salida.append('CÓMO SE USA')
    salida.append('  1. Copia el BLOQUE DE ESTILO de abajo (una vez).')
    salida.append('  2. Por cada viñeta: pega el bloque de estilo, debajo la línea ESCENA del')
    salida.append('     objeto, y adjunta la imagen de REFERENCIA VISUAL de ese objeto.')
    salida.append('  3. Formato vertical 3:4 (la franja de cierre, 6:1 apaisada).')
    salida.append('  4. Guarda como <id>-v01.jpg … <id>-v10.jpg')
    salida.append('  5. Si sale texto, letras o números dentro del dibujo: no vale, se regenera')
    salida.append('     añadiendo "sin texto, sin letras, sin números".')
    salida.append('  6. Cuando tengas las 10 de un objeto, mándalas: yo escribo los textos de')
    salida.append('     los bocadillos y las cartelas (tres idiomas) y monto la página A4.')
    salida.append('')
    salida.append('-' * 78)
    salida.append('BLOQUE DE ESTILO · pégalo delante de cada escena')
    salida.append('-' * 78)
    salida.append('Viñeta de cómic documental, color plano, formato vertical 3:4, sin texto.')
    salida.append('')
    salida.append('ESTILO: línea clara negra de grosor variable sobre papel hueso #F2EBDC, relleno')
    salida.append('plano sin degradados, sombras con trama de puntos del mismo tono. Paleta cerrada:')
    salida.append('papel hueso #F2EBDC, azul noche #14213D, cian #63E0C8, ocre dorado #C9A227, rojo')
    salida.append('#C1442E, negro tinta #1B1B1B solo en la línea. Cómic europeo claro, figuras')
    salida.append('humanas proporcionadas, sin caricatura, perspectiva correcta y escala real entre')
    salida.append('el aparato y las personas. Sin marcos, sin firmas, sin marcas de agua.')
    salida.append('')
    salida.append('FIDELIDAD: respeta la forma del aparato que aparece en la imagen de referencia')
    salida.append('(número y posición de paneles solares, antena, mantas térmicas). Si el aparato no')
    salida.append('se parece al de la referencia, la viñeta no vale.')
    salida.append('')
    salida.append('No incluyas texto, letras, números, logotipos ni firmas en la imagen.')

    for i, a in enumerate(sorted(pendientes, key=lambda x: (x.get('cuerpo') or '', x.get('anio') or 0)), 1):
        salida.extend(bloque(a, i))

    salida.append('')
    salida.append('-' * 78)
    salida.append('NOTA SOBRE LOS DATOS')
    salida.append('-' * 78)
    salida.append('Las escenas 1, 3, 4, 6, 7, 8 y 9 salen de la ficha: resumen, personas reales,')
    salida.append('año y lugar, hitos y estado final. Las escenas 2 (proceso de diseño) y parte de')
    salida.append('la 5 (travesía) NO están en las fichas: van marcadas [SIN DATO] y no se rellenan')
    salida.append('con lo que suene bien. Si hace falta, se investigan aparte objeto por objeto.')
    print('\n'.join(salida))


if __name__ == '__main__':
    main()
