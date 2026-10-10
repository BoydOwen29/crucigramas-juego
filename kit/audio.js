/**
 * Word Wizard — audio chiptune sintetizado con WebAudio (sin archivos).
 * Efectos: tecla, acierto, error, combo, completa, nivel, tick, rango, moneda.
 * Música: orquestita sintetizada (celesta, flauta, pad, bajo, percusión suave y reverb)
 * con un tema por momento: menú (vals), juego (marcha) y jefe.
 */
(function () {
  'use strict';

  const Audio = {
    ctx: null,
    sonido: true,
    musica: true,
    _musicaOn: false,
    _ganMaster: null,
    _ganMusica: null,
    _timerMusica: null,

    init() {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this._ganMaster = this.ctx.createGain();
      this._ganMaster.gain.value = 0.5;
      this._comp = this.ctx.createDynamicsCompressor();
      this._comp.threshold.value = -14; this._comp.ratio.value = 3;
      this._ganMaster.connect(this._comp); this._comp.connect(this.ctx.destination);
      this._ganMusica = this.ctx.createGain();
      this._ganMusica.gain.value = this._volMusica.normal;
      this._ganMusica.connect(this._ganMaster);
      this._cadena();
    },

    /** Debe llamarse desde un gesto del usuario (click/tecla). */
    despertar() {
      this.init();
      // iOS: el contexto puede estar 'suspended' o 'interrupted' (llamada, Siri, bloqueo); un buffer mudo lo destraba
      if (this.ctx && this.ctx.state !== 'running') {
        try { const b = this.ctx.createBufferSource(); b.buffer = this.ctx.createBuffer(1, 1, 22050); b.connect(this.ctx.destination); b.start(0); } catch (e) { /* nada */ }
        const r = this.ctx.resume(); if (r && r.catch) r.catch(() => {});
      }
      if (this.musica && !this._musicaOn) this.iniciarMusica();
    },

    _nota(freq, t0, dur, tipo, vol, destino, desliz) {
      if (!this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = tipo || 'square';
      o.frequency.setValueAtTime(freq, t0);
      if (desliz) o.frequency.exponentialRampToValueAtTime(Math.max(20, desliz), t0 + dur);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(vol || 0.3, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g); g.connect(destino || this._ganMaster);
      o.start(t0); o.stop(t0 + dur + 0.02);
    },

    _secuencia(notas, tipo, vol, paso) {
      if (!this.sonido || !this.ctx) return;
      const t = this.ctx.currentTime;
      notas.forEach((f, i) => { if (f) this._nota(f, t + i * paso, paso * 1.6, tipo, vol); });
    },

    tecla() { if (this.sonido && this.ctx) this._nota(880, this.ctx.currentTime, 0.05, 'square', 0.08); },
    borrar() { if (this.sonido && this.ctx) this._nota(440, this.ctx.currentTime, 0.06, 'square', 0.07, null, 220); },
    mezclar() { this._secuencia([523, 659, 523, 659], 'triangle', 0.12, 0.05); },
    acierto(largo) {
      const base = 523 * Math.pow(1.0595, Math.min(12, (largo || 3) - 3) * 2);
      this._secuencia([base, base * 1.26, base * 1.5], 'square', 0.18, 0.07);
    },
    combo(n) { this._secuencia([659, 784, 988, 1319].map((f) => f * (1 + Math.min(n, 8) * 0.03)), 'square', 0.16, 0.06); },
    completa() { this._secuencia([523, 659, 784, 1047, 784, 1047, 1319, 1568], 'square', 0.2, 0.08); },
    error() { if (this.sonido && this.ctx) { const t = this.ctx.currentTime; this._nota(220, t, 0.18, 'sawtooth', 0.14, null, 110); this._nota(180, t + 0.1, 0.2, 'sawtooth', 0.12, null, 80); } },
    repetida() { this._secuencia([392, 330], 'triangle', 0.14, 0.09); },
    tick() { if (this.sonido && this.ctx) this._nota(1200, this.ctx.currentTime, 0.04, 'square', 0.1); },
    tiempoAgotado() { this._secuencia([392, 349, 311, 262], 'sawtooth', 0.18, 0.18); },
    rango() { this._secuencia([784, 988, 1175, 1568], 'triangle', 0.2, 0.09); },
    nivel() { this._secuencia([523, 659, 784, 1047, 0, 1047, 1319, 1568, 2093], 'square', 0.2, 0.09); },
    moneda() { this._secuencia([1319, 1760], 'square', 0.12, 0.05); },
    logro() { this._secuencia([659, 659, 784, 988, 1319], 'triangle', 0.2, 0.08); },
    vida() { this._secuencia([330, 262, 196], 'sawtooth', 0.16, 0.14); },
    poder() { this._secuencia([440, 554, 659, 880, 1109], 'triangle', 0.18, 0.05); },
    // Silabo
    risita() { this._secuencia([988, 1175, 988, 1319, 1175], 'triangle', 0.1, 0.055); },
    wiii() { if (this.sonido && this.ctx) this._nota(500, this.ctx.currentTime, 0.45, 'sine', 0.16, null, 1500); },
    boing() { if (this.sonido && this.ctx) { const t = this.ctx.currentTime; this._nota(220, t, 0.14, 'sine', 0.2, null, 520); this._nota(520, t + 0.14, 0.22, 'sine', 0.16, null, 260); } },
    achis() {
      if (!this.sonido || !this.ctx) return;
      const t = this.ctx.currentTime;
      this._nota(700, t, 0.25, 'sine', 0.08, null, 1100);
      if (!this._ruido) return;
      const s = this.ctx.createBufferSource(); s.buffer = this._ruido;
      const f = this.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.setValueAtTime(4200, t + 0.3); f.frequency.exponentialRampToValueAtTime(1800, t + 0.55); f.Q.value = 1.2;
      const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t + 0.3); g.gain.exponentialRampToValueAtTime(0.35, t + 0.33); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
      s.connect(f); f.connect(g); g.connect(this._ganMaster); s.start(t + 0.3); s.stop(t + 0.62);
    },
    trueno() {
      if (!this.sonido || !this.ctx || !this._ruido) return;
      const t = this.ctx.currentTime;
      const golpe = (t0, frec, vol, largo) => {
        const s = this.ctx.createBufferSource(); s.buffer = this._ruido; s.loop = true;
        const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(frec, t0); f.frequency.exponentialRampToValueAtTime(60, t0 + largo);
        const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.04); g.gain.exponentialRampToValueAtTime(0.0001, t0 + largo);
        s.connect(f); f.connect(g); g.connect(this._ganMaster); s.start(t0, Math.random() * .5); s.stop(t0 + largo + 0.05);
      };
      golpe(t, 2500, 0.25, 0.25); golpe(t + 0.15, 420, 0.55, 2.4); golpe(t + 0.7, 260, 0.35, 1.8);
    },
    ronquido() { if (this.sonido && this.ctx) this._nota(110, this.ctx.currentTime, 0.7, 'sine', 0.05, null, 80); },
    // ---- bichos del bosque (vida.js): todos suaves, son detalles
    /** Araña enojada: un refunfuño cortito, grr-grr. */
    grunon() {
      if (!this.sonido || !this.ctx) return;
      const t = this.ctx.currentTime;
      [0, 0.13, 0.26].forEach((d, i) => this._nota(190 - i * 18, t + d, 0.11, 'square', 0.05, null, 120 - i * 10));
    },
    /** Búho: uh-uuuh. */
    ulula() {
      if (!this.sonido || !this.ctx) return;
      const t = this.ctx.currentTime;
      this._nota(430, t, 0.22, 'sine', 0.12, null, 390); this._nota(450, t + 0.34, 0.5, 'sine', 0.12, null, 380);
    },
    /** Dragón lejano: soplido de fuego y un gruñido grave. */
    rugido() {
      if (!this.sonido || !this.ctx) return;
      const t = this.ctx.currentTime;
      this._nota(95, t, 0.9, 'sawtooth', 0.06, null, 55);
      if (!this._ruido) return;
      const s = this.ctx.createBufferSource(); s.buffer = this._ruido; s.loop = true;
      const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(1600, t); f.frequency.exponentialRampToValueAtTime(180, t + 1.1);
      const g = this.ctx.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.16, t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.1);
      s.connect(f); f.connect(g); g.connect(this._ganMaster); s.start(t, Math.random()); s.stop(t + 1.15);
    },
    /** Conejo: saltito. */
    salto() { if (this.sonido && this.ctx) this._nota(320, this.ctx.currentTime, 0.12, 'sine', 0.09, null, 760); },
    /** Caracol que se esconde: plop. */
    plop() { if (this.sonido && this.ctx) this._nota(640, this.ctx.currentTime, 0.14, 'sine', 0.1, null, 180); },
    /** Toque en el aire: chispitas. */
    chispa() {
      if (!this.sonido || !this.ctx) return;
      const t = this.ctx.currentTime, b = 1400 + Math.random() * 400;
      this._nota(b, t, 0.08, 'triangle', 0.035); this._nota(b * 1.5, t + 0.05, 0.1, 'triangle', 0.03);
    },
    /** Mariposas del conjuro de Silabo. */
    conjuro() { this._secuencia([784, 1047, 1319, 1568, 2093], 'triangle', 0.08, 0.06); },
    click() { if (this.sonido && this.ctx) this._nota(660, this.ctx.currentTime, 0.04, 'triangle', 0.1); },
    golpe() { if (this.sonido && this.ctx) { const t = this.ctx.currentTime; this._nota(160, t, 0.12, 'square', 0.18, null, 60); this._nota(90, t, 0.2, 'sawtooth', 0.14, null, 40); } },
    jefe() { this._secuencia([110, 0, 110, 0, 131, 0, 98, 0, 110, 110, 0, 0], 'sawtooth', 0.22, 0.12); },
    victoria() { this._secuencia([523, 659, 784, 1047, 0, 784, 1047, 1319, 0, 1047, 1319, 1568, 2093], 'square', 0.2, 0.09); },
    campana() { if (this.sonido && this.ctx) { const t = this.ctx.currentTime; this._nota(1568, t, 0.9, 'sine', 0.12); this._nota(2093, t + 0.02, 0.7, 'sine', 0.06); this._nota(1047, t + 0.25, 1.1, 'sine', 0.08); } },
    mision() { this._secuencia([784, 988, 1175, 988, 1568], 'triangle', 0.18, 0.07); },

    // ------------------------------------------------------------ música
    // Temas escritos a mano sobre una grilla de corcheas. Melodía: 'A4:2' = nota y duración en
    // pasos, 'r:2' = silencio. Acordes por compás. Cada estilo decide bajo, acompañamiento y percusión.
    TEMAS: {
      // Vals tranquilo en Re mayor: celesta, pizzicato y un colchón suave. Menú y título.
      menu: {
        bpm: 88, pasosCompas: 6, estilo: 'vals',
        acordes: ['D', 'Bm', 'G', 'A', 'D', 'Bm', 'Em', 'A', 'G', 'A', 'F#m', 'Bm', 'G', 'A', 'D', 'A7'],
        melodia: [
          'A4:2 D5:2 F#5:2', 'E5:3 D5:1 B4:2', 'D5:2 B4:2 G4:2', 'A4:4 r:2',
          'A4:2 D5:2 F#5:2', 'A5:3 G5:1 F#5:2', 'G5:2 E5:2 B4:2', 'E5:4 r:2',
          'B5:2 A5:2 G5:2', 'F#5:2 E5:2 C#5:2', 'A5:3 F#5:1 C#5:2', 'D5:4 r:2',
          'B4:2 D5:2 G5:2', 'F#5:2 E5:2 A4:2', 'D5:6', 'r:4 A4:1 C#5:1',
        ],
      },
      // Marcha alegre en La menor con marimba arpegiada. Desafío, Torre y práctica.
      juego: {
        bpm: 104, pasosCompas: 8, estilo: 'marcha',
        acordes: ['Am', 'F', 'C', 'G', 'Am', 'F', 'C', 'E', 'F', 'G', 'Em', 'Am', 'Dm', 'G', 'C', 'E'],
        melodia: [
          'E5:3 A5:1 G5:2 E5:2', 'F5:2 E5:2 C5:4', 'E5:3 G5:1 C6:2 B5:2', 'D5:4 B4:2 D5:2',
          'E5:3 A5:1 G5:2 E5:2', 'F5:2 A5:2 C6:4', 'B5:2 G5:2 E5:2 G5:2', 'G#5:6 r:2',
          'A5:2 C6:2 A5:2 F5:2', 'G5:2 B5:2 D6:4', 'E6:3 D6:1 B5:2 G5:2', 'A5:6 r:2',
          'F5:2 A5:2 D6:2 C6:2', 'B5:2 G5:2 D5:2 F5:2', 'E5:2 G5:2 C6:2 E6:2', 'B5:4 G#5:2 E5:2',
        ],
      },
      // Jefe: Re menor, ostinato de bajo, cuerdas cortadas y bronces.
      jefe: {
        bpm: 126, pasosCompas: 8, estilo: 'jefe',
        acordes: ['Dm', 'Dm', 'Bb', 'A', 'Dm', 'Dm', 'Gm', 'A'],
        melodia: [
          'D5:2 F5:2 A5:3 G5:1', 'F5:2 E5:2 D5:4', 'D5:2 F5:2 Bb5:3 A5:1', 'A5:4 C#5:4',
          'D5:2 F5:2 A5:3 C6:1', 'D6:4 A5:4', 'Bb5:2 A5:2 G5:2 Bb5:2', 'A5:6 E5:2',
        ],
      },
    },
    _tema: null,
    _rep: null,
    _tempo: 1,
    _tono: 0,
    _volMusica: { normal: 0.34, suave: 0.22 },

    _hz(m) { return 440 * Math.pow(2, (m - 69) / 12); },
    _midi(n) {
      const r = /^([A-G])(#|b)?(\d)$/.exec(n);
      if (!r) return null;
      const s = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0);
      return (Number(r[3]) + 1) * 12 + s;
    },
    _acorde(nombre) {
      const r = /^([A-G])(#|b)?(m7|m|7|dim|sus)?$/.exec(nombre);
      const raiz = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[r[1]] + (r[2] === '#' ? 1 : r[2] === 'b' ? -1 : 0);
      const iv = { m: [0, 3, 7], m7: [0, 3, 7, 10], 7: [0, 4, 7, 10], dim: [0, 3, 6], sus: [0, 5, 7] }[r[3]] || [0, 4, 7];
      const voces = iv.map((i) => { let n = 48 + raiz + i; while (n < 55) n += 12; while (n > 67) n -= 12; return n; }).sort((x, y) => x - y);
      return { raiz: 36 + ((raiz + 12) % 12), voces };
    },
    _compilar(T) {
      if (T._ok) return;
      T._acordes = T.acordes.map((a) => this._acorde(a));
      T._melodia = T.melodia.map((compas) => {
        const ev = []; let p = 0;
        for (const tok of compas.split(/\s+/)) {
          const [n, d] = tok.split(':'); const dur = Number(d) || 1;
          if (n !== 'r') ev.push({ paso: p, midi: this._midi(n), dur });
          p += dur;
        }
        return ev;
      });
      T._ok = true;
    },

    /** Cadena de la música: un bus por tema → música → master, más una reverb compartida. */
    _cadena() {
      if (this._reverb || !this.ctx) return;
      const c = this.ctx, sr = c.sampleRate, largo = Math.floor(sr * 1.8);
      const imp = c.createBuffer(2, largo, sr);
      for (let ch = 0; ch < 2; ch++) {
        const d = imp.getChannelData(ch);
        for (let i = 0; i < largo; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / largo, 3.2);
      }
      this._reverb = c.createConvolver(); this._reverb.buffer = imp;
      this._ganReverb = c.createGain(); this._ganReverb.gain.value = 0.32;
      this._reverb.connect(this._ganReverb); this._ganReverb.connect(this._ganMusica);
      const ruido = c.createBuffer(1, sr, sr), nd = ruido.getChannelData(0);
      for (let i = 0; i < sr; i++) nd[i] = Math.random() * 2 - 1;
      this._ruido = ruido;
    },

    // ---- instrumentos (cada nota crea sus nodos y se suelta sola)
    _env(g, t, ataque, pico, fin) {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(pico, t + ataque);
      g.gain.exponentialRampToValueAtTime(0.0001, t + fin);
    },
    _osc(tipo, f, t, fin, destino, detune) {
      const o = this.ctx.createOscillator(); o.type = tipo; o.frequency.setValueAtTime(f, t);
      if (detune) o.detune.setValueAtTime(detune, t);
      o.connect(destino); o.start(t); o.stop(t + fin + 0.05);
      return o;
    },
    _salida(bus, humedo) {
      const g = this.ctx.createGain(); g.connect(bus);
      if (humedo && this._reverb) { const s = this.ctx.createGain(); s.gain.value = humedo; g.connect(s); s.connect(this._reverb); }
      return g;
    },
    celesta(m, t, dur, vol, bus) {
      const f = this._hz(m), fin = Math.max(0.9, dur * 1.6);
      const g = this._salida(bus, 0.55); this._env(g, t, 0.004, vol, fin);
      this._osc('sine', f, t, fin, g);
      const g2 = this.ctx.createGain(); g2.connect(g); this._env(g2, t, 0.002, 0.22, 0.3); this._osc('sine', f * 4, t, 0.3, g2);
      const g3 = this.ctx.createGain(); g3.gain.value = 0.12; g3.connect(g); this._osc('triangle', f * 2, t, fin, g3);
    },
    flauta(m, t, dur, vol, bus) {
      const f = this._hz(m), fin = dur + 0.18;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
      const g = this._salida(bus, 0.45); lp.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.06);
      g.gain.setValueAtTime(vol * 0.85, t + Math.max(0.07, dur - 0.04)); g.gain.exponentialRampToValueAtTime(0.0001, t + fin);
      const o = this._osc('triangle', f, t, fin, lp);
      const g2 = this.ctx.createGain(); g2.gain.value = 0.18; g2.connect(lp); const o2 = this._osc('sine', f * 2, t, fin, g2);
      if (dur > 0.25) {
        const lfo = this.ctx.createOscillator(), lg = this.ctx.createGain(); lfo.frequency.value = 5.4;
        lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.007, t + 0.3);
        lfo.connect(lg); lg.connect(o.frequency); lg.connect(o2.frequency); lfo.start(t); lfo.stop(t + fin + 0.05);
      }
    },
    bronce(m, t, dur, vol, bus) {
      const f = this._hz(m), fin = dur + 0.12;
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 2;
      lp.frequency.setValueAtTime(500, t); lp.frequency.exponentialRampToValueAtTime(2400, t + 0.06); lp.frequency.exponentialRampToValueAtTime(1100, t + 0.3);
      const g = this._salida(bus, 0.35); lp.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.03);
      g.gain.setValueAtTime(vol * 0.8, t + Math.max(0.04, dur - 0.03)); g.gain.exponentialRampToValueAtTime(0.0001, t + fin);
      this._osc('sawtooth', f, t, fin, lp, -6); this._osc('sawtooth', f, t, fin, lp, 6);
    },
    pad(voces, t, dur, vol, bus, brillo) {
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = brillo || 750; lp.Q.value = 0.4;
      const g = this._salida(bus, 0.6); lp.connect(g);
      const at = Math.min(0.5, dur * 0.3), fin = dur + 0.6;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + at);
      g.gain.setValueAtTime(vol, t + dur); g.gain.exponentialRampToValueAtTime(0.0001, t + fin);
      for (const m of voces) { const f = this._hz(m); this._osc('sawtooth', f, t, fin, lp, -9); this._osc('sawtooth', f, t, fin, lp, 9); }
    },
    pizz(voces, t, vol, bus) {
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1700;
      const g = this._salida(bus, 0.4); lp.connect(g); this._env(g, t, 0.003, vol, 0.32);
      for (const m of voces) this._osc('triangle', this._hz(m), t, 0.32, lp);
    },
    marimba(m, t, vol, bus) {
      const f = this._hz(m);
      const g = this._salida(bus, 0.25); this._env(g, t, 0.003, vol, 0.42);
      this._osc('sine', f, t, 0.42, g);
      const g2 = this.ctx.createGain(); g2.connect(g); this._env(g2, t, 0.002, 0.35, 0.06); this._osc('sine', f * 3.9, t, 0.06, g2);
    },
    cuerdas(voces, t, vol, bus) {
      const lp = this.ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
      const g = this._salida(bus, 0.3); lp.connect(g); this._env(g, t, 0.01, vol, 0.2);
      for (const m of voces) this._osc('sawtooth', this._hz(m + 12), t, 0.2, lp);
    },
    bajo(m, t, dur, vol, bus) {
      const f = this._hz(m), fin = dur + 0.08;
      const g = this._salida(bus, 0); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.012);
      g.gain.exponentialRampToValueAtTime(vol * 0.5, t + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, t + fin);
      this._osc('sine', f, t, fin, g);
      const g2 = this.ctx.createGain(); g2.gain.value = 0.35; g2.connect(g); this._osc('triangle', f * 2, t, fin, g2);
    },
    bombo(t, vol, bus) {
      const g = this._salida(bus, 0); this._env(g, t, 0.004, vol, 0.22);
      const o = this._osc('sine', 130, t, 0.22, g); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
    },
    tom(t, vol, bus, f) {
      const g = this._salida(bus, 0.2); this._env(g, t, 0.004, vol, 0.28);
      const o = this._osc('sine', f || 160, t, 0.28, g); o.frequency.exponentialRampToValueAtTime((f || 160) * 0.55, t + 0.25);
    },
    _ruidoCorto(t, vol, bus, tipo, frec, largo, q) {
      if (!this._ruido) return;
      const s = this.ctx.createBufferSource(); s.buffer = this._ruido;
      const fl = this.ctx.createBiquadFilter(); fl.type = tipo; fl.frequency.value = frec; if (q) fl.Q.value = q;
      const g = this._salida(bus, 0.1); this._env(g, t, 0.002, vol, largo);
      s.connect(fl); fl.connect(g); s.start(t, Math.random() * 0.5); s.stop(t + largo + 0.02);
    },
    maraca(t, vol, bus) { this._ruidoCorto(t, vol, bus, 'highpass', 7000, 0.045); },
    aro(t, vol, bus) { this._ruidoCorto(t, vol, bus, 'bandpass', 1900, 0.07, 2.2); },

    /** Toca un paso (una corchea) del tema que suena. */
    _tocarPaso(r, t, dp) {
      const T = r.tema, P = T.pasosCompas, total = T.acordes.length * P;
      const i = r.paso % total, compas = Math.floor(i / P), s = i % P, vuelta = Math.floor(r.paso / total);
      const ac = T._acordes[compas], k = this._tono, bus = r.bus;
      const voces = ac.voces.map((n) => n + k), raiz = ac.raiz + k;
      // melodía (en el juego se alternan flauta y celesta, y cada tercera vuelta descansa)
      for (const ev of T._melodia[compas]) {
        if (ev.paso !== s) continue;
        const d = ev.dur * dp, m = ev.midi + k;
        if (T.estilo === 'vals') this.celesta(m, t, d, 0.2, bus);
        else if (T.estilo === 'marcha') { if (vuelta % 3 === 2) continue; if (vuelta % 3 === 0) this.flauta(m, t, d, 0.13, bus); else this.celesta(m, t, d, 0.17, bus); }
        else this.bronce(m - 12, t, d, 0.075, bus);
      }
      if (T.estilo === 'vals') {
        if (s === 0) { this.bajo(raiz, t, dp * 2, 0.3, bus); this.pad(voces, t, dp * P, 0.03, bus, 650); }
        if (s === 2 || s === 4) this.pizz(voces, t, 0.05, bus);
        if (s === 5 && compas % 4 === 3) this.celesta(voces[voces.length - 1] + 12, t, dp, 0.06, bus);
      } else if (T.estilo === 'marcha') {
        const arp = [0, 1, 2, 1, 2, 0, 1, 2], oct = [0, 0, 0, 12, 12, 12, 0, 0];
        this.marimba(voces[arp[s] % voces.length] + oct[s], t, 0.1, bus);
        if (s === 0) { this.pad(voces, t, dp * P, 0.022, bus, 900); this.bajo(raiz, t, dp * 3, 0.32, bus); }
        if (s === 3) this.bajo(raiz, t, dp, 0.22, bus);
        if (s === 4) this.bajo(raiz + 7, t, dp * 2, 0.26, bus);
        if (s === 6) this.bajo(raiz + 12, t, dp, 0.22, bus);
        if (s === 0 || s === 4) this.bombo(t, 0.32, bus);
        if (s === 2 || s === 6) this.aro(t, 0.05, bus);
        this.maraca(t, s % 2 ? 0.03 : 0.018, bus);
      } else {
        this.bajo(raiz + (s % 2 ? 12 : 0), t, dp * 0.9, 0.3, bus);
        if (s === 0) this.pad(voces.map((n) => n - 12), t, dp * P, 0.025, bus, 500);
        if (s === 2 || s === 5 || s === 7) this.cuerdas(voces, t, 0.035, bus);
        if (s === 0 || s === 3 || s === 4) this.bombo(t, 0.34, bus);
        if (compas % 2 === 1 && s >= 6) this.tom(t, 0.22, bus, s === 6 ? 180 : 130);
        if (s % 2 === 1) this.maraca(t, 0.025, bus);
      }
    },

    /** Cambia el tema con un fundido corto. nombre: 'menu' | 'juego' | 'jefe'. */
    tema(nombre) {
      if (!this.TEMAS[nombre]) return;
      this._tema = nombre;
      if (!this.ctx || !this._musicaOn) return;
      if (this._rep && this._rep.nombre === nombre) return;
      const c = this.ctx, t = c.currentTime;
      if (this._rep) { const b = this._rep.bus; b.gain.setTargetAtTime(0.0001, t, 0.25); setTimeout(() => b.disconnect(), 2500); }
      const T = this.TEMAS[nombre]; this._compilar(T);
      const bus = c.createGain(); bus.gain.setValueAtTime(0.0001, t); bus.gain.exponentialRampToValueAtTime(1, t + 0.8); bus.connect(this._ganMusica);
      this._rep = { nombre, tema: T, bus, paso: 0, siguiente: t + 0.12 };
    },

    iniciarMusica() {
      if (!this.ctx || this._musicaOn) return;
      this._cadena();
      this._musicaOn = true;
      this._rep = null;
      this.tema(this._tema || 'menu');
      const programar = () => {
        if (!this._musicaOn) return;
        const r = this._rep;
        if (r) {
          const dp = 60 / (r.tema.bpm * this._tempo) / 2;
          if (r.siguiente < this.ctx.currentTime) r.siguiente = this.ctx.currentTime + 0.05; // volvimos de una pausa
          while (r.siguiente < this.ctx.currentTime + 0.3) { this._tocarPaso(r, r.siguiente, dp); r.siguiente += dp; r.paso++; }
        }
        this._timerMusica = setTimeout(programar, 90);
      };
      programar();
    },

    pararMusica() {
      this._musicaOn = false;
      if (this._timerMusica) clearTimeout(this._timerMusica);
      if (this._rep) { const b = this._rep.bus; b.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08); setTimeout(() => b.disconnect(), 800); this._rep = null; }
    },

    /** Apuro: la música acelera un poco (últimos segundos). */
    setTempo(rapido) { this._tempo = rapido ? 1.14 : 1; },
    /** Transpone el tema del juego según el lugar de la Torre y cambia cuánto eco tiene. */
    lugar(id) {
      this._tono = { cueva: -2, biblioteca: 0, cumbre: 3, cielo: 5 }[id] || 0;
      if (this._ganReverb) this._ganReverb.gain.setTargetAtTime(id === 'cueva' ? 0.55 : id === 'cielo' ? 0.42 : 0.32, this.ctx.currentTime, 0.4);
    },

    setMusica(on) {
      this.musica = on;
      if (on) this.despertar(); else this.pararMusica();
    },
    setSonido(on) { this.sonido = on; },
    /** Pausa todo el audio cuando la pestaña queda en segundo plano y lo retoma al volver. */
    vigilarVisibilidad() {
      document.addEventListener('visibilitychange', () => {
        if (!this.ctx) return;
        if (document.hidden) this.ctx.suspend(); else { const r = this.ctx.resume(); if (r && r.catch) r.catch(() => {}); }
      });
      window.addEventListener('pagehide', () => { if (this.ctx) this.ctx.suspend(); });
    },
    musicaSuave(suave) { if (this._ganMusica) this._ganMusica.gain.setTargetAtTime(suave ? this._volMusica.suave : this._volMusica.normal, this.ctx.currentTime, 0.3); },
  };

  window.WWAudio = Audio;
})();
