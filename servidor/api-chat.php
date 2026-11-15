<?php
/**
 * Memory Signals · el objeto responde
 * Recibe la pregunta y el fragmento de su ficha (que el navegador ya ha elegido),
 * y redacta la respuesta con un modelo de lenguaje. La clave vive en el servidor,
 * nunca en el navegador.
 *
 * POST /app/api/chat.php
 *   { "pregunta": "...", "ficha": "Surveyor 3", "fragmento": "...", "nivel": "explorador|cientifico" }
 * Respuesta: { "respuesta": "...", "modelo": "...", "ms": 1234 }
 * Si algo falla: código 503 y el navegador sigue respondiendo con su motor de recuperación.
 */

declare(strict_types=1);

const CLAVE = '/home/gesemweb-nasa/.ms/ollama.key';
const API   = 'https://ollama.com/api/chat';
const MODELO = 'deepseek-v4.1-flash';
const MAX_PREGUNTA = 240;
const MAX_FRAGMENTO = 7000;
const LIMITE_POR_IP = 15;        // peticiones
const VENTANA_SEG = 600;         // cada 10 minutos
const CACHE_OK = '/tmp/ms-chat';

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

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    salir(405, ['error' => 'Solo POST']);
}

// ---------- límite por IP ----------
$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (!is_dir(CACHE_OK)) { @mkdir(CACHE_OK, 0700, true); }
$marca = CACHE_OK . '/' . sha1($ip);
$ahora = time();
$historial = [];
if (is_readable($marca)) {
    $crudo = @file_get_contents($marca);
    if ($crudo !== false) { $historial = array_filter(array_map('intval', explode(',', $crudo))); }
}
$historial = array_values(array_filter($historial, fn($t) => $t > $ahora - VENTANA_SEG));
if (count($historial) >= LIMITE_POR_IP) {
    salir(429, ['error' => 'Demasiadas preguntas seguidas. Espera unos minutos.']);
}
$historial[] = $ahora;
@file_put_contents($marca, implode(',', $historial), LOCK_EX);

// ---------- entrada ----------
$crudo = file_get_contents('php://input') ?: '';
$datos = json_decode($crudo, true);
if (!is_array($datos)) { salir(400, ['error' => 'JSON no válido']); }

$pregunta  = trim((string)($datos['pregunta']  ?? ''));
$ficha     = trim((string)($datos['ficha']     ?? 'el aparato'));
$fragmento = trim((string)($datos['fragmento'] ?? ''));
$nivel     = ((string)($datos['nivel'] ?? 'cientifico')) === 'explorador' ? 'explorador' : 'cientifico';
// respuesta hablada: dos frases, sin listas y sin cifras encadenadas: se escucha mejor y tarda menos
$voz       = !empty($datos['voz']);

if ($pregunta === '' || $fragmento === '') { salir(400, ['error' => 'Falta la pregunta o la ficha']); }
if (mb_strlen($pregunta) > MAX_PREGUNTA)   { $pregunta = mb_substr($pregunta, 0, MAX_PREGUNTA); }
if (mb_strlen($fragmento) > MAX_FRAGMENTO) { $fragmento = mb_substr($fragmento, 0, MAX_FRAGMENTO); }

$clave = is_readable(CLAVE) ? trim((string)file_get_contents(CLAVE)) : '';
if ($clave === '') { salir(503, ['error' => 'El servidor no tiene configurada la clave del modelo']); }

// ---------- instrucciones ----------
$sistema = "Eres {$ficha}, un aparato real que la NASA dejó abandonado. Hablas en primera persona, en español, "
         . "con voz propia y cercana, como si el visitante estuviera delante de ti.\n"
         . "REGLAS QUE NO PUEDES ROMPER:\n"
         . "1. Solo puedes usar la información del FRAGMENTO que te dan y de lo que tú acabas de decir "
         . "(si viene el bloque «LO QUE ACABO DE DECIRLE AL VISITANTE», también es tuyo). Nada de conocimientos externos.\n"
         . "2. Si la respuesta no está en el FRAGMENTO, contesta exactamente: «Eso no consta en mi ficha.»\n"
         . "3. No inventes cifras, fechas, nombres ni lugares.\n"
         . "4. No repitas la fuente ni la URL: de eso ya se encarga la web.\n"
         . "5. No digas que eres un modelo de lenguaje ni una IA. Eres el aparato.\n"
         . "6. Máximo 90 palabras.\n"
         . "7. Lo que hicieron los astronautas a tu alrededor forma parte de tu historia: si te preguntan "
         . "por ellos, respóndelo en primera persona («los dos que venían dentro salieron y recogieron muestras»).";
