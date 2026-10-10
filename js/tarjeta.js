/**
 * Crucigramas del Bosque — tarjeta para compartir (1080×1350). Basada en la de Word Wizard: el bosque, el logo,
 * el tablero en silueta (sin letras), los datos de la partida, Silabo y Doña Lenta.
 *
 *   CBTarjeta.crear(datos) → Promise<Blob png>
 */
(function () {
  'use strict';
  const W = 1080, H = 1350;
  const C = { noche: '#1c2f38', noche2: '#142128', pino: '#2c4d58', linea: '#16262c', oro: '#f2c66d', oroOsc: '#c49a42',
    menta: '#dfebd6', bruma: '#bbd0b9', salvia: '#67948f', texto: '#eef4ea', suave: '#b5c8bd', coral: '#e8907a' };

  /** Generador pseudoaleatorio fijo: la tarjeta sale siempre igual para los mismos datos. */
  function azar(semilla) { let a = semilla >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function imagenSvg(svg) {
    return new Promise((ok, mal) => {
      const img = new Image();
      const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      img.onload = () => { URL.revokeObjectURL(url); ok(img); };
      img.onerror = (e) => { URL.revokeObjectURL(url); mal(e); };
      img.src = url;
    });
  }

  function silabo(pose) {
    if (!window.Silabo) return null;
    const o = Object.assign({}, window.Silabo.OFICIAL, pose === 'happy' ? { anguloVarita: -78, rotSombrero: -12 } : {});
    let svg = window.Silabo.mago(o);
    svg = svg.replace('<svg ', '<svg width="660" height="900" ');
    return imagenSvg(svg);
  }

  function redondeado(x, y, w, h, r) {
    return (ctx) => { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); };
  }

  /** Pino de tonos planos con contorno, como los del bosque del juego. */
  function pino(ctx, x, base, alto, ancho, color, sombra) {
    const pisos = 4;
    ctx.lineJoin = 'round';
    for (let i = 0; i < pisos; i++) {
      const y0 = base - alto * (i / pisos) * .82, y1 = y0 - alto * .42, a = ancho * (1 - i / (pisos + 1.2));
      ctx.beginPath(); ctx.moveTo(x - a / 2, y0); ctx.lineTo(x, y1); ctx.lineTo(x + a / 2, y0); ctx.closePath();
      ctx.fillStyle = color; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y1); ctx.lineTo(x + a / 2, y0); ctx.lineTo(x + a * .08, y0); ctx.closePath();
      ctx.fillStyle = sombra; ctx.fill();
    }
  }

  function fondo(ctx, rnd) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#2b4a55'); g.addColorStop(.45, C.noche); g.addColorStop(1, C.noche2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // estrellas
    for (let i = 0; i < 70; i++) {
      const x = rnd() * W, y = rnd() * H * .55, r = .8 + rnd() * 2.2;
      ctx.globalAlpha = .25 + rnd() * .6; ctx.fillStyle = '#fff6da';
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    // luna con halo
    const lx = 900, ly = 170;
    const halo = ctx.createRadialGradient(lx, ly, 60, lx, ly, 260);
    halo.addColorStop(0, 'rgba(242,232,196,.28)'); halo.addColorStop(1, 'rgba(242,232,196,0)');
    ctx.fillStyle = halo; ctx.fillRect(lx - 260, ly - 260, 520, 520);
    ctx.fillStyle = '#e9e2c6'; ctx.strokeStyle = C.linea; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(lx, ly, 86, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#d3caa8';
    for (const [dx, dy, r] of [[-30, -18, 16], [24, 20, 12], [-6, 40, 9], [34, -34, 7]]) { ctx.beginPath(); ctx.arc(lx + dx, ly + dy, r, 0, Math.PI * 2); ctx.fill(); }
    // tres filas de pinos, de lejos (claros y con niebla) a cerca (oscuros)
    const filas = [
      { base: H * .80, alto: [170, 260], ancho: 120, n: 14, color: '#36565c', sombra: '#2d4b52' },
      { base: H * .90, alto: [230, 340], ancho: 160, n: 10, color: '#24414a', sombra: '#1d363e' },
      { base: H + 20, alto: [300, 440], ancho: 210, n: 7, color: '#182d35', sombra: '#13252c' },
    ];
    filas.forEach((f, k) => {
      for (let i = 0; i < f.n; i++) {
        const x = (i + rnd() * .6) * (W / (f.n - 1)) - 40, alto = f.alto[0] + rnd() * (f.alto[1] - f.alto[0]);
        pino(ctx, x, f.base, alto, f.ancho * (.8 + rnd() * .4), f.color, f.sombra);
      }
      if (k < 2) {
        const n = ctx.createLinearGradient(0, f.base - 120, 0, f.base + 40);
        n.addColorStop(0, 'rgba(187,208,185,0)'); n.addColorStop(1, 'rgba(187,208,185,.16)');
        ctx.fillStyle = n; ctx.fillRect(0, f.base - 120, W, 160);
      }
    });
  }

  /** Texto con contorno grueso y sombra dura (como el WIZARD del logo). */
  function titulo(ctx, txt, x, y, px, color) {
    ctx.font = `700 ${px}px Fredoka, 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
    ctx.lineWidth = px * .16; ctx.strokeStyle = C.linea;
    ctx.fillStyle = C.linea; ctx.strokeText(txt, x, y + px * .1); ctx.fillText(txt, x, y + px * .1);
    ctx.strokeText(txt, x, y); ctx.fillStyle = color; ctx.fillText(txt, x, y);
  }

  function texto(ctx, txt, x, y, px, color, peso, alin) {
    ctx.font = `${peso || 800} ${px}px Nunito, 'Segoe UI', sans-serif`;
    ctx.textAlign = alin || 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = color; ctx.fillText(txt, x, y);
  }

  /** Ajusta el tamaño para que un texto entre en un ancho. */
  function encajar(ctx, txt, px, max, fam) {
    let p = px;
    do { ctx.font = `700 ${p}px ${fam || 'Fredoka'}`; if (ctx.measureText(txt).width <= max) break; p -= 2; } while (p > 18);
    return p;
  }

  /** Logo: CRUCIGRAMAS en piedritas inclinadas y "del Bosque" en oro. */
  function logoCB(ctx) {
    const letras = 'CRUCIGRAMAS'.split(''), lado = 74, gap = 6, ancho = letras.length * lado + (letras.length - 1) * gap, x0 = (W - ancho) / 2;
    const giro = [-4, 3, -2, 4, -3, 2, -4, 3, -2, 4, -3];
    letras.forEach((l, i) => {
      ctx.save(); ctx.translate(x0 + i * (lado + gap) + lado / 2, 112); ctx.rotate(giro[i] * Math.PI / 180);
      redondeado(-lado / 2, -lado * .6 + 6, lado, lado * 1.2, 18)(ctx); ctx.fillStyle = '#b7cdbb'; ctx.fill();
      redondeado(-lado / 2, -lado * .6, lado, lado * 1.2, 18)(ctx); ctx.fillStyle = '#dfebd6'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = C.linea; ctx.stroke();
      ctx.font = '700 52px Fredoka, sans-serif'; ctx.fillStyle = C.noche; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(l, 0, 4);
      ctx.restore();
    });
    ctx.textBaseline = 'alphabetic';
    titulo(ctx, 'del Bosque', W / 2, 290, 104, C.oro);
  }

  /**
   * d: { numero, tema, celdas: [[bool]], seg, ayudas, racha, palabras, textos: { crucigrama, tiempo, pistas, racha, reto, url } }
   * El tablero va en silueta (sin letras): no hay spoiler para el que todavía no jugó.
   */
  async function crear(d) {
    await Promise.all(['700 60px Fredoka', '800 30px Nunito', '700 30px Nunito'].map((f) => document.fonts && document.fonts.load(f).catch(() => {})));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    fondo(ctx, azar(d.numero * 7919 + d.seg));
    const t = d.textos;
    logoCB(ctx);
    const imgMago = await Promise.resolve().then(() => silabo('happy')).catch(() => null);
    const imgLenta = window.CBPersonajes ? await imagenSvg(CBPersonajes.donaLenta({ pose: 'habla' }).replace('<svg ', '<svg width="384" height="280" ')).catch(() => null) : null;

    // panel de madera
    const px = 90, py = 352, pw = W - 180, ph = 640;
    ctx.save(); ctx.shadowColor = 'rgba(8,16,20,.55)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 18;
    redondeado(px, py + 12, pw, ph, 44)(ctx); ctx.fillStyle = '#5c4330'; ctx.fill(); ctx.restore();
    redondeado(px, py, pw, ph, 44)(ctx); ctx.fillStyle = '#8a6440'; ctx.fill(); ctx.lineWidth = 8; ctx.strokeStyle = C.linea; ctx.stroke();
    redondeado(px + 16, py + 16, pw - 32, ph - 32, 32)(ctx); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,243,217,.22)'; ctx.stroke();
    const cx = W / 2;
    // cinta con el número
    const ante = `${t.crucigrama.toUpperCase()} #${d.numero}`;
    ctx.font = '700 40px Fredoka, sans-serif';
    const aw = ctx.measureText(ante).width + 90;
    redondeado(cx - aw / 2, py - 34, aw, 72, 36)(ctx); ctx.fillStyle = C.oro; ctx.fill(); ctx.lineWidth = 7; ctx.strokeStyle = C.linea; ctx.stroke();
    ctx.fillStyle = '#3a2a0c'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(ante, cx, py + 3); ctx.textBaseline = 'alphabetic';
    // tema
    const pt = encajar(ctx, d.tema, 72, pw - 100);
    ctx.font = `700 ${pt}px Fredoka, sans-serif`; ctx.fillStyle = '#5c4330'; ctx.textAlign = 'center'; ctx.fillText(d.tema, cx, py + 116);
    ctx.fillStyle = '#fff3d9'; ctx.fillText(d.tema, cx, py + 110);
    // tablero en silueta: todas las casillas resueltas, sin letras
    const filas = d.celdas.length, cols = d.celdas[0].length, cajaW = 420, cajaH = 330;
    const lado = Math.floor(Math.min((cajaW - (cols - 1) * 5) / cols, (cajaH - (filas - 1) * 5) / filas));
    const bw = cols * lado + (cols - 1) * 5, bh = filas * lado + (filas - 1) * 5, bx = cx - bw / 2, by = py + 150 + (cajaH - bh) / 2;
    d.celdas.forEach((f, y) => f.forEach((v, x) => {
      if (!v) return;
      const X = bx + x * (lado + 5), Y = by + y * (lado + 5);
      redondeado(X, Y + 3, lado, lado, lado * .24)(ctx); ctx.fillStyle = '#9fbf95'; ctx.fill();
      redondeado(X, Y, lado, lado, lado * .24)(ctx); ctx.fillStyle = '#c9e3bf'; ctx.fill(); ctx.lineWidth = 3.5; ctx.strokeStyle = C.linea; ctx.stroke();
    }));
    // datos
    fichas(ctx, [[mmss(d.seg), t.tiempo], [String(d.ayudas), t.pistas], [`${d.racha} 🔥`, t.racha]], py + 510, pw);

    // Silabo, Doña Lenta y el globo de desafío
    if (imgMago) ctx.drawImage(imgMago, 40, H - 360, 250, 341);
    if (imgLenta) ctx.drawImage(imgLenta, W - 300, H - 200, 250, 182);
    const gx = 300, gy = H - 330, gw = 470, gh = 130;
    ctx.save(); ctx.shadowColor = 'rgba(8,16,20,.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8;
    redondeado(gx, gy, gw, gh, 40)(ctx); ctx.fillStyle = C.menta; ctx.fill(); ctx.restore();
    ctx.beginPath(); ctx.moveTo(gx + 10, gy + gh - 54); ctx.lineTo(gx - 34, gy + gh - 8); ctx.lineTo(gx + 40, gy + gh - 28); ctx.closePath(); ctx.fillStyle = C.menta; ctx.fill();
    redondeado(gx, gy, gw, gh, 40)(ctx); ctx.lineWidth = 7; ctx.strokeStyle = C.linea; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gx + 6, gy + gh - 56); ctx.lineTo(gx - 34, gy + gh - 8); ctx.lineTo(gx + 44, gy + gh - 25); ctx.stroke();
    redondeado(gx + 3, gy + 3, gw - 6, gh - 6, 37)(ctx); ctx.fillStyle = C.menta; ctx.fill();
    const pr = encajar(ctx, t.reto, 54, gw - 60);
    ctx.font = `700 ${pr}px Fredoka, sans-serif`; ctx.fillStyle = C.noche; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t.reto, gx + gw / 2, gy + gh / 2 + 2); ctx.textBaseline = 'alphabetic';
    texto(ctx, t.url, W / 2, H - 46, 32, C.bruma, 800);
    return new Promise((ok, mal) => cv.toBlob((b) => (b ? ok(b) : mal(new Error('sin imagen'))), 'image/png'));
  }
  const mmss = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /** Tres fichas de dato (valor grande, etiqueta chica) en fila. */
  function fichas(ctx, datos, y, pw) {
    const n = datos.length, gap = 26, w = (pw - 120 - gap * (n - 1)) / n, x0 = (W - pw) / 2 + 60;
    datos.forEach(([v, l], i) => {
      const x = x0 + i * (w + gap);
      redondeado(x, y, w, 96, 22)(ctx); ctx.fillStyle = 'rgba(223,235,214,.10)'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(223,235,214,.22)'; ctx.stroke();
      ctx.font = '700 44px Fredoka, sans-serif'; ctx.fillStyle = C.texto; ctx.textAlign = 'center'; ctx.fillText(v, x + w / 2, y + 50);
      const pl = encajar(ctx, l.toUpperCase(), 22, w - 16, 'Nunito');
      ctx.font = `800 ${pl}px Nunito, sans-serif`; ctx.fillStyle = C.suave; ctx.fillText(l.toUpperCase(), x + w / 2, y + 80);
    });
  }

  window.CBTarjeta = { crear };
})();
