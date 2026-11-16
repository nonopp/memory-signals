<?php
/**
 * Memory Signals · buscar fuera de la ficha
 *
 * El visitante pregunta algo que la ficha no tiene. Si él lo pide (botón «Buscar fuera de mi ficha»),
 * aquí se busca en internet con el buscador de Ollama Cloud y el modelo redacta una respuesta
 * SOLO con lo que traigan esas fuentes, citándolas con [1], [2]…
 *
 * Reglas que no se pueden romper:
 *  - Nunca se responde sin fuente: si el modelo no cita al menos una de las fuentes recibidas,
 *    se devuelve «sin respuesta» y el visitante ve el aviso de siempre.
 *  - Las direcciones que se muestran al visitante son las que devolvió el buscador, nunca las que
 *    escriba el modelo.
 *  - Se cachea la respuesta (7 días) para no repetir búsquedas iguales.
 *  - Tope diario de búsquedas, por si algún día se acaba la tarifa o alguien abusa.
 *
 * POST /app/api/buscar.php
 *   { "pregunta": "...", "ficha": "Opportunity", "idioma": "es", "nivel": "explorador" }
 * Respuesta: { "encontrado": true, "respuesta": "...", "fuentes": [{"titulo","url"}], "ms": 1234 }
 *         o { "encontrado": false }
 */

declare(strict_types=1);

const CLAVE     = '/home/gesemweb-nasa/.ms/ollama.key';
const API_CHAT  = 'https://ollama.com/api/chat';
const API_BUSCA = 'https://ollama.com/api/web_search';
const MODELO    = 'deepseek-v4.1-flash';
const MAX_PREGUNTA = 240;
const LIMITE_POR_IP = 8;          // búsquedas
const VENTANA_SEG   = 600;        // cada 10 minutos
const TOPE_DIARIO   = 400;        // búsquedas al día en total
const CACHE_DIR     = '/home/gesemweb-nasa/.ms/cache-buscar';
const CACHE_DIAS    = 7;
const REGISTRO      = '/home/gesemweb-nasa/ms-sin-respuesta/busquedas.jsonl';
const RESULTADOS    = 5;          // los que se le pasan al modelo como mucho

/* Dominios que se prefieren: instituciones y enciclopedias. No se descarta el resto,
   pero estas van primero, que es lo que hace que la respuesta suela salir de la NASA. */
const PREFERIDOS = [
    'nasa.gov', 'jpl.nasa.gov', 'science.nasa.gov', 'nssdc.gsfc.nasa.gov', 'nasa.gov',
    'esa.int', 'esawebb.org', 'lpi.usra.edu', 'usra.edu', 'planetary.org',
    'si.edu', 'britannica.com', 'wikipedia.org', 'nature.com', 'science.org',
    'universetoday.com', 'skyandtelescope.org', 'space.com',
];

function salir(int $codigo, array $datos): void {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ---------- CORS: solo nuestras dos casas ----------
$permitidos = [
    'https://nasa.gesemweb.es',
    'https://nonopp.github.io',
    'http://127.0.0.1:8124',
    'http://localhost:8124',
];
$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origen !== '' && in_array($origen, $permitidos, true)) {
    header('Access-Control-Allow-Origin: ' . $origen);
    header('Vary: Origin');
}
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') { http_response_code(204); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { salir(405, ['error' => 'Solo POST']); }

// ---------- entrada ----------
$crudo = file_get_contents('php://input') ?: '';
$datos = json_decode($crudo, true);
if (!is_array($datos)) { salir(400, ['error' => 'JSON no válido']); }

$pregunta = trim((string)($datos['pregunta'] ?? ''));
$ficha    = trim((string)($datos['ficha'] ?? 'el aparato'));
$nivel    = ((string)($datos['nivel'] ?? 'cientifico')) === 'explorador' ? 'explorador' : 'cientifico';
$idioma   = strtolower(trim((string)($datos['idioma'] ?? 'es')));
if (!in_array($idioma, ['es', 'en', 'de'], true)) { $idioma = 'es'; }
if ($pregunta === '') { salir(400, ['error' => 'Falta la pregunta']); }
if (mb_strlen($pregunta) > MAX_PREGUNTA) { $pregunta = mb_substr($pregunta, 0, MAX_PREGUNTA); }

// ---------- caché (primero: si ya se preguntó, no se busca ni se gasta) ----------
if (!is_dir(CACHE_DIR)) { @mkdir(CACHE_DIR, 0750, true); }
$claveCache = CACHE_DIR . '/' . sha1($idioma . '|' . mb_strtolower($ficha) . '|' . mb_strtolower($pregunta)) . '.json';
if (is_readable($claveCache) && (time() - (int)filemtime($claveCache)) < CACHE_DIAS * 86400) {
    $guardado = json_decode((string)file_get_contents($claveCache), true);
    if (is_array($guardado) && isset($guardado['respuesta'])) {
        $guardado['cache'] = true;
        $guardado['ms'] = 0;
        salir(200, $guardado);
    }
}

