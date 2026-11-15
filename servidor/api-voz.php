<?php
/**
 * Memory Signals · el objeto escucha
 * Recibe una grabación corta del navegador y la transcribe. El audio no se guarda:
 * se manda al transcriptor, se borra el temporal y se devuelve solo el texto.
 * La clave vive en el servidor, nunca en el navegador.
 *
 * POST /app/api/voz.php   (multipart/form-data)
 *   audio = fichero (webm/ogg/mp4/wav/mp3), hasta 5 MB
 *   terminos = «Surveyor 3, ALSEP, Oceanus Procellarum» (opcional, mejora los nombres propios)
 * Respuesta: { "texto": "...", "ms": 1234 }
 * Si algo falla: 503 y el navegador vuelve al teclado con un aviso breve.
 */

declare(strict_types=1);

const CLAVE     = '/home/gesemweb-nasa/.ms/openai.key';
const API       = 'https://api.openai.com/v1/audio/transcriptions';
const MODELO    = 'gpt-transcribe';
const MAX_BYTES = 5 * 1024 * 1024;   // 30 s de audio no llegan ni a 1 MB
const MAX_SEG   = 45;                // tope de duración razonable
const LIMITE_POR_IP = 15;            // transcripciones
const VENTANA_SEG   = 600;           // cada 10 minutos
const CACHE_OK  = '/tmp/ms-voz';

const TIPOS_OK = [
    'audio/webm' => 'webm',
    'video/webm' => 'webm',
    'audio/ogg'  => 'ogg',
    'audio/mp4'  => 'm4a',
    'video/mp4'  => 'm4a',
    'audio/mpeg' => 'mp3',
    'audio/wav'  => 'wav',
    'audio/x-wav' => 'wav',
];

function salir(int $codigo, array $datos): void {
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ---------- CORS: solo nuestras casas ----------
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

// ---------- ¿está configurada la clave? ----------
if (!is_readable(CLAVE)) {
    salir(503, ['error' => 'El micrófono no está disponible ahora mismo. Escribe tu pregunta.']);
}
$clave = trim((string) file_get_contents(CLAVE));
if ($clave === '') {
    salir(503, ['error' => 'El micrófono no está disponible ahora mismo. Escribe tu pregunta.']);
}

// ---------- límite por IP (IP cifrada, sin datos personales) ----------
$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
if (!is_dir(CACHE_OK)) { @mkdir(CACHE_OK, 0700, true); }
$marca = CACHE_OK . '/' . sha1($ip);
$ahora = time();
$historial = [];
if (is_readable($marca)) {
    $crudo = @file_get_contents($marca);
    if ($crudo !== false) { $historial = array_filter(array_map('intval', explode(',', $crudo))); }
}
$historial = array_values(array_filter($historial, static fn (int $t): bool => $t > $ahora - VENTANA_SEG));
if (count($historial) >= LIMITE_POR_IP) {
    salir(429, ['error' => 'Demasiadas preguntas por voz seguidas. Espera un poco o escríbela.']);
}
$historial[] = $ahora;
@file_put_contents($marca, implode(',', $historial), LOCK_EX);

// ---------- el fichero ----------
$f = $_FILES['audio'] ?? null;
if (!$f || ($f['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) {
    salir(400, ['error' => 'No ha llegado ninguna grabación.']);
}
if ((int) $f['size'] > MAX_BYTES) {
    salir(413, ['error' => 'La grabación es demasiado larga. Prueba con una pregunta más corta.']);
}

$finfo = new finfo(FILEINFO_MIME_TYPE);
$tipo = (string) $finfo->file($f['tmp_name']);
if (!isset(TIPOS_OK[$tipo])) {
    salir(415, ['error' => 'El formato de audio no vale. Escribe la pregunta.']);
}
$ext = TIPOS_OK[$tipo];

$temporal = tempnam(sys_get_temp_dir(), 'msvoz');
if ($temporal === false) {
    salir(500, ['error' => 'No se ha podido preparar la grabación.']);
}
$destino = $temporal . '.' . $ext;
if (!@move_uploaded_file($f['tmp_name'], $destino)) {
    @unlink($temporal);
    salir(500, ['error' => 'No se ha podido preparar la grabación.']);
}
@unlink($temporal);

register_shutdown_function(static function () use ($destino) {
    if (is_file($destino)) { @unlink($destino); }
});

// ---------- a transcribir ----------
$terminos = trim((string) ($_POST['terminos'] ?? ''));
$terminos = mb_substr(preg_replace('/[^\p{L}\p{N}\s,\.\-]/u', ' ', $terminos) ?? '', 0, 200);

$campos = [
    'model'    => MODELO,
    'language' => 'es',
    'response_format' => 'json',
];
if ($terminos !== '') {
    $campos['prompt'] = 'Pregunta a un aparato espacial. Nombres propios que pueden aparecer: ' . $terminos . '.';
}

$partes = [];
foreach ($campos as $k => $v) { $partes[$k] = $v; }
$partes['file'] = new CURLFile($destino, $tipo, 'audio.' . $ext);

$t0 = microtime(true);
$ch = curl_init(API);
curl_setopt_array($ch, [
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => $partes,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 45,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_HTTPHEADER     => ['Authorization: Bearer ' . $clave],
]);
$cuerpo = curl_exec($ch);
$codigo = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$fallo  = curl_error($ch);
curl_close($ch);
@unlink($destino);

$ms = (int) round((microtime(true) - $t0) * 1000);

if ($cuerpo === false || $fallo !== '') {
    salir(503, ['error' => 'No se ha podido transcribir la pregunta. Escríbela.', 'ms' => $ms]);
}
if ($codigo === 429) {
    salir(429, ['error' => 'El transcriptor está saturado. Escribe la pregunta o prueba en un momento.', 'ms' => $ms]);
}
if ($codigo !== 200) {
    salir(503, ['error' => 'No se ha podido transcribir la pregunta. Escríbela.', 'ms' => $ms]);
}

$datos = json_decode((string) $cuerpo, true);
$texto = trim((string) ($datos['text'] ?? ''));
if ($texto === '') {
    salir(422, ['error' => 'No te he oído nada. Prueba otra vez o escríbela.', 'ms' => $ms]);
}

/* el texto se devuelve tal cual: el navegador lo pone en la caja y espera confirmación */
salir(200, ['texto' => mb_substr($texto, 0, 240), 'ms' => $ms]);
