/* ===========================================================
   tracker.js — "What the crew loves"
   A tiny, dependency-free engagement tracker. Counts taps + shares
   per item in localStorage, then (a) live-updates any visible count
   chips and (b) re-sorts + re-bars any "trending" list. This is the
   working DEMO of the learn-from-behaviour idea: per-device today,
   swap localStorage for a shared backend to make it crew-wide.

   Wire-up via data attributes (any direction can use them):
     data-track="<id>" data-kind="open|share|rsvp"   -> click bumps it
     data-count="<id>"                                -> shows total score
     data-trending                                    -> sortable list
       └ children: data-rank-item="<id>" with optional
         [data-bar] (width %) and [data-rank] (1,2,3 label)
   =========================================================== */
(function () {
  const KEY = 'gc_irl_engagement_v1';
  const WEIGHT = { open: 1, share: 3, rsvp: 2 }; // a share signals more love than a tap

  // Seed so the demo looks alive on first open. Real usage overwrites these.
  const SEED = {
    'ensign-sunset':  { open: 34, share: 11, rsvp: 19 },
    'brighton-ski':   { open: 41, share: 16, rsvp: 22 },
    'mystic-springs': { open: 28, share: 7,  rsvp: 14 },
    'jordanelle-sup': { open: 19, share: 5,  rsvp: 9  },
    'momentum-climb': { open: 23, share: 4,  rsvp: 12 },
    '99-coffee':      { open: 16, share: 6,  rsvp: 8  },
  };

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && raw.items) return raw;
    } catch (e) {}
    return { items: JSON.parse(JSON.stringify(SEED)) };
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {} }

  let state = load();

  function score(id) {
    const it = state.items[id]; if (!it) return 0;
    return (it.open||0)*WEIGHT.open + (it.share||0)*WEIGHT.share + (it.rsvp||0)*WEIGHT.rsvp;
  }

  function bump(id, kind) {
    if (!state.items[id]) state.items[id] = { open: 0, share: 0, rsvp: 0 };
    state.items[id][kind] = (state.items[id][kind] || 0) + 1;
    save(state);
    render(true);
  }

  function render(animate) {
    // 1) count chips
    document.querySelectorAll('[data-count]').forEach((el) => {
      const id = el.getAttribute('data-count');
      const v = score(id);
      if (el.textContent !== String(v)) {
        el.textContent = v;
        if (animate) { el.classList.remove('count-pop'); void el.offsetWidth; el.classList.add('count-pop'); }
      }
    });

    // 2) trending lists — sort children by score, restripe bars + ranks
    document.querySelectorAll('[data-trending]').forEach((list) => {
      const items = Array.from(list.querySelectorAll('[data-rank-item]'));
      if (!items.length) return;
      const max = Math.max(1, ...items.map((n) => score(n.getAttribute('data-rank-item'))));
      items
        .sort((a, b) => score(b.getAttribute('data-rank-item')) - score(a.getAttribute('data-rank-item')))
        .forEach((node, i) => {
          list.appendChild(node); // reorder in DOM
          const id = node.getAttribute('data-rank-item');
          const bar = node.querySelector('[data-bar]');
          if (bar) bar.style.width = Math.round((score(id) / max) * 100) + '%';
          const rk = node.querySelector('[data-rank]');
          if (rk) rk.textContent = (i + 1);
          const sc = node.querySelector('[data-rank-score]');
          if (sc) sc.textContent = score(id);
        });
    });
  }

  // Delegated clicks — works for nodes added later by React.
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-track]');
    if (!t) return;
    const id = t.getAttribute('data-track');
    const kind = t.getAttribute('data-kind') || 'open';
    bump(id, kind);
    // share/rsvp give a little inline confirmation
    if (kind === 'share') flash(t, 'Shared ✓');
    if (kind === 'rsvp') {
      const on = t.toggleAttribute('data-on');
      t.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  });

  function flash(el, msg) {
    const prev = el.getAttribute('data-label-snapshot');
    if (prev === null) el.setAttribute('data-label-snapshot', el.textContent);
    const labelEl = el.querySelector('[data-share-label]') || el;
    const old = labelEl.textContent;
    labelEl.textContent = msg;
    setTimeout(() => { labelEl.textContent = old; }, 1100);
  }

  // Render once everything (incl. React artboards) has painted, and again
  // shortly after to catch late mounts.
  window.GCTracker = { render, bump, score };
  function boot() { render(false); }
  if (document.readyState === 'complete') boot(); else window.addEventListener('load', boot);
  setTimeout(() => render(false), 400);
  setTimeout(() => render(false), 1200);
})();
