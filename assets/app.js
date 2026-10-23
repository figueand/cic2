/* Escuela de Verano Tecnológica - motor interactivo (sin dependencias) */
const EV = (() => {
  const KEY = 'ev_state_v3';
  const AVATARS = ['🦊', '🐼', '🦁', '🐯', '🐸', '🦄', '🐙', '🚀', '🤖', '🦸'];
  let S = load();
  function load() {
    const d = { name: '', avatar: '🦊', done: {}, sound: true };
    try { return Object.assign(d, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return d; }
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

  /* ---------- helpers ---------- */
  function h(tag, attrs, ...kids) {
    let cls = '';
    if (tag.includes('.')) { const p = tag.split('.'); tag = p[0] || 'div'; cls = p.slice(1).join(' '); }
    const el = document.createElement(tag);
    if (cls) el.className = cls;
    for (const k in (attrs || {})) {
      if (k === 'on') for (const ev in attrs.on) el.addEventListener(ev, attrs.on[ev]);
      else if (k === 'style') el.style.cssText = attrs[k];
      else if (k === 'html') el.innerHTML = attrs[k];
      else el.setAttribute(k, attrs[k]);
    }
    kids.flat().forEach(c => { if (c != null) el.append(c.nodeType ? c : document.createTextNode(c)); });
    return el;
  }
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const totalStars = () => Object.values(S.done).reduce((a, b) => a + b, 0);

  /* ---------- sonido y voz ---------- */
  let actx;
  function beep(ok) {
    if (!S.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = ok ? [523, 659, 784] : [220, 180];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.frequency.value = f; o.type = ok ? 'triangle' : 'sawtooth';
        g.gain.setValueAtTime(.12, actx.currentTime + i * .1);
        g.gain.exponentialRampToValueAtTime(.001, actx.currentTime + i * .1 + .18);
        o.connect(g); g.connect(actx.destination);
        o.start(actx.currentTime + i * .1); o.stop(actx.currentTime + i * .1 + .2);
      });
    } catch (e) {}
  }
  function speak(t, force) {
    if (!('speechSynthesis' in window) || (!S.sound && !force)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(t).replace(/<[^>]+>/g, ''));
      u.lang = 'es-AR'; u.rate = .95; u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (e) {}
  }
  function confetti() {
    const em = ['🎉', '⭐', '✨', '🎈', '🌟', '💜'];
    for (let i = 0; i < 36; i++) {
      const c = h('span.confetti', { style: `left:${Math.random() * 100}vw;animation-duration:${2 + Math.random() * 2.5}s;animation-delay:${Math.random() * .6}s` }, em[i % em.length]);
      document.body.append(c); setTimeout(() => c.remove(), 5500);
    }
  }

  /* ---------- barra superior común ---------- */
  function topbar(backHref, backText) {
    const snd = h('button.iconbtn', { title: 'Sonido', 'aria-label': 'Sonido' }, S.sound ? '🔊' : '🔇');
    snd.onclick = () => { S.sound = !S.sound; save(); snd.textContent = S.sound ? '🔊' : '🔇'; if (!S.sound) try { speechSynthesis.cancel(); } catch (e) {} };
    return h('div.top', {},
      backHref ? h('a.back', { href: backHref }, backText || '← Volver') : h('span'),
      h('div.tools', {},
        h('span.chip', {}, S.avatar + ' ' + (S.name || 'Explorador')),
        h('span.chip', {}, '⭐ ' + totalStars()),
        snd));
  }

  /* ---------- portal / menú de nivel ---------- */
  function portal() {
    const nameIn = document.getElementById('name');
    const av = document.getElementById('avatars');
    nameIn.value = S.name;
    nameIn.addEventListener('input', () => { S.name = nameIn.value.trim().slice(0, 18); save(); });
    AVATARS.forEach(a => {
      const b = h('button' + (a === S.avatar ? '.sel' : ''), { 'aria-label': 'Avatar ' + a }, a);
      b.onclick = () => { S.avatar = a; save(); av.querySelectorAll('button').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); };
      av.append(b);
    });
    paint();
  }
  function paint() {
    document.querySelectorAll('[data-level]').forEach(el => {
      const l = el.dataset.level; let n = 0;
      for (let i = 1; i <= 10; i++) if (S.done['n' + l + 'c' + i]) n++;
      const p = el.querySelector('.prog'); if (p) p.textContent = n + '/10 ⭐';
    });
    document.querySelectorAll('[data-key]').forEach(el => {
      const s = S.done[el.dataset.key];
      if (s) { el.classList.add('done'); el.querySelector('.st').textContent = '⭐'.repeat(s) + '☆'.repeat(3 - s); el.querySelector('.n').textContent = '✓'; }
    });
    const bar = document.querySelector('.bar i');
    if (bar) { const l = bar.dataset.level; let n = 0; for (let i = 1; i <= 10; i++) if (S.done['n' + l + 'c' + i]) n++; bar.style.width = n * 10 + '%'; }
    const tb = document.getElementById('topbar'); if (tb) tb.replaceWith(Object.assign(topbar(tb.dataset.back, tb.dataset.text), { id: 'topbar' }));
  }

  /* ---------- corredor de clase ---------- */
  function start(cfg) {
    const app = document.getElementById('app');
    const key = `n${cfg.level}c${cfg.num}`;
    let i = 0, mistakes = 0;
    document.body.classList.add('n' + cfg.level);
    S.sound = S.sound !== false;

    const face = h('div.face', {}, cfg.mascot.emoji);
    const bubble = h('div.bubble');
    const dots = h('div.dots', {}, cfg.steps.map(() => h('i')));
    const stage = h('div.stage');
    const fb = h('div.fb');
    const nextWrap = h('div.next');
    const spk = h('button.spk', { title: 'Escuchar', 'aria-label': 'Escuchar' }, '🔊');
    let lastSay = '';
    spk.onclick = () => speak(lastSay, true);

    function say(t) { lastSay = t; bubble.innerHTML = ''; bubble.append(h('b', {}, cfg.mascot.name + ': '), t, ' '); bubble.append(spk); if (cfg.voice) speak(t); }
    function feedback(t, good) { fb.className = 'fb show ' + (good ? 'good' : 'bad'); fb.textContent = (good ? '🎉 ' : '💡 ') + t; beep(good); if (cfg.voice) speak(t); }
    function good(t) { feedback(t, true); }
    function bad(t) { mistakes++; feedback(t, false); }
    function complete() {
      nextWrap.innerHTML = '';
      const last = i === cfg.steps.length - 1;
      nextWrap.append(h('button.btn.big', { on: { click: () => { i++; i < cfg.steps.length ? show() : finish(); } } }, last ? '🏁 ¡Terminar!' : 'Siguiente ➡️'));
      nextWrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    const ctx = { say, good, bad, complete, h, shuffle, cfg, q: (t) => h('div.q', {}, h('button.spk', { 'aria-label': 'Escuchar', on: { click: () => speak(t, true) } }, '🔊'), h('span', { html: t })) };

    function show() {
      stage.innerHTML = ''; fb.className = 'fb'; nextWrap.innerHTML = '';
      dots.querySelectorAll('i').forEach((d, k) => { d.className = k < i ? 'on' : k === i ? 'cur' : ''; });
      const st = cfg.steps[i];
      if (st.say) say(st.say);
      stage.append(TYPES[st.type](st, ctx));
    }

    function stars() { return mistakes <= 1 ? 3 : mistakes <= 4 ? 2 : 1; }
    function finish() {
      const s = stars();
      S.done[key] = Math.max(S.done[key] || 0, s); save();
      confetti(); beep(true);
      const next = cfg.num < 10 ? `clase${cfg.num + 1}.html` : null;
      stage.innerHTML = ''; fb.className = 'fb'; nextWrap.innerHTML = '';
      dots.querySelectorAll('i').forEach(d => d.className = 'on');
      const msg = `¡Misión cumplida${S.name ? ', ' + S.name : ''}! Ganaste ${s} ${s > 1 ? 'estrellas' : 'estrella'}.`;
      say(msg);
      stage.append(h('div.card', { style: 'text-align:center' },
        h('div.starsrow', {}, '⭐'.repeat(s) + '☆'.repeat(3 - s)),
        h('h1', {}, '¡Muy bien hecho! 🎉'),
        h('p.sub', {}, cfg.recap || ''),
        h('div', { style: 'display:grid;gap:14px;margin-top:20px;justify-items:center' },
          h('a.btn.poki.big', { href: cfg.poki.url, target: '_blank', rel: 'noopener' }, '🎮 ' + cfg.poki.label),
          h('p.sub', { style: 'font-size:.85rem' }, 'Se abre en otra pestaña. Juega con la profe cerca 👩‍🏫'),
          h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center' },
            next ? h('a.btn', { href: next }, 'Siguiente clase ➡️') : null,
            h('a.btn.ghost', { href: 'index.html' }, '🗺️ Mapa de misiones'),
            h('button.btn.ghost', { on: { click: () => { mistakes = 0; i = 0; show(); } } }, '🔁 Repetir')))));
    }

    /* pantalla de inicio (da el primer gesto para el audio) */
    app.append(topbar('index.html', '← Mapa de misiones'));
    const intro = h('div.card', { style: 'text-align:center' },
      h('div', { style: 'font-size:4rem' }, cfg.emoji),
      h('h1', {}, `Clase ${cfg.num}: ${cfg.title}`),
      h('p.sub', { style: 'margin:8px 0 18px' }, cfg.intro),
      h('button.btn.big', { on: { click: () => { app.innerHTML = ''; app.append(topbar('index.html', '← Mapa de misiones'), h('div.mascot', {}, face, bubble), dots, h('div.card', {}, stage, fb, nextWrap)); show(); } } }, '▶ ¡Empezar!'));
    app.append(intro);
  }

  /* ---------- tipos de actividad ---------- */
  const TYPES = {
    /* elegir una respuesta */
    choice(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const grid = c.h('div.opts');
      st.options.forEach(o => {
        const b = c.h('button.opt', {}, o.e ? c.h('span.e', {}, o.e) : null, o.t || '');
        b.onclick = () => {
          if (o.ok) { b.classList.add('ok'); grid.querySelectorAll('.opt').forEach(x => x.setAttribute('disabled', '')); c.good(o.fb || st.fb || '¡Correcto!'); c.complete(); }
          else { b.classList.add('no'); b.setAttribute('disabled', ''); c.bad(o.fb || 'Probemos otra opción.'); }
        };
        grid.append(b);
      });
      box.append(st.shuffle === false ? grid : (() => { const g = grid; const k = [...g.children]; c.shuffle(k).forEach(x => g.append(x)); return g; })());
      return box;
    },
    /* elegir varias */
    pick(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const grid = c.h('div.opts'); const sel = new Set();
      st.options.forEach((o, k) => {
        const b = c.h('button.opt', {}, o.e ? c.h('span.e', {}, o.e) : null, o.t || '');
        b.onclick = () => { sel.has(k) ? (sel.delete(k), b.classList.remove('pickd')) : (sel.add(k), b.classList.add('pickd')); };
        grid.append(b);
      });
      const chk = c.h('button.btn', { style: 'margin-top:14px' }, '✔️ Comprobar');
      chk.onclick = () => {
        const wrong = st.options.filter((o, k) => !!o.ok !== sel.has(k));
        if (!wrong.length) { c.good(st.fb || '¡Perfecto!'); chk.setAttribute('disabled', ''); grid.querySelectorAll('.opt').forEach(x => x.setAttribute('disabled', '')); c.complete(); }
        else c.bad(wrong[0].fb || st.hint || 'Revisa tus elecciones.');
      };
      box.append(grid, c.h('div', { style: 'text-align:center' }, chk));
      return box;
    },
    /* clasificar (tocar + tocar, o arrastrar) */
    sort(st, c) {
      const box = c.h('div'); if (st.q) box.append(c.q(st.q));
      const tray = c.h('div.tray'); let selected = null, left = st.items.length;
      const buckets = c.h('div.buckets');
      const bEls = {};
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
        if (data.b === bid) { it.classList.remove('sel'); it.draggable = false; el._in.append(it); selected = null; c.good(data.fb || '¡Bien!'); if (--left === 0) c.complete(); }
        else { it.classList.add('no'); setTimeout(() => it.classList.remove('no'), 400); c.bad(data.nofb || 'Ese no va ahí. ¡Prueba otra vez!'); }
      }
      c.shuffle(st.items).forEach(d => {
        const it = c.h('button.item', { draggable: 'true' }, d.e ? c.h('span.e', {}, d.e) : null, d.t || '');
        it._d = d;
        it.onclick = () => { tray.querySelectorAll('.item').forEach(x => x.classList.remove('sel')); it.classList.add('sel'); selected = it; if (d.t || d.e) { /* leer en voz alta */ } };
        it.ondragstart = e => { selected = it; it.classList.add('sel'); try { e.dataTransfer.setData('text/plain', 'x'); } catch (er) {} };
        tray.append(it);
      });
      box.append(tray, c.h('p.sub', { style: 'text-align:center;margin-bottom:10px' }, '👆 Toca una tarjeta y luego su caja (o arrástrala).'), buckets);
      return box;
    },
    /* armar una clave por piezas */
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
      ok.onclick = () => { ok.setAttribute('disabled', ''); c.good(st.fb || '¡Tu llave mágica quedó genial!'); c.complete(); };
      box.append(slots, out, c.h('div', { style: 'text-align:center' }, ok));
      return box;
    },
    /* medidor de fuerza */
    meter(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const inp = c.h('input.pw', { type: 'text', placeholder: st.placeholder || 'Escribe una clave de práctica…', autocomplete: 'off', maxlength: 40 });
      const m = c.h('div.meter', {}, c.h('i')); const lbl = c.h('div', { style: 'font-weight:700' }, '');
      const rules = [
        ['Al menos 8 letras o números', v => v.length >= 8],
        ['Una MAYÚSCULA', v => /[A-ZÁÉÍÓÚÑ]/.test(v)],
        ['Una minúscula', v => /[a-záéíóúñ]/.test(v)],
        ['Un número', v => /\d/.test(v)],
        ['Un símbolo (! ? # $ % & *)', v => /[^A-Za-z0-9áéíóúñÁÉÍÓÚÑ]/.test(v)],
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
      go.onclick = () => { go.setAttribute('disabled', ''); inp.setAttribute('disabled', ''); c.good(st.fb || '¡Clave fuerte!'); c.complete(); };
      box.append(inp, m, lbl, ul, c.h('p.sub', { style: 'font-size:.85rem;margin-top:8px' }, '🔐 Es solo práctica: no escribas tu clave real. Nada se guarda ni se envía.'), go);
      return box;
    },
    /* simulador de chat con decisiones */
    chat(st, c) {
      const box = c.h('div'); if (st.q) box.append(c.q(st.q));
      const msgs = c.h('div.msgs'); const replies = c.h('div.replies');
      const phone = c.h('div.phone', {}, c.h('div.bar2', {}, c.h('span.av', {}, st.contact.e), c.h('div', {}, st.contact.name, c.h('small', {}, st.contact.status || 'en línea'))), msgs, replies);
      const add = (t, cls) => { const m = c.h('div.msg.' + cls, {}, t); msgs.append(m); msgs.scrollTop = msgs.scrollHeight; };
      function node(id) {
        const n = st.nodes[id]; replies.innerHTML = '';
        let delay = 0;
        (n.msgs || []).forEach(t => { delay += 700; const ty = c.h('div.typing', {}, 'escribiendo…'); setTimeout(() => { msgs.append(ty); msgs.scrollTop = msgs.scrollHeight; }, delay - 600); setTimeout(() => { ty.remove(); add(t, 'them'); }, delay); });
        setTimeout(() => {
          if (n.end) { add(n.end, 'sys'); c.good(n.fb || '¡Muy bien!'); c.complete(); return; }
          c.shuffle(n.choices).forEach(ch => {
            const b = c.h('button', {}, ch.t);
            b.onclick = () => {
              if (ch.ok) { add(ch.t, 'me'); if (ch.fb) c.good(ch.fb); node(ch.next); }
              else { b.setAttribute('disabled', ''); b.style.opacity = .5; c.bad(ch.fb || 'Mejor otra opción.'); if (ch.react) add(ch.react, 'them'); }
            };
            replies.append(b);
          });
        }, delay + 200);
      }
      box.append(phone); node('start');
      return box;
    },
    /* robot: programar con flechas */
    robot(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const N = st.size; const walls = new Set((st.walls || []).map(w => w.join(','))); const stars = (st.stars || []).map(s => s.join(','));
      let prog = [], running = false;
      const grid = c.h('div.grid', { style: `grid-template-columns:repeat(${N},1fr)` });
      const out = c.h('div.prog2');
      function draw(pos, got) {
        grid.innerHTML = '';
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const k = x + ',' + y; let e = '';
          if (walls.has(k)) e = st.wall || '🪨'; else if (k === st.goal.join(',')) e = st.goalE || '🏁'; else if (stars.includes(k) && !got.includes(k)) e = '⭐';
          if (pos.join(',') === k) e = st.bot || '🤖';
          grid.append(c.h('div.cell', {}, e));
        }
      }
      const wrap = () => { out.innerHTML = ''; if (!prog.length) out.append(c.h('span', { style: 'background:none;box-shadow:none;font-size:1rem;color:var(--muted)' }, 'Toca las flechas para armar el programa…')); prog.forEach(p => out.append(c.h('span', {}, p))); };
      draw(st.start, []); wrap();
      const D = { '⬆️': [0, -1], '⬇️': [0, 1], '⬅️': [-1, 0], '➡️': [1, 0] };
      const pal = c.h('div.pal', {}, Object.keys(D).map(a => c.h('button', { 'aria-label': a, on: { click: () => { if (!running && prog.length < (st.max || 14)) { prog.push(a); wrap(); } } } }, a)));
      const run = c.h('button.btn', {}, '▶️ ¡Ejecutar!'), del = c.h('button.btn.ghost', {}, '⌫ Borrar'), clr = c.h('button.btn.ghost', {}, '🗑️ Todo');
      del.onclick = () => { if (!running) { prog.pop(); wrap(); } };
      clr.onclick = () => { if (!running) { prog = []; wrap(); draw(st.start, []); } };
      run.onclick = async () => {
        if (running || !prog.length) return; running = true;
        let pos = st.start.slice(), got = [], crashed = false;
        draw(pos, got);
        for (const a of prog) {
          await new Promise(r => setTimeout(r, 450));
          const nx = [pos[0] + D[a][0], pos[1] + D[a][1]];
          if (nx[0] < 0 || nx[1] < 0 || nx[0] >= N || nx[1] >= N || walls.has(nx.join(','))) { crashed = true; break; }
          pos = nx; if (stars.includes(pos.join(','))) got.push(pos.join(',')); draw(pos, got);
        }
        running = false;
        const atGoal = pos.join(',') === st.goal.join(','), allStars = got.length === stars.length;
        if (crashed) { c.bad('¡Ups! Chocaste. Cambia el programa y prueba de nuevo.'); setTimeout(() => draw(st.start, []), 700); }
        else if (atGoal && allStars) { c.good(st.fb || '¡El robot llegó!'); run.setAttribute('disabled', ''); c.complete(); }
        else if (atGoal) { c.bad('Llegaste, pero faltan ⭐. ¡Recógelas todas!'); setTimeout(() => draw(st.start, []), 700); }
        else { c.bad('Todavía no llegó a la meta. ¡Agrega más pasos!'); setTimeout(() => draw(st.start, []), 700); }
      };
      box.append(grid, out, pal, c.h('div', { style: 'display:flex;gap:10px;justify-content:center;margin-top:14px;flex-wrap:wrap' }, run, del, clr));
      return box;
    },
    /* ordenar pasos */
    order(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const slots = c.h('div.prog2'); const grid = c.h('div.opts'); let k = 0;
      c.shuffle(st.items.map((it, idx) => ({ it, idx }))).forEach(o => {
        const b = c.h('button.opt', {}, o.it.e ? c.h('span.e', {}, o.it.e) : null, o.it.t || '');
        b.onclick = () => {
          if (o.idx === k) { b.setAttribute('disabled', ''); b.classList.add('ok'); slots.append(c.h('span', {}, (k + 1) + '. ' + (o.it.e || o.it.t))); k++; c.good(o.it.fb || '¡Sí!'); if (k === st.items.length) c.complete(); }
          else { b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 400); c.bad(st.nofb || 'Ese no va primero. Piensa qué viene antes.'); }
        };
        grid.append(b);
      });
      box.append(c.h('p.sub', {}, 'Toca en el orden correcto:'), slots, grid);
      return box;
    },
    /* memoria */
    memory(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const cards = c.shuffle(st.pairs.flatMap((p, id) => [{ id, e: p[0], t: '' }, { id, e: '', t: p[1] }]));
      const grid = c.h('div.mem'); let first = null, lock = false, left = st.pairs.length;
      cards.forEach(d => {
        const el = c.h('button.mc', {}, '❓');
        el.onclick = () => {
          if (lock || el.classList.contains('up')) return;
          el.classList.add('up'); el.innerHTML = ''; el.append(d.e || '', d.t ? c.h('small', {}, d.t) : '');
          if (!first) { first = { el, d }; return; }
          if (first.d.id === d.id) { first.el.classList.add('hit'); el.classList.add('hit'); first = null; c.good(st.pairs[d.id][2] || '¡Pareja!'); if (--left === 0) c.complete(); }
          else { lock = true; const f = first; first = null; setTimeout(() => { [f.el, el].forEach(x => { x.classList.remove('up'); x.innerHTML = '❓'; }); lock = false; }, 800); }
        };
        grid.append(el);
      });
      box.append(grid); return box;
    },
    /* encontrar pistas en una publicación */
    spot(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const post = c.h('div.post', {}, c.h('div.hd', {}, c.h('span.av', {}, st.author.e), c.h('div', {}, st.author.name, c.h('small', { style: 'display:block;font-weight:400;color:var(--muted)' }, st.author.meta || ''))));
      let need = st.lines.filter(l => l.clue).length;
      const cnt = c.h('p.sub', { style: 'text-align:center;margin:10px 0' }, `🔍 Pistas encontradas: 0/${need}`); let found = 0;
      st.lines.forEach(l => {
        const b = c.h('button.spot', {}, l.t);
        b.onclick = () => {
          if (b.classList.contains('found')) return;
          if (l.clue) { b.classList.add('found'); found++; cnt.textContent = `🔍 Pistas encontradas: ${found}/${need}`; c.good(l.fb || '¡Pista encontrada!'); if (found === need) c.complete(); }
          else { b.classList.add('no'); setTimeout(() => b.classList.remove('no'), 400); c.bad(l.fb || 'Eso parece normal. Busca otra cosa rara.'); }
        };
        post.append(b);
      });
      box.append(post, cnt); return box;
    },
    /* dibujar y crear */
    draw(st, c) {
      const box = c.h('div'); box.append(c.q(st.q));
      const cv = c.h('canvas.draw', { width: 720, height: 420 }); const g = cv.getContext('2d');
      g.fillStyle = '#fff'; g.fillRect(0, 0, 720, 420); g.lineCap = g.lineJoin = 'round';
      let col = '#ef4444', size = 8, down = false, strokes = 0, stamp = null;
      const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * 720 / r.width, (e.clientY - r.top) * 420 / r.height]; };
      cv.onpointerdown = e => { const [x, y] = pos(e); if (stamp) { g.font = '56px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(stamp, x, y); strokes += 2; chk(); return; } down = true; cv.setPointerCapture(e.pointerId); g.strokeStyle = col; g.lineWidth = size; g.beginPath(); g.moveTo(x, y); g.lineTo(x + .1, y + .1); g.stroke(); };
      cv.onpointermove = e => { if (!down) return; const [x, y] = pos(e); g.lineTo(x, y); g.stroke(); };
      cv.onpointerup = () => { if (down) { down = false; strokes++; chk(); } };
      const ok = c.h('button.btn', {}, '✅ ¡Terminé mi obra!'); ok.setAttribute('disabled', '');
      const chk = () => { if (strokes >= (st.min || 4)) ok.removeAttribute('disabled'); };
      const sw = c.h('div.tools2', {}, ['#ef4444', '#f59e0b', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#92400e', '#111827'].map((k, n) => { const b = c.h('button.sw' + (n === 0 ? '.sel' : ''), { style: 'background:' + k, 'aria-label': 'color' }); b.onclick = () => { col = k; stamp = null; sw.querySelectorAll('.sw,.stamp').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); }; return b; }));
      (st.stamps || ['⭐', '🌈', '🐶', '🌸', '🚀']).forEach(s => { const b = c.h('button.stamp', {}, s); b.onclick = () => { stamp = s; sw.querySelectorAll('.sw,.stamp').forEach(x => x.classList.remove('sel')); b.classList.add('sel'); }; sw.append(b); });
      const sizes = c.h('div.tools2', {}, [['🖌️ Fino', 4], ['🖌️ Medio', 10], ['🖌️ Grueso', 22]].map(([t, v]) => c.h('button.pill', { on: { click: () => { size = v; stamp = null; sw.querySelectorAll('.stamp').forEach(x => x.classList.remove('sel')); } } }, t)));
      const clr = c.h('button.pill', { on: { click: () => { g.fillStyle = '#fff'; g.fillRect(0, 0, 720, 420); strokes = 0; ok.setAttribute('disabled', ''); } } }, '🧽 Borrar');
      const dl = c.h('button.pill', { on: { click: () => { const a = c.h('a', { href: cv.toDataURL('image/png'), download: 'mi-obra.png' }); a.click(); } } }, '💾 Guardar');
      sizes.append(clr, dl);
      ok.onclick = () => { ok.setAttribute('disabled', ''); c.good(st.fb || '¡Qué creativo!'); c.complete(); };
      box.append(sw, cv, sizes, c.h('div', { style: 'text-align:center;margin-top:6px' }, ok)); return box;
    },
    /* diploma final */
    diploma(st, c) {
      const total = totalStars();
      const box = c.h('div.diploma', {},
        c.h('div', { style: 'font-size:3rem' }, '🏆'),
        c.h('h2', {}, st.title || 'Diploma de la Escuela de Verano Tecnológica'),
        c.h('p', {}, 'Se entrega a'),
        c.h('div.nm', {}, (S.avatar + ' ' + (S.name || 'Explorador/a Digital'))),
        c.h('p', {}, st.text || 'por completar sus misiones y cuidar su mundo digital.'),
        c.h('div.starsrow', {}, '⭐ ' + total),
        c.h('p', { style: 'font-size:.85rem;margin-top:8px' }, 'Escuela de Verano CIC 2 · Municipalidad de Mendoza'));
      const nm = c.h('input.pw', { placeholder: '✏️ Escribe tu nombre', value: S.name, style: 'font-size:1.1rem;margin:12px 0' });
      nm.oninput = () => { S.name = nm.value.trim().slice(0, 18); save(); box.querySelector('.nm').textContent = S.avatar + ' ' + (S.name || 'Explorador/a Digital'); };
      const pr = c.h('button.btn.ghost', { style: 'margin-top:10px', on: { click: () => window.print() } }, '🖨️ Imprimir diploma');
      const w = c.h('div'); w.append(nm, box, c.h('div', { style: 'text-align:center' }, pr));
      c.complete(); confetti(); return w;
    },
    /* texto/lectura corta con botón */
    story(st, c) {
      const box = c.h('div.card', { style: 'text-align:center;box-shadow:none;background:var(--soft)' }, c.h('div', { style: 'font-size:4rem' }, st.e || ''), c.h('div.q', { style: 'justify-content:center' }, c.h('span', { html: st.q })));
      c.complete(); return box;
    }
  };

  return { start, portal, paint, speak, state: () => S };
})();
