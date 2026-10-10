/**
 * Crucigramas del Bosque — personajes propios de este juego (Silabo viene del kit).
 * Doña Lenta: la caracola sabia que da las pistas. Mismo trazo que Silabo: tonos planos con sombra y luz,
 * contorno #16262c, formas redondas.
 *
 *   CBPersonajes.donaLenta({ pose: 'quieta' | 'habla' }) → string SVG
 */
(function () {
  'use strict';
  const L = '#16262c';
  const S = (d, fill, w) => `<path d="${d}" fill="${fill}" stroke="${L}" stroke-width="${w || 4}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const F = (d, fill, op) => `<path d="${d}" fill="${fill}"${op ? ` opacity="${op}"` : ''}/>`;
  const T = (d, c, w, op) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${op ? ` opacity="${op}"` : ''}/>`;

  function donaLenta(o) {
    o = o || {};
    const piel = '#d9c49a', pielS = '#bba377', pielL = '#efe1bf';
    const casa = '#e8907a', casaS = '#c46a55', casaL = '#f6b8a3';
    const chal = '#8a6f9e', chalS = '#6e5682';
    let s = `<ellipse cx="100" cy="150" rx="78" ry="9" fill="#0d1418" opacity=".22"/>`;
    // cuerpo (pie de caracol) con la cola hacia la izquierda
    s += S('M24 146 C20 132 40 126 70 126 H138 C150 126 156 116 156 102 L176 102 C182 124 172 146 148 148 H34 C28 148 25 148 24 146Z', piel);
    s += F('M40 140 H146 C162 140 172 130 174 112 C178 130 170 146 148 148 H34 C30 146 32 142 40 140Z', pielS);
    // caparazón con espiral
    s += S('M48 124 C38 90 58 52 96 50 C132 48 152 76 148 104 C146 124 130 132 112 130 H62 C54 130 50 128 48 124Z', casa, 4.5);
    s += F('M120 54 C142 64 152 86 148 106 C146 122 134 130 116 130 C134 118 140 94 132 76 C128 66 124 60 120 54Z', casaS);
    s += F('M62 78 C70 62 84 54 98 54 C84 60 74 70 68 84Z', casaL, .9);
    // espiral de verdad (radio que crece con el ángulo), adentro del caparazón
    let esp = '';
    for (let i = 0; i <= 60; i++) { const a = i / 60 * Math.PI * 4.2, r = 3 + i / 60 * 30; esp += (i ? 'L' : 'M') + (98 + Math.cos(a) * r).toFixed(1) + ' ' + (92 + Math.sin(a) * r * .9).toFixed(1); }
    s += T(esp, casaS, 4.2);
    // chal tejido sobre los hombros (con flequillo)
    s += S('M140 104 C150 96 168 94 180 100 C182 110 178 116 170 118 C160 118 148 116 140 112Z', chal, 3.5);
    s += T('M148 114 l-2 8 M156 116 l-1 8 M164 117 l0 8 M172 116 l2 7', chalS, 2.4);
    // cabeza
    s += S('M156 104 C150 82 160 66 176 66 C192 66 200 82 196 98 C194 108 186 114 176 114 C166 114 158 112 156 104Z', piel);
    s += F('M184 68 C196 74 200 88 196 98 C194 106 188 112 180 113 C190 104 192 86 184 68Z', pielS);
    // antenas con ojitos
    s += T('M168 70 C164 54 160 44 154 36', L, 6.5) + T('M168 70 C164 54 160 44 154 36', piel, 3.4);
    s += T('M184 68 C186 52 190 42 196 34', L, 6.5) + T('M184 68 C186 52 190 42 196 34', piel, 3.4);
    s += `<circle cx="153" cy="34" r="7" fill="${pielL}" stroke="${L}" stroke-width="3"/><circle cx="197" cy="32" r="7" fill="${pielL}" stroke="${L}" stroke-width="3"/>`;
    s += `<circle cx="154" cy="34" r="3.2" fill="${L}"/><circle cx="198" cy="32" r="3.2" fill="${L}"/><circle cx="155" cy="32.6" r="1.1" fill="#fff"/><circle cx="199" cy="30.6" r="1.1" fill="#fff"/>`;
    // anteojos redondos de abuela (en la cara, para leer las pistas)
    s += `<circle cx="170" cy="88" r="8" fill="#dfebd6" fill-opacity=".35" stroke="${L}" stroke-width="2.8"/><circle cx="188" cy="88" r="8" fill="#dfebd6" fill-opacity=".35" stroke="${L}" stroke-width="2.8"/>`;
    s += T('M178 88 h2', L, 2.8) + `<circle cx="170" cy="88" r="2.4" fill="${L}"/><circle cx="188" cy="88" r="2.4" fill="${L}"/>`;
    // boca y cachetes
    s += o.pose === 'habla' ? S('M172 101 Q179 110 186 101 Z', '#8a4f5a', 2.4) : T('M172 102 Q179 107 186 102', L, 2.6);
    s += `<ellipse cx="164" cy="99" rx="5" ry="3" fill="#e8907a" opacity=".45"/><ellipse cx="193" cy="99" rx="5" ry="3" fill="#e8907a" opacity=".45"/>`;
    // flor de ceibo chiquita en el caparazón
    s += `<g transform="translate(70 66) rotate(-30) scale(.42)">${S('M2 -6 C14 -14 26 -30 26 -48 C18 -42 10 -30 -1 -18Z', '#9e3346', 3)}${S('M-2 -8 C-16 -16 -26 -32 -20 -46 C-12 -44 -4 -34 -1 -22 C0 -16 0 -12 -2 -8Z', '#c9485b', 3)}</g>`;
    return `<svg viewBox="14 20 192 140" xmlns="http://www.w3.org/2000/svg">${s}</svg>`;
  }

  window.CBPersonajes = { donaLenta };
})();
