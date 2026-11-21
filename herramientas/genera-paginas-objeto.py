#!/usr/bin/env python3
"""Memory Signals — una página por objeto, para buscadores y para compartir.

Genera, a partir de datos/contenido.json (+ .en, .de):

  docs/objeto/<id>/index.html   página estática con el texto del objeto, sus datos,
                                fuentes y un botón que abre la app en ese objeto
  docs/objetos/index.html       índice de los 42 objetos, enlazado desde todas
  docs/sitemap.xml              portada, participa, privacidad, índice y los 42 objetos
  docs/robots.txt               permiso de rastreo + referencia al sitemap

La app es una SPA: sin estas páginas, Google y las previsualizaciones de WhatsApp o Telegram
solo ven la portada. Cada página declara su canonical, sus metas sociales (og/twitter) y datos
estructurados JSON-LD; la imagen social es el sketch del objeto (img/fondo-<id>.jpg).

Uso:
    python3 herramientas/genera-paginas-objeto.py            # escribe las páginas
    python3 herramientas/genera-paginas-objeto.py --dominio https://otro.host/app/

Se lanza antes de sellar la versión; es idempotente y borra las carpetas de objetos que ya no
estén en el catálogo.
"""
import argparse
import html
import json
import os
import shutil
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCS = os.path.join(RAIZ, "docs")
SITIO_POR_DEFECTO = "https://nasa.gesemweb.es/app/"

IDIOMAS = ("es", "en", "de")
TEXTOS = {
    "es": {
        "lang": "es",
        "volver": "Volver a Memory Signals",
        "abrir": "Abrir en Memory Signals",
        "abrir_nota": "Modelo 3D, chat y cómic, en tres idiomas",
        "hitos": "Lo que hizo",
        "fuentes": "Fuentes",
        "indice_titulo": "Los 42 objetos abandonados de la NASA",
        "indice_intro": "Todos los aparatos del catálogo, con su año, su destino y su historia. "
                        "Cada uno abre su ficha con modelo 3D, chat y fuentes.",
        "indice_enlace": "Ver el índice completo",
        "pie": "Proyecto del NASA Space Apps Challenge 2026. Contenido con fuentes citadas.",
        "otros": "Otros objetos",
    },
    "en": {
        "lang": "en",
        "volver": "Back to Memory Signals",
        "abrir": "Open in Memory Signals",
        "abrir_nota": "3D model, chat and cartoon, in three languages",
        "hitos": "What it did",
        "fuentes": "Sources",
        "indice_titulo": "The 42 abandoned NASA objects",
        "indice_intro": "Every craft in the catalogue, with its year, its destination and its story. "
                        "Each one opens a page with a 3D model, chat and sources.",
        "indice_enlace": "See the full index",
        "pie": "A NASA Space Apps Challenge 2026 project. Content with cited sources.",
        "otros": "Other objects",
    },
    "de": {
        "lang": "de",
        "volver": "Zurück zu Memory Signals",
        "abrir": "In Memory Signals öffnen",
        "abrir_nota": "3D-Modell, Chat und Comic, in drei Sprachen",
        "hitos": "Was es getan hat",
        "fuentes": "Quellen",
        "indice_titulo": "Die 42 verlassenen NASA-Objekte",
        "indice_intro": "Alle Geräte des Katalogs, mit Jahr, Ziel und Geschichte. "
                        "Jedes öffnet eine Seite mit 3D-Modell, Chat und Quellen.",
        "indice_enlace": "Zum vollständigen Index",
        "pie": "Ein Projekt des NASA Space Apps Challenge 2026. Inhalte mit zitierten Quellen.",
        "otros": "Weitere Objekte",
    },
}

