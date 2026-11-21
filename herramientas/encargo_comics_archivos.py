#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Escribe UN FICHERO POR OBJETO con los encargos de imagen de sus 10 viñetas.

Cada viñeta es un bloque autocontenido (estilo + escena + reglas) listo para pegar en el
generador de imágenes. Se genera desde el catálogo: nada inventado, y lo que la ficha no
tiene va marcado como [SIN DATO].

Uso:  python3 herramientas/encargo_comics_archivos.py [carpeta_salida]
"""
import json
import os
import re
import sys
import unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENIDO = os.path.join(RAIZ, 'docs', 'datos', 'contenido.json')
COMICS = os.path.join(RAIZ, 'docs', 'datos', 'comics.json')
BASE = 'https://nasa.gesemweb.es/app/img/'

ESTILO = """Viñeta de cómic documental, color plano, formato vertical 3:4, sin texto.

ESTILO: línea clara negra de grosor variable sobre papel hueso #F2EBDC, relleno plano sin
degradados, sombras con trama de puntos del mismo tono. Paleta cerrada: papel hueso #F2EBDC,
azul noche #14213D, cian #63E0C8, ocre dorado #C9A227, rojo #C1442E, negro tinta #1B1B1B solo
en la línea. Cómic europeo claro, figuras humanas proporcionadas, sin caricatura, perspectiva
correcta y escala real entre el aparato y las personas. Sin marcos, sin firmas, sin marcas de
agua.

FIDELIDAD: respeta la forma del aparato de la imagen de referencia (número y posición de los
paneles solares, la antena, las mantas térmicas). Si el aparato no se parece al de la
referencia, la viñeta no vale."""

ESTILO_FRANJA = """Franja de cómic documental, color plano, formato horizontal apaisado 6:1, sin texto.

ESTILO: línea clara negra de grosor variable, relleno plano. Paleta cerrada: azul noche
#14213D de fondo, negro tinta #1B1B1B para la línea, cian #63E0C8 para un único punto de luz,
papel hueso #F2EBDC para las estrellas. Sin marcos, sin firmas."""

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

UNIDADES = (r'kilómetros por hora|km/h|kilómetros|kilómetro|km|metros|metro|centímetros|cm|'
            r'milímetros|mm|kilogramos|kilos|kg|toneladas|segundos|minutos|horas|h|días|meses|'
            r'años|año|millones|billones|billonésima|milésima|grados|°|por ciento|%|'
            r'unidades astronómicas|UA|vatios|W|Mbps|GB|MB|K|veces|personas|órbitas')


def frases(texto, n=1, maximo=230):
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


def cifras(texto):
    halladas = re.findall(r'\d[\d.,]*\s?(?:' + UNIDADES + r')', texto or '', flags=re.IGNORECASE)
    vistas, salida = set(), []
    for h in halladas:
        if h not in vistas:
            vistas.add(h)
            salida.append(h)
    return salida


def slug(nombre):
    s = unicodedata.normalize('NFD', nombre).encode('ascii', 'ignore').decode()
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')


def datos_objeto(a):
    personas = a.get('personas') or []
    hitos = a.get('hitos') or []
    estado = a.get('estado') or ''
    estado_texto = a.get('estado_texto') or {}
    if isinstance(estado_texto, dict):
        estado_texto = estado_texto.get('texto_explorador') or estado_texto.get('texto_cientifico') or ''
    quiénes = '; '.join(
        f'{p.get("nombre")} ({frases(p.get("papel"), 1, 90)})' for p in personas[:3]
    )
    if estado == 'funciona':
        matiz = 'una luz de instrumento encendida, todavía en marcha'
    elif estado == 'abandonado':
        matiz = 'el aparato parado, en silencio, sin luz'
    else:
        matiz = 'el aparato apagado o destruido, sin luz'
    return {
        'personas': personas, 'hitos': hitos, 'quiénes': quiénes, 'matiz': matiz,
        'estado_texto': estado_texto,
        'cifras': cifras(' '.join([a.get('ficha_resumen') or '', str(estado_texto)] +
                                 [h.get('texto', '') for h in hitos])),
    }


def escenas(a, d):
    """Las diez escenas, en texto, con los datos de la ficha donde los hay."""
    cuerpo = a.get('cuerpo') or ''
    año = a.get('anio') or ''
    lugar = a.get('lugar') or ''
    e = []
    e.append(frases(a.get('ficha_resumen'), 1) or '[SIN DATO EN LA FICHA]')
    e.append('mesa de planos con el perfil del aparato de lado y en sección, manos con regla de '
             'cálculo, tazas de café. [SIN DATO EN LA FICHA: el problema de ingeniería concreto '
             'hay que sacarlo de las fuentes, no inventarlo]')
    e.append('el taller o la sala blanca donde se montó; en primer plano, los que lo hicieron: '
             + (d['quiénes'] or '[SIN NOMBRES EN LA FICHA]'))
    e.append(f'el día del {a.get("anio_tipo") or "lanzamiento"} ({año}): la rampa, el humo, la '
             'llamarada y el aparato yéndose. [El sitio exacto de lanzamiento no está en la ficha]')
    e.append(f'el aparato solo en la travesía hacia {cuerpo}; escala desmedida, el destino '
             'asomando al fondo')
    e.append(f'la llegada a {cuerpo}: el aparato diminuto frente al destino, o el momento de '
             'posarse y tocar')
    # el trabajo: hasta tres escenas a elegir
    if d['hitos']:
        alternativas = [f'{h.get("titulo","")} — {frases(h.get("texto"), 1, 190)}'
                        for h in d['hitos'][:3]]
        e.append('UNA sola viñeta, elige la escena que mejor cuente su trabajo:\n' +
                 '\n'.join(f'        · {x}' for x in alternativas))
    else:
        e.append('[SIN DATOS EN LA FICHA]')
    e.append(frases(d['estado_texto'], 2) or '[SIN DATO]')
    e.append(f'{lugar} · {d["matiz"]}')
    e.append('franja 6:1 casi vacía: la silueta del aparato en línea fina a la izquierda y el '
             'resto libre para la frase de cierre')
    return e


