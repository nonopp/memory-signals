/* Memory Signals — escena: cielo estrellado, aproximación al destino y superficie con destellos.
   Sin dependencias. Respeta prefers-reduced-motion. */
(function () {
  'use strict';

  var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- cielo de fondo ---------- */
  function cielo() {
    var c = document.getElementById('cielo');
    if (!c) return;
    var ctx = c.getContext('2d');
    var estrellas = [];
    var ancho = 0, alto = 0, t = 0;

    function medir() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      ancho = c.clientWidth; alto = c.clientHeight;
      c.width = ancho * dpr; c.height = alto * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.round((ancho * alto) / 9000);
      estrellas = [];
      for (var i = 0; i < n; i++) {
        estrellas.push({
          x: Math.random() * ancho,
          y: Math.random() * alto,
          r: Math.random() * 1.5 + 0.25,
          a: Math.random() * 0.6 + 0.25,
          v: Math.random() * 0.4 + 0.08
        });
      }
    }

    function pinta() {
      ctx.clearRect(0, 0, ancho, alto);
      for (var i = 0; i < estrellas.length; i++) {
        var e = estrellas[i];
        var alfa = quieto ? e.a : e.a * (0.72 + 0.28 * Math.sin(t * e.v + i));
        ctx.globalAlpha = alfa;
        ctx.fillStyle = i % 11 === 0 ? '#9fd6ff' : '#ffffff';
        ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      t += 0.016;
      requestAnimationFrame(pinta);
    }

    medir();
    window.addEventListener('resize', medir);
    pinta();
  }

  /* ---------- ventana de crucero: el destino crece ---------- */
  var cruceroRAF = null;
  function crucero(color, tipo) {
    var c = document.getElementById('ventana');
    if (!c) return;
    var ctx = c.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = c.clientWidth, H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var p = 0;

    function dibuja() {
      ctx.clearRect(0, 0, W, H);
      // estrellas en fuga
      for (var i = 0; i < 90; i++) {
        var sx = ((i * 97) % W);
        var sy = ((i * 53) % H);
        var vel = 0.4 + (i % 7) * 0.3;
        var yy = (sy + p * 220 * vel) % H;
        ctx.globalAlpha = 0.25 + (i % 5) * 0.12;
        ctx.fillStyle = '#cfe4ff';
        ctx.fillRect(sx, yy, 1.6, 1.6);
      }
      ctx.globalAlpha = 1;
      // el destino
      var radio = 26 + p * Math.min(W, H) * 0.55;
      var cx = W * 0.5, cy = H * 0.56;
      var gr = ctx.createRadialGradient(cx - radio * 0.35, cy - radio * 0.35, radio * 0.1, cx, cy, radio);
      gr.addColorStop(0, '#ffffff');
      gr.addColorStop(0.35, color);
      gr.addColorStop(1, 'rgba(0,0,0,0.92)');
      ctx.fillStyle = gr;
      ctx.beginPath(); ctx.arc(cx, cy, radio, 0, 6.2832); ctx.fill();
      // halo
      ctx.globalAlpha = 0.28;
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx, cy, radio + 6, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha = 1;
      p = Math.min(1, p + 0.0045);
      cruceroRAF = requestAnimationFrame(dibuja);
    }
    if (cruceroRAF) cancelAnimationFrame(cruceroRAF);
    dibuja();
  }

  /* ---------- superficie con destellos ---------- */
  var superficieRAF = null;
  function superficie(color, puntos) {
    var c = document.getElementById('superficie');
    if (!c) return;
    var ctx = c.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = c.clientWidth, H = c.clientHeight;
    c.width = W * dpr; c.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var t = 0;
    var horizonte = H * 0.42;

    function dibuja() {
      ctx.clearRect(0, 0, W, H);

      // 1. cielo sobre la superficie
      var cielo = ctx.createLinearGradient(0, 0, 0, horizonte);
      cielo.addColorStop(0, '#02040a');
      cielo.addColorStop(1, 'rgba(10,14,26,1)');
      ctx.fillStyle = cielo; ctx.fillRect(0, 0, W, horizonte);

      // 2. el suelo del cuerpo: gradiente vertical desde el horizonte
      var suelo = ctx.createLinearGradient(0, horizonte, 0, H);
      suelo.addColorStop(0, color);
      suelo.addColorStop(0.35, 'rgba(120,78,54,1)');
      suelo.addColorStop(1, 'rgba(18,14,20,1)');
      ctx.fillStyle = suelo;
      ctx.beginPath();
      ctx.moveTo(0, H);
      ctx.lineTo(0, horizonte);
      // curva suave del limbo planetario
      ctx.quadraticCurveTo(W * 0.5, horizonte - H * 0.16, W, horizonte);
      ctx.lineTo(W, H);
      ctx.closePath();
      ctx.fill();

      // 3. línea del horizonte iluminada
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(0, horizonte);
      ctx.quadraticCurveTo(W * 0.5, horizonte - H * 0.16, W, horizonte);
      ctx.stroke();

      // 4. cráteres en el suelo
      for (var i = 0; i < 22; i++) {
        var px = ((i * 137) % W);
        var py = horizonte + 14 + ((i * 61) % Math.max(20, H - horizonte - 10));
        var r = 8 + (i % 7) * 6;
        ctx.globalAlpha = 0.13 + (i % 3) * 0.04;
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.ellipse(px, py, r, r * 0.34, 0, 0, 6.2832); ctx.fill();
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.ellipse(px, py - r * 0.2, r * 0.8, r * 0.22, 0, 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // 5. destellos
      for (var k = 0; k < puntos.length; k++) {
        var q = puntos[k];
        var pulso = quieto ? 1 : 0.72 + 0.28 * Math.sin(t * 2 + k);
        var gx = q.x * W, gy = q.y * H;
        var grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, 54 * pulso);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.28, q.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(gx, gy, 54 * pulso, 0, 6.2832); ctx.fill();
      }

      t += 0.02;
      superficieRAF = requestAnimationFrame(dibuja);
    }
    if (superficieRAF) cancelAnimationFrame(superficieRAF);
    dibuja();
  }

  function parar() {
    if (cruceroRAF) { cancelAnimationFrame(cruceroRAF); cruceroRAF = null; }
    if (superficieRAF) { cancelAnimationFrame(superficieRAF); superficieRAF = null; }
  }

  window.Escena = { cielo: cielo, crucero: crucero, superficie: superficie, parar: parar, quieto: quieto };
})();
