<?php
/**
 * Memory Signals · descarga de los archivos de una propuesta
 * Los adjuntos viven fuera de la carpeta pública. Se bajan solo con el enlace
 * firmado que va en el aviso por correo, y el enlace caduca.
 *
 * GET /app/api/descarga.php?id=<id>&f=<fichero>&e=<caduca>&t=<firma>
 * Si la firma no cuadra, si ha caducado o si el fichero no existe: 404 y nada más.
 */

declare(strict_types=1);

const CLAVE       = '/home/gesemweb-nasa/.ms/descarga.key';
const CONTRIB_DIR = '/home/gesemweb-nasa/contribuciones';

function no_encontrado(): void {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    header('X-Robots-Tag: noindex, nofollow');
    echo "No encontrado.\n";
    exit;
}

header('X-Robots-Tag: noindex, nofollow');
header('Referrer-Policy: no-referrer');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'GET' && ($_SERVER['REQUEST_METHOD'] ?? '') !== 'HEAD') {
    no_encontrado();
}

$id      = (string) ($_GET['id'] ?? '');
$fichero = (string) ($_GET['f'] ?? '');
$expira  = (int) ($_GET['e'] ?? 0);
$firma   = (string) ($_GET['t'] ?? '');

/* formatos admitidos: los mismos que guarda el formulario, nada de rutas */
if (!preg_match('/^\d{8}-\d{6}-[a-z0-9-]{1,90}$/', $id)) { no_encontrado(); }
if (!preg_match('/^[a-z0-9][a-z0-9-]{0,40}\.(zip|pdf|doc|docx|txt|md)$/', $fichero)) { no_encontrado(); }
if ($expira < time()) { no_encontrado(); }
if (!preg_match('/^[a-f0-9]{64}$/', $firma)) { no_encontrado(); }

if (!is_readable(CLAVE)) { no_encontrado(); }
$clave = trim((string) file_get_contents(CLAVE));
if (strlen($clave) < 32) { no_encontrado(); }

$esperada = hash_hmac('sha256', $id . '|' . $fichero . '|' . $expira, $clave);
if (!hash_equals($esperada, $firma)) { no_encontrado(); }

$ruta = CONTRIB_DIR . '/' . $id . '/' . $fichero;
$real = realpath($ruta);
$base = realpath(CONTRIB_DIR);
if ($real === false || $base === false || strncmp($real, $base . '/', strlen($base) + 1) !== 0 || !is_file($real)) {
    no_encontrado();
}

$tipos = [
    'zip'  => 'application/zip',
    'pdf'  => 'application/pdf',
    'doc'  => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt'  => 'text/plain; charset=utf-8',
    'md'   => 'text/markdown; charset=utf-8',
];
$ext = strtolower(pathinfo($real, PATHINFO_EXTENSION));
$tipo = $tipos[$ext] ?? 'application/octet-stream';

$nombre = $id . '-' . $fichero;

header('Content-Type: ' . $tipo);
header('Content-Length: ' . filesize($real));
header('Content-Disposition: attachment; filename="' . $nombre . '"');
header('Cache-Control: private, no-store, max-age=0');
header('X-Content-Type-Options: nosniff');

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'HEAD') {
    exit;
}

$fh = fopen($real, 'rb');
if ($fh === false) { no_encontrado(); }
while (!feof($fh)) {
    $trozo = fread($fh, 65536);
    if ($trozo === false) { break; }
    echo $trozo;
    flush();
}
fclose($fh);
