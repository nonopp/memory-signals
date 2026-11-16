#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Retrato del estado de la aplicación, para comparar antes y después de un cambio ajeno.

Saca una huella de lo que hay: versión, objetos publicados, paridad de los tres idiomas,
modelos y una lista de arreglos concretos que deben seguir en su sitio. Sirve para pasar
dos veces —antes y después de aplicar el trabajo de otro agente— y comparar los dos JSON.

Uso:
    python3 herramientas/verifica-estado.py                 # imprime el retrato
    python3 herramientas/verifica-estado.py --json salida.json
    python3 herramientas/verifica-estado.py --compara antes.json
"""
import hashlib
import json
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(RAIZ, "docs")

# Arreglos hechos en 3.4.x que no deben desaparecer. (nombre, fichero, texto que debe estar)
MARCAS = [
    ("título del crucero traducido", "js/motor.js", "crucero.hacia"),
    ("rótulo de aproximación traducido", "js/motor.js", "hud.acercandonos"),
    ("título de destellos traducido", "index.html", 'data-i18n="destellos.titulo"'),
    ("nombres del mapa sin pisarse", "js/mapa.js", "reparteEtiquetas"),
    ("clase que esconde el nombre que choca", "css/estilo.css", "etq-tapada"),
    ("nombre corto en el mapa", "js/mapa.js", "nombre_mapa"),
    ("nombre corto en los destellos", "js/motor.js", "a.nombre_mapa || a.nombre"),
    ("posiciones de destellos repartidas", "js/motor.js", "posicionesDestellos"),
    ("sellado de versión en los recursos", "index.html", "window.__MSV"),
    ("los planetas conservan la mayúscula", "js/motor.js", "La|El|Los|Las|The|Der|Die|Das"),
    ("nombres largos del campo de destellos", "css/estilo.css", "max-width:190px"),
]

# Claves de los diccionarios que traducen las pantallas del recorrido
CLAVES_UI = ["crucero.titulo", "crucero.hacia", "hud.acercandonos", "destellos.titulo",
             "destino.volver", "hud.toca", "mirar.ventana"]


def leer(ruta):
    with open(os.path.join(DOCS, ruta), encoding="utf-8") as fh:
        return fh.read()


def contenido(idioma):
    f = "datos/contenido.json" if idioma == "es" else f"datos/contenido.{idioma}.json"
    return json.loads(leer(f))


def texto_de(ap):
    """Todo el texto visible de un aparato, para comparar formas entre idiomas."""
    trozos = [ap["nombre"], ap["lugar"], ap["ficha_resumen"],
              ap["estado_texto"]["texto_explorador"], ap["estado_texto"]["texto_cientifico"]]
    trozos += [p["papel"] for p in ap.get("personas", [])]
    trozos += [h["titulo"] + " " + h["texto"] for h in ap.get("hitos", [])]
    trozos += [t["pregunta"] + " " + " ".join(t.get("opciones", [])) + " " +
               t["texto_explorador"] + " " + t["texto_cientifico"] for t in ap.get("turnos", [])]
    return "\n".join(trozos)


def retrato():
    r = {}
    r["version"] = leer("VERSION").strip()
    r["msv"] = (leer("index.html").split("window.__MSV")[1].split("'")[1]
                if "window.__MSV" in leer("index.html") else None)

    # objetos y destinos
    es = contenido("es")
    r["aparatos"] = [a["id"] for a in es["aparatos"]]
    r["destinos"] = {d["id"]: list(d["aparatos"]) for d in es["destinos"]}
    r["por_cuerpo"] = {}
    for a in es["aparatos"]:
        r["por_cuerpo"].setdefault(a["cuerpo"], []).append(a["id"])

    # paridad de los tres idiomas
    paridad = {}
    for idi in ("en", "de"):
        d = contenido(idi)
        ids = [a["id"] for a in d["aparatos"]]
        iguales = []
        for a_es, a_id in zip(es["aparatos"], d["aparatos"]):
            if a_es["id"] != a_id["id"]:
                iguales.append("orden distinto en " + a_id["id"])
            if len(a_es.get("hitos", [])) != len(a_id.get("hitos", [])):
                iguales.append("hitos de " + a_id["id"])
            if len(a_es.get("turnos", [])) != len(a_id.get("turnos", [])):
                iguales.append("turnos de " + a_id["id"])
        paridad[idi] = {"aparatos": len(ids), "mismos_ids": ids == r["aparatos"], "avisos": iguales[:10]}
    r["paridad"] = paridad

    # modelos
    modelos = {}
    carpeta = os.path.join(DOCS, "modelos")
    for nombre in sorted(os.listdir(carpeta)):
        if nombre.endswith(".glb"):
            modelos[nombre] = os.path.getsize(os.path.join(carpeta, nombre))
    r["modelos"] = modelos
    r["modelos_total_bytes"] = sum(modelos.values())
    try:
        reg = json.loads(leer("datos/modelos.json"))
        r["modelos_registrados"] = sorted(k for k in reg if not k.startswith("_"))
    except Exception as e:
        r["modelos_registrados"] = "ERROR " + str(e)

    # arreglos que deben seguir
    r["marcas"] = {}
    for nombre, fichero, texto in MARCAS:
        try:
            r["marcas"][nombre] = texto in leer(fichero)
        except Exception:
            r["marcas"][nombre] = False

    # claves de los diccionarios de interfaz
    idioma = leer("js/idioma.js")
    r["claves_ui"] = {c: idioma.count("'" + c + "'") for c in CLAVES_UI}

    # huellas
    for f in ("index.html", "js/motor.js", "js/mapa.js", "css/estilo.css", "js/idioma.js",
              "datos/contenido.json", "datos/contenido.en.json", "datos/contenido.de.json"):
        r.setdefault("sha", {})[f] = hashlib.sha256(leer(f).encode()).hexdigest()[:16]
    return r


def main():
    r = retrato()
    if "--json" in sys.argv:
        destino = sys.argv[sys.argv.index("--json") + 1]
        with open(destino, "w", encoding="utf-8") as fh:
            json.dump(r, fh, ensure_ascii=False, indent=1)
        print("retrato escrito en", destino)
        return 0
    if "--compara" in sys.argv:
        antes = json.load(open(sys.argv[sys.argv.index("--compara") + 1], encoding="utf-8"))
        fallos = 0
        if antes["version"] != r["version"]:
            print(f"· versión: {antes['version']} → {r['version']}")
        perdidos = [a for a in antes["aparatos"] if a not in r["aparatos"]]
        nuevos = [a for a in r["aparatos"] if a not in antes["aparatos"]]
        if perdidos:
            fallos += len(perdidos)
            print("✗ OBJETOS QUE HAN DESAPARECIDO:", perdidos)
        if nuevos:
            print("· objetos nuevos:", nuevos)
        for clave, valor in antes["marcas"].items():
            if valor and not r["marcas"].get(clave):
                fallos += 1
                print(f"✗ ARREGLO PERDIDO: {clave}")
        for idi, info in antes["paridad"].items():
            ahora = r["paridad"][idi]
            if info["aparatos"] != ahora["aparatos"]:
                print(f"· {idi}: {info['aparatos']} → {ahora['aparatos']} aparatos")
            if not ahora["mismos_ids"]:
                fallos += 1
                print(f"✗ {idi}: los ids ya no coinciden con el español")
        for clave, n in antes["claves_ui"].items():
            if n and r["claves_ui"].get(clave, 0) < n:
                fallos += 1
                print(f"✗ CLAVE DE IDIOMA PERDIDA: {clave} ({n} → {r['claves_ui'].get(clave, 0)})")
        antes_m = antes["modelos"]
        for nombre, tam in antes_m.items():
            if nombre not in r["modelos"]:
                fallos += 1
                print(f"✗ MODELO QUE FALTA: {nombre}")
        print(f"\nmodelos: {len(antes_m)} → {len(r['modelos'])} · "
              f"{antes['modelos_total_bytes']/1e6:.1f} → {r['modelos_total_bytes']/1e6:.1f} MB")
        print("RESULTADO:", "sin pérdidas" if fallos == 0 else f"{fallos} PROBLEMAS")
        return 0 if fallos == 0 else 1
    print(json.dumps(r, ensure_ascii=False, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