def escribe_objeto(a, ruta):
    d = datos_objeto(a)
    esc = escenas(a, d)
    nombre = a['nombre']
    lineas = []
    lineas.append('=' * 78)
    lineas.append(f'{nombre.upper()} · {a.get("anio")} · {a.get("cuerpo")}')
    lineas.append('=' * 78)
    lineas.append('')
    lineas.append('ANTES DE EMPEZAR')
    lineas.append(f'  · Lámina de referencia (adjúntala en las diez viñetas):')
    lineas.append(f'      {BASE}fondo-{a["id"]}.jpg')
    lineas.append('  · Formato vertical 3:4. La viñeta 10 es una franja apaisada 6:1.')
    lineas.append(f'  · Guarda cada imagen como {a["id"]}-v01.jpg … {a["id"]}-v10.jpg')
    lineas.append('  · Si sale texto, letras o números dentro del dibujo, no vale: se regenera')
    lineas.append('    añadiendo "sin texto, sin letras, sin números".')
    lineas.append('')
    lineas.append('DÓNDE ESTÁ / CÓMO ACABÓ')
    lineas.append(f'  {a.get("lugar")} · estado: {a.get("estado")}')
    if d['cifras']:
        lineas.append(f'  Cifras disponibles (una por viñeta como máximo): {", ".join(d["cifras"][:10])}')
    lineas.append('')

    for i, escena in enumerate(esc):
        num = i + 1
        estilo = ESTILO_FRANJA if num == 10 else ESTILO
        lineas.append('')
        lineas.append('-' * 78)
        lineas.append(f'VIÑETA {num} de 10 · {MOMENTOS[i]}')
        lineas.append('-' * 78)
        lineas.append(estilo)
        lineas.append('')
        lineas.append(f'ESCENA: {escena}')
        if num == 1:
            lineas.append('')
            lineas.append('CÓMO LLEVARLO A IMAGEN: una sala de trabajo de la época (mesa grande, planos')
            lineas.append('encima, gente de pie alrededor). Lo que cuenta el dato se sugiere con lo que')
            lineas.append('hacen y con lo que hay sobre la mesa, nunca escribiéndolo.')
        elif num == 8:
            lineas.append('')
            lineas.append('CÓMO LLEVARLO A IMAGEN: si el final fue físico, el aparato solo y apagado;')
            lineas.append('si fue una decisión desde tierra, la sala de control con las pantallas de líneas.')
        lineas.append('')
        lineas.append('No incluyas texto, letras, números, logotipos ni firmas en la imagen.')

    urls = [f.get('url', '') if isinstance(f, dict) else str(f) for f in (a.get('fuentes') or [])]
    lineas.append('')
    lineas.append('FUENTES DE LOS DATOS DE ESTE OBJETO')
    for u in [x for x in urls if x][:4]:
        lineas.append(f'  · {u}')
    lineas.append('')
    lineas.append('CUANDO TENGAS LAS DIEZ: pásamelas y escribo los textos de los bocadillos y las')
    lineas.append('cartelas en español, inglés y alemán, y monto la página A4 y la versión web.')
    with open(ruta, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lineas) + '\n')


def main():
    salida = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'tanda-comics')
    os.makedirs(salida, exist_ok=True)
    contenido = json.load(open(CONTENIDO, encoding='utf-8'))
    try:
        comics = json.load(open(COMICS, encoding='utf-8'))
    except FileNotFoundError:
        comics = {}
    hechos = {k for k in comics if not k.startswith('_')}
    pendientes = sorted(
        [a for a in contenido['aparatos'] if a['id'] not in hechos],
        key=lambda x: (x.get('cuerpo') or '', x.get('anio') or 0)
    )
    indice = []
    for i, a in enumerate(pendientes, 1):
        nombre_fichero = f'{i:02d}-{a["id"]}.txt'
        escribe_objeto(a, os.path.join(salida, nombre_fichero))
        indice.append((nombre_fichero, a['nombre'], a.get('anio'), a.get('cuerpo'), a['id']))
    # índice
    with open(os.path.join(salida, '00-INDICE.txt'), 'w', encoding='utf-8') as f:
        f.write('MEMORY SIGNALS · ENCARGO DE VIÑETAS · ÍNDICE\n')
        f.write(f'{len(indice)} objetos · 10 viñetas cada uno = {len(indice)*10} imágenes\n\n')
        f.write('Un fichero por objeto. Dentro, cada viñeta es un bloque autocontenido: se copia\n')
        f.write('y se pega tal cual en el generador. El orden es por destino y año.\n\n')
        for nf, nombre, año, cuerpo, ident in indice:
            f.write(f'  {nf:28} {nombre} · {año} · {cuerpo}\n')
    print(f'{len(indice)} ficheros escritos en {salida}')
    print(f'  10 viñetas por objeto = {len(indice)*10} encargos de imagen')


if __name__ == '__main__':
    main()
