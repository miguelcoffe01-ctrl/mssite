/* Fundo animado: rede de nós com pacotes de dados + interação com o cursor.
   Leve: limite de nós, DPR máx. 1.5, pausa com a aba oculta e respeita "reduzir movimento". */
(function () {
  var cv = document.getElementById("net");
  if (!cv) return;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cx = cv.getContext("2d");
  var W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  var nodes = [], packets = [], mx = -999, my = -999, last = 0, raf = 0, nextPkt = 0;
  var LINK = 150, RED = "239,43,63", SOFT = "255,138,148";

  function size() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var max = W < 700 ? 34 : 72;
    var n = Math.max(24, Math.min(max, Math.round(W * H / 20000)));
    while (nodes.length < n) nodes.push({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 22, vy: (Math.random() - 0.5) * 22,
      r: Math.random() * 1.2 + 1
    });
    nodes.length = n;
  }

  function spawn() {
    if (packets.length >= 7) return;
    for (var t = 0; t < 12; t++) {
      var a = nodes[(Math.random() * nodes.length) | 0], b = nodes[(Math.random() * nodes.length) | 0];
      if (a === b) continue;
      var dx = a.x - b.x, dy = a.y - b.y;
      if (dx * dx + dy * dy < LINK * LINK) { packets.push({ a: a, b: b, t: 0, s: 0.5 + Math.random() * 0.6 }); return; }
    }
  }

  function frame(ts) {
    var dt = Math.min((ts - last) / 1000 || 0.016, 0.05); last = ts;
    cx.clearRect(0, 0, W, H);
    var i, j, a, b, dx, dy, d;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      if (!reduce) {
        a.x += a.vx * dt; a.y += a.vy * dt;
        if (a.x < -20) a.x = W + 20; else if (a.x > W + 20) a.x = -20;
        if (a.y < -20) a.y = H + 20; else if (a.y > H + 20) a.y = -20;
        dx = a.x - mx; dy = a.y - my; d = dx * dx + dy * dy;
        if (d < 14400 && d > 1) { d = Math.sqrt(d); a.x += dx / d * 26 * dt; a.y += dy / d * 26 * dt; }
      }
    }
    cx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
        if (d < LINK * LINK) {
          cx.strokeStyle = "rgba(" + RED + "," + ((1 - Math.sqrt(d) / LINK) * 0.28).toFixed(3) + ")";
          cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y); cx.stroke();
        }
      }
      dx = a.x - mx; dy = a.y - my; d = dx * dx + dy * dy;
      if (d < 28900) {
        cx.strokeStyle = "rgba(" + SOFT + "," + ((1 - Math.sqrt(d) / 170) * 0.5).toFixed(3) + ")";
        cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(mx, my); cx.stroke();
      }
      cx.fillStyle = "rgba(" + RED + ",.7)";
      cx.beginPath(); cx.arc(a.x, a.y, a.r, 0, 6.2832); cx.fill();
    }
    if (!reduce) {
      nextPkt -= dt; if (nextPkt <= 0) { spawn(); nextPkt = 0.35 + Math.random() * 0.6; }
      for (i = packets.length - 1; i >= 0; i--) {
        var p = packets[i]; p.t += p.s * dt * 1.6;
        dx = p.a.x - p.b.x; dy = p.a.y - p.b.y;
        if (p.t >= 1 || dx * dx + dy * dy > LINK * LINK * 1.2) { packets.splice(i, 1); continue; }
        var x = p.a.x + (p.b.x - p.a.x) * p.t, y = p.a.y + (p.b.y - p.a.y) * p.t;
        cx.fillStyle = "rgba(" + SOFT + ",.16)"; cx.beginPath(); cx.arc(x, y, 6, 0, 6.2832); cx.fill();
        cx.fillStyle = "rgba(255,200,205,.95)"; cx.beginPath(); cx.arc(x, y, 1.8, 0, 6.2832); cx.fill();
      }
    }
    if (!reduce) raf = requestAnimationFrame(frame);
  }

  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function stop() { if (raf) { cancelAnimationFrame(raf); raf = 0; } }

  size();
  window.addEventListener("resize", size);
  window.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
  window.addEventListener("pointerleave", function () { mx = my = -999; });
  document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (!reduce) start(); });
  if (reduce) frame(performance.now()); else start();
})();
