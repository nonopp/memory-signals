<?php
/**
 * Plugin Name: Memory Signals · Contribuciones
 * Description: Recibe las propuestas del formulario «Participa» de la app Memory Signals, guarda los adjuntos fuera de la carpeta pública y avisa por correo con wp_mail().
 * Version: 1.0.0
 * Author: Memory Signals · NASA Space Apps Challenge 2026
 * License: MIT
 *
 * Ruta pública: POST /wp-json/memory-signals/v1/contribucion
 *
 * Nada se publica automáticamente: cada envío queda en estado «nuevo» esperando revisión humana.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/* -------------------------------------------------------------------------
 *  Ajustes que se pueden cambiar sin tocar la lógica
 * ---------------------------------------------------------------------- */

if ( ! defined( 'MS_CONTRIB_DIR' ) ) {
	// Fuera de la carpeta pública (el webroot es .../htdocs/nasa.gesemweb.es).
	define( 'MS_CONTRIB_DIR', '/home/gesemweb-nasa/contribuciones' );
}
if ( ! defined( 'MS_CLAVE_DESCARGA' ) ) {
	define( 'MS_CLAVE_DESCARGA', '/home/gesemweb-nasa/.ms/descarga.key' );  // fuera del docroot, 600
}
if ( ! defined( 'MS_DESCARGA_URL' ) ) {
	define( 'MS_DESCARGA_URL', 'https://nasa.gesemweb.es/app/api/descarga.php' );
}
if ( ! defined( 'MS_DIAS_ENLACE' ) ) {
	define( 'MS_DIAS_ENLACE', 30 );   // los enlaces del aviso caducan
}
if ( ! defined( 'MS_AVISO_A' ) ) {
	// A quién se avisa de cada envío. El correo del visitante va en Reply-To, nunca en From.
	define( 'MS_AVISO_A', array( 'nonopp@gmail.com' ) );
}
if ( ! defined( 'MS_ORIGENES' ) ) {
	define( 'MS_ORIGENES', array(
		'https://nasa.gesemweb.es',
		'https://nonopp.github.io',
		'http://127.0.0.1:8124',
		'http://localhost:8124',
	) );
}

define( 'MS_MAX_FOTOS_BYTES', 25 * 1024 * 1024 );   // 25 MB el zip de fotos
define( 'MS_MAX_DOC_BYTES', 10 * 1024 * 1024 );     // 10 MB por documento
define( 'MS_MAX_DOCS', 3 );                          // 3 documentos
define( 'MS_MAX_ENTRADAS_ZIP', 200 );                // antibomba
define( 'MS_MAX_IMAGENES_ZIP', 60 );
define( 'MS_MAX_DESCOMPRIMIDO', 400 * 1024 * 1024 ); // suma declarada dentro del zip

/* -------------------------------------------------------------------------
 *  CORS con lista blanca (la misma para el chat y el formulario)
 * ---------------------------------------------------------------------- */

add_filter( 'rest_pre_serve_request', function ( $servido ) {
	$origen = get_http_origin();
	if ( $origen && in_array( $origen, MS_ORIGENES, true ) ) {
		header( 'Access-Control-Allow-Origin: ' . esc_url_raw( $origen ) );
		header( 'Vary: Origin', false );
	}
	header( 'Access-Control-Allow-Methods: POST, OPTIONS' );
	header( 'Access-Control-Allow-Headers: Content-Type' );
	header( 'Access-Control-Max-Age: 600' );
	return $servido;
}, 15 );

/* -------------------------------------------------------------------------
 *  Utilidades
 * ---------------------------------------------------------------------- */

function ms_responder( $datos, $codigo = 200 ) {
	return new WP_REST_Response( $datos, $codigo );
}

function ms_error( $mensaje, $codigo = 400, $campo = '' ) {
	return new WP_REST_Response( array(
		'recibido' => false,
		'error'    => $mensaje,
		'campo'    => $campo,
	), $codigo );
}

function ms_ip_hash() {
	$ip = isset( $_SERVER['REMOTE_ADDR'] ) ? (string) $_SERVER['REMOTE_ADDR'] : '';
	// Con sal fija: sirve para limitar envíos, no para identificar a nadie.
	return substr( hash_hmac( 'sha256', $ip, wp_salt( 'nonce' ) ), 0, 32 );
}

