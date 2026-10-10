/**
 * Crucigramas del Bosque — generador de grillas (sirve en el navegador y en Node).
 *
 *   CB.libre(entradas, opts)  crucigrama temático: las palabras se cruzan libremente (formato "libre")
 *   CB.mini(palabras, opts)   grilla llena de 5×5 con negras en las esquinas (formato "mini")
 *   CB.numerar(grilla)        numera las casillas donde empieza una palabra, en orden de lectura
 *
 * Todo es determinístico por semilla: el mismo día da el mismo crucigrama a todos.
 */
(function (raiz, fabrica) {
  if (typeof module === 'object' && module.exports) module.exports = fabrica();
  else raiz.CB = fabrica();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function mezclar(arr, rnd) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  /** Respuesta en mayúsculas, sin tildes (la Ñ queda). */
  const normal = (w) => w.toUpperCase().replace(/Ñ/g, '\u0001').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\u0001/g, 'Ñ').replace(/[^A-ZÑ]/g, '');

  // ------------------------------------------------------------------ formato libre (temático)
  /**
   * entradas: [[respuesta, pista], ...]. opts: { semilla, cuantas (8), ancho (10), alto (12), intentos (400) }.
   * Devuelve { ancho, alto, celdas: [[letra|null]], entradas: [{ respuesta, pista, x, y, dir: 'h'|'v', n }] }.
   */
  function libre(entradas, opts) {
    const o = Object.assign({ semilla: 1, cuantas: 8, ancho: 10, alto: 12, intentos: 400 }, opts);
    const lista = entradas.map(([r, p]) => ({ respuesta: normal(r), pista: p })).filter((e) => e.respuesta.length >= 3 && e.respuesta.length <= Math.max(o.ancho, o.alto));
    let mejor = null;
    for (let k = 0; k < o.intentos; k++) {
      const rnd = mulberry32(o.semilla * 1000 + k);
      // largas primero (con algo de azar): dan el esqueleto
      const orden = mezclar(lista, rnd).sort((a, b) => (b.respuesta.length + rnd() * 3) - (a.respuesta.length + rnd() * 3));
      const r = armarLibre(orden, o, rnd);
      if (!r) continue;
      if (!mejor || r.puntaje > mejor.puntaje) mejor = r;
    }
    if (!mejor) return null;
    return recortar(mejor);
  }

  function armarLibre(orden, o, rnd) {
    const M = new Map(); // "x,y" → letra
    const puestas = [];
    const get = (x, y) => M.get(x + ',' + y);
    let minX = 0, maxX = -1, minY = 0, maxY = -1;
    const cabe = (w, x, y, dir) => {
      const dx = dir === 'h' ? 1 : 0, dy = 1 - dx;
      if (get(x - dx, y - dy) || get(x + dx * w.length, y + dy * w.length)) return -1;
      let cruces = 0;
      for (let i = 0; i < w.length; i++) {
        const cx = x + dx * i, cy = y + dy * i, l = get(cx, cy);
        if (l) { if (l !== w[i]) return -1; cruces++; continue; }
        // casilla nueva: los costados perpendiculares tienen que estar vacíos
        if (get(cx + dy, cy + dx) || get(cx - dy, cy - dx)) return -1;
      }
      const nx0 = Math.min(minX, x), nx1 = Math.max(maxX, x + dx * (w.length - 1)), ny0 = Math.min(minY, y), ny1 = Math.max(maxY, y + dy * (w.length - 1));
      if (nx1 - nx0 + 1 > o.ancho || ny1 - ny0 + 1 > o.alto) return -1;
      return cruces;
    };
    const poner = (e, x, y, dir) => {
      const dx = dir === 'h' ? 1 : 0, dy = 1 - dx;
      for (let i = 0; i < e.respuesta.length; i++) M.set((x + dx * i) + ',' + (y + dy * i), e.respuesta[i]);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x + dx * (e.respuesta.length - 1));
      minY = Math.min(minY, y); maxY = Math.max(maxY, y + dy * (e.respuesta.length - 1));
      puestas.push(Object.assign({}, e, { x, y, dir }));
    };
    const [primera, ...resto] = orden;
    poner(primera, 0, 0, rnd() < .5 ? 'h' : 'v');
    let cruces = 0;
    for (const e of resto) {
      if (puestas.length >= o.cuantas) break;
      const w = e.respuesta;
      let cand = [];
      for (const p of puestas) {
        const pdx = p.dir === 'h' ? 1 : 0, pdy = 1 - pdx, dir = p.dir === 'h' ? 'v' : 'h';
        for (let i = 0; i < p.respuesta.length; i++) for (let j = 0; j < w.length; j++) {
          if (p.respuesta[i] !== w[j]) continue;
          const cx = p.x + pdx * i, cy = p.y + pdy * i;
          const x = dir === 'h' ? cx - j : cx, y = dir === 'v' ? cy - j : cy;
          const c = cabe(w, x, y, dir);
          if (c > 0) cand.push({ x, y, dir, c });
        }
      }
      if (!cand.length) continue;
      const tope = Math.max(...cand.map((q) => q.c));
      cand = cand.filter((q) => q.c === tope);
      const q = cand[Math.floor(rnd() * cand.length)];
      poner(e, q.x, q.y, q.dir); cruces += q.c;
    }
    if (puestas.length < Math.min(o.cuantas, orden.length)) return null;
    const area = (maxX - minX + 1) * (maxY - minY + 1);
    const letras = M.size;
    // más cruces y más compacto es mejor; equilibrio entre horizontales y verticales
    const h = puestas.filter((p) => p.dir === 'h').length;
    const puntaje = cruces * 12 + (letras / area) * 60 - Math.abs(h - (puestas.length - h)) * 4;
    return { M, puestas, minX, minY, maxX, maxY, puntaje };
  }

  function recortar(r) {
    const ancho = r.maxX - r.minX + 1, alto = r.maxY - r.minY + 1;
    const celdas = Array.from({ length: alto }, (_, y) => Array.from({ length: ancho }, (_, x) => r.M.get((x + r.minX) + ',' + (y + r.minY)) || null));
    const entradas = r.puestas.map((p) => ({ respuesta: p.respuesta, pista: p.pista, x: p.x - r.minX, y: p.y - r.minY, dir: p.dir }));
    return numerar({ ancho, alto, celdas, entradas });
  }

  /** Numera en orden de lectura; si una casilla abre una horizontal y una vertical, comparten número. */
  function numerar(g) {
    const num = new Map(); let n = 0;
    const inicios = g.entradas.map((e) => e.y * 100 + e.x);
    [...new Set(inicios)].sort((a, b) => a - b).forEach((k) => num.set(k, ++n));
    g.entradas.forEach((e) => { e.n = num.get(e.y * 100 + e.x); });
    g.entradas.sort((a, b) => (a.dir === b.dir ? a.n - b.n : a.dir === 'h' ? -1 : 1));
    return g;
  }

  // ------------------------------------------------------------------ formato mini (5×5 lleno)
  /**
   * palabras: lista de respuestas posibles (se usan las de 3 a 5 letras). opts: { semilla, patron }.
   * patron: 5 strings con '#' para negra y '.' para blanca. Por defecto, negras en dos esquinas opuestas.
   * Devuelve la grilla con entradas sin pista (las pistas salen del banco).
   */
  function mini(palabras, opts) {
    const o = Object.assign({ semilla: 1, patron: ['#....', '.....', '.....', '.....', '....#'], limite: 400000 }, opts);
    const P = o.patron, N = P.length;
    const rnd = mulberry32(o.semilla);
    const porLargo = {};
    for (const w0 of palabras) { const w = normal(w0); if (w.length >= 3 && w.length <= N) (porLargo[w.length] = porLargo[w.length] || []).push(w); }
    for (const k in porLargo) porLargo[k] = mezclar([...new Set(porLargo[k])], rnd);
    // casilleros (slots)
    const slots = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      if (P[y][x] === '#') continue;
      if ((x === 0 || P[y][x - 1] === '#') && x + 1 < N && P[y][x + 1] !== '#') { let l = 0; while (x + l < N && P[y][x + l] !== '#') l++; slots.push({ x, y, dir: 'h', l }); }
      if ((y === 0 || P[y - 1][x] === '#') && y + 1 < N && P[y + 1][x] !== '#') { let l = 0; while (y + l < N && P[y + l][x] !== '#') l++; slots.push({ x, y, dir: 'v', l }); }
    }
    const G = P.map((f) => f.split('').map((c) => (c === '#' ? '#' : '')));
    const patronDe = (s) => { let p = ''; for (let i = 0; i < s.l; i++) { const c = s.dir === 'h' ? G[s.y][s.x + i] : G[s.y + i][s.x]; p += c || '.'; } return p; };
    const encaja = (w, p) => { for (let i = 0; i < p.length; i++) if (p[i] !== '.' && p[i] !== w[i]) return false; return true; };
    const usadas = new Set(); let pasos = 0;
    const resolver = () => {
      if (++pasos > o.limite) return false;
      // el casillero con menos opciones primero
      let mejor = null, mejorCand = null;
      for (const s of slots) {
        if (s.w) continue;
        const p = patronDe(s);
        const cand = (porLargo[s.l] || []).filter((w) => !usadas.has(w) && encaja(w, p));
        if (!mejor || cand.length < mejorCand.length) { mejor = s; mejorCand = cand; if (!cand.length) return false; }
      }
      if (!mejor) return true;
      const prev = patronDe(mejor);
      for (const w of mejorCand.slice(0, 60)) {
        for (let i = 0; i < w.length; i++) { if (mejor.dir === 'h') G[mejor.y][mejor.x + i] = w[i]; else G[mejor.y + i][mejor.x] = w[i]; }
        mejor.w = w; usadas.add(w);
        if (resolver()) return true;
        usadas.delete(w); mejor.w = null;
        for (let i = 0; i < prev.length; i++) { const c = prev[i] === '.' ? '' : prev[i]; if (mejor.dir === 'h') G[mejor.y][mejor.x + i] = c; else G[mejor.y + i][mejor.x] = c; }
      }
      return false;
    };
    if (!resolver()) return null;
    const celdas = G.map((f) => f.map((c) => (c === '#' ? null : c)));
    return numerar({ ancho: N, alto: N, celdas, entradas: slots.map((s) => ({ respuesta: s.w, pista: '', x: s.x, y: s.y, dir: s.dir })), pasos });
  }

  return { libre, mini, numerar, normal, mulberry32 };
});
