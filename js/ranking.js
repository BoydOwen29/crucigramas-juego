/**
 * Crucigramas del Bosque — ranking mundial (Supabase por REST, sin librerías). Basado en el de Word Wizard.
 * Usa el mismo proyecto que Word Wizard: una cuenta anónima por dispositivo, el nombre en public.perfiles y los
 * resultados en public.cb_partidas (ver supabase/migrations). Si no hay conexión, el resultado queda en cola.
 */
(function () {
  'use strict';
  const CONFIG = {
    url: 'https://syvlvisokezsvkjfwalo.supabase.co',
    key: 'sb_publishable_vQ6qMxkyeKpOW0o3NgTWIg_WDcHmdvp',   // clave pública: la seguridad la dan las reglas de la base
  };
  const LS_SESION = 'cb.nube', LS_COLA = 'cb.nube.cola';
  const leer = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sin almacenamiento */ } };

  // misma lista que public.nombre_ok en la base
  const FEAS = /(put[oa]|verga|mierda|pelotud|forro|culiad|conchatu|hdp|hijodeput|trolo|mogolic|retrasad|nazi|hitler|porno|garch|cogid|nigg|fuck|shit|bitch|pussy)/;
  const DE = 'áéíóúüñ0134578@$', A = 'aeiouunoieastbas';
  function nombreOk(n) {
    const t = String(n || '').trim();
    if (!t || t.length > 16) return false;
    return !FEAS.test([...t.toLowerCase()].map((c) => { const i = DE.indexOf(c); return i >= 0 ? A[i] : c; }).join(''));
  }

  async function auth(ruta, cuerpo) {
    const res = await fetch(`${CONFIG.url}/auth/v1/${ruta}`, { method: 'POST', headers: { apikey: CONFIG.key, 'Content-Type': 'application/json' }, body: JSON.stringify(cuerpo) });
    if (!res.ok) return null;
    const j = await res.json();
    return { token: j.access_token, refresh: j.refresh_token, vence: (j.expires_at || 0) * 1000, id: j.user && j.user.id };
  }
  async function sesion() {
    let s = leer(LS_SESION, null);
    if (s && s.vence > Date.now() + 60000) return s;
    let nueva = s && s.refresh ? await auth('token?grant_type=refresh_token', { refresh_token: s.refresh }) : null;
    if (!nueva) nueva = await auth('signup', {});
    if (!nueva) throw new Error('sin sesión');
    s = Object.assign({}, nueva, { nombre: s && nueva.id === s.id ? s.nombre : null });
    escribir(LS_SESION, s);
    return s;
  }
  function rest(ruta, op, s) {
    const h = { apikey: CONFIG.key, 'Content-Type': 'application/json' };
    if (s) h.Authorization = 'Bearer ' + s.token;
    return fetch(`${CONFIG.url}/rest/v1/${ruta}`, Object.assign({}, op, { headers: Object.assign(h, op && op.headers) }));
  }
  async function asegurarNombre(s, nombre) {
    const pub = nombreOk(nombre) ? String(nombre).trim().slice(0, 16) : 'Mago ' + (s.id || '').slice(0, 4).toUpperCase();
    if (s.nombre === pub) return;
    const res = await rest('perfiles?on_conflict=id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ nombre: pub }) }, s);
    if (res.ok) { s.nombre = pub; escribir(LS_SESION, s); }
  }

  async function mandar(item) {
    const s = await sesion();
    await asegurarNombre(s, item.nombre);
    const d = item.datos;
    const res = await rest('cb_partidas', { method: 'POST', body: JSON.stringify({ fecha: d.fecha, numero: d.numero, idioma: d.idioma || 'es', segundos: d.segundos, ayudas: d.ayudas }) }, s);
    // 409 = ya estaba; otros 4xx = la base la rechaza (no tiene sentido reintentar)
    return res.ok || (res.status >= 400 && res.status < 500);
  }
  let vaciando = null;
  function vaciarCola() {
    if (vaciando) return vaciando;
    vaciando = (async () => {
      for (const item of leer(LS_COLA, [])) {
        let ok = false;
        try { ok = await mandar(item); } catch (e) { break; }
        if (ok) escribir(LS_COLA, leer(LS_COLA, []).filter((x) => x.uid !== item.uid));
      }
    })().finally(() => { vaciando = null; });
    return vaciando;
  }

  /** r: { fecha, numero, idioma, segundos, ayudas, nombre } */
  function enviar(r) {
    if (r.segundos < 15) return Promise.resolve();   // la base no acepta menos (y no es humano)
    const cola = leer(LS_COLA, []).filter((x) => x.datos.fecha !== r.fecha);
    cola.push({ uid: Date.now().toString(36), nombre: r.nombre, datos: r });
    escribir(LS_COLA, cola.slice(-20));
    return vaciarCola();
  }
  /** Cambia el nombre público (para los que ya mandaron con el nombre por defecto). */
  async function renombrar(nombre) { try { const s = await sesion(); s.nombre = null; await asegurarNombre(s, nombre); return true; } catch (e) { return false; } }

  async function topDia(fecha, idioma, n) {
    try {
      const res = await rest(`cb_ranking_diario?fecha=eq.${fecha}&idioma=eq.${idioma || 'es'}&select=usuario,nombre,segundos,ayudas&order=ayudas.asc,segundos.asc&limit=${n || 30}`);
      return res.ok ? await res.json() : null;
    } catch (e) { return null; }
  }
  const miId = () => (leer(LS_SESION, null) || {}).id || null;

  /** Borra la cuenta en la nube (y todo lo del jugador, en cascada). */
  async function borrar() {
    escribir(LS_COLA, []);
    if (!leer(LS_SESION, null)) return true;
    try { const s = await sesion(); const res = await rest('rpc/borrar_mis_datos', { method: 'POST', body: '{}' }, s); if (!res.ok) return false; } catch (e) { return false; }
    try { localStorage.removeItem(LS_SESION); } catch (e) { /* nada */ }
    return true;
  }

  addEventListener('online', vaciarCola);
  setTimeout(vaciarCola, 4000);
  window.CBRanking = { enviar, topDia, miId, renombrar, nombreOk, borrar, vaciarCola };
})();