function ms_slug( $texto, $max = 40 ) {
	$slug = sanitize_title( remove_accents( (string) $texto ) );
	$slug = trim( preg_replace( '/[^a-z0-9]+/', '-', $slug ), '-' );
	if ( '' === $slug ) {
		$slug = 'objeto';
	}
	return substr( $slug, 0, $max );
}

/**
 * Límite por IP: 1 envío por hora y 5 al día. Ficheros marca con bloqueo exclusivo.
 */
function ms_limite( $ip_hash ) {
	$dir = MS_CONTRIB_DIR . '/.limites';
	if ( ! is_dir( $dir ) && ! wp_mkdir_p( $dir ) ) {
		return true; // si no se puede contar, no se bloquea al visitante
	}
	$marcas = array(
		array( 'f' => $dir . '/' . $ip_hash . '-hora', 'ventana' => 3600, 'tope' => 1 ),
		array( 'f' => $dir . '/' . $ip_hash . '-dia', 'ventana' => 86400, 'tope' => 5 ),
	);
	$ahora = time();
	foreach ( $marcas as $m ) {
		$fh = @fopen( $m['f'], 'c+' );
		if ( ! $fh ) {
			continue;
		}
		flock( $fh, LOCK_EX );
		$guardados = json_decode( (string) stream_get_contents( $fh ), true );
		$guardados = is_array( $guardados ) ? $guardados : array();
		$vivos     = array_values( array_filter( $guardados, function ( $t ) use ( $ahora, $m ) {
			return (int) $t > ( $ahora - $m['ventana'] );
		} ) );
		if ( count( $vivos ) >= $m['tope'] ) {
			flock( $fh, LOCK_UN );
			fclose( $fh );
			return false;
		}
		$vivos[] = $ahora;
		ftruncate( $fh, 0 );
		rewind( $fh );
		fwrite( $fh, wp_json_encode( $vivos ) );
		fflush( $fh );
		flock( $fh, LOCK_UN );
		fclose( $fh );
	}
	return true;
}

/**
 * Comprueba el tipo real de un fichero subido.
 */
function ms_tipo_real( $ruta ) {
	if ( ! class_exists( 'finfo' ) ) {
		return '';
	}
	$fi = new finfo( FILEINFO_MIME_TYPE );
	return (string) $fi->file( $ruta );
}

/**
 * Valida el zip de fotos: sin rutas raras, sin zips anidados, con tope de entradas y de imágenes.
 * Devuelve true o un mensaje de error.
 */
function ms_validar_zip( $ruta ) {
	if ( ! class_exists( 'ZipArchive' ) ) {
		return 'No se pudo comprobar el zip (falta ZipArchive en el servidor).';
	}
	$zip = new ZipArchive();
	if ( true !== $zip->open( $ruta ) ) {
		return 'El archivo no es un zip que se pueda abrir.';
	}
	$entradas = $zip->numFiles;
	$imagenes = 0;
	$suma     = 0;
	if ( $entradas > MS_MAX_ENTRADAS_ZIP ) {
		$zip->close();
		return 'El zip trae demasiados archivos (máximo ' . MS_MAX_ENTRADAS_ZIP . ').';
	}
	for ( $i = 0; $i < $entradas; $i++ ) {
		$stat = $zip->statIndex( $i );
		if ( ! $stat ) {
			continue;
		}
		$nombre = (string) $stat['name'];
		if ( preg_match( '#(^|/)\.\.(/|$)#', $nombre ) || preg_match( '#^/|^[a-zA-Z]:#', $nombre ) ) {
			$zip->close();
			return 'El zip contiene rutas no permitidas.';
		}
		if ( preg_match( '/\.(zip|rar|7z|tar|gz|bz2)$/i', $nombre ) ) {
			$zip->close();
			return 'El zip no puede contener otros comprimidos dentro.';
		}
		if ( preg_match( '/\.(jpe?g|png)$/i', $nombre ) ) {
			$imagenes++;
		}
		$suma += (int) $stat['size'];
	}
	$zip->close();
	if ( $imagenes > MS_MAX_IMAGENES_ZIP ) {
		return 'El zip trae más de ' . MS_MAX_IMAGENES_ZIP . ' imágenes.';
	}
	if ( $suma > MS_MAX_DESCOMPRIMIDO ) {
		return 'El zip se descomprime en demasiado espacio.';
	}
	return true;
}