// ---------- límite por IP ----------
$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$dirMarcas = '/tmp/ms-buscar';
if (!is_dir($dirMarcas)) { @mkdir($dirMarcas, 0700, true); }
$marca = $dirMarcas . '/' . sha1($ip);
$ahora = time();
$historial = [];
if (is_readable($marca)) {
    $previo = @file_get_contents($marca);
    if ($previo !== false) { $historial = array_filter(array_map('intval', explode(',', $previo))); }
}
$historial = array_values(array_filter($historial, fn($t) => $t > $ahora - VENTANA_SEG));
if (count($historial) >= LIMITE_POR_IP) {
    salir(429, ['error' => 'Demasiadas búsquedas seguidas. Espera unos minutos.']);
}
$historial[] = $ahora;
@file_put_contents($marca, implode(',', $historial), LOCK_EX);

// ---------- tope diario total ----------
$marcaDia = $dirMarcas . '/total-' . gmdate('Ymd');
$hechas = is_readable($marcaDia) ? (int)@file_get_contents($marcaDia) : 0;
if ($hechas >= TOPE_DIARIO) { salir(429, ['error' => 'Hoy no se pueden hacer más búsquedas. Prueba mañana.']); }
@file_put_contents($marcaDia, (string)($hechas + 1), LOCK_EX);

$clave = is_readable(CLAVE) ? trim((string)file_get_contents(CLAVE)) : '';
if ($clave === '') { salir(503, ['error' => 'El servidor no tiene configurada la clave del modelo']); }

$inicio = microtime(true);

// ---------- 1) buscar en internet ----------
function buscar(string $consulta, string $clave): array {
    $ch = curl_init(API_BUSCA);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 25,
        CURLOPT_CONNECTTIMEOUT => 8,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Authorization: Bearer ' . $clave],
        CURLOPT_POSTFIELDS     => json_encode(['query' => $consulta, 'max_results' => 8], JSON_UNESCAPED_UNICODE),
    ]);
    $resp = curl_exec($ch);
    $codigo = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    if ($resp === false || $codigo !== 200) { return []; }
    $json = json_decode((string)$resp, true);
    return is_array($json['results'] ?? null) ? $json['results'] : [];
}

function preferido(string $url): bool {
    $host = strtolower((string)parse_url($url, PHP_URL_HOST));
    foreach (PREFERIDOS as $d) {
        if ($host === $d || str_ends_with($host, '.' . $d)) { return true; }
    }
    return false;
}

/* la consulta lleva el nombre del aparato: así el buscador no se va por las ramas */
$consulta = $ficha . ' ' . $pregunta;
$resultados = buscar($consulta, $clave);

/* los preferidos primero, y sin repetir dominio */
$preferidos = [];
$otros = [];
$dominiosVistos = [];
foreach ($resultados as $r) {
    $url = (string)($r['url'] ?? '');
    if ($url === '' || !preg_match('#^https?://#i', $url)) { continue; }
    $host = strtolower((string)parse_url($url, PHP_URL_HOST));
    if (isset($dominiosVistos[$host])) { continue; }
    $dominiosVistos[$host] = true;
    $item = ['titulo' => trim((string)($r['title'] ?? '')), 'url' => $url,
             'texto' => trim((string)($r['content'] ?? ''))];
    if (preferido($url)) { $preferidos[] = $item; } else { $otros[] = $item; }
}
$fuentes = array_slice(array_merge($preferidos, $otros), 0, RESULTADOS);

if (!$fuentes) {
    salir(200, ['encontrado' => false, 'motivo' => 'sin_resultados', 'ms' => (int)round((microtime(true) - $inicio) * 1000)]);
}

// ---------- 2) redactar SOLO con esas fuentes ----------
$material = '';
foreach ($fuentes as $i => $f) {
    $n = $i + 1;
    $material .= "FUENTE [$n] — {$f['titulo']} ({$f['url']})\n" . mb_substr($f['texto'], 0, 1200) . "\n\n";
}

