<?php
/**
 * Resumen semanal de las preguntas que los objetos no supieron contestar.
 *
 * Uso normal (lo llama el cron):   wp eval-file resumen-sin-respuesta.php
 * Solo mirar, sin enviar ni borrar: MS_VER=1 wp eval-file resumen-sin-respuesta.php
 *
 * Lee /home/gesemweb-nasa/ms-sin-respuesta/preguntas.jsonl (lo escribe api-chat.php cuando
 * la respuesta es «no consta»), agrupa por objeto y pregunta, manda un correo a nonopp@gmail.com
 * y archiva el fichero en enviados/. No se guarda ni la IP ni nada del visitante.
 */

if (!function_exists('wp_mail')) {
    fwrite(STDERR, "Esto hay que lanzarlo con: wp eval-file resumen-sin-respuesta.php\n");
    return;
}

$dir      = '/home/gesemweb-nasa/ms-sin-respuesta';
$fichero  = $dir . '/preguntas.jsonl';
$archivo  = $dir . '/enviados';
$para     = 'nonopp@gmail.com';
$soloVer  = (bool)getenv('MS_VER');
$desde    = gmdate('Y-m-d', time() - 7 * 86400);

if (!is_file($fichero) || filesize($fichero) === 0) {
    echo "Sin preguntas apuntadas: no se envía nada.\n";
    return;
}

