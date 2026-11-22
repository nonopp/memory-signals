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
    'EL OBJETIVO · qué querían averiguar',
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
    'plano documental abierto del motivo que se quería estudiar, cámara a su altura y '
    'sin ninguna figura humana en primer término: manda el fenómeno, no una persona',
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
    'NO SE VE, y no porque esté escondido: esta viñeta es del objetivo y no del aparato, '
    'que todavía no existía. Ningún boceto, ningún plano, ninguna maqueta y ninguna '
    'persona en el encuadre.',
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

EPOCA_OBJETIVO = """AMBIENTACIÓN (no improvisar): el objetivo, no una oficina. Nada de mobiliario, papel,
lápiz, regla de cálculo, pizarra ni fluorescente: el encuadre lo ocupa el fenómeno o el lugar que
se quería estudiar, con luz real y sin ninguna persona. Si es el Sol o un cuerpo celeste, luz dura
y fondo negro; si es un lugar de la Tierra, su cielo y su horizonte de verdad."""

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
    'grande. Si el aparato no se parece al de la referencia, la viñeta no vale.'
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
    # el hito que cuenta PARA QUÉ servía la misión vale más que el que cuenta una avería
    trabajo = ('experiment', 'estudi', 'observ', 'analiz', 'investig', 'medici', 'registr',
               'midier', 'enseñ', 'descubr')
    flojas = ('primera misión', 'primer', 'primera nave', 'mi encargo', 'fui la')
    mejor, puntos_mejor = None, -1
    for h in hitos[:4]:
        titulo = str(h.get('titulo', '')).lower()
        texto = str(h.get('texto', '')).lower()
        puntos = 3 * sum(1 for k in fisicas if k in texto)
        puntos += 3 * sum(1 for k in trabajo if k in texto)
        puntos -= 2 * sum(1 for k in flojas if k in titulo or k in texto[:60])
        puntos += 1 * sum(1 for k in ('orbit', 'primera', 'primer') if k in texto)
        if puntos > puntos_mejor:
            mejor, puntos_mejor = h, puntos
    return mejor


# El objetivo de cada misión, en una línea, y qué se dibuja para contarlo sin el aparato.
# La clave es el id del catálogo. Si un objeto no está aquí, se usa su resumen de ficha y el
# destino visto de cerca: lo que NO se hace nunca es volver al despacho con el mismo hombre.
OBJETIVO = {
    'skylab': {
        'texto': 'observar el Sol y la Tierra desde fuera de la atmósfera y medir cómo se '
                 'comporta el cuerpo humano cuando no pesa nada',
        'visual': 'el disco del Sol enorme y recortado contra el negro, con manchas y '
                  'fulguraciones bien dibujadas, y el limbo azul de la Tierra cruzando el '
                  'tercio inferior del encuadre con sus nubes y sus océanos',
    },
}


MUNDOS = ('luna', 'marte', 'eros', 'ceres', 'júpiter', 'jupiter', 'saturno', 'titán',
          'titan', 'mercurio', 'venus', 'cometa')


def clasifica_destino(a):
    """Devuelve (tipo, nombre del destino) para no hablar de «cráteres» en una estación en
    órbita terrestre ni de «suelo» en una sonda que va por el espacio interestelar.

    tipos: 'tierra_orbita' · 'mundo' · 'vacio'"""
    cuerpo = (a.get('cuerpo') or '').strip()
    lugar = (a.get('lugar') or '').strip()
    bajo = (cuerpo + ' ' + lugar).lower()
    if 'órbita de la tierra' in bajo or 'órbita terrestre' in bajo:
        return 'tierra_orbita', 'la Tierra'
    if any(m in bajo for m in MUNDOS):
        # el nombre del mundo, sin la frase entera del lugar
        for m in MUNDOS:
            if m in bajo:
                nombre = {'jupiter': 'Júpiter', 'titan': 'Titán'}.get(m, m)
                if 'cometa' in bajo and 'cometa' in m:
                    return 'mundo', 'el cometa'
                return 'mundo', nombre.capitalize()
    if cuerpo and cuerpo.lower() not in ('espacio', 'espacio interestelar', 'espacio profundo',
                                         'órbita solar'):
        return 'mundo', cuerpo
    return 'vacio', 'el vacío'


EDITORIALES = ('ojo al criterio', 'no consta', 'sin dato', 'aviso', 'nota:')


