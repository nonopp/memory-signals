#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Escribe UN FICHERO POR OBJETO con los encargos de imagen de sus 10 viñetas.

Cada viñeta es un bloque autocontenido (estilo + encuadre + estado del aparato + escena +
época + prohibiciones) listo para pegar en el generador de imágenes.

Tres reglas que evitan los dos fallos detectados en la primera tanda:
  1. El APARATO no está construido hasta la viñeta de las manos: en la 1 solo hay bocetos a
     lápiz y en la 2 dibujos técnicos y una maqueta de madera. Si aparece terminado antes,
     las viñetas se repiten y la historia se cuenta al revés.
  2. Cada viñeta lleva un ENCUADRE distinto (general, cenital, detalle, contrapicado,
     silueta...). Dos viñetas con el mismo encuadre salen gemelas aunque cambie la escena.
  3. Nada de nombres reales ni fechas de nacimiento o muerte en el prompt: los personajes se
     describen por lo que hacen y por la ropa de la época, nunca por su identidad.

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
agua."""

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

# Un encuadre por viñeta, distinto de todos los demás: es lo que impide que dos viñetas
# seguidas salgan gemelas aunque la escena cambie.
ENCUADRES = [
    'plano medio de un despacho de los años 90, cámara a la altura de la mesa, la figura '
    'sentada de tres cuartos y el papel en primer término',
    'plano cenital (vista de pájaro) de la mesa de dibujo, con las manos y los dibujos '
    'ocupando todo el encuadre y ninguna cara visible',
    'plano general a pie de suelo, en contrapicado suave, con el aparato entero y dos '
    'operarios trabajando en alturas distintas (uno en el suelo, otro subido a un escalón)',
    'plano lejano y contrapicado desde el suelo, el cohete ocupando el tercio superior y '
    'una multitud pequeña en la base',
    'primer plano: el aparato GRANDE, ocupando medio encuadre, y el destino reducido a un '
    'punto de luz lejano al fondo; el vacío por medio',
    'plano detalle a ras de suelo: la superficie del destino ocupa dos tercios del encuadre, '
    'en primer término piedras y cráteres, y del aparato SOLO entra una parte por un borde; '
    'no se ve entero ni centrado',
    'plano medio cercano al destino: si el aparato está posado o sobre una superficie, a ras '
    'del suelo con su sombra sobre el terreno y el horizonte al fondo; si orbita, en órbita '
    'baja con la superficie del destino pasando justo debajo. Interiores y salas, prohibidos',
    'plano general muy abierto, en el que el aparato es DIMINUTO y casi se pierde entre las '
    'estrellas o sobre el paisaje: el vacío manda en el encuadre y el aparato es una figura '
    'pequeña, sin nadie',
    'plano muy cerrado de una sola pieza del aparato, la luz ya apagada, con la superficie '
    'del destino fuera de foco al fondo',
    'franja 6:1 casi vacía: la silueta del aparato en línea fina a la izquierda y el resto '
    'libre para la frase de cierre',
]

# Qué se ve del aparato en cada viñeta. Antes de la 3 no está construido.
ESTADO_APARATO = [
    'NO APARECE construido. Solo se ven bocetos a lápiz sobre papel: una forma pequeña y '
    'angular junto a una roca de silueta irregular, con flechas y círculos. Nada de metal, '
    'nada de paneles reales.',
    'NO APARECE construido. Se ven dibujos técnicos: el aparato de perfil y en sección, a '
    'escala, con cotas y líneas de referencia; como mucho, una maqueta de madera y cartón '
    'sin paneles ni mantas.',
    'APARECE construido y real, por primera vez en la serie: montado y reconocible, con sus '
    'paneles, su antena y sus mantas térmicas.',
    'NO SE VE. El aparato va DENTRO de la cofia del cohete, plegado y cerrado: en el '
    'encuadre solo aparece el cohete completo con su punta, la torre, el humo y el público.',
    'APARECE entero, en silencio, iluminado por un solo lado.',
    'APARECE pequeño y completo, ya en el destino.',
    'APARECE según la escena elegida.',
    'APARECE entero y quieto, sin luz de instrumentos.',
    'APARECE muy recortado: solo una pieza o una esquina, para que se reconozca por el '
    'detalle y no por el conjunto.',
    'APARECE solo como silueta en línea fina, sin relleno.',
]

# Época cerrada por viñeta: la ropa, el mobiliario y la tecnología no se dejan al criterio
# del modelo, que es donde mete anacronismos.
EPOCA_INTERIOR = """AMBIENTACIÓN DE INTERIOR (no improvisar): {epoca}. Ropa de trabajo de la época, mobiliario
de oficina o taller de la época, papel, lápiz, regla de cálculo y pizarra. Luz de fluorescente
o de ventana, sin efectos modernos."""

EPOCA_FUERA = """AMBIENTACIÓN DE EXTERIOR (no improvisar): {epoca}, pero en el vacío o en el destino. Sin
atmósfera no hay cielo azul: el fondo es negro con estrellas o el terreno desnudo del destino.
Luz dura de una sola dirección, sombras muy marcadas y limpias. Sin polvo ambiental, sin niebla,
sin reflejos de ventana. Ninguna persona alrededor."""

# Objetos que volvieron a la Tierra y hoy están en un museo: en esos sí se admite interior
# museístico en las viñetas 8 y 9. Vacío = ninguno del catálogo (todos siguen fuera).
EN_TIERRA = set()

# Dónde puede estar el aparato. Es la regla que faltaba: sin ella el modelo mete el aparato
# en salas blancas y laboratorios en mitad de la misión, que es donde no está.
FUERA_SIEMPRE = """DÓNDE ESTÁ EL APARATO (regla de la serie): a partir de la viñeta 4 el aparato está SIEMPRE
fuera de la Tierra —en vuelo, en órbita o en el destino—. Nada de interiores: ni salas
blancas, ni laboratorios, ni talleres, ni salas de control, ni gente con bata alrededor."""

FUERA_TIERRA_OK = """DÓNDE ESTÁ EL APARATO (regla de la serie): este aparato volvió a la Tierra, así que puede
aparecer en interior de museo en las viñetas 8 y 9. En las viñetas 4 a 7, fuera o en vuelo."""

PROHIBIDO = """PROHIBIDO: pantallas planas, luces LED, portátiles actuales, tablets, móviles, cámaras
digitales modernas, proyectores de vídeo, relojes digitales, ropa deportiva actual,
auriculares inalámbricos, logotipos de marcas y cualquier texto. En el lanzamiento, tampoco:
el aparato montado por fuera del cohete, con paneles o antena desplegados. Desde la viñeta 4:
interiores de cualquier tipo, salas blancas, laboratorios, talleres, salas de control,
pantallas de control, pizarras y personas con bata alrededor del aparato."""

# Descripción física de los aparatos que ya tenemos documentados. Si un objeto no está aquí,
# el prompt remite a la lámina de referencia con una lista de lo que no puede cambiar.
FISICO = {
    'near-shoemaker': (
        'cuerpo central de caja octogonal forrada de mantas térmicas doradas y arrugadas, '
        'antena parabólica grande de alta ganancia sobre un mástil corto en la cara superior, '
        'CUATRO alas de paneles solares (dos a cada lado, en cruz) sujetas por brazos '
        'delgados, y un mástil largo y fino del magnetómetro que sale hacia un costado'
    ),
}

FISICO_GENERICO = (
    'el aparato de la lámina adjunta, con el MISMO número y la MISMA posición de paneles '
    'solares, antena y mantas térmicas: cuenta las alas y los mástiles del dibujo de referencia '
    'y repite esa cifra exacta, sin añadir ni quitar ninguna. La antena es la de la lámina y '
    'solo esa: si en la referencia no hay una parabólica grande, NO dibujes ninguna parabólica '
    'grande. Si el aparato no se parece al de la referencia, la viñeta no vale'
)


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


UNIDADES = (r'kilómetros por hora|km/h|kilómetros|kilómetro|km|metros|metro|centímetros|cm|'
            r'milímetros|mm|kilogramos|kilos|kg|toneladas|segundos|minutos|horas|h|días|meses|'
            r'años|año|millones|billones|billonésima|milésima|grados|°|por ciento|%|'
            r'unidades astronómicas|UA|vatios|W|Mbps|GB|MB|K|veces|personas|órbitas')


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


def roles(a):
    """Los personajes, por su oficio y su ropa, NUNCA por su nombre.

    Un nombre propio identificable (y más con fechas de nacimiento y muerte) es el motivo
    más frecuente de rechazo del generador de imágenes, y además la cara de una persona real
    cambia entre viñetas si el modelo la inventa."""
    personas = a.get('personas') or []
    oficios = []
    for p in personas[:3]:
        papel = frases(p.get('papel'), 1, 70).strip(' .;')
        if papel:
            oficios.append(papel.lower())
    if oficios:
        return ('tres personas del equipo, sin nombre y sin rasgos reconocibles, descritas por '
                'lo que hacen y por su ropa de trabajo (' + '; '.join(oficios) + ')')
    return ('tres técnicos anónimos de la época, sin rasgos reconocibles, descritos por lo que '
            'hacen y por su ropa de trabajo')


def datos_objeto(a):
    hitos = a.get('hitos') or []
    estado = a.get('estado') or ''
    estado_texto = a.get('estado_texto') or {}
    if isinstance(estado_texto, dict):
        estado_texto = estado_texto.get('texto_explorador') or estado_texto.get('texto_cientifico') or ''
    if estado == 'funciona':
        matiz = 'una luz de instrumento encendida, todavía en marcha'
    elif estado == 'abandonado':
        matiz = 'el aparato parado, apagado, sin ninguna luz de instrumento'
    else:
        matiz = 'el aparato apagado o destruido, sin ninguna luz'
    texto_cifras = ' '.join([a.get('ficha_resumen') or '', str(estado_texto)] +
                            [h.get('texto', '') for h in hitos])
    return {
        'hitos': hitos, 'matiz': matiz, 'estado_texto': estado_texto,
        'cifras': cifras(texto_cifras), 'roles': roles(a),
    }


def elige_hito(hitos):
    """Una sola escena para la viñeta 7: manda la ACCIÓN FÍSICA del aparato.

    Los hitos que solo resumen la misión («fui la primera misión…») se dibujan como una sala
    con gente hablando, que es el mismo motivo de las viñetas 1 y 2 y no cuenta lo que hizo.
    Puntúan alto posarse, aterrizar, tocar, desplegar, medir, inflar, fotografiar; puntúan
    bajo orbitar o ser el primero."""
    fisicas = ('posé', 'posarse', 'posó', 'aterriz', 'tocó', 'tocar', 'despleg', 'infl',
               'midi', 'medir', 'fotografi', 'dispar', 'instal', 'enterr', 'dejó', 'dejé',
               'recorri', 'perfor', 'clav')
    flojas = ('primera misión', 'primer', 'primera nave', 'mi encargo', 'fui la')
    mejor, puntos_mejor = None, -1
    for h in hitos[:4]:
        titulo = str(h.get('titulo', '')).lower()
        texto = str(h.get('texto', '')).lower()
        puntos = 3 * sum(1 for k in fisicas if k in texto)
        puntos -= 2 * sum(1 for k in flojas if k in titulo or k in texto[:60])
        puntos += 1 * sum(1 for k in ('orbit', 'primera', 'primer') if k in texto)
        if puntos > puntos_mejor:
            mejor, puntos_mejor = h, puntos
    return mejor


def escenas(a, d):
    cuerpo = a.get('cuerpo') or ''
    año = a.get('anio') or ''
    lugar = a.get('lugar') or ''
    e = []

    # 1 · ORIGEN — la idea, sin aparato construido
    e.append('la idea, todavía sin aparato: ' + (frases(a.get('ficha_resumen'), 1) or
              '[SIN DATO EN LA FICHA]') +
             ' Lo que se dibuja es el MOMENTO en que a alguien se le ocurre la misión: un '
             'despacho modesto con papeles, un cuaderno abierto con bocetos a lápiz y la '
             'ventana al fondo.')

    # 2 · LOS PLANOS — diseño, todavía sin aparato real
    e.append('la mesa de dibujo técnico: el aparato dibujado de perfil y en sección, con '
             'cotas, radios y líneas de referencia; al lado una maqueta de madera y cartón sin '
             'acabado. Manos con lápiz, regla de cálculo, goma y tazas de café. '
             '[SIN DATO EN LA FICHA: el problema de ingeniería concreto hay que sacarlo de las '
             'fuentes, no inventarlo]')

    # 3 · LAS MANOS — aquí sí está construido
    e.append('la sala blanca o el taller donde se montó, con el aparato YA construido y '
             'personas trabajando en él a distintas alturas: ' + d['roles'] +
             '. Nadie mira a cámara. Herramientas de mano, escalón, guantes y fundas de '
             'plástico, cajas de piezas al fondo.')

    # 4 · EL DÍA
    e.append(f'el día del {a.get("anio_tipo") or "lanzamiento"} ({año}): el cohete elevándose '
             'con la cofia cerrada y la llamarada debajo, la torre de servicio a la izquierda, '
             'el humo cubriendo la plataforma y una fila de público de espaldas tras la valla. '
             'El aparato no se ve: va dentro. [El sitio exacto de lanzamiento no está en la '
             'ficha]')

    # 5 · EL CAMINO — travesía en vacío, sin nadie
    e.append(f'la travesía hacia {cuerpo}: el aparato SOLO en el vacío, sin tierra ni naves, '
             'con el destino aún como una luz pequeña y lejana. Nada de personas ni de '
             'interiores de cabina.')

    # 6 · LA LLEGADA — primer plano del destino, no del aparato entero
    e.append(f'la llegada a {cuerpo}: la superficie del destino vista muy de cerca, con sus '
             'piedras, sus cráteres y su textura, y del aparato solo una esquina o la punta de '
             'un panel entrando por el borde del encuadre, a punto de tocarla. El aparato NO se '
             've entero: esta viñeta es del suelo, no del aparato.')

    # 7 · LO QUE HIZO — una escena cerrada
    h = elige_hito(d['hitos'])
    if h:
        e.append(f'UNA sola escena, sin alternativas: {h.get("titulo", "")} — '
                 f'{frases(h.get("texto"), 1, 200).rstrip(".")}. Se dibuja el APARATO EN EL DESTINO '
                 'haciendo ese trabajo, de cerca y sin nadie alrededor: nada de salas de '
                 'reuniones, conferencias, aulas ni gente sentada. Apoyado de verdad sobre el '
                 'terreno: la base tocando el suelo, sin aire debajo, y la sombra naciendo de '
                 'ese punto de contacto.')
    else:
        e.append('[SIN DATOS EN LA FICHA]')

    # 8 · EL FINAL
    e.append(f'el final: {frases(d["estado_texto"], 1) or "[SIN DATO]"}. El aparato solo, en '
             'el destino, sin nadie alrededor y sin señales de actividad.')

    # 9 · LO QUE QUEDA — detalle, no el conjunto
    e.append(f'{lugar} · {d["matiz"]}. Se cuenta con un detalle muy cerrado del aparato, no '
             'con el conjunto: así se reconoce sin repetir las viñetas anteriores.')

    # 10 · FRANJA
    e.append('franja 6:1 casi vacía: la silueta del aparato en línea fina a la izquierda y el '
             'resto libre para la frase de cierre')
    return e


def fisico(a):
    return FISICO.get(a['id'], FISICO_GENERICO)


def escribe_objeto(a, ruta):
    d = datos_objeto(a)
    esc = escenas(a, d)
    lineas = []
    lineas.append('=' * 78)
    lineas.append(f'{a["nombre"].upper()} · {a.get("anio")} · {a.get("cuerpo")}')
    lineas.append('=' * 78)
    lineas.append('')
    lineas.append('ANTES DE EMPEZAR')
    lineas.append('  · Lámina de referencia (adjúntala en las diez viñetas):')
    lineas.append(f'      {BASE}fondo-{a["id"]}.jpg')
    lineas.append('  · Formato vertical 3:4. La viñeta 10 es una franja apaisada 6:1.')
    lineas.append(f'  · Guarda cada imagen como {a["id"]}-v01.jpg … {a["id"]}-v10.jpg')
    lineas.append('  · Si sale texto, letras o números dentro del dibujo, no vale: se regenera')
    lineas.append('    añadiendo "sin texto, sin letras, sin números".')
    lineas.append('')
    lineas.append('DOS REGLAS DE LA SERIE (valen para las diez viñetas)')
    lineas.append('  · El aparato NO está construido en las viñetas 1 y 2: allí solo hay bocetos')
    lineas.append('    a lápiz y dibujos técnicos. Aparece construido por primera vez en la 3.')
    lineas.append('  · Los personajes no se nombran: se describen por su oficio y su ropa.')
    lineas.append('  · A partir de la viñeta 4 el aparato está FUERA de la Tierra: en vuelo, en')
    lineas.append('    órbita o en el destino. Nunca en interiores ni entre gente con bata.')
    lineas.append('    Los interiores solo existen en las viñetas 1, 2 y 3 (despacho, mesa de')
    lineas.append('    dibujo y sala de montaje).')
    lineas.append('')
    lineas.append('DÓNDE ESTÁ / CÓMO ACABÓ')
    lineas.append(f'  {a.get("lugar")} · estado: {a.get("estado")}')
    if d['cifras']:
        lineas.append(f'  Cifras disponibles (una por viñeta como máximo): '
                      f'{", ".join(d["cifras"][:10])}')
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
        if num == 10:
            lineas.append(f'APARATO: {ESTADO_APARATO[i]}')
            lineas.append('')
            lineas.append(f'ESCENA: {escena}')
        else:
            lineas.append(f'APARATO EN ESTA VIÑETA: {ESTADO_APARATO[i]}')
            lineas.append('')
            if num == 4:
                lineas.append('FIDELIDAD: no aplica al aparato, que no se ve. Sí al cohete: un '
                              'cuerpo central cilíndrico, dos aceleradores laterales adosados al '
                              'cuerpo y una cofia en punta, cerrada. Nada de satélites montados '
                              'por fuera ni de piezas sueltas.')
            elif num <= 2:
                lineas.append(f'FIDELIDAD (solo para los dibujos del papel): {fisico(a)}.')
            else:
                lineas.append(f'FIDELIDAD: {fisico(a)}. Si el aparato no se parece al de la '
                              'referencia, la viñeta no vale.')
            lineas.append('')
            lineas.append(f'ENCUADRE: {ENCUADRES[i]}')
            lineas.append('')
            lineas.append(f'ESCENA: {escena}')
            lineas.append('')
            if 4 <= num <= 9:
                lineas.append(FUERA_TIERRA_OK if a['id'] in EN_TIERRA else FUERA_SIEMPRE)
                lineas.append('')
            if 4 <= num <= 9:
                lineas.append(EPOCA_FUERA.format(epoca=f'año {a.get("anio") or ""}'.strip()))
            else:
                lineas.append(EPOCA_INTERIOR.format(epoca=f'hacia {a.get("anio") or "la fecha del objeto"}'))
            lineas.append('')
            lineas.append(PROHIBIDO)
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
    salida = sys.argv[1] if len(sys.argv) > 1 else os.path.join(RAIZ, 'tanda-comics-v2')
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
        indice.append((nombre_fichero, a['nombre'], a.get('anio'), a.get('cuerpo')))
    with open(os.path.join(salida, '00-INDICE.txt'), 'w', encoding='utf-8') as f:
        f.write('MEMORY SIGNALS · ENCARGO DE VIÑETAS · ÍNDICE (v2)\n')
        f.write(f'{len(indice)} objetos · 10 viñetas cada uno = {len(indice)*10} imágenes\n\n')
        f.write('Un fichero por objeto. Dentro, cada viñeta es un bloque autocontenido: estilo,\n')
        f.write('estado del aparato, encuadre, escena, época y prohibiciones. Se copia y se pega\n')
        f.write('tal cual en el generador. El orden es por destino y año.\n\n')
        for nf, nombre, año, cuerpo in indice:
            f.write(f'  {nf:28} {nombre} · {año} · {cuerpo}\n')
    print(f'{len(indice)} ficheros escritos en {salida}')
    print(f'  10 viñetas por objeto = {len(indice)*10} encargos de imagen')


if __name__ == '__main__':
    main()
