#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Fusiona los bloques de fichas de la tanda de 20 en docs/datos/contenido.json.

Valida antes de tocar nada: ids esperados, campos obligatorios, valores de `estado`,
3 turnos, 3 hitos, sin puntos3d y fuentes con https. Si algo falla, no escribe.
Uso:  python3 tanda20/fusionar.py [--comprobar]
"""
import json
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TANDA = os.path.join(RAIZ, 'tanda20')
CONTENIDO = os.path.join(RAIZ, 'docs', 'datos', 'contenido.json')

BLOQUES = ['es-bloque1.json', 'es-bloque2.json', 'es-bloque3.json', 'es-bloque4.json']
ESPERADOS = [
    'ladee', 'clementine', 'mars-global-surveyor', 'voyager2', 'pioneer11',
    'ulysses', 'rosetta', 'stardust', 'deep-space-1', 'spitzer',
    'wmap', 'suzaku', 'compton-gro', 'mir', 'van-allen-probes',
    'geotail', 'cluster-ii', 'polar', 'trmm', 'topex-poseidon',
]
ESTADOS = {'muerto', 'abandonado', 'funciona'}
DESTINO = {  # id -> destino
    'ladee': 'luna',
}
OBLIGATORIOS = ['id', 'nombre', 'cuerpo', 'lugar', 'anio', 'estado', 'estado_texto',
                'ficha_resumen', 'color', 'personas', 'fuentes', 'turnos', 'mapa', 'hitos']


def cargar():
    aparatos = []
    for b in BLOQUES:
        ruta = os.path.join(TANDA, b)
        if not os.path.exists(ruta):
            print(f'  falta {b}')
            continue
        d = json.load(open(ruta, encoding='utf-8'))
        aparatos.extend(d.get('aparatos', []))
        print(f'  {b}: {len(d.get("aparatos", []))} objetos')
    return aparatos


def valida(aparatos):
    errores = []
    ids = [a.get('id') for a in aparatos]
    if len(ids) != len(set(ids)):
        errores.append(f'ids repetidos: {[i for i in ids if ids.count(i) > 1]}')
    faltan = [i for i in ESPERADOS if i not in ids]
    sobran = [i for i in ids if i not in ESPERADOS]
    if faltan:
        errores.append(f'faltan objetos: {faltan}')
    if sobran:
        errores.append(f'objetos no previstos: {sobran}')
    for a in aparatos:
        i = a.get('id', '?')
        for campo in OBLIGATORIOS:
            if campo not in a or a[campo] in (None, '', [], {}):
                errores.append(f'{i}: falta {campo}')
        if a.get('estado') not in ESTADOS:
            errores.append(f'{i}: estado inválido {a.get("estado")!r}')
        et = a.get('estado_texto') or {}
        for k in ('texto_explorador', 'texto_cientifico'):
            if not et.get(k):
                errores.append(f'{i}: estado_texto sin {k}')
        if len(a.get('turnos') or []) != 3:
            errores.append(f'{i}: {len(a.get("turnos") or [])} turnos (deben ser 3)')
        for t in a.get('turnos') or []:
            for k in ('id', 'pregunta', 'opciones', 'texto_explorador', 'texto_cientifico'):
                if not t.get(k):
                    errores.append(f'{i}: turno {t.get("id", "?")} sin {k}')
            if len(t.get('opciones') or []) != 2:
                errores.append(f'{i}: turno {t.get("id", "?")} con {len(t.get("opciones") or [])} opciones')
        if len(a.get('hitos') or []) != 3:
            errores.append(f'{i}: {len(a.get("hitos") or [])} hitos (deben ser 3)')
        for h in a.get('hitos') or []:
            for k in ('titulo', 'texto', 'fuente'):
                if not h.get(k):
                    errores.append(f'{i}: hito sin {k}')
        if a.get('puntos3d'):
            errores.append(f'{i}: no debe llevar puntos3d en esta tanda')
        for p in a.get('personas') or []:
            if not p.get('nombre') or not p.get('papel'):
                errores.append(f'{i}: persona sin nombre o papel')
        for f in a.get('fuentes') or []:
            if not str(f.get('url', '')).startswith('https://'):
                errores.append(f'{i}: fuente sin https ({f.get("url")})')
        m = a.get('mapa') or {}
        if m.get('tipo') not in ('luna', 'marte', 'espacio'):
            errores.append(f'{i}: mapa.tipo inválido {m.get("tipo")!r}')
        if m.get('tipo') in ('luna', 'marte') and ('lat' not in m or 'lon' not in m):
            errores.append(f'{i}: mapa {m.get("tipo")} sin coordenadas')
    return errores


def fusiona(aparatos):
    d = json.load(open(CONTENIDO, encoding='utf-8'))
    ya = {a['id'] for a in d['aparatos']}
    nuevos = [a for a in aparatos if a['id'] not in ya]
    d['aparatos'].extend(nuevos)
    for a in nuevos:
        destino = DESTINO.get(a['id'], 'espacio')
        for dest in d['destinos']:
            if dest['id'] == destino and a['id'] not in dest['aparatos']:
                dest['aparatos'].append(a['id'])
    json.dump(d, open(CONTENIDO, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return len(nuevos), {x['id']: len(x['aparatos']) for x in d['destinos']}, len(d['aparatos'])


if __name__ == '__main__':
    print('Bloques:')
    aparatos = cargar()
    print(f'\nTotal leído: {len(aparatos)}')
    errores = valida(aparatos)
    if errores:
        print(f'\n{len(errores)} ERRORES:')
        for e in errores:
            print('  ·', e)
        print('\nNo se escribe nada.')
        sys.exit(1)
    print('Validación: OK')
    if '--comprobar' in sys.argv:
        print('Modo comprobación: no se escribe.')
        sys.exit(0)
    n, destinos, total = fusiona(aparatos)
    print(f'\nFusionados {n} aparatos nuevos. Reparto por destino: {destinos}')
    print(f'Total de aparatos en el catálogo: {total}')