ESTILO = """
:root{--papel:#F2EBDC;--noche:#14213D;--cian:#63E0C8;--ocre:#C9A227;--rojo:#C1442E;--tinta:#1B1B1B}
*{box-sizing:border-box}
body{margin:0;background:var(--noche);color:#eaf3f8;font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
a{color:var(--cian)}
.cabecera{border-bottom:1px solid rgba(99,224,200,.25);padding:14px 20px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.cabecera a{color:#eaf3f8;text-decoration:none;font-weight:600;letter-spacing:.02em}
.miga{font-size:13px;color:#9fb6cc}
main{max-width:820px;margin:0 auto;padding:26px 20px 60px}
h1{font-size:clamp(26px,4vw,38px);line-height:1.15;margin:8px 0 6px}
.meta{color:var(--cian);font-size:14px;letter-spacing:.02em;margin:0 0 18px}
figure{margin:0 0 18px;border-radius:14px;overflow:hidden;border:1px solid rgba(99,224,200,.22);background:#0b1220}
figure img{display:block;width:100%;height:auto}
.resumen{font-size:18px;background:rgba(99,224,200,.07);border-left:3px solid var(--cian);padding:14px 16px;border-radius:0 12px 12px 0;margin:0 0 22px}
h2{font-size:17px;text-transform:uppercase;letter-spacing:.08em;color:var(--cian);margin:28px 0 8px}
ul.hitos{margin:0;padding-left:20px}
ul.hitos li{margin:0 0 10px}
ul.hitos strong{color:#fff}
.cta{display:inline-flex;align-items:center;gap:10px;background:var(--cian);color:#06222c;font-weight:700;
  text-decoration:none;padding:14px 22px;border-radius:999px;margin:26px 0 10px}
.cta:hover{background:#8af0dc}
.cta-nota{font-size:13px;color:#9fb6cc;margin:0 0 26px}
.fuentes li{margin:0 0 6px;font-size:14px;word-break:break-word}
.pie{border-top:1px solid rgba(99,224,200,.2);margin-top:34px;padding-top:16px;font-size:13px;color:#9fb6cc}
.rejilla{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;margin:22px 0 0;padding:0;list-style:none}
.rejilla a{display:block;text-decoration:none;color:#eaf3f8;border:1px solid rgba(99,224,200,.2);
  border-radius:12px;padding:12px 14px;background:rgba(255,255,255,.02)}
.rejilla a:hover{border-color:var(--cian)}
.rejilla b{display:block;font-size:15px}
.rejilla span{font-size:13px;color:#9fb6cc}
"""


def carga_json(nombre):
    ruta = os.path.join(DOCS, "datos", nombre)
    if not os.path.exists(ruta):
        return None
    with open(ruta, encoding="utf-8") as f:
        return json.load(f)


def recorta(texto, limite=155):
    texto = " ".join((texto or "").split())
    if len(texto) <= limite:
        return texto
    corte = texto[:limite]
    for marca in (". ", "; ", ", ", " "):
        if marca in corte:
            corte = corte[: corte.rfind(marca)]
            break
    return corte.rstrip(" ,;.") + "…"


def e(valor):
    return html.escape(str(valor if valor is not None else ""), quote=True)


def imagen_social(sitio, ident):
    return sitio + "img/fondo-" + ident + ".jpg"


def json_ld(a, sitio, ident, resumen):
    personas = [p.get("nombre") for p in (a.get("personas") or []) if p.get("nombre")]
    datos = {
        "@context": "https://schema.org",
        "@type": "CreativeWork",
        "name": a.get("nombre"),
        "alternateName": a.get("nombre_mapa") or a.get("nombre"),
        "description": resumen,
        "url": sitio + "objeto/" + ident + "/",
        "image": imagen_social(sitio, ident),
        "inLanguage": "es",
        "dateCreated": str(a.get("anio") or ""),
        "isPartOf": {"@type": "WebSite", "name": "Memory Signals", "url": sitio},
        "about": {"@type": "Place", "name": a.get("cuerpo") or ""},
        "contentLocation": a.get("lugar") or "",
        "creator": {"@type": "Organization", "name": "NASA"},
    }
    if personas:
        datos["contributor"] = [{"@type": "Person", "name": n} for n in personas]
    fuentes = [f.get("url") if isinstance(f, dict) else f for f in (a.get("fuentes") or [])]
    fuentes = [u for u in fuentes if u]
    if fuentes:
        datos["citation"] = fuentes
    return json.dumps(datos, ensure_ascii=False, indent=1)