/* ---------- leer y agrupar ---------- */
$lineas = file($fichero, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$grupos = [];
$total  = 0;
$objetos = [];
foreach ($lineas as $linea) {
    $d = json_decode($linea, true);
    if (!is_array($d) || empty($d['pregunta'])) { continue; }
    $total++;
    $objeto   = trim((string)($d['objeto'] ?? 'sin objeto'));
    $pregunta = trim((string)$d['pregunta']);
    $clave    = mb_strtolower($objeto . '|' . preg_replace('/\s+/u', ' ', $pregunta), 'UTF-8');
    if (!isset($grupos[$clave])) {
        $grupos[$clave] = [
            'objeto'   => $objeto,
            'pregunta' => $pregunta,
            'veces'    => 0,
            'primera'  => $d['fecha'] ?? '',
            'ultima'   => $d['fecha'] ?? '',
            'idioma'   => $d['idioma'] ?? 'es',
            'nivel'    => $d['nivel'] ?? '',
        ];
    }
    $grupos[$clave]['veces']++;
    if (($d['fecha'] ?? '') > $grupos[$clave]['ultima']) { $grupos[$clave]['ultima'] = $d['fecha']; }
    $objetos[$objeto] = ($objetos[$objeto] ?? 0) + 1;
}
if (!$grupos) {
    echo "Sin preguntas válidas: no se envía nada.\n";
    return;
}
uasort($grupos, function ($a, $b) { return $b['veces'] <=> $a['veces']; });
arsort($objetos);

$fecha = function ($iso) {
    if (!$iso) { return '—'; }
    try {
        $f = new DateTime($iso);
        $f->setTimezone(new DateTimeZone('Europe/Madrid'));
        return $f->format('d/m/Y H:i');
    } catch (Exception $e) { return $iso; }
};

/* ---------- cuerpo del correo ---------- */
$nPreguntas = count($grupos);
$asunto = sprintf('[Memory Signals] %d pregunta%s sin respuesta · %s', $nPreguntas, $nPreguntas === 1 ? '' : 's', gmdate('d/m/Y'));

$h  = '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;font-size:15px;line-height:1.55;color:#12202e">';
$h .= '<h2 style="margin:0 0 6px;font-size:19px">Preguntas que se quedaron sin respuesta</h2>';
$h .= '<p style="margin:0 0 14px;color:#4a5b6b">Semana hasta el ' . gmdate('d/m/Y') . ' · ' . $total . ' intento(s) sin respuesta, '
    . $nPreguntas . ' pregunta(s) distinta(s), ' . count($objetos) . ' objeto(s).</p>';
$h .= '<p style="margin:0 0 14px;color:#4a5b6b">Sirve para buscar el dato que falta o para preparar otra respuesta. '
    . 'No se guarda ningún dato del visitante: solo el objeto, la pregunta, el idioma y la hora.</p>';

$h .= '<h3 style="margin:18px 0 8px;font-size:15px">Objetos con más preguntas sin respuesta</h3><ul style="margin:0 0 18px;padding-left:20px">';
foreach ($objetos as $ob => $n) {
    $h .= '<li>' . htmlspecialchars($ob, ENT_QUOTES, 'UTF-8') . ' · <strong>' . $n . '</strong></li>';
}
$h .= '</ul>';

$h .= '<h3 style="margin:18px 0 8px;font-size:15px">Preguntas, una a una</h3>';
$h .= '<table cellpadding="8" cellspacing="0" border="0" style="width:100%;border-collapse:collapse;font-size:14px">';
$h .= '<thead><tr style="background:#eef3f7;text-align:left">'
    . '<th style="border-bottom:1px solid #d6e0e8">Objeto</th>'
    . '<th style="border-bottom:1px solid #d6e0e8">Pregunta</th>'
    . '<th style="border-bottom:1px solid #d6e0e8">Veces</th>'
    . '<th style="border-bottom:1px solid #d6e0e8">Última vez</th>'
    . '<th style="border-bottom:1px solid #d6e0e8">Idioma</th></tr></thead><tbody>';
foreach ($grupos as $g) {
    $h .= '<tr>'
        . '<td style="border-bottom:1px solid #eaeff4;vertical-align:top">' . htmlspecialchars($g['objeto'], ENT_QUOTES, 'UTF-8') . '</td>'
        . '<td style="border-bottom:1px solid #eaeff4;vertical-align:top">' . htmlspecialchars($g['pregunta'], ENT_QUOTES, 'UTF-8')
        . ($g['nivel'] ? '<br><span style="color:#7b8b99;font-size:12px">nivel: ' . htmlspecialchars($g['nivel'], ENT_QUOTES, 'UTF-8') . '</span>' : '') . '</td>'
        . '<td style="border-bottom:1px solid #eaeff4;vertical-align:top;text-align:center">' . $g['veces'] . '</td>'
        . '<td style="border-bottom:1px solid #eaeff4;vertical-align:top;white-space:nowrap">' . $fecha($g['ultima']) . '</td>'
        . '<td style="border-bottom:1px solid #eaeff4;vertical-align:top">' . htmlspecialchars($g['idioma'], ENT_QUOTES, 'UTF-8') . '</td>'
        . '</tr>';
}
$h .= '</tbody></table>';
$h .= '<p style="margin:18px 0 0;color:#7b8b99;font-size:12px">Memory Signals · resumen automático de los lunes. '
    . 'El fichero de esta semana queda archivado en el servidor.</p></div>';

$texto = "Preguntas sin respuesta · semana hasta el " . gmdate('d/m/Y') . " · {$total} intento(s), {$nPreguntas} pregunta(s) distinta(s)\n\n";
foreach ($grupos as $g) {
    $texto .= sprintf("- [%s] %s (x%d, última %s, %s)\n", $g['objeto'], $g['pregunta'], $g['veces'], $fecha($g['ultima']), $g['idioma']);
}

if ($soloVer) {
    echo "ASUNTO: {$asunto}\n\n{$texto}\n";
    return;
}

/* ---------- enviar ---------- */
$cabeceras = ['Content-Type: text/html; charset=UTF-8'];
$enviado = wp_mail($para, $asunto, $h, $cabeceras);

if ($enviado) {
    if (!is_dir($archivo)) { @mkdir($archivo, 0750, true); }
    @rename($fichero, $archivo . '/preguntas-' . gmdate('Y-m-d') . '.jsonl');
    echo "Enviado a {$para}: {$nPreguntas} pregunta(s) distinta(s) de {$total} intento(s).\n";
} else {
    echo "FALLO el envío: el fichero se queda como estaba para el próximo lunes.\n";
}
