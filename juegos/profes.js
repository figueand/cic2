/* ============================================================
   PROFES DE LOS JUEGOS  (editable)
   Cada juego lo protagoniza un profe. Para cambiarlo editá su línea:
   - nombre : cómo se llama (ej. 'Ana')
   - genero : 'm' (el profe) o 'f' (la profe), para que los textos digan "al profe" / "a la profe"
   - foto   : archivo de la foto, en esta misma carpeta (cuadrada o casi cuadrada, con la cara centrada)
   ============================================================ */
(function () {
  const PROFES = {
    'rescate-profe': { nombre: 'Cristian', genero: 'm', foto: 'cristian.png' },
    'ciberdefensa':  { nombre: 'Cristian', genero: 'm', foto: 'cristian.png' },
    'profe-runner':  { nombre: 'Cristian', genero: 'm', foto: 'cristian.png' },
    'laberinto-bits': { nombre: 'Cristian', genero: 'm', foto: 'cristian.png' },
    'cyber-quest':   { nombre: 'Cristian', genero: 'm', foto: 'cristian.png' }
  };
  const G = {
    m: { el: 'el', al: 'al', del: 'del', lo: 'lo', profe: 'profe', rescatado: 'rescatado', liberado: 'liberado' },
    f: { el: 'la', al: 'a la', del: 'de la', lo: 'la', profe: 'profe', rescatado: 'rescatada', liberado: 'liberada' }
  };
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  /* Reemplaza {el} {El} {EL} {al} {del} {lo} {profe} {Profe} {PROFE} {nombre} {NOMBRE} {rescatado} {liberado} según el profe de ese juego */
  function tx(id, s) {
    const p = PROFES[id] || PROFES['rescate-profe'], g = G[p.genero === 'f' ? 'f' : 'm'];
    return String(s).replace(/\{([A-Za-z]+)\}/g, (m, k) => {
      const key = k.toLowerCase();
      const v = key === 'nombre' ? p.nombre : g[key];
      if (v == null) return m;
      if (k.length > 1 && k === k.toUpperCase()) return v.toUpperCase();
      if (key !== 'nombre' && k[0] === k[0].toUpperCase()) return cap(v);
      return v;
    });
  }
  function fill(id) {
    document.title = tx(id, document.title);
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: n => /^(SCRIPT|STYLE)$/.test(n.parentNode.nodeName) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const ns = []; while (w.nextNode()) ns.push(w.currentNode);
    ns.forEach(n => { if (n.nodeValue.indexOf('{') >= 0) n.nodeValue = tx(id, n.nodeValue); });
    document.querySelectorAll('[alt]').forEach(e => { e.alt = tx(id, e.alt); });
    document.querySelectorAll('[data-foto]').forEach(e => { e.src = PROFES[id].foto; });
  }
  window.EVPROFE = {
    PROFES, t: tx, fill,
    init(id) { fill(id); return { id, foto: PROFES[id].foto, nombre: PROFES[id].nombre, t: s => tx(id, s) }; }
  };
})();