def pagina_objeto(a, sitio, textos, idbase):
    ident = a["id"]
    nombre = a.get("nombre") or ident
    resumen_largo = " ".join((a.get("ficha_resumen") or "").split())
    resumen = recorta(resumen_largo)
    titulo = "%s · %s · Memory Signals" % (nombre, a.get("cuerpo") or "")
    url = sitio + "objeto/" + ident + "/"
    imagen = imagen_social(sitio, ident)
    alternos = "\n".join(
        '  <link rel="alternate" hreflang="%s" href="%s?lang=%s">' % (l, url, l) for l in IDIOMAS
    )
    hitos = "\n".join(
        "      <li><strong>%s</strong> — %s</li>" % (e(h.get("titulo")), e(h.get("texto")))
        for h in (a.get("hitos") or [])
    )
    fuentes = [f.get("url") if isinstance(f, dict) else f for f in (a.get("fuentes") or [])]
    fuentes_html = "\n".join(
        '      <li><a href="%s" rel="noopener">%s</a></li>' % (e(u), e(u.replace("https://", "")))
        for u in fuentes if u
    )
    personas = ", ".join(p.get("nombre") for p in (a.get("personas") or []) if p.get("nombre"))
    # estado_texto puede ser una cadena o un objeto con los dos niveles de lectura
    estado = a.get("estado_texto") or a.get("estado") or ""
    if isinstance(estado, dict):
        estado = (estado.get("texto_cientifico") or estado.get("texto_explorador") or "").strip()
    elif not isinstance(estado, str):
        estado = ""

    return """<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<meta name="description" content="{resumen}">
<link rel="canonical" href="{url}">
{alternos}
<meta property="og:site_name" content="Memory Signals">
<meta property="og:type" content="article">
<meta property="og:locale" content="es_ES">
<meta property="og:title" content="{titulo}">
<meta property="og:description" content="{resumen}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{imagen}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{titulo}">
<meta name="twitter:description" content="{resumen}">
<meta name="twitter:image" content="{imagen}">
<link rel="icon" type="image/png" sizes="64x64" href="../../img/favicon-64.png">
<style>{estilo}</style>
<script type="application/ld+json">
{jsonld}
</script>
</head>
<body>
<header class="cabecera">
  <a href="../../">{volver}</a>
  <span class="miga">{cuerpo} · {anio}</span>
</header>
<main>
  <h1>{nombre}</h1>
  <p class="meta">{cuerpo} · {anio} · {lugar}</p>
  <figure>
    <img src="../../img/fondo-{id}.jpg" alt="Lámina de {nombre}" width="1200" height="900">
  </figure>
  <p class="resumen">{resumen_largo}</p>
  <p>{estado}{personas_html}</p>
  <h2>{hitos_titulo}</h2>
  <ul class="hitos">
{hitos}
  </ul>
  <a class="cta" href="../../?objeto={id}">{abrir} →</a>
  <p class="cta-nota">{abrir_nota}</p>
  <h2>{fuentes_titulo}</h2>
  <ul class="fuentes">
{fuentes}
  </ul>
  <p class="pie"><a href="../../objetos/">{indice_enlace}</a> · {pie}</p>
</main>
</body>
</html>
""".format(
        lang=textos["lang"],
        titulo=e(titulo),
        resumen=e(resumen),
        url=e(url),
        alternos=alternos,
        imagen=e(imagen),
        estilo=ESTILO,
        jsonld=json_ld(a, sitio, ident, resumen),
        volver=e(textos["volver"]),
        abrir=e(textos["abrir"]),
        abrir_nota=e(textos["abrir_nota"]),
        indice_enlace=e(textos["indice_enlace"]),
        hitos_titulo=e(textos["hitos"]),
        fuentes_titulo=e(textos["fuentes"]),
        cuerpo=e(a.get("cuerpo") or ""),
        anio=e(a.get("anio") or ""),
        lugar=e(a.get("lugar") or ""),
        estado=e(estado + (". " if estado else "")),
        personas_html=e(("Personas: " + personas) if personas else ""),
        nombre=e(nombre),
        id=e(ident),
        resumen_largo=e(resumen_largo),
        hitos=hitos or "      <li>—</li>",
        fuentes=fuentes_html or "      <li>—</li>",
        pie=e(textos["pie"]),
        idbase=idbase,
    )


