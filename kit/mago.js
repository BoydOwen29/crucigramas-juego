/**
 * Word Wizard — Silabo en el juego. Usa el dibujo oficial de silabo.js y le suma vida:
 * respira, olfatea, gestos en reposo, poses (cast / happy / sad), chispas, la varita
 * que crece con el nivel y se estira con el combo, y paletas (skins) desbloqueables.
 * v2.3: mira hacia lo que tocás, reacciona cuando lo tocás, se duerme si no jugás,
 * se pone nervioso con el reloj y levita con combo alto.
 */
(function () {
  'use strict';
  const D = window.Silabo;

  // Paletas desbloqueables por nivel (las claves se mantienen por compatibilidad con perfiles guardados)
  const PALETAS = {
    turquesa:  { nombre: 'Clásico', nivel: 1, c: {} },
    esmeralda: { nombre: 'Bosque', nivel: 3, c: { hat: '#4f7a3a', hatSh: '#3b5d2b', robe: '#6b4a2f', robeSh: '#543a24', shoe: '#2f4a3a', band: '#e0b25a', hem: '#e0b25a', starRobe: '#e0b25a' } },
    purpura:   { nombre: 'Ocaso', nivel: 5, c: { hat: '#8a4f8f', hatSh: '#6b3a70', robe: '#c46a4a', robeSh: '#a2553a', shoe: '#3f2a4a', band: '#ffd28a', hem: '#ffd28a', starRobe: '#ffe2a8' } },
    rubi:      { nombre: 'Real', nivel: 8, c: { hat: '#3a3f8f', hatSh: '#2b2f70', robe: '#8f2f4a', robeSh: '#70233a', shoe: '#1f2347', band: '#f5d06b', hem: '#f5d06b', starRobe: '#f5d06b' } },
    dorado:    { nombre: 'Dorado', nivel: 12, c: { hat: '#d9a441', hatSh: '#b4842c', robe: '#2c4d58', robeSh: '#223d46', shoe: '#1c2f38', band: '#fff1bf', hem: '#fff1bf', starRobe: '#fff1bf' } },
    arcoiris:  { nombre: 'Bruma', nivel: 16, c: { hat: '#dfebd6', hatSh: '#bbd0b9', robe: '#67948f', robeSh: '#557d79', shoe: '#2c4d58', band: '#e8907a', hem: '#e8907a', starRobe: '#f3f6ee' } },
    // reservada para los jefes de la Torre
    sombra:    { nombre: 'Sombra', nivel: 999, c: { hat: '#2a2f45', hatSh: '#1b1f30', robe: '#3a2346', robeSh: '#2a1834', shoe: '#14111f', band: '#ff5c7a', hem: '#ff5c7a', starRobe: '#ff8fa3', nose: '#b8a4c9', noseHi: '#d8cbe3', beard: '#cfd2e0', beardSh: '#a3a8bd', star: '#ff8fa3' } },
  };

  /** Etapa de la varita según el nivel del jugador (0..3). */
  function etapaPorNivel(n) { return n >= 20 ? 3 : n >= 10 ? 2 : n >= 5 ? 1 : 0; }

  class Mago {
    constructor(cont, opts) {
      opts = opts || {};
      this.cont = cont;
      cont.classList.add('mago');
      this.paleta = 'turquesa';
      this.etapa = 0;
      this.combo = 0;
      this.estado = 'idle';
      this.visible = true;
      this._timer = null;
      this._comboTimer = null;
      cont.innerHTML = '<div class="mago-dibujo"></div><div class="mago-chispas"></div>';
      this.dibujo = cont.querySelector('.mago-dibujo');
      this.chispasCont = cont.querySelector('.mago-chispas');
      if (opts.paleta) this.paleta = opts.paleta;
      if (opts.etapa != null) this.etapa = opts.etapa;
      this.render();
      this._programarNariz();
      this._programarFidget();
    }

    render() {
      const e = D.CRECIMIENTO[this.etapa] || D.CRECIMIENTO[0];
      const estirar = 1 + Math.min(this.combo, 8) * 0.07;
      const o = Object.assign({}, D.OFICIAL, {
        etapa: e.etapa, varita: e.varita * estirar, anguloVarita: e.angulo || D.OFICIAL.anguloVarita,
        colores: (PALETAS[this.paleta] || PALETAS.turquesa).c,
      });
      this.dibujo.innerHTML = D.mago(o);
      this.nariz = this.dibujo.querySelector('.nariz');
      this.cabeza = this.dibujo.querySelector('.cabeza');
      this.punta = this.dibujo.querySelector('.glow');
      this.cont.classList.toggle('en-combo', this.combo >= 3);
      this.cont.classList.toggle('levita', this.combo >= 5);
    }

    setPaleta(nombre) { if (nombre === this.paleta) return; this.paleta = PALETAS[nombre] ? nombre : 'turquesa'; this.render(); }
    setNivel(n) { const e = etapaPorNivel(n); if (e !== this.etapa) { this.etapa = e; this.render(); } }
    setEtapa(e) { this.etapa = Math.max(0, Math.min(3, e)); this.render(); }

    /** El combo estira la varita un rato; se encoge sola si no hay aciertos. */
    setCombo(n) {
      const antes = this.combo;
      this.combo = Math.max(0, n);
      if (this.combo !== antes) this.render();
      clearTimeout(this._comboTimer);
      if (this.combo > 0) this._comboTimer = setTimeout(() => { this.combo = 0; this.render(); }, 6500);
    }

    /** Gira la cabeza hacia un punto de la pantalla y vuelve sola al rato. */
    mirar(x, y) {
      if (!this.visible || !this.cabeza || this.estado === 'dormido') return;
      const r = this.cont.getBoundingClientRect();
      if (!r.width) return;
      const dx = Math.max(-1, Math.min(1, (x - (r.left + r.width / 2)) / 200));
      const dy = Math.max(-1, Math.min(1, (y - (r.top + r.height * .4)) / 260));
      this.cabeza.style.transform = `translate(${(dx * 6).toFixed(1)}px, ${(dy * 4).toFixed(1)}px) rotate(${(dx * 8).toFixed(1)}deg)`;
      clearTimeout(this._mirarT);
      this._mirarT = setTimeout(() => { if (this.cabeza) this.cabeza.style.transform = ''; }, 2400);
    }

    /** Punto de la pantalla donde está la estrella de la varita (de ahí salen los hechizos). */
    puntaVarita() {
      const el = this.punta || this.cont, r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }

    /** Golpecito de varita (al elegir una letra). */
    flick() {
      if (this.estado !== 'idle') return;
      this.cont.classList.remove('flick'); void this.cont.offsetWidth; this.cont.classList.add('flick');
      clearTimeout(this._flickT); this._flickT = setTimeout(() => this.cont.classList.remove('flick'), 260);
    }

    /** Reacción cuando lo tocan. Devuelve cuál hizo para que el juego le ponga texto y sonido. */
    toque() {
      if (this.estado === 'dormido') { this.despertar(); return 'despierta'; }
      const opciones = ['risa', 'giro', 'estornudo', 'sombrerazo'].filter((o) => o !== this._ultimoToque);
      const r = opciones[Math.floor(Math.random() * opciones.length)];
      this._ultimoToque = r;
      this.animar(r, r === 'estornudo' ? 1100 : 900);
      if (r === 'estornudo') setTimeout(() => this.chispas(22, .46, .5), 380);
      else if (r === 'giro') this.chispas(14, .5, .55);
      else if (r === 'risa') this.chispas(6, .5, .3);
      return r;
    }

    dormir() {
      if (this.estado !== 'idle' || !this.visible) return;
      this.estado = 'dormido'; this.cont.classList.add('dormido');
      if (this.cabeza) this.cabeza.style.transform = '';
      const z = () => {
        if (this.estado !== 'dormido') return;
        const e = document.createElement('span'); e.className = 'zzz'; e.textContent = 'z';
        e.style.left = (58 + Math.random() * 10) + '%'; this.chispasCont.appendChild(e);
        setTimeout(() => e.remove(), 2600);
        this._zzzT = setTimeout(z, 1300);
      };
      z();
    }
    despertar() {
      if (this.estado !== 'dormido') return;
      clearTimeout(this._zzzT);
      this.cont.classList.remove('dormido'); this.estado = 'idle';
      this.animar('sombrerazo', 800);
    }

    nervioso(on) { this.cont.classList.toggle('nervioso', !!on); }

    _programarNariz() {
      setTimeout(() => {
        if (this.visible && this.estado === 'idle' && this.nariz && this.nariz.animate) {
          this.nariz.animate([
            { transform: 'translate(0,0) scale(1)' }, { transform: 'translate(-2px,1px) scale(1.07,.93)' },
            { transform: 'translate(2px,1px) scale(1.07,.93)' }, { transform: 'translate(0,0) scale(1)' },
          ], { duration: 420, easing: 'ease-in-out' });
        }
        this._programarNariz();
      }, 2500 + Math.random() * 3500);
    }

    _programarFidget() {
      setTimeout(() => {
        if (this.visible && this.estado === 'idle') {
          const g = Math.random() < 0.5 ? 'fidget' : 'saludo';
          this.cont.classList.add(g);
          if (g === 'fidget') this.chispas(5, 0.82, 0.42);
          setTimeout(() => this.cont.classList.remove(g), 1100);
        }
        this._programarFidget();
      }, 6000 + Math.random() * 7000);
    }

    animar(estado, ms) {
      clearTimeout(this._timer);
      if (this.estado === 'dormido') { clearTimeout(this._zzzT); this.cont.classList.remove('dormido'); }
      this.cont.classList.remove('cast', 'happy', 'sad', 'risa', 'giro', 'estornudo', 'sombrerazo', 'gira', 'saludo', 'fidget', 'flick');
      void this.cont.offsetWidth;
      this.estado = estado;
      this.cont.classList.add(estado);
      if (estado === 'cast') setTimeout(() => this.chispas(12, 0.82, 0.38), 140);
      if (estado === 'happy') { this.chispas(20, 0.5, 0.3); setTimeout(() => this.chispas(14, 0.5, 0.25), 300); }
      this._timer = setTimeout(() => { this.cont.classList.remove(estado); this.estado = 'idle'; }, ms || 700);
    }

    chispas(n, px, py) {
      const W = this.cont.clientWidth, H = this.cont.clientHeight;
      const colores = ['#fff1bf', '#dfebd6', '#f2c66d', '#ffffff', '#bbd0b9'];
      for (let i = 0; i < n; i++) {
        const s = document.createElement('span');
        s.className = 'chispa';
        const tam = 3 + Math.random() * 5;
        s.style.cssText = `left:${px * W}px;top:${py * H}px;width:${tam}px;height:${tam}px;background:${colores[i % colores.length]}`;
        this.chispasCont.appendChild(s);
        const a = Math.random() * Math.PI * 2, d = 22 + Math.random() * 50;
        s.animate([
          { transform: 'translate(-50%,-50%) scale(0)', opacity: 1 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d * .4}px), calc(-50% + ${Math.sin(a) * d * .4}px)) scale(1.3)`, opacity: 1, offset: .3 },
          { transform: `translate(calc(-50% + ${Math.cos(a) * d}px), calc(-50% + ${Math.sin(a) * d + 16}px)) scale(0)`, opacity: 0 },
        ], { duration: 550 + Math.random() * 400, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
      }
    }
  }

  window.WWMago = { Mago, PALETAS, etapaPorNivel };
})();