def objetivo_de_reserva(a):
    """Para qué se construyó, sacado de la ficha sin las notas editoriales.

    Algunos resúmenes empiezan con una advertencia del catálogo («Ojo al criterio: Voyager 1 no
    está abandonada»), que no sirve como objetivo. Se descartan esas frases y, si no queda
    ninguna, se usa el primer hito de la misión."""
    hitos = a.get('hitos') or []
    if hitos:
        # el primer hito casi siempre cuenta el encargo: es el mejor «para qué»
        texto_hito = ' '.join(str(hitos[0].get('texto') or '').split())
        primera = re.split(r'(?<=[.!?])\s+', texto_hito)
        if primera and len(primera[0]) > 25:
            frase = primera[0].rstrip('.!?…')
            return frase + '.'
    resumen = ' '.join((a.get('ficha_resumen') or '').split())
    frases_resumen = [f.strip().rstrip('.') + '.' for f in re.split(r'(?<=[.!?])\s+', resumen) if f.strip()]
    limpias = [f for f in frases_resumen
               if not any(m in f.lower() for m in EDITORIALES)
               and not any(v in f.lower() for v in ('sigue en contacto', 'puede dejar de responder'))
               and len(f) > 25]
    if limpias:
        return limpias[0]
    return ''


def escenas(a, d):
    cuerpo = a.get('cuerpo') or ''
    año = a.get('anio') or ''
    lugar = a.get('lugar') or ''
    e = []

    # 1 · EL OBJETIVO — para qué se construyó, sin aparato y sin gente genérica
    objetivo = OBJETIVO.get(a['id'], {})
    texto_obj = objetivo.get('texto') or objetivo_de_reserva(a) or '[SIN DATO EN LA FICHA]'
    texto_obj = texto_obj.rstrip('.!?…')          # el punto lo pone la frase que lo envuelve
    visual_obj = objetivo.get('visual') or (
        f'el destino ({cuerpo}) visto de cerca y sin el aparato: su superficie, su luz y su '
        'escala, para que se entienda qué se quería estudiar allí')
    e.append('el objetivo de la misión, es decir para qué se construyó: ' + texto_obj + '. '
             'En esta viñeta NO SE VE el aparato ni nada construido: todavía no existía, y lo '
             'que se cuenta es lo que se quería averiguar. Se dibuja ' + visual_obj + '. '
             'Sin personas: nada de despachos, escritorios, pizarras, planos, papeles ni nadie '
             'señalando dibujos.')

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

    # 5 y 6 · el destino no es el mismo para una estación en órbita terrestre, para una sonda
    # que llega a otro mundo y para una que se va al vacío: cada una se cuenta a su manera.
    tipo, destino_nombre = clasifica_destino(a)

    # 5 · EL CAMINO — travesía en vacío, sin nadie
    if tipo == 'tierra_orbita':
        e.append('la travesía hasta la órbita: el aparato SOLO en el vacío, con la Tierra '
                 'creciendo abajo, cada vez más grande y más azul, y ninguna otra nave. Nada de '
                 'personas ni de interiores de cabina.')
    elif tipo == 'mundo':
        e.append(f'la travesía hacia {destino_nombre}: el aparato SOLO en el vacío, sin tierra ni '
                 'naves, con el destino aún como una luz pequeña y lejana. Nada de personas ni de '
                 'interiores de cabina.')
    else:
        e.append('la travesía por el vacío: el aparato SOLO, con el Sol convertido en una luz '
                 'pequeña y dura a su espalda y ni una sola roca alrededor. Nada de personas ni de '
                 'interiores de cabina.')

    # 6 · LA LLEGADA — primer plano del destino, no del aparato entero
    if tipo == 'tierra_orbita':
        e.append('la llegada a la órbita: la Tierra vista muy de cerca, con sus océanos, sus '
                 'nubes y el limbo azul cruzando el encuadre, y del aparato solo una esquina o la '
                 'punta de un panel entrando por un borde. El aparato NO se ve entero: esta '
                 'viñeta es de la Tierra, no del aparato.')
    elif tipo == 'mundo':
        e.append(f'la llegada a {destino_nombre}: la superficie del destino vista muy de cerca, '
                 'con sus piedras, sus cráteres y su textura, y del aparato solo una esquina o la '
                 'punta de un panel entrando por el borde del encuadre, a punto de tocarla. El '
                 'aparato NO se ve entero: esta viñeta es del suelo, no del aparato.')
    else:
        e.append('la llegada al destino: el vacío visto muy de cerca, negro y con unas pocas '
                 'estrellas fijas, y del aparato solo una esquina o la punta de un panel entrando '
                 'por el borde del encuadre. El aparato NO se ve entero: esta viñeta es del vacío, '
                 'no del aparato.')

    # 7 · LO QUE HIZO — una escena cerrada
    textos_hitos = ' '.join(str(h.get('texto', '')) for h in (a.get('hitos') or [])).lower()
    se_poso = any(k in textos_hitos for k in ('posé', 'posó', 'posarse', 'aterriz', 'tocó el suelo'))
    # solo se apoya en el suelo el que de verdad se posó; los orbitadores y las sondas de paso
    # van suspendidos, sin inventar un aterrizaje que no ocurrió
    apoyo = ('Apoyado de verdad sobre el terreno: la base tocando el suelo, sin aire debajo, y la '
             'sombra naciendo de ese punto de contacto.' if se_poso else
             'Sin apoyarse en nada: el aparato suspendido sobre el paisaje del destino, que pasa '
             'justo debajo, y su sombra proyectada sobre el terreno o sobre las nubes.')
    h = elige_hito(d['hitos'])
    if h:
        e.append(f'UNA sola escena, sin alternativas: {h.get("titulo", "")} — '
                 f'{frases(h.get("texto"), 1, 200).rstrip(".")}. Se dibuja el APARATO EN EL DESTINO '
                 f'haciendo ese trabajo —que es justo para lo que se construyó: {texto_obj}—, '
                 'de cerca y sin nadie alrededor: nada de salas de '
                 'reuniones, conferencias, aulas ni gente sentada. ' + apoyo)
    else:
        e.append('[SIN DATOS EN LA FICHA]')

    # 8 · EL FINAL
    final_txt = (frases(d['estado_texto'], 1) or '[SIN DATO]').rstrip('.')
    e.append(f'el final: {final_txt}. El aparato solo, en el destino, sin nadie alrededor y sin '
             'señales de actividad.')

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
    lineas.append('  · En la viñeta 1 NO hay aparato, ni bocetos, ni planos, ni personas: se cuenta')
    lineas.append('    el OBJETIVO de la misión. El aparato aparece por primera vez dibujado en la 2')
    lineas.append('    y construido y real en la 3.')
    lineas.append('  · Los personajes no se nombran: se describen por su oficio y su ropa.')
    lineas.append('  · A partir de la viñeta 4 el aparato está FUERA de la Tierra: en vuelo, en')
    lineas.append('    órbita o en el destino. Nunca en interiores ni entre gente con bata.')
    lineas.append('    Los interiores solo existen en las viñetas 2 y 3 (mesa de dibujo y sala')
    lineas.append('    de montaje). La 1 no es un interior: es el objetivo, y va sin gente.')
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
            if num == 1:
                lineas.append('FIDELIDAD: no aplica. En esta viñeta no hay aparato, ni dibujo, ni '
                              'maqueta: solo lo que la misión quería estudiar.')
                lineas.append('')
            elif num == 4:
                lineas.append('FIDELIDAD: no aplica al aparato, que no se ve. Sí al cohete: un solo '
                              'cuerpo central cilíndrico, con los aceleradores laterales SOLO si el '
                              'cohete de la época y del país los llevaba; cofia en punta y cerrada. '
                              'Nada de satélites montados por fuera ni de piezas sueltas.')
            elif num == 2:
                lineas.append(f'FIDELIDAD (solo para los dibujos del papel): {fisico(a)}.')
            else:
                lineas.append(f'FIDELIDAD: {fisico(a)}')
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
            elif num == 1:
                lineas.append(EPOCA_OBJETIVO)
            else:
                lineas.append(EPOCA_INTERIOR.format(epoca=f'hacia {a.get("anio") or "la fecha del objeto"}'))
            lineas.append('')
            lineas.append(PROHIBIDO)
            if num == 1:
                lineas.append('')
                lineas.append('ADEMÁS, EN ESTA VIÑETA 1: prohibido el despacho, la mesa de trabajo, el '
                              'cuaderno de bocetos, la pizarra, la regla de cálculo y cualquier '
                              'persona. No es una escena de oficina: es el objetivo de la misión.')
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
