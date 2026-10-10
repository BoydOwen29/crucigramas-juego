/**
 * Crucigramas del Bosque — pantallas, partida del día y progreso.
 *
 * Un crucigrama por día, igual para todos: el número sale de la fecha (día 1 = 10/10/2026), el tema de una
 * rotación fija y la grilla del generador con esa semilla. El progreso queda en localStorage.
 */
(function () {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const Audio = window.WWAudio, CB = window.CB;
  const VERSION = '1.0.0';
  const INICIO = new Date(2026, 9, 10);
  const AYUDAS_POR_DIA = 3;
  const TECLAS = ['QWERTYUIOP', 'ASDFGHJKLÑ', 'ZXCVBNM'];
  const azar = (a) => a[Math.floor(Math.random() * a.length)];

  // ------------------------------------------------------------ guardado
  const LS = 'cb.perfil.v1';
  const perfil = (() => {
    let p = null;
    try { p = JSON.parse(localStorage.getItem(LS)); } catch (e) { /* sin almacenamiento */ }
    return Object.assign({ racha: 0, mejorRacha: 0, ultimo: null, jugados: 0, resueltos: {}, enCurso: null, musica: true }, p || {});
  })();
  const guardar = () => { try { localStorage.setItem(LS, JSON.stringify(perfil)); } catch (e) { /* sin almacenamiento */ } };

  // ------------------------------------------------------------ el crucigrama del día
  const claveDia = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const numeroDia = (d) => Math.floor((new Date(d.getFullYear(), d.getMonth(), d.getDate()) - INICIO) / 86400000) + 1;
  function delDia(d) {
    const numero = Math.max(1, numeroDia(d));
    const temas = window.CB_TEMAS.es;
    // rotación fija y mezclada: dos días seguidos nunca tienen el mismo tema
    const orden = temas.map((t, i) => i).sort((a, b) => ((a * 7919) % 13) - ((b * 7919) % 13) || a - b);
    const tema = temas[orden[(numero - 1) % temas.length]];
    const grilla = CB.libre(tema.palabras, { semilla: numero * 31 + 7, cuantas: 8, ancho: 9, alto: 11, intentos: 250 });
    return { numero, tema, grilla, fecha: claveDia(d) };
  }
  const dosDigitos = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  // ------------------------------------------------------------ app
  const App = {
    hoy: null, partida: null, magos: {},

    iniciar() {
      this.hoy = delDia(new Date());
      if (window.WWEscena) { WWEscena.montar($('esc-atras'), $('esc-frente'), 'bosque'); }
      this.magos.inicio = new WWMago.Mago($('mago-inicio'), { paleta: 'turquesa', etapa: 1 });
      this.magos.juego = new WWMago.Mago($('mago-juego'), { paleta: 'turquesa', etapa: 1 });
      $('logo-fichas').innerHTML = 'CRUCIGRAMAS'.split('').map((l, i) => `<i style="--i:${i};--r:${[-4, 3, -2, 4, -3, 2, -4, 3, -2, 4, -3][i]}deg">${l}</i>`).join('');
      // audio: se destraba con el primer toque (iOS) y la música respeta lo que eligió el jugador
      const destrabar = () => { if (!Audio.ctx || Audio.ctx.state !== 'running') { Audio.despertar(); Audio.setMusica(perfil.musica); } };
      for (const ev of ['touchend', 'click', 'keydown']) document.addEventListener(ev, destrabar, { passive: true, capture: true });
      if (Audio.vigilarVisibilidad) Audio.vigilarVisibilidad();
      $('btn-musica').classList.toggle('apagado', !perfil.musica);
      $('btn-musica').addEventListener('click', () => { perfil.musica = !perfil.musica; guardar(); Audio.setMusica(perfil.musica); $('btn-musica').classList.toggle('apagado', !perfil.musica); });
      $('btn-ayuda').addEventListener('click', () => { Audio.click(); this.ayuda(); });
      $('btn-jugar').addEventListener('click', () => { Audio.click(); this.jugar(); });
      $('btn-ranking').addEventListener('click', () => { Audio.click(); this.ranking(); });
      $('btn-volver').addEventListener('click', () => { Audio.click(); this.salir(); });
      $('mago-inicio').addEventListener('pointerdown', () => { const r = this.magos.inicio.toque(); ({ risa: () => Audio.risita(), giro: () => Audio.wiii(), estornudo: () => Audio.achis(), sombrerazo: () => Audio.boing(), despierta: () => Audio.boing() })[r](); });
      this.teclado();
      $('ic-lenta').innerHTML = CBPersonajes.donaLenta();
      $('lenta-dibujo').innerHTML = CBPersonajes.donaLenta({ pose: 'habla' });
      this.pintarInicio();
      // instalable y sin conexión (solo en http/https)
      if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) navigator.serviceWorker.register('sw.js').catch(() => {});
      if (!perfil.vioAyuda) { perfil.vioAyuda = true; guardar(); setTimeout(() => this.ayuda(), 600); }
    },

    mostrar(id) {
      document.querySelectorAll('.pantalla').forEach((p) => p.classList.toggle('activa', p.id === id));
      if (id === 'p-inicio') Audio.tema && Audio.tema('menu');
    },

    pintarInicio() {
      const h = this.hoy, r = perfil.resueltos[h.fecha];
      $('ini-numero').textContent = `CRUCIGRAMA #${h.numero}`;
      $('ini-tema').textContent = h.tema.nombre;
      $('ini-racha').textContent = this.rachaVigente();
      $('ini-jugados').textContent = perfil.jugados;
      const enCurso = perfil.enCurso && perfil.enCurso.fecha === h.fecha;
      $('btn-jugar').textContent = r ? 'Ver de nuevo' : enCurso ? 'Seguir' : 'Jugar';
      $('ini-nota').textContent = r ? `Resuelto en ${dosDigitos(r.seg)} · volvé mañana por otro` : `${h.grilla.entradas.length} palabras · un tema por día`;
    },

    rachaVigente() {
      if (!perfil.ultimo) return 0;
      const ayer = claveDia(new Date(Date.now() - 86400000));
      return perfil.ultimo === this.hoy.fecha || perfil.ultimo === ayer ? perfil.racha : 0;
    },

    // ------------------------------------------------------------ partida
    jugar() {
      const h = this.hoy, g = h.grilla;
      const previo = perfil.enCurso && perfil.enCurso.fecha === h.fecha ? perfil.enCurso : null;
      const hecho = perfil.resueltos[h.fecha];
      this.partida = {
        g, resp: previo ? Object.assign({}, previo.resp) : {}, ayudadas: new Set(previo ? previo.ayudadas : []),
        ayudas: previo ? previo.ayudas : 0, seg: previo ? previo.seg : 0, actual: g.entradas.reduce((a, e) => (e.n < a.n ? e : a)), cursor: 0, listo: !!hecho, timer: null,
      };
      if (hecho) for (const e of g.entradas) this.casillas(e).forEach(([x, y], i) => { this.partida.resp[x + ',' + y] = e.respuesta[i]; });
      $('jg-numero').textContent = `#${h.numero}`;
      $('jg-tema').textContent = h.tema.nombre;
      this.armarGrilla();
      this.mostrar('p-juego');
      this.ajustar();
      Audio.tema && Audio.tema('juego');
      if (!hecho) this.timer();
      this.pintar();
      this.magos.juego.animar('happy', 700);
    },

    timer() {
      const pa = this.partida;
      clearInterval(pa.timer);
      let ultimo = Date.now();
      pa.timer = setInterval(() => {
        if (document.hidden) { ultimo = Date.now(); return; }
        const ahora = Date.now(); pa.seg += (ahora - ultimo) / 1000; ultimo = ahora;
        $('reloj').textContent = dosDigitos(Math.floor(pa.seg));
      }, 250);
      $('reloj').textContent = dosDigitos(Math.floor(pa.seg));
    },

    casillas(e) { return Array.from({ length: e.respuesta.length }, (_, i) => (e.dir === 'h' ? [e.x + i, e.y] : [e.x, e.y + i])); },
    resuelta(e) { const r = this.partida.resp; return this.casillas(e).every(([x, y], i) => r[x + ',' + y] === e.respuesta[i]); },
    C(x, y) { return this.celdas[y * this.partida.g.ancho + x]; },

    armarGrilla() {
      const g = this.partida.g, cont = $('grilla');
      cont.innerHTML = '';
      this.celdas = [];
      for (let y = 0; y < g.alto; y++) for (let x = 0; x < g.ancho; x++) {
        const d = document.createElement('div');
        d.className = 'c' + (g.celdas[y][x] ? '' : ' vacia');
        const num = g.entradas.find((e) => e.x === x && e.y === y);
        d.innerHTML = (num && g.celdas[y][x] ? `<small>${num.n}</small>` : '') + `<b>${this.partida.resp[x + ',' + y] || ''}</b>`;
        d.dataset.x = x; d.dataset.y = y;
        if (this.partida.ayudadas.has(x + ',' + y)) d.classList.add('ayuda');
        cont.appendChild(d); this.celdas.push(d);
      }
      this.ajustar();
      cont.onclick = (ev) => {
        const c = ev.target.closest('.c'); if (!c || c.classList.contains('vacia')) return;
        this.elegir(+c.dataset.x, +c.dataset.y);
      };
    },

    /**
     * Casillas del tamaño justo: mide lo que ocupan la cabecera, la pista, los botones y el teclado,
     * y reparte el resto. Se repite si cambia la pantalla o si aparece el teclado del celular.
     */
    ajustar() {
      if (!this.partida) return;
      const g = this.partida.g, cont = $('grilla'), pant = $('p-juego');
      // con el teclado del celular, lo visible es lo que queda arriba del teclado; si no, la pantalla entera
      const nativo = perfil.tecladoNativo && window.visualViewport;
      const alto = nativo ? visualViewport.height : innerHeight;
      if (nativo) document.documentElement.style.setProperty('--alto-visible', Math.round(alto) + 'px');
      else document.documentElement.style.removeProperty('--alto-visible');
      const est = getComputedStyle(pant);
      let ocupado = parseFloat(est.paddingTop) + parseFloat(est.paddingBottom);
      const hijos = [...pant.children].filter((h) => !h.classList.contains('tablero') && h.offsetParent !== null);
      for (const h of hijos) ocupado += h.getBoundingClientRect().height;
      ocupado += parseFloat(est.rowGap || est.gap || 0) * hijos.length + 24;   // huecos y el marco de madera del tablero
      const ancho = Math.min(innerWidth, 480) - 28 - 24;
      const lado = Math.floor(Math.max(18, Math.min(40, (ancho - (g.ancho - 1) * 3) / g.ancho, (alto - ocupado - (g.alto - 1) * 3) / g.alto)));
      cont.style.gridTemplateColumns = `repeat(${g.ancho}, ${lado}px)`;
      cont.style.gridAutoRows = `${lado}px`;
      cont.querySelectorAll('.c').forEach((c) => { c.style.fontSize = Math.round(lado * .56) + 'px'; });
      cont.classList.toggle('chica', lado < 24);
    },

    elegir(x, y) {
      const pa = this.partida;
      const de = pa.g.entradas.filter((e) => this.casillas(e).some(([a, b]) => a === x && b === y));
      const misma = this.casillas(pa.actual).some(([a, b]) => a === x && b === y);
      // tocar de nuevo la misma casilla cambia de dirección
      pa.actual = misma && de.length > 1 ? de.find((e) => e !== pa.actual) : de.includes(pa.actual) ? pa.actual : de[0];
      pa.cursor = this.casillas(pa.actual).findIndex(([a, b]) => a === x && b === y);
      Audio.tecla();
      if (perfil.tecladoNativo) this.enfocarNativo();
      this.pintar(true);
    },

    pintar(cambioPista) {
      const pa = this.partida;
      this.celdas.forEach((c) => c.classList.remove('pal', 'sel', 'bien'));
      for (const e of pa.g.entradas) if (this.resuelta(e)) this.casillas(e).forEach(([x, y]) => this.C(x, y).classList.add('bien'));
      if (!pa.listo) this.casillas(pa.actual).forEach(([x, y], i) => this.C(x, y).classList.add(i === pa.cursor ? 'sel' : 'pal'));
      $('pista-n').textContent = `${pa.actual.n} ${pa.actual.dir === 'h' ? '→' : '↓'}`;
      $('pista-txt').textContent = pa.actual.pista;
      if (cambioPista) { const p = $('pista'); p.classList.remove('cambia'); void p.offsetWidth; p.classList.add('cambia'); }
      const quedan = AYUDAS_POR_DIA - pa.ayudas;
      $('ayudas-n').textContent = quedan;
      $('btn-letra').disabled = pa.listo || quedan <= 0;
      $('btn-comprobar').disabled = pa.listo;
    },

    /** Siguiente entrada sin resolver, en orden (o la anterior con dir = -1). */
    mover(dir) {
      const pa = this.partida, E = pa.g.entradas;
      let i = E.indexOf(pa.actual);
      for (let k = 0; k < E.length; k++) { i = (i + dir + E.length) % E.length; if (!this.resuelta(E[i]) || pa.listo) break; }
      pa.actual = E[i];
      const vacia = this.casillas(pa.actual).findIndex(([x, y]) => !pa.resp[x + ',' + y]);
      pa.cursor = vacia >= 0 ? vacia : 0;
      this.pintar(true);
    },

    escribir(l, ayuda) {
      const pa = this.partida; if (!pa || pa.listo) return;
      const [x, y] = this.casillas(pa.actual)[pa.cursor];
      const antes = new Set(pa.g.entradas.filter((e) => this.resuelta(e)));
      pa.resp[x + ',' + y] = l;
      const c = this.C(x, y); c.querySelector('b').textContent = l; c.classList.remove('mal');
      c.classList.toggle('ayuda', !!ayuda || pa.ayudadas.has(x + ',' + y));
      if (ayuda) pa.ayudadas.add(x + ',' + y);
      if (!ayuda) Audio.tecla();
      // palabras que se acaban de completar bien
      const nuevas = pa.g.entradas.filter((e) => !antes.has(e) && this.resuelta(e));
      for (const e of nuevas) {
        this.casillas(e).forEach(([cx, cy], i) => { const cc = this.C(cx, cy); setTimeout(() => { cc.classList.remove('ok'); void cc.offsetWidth; cc.classList.add('ok'); }, i * 45); });
        Audio.acierto(e.respuesta.length);
        this.magos.juego.animar('happy', 800);
      }
      // avanzar: dentro de la palabra, saltando casillas ya puestas; si terminó, a la próxima sin resolver
      const cas = this.casillas(pa.actual);
      let sig = pa.cursor + 1;
      while (sig < cas.length && pa.resp[cas[sig][0] + ',' + cas[sig][1]]) sig++;
      if (sig < cas.length) pa.cursor = sig;
      else if (this.resuelta(pa.actual)) { if (!pa.g.entradas.every((e) => this.resuelta(e))) { this.mover(1); this.guardarCurso(); return; } }
      else if (pa.cursor < cas.length - 1) pa.cursor++;
      this.pintar();
      this.guardarCurso();
      if (pa.g.entradas.every((e) => this.resuelta(e))) this.terminar();
    },

    borrar() {
      const pa = this.partida; if (!pa || pa.listo) return;
      const cas = this.casillas(pa.actual);
      let [x, y] = cas[pa.cursor];
      if (!pa.resp[x + ',' + y] && pa.cursor > 0) { pa.cursor--; [x, y] = cas[pa.cursor]; }
      // las letras de palabras ya resueltas no se borran
      const fija = pa.g.entradas.some((e) => this.resuelta(e) && this.casillas(e).some(([a, b]) => a === x && b === y));
      if (!fija) { delete pa.resp[x + ',' + y]; this.C(x, y).querySelector('b').textContent = ''; this.C(x, y).classList.remove('ayuda', 'mal'); }
      Audio.borrar();
      this.pintar(); this.guardarCurso();
    },

    /** Doña Lenta muestra la letra de la casilla elegida (3 por día). */
    darLetra() {
      const pa = this.partida; if (!pa || pa.listo || pa.ayudas >= AYUDAS_POR_DIA) return;
      const cas = this.casillas(pa.actual);
      let i = pa.cursor;
      const [x, y] = cas[i];
      if (pa.resp[x + ',' + y] === pa.actual.respuesta[i]) { const v = cas.findIndex(([a, b], k) => pa.resp[a + ',' + b] !== pa.actual.respuesta[k]); if (v < 0) return; pa.cursor = i = v; }
      pa.ayudas++;
      Audio.poder();
      this.escribir(pa.actual.respuesta[i], true);
      const quedan = AYUDAS_POR_DIA - pa.ayudas;
      this.lenta(azar(['Ahí va una letra, tesoro.', 'Despacito se llega lejos.', 'Esta te la regalo.', 'Mirá bien, que ya sale.']) + (quedan ? ` Me quedan ${quedan}.` : ' Por hoy no tengo más.'));
    },

    /** Doña Lenta asoma desde abajo con un globito y se vuelve a esconder. */
    lenta(texto) {
      const el = $('lenta-aviso');
      $('lenta-texto').textContent = texto;
      el.classList.remove('ve'); void el.offsetWidth; el.classList.add('ve');
      clearTimeout(this._tLenta); this._tLenta = setTimeout(() => el.classList.remove('ve'), 2600);
    },

    comprobar() {
      const pa = this.partida; if (!pa || pa.listo) return;
      let malas = 0;
      for (const e of pa.g.entradas) this.casillas(e).forEach(([x, y], i) => {
        const v = pa.resp[x + ',' + y];
        if (v && v !== e.respuesta[i]) { malas++; const c = this.C(x, y); c.classList.remove('mal'); void c.offsetWidth; c.classList.add('mal'); }
      });
      if (malas) { Audio.error(); this.magos.juego.animar('sad', 700); } else { Audio.click(); this.magos.juego.animar('cast', 700); }
    },

    guardarCurso() {
      const pa = this.partida; if (pa.listo) return;
      perfil.enCurso = { fecha: this.hoy.fecha, resp: pa.resp, ayudadas: [...pa.ayudadas], ayudas: pa.ayudas, seg: pa.seg };
      guardar();
    },

    salir() {
      const pa = this.partida;
      if (pa) { clearInterval(pa.timer); this.guardarCurso(); }
      this.pintarInicio();
      this.mostrar('p-inicio');
    },

    terminar() {
      const pa = this.partida, h = this.hoy;
      pa.listo = true; clearInterval(pa.timer);
      const seg = Math.round(pa.seg);
      const ayer = claveDia(new Date(Date.now() - 86400000));
      if (perfil.ultimo !== h.fecha) {
        perfil.racha = perfil.ultimo === ayer ? perfil.racha + 1 : 1;
        perfil.mejorRacha = Math.max(perfil.mejorRacha, perfil.racha);
        perfil.ultimo = h.fecha; perfil.jugados++;
      }
      perfil.resueltos[h.fecha] = { numero: h.numero, seg, ayudas: pa.ayudas, tema: h.tema.id };
      perfil.enCurso = null; guardar();
      if (window.CBRanking) CBRanking.enviar({ fecha: h.fecha, numero: h.numero, idioma: 'es', segundos: seg, ayudas: pa.ayudas, nombre: perfil.nombre });
      this.pintar();
      Audio.completa(); this.confeti(60); this.magos.juego.animar('happy', 1500);
      setTimeout(() => this.final(), 1100);
    },

    final() {
      const h = this.hoy, r = perfil.resueltos[h.fecha];
      const frases = ['¡Lo resolviste!', '¡Qué cabeza!', '¡Bravo, mago!', '¡Completo!'];
      this.modal(`<h2>${azar(frases)}</h2><div class="final-dupla"><div class="mago" id="mago-final"></div><div class="final-lenta">${CBPersonajes.donaLenta({ pose: 'habla' })}</div></div>
        <p>Crucigrama #${h.numero} · <b>${h.tema.nombre}</b></p>
        <div class="datos-final"><div><b>${dosDigitos(r.seg)}</b><small>tiempo</small></div><div><b>${r.ayudas}</b><small>pistas de Doña Lenta</small></div><div><b>${this.rachaVigente()} 🔥</b><small>racha</small></div></div>
        <p>Mañana hay otro tema. ¡Te espero!</p>
        <div class="fila"><button class="btn btn-madera" id="fin-volver">Volver</button><button class="btn btn-oro" id="fin-compartir">Compartir</button></div>
        <button class="link" id="fin-ranking">🏆 Ver el ranking de hoy</button>`);
      $('fin-ranking').onclick = () => { Audio.click(); this.ranking(); };
      const m = new WWMago.Mago($('mago-final'), { paleta: 'turquesa', etapa: 1 }); setTimeout(() => m.animar('happy', 1600), 200);
      this.prepararTarjeta();
      $('fin-volver').onclick = () => { Audio.click(); this.cerrarModal(); this.salir(); };
      $('fin-compartir').onclick = () => { Audio.click(); this.compartir(); };
    },

    prepararTarjeta() {
      const h = this.hoy, r = perfil.resueltos[h.fecha];
      this._tarjeta = null;
      if (!window.CBTarjeta || !r) return;
      const pedido = { fecha: h.fecha, blob: null };
      this._tarjeta = pedido;
      CBTarjeta.crear({
        numero: h.numero, tema: h.tema.nombre, celdas: h.grilla.celdas.map((f) => f.map(Boolean)), seg: r.seg, ayudas: r.ayudas, racha: this.rachaVigente(),
        textos: { crucigrama: 'Crucigrama', tiempo: 'tiempo', pistas: 'pistas', racha: 'racha', reto: '¿Me ganás?', url: 'crucigramas.capralabsgames.com' },
      }).then((b) => { pedido.blob = b; }).catch(() => {});
    },

    compartir() {
      const h = this.hoy, r = perfil.resueltos[h.fecha];
      const url = /^https?:/.test(location.protocol) ? '\n' + location.origin + location.pathname : '';
      const texto = `🌲 Crucigramas del Bosque #${h.numero} · ${h.tema.nombre}\n⏱️ ${dosDigitos(r.seg)}${r.ayudas ? ` · 🐌 ${r.ayudas} pista${r.ayudas > 1 ? 's' : ''}` : ' · sin pistas'}\n🔥 racha ${this.rachaVigente()}${url}`;
      const img = this._tarjeta && this._tarjeta.fecha === h.fecha ? this._tarjeta.blob : null;
      if (img) {
        const archivo = new File([img], 'crucigrama.png', { type: 'image/png' });
        if (navigator.canShare && navigator.canShare({ files: [archivo] })) { navigator.share({ files: [archivo], text: texto }).catch(() => {}); return; }
        // compu: se ve la imagen para guardarla y el texto se copia
        const url = URL.createObjectURL(img);
        if (navigator.clipboard) navigator.clipboard.writeText(texto).catch(() => {});
        this.modal(`<h2>Tu resultado</h2><img class="tarjeta-vista" src="${url}" alt=""><p>El texto ya está copiado. Guardá la imagen y mandala por donde quieras.</p>
          <div class="fila"><button class="btn btn-madera" id="tj-volver">Volver</button><a class="btn btn-oro" id="tj-guardar" href="${url}" download="crucigrama.png">Guardar imagen</a></div>`);
        $('tj-volver').onclick = () => { Audio.click(); this.final(); };
        return;
      }
      if (navigator.share) navigator.share({ text: texto }).catch(() => {});
      else if (navigator.clipboard) navigator.clipboard.writeText(texto).then(() => { $('fin-compartir').textContent = '¡Copiado!'; });
    },

    /** Ranking del día: primero los que usaron menos letras de Doña Lenta, después el más rápido. */
    async ranking() {
      const h = this.hoy;
      const sinNombre = !perfil.nombre;
      this.modal(`<h2>Ranking de hoy</h2><p class="sub-modal">Crucigrama #${h.numero} · ${h.tema.nombre}</p>
        ${sinNombre ? '<div class="nombre-ranking"><input id="rk-nombre" maxlength="16" placeholder="Tu nombre en el ranking" autocomplete="off"><button class="btn btn-oro" id="rk-guardar">Guardar</button></div><small class="rk-error" id="rk-error"></small>' : ''}
        <ol class="ranking" id="rk-lista"><li class="rk-cargando">Buscando a los magos del bosque…</li></ol>
        <p class="rk-nota">Primero los que usaron menos letras de Doña Lenta, después el más rápido.</p>
        <div class="fila"><button class="btn btn-madera" id="rk-cerrar">Cerrar</button></div>`);
      $('rk-cerrar').onclick = () => { Audio.click(); if (perfil.resueltos[h.fecha] && this.partida && this.partida.listo) this.final(); else this.cerrarModal(); };
      if (sinNombre) $('rk-guardar').onclick = async () => {
        const n = $('rk-nombre').value.trim();
        if (!window.CBRanking || !CBRanking.nombreOk(n)) { $('rk-error').textContent = 'Probá con otro nombre (hasta 16 letras, sin malas palabras).'; return; }
        perfil.nombre = n; guardar(); Audio.logro();
        await CBRanking.renombrar(n);
        this.ranking();
      };
      const filas = window.CBRanking ? await CBRanking.topDia(h.fecha, 'es', 30) : null;
      const lista = $('rk-lista'); if (!lista) return;
      if (!filas) { lista.innerHTML = '<li class="rk-cargando">Sin conexión. Probá de nuevo en un rato.</li>'; return; }
      if (!filas.length) { lista.innerHTML = '<li class="rk-cargando">Nadie lo resolvió todavía. ¡Estrenalo!</li>'; return; }
      const yo = CBRanking.miId();
      const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
      lista.innerHTML = filas.map((f, i) => `<li class="${f.usuario === yo ? 'yo' : ''}"><span class="rk-pos">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="rk-nombre">${esc(f.nombre)}</span><span class="rk-ayudas">${f.ayudas ? '🐌'.repeat(f.ayudas) : ''}</span><b>${dosDigitos(f.segundos)}</b></li>`).join('');
    },

    ayuda() {
      this.modal(`<h2>Cómo se juega</h2>
        <ul class="ayuda-lista">
          <li>Un crucigrama por día, <b>el mismo para todos</b>, con un tema distinto.</li>
          <li>Tocá una casilla para elegir la palabra. Tocala <b>de nuevo</b> para cambiar entre horizontal y vertical.</li>
          <li>Las flechas de la pista pasan a la palabra siguiente.</li>
          <li><b>Doña Lenta</b>, la caracola, te muestra una letra (3 por día).</li>
          <li>"Comprobar" sacude las letras que están mal.</li>
          <li>Resolvelo todos los días para sumar <b>racha</b> 🔥.</li>
        </ul>
        <div class="fila"><button class="btn btn-oro" id="ayuda-ok">¡Dale!</button></div>
        <p class="legales"><a href="privacidad.html" target="_blank" rel="noopener">Privacidad</a> · <a href="terminos.html" target="_blank" rel="noopener">Términos</a> · <button class="link" id="ayuda-borrar">Borrar mis datos</button></p>
        <p class="legales">v${VERSION} · CapraLabsGames · de los creadores de Word Wizard</p>`);
      $('ayuda-ok').onclick = () => { Audio.click(); this.cerrarModal(); };
      $('ayuda-borrar').onclick = () => this.borrarDatos();
    },

    /**
     * Teclado del celular: un campo invisible recibe lo que se escribe. Siempre tiene un espacio adentro, así el
     * borrado del teclado (que en Android no siempre manda la tecla) se nota como "quedó vacío".
     */
    nativo() {
      const inp = $('entrada-nativa');
      const limpiar = () => { inp.value = ' '; try { inp.setSelectionRange(1, 1); } catch (e) { /* algunos navegadores */ } };
      inp.addEventListener('input', () => {
        const v = inp.value;
        if (v.length === 0) this.borrar();
        else {
          const letras = CB.normal(v.slice(1) || v);
          for (const l of letras) this.escribir(l);
        }
        limpiar();
      });
      inp.addEventListener('keydown', (ev) => { if (ev.key === 'Backspace' && inp.value === ' ') { ev.preventDefault(); this.borrar(); } else if (ev.key === 'Enter') { ev.preventDefault(); this.mover(1); } });
      limpiar();
      const cambiar = () => {
        perfil.tecladoNativo = !perfil.tecladoNativo; guardar(); Audio.click();
        this.modoTeclado();
        if (perfil.tecladoNativo) this.enfocarNativo(); else inp.blur();
      };
      $('btn-teclado').addEventListener('click', cambiar);
      // cuando el teclado del celular aparece o se va, el lugar visible cambia
      const reajustar = () => { if ($('p-juego').classList.contains('activa')) this.ajustar(); };
      if (window.visualViewport) visualViewport.addEventListener('resize', reajustar);
      addEventListener('resize', reajustar);
      this.modoTeclado();
    },
    modoTeclado() {
      document.body.classList.toggle('teclado-nativo', !!perfil.tecladoNativo);
      $('btn-teclado').classList.toggle('activo', !!perfil.tecladoNativo);
      $('btn-teclado').title = perfil.tecladoNativo ? 'Usar el teclado del juego' : 'Usar el teclado del celular';
      this.ajustar();
    },
    enfocarNativo() { const inp = $('entrada-nativa'); inp.focus({ preventScroll: true }); inp.value = ' '; },

    borrarDatos() {
      this.modal(`<h2>¿Borrar tus datos?</h2><p>Se borra tu progreso de este celular y, si apareciste en el ranking, tu cuenta y tus resultados en la nube. No se puede deshacer.</p>
        <div class="fila"><button class="btn btn-madera" id="bd-no">Mejor no</button><button class="btn btn-oro" id="bd-si">Borrar</button></div>`);
      $('bd-no').onclick = () => { Audio.click(); this.cerrarModal(); };
      $('bd-si').onclick = async () => {
        $('bd-si').disabled = true;
        const ok = window.CBRanking ? await CBRanking.borrar() : true;
        if (!ok) { $('bd-si').disabled = false; $('bd-si').textContent = 'Sin conexión, reintentar'; return; }
        try { localStorage.removeItem(LS); } catch (e) { /* nada */ }
        location.reload();
      };
    },

    teclado() {
      this.nativo();
      const t = $('teclado');
      t.innerHTML = TECLAS.map((f, i) => `<div>${f.split('').map((l) => `<button data-k="${l}">${l}</button>`).join('')}${i === 2 ? '<button class="ancha" data-k="borrar" aria-label="Borrar">⌫</button>' : ''}</div>`).join('');
      t.addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (!b) return; if (b.dataset.k === 'borrar') this.borrar(); else this.escribir(b.dataset.k); });
      $('pista-ant').addEventListener('click', () => this.mover(-1));
      $('pista-sig').addEventListener('click', () => this.mover(1));
      $('btn-letra').addEventListener('click', () => this.darLetra());
      $('btn-comprobar').addEventListener('click', () => this.comprobar());
      document.addEventListener('keydown', (ev) => {
        if (!$('p-juego').classList.contains('activa') || !$('modal').classList.contains('oculto') || ev.target === $('entrada-nativa')) return;
        const k = ev.key.toUpperCase();
        if (/^[A-ZÑ]$/.test(k)) this.escribir(k);
        else if (ev.key === 'Backspace') this.borrar();
        else if (ev.key === 'ArrowRight' || ev.key === 'Tab' || ev.key === 'Enter') { ev.preventDefault(); this.mover(1); }
        else if (ev.key === 'ArrowLeft') this.mover(-1);
      });
    },

    modal(html) { $('modal-caja').innerHTML = html; $('modal').classList.remove('oculto'); },
    cerrarModal() { $('modal').classList.add('oculto'); },

    confeti(n) {
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const cont = $('confeti'), colores = ['#f2c66d', '#dfebd6', '#bbd0b9', '#e8907a', '#ffffff', '#c9485b'];
      const tope = matchMedia('(pointer: coarse)').matches ? 40 : 90;
      for (let i = 0; i < Math.min(n, tope); i++) {
        const p = document.createElement('span'); p.className = 'papelito';
        p.style.left = Math.random() * innerWidth + 'px'; p.style.background = colores[i % colores.length];
        cont.appendChild(p);
        p.animate([{ transform: 'translate(0,0) rotate(0)' }, { transform: `translate(${(Math.random() - .5) * 160}px, ${innerHeight + 40}px) rotate(${(Math.random() - .5) * 900}deg)` }], { duration: 1800 + Math.random() * 1500, easing: 'cubic-bezier(.2,.6,.4,1)' }).onfinish = () => p.remove();
      }
    },
  };

  window.App = App;
  window.CB_VERSION = VERSION;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => App.iniciar()); else App.iniciar();
})();
