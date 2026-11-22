/* Bibliotecă: acces REST la Supabase. NU conține parole sau chei privilegiate. */
(function () {
  'use strict';
  const conf = window.BIBLIOTECA_CONFIG || {};
  const url = String(conf.supabaseUrl || '').trim().replace(/\/+$/, '');
  const key = String(conf.supabasePublishableKey || '').trim();
  const enabled = /^https:\/\/[a-z\d-]+\.supabase\.co$/i.test(url) && key.length > 20;
  const SESSION_KEY = 'biblioteca-brusturoasa-supabase-session-v2';
  let session = null;
  try { session = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null'); } catch { /* sesiune invalidă */ }
  function store(s) {
    session = s;
    try { if (s) sessionStorage.setItem(SESSION_KEY, JSON.stringify(s)); else sessionStorage.removeItem(SESSION_KEY); } catch {}
  }
  function errText(raw) {
    if (!raw) return 'Eroare necunoscută';
    if (raw instanceof Error) return raw.message;
    return String(raw.msg || raw.message || raw.error_description || raw.error || JSON.stringify(raw));
  }
  async function req(path, options = {}, jwt) {
    if (!enabled) throw Error('Conexiunea online nu este configurată în config.js.');
    const headers = new Headers(options.headers || {});
    headers.set('apikey', key);
    if (jwt) headers.set('Authorization', 'Bearer ' + jwt);
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');
    const response = await fetch(url + path, {...options, headers, cache: 'no-store'});
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const error = new Error(errText(body) + ' (HTTP ' + response.status + ')');
      error.status = response.status;
      throw error;
    }
    if (response.status === 204) return null;
    const type = response.headers.get('content-type') || '';
    return type.includes('json') ? response.json() : response.text();
  }
  async function renew() {
    if (!session?.refresh_token) throw Error('Sesiunea a expirat. Autentificați-vă din nou.');
    const fresh = await req('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({refresh_token: session.refresh_token})
    });
    store(fresh);
    return fresh.access_token;
  }
  async function validToken() {
    if (!session?.access_token) throw Error('Trebuie să vă autentificați.');
    if (Date.now() / 1000 > (session.expires_at || 0) - 75) return renew();
    return session.access_token;
  }
  async function authed(path, options = {}) {
    let token = await validToken();
    try { return await req(path, options, token); }
    catch (e) { if (e.status !== 401) throw e; token = await renew(); return req(path, options, token); }
  }
  async function login(email, password) {
    const s = await req('/auth/v1/token?grant_type=password', {
      method: 'POST', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({email, password})
    });
    store(s);
    const me = await authed('/rest/v1/library_admins?select=user_id&user_id=eq.' + encodeURIComponent(s.user.id));
    if (!Array.isArray(me) || !me.length) {
      store(null);
      throw Error('Contul există, dar nu este autorizat să administreze biblioteca. Solicitați înregistrarea UID-ului în library_admins.');
    }
    return s.user;
  }
  async function logout() {
    const token = session?.access_token;
    store(null);
    if (token) await req('/auth/v1/logout', {method:'POST'}, token).catch(() => {});
  }
  async function authorized() {
    if (!session?.user?.id) return false;
    try {
      const me = await authed('/rest/v1/library_admins?select=user_id&user_id=eq.' + encodeURIComponent(session.user.id));
      if (Array.isArray(me) && me.length) return true;
    } catch { /* acces revocat, sesiune expirată sau rețea indisponibilă */ }
    return false;
  }
  async function read() {
    const rows = await req('/rest/v1/site_content?select=content,revision,updated_at&id=eq.1');
    if (!Array.isArray(rows) || !rows.length) throw Error('Nu există rândul site_content(id=1); executați scriptul SQL.');
    return {data: rows[0].content, revision: Number(rows[0].revision), updatedAt: rows[0].updated_at};
  }
  async function publish(data, expectedRevision) {
    const qs = '/rest/v1/site_content?id=eq.1&revision=eq.' + encodeURIComponent(String(expectedRevision)) + '&select=revision,updated_at';
    const rows = await authed(qs, {
      method: 'PATCH', headers: {'Content-Type':'application/json', 'Prefer':'return=representation'},
      body: JSON.stringify({content:data})
    });
    if (!Array.isArray(rows) || rows.length === 0) {
      throw Error('Conflict: alt bibliotecar a publicat între timp. Descărcați o copie, apoi reîncărcați datele publicate.');
    }
    return {revision: Number(rows[0].revision), updatedAt: rows[0].updated_at};
  }
  async function uploadPoster(imageData) {
    if (!/^data:image\/webp;base64,[A-Za-z0-9+/]+={0,2}$/.test(imageData) || imageData.length > 1800000)
      throw Error('Afișul din draft are format sau dimensiune neacceptată. Reîncărcați imaginea.');
    const file = await fetch(imageData).then(r => r.blob());
    if (file.size > 1300000) throw Error('Afiș prea mare pentru transfer; încărcați unul mai mic.');
    const random = new Uint8Array(16);
    crypto.getRandomValues(random);
    const path = Array.from(random, b => b.toString(16).padStart(2, '0')).join('') + '.webp';
    await authed('/storage/v1/object/event-posters/' + path, {
      method:'POST', headers:{'Content-Type':'image/webp','x-upsert':'false'}, body:file
    });
    return url + '/storage/v1/object/public/event-posters/' + path;
  }
  window.LibraryCloud = Object.freeze({enabled, read, login, logout, authorized, publish, uploadPoster,
    get email() { return session?.user?.email || ''; },
    get hasSession() { return !!session?.access_token; },
    get url() { return url; }
  });
})();