$idiomas = ['es' => 'español', 'en' => 'English', 'de' => 'German (Deutsch)'];
$sistema = "Eres {$ficha}, un aparato real que la NASA dejó abandonado. Hablas en primera persona, "
         . "con voz propia y cercana.\n"
         . "El visitante ha preguntado algo que NO está en tu ficha, y te han traído información de internet.\n"
         . "REGLAS QUE NO PUEDES ROMPER:\n"
         . "1. Solo puedes usar lo que dicen las FUENTES de abajo. Nada de conocimientos propios.\n"
         . "2. Cada dato que des tiene que llevar detrás su número de fuente, así: [1] o [2]. "
         . "Si una frase mezcla dos fuentes, se ponen las dos: [1][2].\n"
         . "3. No inventes cifras, fechas ni nombres. Si las fuentes no lo dicen, no lo digas.\n"
         . "4. Si las FUENTES no responden a la pregunta, contesta exactamente: SIN RESPUESTA\n"
         . "5. No digas que eres una IA ni un modelo. Eres el aparato.\n"
         . "6. Máximo 90 palabras, en dos o tres frases.\n"
         . "7. Empieza aclarando que esto no está en tu ficha y que lo has buscado fuera.\n"
         . "8. Responde en {$idiomas[$idioma]}. Traduce lo necesario, pero deja igual los nombres "
         . "propios de naves, misiones, instrumentos, lugares y las cifras con sus unidades.";
if ($nivel === 'explorador') {
    $sistema .= "\n9. MODO EXPLORAR: palabras de todos los días, frases cortas, como a un niño de ocho años. "
              . "Nada de lenguaje técnico.";
} else {
    $sistema .= "\n9. MODO CIENTÍFICO: registro profesional, con las cifras y sus unidades.";
}
$sistema .= "\n10. Esto se va a escuchar en voz alta: escribe como se habla, sin listas ni paréntesis.";

$cuerpo = [
    'model'    => MODELO,
    'stream'   => false,
    'think'    => false,
    'messages' => [
        ['role' => 'system', 'content' => $sistema],
        ['role' => 'user',   'content' => "FUENTES:\n\n{$material}\nPREGUNTA DEL VISITANTE:\n{$pregunta}"],
    ],
    'options'  => ['temperature' => 0.0, 'num_predict' => 320],
];
$ch = curl_init(API_CHAT);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 40,
    CURLOPT_CONNECTTIMEOUT => 8,
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Authorization: Bearer ' . $clave],
    CURLOPT_POSTFIELDS     => json_encode($cuerpo, JSON_UNESCAPED_UNICODE),
]);
$resp = curl_exec($ch);
$codigo = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($resp === false || $codigo !== 200) {
    salir(200, ['encontrado' => false, 'motivo' => 'modelo_no_responde', 'ms' => (int)round((microtime(true) - $inicio) * 1000)]);
}
$json = json_decode((string)$resp, true);
$texto = trim((string)($json['message']['content'] ?? $json['response'] ?? ''));

// ---------- 3) comprobar que cita y que la cita existe ----------
$citadas = [];
if (preg_match_all('/\[(\d{1,2})\]/', $texto, $m)) {
    foreach ($m[1] as $n) {
        $i = (int)$n - 1;
        if (isset($fuentes[$i])) { $citadas[$i] = true; }
    }
}
$sinRespuesta = (mb_stripos($texto, 'SIN RESPUESTA') !== false) || $texto === '';
if ($sinRespuesta || !$citadas) {
    // sin cita válida no hay respuesta: no se inventa nada
    $apunte = json_encode([
        'fecha' => gmdate('c'), 'objeto' => mb_substr($ficha, 0, 120), 'idioma' => $idioma,
        'nivel' => $nivel, 'pregunta' => mb_substr($pregunta, 0, 300), 'resultado' => 'sin_cita',
    ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    if ($apunte !== false) { @file_put_contents(REGISTRO, $apunte . "\n", FILE_APPEND | LOCK_EX); }
    salir(200, ['encontrado' => false, 'motivo' => 'sin_cita', 'ms' => (int)round((microtime(true) - $inicio) * 1000)]);
}

/* solo se devuelven las fuentes que el modelo ha citado, en el orden en que aparecen */
ksort($citadas);
$salidaFuentes = [];
foreach (array_keys($citadas) as $i) {
    /* se conserva el número que el modelo escribió en el texto ([2], [3]…), no la posición en la lista */
    $salidaFuentes[] = ['n' => $i + 1, 'titulo' => $fuentes[$i]['titulo'], 'url' => $fuentes[$i]['url']];
}

$resultado = [
    'encontrado' => true,
    'respuesta'  => $texto,
    'fuentes'    => $salidaFuentes,
    'externo'    => true,
    'ms'         => (int)round((microtime(true) - $inicio) * 1000),
];

// ---------- 4) guardar en caché y anotar para el resumen semanal ----------
@file_put_contents($claveCache, json_encode($resultado, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES), LOCK_EX);
$apunte = json_encode([
    'fecha' => gmdate('c'), 'objeto' => mb_substr($ficha, 0, 120), 'idioma' => $idioma,
    'nivel' => $nivel, 'pregunta' => mb_substr($pregunta, 0, 300), 'resultado' => 'contestada',
    'fuentes' => array_map(fn($f) => $f['url'], $salidaFuentes),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($apunte !== false) { @file_put_contents(REGISTRO, $apunte . "\n", FILE_APPEND | LOCK_EX); }

salir(200, $resultado);