/**
 * Mueve un fichero subido a su sitio definitivo, fuera de la carpeta pública.
 */
function ms_guardar_adjunto( $tmp, $destino, $ext ) {
	if ( ! wp_mkdir_p( dirname( $destino ) ) ) {
		return false;
	}
	if ( ! @move_uploaded_file( $tmp, $destino ) ) {
		// En pruebas por consola el fichero no viene de un POST real.
		if ( ! @rename( $tmp, $destino ) && ! @copy( $tmp, $destino ) ) {
			return false;
		}
	}
	@chmod( $destino, 0640 );
	return true;
}

/* -------------------------------------------------------------------------
 *  Enlaces de descarga, firmados y con caducidad
 *  Los adjuntos siguen fuera de la carpeta pública: solo se bajan con el
 *  enlace que viaja en el aviso, y solo mientras no caduque.
 * ---------------------------------------------------------------------- */

function ms_clave_descarga() {
	static $clave = null;
	if ( null !== $clave ) {
		return $clave;
	}
	$clave = '';
	if ( is_readable( MS_CLAVE_DESCARGA ) ) {
		$leida = trim( (string) file_get_contents( MS_CLAVE_DESCARGA ) );
		if ( strlen( $leida ) >= 32 ) {
			$clave = $leida;
		}
	}
	return $clave;
}

function ms_enlace_descarga( $id, $fichero, $etiqueta ) {
	$clave = ms_clave_descarga();
	if ( '' === $clave ) {
		return $etiqueta . ': ' . $fichero . ' (sin enlace: falta la clave de descarga en el servidor)';
	}
	$expira = time() + ( MS_DIAS_ENLACE * DAY_IN_SECONDS );
	$firma  = hash_hmac( 'sha256', $id . '|' . $fichero . '|' . $expira, $clave );
	$url    = MS_DESCARGA_URL . '?' . http_build_query( array(
		'id' => $id,
		'f'  => $fichero,
		'e'  => $expira,
		't'  => $firma,
	) );
	return $etiqueta . ': ' . $url;
}

/* -------------------------------------------------------------------------
 *  La ruta
 * ---------------------------------------------------------------------- */

add_action( 'rest_api_init', function () {
	register_rest_route( 'memory-signals/v1', '/contribucion', array(
		'methods'             => 'POST',
		'permission_callback' => '__return_true', // público, con límite propio por IP
		'callback'            => 'ms_recibir_contribucion',
	) );
} );

