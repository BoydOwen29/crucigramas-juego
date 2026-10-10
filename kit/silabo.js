/* Word Wizard · Silabo, el maguito. Dibujo en SVG (fuente única: lo usan el juego y lab/).
   Cada función devuelve un string SVG. */
(function () {
  const L = '#16262c';
  const C = { hat: '#2f7f7a', hatSh: '#22605c', band: '#f2c66d', beard: '#f3f6ee', beardSh: '#c8d7cc', strand: '#a9bdb2',
    nose: '#e8907a', noseHi: '#f8c9b8', skin: '#efb39d', robe: '#34507a', robeSh: '#28405f', hem: '#f2c66d',
    starRobe: '#f2c66d', shoe: '#5b3f6e', wood: '#7a5a3c', star: '#fff1bf' };

  function estrella(cx, cy, r) {
    let d = '';
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .45 : r;
      d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rr).toFixed(1) + ' ' + (cy + Math.sin(a) * rr).toFixed(1);
    }
    return d + 'Z';
  }
  /* tonos planos derivados (técnica Ironhide: base, sombra y luz, sin degradados) */
  function mezclar(hex, otro, k) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(otro.slice(1), 16);
    const c = (sh) => Math.round(((a >> sh) & 255) * (1 - k) + ((b >> sh) & 255) * k);
    return '#' + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1);
  }
  const luz = (hex, k) => mezclar(hex, '#ffffff', k == null ? .22 : k);
  const somb = (hex, k) => mezclar(hex, '#16262c', k == null ? .22 : k);
  let idClip = 0;
  let P = false; // pulido activo durante el render
  const S = (d, fill, w) => `<path d="${d}" fill="${fill}" stroke="${L}" stroke-width="${w || 5.5}" stroke-linejoin="round" stroke-linecap="round"/>`;
  const F = (d, fill, op) => `<path d="${d}" fill="${fill}" ${op ? `opacity="${op}"` : ''}/>`;
  const est = (x, y, r, fill) => `<path d="${estrella(x, y, r)}" fill="${fill || C.starRobe}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>`;

  /* La varita crece con el progreso. etapa 0..3 */
  const ETAPAS = [
    { largo: 20, r: 6, nombre: 'Ramita', cuando: 'al empezar' },
    { largo: 32, r: 8, nombre: 'Varita', cuando: 'nivel 5' },
    { largo: 50, r: 11, nombre: 'Vara', cuando: 'nivel 10' },
    { largo: 84, r: 15, nombre: 'Báculo', cuando: 'nivel 20' },
  ];

  /* mano + varita: sale de la barba; el brazo casi no se ve */
  function manoVarita(hx, hy, etapa, angulo, escala) {
    const k = escala || 1, base = ETAPAS[etapa];
    const e = { largo: base.largo * k, r: base.r * Math.sqrt(k) };
    const a = (angulo == null ? -62 : angulo) * Math.PI / 180;
    const x2 = hx + Math.cos(a) * e.largo, y2 = hy + Math.sin(a) * e.largo;
    return `<g class="brazo" style="transform-origin:${hx}px ${hy}px">
      <path d="M${hx} ${hy} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${L}" stroke-width="8" stroke-linecap="round"/>
      <path d="M${hx} ${hy} L${x2.toFixed(1)} ${y2.toFixed(1)}" stroke="${C.wood}" stroke-width="3.6" stroke-linecap="round"/>
      ${P ? detalleVarita(hx, hy, x2, y2, e.largo) : ''}
      <circle class="glow" cx="${x2.toFixed(1)}" cy="${y2.toFixed(1)}" r="${e.r * 1.9}" fill="#fff6cf" opacity=".35"/>
      <path d="${estrella(x2, y2, e.r)}" fill="${C.star}" stroke="${L}" stroke-width="3" stroke-linejoin="round"/>
      ${P ? `<path d="${estrella(x2 - e.r * .1, y2 - e.r * .12, e.r * .42)}" fill="#ffffff"/>` : ''}
      <circle cx="${hx}" cy="${hy}" r="7.5" fill="${C.skin}" stroke="${L}" stroke-width="4.5"/>
      ${P ? `<circle cx="${hx - 2.2}" cy="${hy - 2.4}" r="2.2" fill="${luz(C.skin, .45)}"/>` : ''}</g>`;
  }

  function detalleVarita(hx, hy, x2, y2, largo) {
    const ux = (x2 - hx) / largo, uy = (y2 - hy) / largo, px = -uy, py = ux;
    const pt = (t, off) => [(hx + ux * t + px * off).toFixed(1), (hy + uy * t + py * off).toFixed(1)];
    const [a1, b1] = pt(5, -.9), [a2, b2] = pt(largo - 5, -.9);
    const nudos = [.45, .72].map((t) => { const [nx, ny] = pt(largo * t, 0); return `<circle cx="${nx}" cy="${ny}" r="1.6" fill="${somb(C.wood, .35)}"/>`; }).join('');
    const [g1, h1] = pt(8, 0), [g2, h2] = pt(14, 0);
    return `<path d="M${a1} ${b1} L${a2} ${b2}" stroke="${luz(C.wood, .3)}" stroke-width="1.3" stroke-linecap="round"/>${nudos}
      <path d="M${g1} ${h1} L${g2} ${h2}" stroke="${L}" stroke-width="7.5"/><path d="M${g1} ${h1} L${g2} ${h2}" stroke="${C.band}" stroke-width="4.2"/>`;
  }

  /* piecitos chiquitos, justo debajo del ruedo, con la puntita apenas enroscada */
  function piecitos(yHem, sep, tam) {
    const s = sep || 9, t = tam || 1;
    const uno = (x, d) => `<path d="M${x} ${yHem - 4} C${x + d * 2} ${yHem + 8} ${x - d * 6} ${yHem + 12} ${x - d * 15} ${yHem + 11} C${x - d * 21} ${yHem + 10} ${x - d * 23} ${yHem + 5} ${x - d * 21} ${yHem + 2} C${x - d * 19} ${yHem} ${x - d * 17} ${yHem + 2} ${x - d * 17} ${yHem + 4} C${x - d * 12} ${yHem + 5} ${x - d * 6} ${yHem + 2} ${x - d * 2} ${yHem - 4} Z" fill="${C.shoe}" stroke="${L}" stroke-width="4" stroke-linejoin="round"/>
      ${P ? `<path d="M${x - d * 3} ${yHem} C${x - d * 7} ${yHem + 4} ${x - d * 12} ${yHem + 5} ${x - d * 16} ${yHem + 4}" stroke="${luz(C.shoe, .3)}" stroke-width="2" stroke-linecap="round" fill="none"/>` : ''}
      <circle cx="${x - d * 20}" cy="${yHem + 1}" r="2.6" fill="${C.hem}" stroke="${L}" stroke-width="1.8"/>`;
    const esc = (x, svg) => `<g transform="translate(${x} ${yHem}) scale(${t}) translate(${-x} ${-yHem})">${svg}</g>`;
    return esc(100 - s, uno(100 - s, 1)) + esc(100 + s, uno(100 + s, -1));
  }

  /* túnica angosta en campana */
  function tunica(b, yTop, yHem) {
    if (P) {
      const forma = `M80 ${yTop} L120 ${yTop} C132 ${yTop + 26} ${100 + b - 6} ${yHem - 26} ${100 + b} ${yHem - 3} Q100 ${yHem + 7} ${100 - b} ${yHem - 3} C${100 - b + 6} ${yHem - 26} 68 ${yTop + 26} 80 ${yTop} Z`;
      const id = 'sbt' + (++idClip);
      return `${S(forma, C.robe)}<clipPath id="${id}"><path d="${forma}"/></clipPath>
        <path clip-path="url(#${id})" d="M60 ${yTop} L86 ${yTop} C78 ${yTop + 30} ${100 - b + 20} ${yHem - 30} ${100 - b + 18} ${yHem + 6} L${100 - b - 10} ${yHem + 6} Z" fill="${luz(C.robe, .14)}"/>
        ${F(`M110 ${yTop} L120 ${yTop} C132 ${yTop + 26} ${100 + b - 6} ${yHem - 26} ${100 + b} ${yHem - 3} Q${100 + b / 2} ${yHem + 3} 114 ${yHem + 2} C118 ${yHem - 30} 116 ${yTop + 30} 110 ${yTop} Z`, C.robeSh)}
        ${S(`M${100 - b + 2} ${yHem - 8} Q100 ${yHem + 2} ${100 + b - 2} ${yHem - 8} L${100 + b} ${yHem - 3} Q100 ${yHem + 7} ${100 - b} ${yHem - 3} Z`, C.hem, 4)}
        <path d="M${100 - b + 8} ${yHem - 6.5} Q100 ${yHem + .5} ${100 + b - 8} ${yHem - 6.5}" stroke="${luz(C.hem, .4)}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        ${est(100 - b + 16, yHem - 20, 5.5)}${est(100 + b - 14, yHem - 26, 4.5)}${est(100 - b + 28, yHem - 40, 4)}
        <circle cx="${100 + b - 22}" cy="${yHem - 44}" r="2" fill="${C.starRobe}"/><circle cx="${100 - b + 22}" cy="${yHem - 58}" r="1.6" fill="${C.starRobe}"/>`;
    }
    return `${S(`M80 ${yTop} L120 ${yTop} C132 ${yTop + 26} ${100 + b - 6} ${yHem - 26} ${100 + b} ${yHem - 3} Q100 ${yHem + 7} ${100 - b} ${yHem - 3} C${100 - b + 6} ${yHem - 26} 68 ${yTop + 26} 80 ${yTop} Z`, C.robe)}
      ${F(`M110 ${yTop} L120 ${yTop} C132 ${yTop + 26} ${100 + b - 6} ${yHem - 26} ${100 + b} ${yHem - 3} Q${100 + b / 2} ${yHem + 3} 114 ${yHem + 2} C118 ${yHem - 30} 116 ${yTop + 30} 110 ${yTop} Z`, C.robeSh)}
      ${S(`M${100 - b + 2} ${yHem - 8} Q100 ${yHem + 2} ${100 + b - 2} ${yHem - 8} L${100 + b} ${yHem - 3} Q100 ${yHem + 7} ${100 - b} ${yHem - 3} Z`, C.hem, 4)}
      ${est(100 - b + 16, yHem - 20, 5.5)}${est(100 + b - 14, yHem - 26, 4.5)}${est(100 - b + 28, yHem - 40, 4)}
      <circle cx="${100 + b - 22}" cy="${yHem - 44}" r="2" fill="${C.starRobe}"/>`;
  }

  /* barba de C2: punta barrida hacia adelante. redonda=true la hace más suave (más tierna) */
  function barba(y, ancho, redonda) {
    const a = ancho || 0;
    if (P && redonda) {
      const contorno = `M${54 - a} 118 C${44 - a} 158 ${54 - a} ${y - 6} 70 ${y - 2} Q77 ${y + 9} 86 ${y + 3} Q93 ${y + 11} 100 ${y + 5} Q107 ${y + 11} 114 ${y + 3} Q123 ${y + 9} 130 ${y - 2} C${146 + a} ${y - 6} ${156 + a} 158 ${146 + a} 118 Z`;
      const id = 'sbb' + (++idClip);
      const base = C.beard === BASE.beard ? '#eaf1e6' : C.beard;
      return `<g class="barba"><clipPath id="${id}"><path d="${contorno}"/></clipPath>${S(contorno, base)}
        <g clip-path="url(#${id})">
          <path d="M128 118 C142 150 140 ${y - 18} 122 ${y + 16} L172 ${y + 16} L172 118 Z" fill="${C.beardSh}"/>
          <path d="M40 118 C52 126 62 150 64 178 C58 152 54 134 40 130 Z" fill="#ffffff"/>
        </g>
        <path d="M78 156 C82 ${y - 30} 88 ${y - 16} 96 ${y - 6} M100 162 C100 ${y - 34} 104 ${y - 18} 112 ${y - 8} M121 156 C123 172 123 ${y - 26} 121 ${y - 14}" stroke="${somb(C.beardSh, .12)}" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>`;
    }
    const fondo = redonda
      ? `${70 - a} ${y + 4} 100 ${y + 4} C${130 + a} ${y + 4} ${156 + a} 160 ${146 + a} 118 Z`
      : `${54 - a} ${y - 30} 80 ${y - 6} C98 ${y + 6} 124 ${y + 8} 148 ${y - 2} C${136 + a} ${y - 14} ${144 + a} ${y - 50} ${146 + a} 118 Z`;
    return `<g class="barba">${S(`M${54 - a} 118 C${44 - a} 160 ` + fondo, C.beard)}
      ${redonda ? F(`M128 124 C140 160 136 ${y - 16} 112 ${y + 2} C132 ${y} ${146 + a} ${y - 30} ${146 + a} 120 Z`, C.beardSh)
        : F(`M126 124 C136 156 130 ${y - 40} 132 ${y - 4} C138 ${y - 2} 144 ${y - 2} 148 ${y - 2} C${136 + a} ${y - 14} ${144 + a} ${y - 50} ${146 + a} 120 Z`, C.beardSh)}
      <path d="M76 160 C80 ${y - 28} 88 ${y - 12} 102 ${y - 2} M110 166 C110 ${y - 32} 114 ${y - 16} 126 ${y - 8}" stroke="${C.strand}" stroke-width="3.6" stroke-linecap="round" fill="none"/></g>`;
  }

  function cara(cy, r) {
    if (P) {
      const id = 'sbn' + (++idClip);
      return `<g class="nariz"><clipPath id="${id}"><circle cx="98" cy="${cy}" r="${r}"/></clipPath><circle cx="98" cy="${cy}" r="${r}" fill="${C.nose}"/>
        <circle clip-path="url(#${id})" cx="${98 + r * .45}" cy="${cy + r * .5}" r="${r * .95}" fill="${somb(C.nose, .12)}"/>
        <circle cx="98" cy="${cy}" r="${r}" fill="none" stroke="${L}" stroke-width="5.5"/>
        <ellipse cx="${98 - r * .38}" cy="${cy - r * .38}" rx="${r * .3}" ry="${r * .22}" fill="${C.noseHi}"/><circle cx="${98 - r * .05}" cy="${cy - r * .58}" r="${r * .09}" fill="#ffffff"/></g>
        ${S(`M98 ${cy + 18} C86 ${cy + 9} 68 ${cy + 13} 63 ${cy + 25} C76 ${cy + 28} 88 ${cy + 25} 98 ${cy + 20} C108 ${cy + 25} 120 ${cy + 28} 133 ${cy + 25} C128 ${cy + 13} 110 ${cy + 9} 98 ${cy + 18} Z`, '#ffffff', 4.5)}
        <path d="M66 ${cy + 24} C61 ${cy + 22} 60 ${cy + 17} 64 ${cy + 15}" stroke="${L}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M130 ${cy + 24} C135 ${cy + 22} 136 ${cy + 17} 132 ${cy + 15}" stroke="${L}" stroke-width="3" stroke-linecap="round" fill="none"/>
        <path d="M108 ${cy + 22.5} C116 ${cy + 25} 124 ${cy + 26} 129 ${cy + 25}" stroke="${C.beardSh}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
    }
    return `<g class="nariz"><circle cx="98" cy="${cy}" r="${r}" fill="${C.nose}" stroke="${L}" stroke-width="5.5"/><ellipse cx="91" cy="${cy - 7}" rx="6" ry="4.5" fill="${C.noseHi}"/></g>
      ${S(`M98 ${cy + 18} C86 ${cy + 9} 68 ${cy + 13} 63 ${cy + 25} C76 ${cy + 28} 88 ${cy + 25} 98 ${cy + 20} C108 ${cy + 25} 120 ${cy + 28} 133 ${cy + 25} C128 ${cy + 13} 110 ${cy + 9} 98 ${cy + 18} Z`, C.beard, 4.5)}`;
  }

  const FORMAS = {
    gancho: { nombre: 'Gancho', cono: 'M46 114 C66 84 80 50 90 22 C96 8 114 4 126 14 C114 16 106 24 104 36 C110 66 128 90 152 114 Z', sombra: 'M104 36 C110 66 128 90 152 114 L124 114 C110 92 102 66 102 42 Z', estrella: [108, 70] },
    blando: { nombre: 'Punta blanda', cono: 'M48 114 C64 86 76 56 86 32 C92 16 112 8 126 18 C132 24 128 34 120 32 C112 30 106 34 104 42 C110 70 128 92 152 114 Z', sombra: 'M104 42 C110 70 128 92 152 114 L124 114 C110 94 102 70 102 48 Z', estrella: [108, 74] },
    cono: { nombre: 'Cono recto', cono: 'M48 114 C66 84 84 44 96 12 C98 5 104 5 106 12 C118 44 134 84 152 114 Z', sombra: 'M102 10 C114 44 132 84 152 114 L124 114 C112 84 104 48 102 18 Z', estrella: [100, 74] },
    dormilon: { nombre: 'Dormilón', cono: 'M48 114 C64 88 76 60 86 38 C96 16 124 6 146 14 C160 20 166 36 158 50 C154 40 146 34 136 34 C120 34 110 44 108 58 C112 82 130 100 152 114 Z', sombra: 'M108 58 C112 82 130 100 152 114 L126 114 C112 98 104 80 106 62 Z', estrella: [94, 82], pompon: [160, 52] },
  };
  function sombrero(rot, forma, ala) {
    const fm = FORMAS[forma] || (forma === true ? FORMAS.blando : FORMAS.gancho);
    const w = 60 * (ala || 1);
    const id = 'sbs' + (++idClip);
    const extra = P ? `<clipPath id="${id}"><path d="${fm.cono}"/></clipPath>
      <g clip-path="url(#${id})"><path d="M38 114 C60 80 76 44 90 2 L97 2 C88 40 76 80 66 114 Z" fill="${luz(C.hat, .2)}"/></g>
      <path d="M84 70 C92 74 104 74 112 68" stroke="${somb(C.hat, .28)}" stroke-width="2.6" stroke-linecap="round" fill="none"/>
      <g transform="rotate(12 124 88)"><rect x="116" y="80" width="15" height="12" rx="2" fill="${luz(C.hatSh, .12)}" stroke="${L}" stroke-width="2.4"/>
        <path d="M118 83 h11 M118 89 h11" stroke="${luz(C.hat, .45)}" stroke-width="1.3" stroke-dasharray="2 2"/></g>` : '';
    const bandaLuz = P ? `<path d="M56 101 C80 96 118 96 142 101" stroke="${luz(C.band, .45)}" stroke-width="2" stroke-linecap="round" fill="none"/>
      <rect x="92" y="100" width="12" height="13" rx="2" fill="${somb(C.band, .15)}" stroke="${L}" stroke-width="2.4"/><rect x="95.5" y="103.5" width="5" height="6" rx="1" fill="${C.band}"/>` : '';
    const alaLuz = P ? `<path d="M${100 - w + 10} 117 C${100 - w + 26} 110 90 109 106 109" stroke="${luz(C.hat, .3)}" stroke-width="2.6" stroke-linecap="round" fill="none"/>` : '';
    return `<g class="sombrero"><g transform="rotate(${rot} 100 118)">${S(fm.cono, C.hat)}${F(fm.sombra, C.hatSh)}${extra}
      ${fm.pompon ? `<circle cx="${fm.pompon[0]}" cy="${fm.pompon[1]}" r="7" fill="${C.band}" stroke="${L}" stroke-width="4"/>` : ''}
      ${est(fm.estrella[0], fm.estrella[1], 6.5, '#fff1bf')}
      ${S('M52 102 C78 96 120 96 146 102 L150 114 L48 114 Z', C.band, 4.5)}${bandaLuz}
      ${S(`M${100 - w} 120 C${100 - w + 18} 108 ${100 + w - 18} 108 ${100 + w} 120 C${100 + w - 18} 132 ${100 - w + 18} 132 ${100 - w} 120 Z`, C.hat)}
      ${alaLuz}</g></g>`;
  }


  const piso = (rx) => `<ellipse cx="100" cy="244" rx="${rx}" ry="6" fill="#0d1a1f" opacity=".28"/>`;
  const wrap = (inner) => `<svg viewBox="-10 -40 220 300" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  /* opciones: { tunica: ancho, barbaFin, redonda, rotSombrero, sombreroSuave, nariz, etapa, anguloVarita, aplastar } */
  const BASE = Object.assign({}, C);
  function mago(o) {
    Object.assign(C, BASE, o.colores || {});
    const yHem = 230, yTop = 150;
    P = !!o.pulido;
    const k = o.cabeza || 1;
    const cuerpo = `${piecitos(yHem, o.pies, o.tamPies)}${tunica(o.tunica || 56, yTop - (o.alturaTunica || 0), yHem)}
      <g transform="translate(100 ${yTop + 20}) scale(${k}) translate(-100 ${-(yTop + 20)})"><g class="cabeza"><path d="M136 172 C142 172 145 176 145 180" stroke="${L}" stroke-width="13" stroke-linecap="round" fill="none"/><path d="M136 172 C142 172 145 176 145 180" stroke="${C.robe}" stroke-width="6" stroke-linecap="round" fill="none"/>
      ${barba(o.barbaFin || 198, o.barbaAncho, o.redonda)}${manoVarita(145, 183, o.etapa || 0, o.anguloVarita, o.varita)}
      ${cara(o.narizY || 138, o.nariz || 20)}${P ? '<path d="M58 124 C80 129 120 129 142 124 C120 132 80 132 58 124 Z" fill="#16262c" opacity=".18"/>' : ''}${sombrero(o.rotSombrero == null ? -10 : o.rotSombrero, o.forma || o.sombreroSuave, o.ala)}</g></g>`;
    const esc = o.aplastar ? `<g transform="translate(100 240) scale(${o.aplastar[0]} ${o.aplastar[1]}) translate(-100 -240)">${cuerpo}</g>` : cuerpo;
    const out = wrap(`${piso(64)}<g class="cuerpo">${esc}</g>`);
    Object.assign(C, BASE);
    P = false;
    return out;
  }

  /* El maguito oficial (elegido por Owen en el taller, 08/10/2026) */
  const OFICIAL = { pulido: false, cabeza: .88, alturaTunica: 8, forma: 'cono', rotSombrero: -7, ala: 1.02, varita: 1.55, etapa: 1, anguloVarita: -60, tamPies: 1.6, tunica: 58, barbaFin: 197, redonda: true, nariz: 19 };
  /* La varita crece desde la elegida: cada etapa es (etapa base, escala) */
  const CRECIMIENTO = [
    { nombre: 'Varita', cuando: 'al empezar', etapa: 1, varita: 1.55 },
    { nombre: 'Varita larga', cuando: 'nivel 5', etapa: 1, varita: 2.4, angulo: -66 },
    { nombre: 'Vara', cuando: 'nivel 10', etapa: 2, varita: 2.1, angulo: -74 },
    { nombre: 'Báculo', cuando: 'nivel 20', etapa: 3, varita: 1.75, angulo: -84 },
  ];
  window.MagoLab = window.Silabo = { mago, ETAPAS, C, FORMAS, OFICIAL, CRECIMIENTO };
})();
