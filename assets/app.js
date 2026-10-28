/* Escuela de Verano Tecnológica · motor interactivo v9 (sin dependencias)
   Equipos de 1 o 2 personas · candados con contraseña · guardado automático · panel docente */
const EV = (() => {
  'use strict';
  const CFG = window.EV_CONFIG || { levels: {}, passwords: {}, classes: {}, masterPin: '', minutes: 15 };
  const KEY = 'ev_state_v4', OLDKEY = 'ev_state_v3';
  const ROOT = (() => { try { return document.currentScript.src.replace(/assets\/app\.js.*$/, ''); } catch (e) { return './'; } })();
  const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🦄', '🐙', '🚀', '🤖', '🦸', '🐶', '🐱', '🐵', '🦖', '🐧', '🦋'];
  const LV = n => CFG.levels[n] || { name: 'Nivel ' + n, emoji: '⭐', mascot: { emoji: '🦉', name: 'Guía' } };

  /* ---------- utilidades ---------- */
  function h(tag, attrs, ...kids) {
    let cls = '';
    if (tag.includes('.')) { const p = tag.split('.'); tag = p[0] || 'div'; cls = p.slice(1).join(' '); }
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    for (const k in (attrs || {})) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'on') for (const ev in v) el.addEventListener(ev, v[ev]);
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'html') el.innerHTML = v;
      else el.setAttribute(k, v);
    }
    kids.flat().forEach(c => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  }
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const uid = () => Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4);
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
  const keyOf = (l, n) => `n${l}c${n}`;
  const clsMeta = (l, n) => (CFG.classes[l] || [])[n - 1] || { t: 'Clase ' + n, d: '' };

  /* ---------- estado guardado (localStorage) ---------- */
  let storageOK = true;
  function newTeam(o) {
    return {
      id: uid(), name: o.name || o.players.map(p => p.name).join(' y '), mode: o.mode, players: o.players,
      lv: o.lv || 1, created: Date.now(), last: Date.now(), done: {}, unlocked: {}, stats: [{ ok: 0, err: 0 }, { ok: 0, err: 0 }], badges: {}, resume: null
    };
  }
  function load() {
    const d = { v: 4, sound: true, active: null, teams: {}, lvOpen: {} };
    try { localStorage.setItem('ev_test', '1'); localStorage.removeItem('ev_test'); } catch (e) { storageOK = false; }
    try {
      const r = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (r && r.teams) return Object.assign(d, r);
    } catch (e) {}
    try { /* migrar progreso de la versión anterior */
      const o = JSON.parse(localStorage.getItem(OLDKEY) || 'null');
      if (o && (o.name || Object.keys(o.done || {}).length)) {
        const t = newTeam({ mode: 1, players: [{ name: o.name || 'Explorador/a', avatar: o.avatar || '🦊' }] });
        t.done = o.done || {};
        Object.keys(t.done).forEach(k => { const m = /^n(\d)c(\d+)$/.exec(k); if (m) { t.unlocked[k] = true; t.unlocked['L' + m[1]] = true; const nx = +m[2] + 1; if (nx <= 10) t.unlocked[keyOf(m[1], nx)] = true; } });
        d.teams[t.id] = t; d.active = t.id; d.sound = o.sound !== false;
      }
    } catch (e) {}
    return d;
  }
  let S = load();
  let lastSaveFlash = 0;
  function save(quiet) {
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { storageOK = false; }
    if (!quiet) flash(storageOK ? '💾 Progreso guardado' : '⚠️ Este navegador no puede guardar');
  }
  try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  const T = () => (S.active && S.teams[S.active]) || null;
  const doneIn = (t, l) => { let n = 0; for (let i = 1; i <= 10; i++) if (t.done[keyOf(l, i)]) n++; return n; };
  const starsIn = (t, l) => { let n = 0; for (let i = 1; i <= 10; i++) n += t.done[keyOf(l, i)] || 0; return n; };
  const totalStars = t => t ? Object.values(t.done).reduce((a, b) => a + b, 0) : 0;
  const OPEN = !!CFG.noLocks; /* config.js: noLocks:true abre todos los candados (modo navegación libre) */
  const levelOpen = (t, l) => OPEN || l === 1 || !!(S.lvOpen && S.lvOpen[l]) || !!t.unlocked['L' + l];
  /* cada equipo pertenece a un nivel (t.lv). Los equipos viejos sin ese campo se ubican en el nivel más alto donde tienen progreso */
  const teamLevel = t => { if (t.lv) return t.lv; for (let l = 3; l >= 1; l--) for (let i = 1; i <= 10; i++) if (t.done[keyOf(l, i)]) return l; return 1; };
  /* para VER los equipos de un nivel (2 y 3) hay que poner la contraseña del nivel en esta sesión del navegador */
  const gateMem = {};
  const gateOK = l => { if (OPEN || l === 1) return true; try { return sessionStorage.getItem('ev_gate' + l) === '1' || !!gateMem[l]; } catch (e) { return !!gateMem[l]; } };
  const gateSet = l => { gateMem[l] = true; try { sessionStorage.setItem('ev_gate' + l, '1'); } catch (e) {} };
  const classOpen = (t, l, n) => OPEN || (levelOpen(t, l) && (n === 1 || !!t.unlocked[keyOf(l, n)]));
  const rankOf = t => { const s = totalStars(t); return s >= 60 ? '🏅 Maestro Digital' : s >= 30 ? '🕵️ Detective' : s >= 10 ? '🧭 Explorador' : '🐣 Aprendiz'; };
  const xpMap = t => t.xpBy || (t.xpBy = {});
  const xpOf = t => Object.values(xpMap(t)).reduce((a, b) => a + b, 0);
  const XPR = [[0, '🥚 Novato'], [100, '⚡ Aprendiz'], [250, '🦸 Héroe'], [450, '🌟 Superhéroe'], [700, '👑 Leyenda']];
  const xpRank = x => XPR.filter(k => x >= k[0]).pop();
  const xpNext = x => XPR.find(k => k[0] > x);
  /* Nivel 3: puntos de misión (PM) y rangos de cyber-agente. Se guardan aparte en t.mpBy (valor por defecto = {}) */
  const mpMap = t => t.mpBy || (t.mpBy = {});
  const mpOf = t => Object.values(mpMap(t)).reduce((a, b) => a + b, 0);
  const MPR = [[0, '🔰 Recluta'], [150, '🎖️ Agente'], [330, '🕵️ Detective'], [560, '🔍 Inspector'], [800, '🧠 Maestro Cyber']];
  const mpRank = x => MPR.filter(k => x >= k[0]).pop();
  const mpNext = x => MPR.find(k => k[0] > x);
  const avatarsOf = t => t.players.map(p => p.avatar).join(' ');
  const namesOf = t => t.players.map(p => p.name).join(' y ');
  const goto = u => { location.href = u; };

  /* ---------- insignias ---------- */
  const BADGES = [
    { id: 'first', e: '🌱', t: 'Primera misión', d: 'Completaron su primera clase' },
    { id: 'perfect', e: '💎', t: 'Sin errores', d: 'Una clase con 3 estrellas' },
    { id: 'key', e: '🗝️', t: 'Llavero', d: 'Abrieron algo con la contraseña' },
    { id: 'hero', e: '🦸', t: 'Súper clave', d: 'Crearon su superhéroe y su clave secreta' },
    { id: 'combo', e: '🔥', t: 'Combo x5', d: 'Cinco aciertos seguidos' },
    { id: 'duo', e: '🤝', t: 'Dúo dinámico', d: 'En pareja, los dos sumaron aciertos' },
    { id: 'back', e: '🔁', t: 'Nunca me rindo', d: 'Retomaron una clase guardada y la terminaron' },
    { id: 's10', e: '⭐', t: '10 estrellas', d: 'Juntaron 10 estrellas' },
    { id: 's30', e: '🌟', t: '30 estrellas', d: 'Juntaron 30 estrellas' },
    { id: 's60', e: '🌠', t: '60 estrellas', d: 'Juntaron 60 estrellas' },
    { id: 'lv1', e: '🟣', t: 'Nivel 1 completo', d: 'Terminaron las 10 clases del Nivel 1' },
    { id: 'lv2', e: '🟢', t: 'Nivel 2 completo', d: 'Terminaron las 10 clases del Nivel 2' },
    { id: 'lv3', e: '🔵', t: 'Nivel 3 completo', d: 'Terminaron las 10 clases del Nivel 3' },
    { id: 'ghost', e: '👻', t: 'Agente fantasma', d: 'Nivel 3: una misión sin errores y sin pistas' },
    { id: 'agente', e: '🎖️', t: 'Rango: Agente', d: 'Nivel 3: llegaron a Agente (150 PM)' },
    { id: 'inspector', e: '🔍', t: 'Rango: Inspector', d: 'Nivel 3: llegaron a Inspector (560 PM)' },
    { id: 'maestro', e: '🧠', t: 'Maestro Cyber', d: 'Nivel 3: llegaron al rango máximo (800 PM)' }
  ];
  function award(t, ids) {
    const fresh = [];
    ids.forEach(id => { if (!t.badges[id]) { t.badges[id] = Date.now(); fresh.push(BADGES.find(b => b.id === id)); } });
    return fresh.filter(Boolean);
  }

  /* ---------- sonido, voz, confeti, avisos ---------- */
  let actx;
  function tones(freqs, type, step, vol) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      freqs.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain(), t0 = actx.currentTime + i * (step || .1);
        o.frequency.value = f; o.type = type || 'triangle';
        g.gain.setValueAtTime(vol || .12, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + .2);
        o.connect(g); g.connect(actx.destination); o.start(t0); o.stop(t0 + .22);
      });
    } catch (e) {}
  }
  const beep = ok => ok ? tones([523, 659, 784], 'triangle') : tones([220, 180], 'sawtooth');
  const chime = kind => kind === 'unlock' ? tones([392, 523, 659, 784, 1047], 'triangle', .09) : kind === 'turn' ? tones([660, 880], 'sine', .08, .08) : tones([784, 988, 1175], 'triangle', .1);
  function speak(t, force) {
    if (!('speechSynthesis' in window) || (!S.sound && !force)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(t).replace(/<[^>]+>/g, ''));
      u.lang = 'es-AR'; u.rate = .95; u.pitch = 1.1; speechSynthesis.speak(u);
    } catch (e) {}
  }
  function confetti(n) {
    const em = ['🎉', '⭐', '✨', '🎈', '🌟', '💜'];
    for (let i = 0; i < (n || 36); i++) {
      const c = h('span.confetti', { style: `left:${Math.random() * 100}vw;animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * .6}s` }, em[i % em.length]);
      document.body.append(c); setTimeout(() => c.remove(), 5500);
    }
  }
  function toastBox() { let b = document.getElementById('toasts'); if (!b) { b = h('div', { id: 'toasts' }); document.body.append(b); } return b; }
  function toast(emoji, title, sub, ms) {
    const t = h('div.toast', {}, h('span.te', {}, emoji), h('div', {}, h('b', {}, title), sub ? h('small', {}, sub) : null));
    toastBox().append(t); setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 400); }, ms || 3600);
  }
  function flash(txt) {
    let f = document.getElementById('saveflash');
    if (!f) { f = h('div', { id: 'saveflash' }); document.body.append(f); }
    f.textContent = txt; f.className = 'show'; clearTimeout(lastSaveFlash);
    lastSaveFlash = setTimeout(() => f.className = '', 1500);
  }
  function download(name, text) {
    const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name });
    document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- envío de dibujos a Google Drive (Apps Script) ---------- */
  const DQ = 'ev_drive_q';
  const dqLoad = () => { try { return JSON.parse(localStorage.getItem(DQ) || '[]'); } catch (e) { return []; } };
  const dqSave = q => { try { localStorage.setItem(DQ, JSON.stringify(q)); return true; } catch (e) { return false; } };
  async function drivePost(p) {
    const r = await fetch(CFG.driveUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(Object.assign({ token: CFG.driveToken || '' }, p)) });
    const j = await r.json();
    if (!j.ok) { const er = new Error(j.error || 'error'); er.server = true; throw er; }
    return j;
  }
  /* "bandeja de salida": se guarda primero y se borra al confirmarse; si falta internet se reintenta solo */
  async function driveSend(p) {
    if (!CFG.driveUrl) return 'off';
    const drop = () => dqSave(dqLoad().filter(x => x.file !== p.file));
    const q = dqLoad().filter(x => x.file !== p.file); q.push(p); while (q.length > 6) q.shift();
    const stored = dqSave(q);
    try { await drivePost(p); drop(); return 'ok'; } catch (e) { if (e.server) { drop(); return 'bad'; } return stored ? 'queued' : 'bad'; }
  }
  async function driveFlush() {
    if (!CFG.driveUrl || !navigator.onLine) return;
    const rest = [];
    for (const p of dqLoad()) { try { await drivePost(p); } catch (e) { if (!e.server) rest.push(p); } }
    dqSave(rest);
  }
  window.addEventListener('online', driveFlush); setTimeout(driveFlush, 2500);
  function printImage(url, title) {
    const sh = h('div.printsheet', {}, h('h2', {}, title), h('img', { src: url }));
    document.body.append(sh); document.body.classList.add('printing');
    const done = () => { document.body.classList.remove('printing'); sh.remove(); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); setTimeout(() => window.print(), 120); setTimeout(done, 120000);
  }

  /* ---------- barra superior ---------- */
  function topbar(backHref, backText, extra) {
    const t = T();
    const snd = h('button.iconbtn', { title: 'Sonido', 'aria-label': 'Sonido' }, S.sound ? '🔊' : '🔇');
    snd.onclick = () => { S.sound = !S.sound; save(true); snd.textContent = S.sound ? '🔊' : '🔇'; if (!S.sound) try { speechSynthesis.cancel(); } catch (e) {} };
    return h('div.top', {},
      backHref ? h('a.back', { href: backHref }, backText || '← Volver') : h('span'),
      h('div.tools', {},
        extra,
        t ? h('a.chip.teamchip', { href: ROOT + 'index.html', title: 'Cambiar de equipo' }, avatarsOf(t) + ' ' + t.name) : null,
        t ? h('span.chip', {}, '⭐ ' + totalStars(t)) : null,
        snd));
  }
  const lvlUrl = l => ROOT + 'nivel' + l + '/index.html';

  /* ---------- ventana de contraseña (candado) ---------- */
  let lockedUntil = 0;
  function lockModal(o) {
    const ov = h('div.modal', { role: 'dialog', 'aria-modal': 'true' });
    const emo = h('div.lockem', {}, '🔒');
    const msg = h('p.sub', {}, o.msg);
    const err = h('div.lockerr', {}, '');
    const inp = h('input.pw.lockin', { type: 'text', placeholder: '🔑 Contraseña', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', maxlength: 24 });
    const go = h('button.btn.big', {}, '🔓 Abrir');
    let fails = 0;
    const close = () => { ov.remove(); document.body.classList.remove('noscroll'); };
    function submit() {
      if (Date.now() < lockedUntil) { err.textContent = '⏳ Espera un momento y prueba de nuevo.'; return; }
      const r = o.verify(inp.value);
      if (r.ok) {
        emo.textContent = '🔓'; emo.classList.add('open'); err.textContent = ''; inp.setAttribute('disabled', ''); go.setAttribute('disabled', '');
        chime('unlock'); confetti(24); if (o.speakOk) speak('¡Abierto!');
        setTimeout(() => { close(); o.onOk(r); }, 900);
      } else {
        fails++; err.textContent = '❌ ' + r.msg; beep(false); card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
        if (o.speakOk) speak(r.msg);
        if (fails >= 3) { lockedUntil = Date.now() + 8000; fails = 0; go.setAttribute('disabled', ''); let s = 8; const iv = setInterval(() => { s--; err.textContent = `⏳ Muchos intentos. Espera ${s} s…`; if (s <= 0) { clearInterval(iv); go.removeAttribute('disabled'); err.textContent = ''; } }, 1000); }
        inp.select();
      }
    }
    go.onclick = submit; inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); if (e.key === 'Escape') close(); });
    const card = h('div.card.modalcard', {}, emo, h('h2', {}, o.title), msg, inp, err,
      h('div', { style: 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px' }, go, h('button.btn.ghost', { on: { click: close } }, 'Cerrar')));
    ov.append(card); ov.addEventListener('click', e => { if (e.target === ov) close(); });
    document.body.append(ov); document.body.classList.add('noscroll'); setTimeout(() => inp.focus(), 50);
    if (o.speakOk) speak(o.title + '. ' + o.msg);
    return ov;
  }
  /* verificación: devuelve función para lockModal */
  function verifier(expected, prereqOK, prereqMsg) {
    return input => {
      const v = norm(input);
      if (!v) return { ok: false, msg: 'Escribe la contraseña.' };
      if (CFG.masterPin && v === norm(CFG.masterPin)) return { ok: true, master: true };
      if (!prereqOK) return { ok: false, msg: prereqMsg };
      if (v === norm(expected)) return { ok: true };
      return { ok: false, msg: 'Esa no es la contraseña. ¡Pregúntale a tu profe!' };
    };
  }
  function openClassLock(t, l, n, onOk) {
    /* la contraseña de la clase la abre directamente, sin exigir haber terminado la anterior */
    lockModal({
      title: `Clase ${n} bloqueada`, speakOk: l === 1,
      msg: 'Pídele a tu profe la contraseña secreta para abrir esta clase. 👩‍🏫',
      verify: verifier(CFG.passwords[keyOf(l, n)], true, ''),
      onOk: r => { t.unlocked[keyOf(l, n)] = true; const f = award(t, ['key']); save(); f.forEach(b => toast(b.e, '¡Insignia: ' + b.t + '!', b.d)); (onOk || (() => goto(ROOT + `nivel${l}/clase${n}.html`)))(r); }
    });
  }
  function openLevelLock(t, l, onOk) {
    /* cada nivel es para un grupo distinto: la contraseña del nivel lo abre sin exigir haber terminado el anterior */
    lockModal({
      title: `${LV(l).emoji} Nivel ${l}: ${LV(l).name}`, speakOk: false,
      msg: 'Pídele a tu profe la contraseña secreta para abrir este nivel. 👩‍🏫',
      verify: verifier(CFG.passwords['L' + l], true, ''),
      onOk: r => { (S.lvOpen || (S.lvOpen = {}))[l] = true; gateSet(l); let f = []; if (t) { t.unlocked['L' + l] = true; f = award(t, ['key']); } save(); f.forEach(b => toast(b.e, '¡Insignia: ' + b.t + '!', b.d)); (onOk || (() => goto(lvlUrl(l))))(r); }
    });
  }

  /* ---------- respaldo ---------- */
  function exportAll() { download(`escuela-verano-progreso-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify({ app: 'escuela-verano', v: 4, exported: new Date().toISOString(), state: S }, null, 1)); }
  function importText(txt, replace) {
    let d; try { d = JSON.parse(txt); } catch (e) { return { ok: false, msg: 'El archivo no es válido.' }; }
    const st = d && d.app === 'escuela-verano' ? d.state : d;
    if (!st || !st.teams) return { ok: false, msg: 'No parece un archivo de progreso de la escuela.' };
    if (replace) S = Object.assign({ v: 4, sound: true, active: null, teams: {} }, st);
    else { Object.assign(S.teams, st.teams); }
    save(true); return { ok: true, n: Object.keys(st.teams).length };
  }
  function backupModal() {
    const ov = h('div.modal');
    const close = () => { ov.remove(); document.body.classList.remove('noscroll'); };
    const file = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
    const res = h('div.lockerr', { style: 'color:inherit' }, '');
    file.onchange = () => {
      const f = file.files[0]; if (!f) return; const rd = new FileReader();
      rd.onload = () => { const r = importText(String(rd.result), false); res.textContent = r.ok ? `✅ Se cargaron ${r.n} equipo(s).` : '❌ ' + r.msg; if (r.ok) setTimeout(() => location.reload(), 1200); };
      rd.readAsText(f);
    };
    ov.append(h('div.card.modalcard', {}, h('div.lockem', {}, '💾'), h('h2', {}, 'Respaldo del progreso'),
      h('p.sub', {}, storageOK ? 'Tu progreso se guarda solo en esta compu. Si limpian los datos del navegador o cambian de compu, usá el archivo de respaldo.' : '⚠️ Este navegador no deja guardar datos (¿ventana privada?). Usá el archivo de respaldo.'),
      h('div', { style: 'display:grid;gap:10px;margin-top:14px' },
        h('button.btn', { on: { click: () => { exportAll(); res.textContent = '✅ Archivo descargado.'; } } }, '⬇️ Descargar mi progreso'),
        h('button.btn.ghost', { on: { click: () => file.click() } }, '⬆️ Cargar un archivo de progreso'),
        file, res, h('button.btn.ghost', { on: { click: close } }, 'Cerrar'))));
    ov.addEventListener('click', e => { if (e.target === ov) close(); });
    document.body.append(ov); document.body.classList.add('noscroll');
  }

  /* ============================================================
     PORTAL: equipos → inicio del equipo
     ============================================================ */
  function portal() {
    const app = document.getElementById('app');
    let view = 'levels', lvSel = 1;
    const f = { mode: 2, p: [{ name: '', avatar: '🦊' }, { name: '', avatar: '🐼' }], tname: '' };
    const hero = (sub) => h('div.hero', {}, h('div.logo', {}, '🚀'), h('h1', {}, 'Escuela de Verano Tecnológica'), h('p.sub', {}, sub));
    const miniProg = t => h('span.mini', {}, [1, 2, 3].map(l => h('span', {}, LV(l).emoji + ' ' + doneIn(t, l) + '/10')));

    function render() { app.innerHTML = ''; ({ levels: vLevels, teams: vTeams, new: vNew, home: vHome })[view](); window.scrollTo(0, 0); }

    const teamsOf = l => Object.values(S.teams).filter(t => teamLevel(t) === l);
    function vLevels() {
      app.append(topbar(null), hero('¡Bienvenidos! Elijan su nivel para ver sus equipos.'));
      const levels = h('div.levels');
      [1, 2, 3].forEach(l => {
        const L = LV(l), ok = gateOK(l);
        const el = h('a.lvl.l' + l + (ok ? '' : '.locked'), { href: '#' },
          h('span.em', {}, ok ? L.emoji : '🔒'),
          h('span', {}, h('b', {}, `Nivel ${l}: ${L.name} (${L.age})`), h('small', {}, ok ? L.desc : 'Se abre con la contraseña de tu profe. 🔑')),
          h('span.prog', {}, ok ? 'Entrar ▶' : '🔑'));
        el.onclick = e => { e.preventDefault(); const go = () => { lvSel = l; view = teamsOf(l).length ? 'teams' : 'new'; render(); }; ok ? go() : openLevelLock(null, l, go); };
        levels.append(el);
      });
      levels.append(h('a.lvl.l4', { href: 'juegos/index.html' }, h('span.em', {}, '🎮'), h('span', {}, h('b', {}, 'Juegos'), h('small', {}, '5 juegos para ayudar al profe contra el malvado Dr. Bug')), h('span.prog', {}, 'Jugar ▶')));
      app.append(levels, h('div.linksrow', {}, h('button.linkbtn', { on: { click: backupModal } }, '💾 Respaldo'), h('a.linkbtn', { href: 'docente.html' }, '🔧 Docentes')));
      if (!storageOK) app.append(h('p.warn', {}, '⚠️ Este navegador no permite guardar el progreso. Salgan de la ventana privada o usen el respaldo.'));
    }

    function vTeams() {
      app.append(topbar(null), hero(`${LV(lvSel).emoji} Nivel ${lvSel}: ¿Quién juega hoy? Elijan su equipo para seguir donde quedaron.`));
      const list = teamsOf(lvSel).sort((a, b) => (b.id === S.active) - (a.id === S.active) || (b.last || 0) - (a.last || 0));
      const grid = h('div.teams');
      list.forEach(t => grid.append(h('button.team' + (t.id === S.active ? '.lastone' : ''), { on: { click: () => { S.active = t.id; t.last = Date.now(); save(true); lvSel = teamLevel(t); view = 'home'; render(); } } },
        h('span.tav', {}, avatarsOf(t)),
        h('span.tn', {}, h('b', {}, t.name), h('small', {}, (t.mode === 2 ? '👥 Pareja' : '🙂 Solo/a') + ' · ⭐ ' + totalStars(t) + ' · ' + rankOf(t)), miniProg(t)),
        t.id === S.active ? h('span.tag', {}, 'Última vez') : null)));
      app.append(grid, h('div', { style: 'text-align:center;margin-top:18px' }, h('button.btn.big', { on: { click: () => { view = 'new'; render(); } } }, '➕ Equipo nuevo'), ' ', h('button.btn.ghost', { on: { click: () => { view = 'levels'; render(); } } }, '← Cambiar de nivel')));
      app.append(h('div.linksrow', {}, h('button.linkbtn', { on: { click: backupModal } }, '💾 Respaldo'), h('a.linkbtn', { href: 'docente.html' }, '🔧 Docentes')));
      if (!storageOK) app.append(h('p.warn', {}, '⚠️ Este navegador no permite guardar el progreso. Salgan de la ventana privada o usen el respaldo.'));
    }

    function vNew() {
      app.append(topbar(null), hero(`${LV(lvSel).emoji} Nivel ${lvSel}: ¡Hola! Armen su equipo. Pueden jugar solos o de a dos en la misma compu.`));
      const card = h('div.card.newteam');
      const modeRow = h('div.modes', {}, [[1, '🙂', 'Juego solo/a'], [2, '👥', 'Somos dos (pareja)']].map(([m, e, t]) =>
        h('button.mode' + (f.mode === m ? '.sel' : ''), { on: { click: () => { f.mode = m; render(); } } }, h('span.e', {}, e), t)));
      card.append(h('h2', {}, '¿Cuántos juegan?'), modeRow);
      for (let k = 0; k < f.mode; k++) {
        const pl = f.p[k], other = f.p[1 - k];
        const inp = h('input', { placeholder: f.mode === 2 ? `✏️ Nombre de ${k ? 'la segunda' : 'la primera'} persona` : '✏️ Tu nombre', maxlength: 14, autocomplete: 'off', value: pl.name });
        inp.oninput = () => { pl.name = inp.value.trim().slice(0, 14); };
        const av = h('div.avatars', {}, AVATARS.map(a => {
          const taken = f.mode === 2 && other.avatar === a;
          const b = h('button' + (a === pl.avatar ? '.sel' : ''), { 'aria-label': 'Avatar ' + a, disabled: taken ? '' : null }, a);
          b.onclick = () => { pl.avatar = a; render(); };
          return b;
        }));
        card.append(h('div.pblock', {}, h('div.ptitle', {}, f.mode === 2 ? `Jugador/a ${k + 1} ${pl.avatar}` : `Tu avatar ${pl.avatar}`), inp, av));
      }
      const err = h('p.lockerr', {}, '');
      const create = h('button.btn.big', {}, '✅ ¡Listo, a jugar!');
      create.onclick = () => {
        const ps = f.p.slice(0, f.mode).map(p => ({ name: p.name.trim(), avatar: p.avatar }));
        if (ps.some(p => !p.name)) { err.textContent = '✏️ Escriban el nombre de todos los jugadores.'; return; }
        if (f.mode === 2 && norm(ps[0].name) === norm(ps[1].name)) { err.textContent = '👀 Los nombres tienen que ser distintos.'; return; }
        const t = newTeam({ mode: f.mode, players: ps, lv: lvSel });
        S.teams[t.id] = t; S.active = t.id; save(); chime('badge'); confetti(20); view = 'home'; render();
      };
      card.append(err, h('div', { style: 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px' }, create,
        h('button.btn.ghost', { on: { click: () => { view = teamsOf(lvSel).length ? 'teams' : 'levels'; render(); } } }, '← Volver')));
      app.append(card);
    }

    function vHome() {
      const t = T(); if (!t) { view = 'levels'; return render(); }
      app.append(topbar(null));
      app.append(h('div.card.teamhead', {},
        h('div.tav.big', {}, avatarsOf(t)),
        h('div', { style: 'flex:1;min-width:180px' }, h('h1', {}, '¡Hola, ' + namesOf(t) + '!'), h('p.sub', {}, (t.mode === 2 ? '👥 Equipo de dos · ' : '') + rankOf(t) + ' · ⭐ ' + totalStars(t) + ' de 90')),
        h('button.btn.ghost', { on: { click: () => { lvSel = teamLevel(t); view = 'teams'; render(); } } }, '🔄 Cambiar de equipo'),
        h('button.btn.ghost', { on: { click: () => { view = 'levels'; render(); } } }, '🎚️ Cambiar de nivel')));
      if (t.resume) {
        const r = t.resume, m = /^n(\d)c(\d+)$/.exec(r.key);
        if (m) app.append(h('a.resume', { href: ROOT + `nivel${m[1]}/clase${m[2]}.html` }, h('span', {}, '▶️'), h('span', {}, h('b', {}, 'Continuar donde quedaron'), h('small', {}, `${LV(m[1]).emoji} Nivel ${m[1]} · Clase ${m[2]}: ${clsMeta(m[1], +m[2]).t.replace(/^\S+\s/, '')} (paso ${r.step + 1})`))));
      }
      const levels = h('div.levels');
      [1, 2, 3].forEach(l => { /* el equipo puede entrar a cualquier nivel con la contraseña de ese nivel, haya terminado o no el anterior */
        const open = levelOpen(t, l), n = doneIn(t, l), L = LV(l);
        const el = h('a.lvl.l' + l + (open ? '' : '.locked'), { href: open ? lvlUrl(l) : '#' },
          h('span.em', {}, open ? L.emoji : '🔒'),
          h('span', {}, h('b', {}, `Nivel ${l}: ${L.name} (${L.age})`), h('small', {}, open ? L.desc : 'Se abre con la contraseña de tu profe. 🔑')),
          h('span.prog', {}, n + '/10 ⭐'));
        if (!open) el.onclick = e => { e.preventDefault(); openLevelLock(t, l); };
        levels.append(el);
      });
      app.append(levels);
      const shelf = h('div.shelf');
      BADGES.forEach(b => shelf.append(h('div.badge' + (t.badges[b.id] ? '.got' : ''), { title: b.d }, h('span.be', {}, t.badges[b.id] ? b.e : '❔'), h('small', {}, t.badges[b.id] ? b.t : '???'))));
      app.append(h('div.card', { style: 'margin-top:22px' }, h('h2', {}, '🏅 Insignias del equipo'), shelf));
      app.append(h('div.linksrow', {}, h('button.linkbtn', { on: { click: backupModal } }, '💾 Respaldo'), h('a.linkbtn', { href: 'docente.html' }, '🔧 Docentes')));
    }
    render();
  }

  /* ============================================================
     MAPA DE UN NIVEL
     ============================================================ */
  function guardTeam(app) {
    const t = T();
    if (t) return t;
    app.append(h('div.card', { style: 'text-align:center;margin-top:30px' }, h('div', { style: 'font-size:4rem' }, '👋'), h('h1', {}, '¡Primero elijan su equipo!'), h('p.sub', { style: 'margin:8px 0 18px' }, 'Así guardamos sus estrellas y su progreso.'), h('a.btn.big', { href: ROOT + 'index.html' }, '🚀 Elegir equipo')));
    return null;
  }
  function levelMap(L) {
    const app = document.getElementById('app'), t = guardTeam(app); if (!t) return;
    document.body.classList.add('n' + L);
    const Lv = LV(L);
    if (!levelOpen(t, L)) {
      app.append(topbar(ROOT + 'index.html', '← Inicio'), h('div.card', { style: 'text-align:center;margin-top:20px' }, h('div.lockem', {}, '🔒'), h('h1', {}, `Nivel ${L}: ${Lv.name}`), h('p.sub', { style: 'margin:8px 0 18px' }, 'Este nivel todavía está bloqueado.'), h('button.btn.big', { on: { click: () => openLevelLock(t, L, () => location.reload()) } }, '🔑 Poner contraseña')));
      return;
    }
    const nxN = (() => { for (let i = 1; i <= 10; i++) if (classOpen(t, L, i) && !t.done[keyOf(L, i)]) return i; return 0; })();
    const n = doneIn(t, L), st = starsIn(t, L);
    app.append(topbar(ROOT + 'index.html', '← Inicio'));
    app.append(h('div.lhead', {}, h('span.lem', {}, Lv.emoji), h('div', {}, L === 3 ? h('p.termline', {}, '> agente@cic2:~$ ./misiones --nivel 3') : null, h('h1', {}, `Nivel ${L}: ${Lv.name}`), h('p.sub', {}, L === 3 ? `${Lv.age} · Elegí la misión de hoy` : `${Lv.age} · Elijan la misión de hoy:`))));
    const who = t.mode === 2 ? `${t.players[0].name} y ${t.players[1].name}` : t.players[0].name;
    const msg = n === 0 ? `¡Hola, ${who}! Soy ${Lv.mascot.name}. Empecemos la misión 1.` : n === 10 ? `¡Completaron todas las misiones, ${who}! Son un gran equipo.` : (t.resume && t.resume.key.startsWith('n' + L + 'c') ? `¡Bienvenidos de vuelta! Tienen una clase guardada: ¡sigamos!` : (nxN ? `¡Van genial, ${who}! Sigue la misión ${nxN}.` : `¡Van genial, ${who}! La próxima clase necesita la contraseña de tu profe. 🔑`));
    app.append(h('div.mascot.bitbox', {}, h('div.face', {}, Lv.mascot.emoji), h('div.bubble', {}, h('b', {}, Lv.mascot.name + ': '), msg)));
    app.append(h('div.rank', {}, L === 3 ? `⭐ ${st} de 30 en este nivel` : `${rankOf(t)} · ⭐ ${st} de 30 en este nivel`));
    if (L === 2) { const x = xpOf(t), nx = xpNext(x), r = xpRank(x); app.append(h('div.xpbar', {}, h('b', {}, `⚡ ${x} XP · ${r[1]}`), h('div.bar', {}, h('i', { style: `width:${nx ? Math.round((x - r[0]) / (nx[0] - r[0]) * 100) : 100}%` })), h('small', {}, nx ? `Faltan ${nx[0] - x} XP para ${nx[1]}` : '¡Rango máximo!'))); }
    if (L === 3) { const x = mpOf(t), nx = mpNext(x), r = mpRank(x); app.append(h('div.xpbar.mpbar', {}, h('b', {}, `🎯 ${x} PM · ${r[1]}`), h('div.bar', {}, h('i', { style: `width:${nx ? Math.round((x - r[0]) / (nx[0] - r[0]) * 100) : 100}%` })), h('small', {}, nx ? `Faltan ${nx[0] - x} PM para ${nx[1]}` : '¡Rango máximo alcanzado!'))); }
    app.append(h('div.prow', {}, h('div.bar', {}, h('i', { style: `width:${n * 10}%` })), h('span.plabel', {}, n === 10 ? '🏆 ¡Completaste todo!' : n + '/10 misiones')));
    const path = h('div.path');
    for (let i = 1; i <= 10; i++) {
      const m = clsMeta(L, i), s = t.done[keyOf(L, i)] || 0, open = classOpen(t, L, i), isRes = t.resume && t.resume.key === keyOf(L, i);
      const el = h('a.station' + (s ? '.done' : '') + (open ? '' : '.locked') + (i === nxN ? '.next' : ''), { href: open ? `clase${i}.html` : '#' },
        h('span.n', {}, s ? '✓' : open ? (L === 3 ? String(i).padStart(2, '0') : i) : '🔒'),
        h('span.tx', {}, h('b', {}, m.t), h('em', {}, open ? m.d : 'Se abre con la contraseña de tu profe 🔑'), h('span.st', {}, s ? '⭐'.repeat(s) + '☆'.repeat(3 - s) : (open ? '☆☆☆' : ''))),
        h('span.go', {}, open ? '▶' : '🔑'),
        i === nxN ? h('span.tag', {}, isRes ? '¡Sigan acá! 💾' : '¡Sigan acá!') : null);
      if (!open) el.onclick = e => { e.preventDefault(); openClassLock(t, L, i, () => goto(`clase${i}.html`)); };
      path.append(el);
    }
    app.append(path);
  }

  /* ============================================================
     CORREDOR DE CLASE
     ============================================================ */
  function start(cfg) {
    const app = document.getElementById('app'), t = guardTeam(app); if (!t) return;
    document.body.classList.add('n' + cfg.level);
    const L = cfg.level, N = cfg.num, key = keyOf(L, N), pair = t.mode === 2;
    const mapUrl = ROOT + `nivel${L}/index.html`;
    if (!classOpen(t, L, N)) {
      app.append(topbar(mapUrl, '← Mapa de misiones'), h('div.card', { style: 'text-align:center;margin-top:20px' }, h('div.lockem', {}, '🔒'), h('h1', {}, `Clase ${N}: ${cfg.title}`), h('p.sub', { style: 'margin:8px 0 18px' }, 'Esta clase todavía está bloqueada.'),
        h('button.btn.big', { on: { click: () => (levelOpen(t, L) ? openClassLock(t, L, N, () => location.reload()) : openLevelLock(t, L, () => location.reload())) } }, '🔑 Poner contraseña')));
      return;
    }
    let i = 0, mistakes = 0, hints = 0, elapsed = 0, resumed = false, cur = 0, running = false, timerIv = null, warned = false;
    let cs = [{ ok: 0, err: 0 }, { ok: 0, err: 0 }];
    const XPON = L === 2 || L === 3, CY = L === 3; /* puntos: XP en Nivel 2, puntos de misión (PM) en Nivel 3 */
    const PT = CY ? { map: mpMap, of: mpOf, rank: mpRank } : { map: xpMap, of: xpOf, rank: xpRank };
    let xp = 0, combo = 0, bestCombo = 0; const pb = () => PT.map(t)[key] || 0;
    const ptsNow = () => PT.of(t) - pb() + Math.max(pb(), xp);
    const xpChip = h('span.chip.xpchip', {}, '');
    const xpShow = () => { if (XPON) xpChip.textContent = CY ? '🎯 ' + ptsNow() + ' PM' : '⚡ ' + ptsNow() + ' XP'; };
    const pop = txt => { const e = h('span.pow', {}, txt); document.body.append(e); setTimeout(() => e.remove(), 1100); };
    const startTurn = Object.keys(t.done).length % 2;
    const rs = t.resume && t.resume.key === key && t.resume.step > 0 ? t.resume : null;

    const face = h('div.face', {}, cfg.mascot.emoji);
    const bubble = h('div.bubble'), dots = h('div.dots', {}, cfg.steps.map(() => h('i')));
    const stage = h('div.stage'), fb = h('div.fb'), nextWrap = h('div.next');
    const spk = h('button.spk', { title: 'Escuchar', 'aria-label': 'Escuchar' }, '🔊');
    const hintBtn = h('button.hintbtn', { 'aria-label': 'Pista' }, '💡 Pista');
    const timerChip = h('span.chip.timer', {}, '⏱️ 00:00');
    const duo = pair ? h('div.duo', {}, t.players.map((p, k) => h('div.pl', {}, h('span.pa', {}, p.avatar), h('span', {}, h('b', {}, p.name), h('small', {}, '')))) ) : null;
    let lastSay = '';
    spk.onclick = () => speak(lastSay, true);

    function paintTurn(announce) {
      if (!duo) return;
      [...duo.children].forEach((el, k) => { el.classList.toggle('on', k === cur); el.querySelector('small').textContent = k === cur ? '¡Te toca!' : '👀 Ayuda'; });
      if (announce) { duo.classList.remove('bump'); void duo.offsetWidth; duo.classList.add('bump'); chime('turn'); }
    }
    function pass() { if (!pair) return; cur = 1 - cur; paintTurn(true); }
    function mood(good) { face.classList.remove('jump', 'wob'); void face.offsetWidth; face.classList.add(good ? 'jump' : 'wob'); }

    function say(txt) { lastSay = txt; bubble.innerHTML = ''; bubble.append(h('b', {}, cfg.mascot.name + ': '), txt, ' '); bubble.append(spk); if (cfg.voice) speak((pair ? 'Turno de ' + t.players[cur].name + '. ' : '') + txt); }
    function feedback(txt, good) { fb.className = 'fb show ' + (good ? 'good' : 'bad'); fb.textContent = (good ? (CY ? '✔ ' : '🎉 ') : (CY ? '⚠ ' : '💡 ')) + txt; beep(good); mood(good); if (cfg.voice) speak(txt); }
    function good(txt) { cs[cur].ok++; feedback(txt, true); if (XPON) { combo++; bestCombo = Math.max(bestCombo, combo); const g = 10 + (combo >= 3 ? 5 : 0); xp += g; xpShow(); pop(CY ? (combo >= 3 ? `RACHA x${combo} · +${g} PM` : `+${g} PM`) : (combo >= 3 ? `¡COMBO x${combo}! +${g}` : `¡+${g} XP!`)); } }
    function bad(txt) { mistakes++; cs[cur].err++; feedback(txt, false); combo = 0; }
    function complete() {
      nextWrap.innerHTML = '';
      const last = i === cfg.steps.length - 1;
      nextWrap.append(h('button.btn.big', { on: { click: () => { i++; if (i < cfg.steps.length) { saveResume(); show(); } else finish(); } } }, last ? '🏁 ¡Terminar!' : (pair ? `Siguiente ➡️ (turno de ${t.players[(startTurn + i + 1) % 2].name})` : 'Siguiente ➡️')));
      hintBtn.style.visibility = 'hidden';
      nextWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    const ctx = { say, good, bad, complete, pass, h, shuffle, cfg, mp: () => (CY ? ptsNow() : 0), extra: new Set(), onHint: null, q: txt => h('div.q', {}, h('button.spk', { 'aria-label': 'Escuchar', on: { click: () => speak(txt, true) } }, '🔊'), h('span', { html: txt })) };

    function saveResume(quiet) {
      t.resume = { key, step: i, mistakes, hints, elapsed, cs, xp, combo, resumed: true, at: Date.now() }; t.last = Date.now(); save(!!quiet);
    }
    function show() {
      stage.innerHTML = ''; fb.className = 'fb'; nextWrap.innerHTML = ''; ctx.onHint = null; hintBtn.style.visibility = 'visible';
      dots.querySelectorAll('i').forEach((d, k) => { d.className = k < i ? 'on' : k === i ? 'cur' : ''; });
      cur = (startTurn + i) % 2; paintTurn(i > 0);
      const st = cfg.steps[i];
      if (st.say) say(st.say);
      stage.append(TYPES[st.type](st, ctx));
      if (st.type === 'diploma' || st.type === 'story') hintBtn.style.visibility = 'hidden';
    }
    hintBtn.onclick = () => {
      const r = ctx.onHint ? ctx.onHint() : 'Lean con calma y piensen juntos. ¡Pueden!';
      if (r === false) { fb.className = 'fb show hint'; fb.textContent = '💡 Ya no hay nada más que ayudar: ¡ustedes pueden!'; return; }
      hints++; fb.className = 'fb show hint'; fb.textContent = '💡 ' + (typeof r === 'string' ? r : 'Mira lo que brilla ✨'); if (cfg.voice && typeof r === 'string') speak(r);
    };

    const stars = () => { const e = mistakes + hints * .5; return e <= 1 ? 3 : e <= 4 ? 2 : 1; };
    const fmt = s => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
    function tick() {
      elapsed++; const lim = (cfg.minutes || CFG.minutes || 15) * 60;
      timerChip.textContent = '⏱️ ' + fmt(elapsed) + ' / ' + fmt(lim); timerChip.classList.toggle('over', elapsed > lim);
      if (elapsed === lim && !warned) { warned = true; toast('⏰', '¡Pasaron ' + (cfg.minutes || CFG.minutes || 15) + ' minutos!', 'Terminen esta actividad y avisen a su profe.', 6000); chime('turn'); }
    }

    function finish() {
      clearInterval(timerIv); running = false;
      const s = stars();
      let bonus = 0, oldR = null, newR = null;
      if (XPON) { bonus = s * (CY ? 15 : 10); xp += bonus; oldR = PT.rank(PT.of(t)); PT.map(t)[key] = Math.max(pb(), xp); newR = PT.rank(PT.of(t)); xpShow(); }
      t.done[key] = Math.max(t.done[key] || 0, s);
      cs.forEach((x, k) => { t.stats[k].ok += x.ok; t.stats[k].err += x.err; });
      t.resume = null; t.last = Date.now();
      const ids = ['first', ...ctx.extra]; if (bestCombo >= 5) ids.push('combo'); if (s === 3) ids.push('perfect'); if (resumed) ids.push('back');
      if (pair && cs[0].ok > 0 && cs[1].ok > 0) ids.push('duo');
      const tot = totalStars(t); [10, 30, 60].forEach(x => { if (tot >= x) ids.push('s' + x); });
      if (CY) { if (mistakes === 0 && hints === 0) ids.push('ghost'); const mp = mpOf(t); if (mp >= 150) ids.push('agente'); if (mp >= 560) ids.push('inspector'); if (mp >= 800) ids.push('maestro'); }
      if (doneIn(t, L) === 10) ids.push('lv' + L);
      const fresh = award(t, ids); save();
      confetti(); beep(true);
      if (XPON && newR !== oldR) setTimeout(() => (CY ? toast(newR[1].split(' ')[0], '¡Ascenso de rango!', newR[1], 4500) : toast('🦸', '¡Subieron de rango!', newR[1], 4500)), 300);
      if (fresh.length) setTimeout(() => { chime('badge'); fresh.forEach((b, k) => setTimeout(() => toast(b.e, '¡Insignia nueva: ' + b.t + '!', b.d, 4500), k * 700)); }, 600);
      stage.innerHTML = ''; fb.className = 'fb'; nextWrap.innerHTML = ''; hintBtn.style.visibility = 'hidden'; const sb = app.querySelector('.savebtn'); if (sb) sb.style.display = 'none';
      dots.querySelectorAll('i').forEach(d => d.className = 'on'); if (duo) duo.style.display = 'none';
      const who = pair ? `${t.players[0].name} y ${t.players[1].name}` : t.players[0].name;
      say(CY ? `Misión cumplida, ${who}. Ganaron ${s} ${s > 1 ? 'estrellas' : 'estrella'} y ${xp} puntos de misión.` : `¡Misión cumplida, ${who}! Ganaron ${s} ${s > 1 ? 'estrellas' : 'estrella'}.`);

      let nextLocked = false;
      const nextBtn = (() => {
        if (N < 10) return classOpen(t, L, N + 1) ? h('a.btn', { href: `clase${N + 1}.html` }, 'Siguiente clase ➡️') : (nextLocked = true, h('button.btn.unlock', { on: { click: () => openClassLock(t, L, N + 1) } }, `🔒 Abrir Clase ${N + 1} con contraseña`));
        if (L < 3) return levelOpen(t, L + 1) ? h('a.btn', { href: lvlUrl(L + 1) }, `Ir al Nivel ${L + 1} ➡️`) : (nextLocked = true, h('button.btn.unlock', { on: { click: () => openLevelLock(t, L + 1) } }, `🔒 Abrir Nivel ${L + 1} con contraseña`));
        return null;
      })();
      const sum = pair ? h('div.sumduo', {}, t.players.map((p, k) => h('div.sp', {}, h('span.pa', {}, p.avatar), h('b', {}, p.name), h('small', {}, `✅ ${cs[k].ok} aciertos`), h('small', {}, `🔁 ${cs[k].err} intentos extra`))),
        h('button.btn.ghost.five', { on: { click: e => { e.currentTarget.textContent = '🙌 ¡Chocaron los cinco!'; confetti(30); chime('badge'); } } }, '🙌 ¡Chócala!')) : null;
      stage.append(h('div.card', { style: 'text-align:center' },
        h('div.starsrow', {}, '⭐'.repeat(s) + '☆'.repeat(3 - s)),
        h('h1', {}, CY ? '✔ MISIÓN CUMPLIDA' : '¡Muy bien hecho! 🎉'), h('p.sub', {}, cfg.recap || ''), XPON ? h('div.xpsum', {}, h('b', {}, CY ? `🎯 +${xp} PM` : `⚡ +${xp} XP`), h('small', {}, `(${bonus} de bonus por estrellas)`), h('span', {}, newR[1])) : null, sum,
        fresh.length ? h('div.newbadges', {}, fresh.map(b => h('span.nb', {}, b.e + ' ' + b.t))) : null,
        h('p.savedmsg', {}, CY ? '💾 Progreso guardado en este dispositivo.' : '💾 Su progreso quedó guardado en esta compu.'),
        h('div', { style: 'display:grid;gap:14px;margin-top:18px;justify-items:center' },
          nextLocked ? h('p.sub', { style: 'font-size:.9rem' }, '🔑 Para seguir, tu profe les da la contraseña.') : null,
          nextBtn,
          CFG.showPoki === false ? null : h('a.btn.poki.big', { href: cfg.poki.url, target: '_blank', rel: 'noopener' }, '🎮 ' + cfg.poki.label),
          CFG.showPoki === false ? null : h('p.sub', { style: 'font-size:.85rem' }, 'Se abre en otra pestaña. Jueguen con la profe cerca 👩‍🏫'),
          h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center' },
            h('a.btn.ghost', { href: mapUrl }, '🗺️ Mapa de misiones'),
            h('button.btn.ghost', { on: { click: () => { mistakes = 0; hints = 0; elapsed = 0; cs = [{ ok: 0, err: 0 }, { ok: 0, err: 0 }]; i = 0; resumed = false; xp = 0; combo = 0; bestCombo = 0; if (duo) duo.style.display = ''; begin(); } } }, '🔁 Repetir')))));
    }

    function begin() {
      app.innerHTML = '';
      app.append(topbar(null, null, [XPON ? xpChip : null, timerChip]), h('div.mascot', {}, face, bubble)); if (duo) app.append(duo); app.append(dots, h('div.card', {}, h('div.hintrow', {}, hintBtn, h('button.savebtn', { on: { click: () => { saveResume(); toast('💾', 'Guardado', 'Pueden seguir cuando quieran.', 2200); setTimeout(() => goto(mapUrl), 700); } } }, '💾 Guardar y salir')), stage, fb, nextWrap));
      xpShow(); timerChip.textContent = '⏱️ ' + fmt(elapsed); clearInterval(timerIv); timerIv = setInterval(tick, 1000); running = true;
      show();
    }
    /* pantalla de inicio (da el primer gesto para el audio) */
    app.append(topbar(mapUrl, '← Mapa de misiones'));
    const startNames = pair ? t.players[startTurn].name : '';
    app.append(h('div.card', { style: 'text-align:center' },
      CY ? h('p.termline', {}, `> BRIEFING · MISIÓN ${String(N).padStart(2, '0')}/10`) : null,
      h('div', { style: 'font-size:4rem' }, cfg.emoji), h('h1', {}, `Clase ${N}: ${cfg.title}`), h('p.sub', { style: 'margin:8px 0 14px' }, cfg.intro),
      pair ? h('p.turnnote', {}, `👥 Van a jugar por turnos. Empieza ${t.players[startTurn].avatar} ${startNames}. ¡La otra persona ayuda y piensa con su compañero/a!`) : null,
      rs ? h('p.resumenote', {}, `💾 Tienen esta clase guardada: paso ${rs.step + 1} de ${cfg.steps.length}.`) : null,
      h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center' },
        rs ? h('button.btn.big', { on: { click: () => { i = Math.min(rs.step, cfg.steps.length - 1); mistakes = rs.mistakes || 0; hints = rs.hints || 0; elapsed = rs.elapsed || 0; cs = rs.cs || cs; xp = rs.xp || 0; combo = rs.combo || 0; resumed = true; begin(); } } }, '▶ Continuar donde quedé') : null,
        h('button.btn.big' + (rs ? '.ghost' : ''), { on: { click: () => { if (rs) { t.resume = null; save(true); } begin(); } } }, rs ? '🔄 Empezar de nuevo' : '▶ ¡Empezar!'))));
    window.addEventListener('beforeunload', () => { if (running && i > 0 && i < cfg.steps.length) { t.resume = { key, step: i, mistakes, hints, elapsed, cs, xp, combo, resumed: true, at: Date.now() }; save(true); } });
  }

  /* ---------- tipos de actividad ---------- */
  const pulse = el => { if (!el) return; el.classList.add('hintpulse'); setTimeout(() => el.classList.remove('hintpulse'), 2000); };
  const TYPES = {
    choice(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const grid = c.h('div.opts'); const btns = [];
      st.options.forEach(o => {
        const b = c.h('button.opt', {}, o.e ? c.h('span.e', {}, o.e) : null, o.t || ''); b._ok = !!o.ok; btns.push(b);
        b.onclick = () => {
          if (o.ok) { b.classList.add('ok'); grid.querySelectorAll('.opt').forEach(x => x.setAttribute('disabled', '')); c.good(o.fb || st.fb || '¡Correcto!'); c.complete(); }
          else { b.classList.add('no'); b.setAttribute('disabled', ''); c.bad(o.fb || 'Probemos otra opción.'); c.pass(); }
        };
        grid.append(b);
      });
      (st.shuffle === false ? btns : shuffle(btns)).forEach(x => grid.append(x));
      c.onHint = () => {
        const wrong = btns.filter(b => !b._ok && !b.disabled);
        if (wrong.length > 1 || (wrong.length === 1 && btns.filter(b => !b.disabled).length > 2)) { const w = wrong[0]; w.setAttribute('disabled', ''); w.style.opacity = .35; return 'Saqué una opción que no es. ¡Piensen entre los dos!'; }
        pulse(btns.find(b => b._ok)); return 'Mira la que brilla ✨';
      };
      box.append(grid); return box;
    },
    pick(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const grid = c.h('div.opts'); const sel = new Set(); const btns = [];
      st.options.forEach((o, k) => {
        const b = c.h('button.opt', {}, o.e ? c.h('span.e', {}, o.e) : null, o.t || ''); btns.push(b);
        b.onclick = () => { sel.has(k) ? (sel.delete(k), b.classList.remove('pickd')) : (sel.add(k), b.classList.add('pickd')); };
        grid.append(b);
      });
      const chk = c.h('button.btn', { style: 'margin-top:14px' }, '✔️ Comprobar');
      chk.onclick = () => {
        const wrong = st.options.filter((o, k) => !!o.ok !== sel.has(k));
        if (!wrong.length) { c.good(st.fb || '¡Perfecto!'); chk.setAttribute('disabled', ''); grid.querySelectorAll('.opt').forEach(x => x.setAttribute('disabled', '')); c.complete(); }
        else { c.bad(wrong[0].fb || st.hint || 'Revisen sus elecciones.'); c.pass(); }
      };
      c.onHint = () => { const k = st.options.findIndex((o, j) => o.ok && !sel.has(j)); if (k >= 0) { pulse(btns[k]); return 'Falta marcar una que brilla ✨'; } return 'Ya marcaron todas las buenas. ¿Hay alguna de más? 🤔'; };
      box.append(grid, c.h('div', { style: 'text-align:center' }, chk)); return box;
    },
    sort(st, c) {
      const box = c.h('div'); if (st.q) box.append(c.q(st.q));
      const tray = c.h('div.tray'); let selected = null, left = st.items.length;
      const buckets = c.h('div.buckets'); const bEls = {};
      st.buckets.forEach(b => {
        const inn = c.h('div.in'); const el = c.h('div.bucket', { style: `border-color:${b.color}`, tabindex: 0 }, c.h('h3', { style: `color:${b.color}` }, (b.e || '') + ' ' + b.t), inn);
        el._in = inn; bEls[b.id] = el;
        el.onclick = () => selected && place(selected, b.id, el);
        el.ondragover = e => { e.preventDefault(); el.classList.add('over'); };
        el.ondragleave = () => el.classList.remove('over');
        el.ondrop = e => { e.preventDefault(); el.classList.remove('over'); if (selected) place(selected, b.id, el); };
        buckets.append(el);
      });
      function place(it, bid, el) {
        const data = it._d;
        if (data.b === bid) { it.classList.remove('sel'); it.draggable = false; el._in.append(it); selected = null; c.good(data.fb || '¡Bien!'); if (--left === 0) c.complete(); else c.pass(); }
        else { it.classList.add('no'); setTimeout(() => it.classList.remove('no'), 400); c.bad(data.nofb || 'Ese no va ahí. ¡Prueben otra vez!'); }
      }
      shuffle(st.items).forEach(d => {
        const it = c.h('button.item', { draggable: 'true' }, d.e ? c.h('span.e', {}, d.e) : null, d.t || ''); it._d = d;
        it.onclick = () => { tray.querySelectorAll('.item').forEach(x => x.classList.remove('sel')); it.classList.add('sel'); selected = it; };
        it.ondragstart = e => { selected = it; it.classList.add('sel'); try { e.dataTransfer.setData('text/plain', 'x'); } catch (er) {} };
        tray.append(it);
      });
      c.onHint = () => { const it = selected && selected.parentNode === tray ? selected : tray.querySelector('.item'); if (!it) return false; it.click(); pulse(bEls[it._d.b]); return 'Toca la caja que brilla ✨'; };
      box.append(tray, c.h('p.sub', { style: 'text-align:center;margin-bottom:10px' }, '👆 Toca una tarjeta y luego su caja (o arrástrala).'), buckets);
      return box;
    },
    builder(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const pick = st.slots.map(() => null);
      const out = c.h('div.result', {}, '…');
      const ok = c.h('button.btn.big', { style: 'margin-top:6px' }, '🔐 ¡Guardar mi llave!'); ok.setAttribute('disabled', '');
      const slots = c.h('div.slots');
      st.slots.forEach((s, k) => {
        const chips = c.h('div.chips');
        s.options.forEach(o => {
          const p = c.h('button.pill', {}, o);
          p.onclick = () => { pick[k] = o; chips.querySelectorAll('.pill').forEach(x => x.classList.remove('sel')); p.classList.add('sel'); out.textContent = pick.map(x => x || '…').join(st.join || '-'); if (pick.every(Boolean)) ok.removeAttribute('disabled'); };
          chips.append(p);
        });
        slots.append(c.h('div.slot', {}, c.h('h3', {}, s.label), chips));
      });
      c.onHint = () => st.hint || 'Elijan una pieza de cada fila. ¡Pueden hacerla bien loca y divertida!';
      ok.onclick = () => { ok.setAttribute('disabled', ''); c.good(st.fb || '¡Tu llave mágica quedó genial!'); c.complete(); };
      box.append(slots, out, c.h('div', { style: 'text-align:center' }, ok)); return box;
    },
    meter(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const inp = c.h('input.pw', { type: 'text', placeholder: st.placeholder || 'Escribe una clave de práctica…', autocomplete: 'off', maxlength: 40 });
      const m = c.h('div.meter', {}, c.h('i')); const lbl = c.h('div', { style: 'font-weight:700' }, '');
      const rules = [
        ['Al menos 8 letras o números', v => v.length >= 8], ['Una MAYÚSCULA', v => /[A-ZÁÉÍÓÚÑ]/.test(v)], ['Una minúscula', v => /[a-záéíóúñ]/.test(v)],
        ['Un número', v => /\d/.test(v)], ['Un símbolo (! ? # $ % & *)', v => /[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]/.test(v)],
        ['No es una clave famosa (1234, password, qwerty)', v => v.length > 0 && !/(1234|password|qwerty|contrase|admin|abc123)/i.test(v)]
      ];
      const ul = c.h('ul.rules', {}, rules.map(r => c.h('li', {}, '⬜ ' + r[0])));
      const go = c.h('button.btn', { style: 'margin-top:12px' }, '🔒 Guardar clave'); go.setAttribute('disabled', '');
      inp.oninput = () => {
        const v = inp.value; let n = 0;
        rules.forEach((r, k) => { const o = r[1](v); if (o) n++; ul.children[k].className = o ? 'ok' : ''; ul.children[k].textContent = (o ? '✅ ' : '⬜ ') + r[0]; });
        const pct = Math.round(n / rules.length * 100);
        m.firstChild.style.width = pct + '%'; m.firstChild.style.background = pct < 40 ? '#ef4444' : pct < 80 ? '#f59e0b' : '#22c55e';
        lbl.textContent = !v ? '' : pct < 40 ? '😟 Débil' : pct < 80 ? '🙂 Casi…' : pct < 100 ? '💪 Fuerte' : '🛡️ ¡Súper fuerte!';
        n >= (st.goal || 5) ? go.removeAttribute('disabled') : go.setAttribute('disabled', '');
      };
      c.onHint = () => st.hint || 'Mezclen mayúsculas, minúsculas, números y símbolos. Una frase larga es genial.';
      go.onclick = () => { go.setAttribute('disabled', ''); inp.setAttribute('disabled', ''); c.good(st.fb || '¡Clave fuerte!'); c.complete(); };
      box.append(inp, m, lbl, ul, c.h('p.sub', { style: 'font-size:.85rem;margin-top:8px' }, '🔐 Es solo práctica: no escriban su clave real. Nada se guarda ni se envía.'), go); return box;
    },
    chat(st, c) {
      const box = c.h('div'); if (st.q) box.append(c.q(st.q));
      const msgs = c.h('div.msgs'); const replies = c.h('div.replies');
      const phone = c.h('div.phone', {}, c.h('div.bar2', {}, c.h('span.av', {}, st.contact.e), c.h('div', {}, st.contact.name, c.h('small', {}, st.contact.status || 'en línea'))), msgs, replies);
      const add = (t, cls) => { const m = c.h('div.msg.' + cls, {}, t); msgs.append(m); msgs.scrollTop = msgs.scrollHeight; };
      function node(id) {
        const n = st.nodes[id]; replies.innerHTML = ''; let delay = 0;
        (n.msgs || []).forEach(t => { delay += 700; const ty = c.h('div.typing', {}, 'escribiendo…'); setTimeout(() => { msgs.append(ty); msgs.scrollTop = msgs.scrollHeight; }, delay - 600); setTimeout(() => { ty.remove(); add(t, 'them'); }, delay); });
        setTimeout(() => {
          if (n.end) { add(n.end, 'sys'); c.good(n.fb || '¡Muy bien!'); c.complete(); return; }
          shuffle(n.choices).forEach(ch => {
            const b = c.h('button', {}, ch.t); b._ok = !!ch.ok;
            b.onclick = () => {
              if (ch.ok) { add(ch.t, 'me'); if (ch.fb) c.good(ch.fb); c.pass(); node(ch.next); }
              else { b.setAttribute('disabled', ''); b.style.opacity = .5; c.bad(ch.fb || 'Mejor otra opción.'); if (ch.react) add(ch.react, 'them'); }
            };
            replies.append(b);
          });
        }, delay + 200);
      }
      c.onHint = () => { const b = [...replies.querySelectorAll('button')].find(x => x._ok && !x.disabled); if (!b) return false; pulse(b); return 'Piensen: ¿qué haría alguien que se cuida? La respuesta que brilla es una buena idea ✨'; };
      box.append(phone); node('start'); return box;
    },
    robot(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const N = st.size; const walls = new Set((st.walls || []).map(w => w.join(','))); const stars = (st.stars || []).map(s => s.join(','));
      let prog = [], running = false;
      const grid = c.h('div.grid', { style: `grid-template-columns:repeat(${N},1fr)` }); const out = c.h('div.prog2');
      function draw(pos, got) {
        grid.innerHTML = '';
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const k = x + ',' + y; let e = '';
          if (walls.has(k)) e = st.wall || '🪨'; else if (k === st.goal.join(',')) e = st.goalE || '🏁'; else if (stars.includes(k) && !got.includes(k)) e = '⭐';
          if (pos.join(',') === k) e = st.bot || '🤖';
          grid.append(c.h('div.cell', {}, e));
        }
      }
      const wrap = () => { out.innerHTML = ''; if (!prog.length) out.append(c.h('span', { style: 'background:none;box-shadow:none;font-size:1rem;color:var(--muted)' }, 'Toquen las flechas para armar el programa…')); prog.forEach(p => out.append(c.h('span', {}, p))); };
      draw(st.start, []); wrap();
      const D = { '⬆️': [0, -1], '⬇️': [0, 1], '⬅️': [-1, 0], '➡️': [1, 0] };
      const pal = c.h('div.pal', {}, Object.keys(D).map(a => c.h('button', { 'aria-label': a, on: { click: () => { if (!running && prog.length < (st.max || 14)) { prog.push(a); wrap(); } } } }, a)));
      const run = c.h('button.btn', {}, '▶️ ¡Ejecutar!'), del = c.h('button.btn.ghost', {}, '⌫ Borrar'), clr = c.h('button.btn.ghost', {}, '🗑️ Todo');
      del.onclick = () => { if (!running) { prog.pop(); wrap(); } };
      clr.onclick = () => { if (!running) { prog = []; wrap(); draw(st.start, []); } };
      c.onHint = () => st.hint || 'Cada flecha mueve al robot UN cuadrito. Cuenten juntos cuántos pasos hay hasta la meta.';
      run.onclick = async () => {
        if (running || !prog.length) return; running = true;
        let pos = st.start.slice(), got = [], crashed = false; draw(pos, got);
        for (const a of prog) {
          await new Promise(r => setTimeout(r, 450));
          const nx = [pos[0] + D[a][0], pos[1] + D[a][1]];
          if (nx[0] < 0 || nx[1] < 0 || nx[0] >= N || nx[1] >= N || walls.has(nx.join(','))) { crashed = true; break; }
          pos = nx; if (stars.includes(pos.join(','))) got.push(pos.join(',')); draw(pos, got);
        }
        running = false;
        const atGoal = pos.join(',') === st.goal.join(','), allStars = got.length === stars.length;
        if (crashed) { c.bad('¡Ups! Chocaron. Cambien el programa y prueben de nuevo.'); c.pass(); setTimeout(() => draw(st.start, []), 700); }
        else if (atGoal && allStars) { c.good(st.fb || '¡El robot llegó!'); run.setAttribute('disabled', ''); c.complete(); }
        else if (atGoal) { c.bad('Llegaron, pero faltan ⭐. ¡Recójanlas todas!'); c.pass(); setTimeout(() => draw(st.start, []), 700); }
        else { c.bad('Todavía no llegó a la meta. ¡Agreguen más pasos!'); c.pass(); setTimeout(() => draw(st.start, []), 700); }
      };
      box.append(grid, out, pal, c.h('div', { style: 'display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap' }, run, del, clr)); return box;
    },
    order(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const slots = c.h('div.prog2'); const grid = c.h('div.opts'); let k = 0; const byIdx = {};
      shuffle(st.items.map((it, idx) => ({ it, idx }))).forEach(o => {
        const b = c.h('button.opt', {}, o.it.e ? c.h('span.e', {}, o.it.e) : null, o.it.t || ''); byIdx[o.idx] = b;
        b.onclick = () => {
          if (o.idx === k) { b.setAttribute('disabled', ''); b.classList.add('ok'); slots.append(c.h('span', {}, (k + 1) + '. ' + (o.it.e || o.it.t))); k++; c.good(o.it.fb || '¡Sí!'); if (k === st.items.length) c.complete(); else c.pass(); }
          else { b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 400); c.bad(st.nofb || 'Ese no va primero. Piensen qué viene antes.'); }
        };
        grid.append(b);
      });
      c.onHint = () => { if (k >= st.items.length) return false; pulse(byIdx[k]); return 'El que brilla viene ahora ✨'; };
      box.append(c.h('p.sub', {}, 'Toquen en el orden correcto:'), slots, grid); return box;
    },
    memory(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const cards = shuffle(st.pairs.flatMap((p, id) => [{ id, e: p[0], t: '' }, { id, e: '', t: p[1] }]));
      const grid = c.h('div.mem'); let first = null, lock = false, left = st.pairs.length; const els = [];
      const up = x => { x.el.classList.add('up'); x.el.innerHTML = ''; x.el.append(x.d.e || '', x.d.t ? c.h('small', {}, x.d.t) : ''); };
      const down = x => { x.el.classList.remove('up'); x.el.innerHTML = '❓'; };
      cards.forEach(d => {
        const el = c.h('button.mc', {}, '❓'); const x = { el, d }; els.push(x);
        el.onclick = () => {
          if (lock || el.classList.contains('up')) return;
          up(x);
          if (!first) { first = x; return; }
          if (first.d.id === d.id) { first.el.classList.add('hit'); el.classList.add('hit'); first = null; c.good(st.pairs[d.id][2] || '¡Pareja!'); if (--left === 0) c.complete(); else c.pass(); }
          else { lock = true; const f = first; first = null; setTimeout(() => { down(f); down(x); lock = false; c.pass(); }, 800); }
        };
        grid.append(el);
      });
      c.onHint = () => {
        if (lock) return false;
        const hid = els.filter(x => !x.el.classList.contains('up') && !x.el.classList.contains('hit'));
        if (!hid.length) return false; lock = true;
        let show;
        if (first) show = [hid.find(x => x.d.id === first.d.id)]; else { const a = hid[0]; show = [a, hid.find(x => x !== a && x.d.id === a.d.id)]; }
        show.filter(Boolean).forEach(up); setTimeout(() => { show.filter(Boolean).forEach(down); lock = false; }, 1300);
        return 'Miren bien estas dos… ¡y recuerden dónde están! 👀';
      };
      box.append(grid); return box;
    },
    spot(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const post = c.h('div.post', {}, c.h('div.hd', {}, c.h('span.av', {}, st.author.e), c.h('div', {}, st.author.name, c.h('small', { style: 'display:block;font-weight:400;color:var(--muted)' }, st.author.meta || ''))));
      const need = st.lines.filter(l => l.clue).length;
      const cnt = c.h('p.sub', { style: 'text-align:center;margin:10px 0' }, `🔍 Pistas encontradas: 0/${need}`); let found = 0; const btns = [];
      st.lines.forEach(l => {
        const b = c.h('button.spot', {}, l.t); b._clue = !!l.clue; btns.push(b);
        b.onclick = () => {
          if (b.classList.contains('found')) return;
          if (l.clue) { b.classList.add('found'); found++; cnt.textContent = `🔍 Pistas encontradas: ${found}/${need}`; c.good(l.fb || '¡Pista encontrada!'); if (found === need) c.complete(); else c.pass(); }
          else { b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 400); c.bad(l.fb || 'Eso parece normal. Busquen otra cosa rara.'); }
        };
        post.append(b);
      });
      c.onHint = () => { const b = btns.find(x => x._clue && !x.classList.contains('found')); if (!b) return false; pulse(b); return 'Hay una pista escondida en la línea que brilla ✨'; };
      box.append(post, cnt); return box;
    },
    draw(st, c) {
      const W = 960, H = 680, box = c.h('div'); box.append(c.q(st.q));
      const cv = c.h('canvas.draw', { width: W, height: H }), g = cv.getContext('2d', { willReadFrequently: true });
      const PAL = ['#111827', '#6b7280', '#ffffff', '#ef4444', '#f97316', '#facc15', '#22c55e', '#14b8a6', '#3b82f6', '#6366f1', '#a855f7', '#ec4899', '#92400e', '#fda4af', '#bbf7d0', '#bae6fd'];
      const STAMPS = st.stamps || ['⭐', '🌈', '🐶', '🌸', '🚀', '🦄', '❤️', '🌞'];
      let col = '#ef4444', size = 8, tool = 'pencil', solid = false, stamp = STAMPS[0], actions = 0, drawing = false, p0 = null, last = null, snap = null;
      const undo = [], redo = [];
      const blank = () => { g.globalAlpha = 1; g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); }; blank(); g.lineCap = g.lineJoin = 'round';
      const grab = () => g.getImageData(0, 0, W, H);
      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
      const ok = c.h('button.btn.big', {}, '✅ ¡Terminé mi obra!'); ok.setAttribute('disabled', '');
      const status = c.h('p.pstatus', {}, '');
      const chk = () => { if (actions >= (st.min || 4)) ok.removeAttribute('disabled'); };
      const bUndo = c.h('button.pill', {}, '↩️ Deshacer'), bRedo = c.h('button.pill', {}, '↪️ Rehacer');
      const sync = () => { undo.length ? bUndo.removeAttribute('disabled') : bUndo.setAttribute('disabled', ''); redo.length ? bRedo.removeAttribute('disabled') : bRedo.setAttribute('disabled', ''); };
      const push = () => { undo.push(grab()); if (undo.length > 10) undo.shift(); redo.length = 0; sync(); };
      bUndo.onclick = () => { if (!undo.length) return; redo.push(grab()); g.putImageData(undo.pop(), 0, 0); sync(); };
      bRedo.onclick = () => { if (!redo.length) return; undo.push(grab()); g.putImageData(redo.pop(), 0, 0); sync(); };
      sync();
      function fill(x, y, hex) {
        const id = grab(), d = id.data; x |= 0; y |= 0;
        const i0 = (y * W + x) * 4, r0 = d[i0], g0 = d[i0 + 1], b0 = d[i0 + 2], n = parseInt(hex.slice(1), 16), r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
        if (Math.abs(r - r0) + Math.abs(gg - g0) + Math.abs(b - b0) < 12) return;
        const seen = new Uint8Array(W * H), stk = [x + y * W];
        while (stk.length) {
          const q = stk.pop(); if (seen[q]) continue; seen[q] = 1; const i = q * 4;
          if (Math.abs(d[i] - r0) + Math.abs(d[i + 1] - g0) + Math.abs(d[i + 2] - b0) > 60) continue;
          d[i] = r; d[i + 1] = gg; d[i + 2] = b; d[i + 3] = 255; const px = q % W;
          if (px > 0) stk.push(q - 1); if (px < W - 1) stk.push(q + 1); if (q >= W) stk.push(q - W); if (q < W * (H - 1)) stk.push(q + W);
        }
        g.putImageData(id, 0, 0);
      }
      function shape(a, b) {
        g.strokeStyle = g.fillStyle = col; g.lineWidth = size; g.beginPath();
        if (tool === 'line') { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
        else if (tool === 'rect') { solid ? g.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]) : g.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); }
        else { g.ellipse((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, Math.abs(b[0] - a[0]) / 2 + .1, Math.abs(b[1] - a[1]) / 2 + .1, 0, 0, 7); solid ? g.fill() : g.stroke(); }
      }
      function spray(x, y) { g.fillStyle = col; for (let k = 0; k < 16; k++) { const a = Math.random() * 6.283, r = Math.random() * size * 2.4; g.fillRect(x + Math.cos(a) * r, y + Math.sin(a) * r, 2.5, 2.5); } }
      cv.onpointerdown = e => {
        const pt = pos(e); push();
        if (tool === 'fill') { fill(pt[0], pt[1], col); actions++; chk(); return; }
        if (tool === 'stamp') { g.font = (size * 4 + 28) + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(stamp, pt[0], pt[1]); actions++; chk(); return; }
        drawing = true; cv.setPointerCapture(e.pointerId); p0 = last = pt; snap = undo[undo.length - 1];
        if (tool === 'spray') { spray(pt[0], pt[1]); return; }
        if (tool === 'pencil' || tool === 'eraser') { g.strokeStyle = tool === 'eraser' ? '#fff' : col; g.lineWidth = tool === 'eraser' ? size * 2.5 : size; g.beginPath(); g.moveTo(pt[0], pt[1]); g.lineTo(pt[0] + .1, pt[1] + .1); g.stroke(); }
      };
      cv.onpointermove = e => {
        if (!drawing) return; const pt = pos(e);
        if (tool === 'spray') spray(pt[0], pt[1]);
        else if (tool === 'pencil' || tool === 'eraser') { const m = [(last[0] + pt[0]) / 2, (last[1] + pt[1]) / 2]; g.beginPath(); g.moveTo(last[0], last[1]); g.quadraticCurveTo(last[0], last[1], m[0], m[1]); g.stroke(); last = pt; }
        else { g.putImageData(snap, 0, 0); shape(p0, pt); }
      };
      cv.onpointerup = cv.onpointercancel = () => { if (drawing) { drawing = false; actions++; chk(); } };
      const toolBtns = {};
      const T0 = [['pencil', '✏️ Lápiz'], ['spray', '🎨 Aerosol'], ['eraser', '🧽 Goma'], ['fill', '🪣 Balde'], ['line', '📏 Línea'], ['rect', '⬜ Cuadro'], ['circle', '⭕ Círculo'], ['stamp', '⭐ Sello']];
      const tools = c.h('div.ptools', {}, T0.map(([k, t]) => { const b = c.h('button.pill' + (k === tool ? '.sel' : ''), { 'aria-label': t }, t); toolBtns[k] = b; b.onclick = () => { tool = k; T0.forEach(([j]) => toolBtns[j].classList.toggle('sel', j === k)); stampRow.style.display = k === 'stamp' ? '' : 'none'; solidBtn.style.display = k === 'rect' || k === 'circle' ? '' : 'none'; }; return b; }));
      const solidBtn = c.h('button.pill', { style: 'display:none', on: { click: e => { solid = !solid; e.currentTarget.textContent = solid ? '🟦 Relleno' : '▫️ Solo borde'; } } }, '▫️ Solo borde');
      const stampBtns = [];
      const stampRow = c.h('div.ptools', { style: 'display:none' }, STAMPS.map(s0 => { const b = c.h('button.stamp' + (s0 === stamp ? '.sel' : ''), {}, s0); stampBtns.push(b); b.onclick = () => { stamp = s0; stampBtns.forEach(x => x.classList.toggle('sel', x === b)); }; return b; }));
      const sw = c.h('div.tools2');
      const swBtns = PAL.map(k => { const b = c.h('button.sw' + (k === col ? '.sel' : ''), { style: 'background:' + k, 'aria-label': 'color ' + k }); b.onclick = () => setCol(k); sw.append(b); return b; });
      const pick = c.h('input.pcolor', { type: 'color', value: col, 'aria-label': 'Elegir otro color' });
      function setCol(k) { col = k; pick.value = k; swBtns.forEach((b, n) => b.classList.toggle('sel', PAL[n] === k)); if (tool === 'eraser') toolBtns.pencil.click(); }
      pick.oninput = () => setCol(pick.value); sw.append(pick);
      const rng = c.h('input', { type: 'range', min: 2, max: 40, value: size, 'aria-label': 'Grosor' }), dot = c.h('span.pdot'); const sd = () => { dot.style.width = dot.style.height = Math.max(4, size) + 'px'; }; sd();
      rng.oninput = () => { size = +rng.value; sd(); };
      const who = () => { const t = T(); return t ? namesOf(t) : 'equipo'; };
      const png = () => cv.toDataURL('image/png');
      const fname = () => `N${c.cfg.level}-C${c.cfg.num}_${who().replace(/[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]+/g, '-')}.png`;
      async function cloud(manual) {
        if (!CFG.driveUrl) { if (manual) status.textContent = '☁️ Drive todavía no está conectado. Usá 💾 Guardar o 🖨️ Imprimir.'; return; }
        status.textContent = '☁️ Enviando a la carpeta de la clase…';
        const r = await driveSend({ file: fname(), level: c.cfg.level, num: c.cfg.num, team: T() ? T().name : '', names: who(), image: png(), ts: Date.now() });
        status.textContent = { ok: '☁️ ¡Guardado en Drive! Tu profe lo puede imprimir.', queued: '⏳ Sin internet: se enviará solo cuando vuelva la conexión.', bad: '⚠️ No se pudo enviar. Usá 💾 Guardar y avisá a tu profe.', off: '' }[r];
      }
      const bClr = c.h('button.pill', { on: { click: () => { push(); blank(); actions = 0; ok.setAttribute('disabled', ''); } } }, '🗑️ Borrar todo');
      const bSave = c.h('button.pill', { on: { click: () => { const a = c.h('a', { href: png(), download: fname() }); document.body.append(a); a.click(); a.remove(); status.textContent = '💾 Descargaste ' + fname(); } } }, '💾 Guardar');
      const bPrint = c.h('button.pill', { on: { click: () => printImage(png(), `${who()} · Nivel ${c.cfg.level} · Clase ${c.cfg.num}`) } }, '🖨️ Imprimir');
      const bCloud = CFG.driveUrl ? c.h('button.pill', { on: { click: () => cloud(true) } }, '☁️ Enviar a Drive') : null;
      c.onHint = () => (c.cfg.level === 3 ? 'Piensen un tema juntos y dividan el dibujo: uno dibuja y el otro elige los colores.' : 'Probá el 🪣 balde para pintar rápido y el ⭐ sello para decorar. ¡Uno dibuja y el otro elige los colores!');
      ok.onclick = () => { ok.setAttribute('disabled', ''); cloud(false); c.good(st.fb || '¡Qué creativo!'); c.complete(); };
      box.append(tools, solidBtn, stampRow, sw, c.h('div.psize', {}, '🖌️', rng, dot), cv, c.h('div.ptools', {}, bUndo, bRedo, bClr, bSave, bPrint, bCloud), status, c.h('div', { style: 'text-align:center;margin-top:6px' }, ok)); return box;
    },
    /* actividad con herramienta externa: se abre en un marco dentro de la página (o en pestaña nueva) y el trabajo se sube a Drive */
    externo(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const mm = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
      const limit = (st.mins || 20) * 60; let left = limit, iv = null, sent = false;
      const clock = c.h('span.pill', {}, '⏳ ' + mm(left));
      const tick = () => { left = Math.max(0, left - 1); clock.textContent = '⏳ ' + mm(left); if (left === 0) { clearInterval(iv); toast('⏰', '¡Se terminó el tiempo de esta actividad!', 'Guarden y suban lo que tengan.', 6000); chime('turn'); } };
      const steps = c.h('ol', { style: 'text-align:left;max-width:680px;margin:10px auto;padding-left:24px;line-height:1.6' }, (st.steps || []).map(x => c.h('li', {}, x)));
      const frameBox = c.h('div', { style: 'display:none;margin:12px 0' });
      const note = c.h('p.sub', { style: 'font-size:.9rem' }, '');
      let started = false;
      function startClock() { if (!started) { started = true; iv = setInterval(tick, 1000); } }
      const bOpen = c.h('button.btn.big', { on: { click: () => {
        startClock(); frameBox.style.display = '';
        if (!frameBox.firstChild) {
          const fr = c.h('iframe', { src: st.url, title: st.tool, allow: 'camera; microphone; fullscreen; autoplay', referrerpolicy: 'no-referrer', sandbox: 'allow-scripts allow-same-origin allow-forms allow-downloads allow-modals', style: 'width:100%;height:72vh;min-height:420px;border:3px solid var(--line,#ddd);border-radius:16px;background:#fff' });
          frameBox.append(fr);
          note.textContent = 'Si la ventana queda en blanco o dice que no se puede mostrar, usá “Abrir en pestaña nueva”.';
        }
      } } }, (st.emoji || '🚀') + ' Abrir ' + st.tool + ' acá');
      const bTab = c.h('a.btn.ghost', { href: st.url, target: '_blank', rel: 'noopener', on: { click: startClock } }, '↗️ Abrir en pestaña nueva');
      /* subida a Drive */
      const who = () => { const t = T(); return t ? namesOf(t) : 'equipo'; };
      const slug = x => x.replace(/[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]+/g, '-');
      const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'application/pdf': 'pdf', 'audio/mpeg': 'mp3', 'audio/wav': 'wav', 'audio/webm': 'webm', 'audio/ogg': 'ogg', 'audio/mp4': 'm4a', 'video/mp4': 'mp4', 'video/webm': 'webm' };
      const status = c.h('p.sub', { style: 'min-height:1.4em;font-weight:600' }, '');
      const ok = c.h('button.btn', { disabled: '' }, '✅ ¡Terminamos!');
      ok.onclick = () => { clearInterval(iv); ok.setAttribute('disabled', ''); c.good(st.fb || '¡Muy bien, a seguir creando!'); c.complete(); };
      const file = c.h('input', { type: 'file', accept: st.accept || 'image/*,application/pdf,audio/*,video/mp4,video/webm', style: 'display:none' });
      const bUp = c.h('button.pill', { on: { click: () => file.click() } }, '📤 Subir mi trabajo');
      file.onchange = async () => {
        const f = file.files[0]; if (!f) return;
        const mime = (f.type || '').split(';')[0], ext = EXT[mime];
        if (!ext) { status.textContent = '⚠️ Ese tipo de archivo no se puede subir. Probá con imagen, PDF, audio o un video corto.'; return; }
        if (f.size > 8 * 1024 * 1024) { status.textContent = '⚠️ El archivo pesa mucho (máximo 8 MB). Probá con un clip más corto o una captura.'; return; }
        status.textContent = '☁️ Subiendo…'; bUp.setAttribute('disabled', '');
        try {
          const data = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(new Error('lectura')); r.readAsDataURL(f); });
          const name = `N${c.cfg.level}-C${c.cfg.num}_${slug(st.tool)}_${slug(who())}.${ext}`;
          const r = await driveSend({ file: name, folder: st.tool, level: c.cfg.level, num: c.cfg.num, team: T() ? T().name : '', names: who(), image: data, ts: Date.now() });
          status.textContent = { ok: '☁️ ¡Guardado en Drive! Tu profe lo va a ver.', queued: '⏳ Sin internet: se enviará solo cuando vuelva la conexión.', bad: '⚠️ No se pudo enviar. Avisá a tu profe.', off: '☁️ Drive todavía no está conectado: mostrale tu trabajo a tu profe.' }[r];
          if (r === 'ok' || r === 'queued') { sent = true; ok.removeAttribute('disabled'); }
        } catch (e) { status.textContent = '⚠️ No se pudo leer el archivo. Probá de nuevo.'; }
        bUp.removeAttribute('disabled'); file.value = '';
      };
      const skip = c.h('button.btn.ghost', { style: 'font-size:.85rem;padding:8px 14px', on: { click: () => ok.removeAttribute('disabled') } }, 'No pude subirlo (avisar a la profe)');
      c.onHint = () => st.hint || 'Seguí los pasos de la lista de a uno. ¡Pedí ayuda a tu profe si algo no anda!';
      const upRow = st.upload === false ? null : c.h('div', { style: 'text-align:center;margin-top:10px' },
        c.h('p.sub', {}, st.uploadText || '📤 Cuando termines: guardá tu trabajo (descargalo) y subilo acá.'), file, bUp, status);
      box.append(steps, c.h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:center' }, bOpen, bTab, clock), note, frameBox, upRow,
        c.h('div', { style: 'text-align:center;margin-top:10px;display:grid;gap:10px;justify-items:center' }, ok, st.upload === false ? null : skip));
      if (st.upload === false) ok.removeAttribute('disabled');
      return box;
    },
    trivia(st, c) {
      const box = c.h('div'), body = c.h('div'), prog = c.h('p.triviaprog'); let k = 0;
      function show() {
        body.innerHTML = ''; const Q = st.qs[k], grid = c.h('div.opts'), btns = [];
        prog.textContent = `🎯 Pregunta ${k + 1} de ${st.qs.length}`; body.append(c.q(Q.q), grid);
        shuffle(Q.o.map((t, j) => ({ t, ok: j === 0 }))).forEach(o => {
          const b = c.h('button.opt', {}, o.t); b._ok = o.ok; btns.push(b);
          b.onclick = () => {
            if (o.ok) { b.classList.add('ok'); btns.forEach(x => x.setAttribute('disabled', '')); c.good(Q.fb || '¡Correcto!'); if (++k < st.qs.length) { c.pass(); setTimeout(show, 1200); } else c.complete(); }
            else { b.classList.add('no'); b.setAttribute('disabled', ''); c.bad(Q.nofb || 'Casi. ¡Probá otra!'); c.pass(); }
          };
          grid.append(b);
        });
        c.onHint = () => { const w = btns.find(b => !b._ok && !b.disabled); if (w && btns.filter(b => !b.disabled).length > 2) { w.setAttribute('disabled', ''); w.style.opacity = .35; return 'Saqué una opción que no es.'; } pulse(btns.find(b => b._ok)); return 'Mirá la que brilla ✨'; };
      }
      show(); box.append(prog, body); return box;
    },
    hero(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const AV = ['🦸‍♀️', '🦸‍♂️', '🥷', '🧙', '🦹‍♀️', '🧑‍🚀'];
      const ROWS = [['av', '🦸 Tu superhéroe', AV], ['t', '🐾 Título', st.titles || ['Halcon', 'Dragon', 'Pantera', 'Lobo', 'Robot', 'Delfin']], ['p', '⚡ Superpoder', st.powers || ['Rayo', 'Fuego', 'Hielo', 'Trueno', 'Viento', 'Cometa']], ['n', '🔢 Número secreto', ['07', '23', '42', '88', '99']], ['s', '✨ Símbolo mágico', ['!', '#', '$', '&', '*', '?']]];
      const pk = { av: AV[0], t: null, p: null, n: null, s: null }, pills = {};
      const card = c.h('div.herocard'), meter = c.h('div.meter', {}, c.h('i')), lbl = c.h('div', { style: 'font-weight:700;text-align:center' });
      const ok = c.h('button.btn.big', {}, '🦸 ¡Activar mi súper clave!'); ok.setAttribute('disabled', '');
      function paint() {
        const pw = [pk.t, pk.p, pk.n, pk.s].filter(Boolean).join(''), done = !!(pk.t && pk.p && pk.n && pk.s);
        card.innerHTML = ''; card.append(c.h('div.hav', {}, pk.av), c.h('div', {}, c.h('div.hname', {}, `${pk.t || '???'} ${pk.p || '???'}`), c.h('code.herocode', {}, pw || '…')));
        const n = [pw.length >= 8, /[A-Z]/.test(pw), /[a-z]/.test(pw), /\d/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length;
        meter.firstChild.style.width = n * 20 + '%'; meter.firstChild.style.background = n < 3 ? '#ef4444' : n < 5 ? '#f59e0b' : '#22c55e';
        lbl.textContent = !pw ? '' : done ? '🛡️ ¡Súper fuerte! Mayúsculas, minúsculas, número y símbolo.' : 'Seguí eligiendo poderes…';
        done ? ok.removeAttribute('disabled') : ok.setAttribute('disabled', '');
      }
      const slots = c.h('div.slots');
      ROWS.forEach(([k, label, opts]) => {
        const chips = c.h('div.chips'); pills[k] = [];
        opts.forEach(o => { const b = c.h('button.pill', {}, o); pills[k].push(b); b.onclick = () => { pk[k] = o; pills[k].forEach(x => x.classList.toggle('sel', x === b)); paint(); }; chips.append(b); });
        slots.append(c.h('div.slot', {}, c.h('h3', {}, label), chips));
      });
      const dice = c.h('button.btn.ghost', { on: { click: () => { ROWS.forEach(([k, , o]) => { const j = Math.floor(Math.random() * o.length); pk[k] = o[j]; pills[k].forEach((x, i) => x.classList.toggle('sel', i === j)); }); paint(); } } }, '🎲 ¡Sorpréndeme!');
      c.onHint = () => st.hint || 'Elegí una pieza de cada fila, o tocá 🎲. Cuanto más mezclada, más fuerte.';
      ok.onclick = () => { ok.setAttribute('disabled', ''); c.extra.add('hero'); c.good(st.fb || '¡Tu superhéroe protege tu clave!'); c.complete(); };
      paint(); box.append(card, meter, lbl, slots, c.h('p.sub', { style: 'font-size:.85rem;margin:8px 0;text-align:center' }, '🤐 Una clave de superhéroe nunca se comparte. Es solo práctica: no usen esta clave en la vida real.'), c.h('div', { style: 'display:flex;gap:10px;justify-content:center;flex-wrap:wrap' }, dice, ok)); return box;
    },
    diploma(st, c) {
      const t = T(), total = totalStars(t);
      const names = t.players.map(p => p.avatar + ' ' + p.name).join('  &  ');
      const d = new Date().toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
      const box = c.h('div.diploma', {},
        c.h('div', { style: 'font-size:3rem' }, '🏆'), c.h('h2', {}, st.title || 'Diploma de la Escuela de Verano Tecnológica'),
        c.h('p', {}, 'Se entrega a'), c.h('div.nm', {}, names),
        c.h('p', {}, st.text || 'por completar sus misiones y cuidar su mundo digital.'),
        c.h('div.starsrow', {}, '⭐ ' + total), c.cfg.level === 3 ? c.h('p.dipmp', {}, `🎯 ${c.mp()} PM · ${mpRank(c.mp())[1]}`) : null, c.h('p', { style: 'font-size:.85rem;margin-top:8px' }, 'Escuela de Verano CIC 2 · Municipalidad de Mendoza · ' + d));
      const pr = c.h('button.btn.ghost', { style: 'margin-top:14px', on: { click: () => window.print() } }, '🖨️ Imprimir diploma');
      const w = c.h('div'); w.append(box, c.h('div', { style: 'text-align:center' }, pr));
      c.complete(); confetti(); return w;
    },
    story(st, c) {
      const box = c.h('div.card', { style: 'text-align:center;box-shadow:none;background:var(--soft)' }, c.h('div', { style: 'font-size:4rem' }, st.e || ''), c.h('div.q', { style: 'justify-content:center' }, c.h('span', { html: st.q })));
      c.complete(); return box;
    }
  };

  /* ============================================================
     PANEL DOCENTE
     ============================================================ */
  function docente() {
    const app = document.getElementById('app'); let tab = 'claves';
    const ok = () => { try { return sessionStorage.getItem('ev_doc') === '1'; } catch (e) { return false; } };
    function gate() {
      app.innerHTML = ''; app.append(topbar(ROOT + 'index.html', '← Inicio'));
      const inp = h('input.pw', { type: 'password', placeholder: '🔑 Clave maestra', autocomplete: 'off' }), err = h('p.lockerr', {}, '');
      const go = () => { if (norm(inp.value) === norm(CFG.masterPin)) { try { sessionStorage.setItem('ev_doc', '1'); } catch (e) {} panel(); } else { err.textContent = '❌ Clave incorrecta'; inp.select(); } };
      inp.onkeydown = e => { if (e.key === 'Enter') go(); };
      app.append(h('div.card', { style: 'text-align:center;max-width:460px;margin:30px auto' }, h('div.lockem', {}, '🔧'), h('h1', {}, 'Panel docente'), h('p.sub', { style: 'margin:8px 0 14px' }, 'Solo para profes. Ingresá la clave maestra.'), inp, err, h('button.btn', { style: 'margin-top:10px', on: { click: go } }, 'Entrar')));
      setTimeout(() => inp.focus(), 50);
    }
    function nextLocked(t) { for (let l = 1; l <= 3; l++) { if (!levelOpen(t, l)) return { l, level: true }; for (let n = 1; n <= 10; n++) if (!classOpen(t, l, n)) return { l, n }; } return null; }
    function panel() {
      app.innerHTML = ''; app.append(topbar(ROOT + 'index.html', '← Inicio'));
      app.append(h('h1', {}, '🔧 Panel docente'));
      const tabs = h('div.tabs', {}, [['claves', '🔑 Contraseñas'], ['equipos', '👥 Equipos'], ['dibujos', '🖼️ Dibujos'], ['respaldo', '💾 Respaldo']].map(([k, t]) => h('button.tab' + (k === tab ? '.sel' : ''), { on: { click: () => { tab = k; panel(); } } }, t)));
      app.append(tabs); ({ claves, equipos, dibujos, respaldo })[tab]();
    }
    function claves() {
      const card = h('div.card.printable');
      card.append(h('h2', {}, 'Hoja de contraseñas'), h('p.sub', {}, 'Cada clase se abre con su contraseña (se da al terminar la clase anterior). Mayúsculas y tildes no importan. La clave maestra abre cualquier candado: ' ), h('p', {}, h('b', {}, CFG.masterPin)));
      [1, 2, 3].forEach(l => {
        const rows = [];
        if (l > 1) rows.push(h('tr', {}, h('td', {}, '🔓 Abrir el nivel'), h('td', {}, h('code', {}, CFG.passwords['L' + l]))));
        for (let n = 2; n <= 10; n++) rows.push(h('tr', {}, h('td', {}, `Clase ${n}: ${clsMeta(l, n).t.replace(/^\S+\s/, '')}`), h('td', {}, h('code', {}, CFG.passwords[keyOf(l, n)]))));
        card.append(h('h3', { style: 'margin-top:16px' }, `${LV(l).emoji} Nivel ${l}: ${LV(l).name} (${LV(l).age})`), h('table.pwt', {}, h('tbody', {}, rows)));
      });
      card.append(h('p.sub', { style: 'margin-top:14px;font-size:.9rem' }, 'Para cambiar las contraseñas editá el archivo assets/config.js.'), h('button.btn.ghost.noprint', { on: { click: () => window.print() } }, '🖨️ Imprimir hoja'));
      app.append(card);
    }
    function equipos() {
      const list = Object.values(S.teams);
      if (!list.length) return app.append(h('div.card', {}, h('p', {}, 'Todavía no hay equipos en esta compu.')));
      const box = h('div.docteams');
      list.forEach(t => {
        const nl = nextLocked(t);
        box.append(h('div.card.dteam', {},
          h('div', { style: 'flex:1;min-width:220px' }, h('b', {}, avatarsOf(t) + ' ' + t.name), h('div.sub', {}, 'Nivel ' + teamLevel(t) + ' · ' + (t.mode === 2 ? '👥 Pareja' : '🙂 Solo/a') + ' · ⭐ ' + totalStars(t) + ' · ⚡ ' + xpOf(t) + ' XP · 🎯 ' + mpOf(t) + ' PM · ' + [1, 2, 3].map(l => LV(l).emoji + doneIn(t, l) + '/10').join('  ')),
            t.resume ? h('div.sub', {}, '💾 Clase guardada: ' + t.resume.key + ' (paso ' + (t.resume.step + 1) + ')') : null,
            t.mode === 2 ? h('div.sub', {}, `Aciertos: ${t.players[0].name} ${t.stats[0].ok} · ${t.players[1].name} ${t.stats[1].ok}`) : null),
          h('div.dbtns', {},
            nl ? h('button.btn.ghost', { on: { click: () => { if (nl.level) t.unlocked['L' + nl.l] = true; else t.unlocked[keyOf(nl.l, nl.n)] = true; save(true); panel(); } } }, nl.level ? `🔓 Abrir Nivel ${nl.l}` : `🔓 Abrir N${nl.l} clase ${nl.n}`) : h('span.sub', {}, 'Todo abierto'),
            h('button.btn.ghost', { on: { click: () => { for (let l = 1; l <= 3; l++) { t.unlocked['L' + l] = true; for (let n = 1; n <= 10; n++) t.unlocked[keyOf(l, n)] = true; } save(true); panel(); } } }, '🔓 Abrir todo'),
            h('button.btn.ghost', { on: { click: () => { if (confirm('¿Reiniciar el progreso de ' + t.name + '?')) { t.done = {}; t.xpBy = {}; t.mpBy = {}; t.unlocked = {}; t.badges = {}; t.resume = null; t.stats = [{ ok: 0, err: 0 }, { ok: 0, err: 0 }]; save(true); panel(); } } } }, '♻️ Reiniciar'),
            h('button.btn.ghost', { on: { click: () => { if (confirm('¿Eliminar el equipo ' + t.name + '? No se puede deshacer.')) { delete S.teams[t.id]; if (S.active === t.id) S.active = null; save(true); panel(); } } } }, '🗑️ Eliminar'))));
      });
      app.append(box);
    }
    function dibujos() {
      const on = !!CFG.driveUrl, res = h('p', { style: 'margin-top:10px;font-weight:600' }, ''), pend = h('p.sub', {}, '');
      const upd = () => { pend.textContent = `Dibujos pendientes de enviar en esta compu: ${dqLoad().length}`; }; upd();
      app.append(h('div.card', {}, h('h2', {}, '🖼️ Dibujos en Drive'),
        h('p.sub', { style: 'margin:6px 0 14px' }, on ? '✅ Conectado. En la Clase 7 de cada nivel, al tocar “¡Terminé mi obra!” el dibujo se envía solo a la carpeta de Drive (un archivo por equipo y clase). Después se abre la carpeta y se imprime desde ahí.' : '⚠️ Todavía no está conectado. Seguí la guía drive/LEEME-DRIVE.md y pegá la dirección del Apps Script en assets/config.js (driveUrl).'),
        h('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' },
          on ? h('button.btn', { on: { click: async () => { res.textContent = '⏳ Probando…'; try { await drivePost({ test: true }); res.textContent = '✅ ¡Funciona! La carpeta responde.'; } catch (e) { res.textContent = e.server ? '❌ El script respondió: ' + e.message + (e.message === 'token' ? ' (el driveToken de config.js no coincide con el del script)' : '') : '❌ No se pudo conectar. Revisá driveUrl y que la implementación sea para “Cualquier persona”.'; } } } }, '🔌 Probar conexión') : null,
          on ? h('button.btn.ghost', { on: { click: async () => { res.textContent = '⏳ Reenviando…'; await driveFlush(); upd(); res.textContent = dqLoad().length ? '⚠️ Quedan pendientes (¿sin internet?).' : '✅ Todo enviado.'; } } }, '🔁 Reenviar pendientes') : null,
          CFG.driveFolderUrl ? h('a.btn.ghost', { href: CFG.driveFolderUrl, target: '_blank', rel: 'noopener' }, '📂 Abrir carpeta de Drive') : null),
        pend, res));
    }
    function respaldo() {
      const file = h('input', { type: 'file', accept: '.json,application/json', style: 'display:none' }), res = h('p', {}, '');
      file.onchange = () => { const f = file.files[0]; if (!f) return; const rd = new FileReader(); rd.onload = () => { const r = importText(String(rd.result), false); res.textContent = r.ok ? `✅ Se cargaron ${r.n} equipo(s) (se combinan con los existentes).` : '❌ ' + r.msg; if (r.ok) setTimeout(panel, 900); }; rd.readAsText(f); };
      app.append(h('div.card', {}, h('h2', {}, 'Respaldo del progreso'), h('p.sub', { style: 'margin:6px 0 14px' }, 'El progreso vive en el navegador de cada compu. Descarguen el archivo al final del día o antes de limpiar datos; se puede cargar en esta u otra compu.'),
        h('div', { style: 'display:flex;gap:10px;flex-wrap:wrap' }, h('button.btn', { on: { click: () => { exportAll(); res.textContent = '✅ Archivo descargado.'; } } }, '⬇️ Descargar todo'), h('button.btn.ghost', { on: { click: () => file.click() } }, '⬆️ Cargar archivo'), file,
          h('button.btn.ghost', { on: { click: () => { if (confirm('¿Borrar TODOS los equipos de esta compu?') && confirm('Seguro: se pierde todo el progreso guardado aquí.')) { S = { v: 4, sound: S.sound, active: null, teams: {} }; save(true); panel(); } } } }, '🧹 Borrar todo')), res));
    }
    ok() ? panel() : gate();
  }

  /* ---------- offline (service worker) ---------- */
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) { try { navigator.serviceWorker.register(ROOT + 'sw.js'); } catch (e) {} }

  return { start, portal, levelMap, docente, speak, state: () => S };
})();
