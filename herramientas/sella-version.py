#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Sella la versión de docs/VERSION en las direcciones de los recursos.

Las páginas llevan ?v=<versión> en el CSS, los JS y las imágenes para que el navegador no
sirva una copia vieja. Este script pone en todas la versión que diga docs/VERSION, para no
tener que acordarse de cambiarla a mano en cada fichero.

Uso:  python3 herramientas/sella-version.py [--comprobar]
      --comprobar  solo dice si hay direcciones desfasadas, no escribe
"""
import os
import re
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(RAIZ, "docs")
PATRON = re.compile(r"(\?v=)([0-9][0-9A-Za-z.\-]*)")
RE_MSV = re.compile(r"(window\.__MSV\s*=\s*['\"])([0-9][0-9A-Za-z.\-]*)(['\"])")


def version():
    with open(os.path.join(DOCS, "VERSION"), encoding="utf-8") as fh:
        return fh.read().strip()


def main():
    v = version()
    comprobar = "--comprobar" in sys.argv
    tocados, desfase = 0, []
    for base, _, ficheros in os.walk(DOCS):
        for nombre in ficheros:
            if not nombre.endswith((".html", ".css", ".js")):
                continue
            ruta = os.path.join(base, nombre)
            with open(ruta, encoding="utf-8") as fh:
                texto = fh.read()
            viejo = texto
            texto = PATRON.sub(lambda m: m.group(1) + v, texto)
            # index.html lleva además la versión con la que se cachean los JSON (window.__MSV)
            texto = RE_MSV.sub(lambda m: m.group(1) + v + m.group(3), texto)
            usados = set(PATRON.findall(viejo))
            if any(u[1] != v for u in usados):
                desfase.append(os.path.relpath(ruta, RAIZ))
            if texto != viejo:
                if not comprobar:
                    with open(ruta, "w", encoding="utf-8") as fh:
                        fh.write(texto)
                tocados += 1
    if comprobar:
        print(f"versión {v} · ficheros desfasados: {len(desfase)}")
        for d in desfase:
            print("  ·", d)
        return 0 if not desfase else 1
    print(f"versión {v} · ficheros sellados: {tocados}")
    for d in desfase:
        print("  ·", d)
    return 0


if __name__ == "__main__":
    sys.exit(main())