def pagina_indice(aparatos, sitio, textos):
    filas = "\n".join(
        '    <li><a href="../objeto/%s/"><b>%s</b><span>%s · %s</span></a></li>'
        % (e(a["id"]), e(a.get("nombre")), e(a.get("cuerpo") or ""), e(a.get("anio") or ""))
        for a in aparatos
    )
    titulo = "%s · Memory Signals" % textos["indice_titulo"]
    url = sitio + "objetos/"
    return """<!DOCTYPE html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{titulo}</title>
<meta name="description" content="{intro}">
<link rel="canonical" href="{url}">
<meta property="og:title" content="{titulo}">
<meta property="og:description" content="{intro}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{imagen}">
<style>{estilo}</style>
</head>
<body>
<header class="cabecera"><a href="../">{volver}</a><span class="miga">Memory Signals</span></header>
<main>
  <h1>{titulo}</h1>
  <p class="resumen">{intro}</p>
  <ul class="rejilla">
{filas}
  </ul>
  <p class="pie">{pie}</p>
</main>
</body>
</html>
""".format(
        lang=textos["lang"], titulo=e(titulo), intro=e(textos["indice_intro"]), url=e(url),
        imagen=e(sitio + "img/logo-memory-signals.png"), estilo=ESTILO,
        volver=e(textos["volver"]), filas=filas, pie=e(textos["pie"]),
    )


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dominio", default=SITIO_POR_DEFECTO)
    args = ap.parse_args()
    sitio = args.dominio if args.dominio.endswith("/") else args.dominio + "/"

    base = carga_json("contenido.json")
    if not base:
        sys.exit("falta docs/datos/contenido.json")
    aparatos = base.get("aparatos") or []
    if not aparatos:
        sys.exit("el catálogo está vacío")

    textos = TEXTOS["es"]

    # páginas de objeto
    carpeta = os.path.join(DOCS, "objeto")
    os.makedirs(carpeta, exist_ok=True)
    vigentes = set()
    for a in aparatos:
        ident = a["id"]
        vigentes.add(ident)
        destino = os.path.join(carpeta, ident)
        os.makedirs(destino, exist_ok=True)
        with open(os.path.join(destino, "index.html"), "w", encoding="utf-8") as f:
            f.write(pagina_objeto(a, sitio, textos, ident))

    # limpiar objetos que ya no están en el catálogo
    borrados = 0
    for nombre in sorted(os.listdir(carpeta)):
        ruta = os.path.join(carpeta, nombre)
        if os.path.isdir(ruta) and nombre not in vigentes:
            shutil.rmtree(ruta)
            borrados += 1

    # índice
    indice = os.path.join(DOCS, "objetos")
    os.makedirs(indice, exist_ok=True)
    with open(os.path.join(indice, "index.html"), "w", encoding="utf-8") as f:
        f.write(pagina_indice(aparatos, sitio, textos))

    # sitemap
    hoy = __import__("datetime").date.today().isoformat()
    urls = [sitio, sitio + "participa.html", sitio + "privacidad.html", sitio + "objetos/"]
    urls += [sitio + "objeto/" + a["id"] + "/" for a in aparatos]
    prioridad = {sitio: "1.0", sitio + "objetos/": "0.9"}
    lineas = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for u in urls:
        lineas.append("  <url>")
        lineas.append("    <loc>%s</loc>" % u)
        lineas.append("    <lastmod>%s</lastmod>" % hoy)
        lineas.append("    <changefreq>monthly</changefreq>")
        lineas.append("    <priority>%s</priority>" % prioridad.get(u, "0.7"))
        lineas.append("  </url>")
    lineas.append("</urlset>")
    with open(os.path.join(DOCS, "sitemap.xml"), "w", encoding="utf-8") as f:
        f.write("\n".join(lineas) + "\n")

    # robots
    with open(os.path.join(DOCS, "robots.txt"), "w", encoding="utf-8") as f:
        f.write("User-agent: *\nAllow: /\n\nSitemap: %ssitemap.xml\n" % sitio)

    print("objetos: %d · páginas escritas: %d · limpiadas: %d" % (len(aparatos), len(vigentes), borrados))
    print("índice: docs/objetos/index.html")
    print("sitemap: %d direcciones · robots.txt apuntando a %ssitemap.xml" % (len(urls), sitio))


if __name__ == "__main__":
    main()
