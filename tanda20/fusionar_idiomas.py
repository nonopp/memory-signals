#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fusiona las traducciones (en/de) de la tanda de 20 en los catálogos correspondientes.

Comprueba antes de escribir:
  - mismos ids que el español y en el mismo orden
  - ninguna cadena larga idéntica al español (señal de que el traductor no tradujo)
  - cifras y URLs intactas (mismo multiconjunto de números y de URLs que el español)
Uso: python3 tanda20/fusionar_idiomas.py [--comprobar]
"""
import json
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TANDA = os.path.join(RAIZ, 'tanda20')
DATOS = os.path.join(RAIZ, 'docs', 'datos')
IDIOMAS = {'en': 'contenido.en.json', 'de': 'contenido.de.json'}
ESTADOS = {'en': {'muerto': 'dead', 'abandonado': 'abandoned', 'funciona': 'works'},
           'de': {'muerto': 'tot', 'abandonado': 'verlassen', 'funciona': 'funktioniert'}}
NUM = re.compile(r'\d+')  # solo digitos: los separadores cambian con el idioma


def textos(a):
    """Todas las cadenas de prosa de una ficha, con su ruta."""
    salida = [('lugar', a.get('lugar', '')), ('ficha_resumen', a.get('ficha_resumen', ''))]
    for k, v in (a.get('estado_texto') or {}).items():
        salida.append(('estado_texto.' + k, v))
    for i, t in enumerate(a.get('turnos') or []):
        salida.append((f'turnos[{i}].pregunta', t.get('pregunta', '')))
        salida.append((f'turnos[{i}].texto_explorador', t.get('texto_explorador', '')))
        salida.append((f'turnos[{i}].texto_cientifico', t.get('texto_cientifico', '')))
        for j, o in enumerate(t.get('opciones') or []):
            salida.append((f'turnos[{i}].opciones[{j}]', o))
    for i, h in enumerate(a.get('hitos') or []):
        salida.append((f'hitos[{i}].titulo', h.get('titulo', '')))
        salida.append((f'hitos[{i}].texto', h.get('texto', '')))
    for i, p in enumerate(a.get('personas') or []):
        salida.append((f'personas[{i}].papel', p.get('papel', '')))
    for i, f in enumerate(a.get('fuentes') or []):
        salida.append((f'fuentes[{i}].texto', f.get('texto', '')))
    return salida


def urls(a):
    return sorted(f.get('url', '') for f in a.get('fuentes') or [])


def valida(idioma, es, tra):
    errores = []
    if len(es) != len(tra):
        errores.append(f'{idioma}: {len(es)} objetos en español y {len(tra)} traducidos')
    for a, b in zip(es, tra):
        if a['id'] != b['id']:
            errores.append(f'{idioma}: orden roto en {a["id"]} / {b["id"]}')
            continue
        i = a['id']
        # el estado debe estar traducido con el vocabulario de la web
        if b.get('estado') != ESTADOS[idioma][a['estado']]:
            errores.append(f'{idioma} {i}: estado {b.get("estado")!r} (se esperaba {ESTADOS[idioma][a["estado"]]!r})')
        if urls(a) != urls(b):
            errores.append(f'{idioma} {i}: URLs distintas de las del español')
        # cifras: mismo multiconjunto
        na = sorted(NUM.findall(json.dumps(a, ensure_ascii=False)))
        nb = sorted(NUM.findall(json.dumps(b, ensure_ascii=False)))
        if na != nb:
            faltan = [x for x in na if na.count(x) > nb.count(x)][:6]
            sobran = [x for x in nb if nb.count(x) > na.count(x)][:6]
            errores.append(f'{idioma} {i}: cifras distintas (faltan {faltan} / sobran {sobran})')
        # textos sin traducir
        for (ruta, original), (ruta2, copia) in zip(textos(a), textos(b)):
            # los titulos de cita (fuentes y nombre de la fuente del hito) son nombres propios:
            # se quedan igual en los tres idiomas y no son prosa sin traducir
            if ruta2.startswith(('fuentes[', 'hitos[')) and ruta2.endswith('texto'):
                continue
            if len(original) > 25 and original.strip() == copia.strip():
                errores.append(f'{idioma} {i}: {ruta2} sigue en español')
    return errores


def fusiona(idioma, traducidos):
    fichero = os.path.join(DATOS, IDIOMAS[idioma])
    d = json.load(open(fichero, encoding='utf-8'))
    ya = {a['id'] for a in d['aparatos']}
    nuevos = [a for a in traducidos if a['id'] not in ya]
    d['aparatos'].extend(nuevos)
    # el destino de cada objeto se toma del catálogo español ya fusionado
    es = json.load(open(os.path.join(DATOS, 'contenido.json'), encoding='utf-8'))
    pertenece = {}
    for dest in es['destinos']:
        for ap in dest['aparatos']:
            pertenece[ap] = dest['id']
    for dest in d['destinos']:
        for a in nuevos:
            if pertenece.get(a['id']) == dest['id'] and a['id'] not in dest['aparatos']:
                dest['aparatos'].append(a['id'])
    json.dump(d, open(fichero, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return len(nuevos), {x['id']: len(x['aparatos']) for x in d['destinos']}, len(d['aparatos'])


if __name__ == '__main__':
    es = []
    for b in ['es-bloque1.json', 'es-bloque2.json', 'es-bloque3.json', 'es-bloque4.json']:
        es.extend(json.load(open(os.path.join(TANDA, b), encoding='utf-8'))['aparatos'])
    total_errores = 0
    for idioma, fichero in (('en', 'en-bloque.json'), ('de', 'de-bloque.json')):
        ruta = os.path.join(TANDA, fichero)
        if not os.path.exists(ruta):
            print(f'{idioma}: falta {fichero}')
            total_errores += 1
            continue
        tra = json.load(open(ruta, encoding='utf-8')).get('aparatos', [])
        errores = valida(idioma, es, tra)
        print(f'{idioma}: {len(tra)} objetos, {len(errores)} problemas')
        for e in errores[:25]:
            print('   ·', e)
        total_errores += len(errores)
        if not errores and '--comprobar' not in sys.argv:
            n, destinos, total = fusiona(idioma, tra)
            print(f'   fusionados {n} → {destinos} | total {total}')
    if total_errores:
        print(f'\n{total_errores} problemas: no se da por buena la tanda hasta corregirlos.')
        sys.exit(1)
    print('\nTraducciones correctas.')
