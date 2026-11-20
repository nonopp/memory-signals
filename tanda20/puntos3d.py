#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Puntos 3D (pines de componentes) de la tanda de 20, colocados con datos de la geometría.

Fuente de cada posición: el centro de la pieza en coordenadas de escena, sacado del propio GLB
(nodos con nombre o mallas con forma inequívoca: paneles planos, discos de antena, mástiles finos).
Los modelos que la NASA publica como una sola malla sin partes (Mir, WMAP, Geotail, Topex…) llevan
un único punto en el cuerpo, no tres inventados.

Uso:  python3 tanda20/puntos3d.py [--comprobar]
"""
import json
import os
import sys

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATOS = os.path.join(RAIZ, 'docs', 'datos')

# id -> lista de (pos, normal, título es/en/de, texto es/en/de)
PUNTOS = {
    'clementine': [
        ([-0.0, -0.62, -0.0], [0, -1, 0],
         'Antena', 'La antena de comunicaciones apunta hacia abajo en el modelo. Desde la órbita lunar enviaba a la Tierra las imágenes del primer mapa completo de la Luna.',
         'Antenna', 'The communications antenna points down in the model. From lunar orbit it sent Earth the images for the first complete map of the Moon.',
         'Antenne', 'Die Kommunikationsantenne zeigt im Modell nach unten. Aus dem Mondorbit schickte sie die Bilder der ersten vollständigen Mondkarte zur Erde.'),
        ([2.05, -0.04, 0.17], [1, 0, 0],
         'Paneles solares', 'Dos alas planas de 4,1 metros de punta a punta. Con ellas recorrió 71 días y 297 órbitas lunares.',
         'Solar panels', 'Two flat wings, 4.1 metres tip to tip. With them it flew for 71 days and 297 lunar orbits.',
         'Solarpaneele', 'Zwei flache Flügel, 4,1 Meter von Spitze zu Spitze. Damit flog sie 71 Tage und 297 Mondumläufe.'),
        ([0.0, -0.11, 0.17], [0, 0, 1],
         'Cuerpo y blindaje', 'El cuerpo octogonal va forrado de oro para reflejar el calor. Dentro cabía el paquete de sensores de 8 kilos.',
         'Body and shielding', 'The octagonal body is wrapped in gold to reflect heat. Inside sat the 8-kilogram sensor package.',
         'Körper und Abschirmung', 'Der achteckige Körper ist mit Goldfolie umhüllt, um Wärme zu reflektieren. Darin sass das acht Kilogramm schwere Sensorenpaket.'),
    ],
    'mars-global-surveyor': [
        ([0.0, 0.29, -4.6], [0, 0, -1],
         'Paneles solares', 'Las dos alas se desplegaron a medias: un panel quedó unos 20 grados fuera de sitio y el frenado en la atmósfera de Marte pasó de 130 días a 17 meses.',
         'Solar panels', 'The two wings opened only partly: one panel stayed about 20 degrees out of place, so braking in the Martian atmosphere took 17 months instead of 130 days.',
         'Solarpaneele', 'Die beiden Flügel öffneten sich nur teilweise: Ein Paneel blieb etwa 20 Grad daneben, und das Abbremsen in der Marsatmosphäre dauerte 17 Monate statt 130 Tage.'),
        ([0.79, -2.55, 0.01], [0, -1, 0],
         'Antena de alta ganancia', 'La antena que apuntaba a la Tierra. Por ella llegaron las 240.000 imágenes de Marte.',
         'High-gain antenna', 'The dish that pointed at Earth. Through it came the 240,000 images of Mars.',
         'Hochgewinnantenne', 'Die Antenne, die zur Erde zeigte. Über sie kamen die 240.000 Marsbilder.'),
        ([0.0, -0.34, 0.0], [0, 0, 1],
         'Cuerpo y altímetro', 'En el cuerpo va el altímetro láser MOLA, que midió el relieve de Marte con precisión de 30 centímetros.',
         'Body and altimeter', 'The body carries the MOLA laser altimeter, which measured the relief of Mars to within 30 centimetres.',
         'Körper und Altimeter', 'Im Körper sitzt der Laser-Höhenmesser MOLA, der das Relief des Mars auf 30 Zentimeter genau vermass.'),
    ],
    'pioneer11': [
        ([-0.0, 0.06, -0.37], [0, 0, -1],
         'Antena parabólica', 'La parabólica de 2,74 metros, la parte que más se ve de la nave. Con ella envió las 440 imágenes del sistema de Saturno.',
         'Parabolic dish', 'The 2.74-metre dish, the most visible part of the spacecraft. With it came the 440 images of the Saturn system.',
         'Parabolantenne', 'Die 2,74 Meter grosse Parabolantenne, der sichtbarste Teil der Sonde. Mit ihr kamen die 440 Bilder des Saturnsystems.'),
        ([-0.0, 1.23, 0.6], [0, 1, 0],
         'Generadores RTG', 'Los generadores termoeléctricos de radioisótopos, montados en un mástil. Funcionaron 22 años, frente a los 21 meses previstos.',
         'RTG generators', 'The radioisotope thermoelectric generators on a boom. They ran for 22 years against the 21 months planned.',
         'RTG-Generatoren', 'Die radioisotopischen Thermoelektrik-Generatoren an einem Ausleger. Sie liefen 22 Jahre statt der geplanten 21 Monate.'),
        ([-0.13, -0.09, -0.02], [0, 0, 1],
         'Instrumentos', 'El paquete de instrumentos, con los detectores de partículas y el magnetómetro que descubrió el campo magnético de Saturno.',
         'Instruments', 'The instrument package, with the particle detectors and the magnetometer that found Saturn\'s magnetic field.',
         'Instrumente', 'Das Instrumentenpaket mit den Teilchendetektoren und dem Magnetometer, das Saturns Magnetfeld entdeckte.'),
    ],
    'ulysses': [
        ([-0.0, 0.31, -0.0], [0, 1, 0],
         'Antena de alta ganancia', 'La antena que apuntaba siempre a la Tierra mientras la nave daba vueltas sobre los polos del Sol.',
         'High-gain antenna', 'The dish that always pointed at Earth while the spacecraft looped over the Sun\'s poles.',
         'Hochgewinnantenne', 'Die Antenne, die immer zur Erde zeigte, während die Sonde über die Sonnenpole kreiste.'),
        ([0.32, -0.0, -3.32], [0, 0, -1],
         'Generador RTG', 'El generador de radioisótopos, en un mástil aparte para no calentar los instrumentos. Alimentó 18 años y medio de misión.',
         'RTG generator', 'The radioisotope generator on a separate boom so it would not heat the instruments. It powered 18 and a half years of mission.',
         'RTG-Generator', 'Der Radioisotopengenerator an einem eigenen Ausleger, damit er die Instrumente nicht aufheizt. Er versorgte 18,5 Jahre Mission.'),
        ([0.01, -4.2, 0.46], [0, 0, 1],
         'Cuerpo y experimentos', 'El cuerpo alargado y giratorio, con los experimentos que midieron el viento solar y el polvo que llega de fuera del sistema solar.',
         'Body and experiments', 'The long spinning body, with the experiments that measured the solar wind and the dust arriving from outside the Solar System.',
         'Körper und Experimente', 'Der lange, rotierende Körper mit den Experimenten, die Sonnenwind und den Staub von ausserhalb des Sonnensystems massen.'),
    ],
    'rosetta': [
        ([-0.48, 0.46, -0.39], [0, 1, 0],
         'Antena principal', 'La parabólica orientable de 2,2 metros con la que envió 220 gigabytes de datos del cometa.',
         'Main dish', 'The steerable 2.2-metre dish that sent 220 gigabytes of comet data.',
         'Hauptantenne', 'Die schwenkbare 2,2-Meter-Antenne, mit der 220 Gigabyte Kometendaten zur Erde gingen.'),
        ([8.46, -0.12, 0.2], [1, 0, 0],
         'Paneles solares', 'Las dos alas de 14 metros. A 800 millones de kilómetros del Sol solo daban 395 vatios, así que la nave pasó dos años y medio en hibernación.',
         'Solar panels', 'The two 14-metre wings. Eight hundred million kilometres from the Sun they produced only 395 watts, so the spacecraft slept for two and a half years.',
         'Solarpaneele', 'Die beiden 14 Meter langen Flügel. In 800 Millionen Kilometern Sonnenentfernung lieferten sie nur 395 Watt, deshalb schlief die Sonde zweieinhalb Jahre.'),
        ([-0.02, -1.57, 0.15], [0, -1, 0],
         'Philae, el aterrizador', 'El robot que bajó al cometa el 12 de noviembre de 2014 y rebotó dos veces antes de quedarse en un sitio sin luz.',
         'Philae lander', 'The robot that dropped onto the comet on 12 November 2014 and bounced twice before settling in a spot with no sunlight.',
         'Lander Philae', 'Der Roboter, der am 12. November 2014 auf dem Kometen aufsetzte und zweimal abprallte, bevor er an einer schattigen Stelle liegen blieb.'),
    ],
    'cluster-ii': [
        ([0.0, 0.0, 0.0], [0, 1, 0],
         'Cuerpo', 'El cuerpo central de una de las cuatro naves idénticas que volaban en formación tetraédrica.',
         'Body', 'The central body of one of the four identical spacecraft flying in a tetrahedral formation.',
         'Körper', 'Der zentrale Körper einer der vier identischen Sonden im Tetraederflug.'),
        ([-0.11, 0.07, -0.44], [0, 0, -1],
         'Mástiles rígidos', 'Los mástiles del magnetómetro, que iban separados del cuerpo para que la propia nave no alterase la medida del campo magnético.',
         'Rigid booms', 'The magnetometer booms, held away from the body so the spacecraft itself would not disturb the magnetic field measurement.',
         'Starre Ausleger', 'Die Magnetometerausleger, fern vom Körper, damit die Sonde selbst die Feldmessung nicht störte.'),
        ([0.0, -0.06, 0.0], [0, -1, 0],
         'Antenas de hilo', 'Las antenas largas que medían el campo eléctrico. Con ellas cartografió la magnetosfera terrestre en tres dimensiones.',
         'Wire antennas', 'The long antennas that measured the electric field. With them it mapped Earth\'s magnetosphere in three dimensions.',
         'Drahtantennen', 'Die langen Antennen für das elektrische Feld. Mit ihnen wurde die irdische Magnetosphäre dreidimensional kartiert.'),
    ],
    'trmm': [
        ([-66.3, 2.1, 8.6], [-1, 0, 0],
         'Paneles solares', 'El ala que daba energía al satélite. Con ella funcionó 17 años, frente a los 3 de diseño.',
         'Solar panels', 'The wing that powered the satellite. With it, the mission ran 17 years against a design life of 3.',
         'Solarpaneele', 'Der Flügel, der den Satelliten versorgte. Damit lief die Mission 17 Jahre statt der geplanten 3.'),
        ([-27.3, 2.1, -84.3], [0, 0, -1],
         'Brazo del radar', 'El brazo que separaba el radar de los demás instrumentos para que sus emisiones no los interferasen.',
         'Radar arm', 'The arm that held the radar away from the other instruments so its pulses would not interfere with them.',
         'Radararm', 'Der Ausleger, der das Radar von den anderen Instrumenten fernhielt, damit seine Pulse sie nicht störten.'),
        ([37.7, 3.5, 1.7], [0, 0, 1],
         'Cuerpo y radar', 'El cuerpo modular, con el radar de precipitación de 13,8 GHz: la primera vez que se vio el interior de una tormenta en tres dimensiones.',
         'Body and radar', 'The modular body, with the 13.8 GHz precipitation radar: the first time the inside of a storm was seen in three dimensions.',
         'Körper und Radar', 'Der modulare Körper mit dem 13,8-GHz-Niederschlagsradar: das erste Mal, dass das Innere eines Sturms dreidimensional sichtbar wurde.'),
    ],
    'van-allen-probes': [
        ([0.0, 14.3, 0.0], [0, 1, 0],
         'Paneles solares', 'Los cuatro paneles desplegables, en forma de discos, que daban energía a cada nave.',
         'Solar panels', 'The four deployable disc-shaped panels that powered each spacecraft.',
         'Solarpaneele', 'Die vier ausklappbaren scheibenförmigen Paneele, die jede Sonde mit Energie versorgten.'),
        ([0.0, 0.0, 0.0], [1, 0, 0],
         'Antenas del campo eléctrico', 'El mástil largo que medía el campo eléctrico. Con él se descubrió un tercer cinturón de radiación alrededor de la Tierra.',
         'Electric field antennas', 'The long boom that measured the electric field. With it came the discovery of a third radiation belt around Earth.',
         'Elektrische Feldantennen', 'Der lange Ausleger für das elektrische Feld. Damit wurde ein dritter Strahlungsgürtel um die Erde entdeckt.'),
        ([0.0, -1.13, 0.0], [0, -1, 0],
         'Cuerpo e instrumentos', 'El cuerpo octogonal giratorio, con los instrumentos que midieron los electrones y los iones de los cinturones.',
         'Body and instruments', 'The spinning octagonal body, with the instruments that measured the electrons and ions of the belts.',
         'Körper und Instrumente', 'Der rotierende achteckige Körper mit den Instrumenten für Elektronen und Ionen der Gürtel.'),
    ],
    'stardust': [
        ([0.0, 0.13, 0.15], [0, 0, 1],
         'Cápsula de retorno', 'La cápsula de 45,7 kilos que volvió a la Tierra el 15 de enero de 2006 con polvo de cometa dentro.',
         'Return capsule', 'The 45.7-kilogram capsule that came back to Earth on 15 January 2006 with comet dust inside.',
         'Rückkehrkapsel', 'Die 45,7 Kilogramm schwere Kapsel, die am 15. Januar 2006 mit Kometenstaub zur Erde zurückkehrte.'),
        ([1.23, 0.13, 2.25], [1, 0, 0],
         'Colector de aerogel', 'La rejilla con aerogel, una espuma casi tan ligera como el aire, que atrapó más de 10.000 partículas del cometa Wild 2.',
         'Aerogel collector', 'The aerogel grid, a foam almost as light as air, that trapped more than 10,000 particles from comet Wild 2.',
         'Aerogel-Kollektor', 'Das Aerogelgitter, ein fast luftleichter Schaum, das über 10.000 Teilchen des Kometen Wild 2 einfing.'),
        ([0.0, 0.58, 0.15], [0, 1, 0],
         'Estructura y paneles', 'La estructura de la nave, con los paneles que la llevaron hasta el cometa y de vuelta.',
         'Structure and panels', 'The spacecraft structure, with the panels that carried it to the comet and back.',
         'Struktur und Paneele', 'Die Struktur der Sonde mit den Paneelen, die sie zum Kometen und zurück brachten.'),
    ],
    'polar': [
        ([0.0, 1.16, 0.1], [0, 1, 0],
         'Cámaras de la aurora', 'Las cámaras que fotografiaron la aurora en distintas longitudes de onda mientras los instrumentos la medían.',
         'Auroral cameras', 'The cameras that photographed the aurora at different wavelengths while the instruments measured it.',
         'Polarlichtkameras', 'Die Kameras, die das Polarlicht in verschiedenen Wellenlängen fotografierten, während die Instrumente es massen.'),
        ([-6.7, -0.28, -0.0], [-1, 0, 0],
         'Antenas de campo eléctrico', 'Los mástiles de 100 y 130 metros que medían el campo eléctrico en la magnetosfera exterior.',
         'Electric field antennas', 'The 100- and 130-metre booms that measured the electric field in the outer magnetosphere.',
         'Elektrische Feldantennen', 'Die 100 und 130 Meter langen Ausleger für das elektrische Feld in der äusseren Magnetosphäre.'),
        ([0.0, -0.28, -0.0], [0, 0, 1],
         'Cuerpo', 'El cuerpo giratorio con los doce instrumentos, tres de ellos de imagen.',
         'Body', 'The spinning body with its twelve instruments, three of them imagers.',
         'Körper', 'Der rotierende Körper mit zwölf Instrumenten, drei davon Bildsensoren.'),
    ],
    'ladee': [
        ([1.17, 18.0, -0.4], [0, 1, 0],
         'Cubierta de instrumentos', 'La plataforma de arriba, con el espectrómetro de masas y el detector de polvo que midieron el aire y el polvo de la Luna.',
         'Instrument deck', 'The top platform, with the mass spectrometer and the dust detector that measured the Moon\'s air and dust.',
         'Instrumentendeck', 'Die obere Plattform mit dem Massenspektrometer und dem Staubdetektor für Luft und Staub des Mondes.'),
        ([-12.5, 8.0, -0.4], [-1, 0, 0],
         'Terminal láser', 'El terminal de comunicación láser que transmitió a 622 megabits por segundo desde la órbita lunar.',
         'Laser terminal', 'The laser communication terminal that sent data at 622 megabits per second from lunar orbit.',
         'Laserterminal', 'Das Laser-Kommunikationsterminal, das aus dem Mondorbit mit 622 Megabit pro Sekunde sendete.'),
        ([1.17, -24.0, -0.4], [0, -1, 0],
         'Motor y cuerpo', 'El motor que la frenó hasta los 300 metros de altura en su penúltima vuelta, antes de estrellarla a propósito.',
         'Engine and body', 'The engine that brought it down to 300 metres on its next-to-last orbit, before the planned crash.',
         'Triebwerk und Körper', 'Das Triebwerk, das sie auf ihrer vorletzten Runde auf 300 Meter brachte, bevor sie gezielt zum Absturz gebracht wurde.'),
    ],
    'voyager2': [
        ([0.0, 0.13, 0.15], [0, 1, 0],
         'Antena de 3,66 metros', 'La parabólica que sigue apuntando a la Tierra desde el espacio interestelar, con una señal que tarda más de 16 horas en llegar.',
         '3.66-metre dish', 'The dish that still points at Earth from interstellar space, with a signal that takes more than 16 hours to arrive.',
         '3,66-Meter-Antenne', 'Die Antenne, die aus dem interstellaren Raum weiter zur Erde zeigt; ihr Signal braucht über 16 Stunden.'),
        ([-0.04, -0.02, -0.08], [-1, 0, 0],
         'Generadores RTG', 'Los tres generadores de radioisótopos del mástil. Cada año pierden unos 4 vatios, y por eso hay que ir apagando instrumentos.',
         'RTG generators', 'The three radioisotope generators on the boom. They lose about 4 watts a year, which is why instruments have to be switched off.',
         'RTG-Generatoren', 'Die drei Radioisotopengeneratoren am Ausleger. Sie verlieren jährlich rund 4 Watt, deshalb müssen Instrumente abgeschaltet werden.'),
        ([0.03, 0.05, 0.02], [0, 0, 1],
         'Plataforma científica', 'La plataforma con las cámaras y los sensores, y el disco de oro con los sonidos y saludos de la Tierra.',
         'Science platform', 'The platform with the cameras and sensors, and the Golden Record with Earth\'s sounds and greetings.',
         'Wissenschaftsplattform', 'Die Plattform mit Kameras und Sensoren sowie die goldene Schallplatte mit Klängen und Grüssen der Erde.'),
    ],
}

# modelos que la NASA publica como una sola malla: un punto honesto en el cuerpo
SOLO_CUERPO = {
    'mir': ('Estructura de la estación', 'Station structure', 'Stationsstruktur',
            'La estación entera: el bloque central con los módulos acoplados. Aquí no se puede separar pieza por pieza porque el modelo viene en una sola malla.',
            'The whole station: the core module with its docked modules. Parts cannot be separated here because the model is a single mesh.',
            'Die ganze Station: der Kernblock mit den angedockten Modulen. Eine Trennung nach Bauteilen ist nicht möglich, weil das Modell aus einem einzigen Netz besteht.', [0.0, 1.0, 0.0]),
    'wmap': ('Antenas gemelas', 'Twin dishes', 'Zwillingsantennen',
            'Las dos antenas espalda con espalda que miraban el fondo de microondas en cinco frecuencias. El modelo viene en una sola malla y no deja separar más piezas.',
            'The two back-to-back dishes that watched the microwave background at five frequencies. The model is a single mesh and does not allow separating more parts.',
            'Die beiden Rücken-an-Rücken-Antennen, die den Mikrowellenhintergrund in fünf Frequenzen beobachteten. Das Modell besteht aus einem einzigen Netz.', [0.0, 1.0, 0.0]),
    'geotail': ('Antenas de hilo', 'Wire booms', 'Drahtausleger',
            'Los dos brazos de 100 metros que medían el campo eléctrico en la cola magnética. El modelo es una sola malla.',
            'The two 100-metre booms that measured the electric field in the magnetic tail. The model is a single mesh.',
            'Die beiden 100-Meter-Ausleger für das elektrische Feld im Magnetschweif. Das Modell ist ein einziges Netz.', [0.0, 1.0, 0.0]),
    'topex-poseidon': ('Paneles solares', 'Solar panels', 'Solarpaneele',
            'Las dos alas que dan energía al satélite de altimetría. El modelo es una sola malla y no deja separar el resto de piezas.',
            'The two wings that power the altimetry satellite. The model is a single mesh and does not allow separating the rest.',
            'Die beiden Flügel, die den Altimetriesatelliten versorgen. Das Modell ist ein einziges Netz.', [0.0, 1.0, 0.0]),
    'deep-space-1': ('Paneles solares', 'Solar panels', 'Solarpaneele',
            'Las dos alas que alimentaban el motor iónico. El modelo es una sola malla.',
            'The two wings that fed the ion engine. The model is a single mesh.',
            'Die beiden Flügel, die das Ionentriebwerk speisten. Das Modell ist ein einziges Netz.', [0.0, 1.0, 0.0]),
    'spitzer': ('Telescopio y criostato', 'Telescope and cryostat', 'Teleskop und Kryostat',
            'El tubo del telescopio de 85 centímetros dentro del criostato de helio. El modelo es una sola malla.',
            'The 85-centimetre telescope tube inside the helium cryostat. The model is a single mesh.',
            'Das 85-Zentimeter-Teleskoprohr im Helium-Kryostaten. Das Modell ist ein einziges Netz.', [0.0, 1.0, 0.0]),
    'suzaku': ('Telescopios de rayos X', 'X-ray telescopes', 'Röntgenteleskope',
            'Los cuatro módulos de telescopios de rayos X, con láminas finas de aluminio. El modelo es una sola malla.',
            'The four X-ray telescope modules with thin aluminium foils. The model is a single mesh.',
            'Die vier Röntgenteleskopmodule mit dünnen Aluminiumfolien. Das Modell ist ein einziges Netz.', [0.0, 1.0, 0.0]),
    'compton-gro': ('Instrumentos', 'Instruments', 'Instrumente',
            'El bloque de los cuatro instrumentos que barrieron el cielo en rayos gamma. El modelo es una sola malla.',
            'The block of four instruments that swept the sky in gamma rays. The model is a single mesh.',
            'Der Block der vier Instrumente, die den Himmel in Gammastrahlen abtasteten. Das Modell ist ein einziges Netz.', [0.0, 1.0, 0.0]),
}


IDIOMAS = {'es': os.path.join(DATOS, 'contenido.json'),
           'en': os.path.join(DATOS, 'contenido.en.json'),
           'de': os.path.join(DATOS, 'contenido.de.json')}


def escribe(idioma, datos_por_id):
    """Vuelca los puntos en el catálogo del idioma, con titulo/texto en ese idioma."""
    ruta = IDIOMAS[idioma]
    d = json.load(open(ruta, encoding='utf-8'))
    n = 0
    for a in d['aparatos']:
        if a['id'] in datos_por_id:
            lista = []
            for p in datos_por_id[a['id']]:
                lista.append({'id': p['id'], 'pos': p['pos'], 'normal': p['normal'],
                              'titulo': p.get('titulo') if idioma == 'es' else p.get('titulo_' + idioma),
                              'texto': p.get('texto') if idioma == 'es' else p.get('texto_' + idioma)})
            a['puntos3d'] = lista
            n += len(lista)
    json.dump(d, open(ruta, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    return n


def construye():
    d = json.load(open(os.path.join(DATOS, 'contenido.json'), encoding='utf-8'))
    por_id = {a['id']: a for a in d['aparatos']}
    # posiciones para los de una sola malla: centro de la caja
    import sys as _s
    _s.path.insert(0, '/opt/data/cache/scratch')
    from caja_glb import caja
    puestos = 0
    for i, lista in PUNTOS.items():
        if i not in por_id:
            continue
        por_id[i]['puntos3d'] = [
            {'id': f'{i}-p{n+1}', 'pos': p[0], 'normal': p[1], 'titulo': p[2], 'texto': p[3],
             'titulo_en': p[4], 'texto_en': p[5], 'titulo_de': p[6], 'texto_de': p[7]}
            for n, p in enumerate(lista)]
        puestos += 1
    for i, (tes, ten, tde, xes, xen, xde, normal) in SOLO_CUERPO.items():
        if i not in por_id:
            continue
        mn, mx = caja(os.path.join(RAIZ, 'docs', 'modelos', f'{i}.glb'))
        centro = [round((mn[k] + mx[k]) / 2, 3) for k in range(3)]
        alto = [round(centro[0], 3), round(mx[1] - (mx[1] - mn[1]) * 0.15, 3), round(centro[2], 3)]
        por_id[i]['puntos3d'] = [
            {'id': f'{i}-p1', 'pos': alto, 'normal': normal, 'titulo': tes, 'texto': xes,
             'titulo_en': ten, 'texto_en': xen, 'titulo_de': tde, 'texto_de': xde}]
        puestos += 1
    # se escribe en los tres catálogos: el español con los textos base y en/de con su traducción
    total = 0
    for idioma in ('es', 'en', 'de'):
        total = escribe(idioma, {i: por_id[i]['puntos3d'] for i in por_id if por_id[i].get('puntos3d')})
    return puestos, total


if __name__ == '__main__':
    if '--comprobar' in sys.argv:
        print(f'listos: {len(PUNTOS)} con varias piezas + {len(SOLO_CUERPO)} con un punto')
        sys.exit(0)
    objetos, puntos = construye()
    print(f'objetos con pines: {objetos} | puntos totales: {puntos}')
