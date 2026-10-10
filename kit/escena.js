/**
 * Word Wizard — el mundo de fondo, dibujado en SVG con el mismo trazo que Silabo
 * (tonos planos, contorno de color, sin degradados). Se genera para el tamaño de la
 * pantalla, en capas con parallax: cielo, lejos, medio (atrás de las luciérnagas) y cerca.
 * Cada lugar de la Torre tiene su paleta y sus "árboles": pinos, cristales, pilas de libros,
 * pinos nevados o nubes. Los árboles se mecen y se sacuden si tocás cerca.
 */
(function () {
  'use strict';
  const L = '#16262c';
  const QUIETO = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  const LUGARES = {
    bosque: {
      cielo: ['#203b45', '#26444e', '#2d4e57', '#355a61', '#40666b'], astro: 'luna', estrellas: 60, nubeCol: '#4b7270', nubeSh: '#3f6362',
      montes: '#4a6f6d', montesSh: '#426463', lejos: '#56807b', niebla: '#a7c2b4',
      medio: '#3a6266', medioSh: '#30555a', cerca: '#20404a', cercaSh: '#19343c',
      suelo: '#1b363e', sueloLuz: '#24454c', tronco: '#3a2f2b', arbol: 'pino', torre: true, buho: true,
    },
    cueva: {
      cielo: ['#1d1830', '#231c3a', '#2a2245', '#322850', '#3b2f5c'], astro: null, estrellas: 0,
      montes: '#3f3366', montesSh: '#372c5a', lejos: '#5b4a92', niebla: '#9d8fd0',
      medio: '#7a66c9', medioSh: '#6352ad', cerca: '#2d2449', cercaSh: '#241d3c',
      suelo: '#221b38', sueloLuz: '#2d2449', tronco: '#2d2449', arbol: 'cristal', estalactitas: true,
    },
    biblioteca: {
      cielo: ['#3a2a2a', '#45302b', '#55392e', '#6a4631', '#7f5636'], astro: 'luna', estrellas: 30,
      montes: '#5a3f2f', montesSh: '#4e3628', lejos: '#6e4d36', niebla: '#d9b98a',
      medio: '#8a5a3a', medioSh: '#744a30', cerca: '#3a2620', cercaSh: '#2e1e19',
      suelo: '#2e1f1a', sueloLuz: '#3d2a22', tronco: '#3a2620', arbol: 'libros', librosVolando: true,
    },
    cumbre: {
      cielo: ['#5d7f99', '#6c8da6', '#7d9bb2', '#90abbf', '#a6bccb'], astro: 'luna', estrellas: 25,
      montes: '#9fb8c6', montesSh: '#8eaab9', lejos: '#7d99a8', niebla: '#eef4f7',
      medio: '#4f6f7d', medioSh: '#43606d', cerca: '#2c4652', cercaSh: '#233a45',
      suelo: '#e4edf2', sueloLuz: '#f4f8fa', tronco: '#3a3533', arbol: 'pinoNieve', nieve: true,
    },
    cielo: {
      cielo: ['#7d6aa6', '#9b7fb2', '#c493b0', '#e8a99a', '#f5c79a'], astro: 'sol', estrellas: 12,
      montes: '#f2d7c2', montesSh: '#e4c1aa', lejos: '#f6e2d2', niebla: '#fff1e2',
      medio: '#fbefe4', medioSh: '#ecd6c8', cerca: '#fff7ef', cercaSh: '#f0ddd0',
      suelo: '#fff7ef', sueloLuz: '#ffffff', tronco: '#c79a7a', arbol: 'nube', islas: true,
    },
  };
  const LIBROS = ['#c4553f', '#2f7f7a', '#d9a441', '#5b3f6e', '#34507a', '#8f2f4a', '#4f7a3a', '#e8907a'];

  // ---------------------------------------------------------------- utilidades
  function azarCon(semilla) {
    let a = semilla >>> 0;
    return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const n1 = (v) => Math.round(v * 10) / 10;
  const P = (d, fill, sw, extra) => `<path d="${d}" fill="${fill}"${sw ? ` stroke="${L}" stroke-width="${sw}" stroke-linejoin="round" stroke-linecap="round"` : ''}${extra ? ' ' + extra : ''}/>`;
  function estrella(cx, cy, r) {
    let d = '';
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r; d += (i ? 'L' : 'M') + n1(cx + Math.cos(a) * rr) + ' ' + n1(cy + Math.sin(a) * rr); }
    return d + 'Z';
  }

  // ---------------------------------------------------------------- formas
  function pino(x, y, h, w, c, sh, sw, nieve, rnd) {
    const tr = h * .1, ch = h - tr, n = h > 120 ? 4 : 3, paso = ch / (n + .7);
    let cuerpo = '', sombra = '', blanco = '';
    for (let i = 0; i < n; i++) {
      const tb = y - tr - i * paso, tw = w * (1 - i * .2) / 2 * (.92 + rnd() * .16);
      const apex = i === n - 1 ? y - h : tb - paso * 1.7, th = tb - apex;
      const d = `M${n1(x - tw)} ${n1(tb)} Q${n1(x - tw * .3)} ${n1(tb - th * .5)} ${n1(x)} ${n1(apex)} Q${n1(x + tw * .3)} ${n1(tb - th * .5)} ${n1(x + tw)} ${n1(tb)} Q${n1(x + tw * .3)} ${n1(tb - th * .2)} ${n1(x)} ${n1(tb - th * .12)} Q${n1(x - tw * .3)} ${n1(tb - th * .2)} ${n1(x - tw)} ${n1(tb)}Z`;
      cuerpo += d;
      sombra += `M${n1(x)} ${n1(apex)} Q${n1(x + tw * .3)} ${n1(tb - th * .5)} ${n1(x + tw)} ${n1(tb)} Q${n1(x + tw * .3)} ${n1(tb - th * .2)} ${n1(x)} ${n1(tb - th * .12)}Z`;
      if (nieve) { const k = th * .32; blanco += `M${n1(x - tw * .42)} ${n1(apex + k * 1.25)} Q${n1(x - tw * .15)} ${n1(apex + k * .3)} ${n1(x)} ${n1(apex + 1)} Q${n1(x + tw * .15)} ${n1(apex + k * .3)} ${n1(x + tw * .42)} ${n1(apex + k * 1.25)} Q${n1(x + tw * .2)} ${n1(apex + k * .9)} ${n1(x + tw * .05)} ${n1(apex + k * 1.3)} Q${n1(x - tw * .15)} ${n1(apex + k * .85)} ${n1(x - tw * .42)} ${n1(apex + k * 1.25)}Z`; }
    }
    const tronco = `M${n1(x - w * .06)} ${n1(y - tr - 4)} L${n1(x + w * .06)} ${n1(y - tr - 4)} L${n1(x + w * .07)} ${n1(y)} L${n1(x - w * .07)} ${n1(y)}Z`;
    return (sw ? P(tronco, LUG.tronco, sw) + P(cuerpo, c, sw) : P(tronco, LUG.tronco) + P(cuerpo, c)) + P(sombra, sh) + (blanco ? P(blanco, '#f4f8fa') : '');
  }

  function cristal(x, y, h, w, c, sh, sw, rnd) {
    const uno = (cx, hh, ww, rot) => {
      const d = `M${n1(cx - ww / 2)} ${n1(y)} L${n1(cx - ww / 2)} ${n1(y - hh * .72)} L${n1(cx)} ${n1(y - hh)} L${n1(cx + ww / 2)} ${n1(y - hh * .72)} L${n1(cx + ww / 2)} ${n1(y)}Z`;
      const s = `M${n1(cx)} ${n1(y - hh)} L${n1(cx + ww / 2)} ${n1(y - hh * .72)} L${n1(cx + ww / 2)} ${n1(y)} L${n1(cx)} ${n1(y)}Z`;
      const brillo = `M${n1(cx - ww * .3)} ${n1(y - hh * .2)} L${n1(cx - ww * .3)} ${n1(y - hh * .66)}`;
      return `<g transform="rotate(${rot} ${n1(cx)} ${n1(y)})">${P(d, c, sw)}${P(s, sh)}<path d="${brillo}" stroke="#ffffff" stroke-opacity=".45" stroke-width="${Math.max(1.5, ww * .08)}" stroke-linecap="round"/></g>`;
    };
    return `<circle cx="${n1(x)}" cy="${n1(y - h * .5)}" r="${n1(h * .55)}" fill="${c}" opacity=".12"/>` +
      uno(x - w * .32, h * .55, w * .34, -18 - rnd() * 8) + uno(x + w * .3, h * .6, w * .32, 16 + rnd() * 8) + uno(x, h, w * .42, (rnd() - .5) * 6);
  }

  function libros(x, y, h, w, c, sh, sw, rnd) {
    let out = '', yy = y, i = 0;
    while (y - yy < h) {
      const bh = 7 + rnd() * 9, bw = w * (.75 + rnd() * .3), dx = (rnd() - .5) * w * .18, col = LIBROS[Math.floor(rnd() * LIBROS.length)];
      const x0 = x - bw / 2 + dx;
      out += `<rect x="${n1(x0)}" y="${n1(yy - bh)}" width="${n1(bw)}" height="${n1(bh)}" rx="2" fill="${col}"${sw ? ` stroke="${L}" stroke-width="${sw}"` : ''}/>`;
      out += `<rect x="${n1(x0 + bw * .7)}" y="${n1(yy - bh)}" width="${n1(bw * .3)}" height="${n1(bh)}" fill="${L}" opacity=".18"/>`;
      if (bh > 10) out += `<path d="M${n1(x0 + 4)} ${n1(yy - bh / 2)} H${n1(x0 + bw * .55)}" stroke="#f3e2b8" stroke-width="1.6" opacity=".7"/>`;
      yy -= bh; i++;
    }
    // vela arriba (solo en los cercanos)
    if (sw) out += `<rect x="${n1(x - 3)}" y="${n1(yy - 12)}" width="6" height="12" fill="#f3e2b8"${sw ? ` stroke="${L}" stroke-width="${Math.min(sw, 2)}"` : ''}/><ellipse class="esc-llama" cx="${n1(x)}" cy="${n1(yy - 16)}" rx="3" ry="5" fill="#f2c66d"/>`;
    void c; void sh;
    return out;
  }

  function nube(x, y, w, c, sh, sw, rnd) {
    const n = 4, cs = [];
    for (let i = 0; i < n; i++) { const t = i / (n - 1); cs.push([x - w / 2 + t * w, y - (Math.sin(t * Math.PI) * w * .22) - rnd() * w * .06, w * (.16 + Math.sin(t * Math.PI) * .14)]); }
    const circ = (st) => cs.map(([cx, cy, r]) => `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}"${st}/>`).join('');
    const base = `<rect x="${n1(x - w / 2)}" y="${n1(y - w * .12)}" width="${n1(w)}" height="${n1(w * .16)}" rx="${n1(w * .08)}"`;
    const somb = `<rect x="${n1(x - w / 2 + 4)}" y="${n1(y - w * .02)}" width="${n1(w - 8)}" height="${n1(w * .06)}" rx="${n1(w * .03)}" fill="${sh}"/>`;
    return (sw ? circ(` fill="${c}" stroke="${L}" stroke-width="${sw * 2}"`) + base + ` fill="${c}" stroke="${L}" stroke-width="${sw * 2}"/>` : '') + circ(` fill="${c}"`) + base + ` fill="${c}"/>` + somb;
  }

  function cerros(W, yBase, amp, n, rnd) {
    let d = `M-10 ${n1(yBase + amp)}`;
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push([(W + 20) * i / n - 10, yBase - rnd() * amp]);
    d += ` L${n1(pts[0][0])} ${n1(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; d += ` Q${n1((x0 + x1) / 2)} ${n1(Math.min(y0, y1) - amp * .5)} ${n1(x1)} ${n1(y1)}`; }
    return d;
  }

  let LUG = LUGARES.bosque;

  /** Genera el HTML de las capas para un tamaño y un lugar. */
  function generar(W0, H0, lugar) {
    LUG = LUGARES[lugar] || LUGARES.bosque;
    const C = LUG, M = 28, W = W0 + M * 2, H = H0 + M * 2;
    const rnd = azarCon(({ bosque: 7, cueva: 11, biblioteca: 23, cumbre: 31, cielo: 43 }[lugar] || 7) * 1000 + Math.round(W0 / 50));
    const svg = (cls, inner, prof) => `<svg class="esc-capa ${cls}" data-prof="${prof}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="left:${-M}px;top:${-M}px" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
    const arbol = (x, y, h, w, c, sh, sw) => C.arbol === 'cristal' ? cristal(x, y, h, w, c, sh, sw, rnd)
      : C.arbol === 'libros' ? libros(x, y, h, w * .55, c, sh, sw, rnd)
        : C.arbol === 'nube' ? nube(x, y - h * .3, w * 1.6, c, sh, sw / 2, rnd)
          : pino(x, y, h, w, c, sh, sw, C.arbol === 'pinoNieve', rnd);
    const esc = Math.max(.75, Math.min(1.25, Math.min(W0, H0 * .7) / 420));

    // ---- cielo
    let cielo = '';
    const bandas = C.cielo, hb = H * .62 / bandas.length;
    cielo += `<rect width="${W}" height="${H}" fill="${bandas[bandas.length - 1]}"/>`;
    bandas.forEach((col, i) => { cielo += `<rect y="${n1(i * hb - 1)}" width="${W}" height="${n1(hb + 2)}" fill="${col}"/>`; });
    for (let i = 0; i < C.estrellas; i++) {
      const x = rnd() * W, y = rnd() * H * .45, r = .7 + rnd() * 1.4;
      cielo += rnd() < .12 ? `<path class="esc-titila" style="animation-delay:${n1(rnd() * 4)}s" d="${estrella(x, y, r * 2.6)}" fill="#fff6d8"/>`
        : `<circle class="esc-titila" style="animation-delay:${n1(rnd() * 4)}s" cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}" fill="#fff6d8"/>`;
    }
    if (C.astro) {
      const ax = W * .76, ay = H * .15, ar = Math.min(W0, H0) * .075 + 14;
      const col = C.astro === 'sol' ? '#fff1c9' : '#f3efd6';
      cielo += `<g class="esc-astro"><circle cx="${n1(ax)}" cy="${n1(ay)}" r="${n1(ar * 2.3)}" fill="${col}" opacity=".06"/><circle cx="${n1(ax)}" cy="${n1(ay)}" r="${n1(ar * 1.6)}" fill="${col}" opacity=".1"/>
        <circle cx="${n1(ax)}" cy="${n1(ay)}" r="${n1(ar)}" fill="${col}" stroke="${L}" stroke-width="3"/>` +
        (C.astro === 'luna' ? `<circle cx="${n1(ax + ar * .3)}" cy="${n1(ay - ar * .2)}" r="${n1(ar * .2)}" fill="#e0dabb"/><circle cx="${n1(ax - ar * .32)}" cy="${n1(ay + ar * .3)}" r="${n1(ar * .14)}" fill="#e0dabb"/><circle cx="${n1(ax - ar * .1)}" cy="${n1(ay - ar * .45)}" r="${n1(ar * .09)}" fill="#e0dabb"/><path d="M${n1(ax + ar * .55)} ${n1(ay + ar * .45)} A${n1(ar)} ${n1(ar)} 0 0 1 ${n1(ax - ar * .2)} ${n1(ay + ar * .95)}" stroke="#d6cfae" stroke-width="${n1(ar * .16)}" fill="none" stroke-linecap="round"/>` : '') + '</g>';
    }
    // nubes que cruzan
    const nNubes = C.arbol === 'nube' ? 5 : C.astro ? 5 : 0;
    for (let i = 0; i < nNubes; i++) {
      const y = H * (.07 + rnd() * .3), w = (80 + rnd() * 90) * esc, dur = 45 + rnd() * 60;
      cielo += `<g class="esc-nube" style="animation-duration:${n1(dur)}s;animation-delay:-${n1(rnd() * dur)}s;--ancho:${W + w * 2}px"><g transform="translate(${-w} 0)" opacity="${C.arbol === 'nube' ? .9 : .95}">${C.arbol === 'nube' ? nube(0, y, w, '#ffffff', '#f5e3d6', 0, rnd) : nube(0, y, w, C.nubeCol || C.lejos, C.nubeSh || C.medioSh, 1.5, rnd)}</g></g>`;
    }
    if (C.estalactitas) {
      let d = `M-10 -10 L${W + 10} -10 L${W + 10} ${n1(H * .05)}`;
      for (let x = W + 10; x > -10;) { const w = 18 + rnd() * 40, h = 20 + rnd() * (H * .12); d += ` L${n1(x - w / 2)} ${n1(H * .04 + h)} L${n1(x - w)} ${n1(H * .05)}`; x -= w; }
      cielo += P(d + ' Z', C.cerca, 3);
    }

    // ---- lejos: montes, árboles chicos, torre, niebla
    let lejos = '';
    const yMonte = H * .5;
    if (C.nieve) {
      for (let i = 0; i < 4; i++) {
        const x = W * (.08 + i * .28 + rnd() * .05), y = yMonte - H * .1, w = W * (.17 + rnd() * .05), base = y + H * .22;
        lejos += P(`M${n1(x - w)} ${n1(base)} L${n1(x)} ${n1(y - H * .06)} L${n1(x + w)} ${n1(base)}`, '#c9d8e1', 2.5)
          + P(`M${n1(x)} ${n1(y - H * .06)} L${n1(x + w)} ${n1(base)} L${n1(x + w * .15)} ${n1(base)}Z`, '#a9bfcc')
          + P(`M${n1(x - w * .3)} ${n1(y + H * .015)} L${n1(x)} ${n1(y - H * .06)} L${n1(x + w * .3)} ${n1(y + H * .015)} L${n1(x + w * .12)} ${n1(y + H * .005)} L${n1(x)} ${n1(y + H * .025)} L${n1(x - w * .14)} ${n1(y + H * .004)}Z`, '#ffffff', 2);
      }
    }
    lejos += P(cerros(W, yMonte, H * .12, 5, rnd) + ` L${W + 10} ${H} L-10 ${H}Z`, C.montes);
    const yLejos = H * .58;
    lejos += P(cerros(W, yLejos, H * .04, 8, rnd) + ` L${W + 10} ${H} L-10 ${H}Z`, C.lejos);
    if (C.torre) {
      const tx = W * .82, ty = yLejos + H * .005, th = H * .07 * esc + 26, tw = th * .5;
      lejos += `<g class="esc-torre">${P(`M${n1(tx - tw / 2)} ${n1(ty)} L${n1(tx - tw * .4)} ${n1(ty - th)} L${n1(tx + tw * .4)} ${n1(ty - th)} L${n1(tx + tw / 2)} ${n1(ty)}Z`, '#4a6c6b', 2.5)}
        ${P(`M${n1(tx - tw * .55)} ${n1(ty - th + 6)} L${n1(tx - tw * .55)} ${n1(ty - th - 4)} L${n1(tx + tw * .55)} ${n1(ty - th - 4)} L${n1(tx + tw * .55)} ${n1(ty - th + 6)}Z`, '#56787a', 2.5)}${P(`M${n1(tx - tw * .65)} ${n1(ty - th - 3)} L${n1(tx)} ${n1(ty - th - tw * 1.5)} L${n1(tx + tw * .65)} ${n1(ty - th - 3)}Z`, '#2f7f7a', 2.5)}
        <path d="${estrella(tx, ty - th - tw * 1.6, tw * .28)}" fill="#fff1bf" stroke="${L}" stroke-width="1.5"/>
        <rect class="esc-ventana" x="${n1(tx - tw * .14)}" y="${n1(ty - th * .78)}" width="${n1(tw * .28)}" height="${n1(tw * .42)}" rx="${n1(tw * .14)}" fill="#f2c66d"/>
        <rect class="esc-ventana" style="animation-delay:-1.3s" x="${n1(tx - tw * .12)}" y="${n1(ty - th * .42)}" width="${n1(tw * .24)}" height="${n1(tw * .34)}" rx="${n1(tw * .12)}" fill="#f2c66d"/></g>`;
    }
    const nLejos = Math.round(W / 26);
    for (let i = 0; i < nLejos; i++) {
      const x = (i + rnd() * .8) * W / nLejos, h = (34 + rnd() * 26) * esc, y = yLejos + rnd() * H * .03;
      if (C.torre && Math.abs(x - W * .82) < 30) continue;
      lejos += arbol(x, y, h, h * .5, C.lejos, C.lejos, 0);
    }
    lejos += `<g class="esc-niebla-a"><ellipse cx="${n1(W * .3)}" cy="${n1(yLejos + 4)}" rx="${n1(W * .45)}" ry="${n1(H * .03)}" fill="${C.niebla}" opacity=".2"/><ellipse cx="${n1(W * .85)}" cy="${n1(yLejos + 10)}" rx="${n1(W * .35)}" ry="${n1(H * .03)}" fill="${C.niebla}" opacity=".16"/></g>`;
    if (C.librosVolando) {
      for (let i = 0; i < 5; i++) {
        const x = W * (.1 + rnd() * .8), y = H * (.12 + rnd() * .3), s = (.7 + rnd() * .6) * esc, col = LIBROS[i % LIBROS.length];
        lejos += `<g class="esc-flota" style="animation-delay:-${n1(rnd() * 5)}s"><g transform="translate(${n1(x)} ${n1(y)}) scale(${n1(s)})">${P('M0 0 Q-12 -8 -24 -4 L-24 10 Q-12 6 0 14 Q12 6 24 10 L24 -4 Q12 -8 0 0Z', '#f3e2b8', 2.5)}${P('M0 0 L0 14', 'none', 2)}${P('M-24 10 Q-12 6 0 14 Q12 6 24 10 L24 13 Q12 9 0 17 Q-12 9 -24 13Z', col, 2)}</g></g>`;
      }
    }
    if (C.islas) {
      for (let i = 0; i < 2; i++) {
        const x = W * (.2 + i * .55 + rnd() * .1), y = H * (.3 + rnd() * .1), w = (50 + rnd() * 30) * esc;
        lejos += `<g class="esc-flota" style="animation-delay:-${i * 2.5}s">${P(`M${n1(x - w / 2)} ${n1(y)} Q${n1(x)} ${n1(y - 8)} ${n1(x + w / 2)} ${n1(y)} L${n1(x + w * .1)} ${n1(y + w * .5)} Z`, '#c79a7a', 2.5)}${P(`M${n1(x - w / 2)} ${n1(y)} Q${n1(x)} ${n1(y - 8)} ${n1(x + w / 2)} ${n1(y)} Q${n1(x)} ${n1(y + 6)} ${n1(x - w / 2)} ${n1(y)}Z`, '#8fbf7a', 2.5)}${pino(x + w * .15, y - 2, w * .5, w * .3, '#5f9a6a', '#4f855a', 2, false, rnd)}</g>`;
      }
    }

    // ---- medio: cerro y árboles que se mecen
    let medio = '';
    const yMedio = H * .68;
    medio += P(cerros(W, yMedio, H * .05, 6, rnd) + ` L${W + 10} ${H} L-10 ${H}Z`, C.medioSh, 0);
    const nMedio = Math.max(5, Math.round(W / 58));
    for (let i = 0; i < nMedio; i++) {
      const x = (i + .2 + rnd() * .6) * W / nMedio, h = (70 + rnd() * 50) * esc, y = yMedio + rnd() * H * .04;
      medio += `<g class="esc-arbol" data-x="${n1(x - M)}" style="--d:${n1(5 + rnd() * 3)}s;animation-delay:-${n1(rnd() * 6)}s">${arbol(x, y, h, h * .52, C.medio, C.medioSh, 2.5)}</g>`;
    }
    medio += `<g class="esc-niebla-b"><ellipse cx="${n1(W * .6)}" cy="${n1(yMedio + 14)}" rx="${n1(W * .5)}" ry="${n1(H * .03)}" fill="${C.niebla}" opacity=".2"/></g>`;

    // ---- cerca: árboles grandes en los costados, suelo, detalles
    let cerca = '';
    const ySuelo = H * .9;
    const lados = W0 > H0 ? [.04, .14, .86, .96] : [-.02, .1, .92, 1.03];
    lados.forEach((fx, i) => {
      const x = W * fx, h = (i % 2 ? 160 : 210) * esc * (W0 > H0 ? 1.4 : 1), y = ySuelo + 10 + rnd() * 10;
      cerca += `<g class="esc-arbol grande" data-x="${n1(x - M)}" style="--d:${n1(6 + rnd() * 3)}s;animation-delay:-${n1(rnd() * 6)}s">${arbol(x, y, h, h * .5, C.cerca, C.cercaSh, 3)}</g>`;
    });
    if (C.buho) {
      const bx = W * lados[1] + 4, by = ySuelo - 70 * esc;
      cerca += `<g class="esc-buho" data-x="${n1(bx - M)}"><g class="esc-ojos" style="transform-origin:${n1(bx)}px ${n1(by)}px"><circle cx="${n1(bx - 5)}" cy="${n1(by)}" r="3.4" fill="#f2c66d"/><circle cx="${n1(bx + 5)}" cy="${n1(by)}" r="3.4" fill="#f2c66d"/><circle cx="${n1(bx - 4.4)}" cy="${n1(by)}" r="1.4" fill="${L}"/><circle cx="${n1(bx + 5.6)}" cy="${n1(by)}" r="1.4" fill="${L}"/></g></g>`;
    }
    cerca += P(cerros(W, ySuelo, H * .025, 5, rnd) + ` L${W + 10} ${H + 10} L-10 ${H + 10}Z`, C.suelo, 3);
    for (let i = 0; i < Math.round(W / 40); i++) {
      const x = rnd() * W, y = ySuelo + 6 + rnd() * H * .06;
      cerca += rnd() < .25 && C.arbol === 'pino'
        ? `${P(`M${n1(x - 1.5)} ${n1(y)} L${n1(x - 1.5)} ${n1(y - 7)} L${n1(x + 1.5)} ${n1(y - 7)} L${n1(x + 1.5)} ${n1(y)}Z`, '#e8e0cc', 1.5)}${P(`M${n1(x - 7)} ${n1(y - 6)} Q${n1(x)} ${n1(y - 16)} ${n1(x + 7)} ${n1(y - 6)}Z`, '#e8907a', 1.8)}<circle cx="${n1(x - 2)}" cy="${n1(y - 10)}" r="1.3" fill="#fff"/>`
        : `<path d="M${n1(x - 5)} ${n1(y)} Q${n1(x - 4)} ${n1(y - 7)} ${n1(x - 6)} ${n1(y - 10)} M${n1(x)} ${n1(y)} Q${n1(x + 1)} ${n1(y - 9)} ${n1(x)} ${n1(y - 13)} M${n1(x + 5)} ${n1(y)} Q${n1(x + 5)} ${n1(y - 6)} ${n1(x + 7)} ${n1(y - 9)}" stroke="${C.sueloLuz}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    }

    return {
      atras: svg('esc-cielo', cielo, .08) + svg('esc-lejos', lejos, .22) + svg('esc-medio', medio, .5),
      frente: svg('esc-cerca', cerca, 1),
    };
  }

  // ---------------------------------------------------------------- montaje
  const Escena = {
    lugar: 'bosque', atras: null, frente: null, W: 0, H: 0, px: 0, py: 0,

    /** atras/frente: contenedores (las luciérnagas van entre los dos). */
    montar(atras, frente, lugar) {
      this.atras = atras; this.frente = frente; this.lugar = lugar || 'bosque';
      this.dibujar(false);
      let t = null;
      addEventListener('resize', () => { clearTimeout(t); t = setTimeout(() => { if (Math.abs(innerWidth - this.W) > 30 || Math.abs(innerHeight - this.H) > 60) this.dibujar(false); }, 250); });
      this.fugaces();
    },

    dibujar(fundido) {
      this.W = this.atras.clientWidth || innerWidth; this.H = this.atras.clientHeight || innerHeight;
      const g = generar(this.W, this.H, this.lugar);
      const poner = (cont, html) => {
        const capa = document.createElement('div'); capa.className = 'esc-grupo'; capa.innerHTML = html;
        if (fundido) { capa.style.opacity = '0'; cont.appendChild(capa); void capa.offsetWidth; capa.style.opacity = '1';
          const viejas = [...cont.children].filter((c) => c !== capa); setTimeout(() => viejas.forEach((v) => v.remove()), 900);
        } else { cont.innerHTML = ''; cont.appendChild(capa); }
      };
      poner(this.atras, g.atras); poner(this.frente, g.frente);
      this._capas = null;
      const x = this.px, y = this.py; this.px = this.py = 9; this.mover(x, y);
    },

    ponerLugar(id) {
      const l = LUGARES[id] ? id : 'bosque';
      if (l === this.lugar) return;
      this.lugar = l; this.dibujar(true);
    },

    /** Parallax: x, y entre -0.5 y 0.5. */
    mover(x, y) {
      if (QUIETO) return;
      if (Math.abs(x - this.px) < .004 && Math.abs(y - this.py) < .004) return;
      this.px = x; this.py = y;
      if (this._rafMover) return;
      this._rafMover = requestAnimationFrame(() => {
        this._rafMover = 0;
        if (!this._capas || !this._capas[0] || !this._capas[0].isConnected) this._capas = [...document.querySelectorAll('#fondo .esc-capa')];
        for (const s of this._capas) {
          const k = Number(s.dataset.prof) || 0;
          s.style.transform = `translate(${n1(this.px * -26 * k)}px, ${n1(this.py * -14 * k)}px)`;
        }
      });
    },

    /** Toque en el fondo: se sacuden los árboles cercanos; si es el búho, parpadea. */
    tocar(x) {
      let n = 0;
      for (const a of document.querySelectorAll('#fondo .esc-arbol, #fondo .esc-buho')) {
        if (Math.abs(Number(a.dataset.x) - x) > 70) continue;
        a.classList.remove('sacude'); a.getBoundingClientRect(); a.classList.add('sacude'); n++;
        setTimeout(() => a.classList.remove('sacude'), 800);
      }
      return n;
    },

    /** Estrella fugaz de vez en cuando (solo en lugares con cielo). */
    /** Banco de nubes que tapa media pantalla (lado: -1 izquierda, 1 derecha). */
    _banco(W, H, lado, colores, semilla, extra, margen) {
      const rnd = azarCon(semilla), w = W / 2 + extra, borde = lado < 0 ? w - margen : margen;
      const puff = [];
      for (let y = -60; y < H + 80; y += 58 + rnd() * 26) puff.push([borde + (rnd() - .3) * 50 * -lado, y, 58 + rnd() * 40]);
      for (let i = 0; i < 5; i++) puff.push([borde + lado * (90 + rnd() * (w - 160)), rnd() * H, 50 + rnd() * 60]);
      const cuerpo = lado < 0 ? `<rect x="-20" y="-40" width="${n1(borde - 10)}" height="${H + 80}" fill="${colores[0]}"/>` : `<rect x="${n1(borde + 30)}" y="-40" width="${n1(w)}" height="${H + 80}" fill="${colores[0]}"/>`;
      const circ = (st) => puff.map(([x, y, r]) => `<circle cx="${n1(x)}" cy="${n1(y)}" r="${n1(r)}"${st}/>`).join('');
      return `<svg viewBox="0 0 ${n1(w)} ${H}" width="${n1(w)}" height="${H}" xmlns="http://www.w3.org/2000/svg">${circ(` fill="${colores[0]}" stroke="${L}" stroke-width="6"`)}${cuerpo}${circ(` fill="${colores[0]}"`)}</svg>`;
    },

    /** Llegada: las nubes tapan todo y se abren hacia los costados. alAbrir se llama cuando empiezan a correrse. */
    intro(alAbrir) {
      const W = innerWidth, H = innerHeight;
      if (QUIETO || W < 100 || H < 100) { if (alAbrir) alAbrir(); return; }
      const capa = document.createElement('div'); capa.className = 'intro-nubes';
      capa.innerHTML = `<div class="intro-banco atras izq">${this._banco(W, H, -1, ['#92afa1'], 3, 130, 120)}</div>
        <div class="intro-banco atras der">${this._banco(W, H, 1, ['#92afa1'], 5, 130, 130)}</div>
        <div class="intro-banco izq">${this._banco(W, H, -1, ['#dfebd6'], 7, 60, 100)}</div>
        <div class="intro-banco der">${this._banco(W, H, 1, ['#dfebd6'], 9, 60, 100)}</div>`;
      document.getElementById('fondo').after(capa);
      let abierta = false;
      const abrir = () => {
        if (abierta) return; abierta = true;
        capa.classList.add('abre');
        if (alAbrir) alAbrir();
        setTimeout(() => capa.remove(), 2200);
      };
      document.addEventListener('pointerdown', abrir, { once: true });
      setTimeout(abrir, 1500);
    },

    /** Tormenta de paso: nubarrones, lluvia y uno o dos rayos. alRayo(x, y) avisa cada rayo. */
    tormenta(alRayo) {
      if (this._tormenta || this.lugar !== 'bosque' || !this.atras) return;
      this._tormenta = true;
      const W = this.W, H = this.H, rnd = Math.random;
      const nubes = document.createElement('div'); nubes.className = 'nubarrones';
      let svg = '';
      for (let i = 0; i < 6; i++) svg += nube(W * (i / 5) + (rnd() - .5) * 40, H * (.1 + rnd() * .08), 150 + rnd() * 90, '#2b3d46', '#22333b', 1.5, rnd);
      nubes.innerHTML = `<svg viewBox="0 0 ${W} ${n1(H * .35)}" width="${W}" height="${n1(H * .35)}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`;
      const sombra = document.createElement('div'); sombra.className = 'tormenta-sombra';
      const lluvia = document.createElement('div'); lluvia.className = 'lluvia';
      this.atras.appendChild(sombra); this.atras.appendChild(nubes); this.frente.appendChild(lluvia);
      requestAnimationFrame(() => { void nubes.offsetWidth; nubes.classList.add('ve'); sombra.classList.add('ve'); lluvia.classList.add('ve'); });
      const rayo = () => {
        const x = W * (.15 + rnd() * .7), y1 = H * .14, y2 = H * (.62 + rnd() * .12);
        let d = `M${n1(x)} ${n1(y1)}`, xx = x, rama = '';
        for (let y = y1; y < y2;) { y += H * (.04 + rnd() * .04); xx += (rnd() - .5) * 46; d += ` L${n1(xx)} ${n1(Math.min(y, y2))}`; if (!rama && y > y1 + H * .15 && rnd() < .5) rama = `M${n1(xx)} ${n1(y)} L${n1(xx + 30)} ${n1(y + 40)} L${n1(xx + 22)} ${n1(y + 70)}`; }
        const r = document.createElement('div'); r.className = 'rayo-tormenta';
        r.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke-linejoin="round" stroke-linecap="round">
          <path d="${d} ${rama}" stroke="#fff6d8" stroke-width="16" opacity=".25"/><path d="${d} ${rama}" stroke="${L}" stroke-width="8"/><path d="${d} ${rama}" stroke="#fff6d8" stroke-width="3.6"/></g>
          <ellipse cx="${n1(xx)}" cy="${n1(y2)}" rx="34" ry="8" fill="#fff6d8" opacity=".5"/></svg>`;
        this.atras.appendChild(r);
        const flash = document.createElement('div'); flash.className = 'relampago'; document.body.appendChild(flash);
        setTimeout(() => { r.remove(); flash.remove(); }, 700);
        this.tocar(xx - 28);
        if (alRayo) alRayo(xx, y2);
      };
      const n = 1 + Math.round(rnd() * 1.4);
      this._tTorm = [];
      for (let i = 0; i < n; i++) this._tTorm.push(setTimeout(rayo, 1800 + i * (2200 + rnd() * 1500)));
      this._tTorm.push(setTimeout(() => { nubes.classList.remove('ve'); sombra.classList.remove('ve'); lluvia.classList.remove('ve'); }, 8500));
      this._tTorm.push(setTimeout(() => this.calmar(), 10500));
      this._piezasTorm = [nubes, sombra, lluvia];
    },

    /** Corta la tormenta en el acto (por ejemplo, al empezar una partida). */
    calmar() {
      if (!this._tormenta) return;
      (this._tTorm || []).forEach(clearTimeout);
      (this._piezasTorm || []).forEach((el) => el.remove());
      document.querySelectorAll('.rayo-tormenta, .relampago').forEach((el) => el.remove());
      this._tormenta = false;
    },

    fugaces() {
      const una = () => {
        setTimeout(una, 9000 + Math.random() * 14000);
        if (document.hidden || !LUGARES[this.lugar].estrellas || this.lugar === 'cielo') return;
        const s = document.createElement('div'); s.className = 'esc-fugaz';
        s.style.left = (20 + Math.random() * 60) + '%'; s.style.top = (4 + Math.random() * 18) + '%';
        this.atras.appendChild(s); setTimeout(() => s.remove(), 1400);
      };
      setTimeout(una, 4000);
    },
  };

  // las formas sueltas, para que el camino de la Torre dibuje con el mismo trazo
  const formas = { pino, cristal, libros, nube, estrella, azarCon, usarLugar: (id) => { LUG = LUGARES[id] || LUGARES.bosque; } };
  window.WWEscena = Object.assign(Escena, { generar, LUGARES, formas });
})();