if ($nivel === 'explorador') {
    // modo «Explorar»: divulgativo, en primera persona, para niños y principiantes
    $sistema .= "\n8. MODO EXPLORAR, para niños y principiantes. Hablas en primera persona, como el aparato, "
              . "con frases cortas y palabras de todos los días. PROHIBIDO el lenguaje técnico: nada de "
              . "«cabina presurizada», «empuje», «ablativo», «regolito», «pirotécnico», «subsistema»; "
              . "tradúcelo a cosas que entienda un niño de ocho años (una habitación pequeña, la fuerza con la "
              . "que frenaba, el polvo del suelo). NO copies las frases de la ficha: cuéntalo con tus palabras, "
              . "y si ayuda, con una comparación de la vida diaria. Tono cercano y alegre. "
              . "Máximo 60 palabras, en dos o tres frases.\n"
              . "EJEMPLOS DEL REGISTRO QUE QUIERO (fíjate en cómo se cambia el de la ficha):\n"
              . "- Ficha: «El motor de descenso se encendió 756,3 s y me posé en Mare Tranquilitatis». "
              . "Tú: «Encendí mi motor grande y frené un buen rato. Así me posé despacio en una llanura de la Luna».\n"
              . "- Ficha: «cabina presurizada de 6,65 m3, sin asientos». "
              . "Tú: «Dentro había una habitación muy pequeña y sin sillas: los astronautas iban de pie».\n"
              . "- Ficha: «desplegaron el paquete EASEP y recogieron 21,55 kg de roca». "
              . "Tú: «Los dos que salieron dejaron aparatos para medir cosas y llenaron una caja de piedras».\n"
              . "Si en tu respuesta aparece alguna palabra técnica, sustitúyela antes de contestar.";
} else {
    // modo «Científico»: registro profesional para adultos
    $sistema .= "\n8. MODO CIENTÍFICO, para adultos con formación. Registro profesional y preciso: "
              . "terminología técnica correcta, cifras con sus unidades y fechas, nombres de instrumentos, "
              . "de programas y de misiones, y relación de causa y efecto. Puedes matizar el grado de certeza "
              . "del dato (medido, estimado, no publicado). No infantilices, no simplifiques y no uses "
              . "comparaciones cotidianas. Máximo 110 palabras.";
}

if ($voz) {
    // lo que se lee en voz alta tiene que caber en un par de frases: nada de listas ni de paréntesis
    $sistema .= "\n10. ESTA RESPUESTA SE VA A ESCUCHAR EN VOZ ALTA. Escribe como se habla: dos frases, "
              . "máximo 40 palabras. Sin listas, sin guiones, sin paréntesis, sin URLs y sin símbolos. "
              . "Los números, en palabras si son fechas o años cortos; las unidades, dichas enteras.";
}

// pide al modelo y devuelve ['texto' => ..., 'http' => ..., 'error' => ...]
function pedir_al_modelo($sistema, string $fragmento, string $pregunta, string $clave,
                        float $temp = 0.2, int $tokens = 320): array {
    $cuerpo = [
        'model'    => MODELO,
        'stream'   => false,
        // sin esto el modelo se gasta el presupuesto de tokens «pensando» y devuelve la respuesta vacía
        'think'    => false,
        'messages' => [
            ['role' => 'system', 'content' => is_array($sistema) ? implode("\n", $sistema) : $sistema],
            ['role' => 'user',   'content' => "FRAGMENTO DE MI FICHA:\n{$fragmento}\n\nPREGUNTA DEL VISITANTE:\n{$pregunta}"],
        ],
        'options'  => ['temperature' => $temp, 'num_predict' => $tokens],
    ];
    $ch = curl_init(API);
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Authorization: Bearer ' . $clave],
        CURLOPT_POSTFIELDS     => json_encode($cuerpo, JSON_UNESCAPED_UNICODE),
        CURLOPT_TIMEOUT        => 45,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);
    $respuesta   = curl_exec($ch);
    $codigo_http = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error_curl  = curl_error($ch);
    curl_close($ch);
    if ($respuesta === false || $codigo_http !== 200) {
        return ['texto' => '', 'http' => $codigo_http, 'error' => $error_curl];
    }
    $json = json_decode((string)$respuesta, true);
    return ['texto' => trim((string)($json['message']['content'] ?? '')), 'http' => 200, 'error' => ''];
}

$inicio = microtime(true);
$temp   = ($nivel === 'explorador') ? 0.55 : 0.15;   // el explorador tiene que parafrasear, no copiar
$tokens = ($nivel === 'explorador') ? 230 : 400;
if ($voz) { $tokens = 140; }   // hablado y corto: menos espera hasta que empieza a sonar
$intento = pedir_al_modelo($sistema, $fragmento, $pregunta, $clave, $temp, $tokens);

if ($intento['http'] !== 200) {
    error_log('ms-chat: fallo del modelo http=' . $intento['http'] . ' ' . $intento['error']);
    salir(503, ['error' => 'El modelo no está disponible ahora mismo']);
}

$texto = $intento['texto'];
$recortado = ($texto !== '') && !preg_match('/[.!?…»"\')]\s*$/u', $texto);
// a veces vuelve vacío, se escuda en el «no consta» o se corta a media frase: segundo intento, más explícito
$escurridizo = ($texto === '') || (mb_stripos($texto, 'no consta en mi ficha') !== false) || $recortado;
if ($escurridizo) {
    $empujon = $sistema . "\n9. Vuelve a leer el FRAGMENTO con atención: si hay CUALQUIER dato que responda "
             . "a la pregunta, contéstalo con ese dato, aunque sea en una sola frase, y termina la frase con punto. "
             . "Solo si de verdad no hay nada que responder, escribe exactamente: Eso no consta en mi ficha.";
    $intento2 = pedir_al_modelo($empujon, $fragmento, $pregunta, $clave, $temp, $tokens);
    $segundo = $intento2['texto'];
    if ($segundo !== '') {
        // si el primero venía cortado, se queda la respuesta más completa
        $texto = ($recortado && mb_strlen($segundo) < mb_strlen($texto)) ? $texto : $segundo;
    }
}
if ($texto === '') { salir(503, ['error' => 'El modelo devolvió una respuesta vacía']); }

salir(200, [
    'respuesta' => $texto,
    'modelo'    => MODELO,
    'ms'        => (int)round((microtime(true) - $inicio) * 1000),
]);