function ms_recibir_contribucion( WP_REST_Request $r ) {

	/* --- 1. Antispam: campo trampa y tiempo mínimo de relleno --- */
	$trampa = trim( (string) $r->get_param( 'web' ) );
	if ( '' !== $trampa ) {
		return ms_error( 'No se ha podido procesar el envío.', 400 );
	}
	$t0 = (int) $r->get_param( 't0' );
	if ( $t0 > 0 ) {
		$transcurrido = (int) round( microtime( true ) * 1000 ) - $t0;
		if ( $transcurrido < 3000 ) {
			return ms_error( 'El envío se ha hecho demasiado rápido. Revisa los datos y vuelve a intentarlo.', 429 );
		}
		if ( $transcurrido > 6 * 3600 * 1000 ) {
			return ms_error( 'La página llevaba mucho tiempo abierta. Recárgala y vuelve a enviar.', 400 );
		}
	}

	/* --- 2. Campos obligatorios --- */
	$objeto = trim( sanitize_text_field( (string) $r->get_param( 'objeto' ) ) );
	if ( mb_strlen( $objeto ) < 3 || mb_strlen( $objeto ) > 80 ) {
		return ms_error( 'El nombre del objeto debe tener entre 3 y 80 caracteres.', 400, 'objeto' );
	}

	$email = trim( (string) $r->get_param( 'email' ) );
	if ( ! is_email( $email ) ) {
		return ms_error( 'Esa dirección de correo no parece válida.', 400, 'email' );
	}

	/* --- 3. Consentimiento: las dos casillas, explícitas --- */
	$acepta_politica = in_array( (string) $r->get_param( 'acepta_privacidad' ), array( '1', 'true', 'on' ), true );
	$mayor_18        = in_array( (string) $r->get_param( 'mayor_de_edad' ), array( '1', 'true', 'on' ), true );
	if ( ! $acepta_politica || ! $mayor_18 ) {
		return ms_error( 'Hacen falta las dos casillas marcadas para poder enviar.', 400, 'consentimiento' );
	}

	/* --- 4. Límite por IP --- */
	$ip_hash = ms_ip_hash();
	if ( ! ms_limite( $ip_hash ) ) {
		return ms_error( 'Ya se ha enviado una propuesta desde esta conexión. Prueba más tarde.', 429 );
	}

	/* --- 5. Opcionales --- */
	$fuente = trim( (string) $r->get_param( 'fuente_url' ) );
	if ( '' !== $fuente ) {
		$fuente = esc_url_raw( $fuente, array( 'http', 'https' ) );
		if ( '' === $fuente ) {
			return ms_error( 'La dirección de la fuente tiene que empezar por http:// o https://.', 400, 'fuente_url' );
		}
	}
	$anio = (int) $r->get_param( 'anio' );
	if ( $anio && ( $anio < 1900 || $anio > 2100 ) ) {
		return ms_error( 'El año no parece correcto.', 400, 'anio' );
	}
	$agencia = sanitize_text_field( (string) $r->get_param( 'agencia' ) );
	$cuerpo  = sanitize_text_field( (string) $r->get_param( 'cuerpo' ) );
	$estado  = sanitize_text_field( (string) $r->get_param( 'estado_objeto' ) );

	$hitos = array();
	$raw   = $r->get_param( 'hitos' );
	if ( is_string( $raw ) ) {
		$raw = json_decode( $raw, true );
	}
	if ( is_array( $raw ) ) {
		$raw = array_slice( $raw, 0, 3 );
		foreach ( $raw as $h ) {
			if ( ! is_array( $h ) ) {
				continue;
			}
			$titulo = trim( sanitize_text_field( (string) ( $h['titulo'] ?? '' ) ) );
			$texto  = trim( sanitize_textarea_field( (string) ( $h['texto'] ?? '' ) ) );
			if ( '' === $titulo && '' === $texto ) {
				continue;
			}
			$hitos[] = array(
				'titulo' => mb_substr( $titulo, 0, 60 ),
				'texto'  => mb_substr( $texto, 0, 400 ),
				'fuente' => esc_url_raw( (string) ( $h['fuente'] ?? '' ), array( 'http', 'https' ) ),
			);
		}
	}

	$datos = array(
		'objeto'      => $objeto,
		'email'       => $email,
		'mision'      => trim( sanitize_text_field( (string) $r->get_param( 'mision' ) ) ),
		'agencia'     => $agencia,
		'cuerpo'      => $cuerpo,
		'anio'        => $anio ?: null,
		'lugar'       => trim( sanitize_text_field( (string) $r->get_param( 'lugar' ) ) ),
		'estado_objeto' => $estado,
		'resumen'     => trim( sanitize_textarea_field( (string) $r->get_param( 'resumen' ) ) ),
		'fuente_url'  => $fuente,
		'hitos'       => $hitos,
		'credito'     => trim( sanitize_text_field( (string) $r->get_param( 'credito' ) ) ) ?: 'Anónimo',
	);

	/* --- 6. Carpeta del envío --- */
	$ahora   = gmdate( 'Ymd-His' );
	$id      = $ahora . '-' . ms_slug( $objeto );
	$dir     = MS_CONTRIB_DIR . '/' . $id;
	$intentos = 1;
	while ( file_exists( $dir ) && $intentos < 20 ) {
		$id  = $ahora . '-' . ms_slug( $objeto ) . '-' . $intentos;
		$dir = MS_CONTRIB_DIR . '/' . $id;
		$intentos++;
	}
	if ( ! wp_mkdir_p( $dir ) ) {
		return ms_error( 'No se ha podido guardar la propuesta en el servidor. Avisa al equipo.', 500 );
	}
	@chmod( $dir, 0750 );

	/* --- 7. Adjuntos --- */
	$adjuntos = array( 'fotos' => null, 'documentos' => array() );
	$ficheros = $r->get_file_params();

	if ( ! empty( $ficheros['fotos']['tmp_name'] ) && is_uploaded_file( $ficheros['fotos']['tmp_name'] ) ) {
		$f = $ficheros['fotos'];
		if ( (int) $f['size'] > MS_MAX_FOTOS_BYTES ) {
			return ms_error( 'El zip de fotos pasa de 25 MB.', 413, 'fotos' );
		}
		$tipo = ms_tipo_real( $f['tmp_name'] );
		if ( ! in_array( $tipo, array( 'application/zip', 'application/x-zip-compressed', 'multipart/x-zip', 'application/octet-stream' ), true ) ) {
			return ms_error( 'El archivo de fotos tiene que ser un .zip.', 415, 'fotos' );
		}
		$veredicto = ms_validar_zip( $f['tmp_name'] );
		if ( true !== $veredicto ) {
			return ms_error( $veredicto, 415, 'fotos' );
		}
		$nombre = 'fotos-' . bin2hex( random_bytes( 6 ) ) . '.zip';
		if ( ! ms_guardar_adjunto( $f['tmp_name'], $dir . '/' . $nombre, 'zip' ) ) {
			return ms_error( 'No se ha podido guardar el zip de fotos.', 500, 'fotos' );
		}
		$adjuntos['fotos'] = $nombre;
	}

	$permitidos_doc = array(
		'application/pdf'                                     => 'pdf',
		'application/msword'                                   => 'doc',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx',
		'text/plain'                                           => 'txt',
		'text/markdown'                                        => 'md',
		'text/x-markdown'                                      => 'md',
		'application/octet-stream'                             => null, // se decide por la extensión comprobada
	);
	$docs = isset( $ficheros['documentos'] ) ? $ficheros['documentos'] : array();
	if ( ! empty( $docs['tmp_name'] ) && is_array( $docs['tmp_name'] ) ) {
		$cuantos = 0;
		foreach ( $docs['tmp_name'] as $i => $tmp ) {
			if ( empty( $tmp ) || ! is_uploaded_file( $tmp ) ) {
				continue;
			}
			$cuantos++;
			if ( $cuantos > MS_MAX_DOCS ) {
				return ms_error( 'Como mucho ' . MS_MAX_DOCS . ' documentos por envío.', 400, 'documentos' );
			}
			if ( (int) $docs['size'][ $i ] > MS_MAX_DOC_BYTES ) {
				return ms_error( 'Cada documento puede pesar como mucho 10 MB.', 413, 'documentos' );
			}
			$tipo = ms_tipo_real( $tmp );
			$ext  = $permitidos_doc[ $tipo ] ?? null;
			$orig = sanitize_file_name( (string) $docs['name'][ $i ] );
			$ext_orig = strtolower( pathinfo( $orig, PATHINFO_EXTENSION ) );
			if ( null === $ext ) {
				if ( in_array( $ext_orig, array( 'pdf', 'doc', 'docx', 'txt', 'md' ), true ) ) {
					$ext = $ext_orig;
				} else {
					return ms_error( 'Solo se admiten PDF, DOC, DOCX, TXT o MD.', 415, 'documentos' );
				}
			}
			if ( ! in_array( $ext_orig, array( 'pdf', 'doc', 'docx', 'txt', 'md' ), true ) ) {
				return ms_error( 'La extensión del documento no coincide con un formato admitido.', 415, 'documentos' );
			}
			$nombre = 'documento-' . bin2hex( random_bytes( 6 ) ) . '.' . $ext;
			if ( ! ms_guardar_adjunto( $tmp, $dir . '/' . $nombre, $ext ) ) {
				return ms_error( 'No se ha podido guardar un documento.', 500, 'documentos' );
			}
			$adjuntos['documentos'][] = array( 'guardado' => $nombre, 'original' => $orig );
		}
	}

	/* --- 8. envio.json --- */
	$envio = array(
		'id'             => $id,
		'recibido'       => gmdate( 'c' ),
		'estado'         => 'nuevo',
		'objeto'         => $datos['objeto'],
		'email'          => $datos['email'],
		'mision'         => $datos['mision'],
		'agencia'        => $datos['agencia'],
		'cuerpo'         => $datos['cuerpo'],
		'anio'           => $datos['anio'],
		'lugar'          => $datos['lugar'],
		'estado_objeto'  => $datos['estado_objeto'],
		'resumen'        => $datos['resumen'],
		'fuente_url'     => $datos['fuente_url'],
		'hitos'          => $datos['hitos'],
		'credito'        => $datos['credito'],
		'consentimiento' => array(
			'politica' => '2026-11-15',
			'mayor_18' => true,
			'fecha'    => gmdate( 'c' ),
			'ip_hash'  => $ip_hash,
		),
		'adjuntos'       => $adjuntos,
		'revision'       => array( 'quien' => null, 'cuando' => null, 'nota' => '' ),
	);
	$json = wp_json_encode( $envio, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES );
	if ( false === @file_put_contents( $dir . '/envio.json', $json ) ) {
		return ms_error( 'No se ha podido escribir la ficha del envío.', 500 );
	}
	@chmod( $dir . '/envio.json', 0640 );

	/* --- 9. Aviso por correo (solo el aviso: los adjuntos se quedan en el servidor) --- */
	$lineas   = array();
	$lineas[] = 'Nueva propuesta en Memory Signals. Nada se publica solo: queda en revisión.';
	$lineas[] = '';
	$lineas[] = 'Identificador: ' . $id;
	$lineas[] = 'Objeto: ' . $datos['objeto'];
	foreach ( array( 'mision' => 'Misión', 'agencia' => 'Agencia', 'cuerpo' => 'Cuerpo', 'lugar' => 'Lugar', 'estado_objeto' => 'Estado', 'credito' => 'Crédito' ) as $k => $etiqueta ) {
		if ( ! empty( $datos[ $k ] ) ) {
			$lineas[] = $etiqueta . ': ' . $datos[ $k ];
		}
	}
	if ( ! empty( $datos['anio'] ) ) {
		$lineas[] = 'Año: ' . $datos['anio'];
	}
	if ( ! empty( $datos['resumen'] ) ) {
		$lineas[] = '';
		$lineas[] = 'Resumen:';
		$lineas[] = $datos['resumen'];
	}
	if ( ! empty( $datos['fuente_url'] ) ) {
		$lineas[] = '';
		$lineas[] = 'Fuente: ' . $datos['fuente_url'];
	}
	if ( ! empty( $hitos ) ) {
		$lineas[] = '';
		$lineas[] = 'Hitos propuestos (' . count( $hitos ) . '):';
		foreach ( $hitos as $n => $h ) {
			$lineas[] = '  ' . ( $n + 1 ) . '. ' . $h['titulo'] . ' — ' . $h['texto'] . ( $h['fuente'] ? ' (' . $h['fuente'] . ')' : '' );
		}
	}
	$lineas[] = '';
	$lineas[] = '';
	if ( $adjuntos['fotos'] || $adjuntos['documentos'] ) {
		$lineas[] = 'Archivos que ha enviado (enlaces privados, caducan en ' . MS_DIAS_ENLACE . ' días):';
		if ( $adjuntos['fotos'] ) {
			$lineas[] = '  ' . ms_enlace_descarga( $id, $adjuntos['fotos'], 'zip de fotos' );
		}
		foreach ( $adjuntos['documentos'] as $doc ) {
			$etiqueta = 'documento' . ( $doc['original'] !== $doc['guardado'] ? ' «' . $doc['original'] . '»' : '' );
			$lineas[] = '  ' . ms_enlace_descarga( $id, $doc['guardado'], $etiqueta );
		}
		$lineas[] = 'Los enlaces se pueden reenviar al equipo, pero no publicar: dan acceso al archivo.';
	} else {
		$lineas[] = 'Adjuntos: ninguno.';
	}
	$lineas[] = '';
	$lineas[] = 'Correo de quien envía (para responder): ' . $datos['email'];
	$lineas[] = 'Ruta en el servidor: ' . $dir;

	$enviado = wp_mail(
		MS_AVISO_A,
		'[Memory Signals] Nueva propuesta: ' . $datos['objeto'],
		implode( "\n", $lineas ),
		array( 'Reply-To: ' . $datos['email'] )
	);

	/* --- 10. Registro mínimo, sin datos personales --- */
	@file_put_contents(
		MS_CONTRIB_DIR . '/.registro.log',
		gmdate( 'c' ) . ' ' . $id . ' ' . $ip_hash . ' aviso=' . ( $enviado ? 'si' : 'no' ) . "\n",
		FILE_APPEND
	);

	return ms_responder( array(
		'recibido' => true,
		'id'       => $id,
		'objeto'   => $datos['objeto'],
		'aviso'    => (bool) $enviado,
		'mensaje'  => 'Propuesta recibida. El equipo la revisará y te escribirá a ' . $datos['email'] . '.',
	) );
}
