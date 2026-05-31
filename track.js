/* ============================================================
   track.js — engagement tracking client (shared by site + dashboard)

   The PUBLIC SITE shows none of this. It just fires Track.hit(...) as
   friends use it. The PRIVATE dashboard (dashboard.html) reads it back.

   ── Going crew-wide ──────────────────────────────────────────
   Set ENDPOINT to your Google Apps Script web-app URL (see
   BACKEND-SETUP.md). When set:
     • hits are POSTed to the script (which appends to a Google Sheet)
     • the dashboard GETs the aggregated JSON back
   When ENDPOINT is empty (default), everything runs on localStorage —
   a real, working per-device demo you can click through today.
   ============================================================ */
(function () {
  const ENDPOINT = ''; // ← paste your Apps Script /exec URL here to go live
  const LS_KEY = 'gc_irl_hits_v1';
  const SID_KEY = 'gc_irl_sid';

  // anonymous per-browser id, so the dashboard can count unique friends
  function sid() {
    let s = null;
    try { s = localStorage.getItem(SID_KEY); } catch (e) {}
    if (!s) { s = 'f_' + Math.random().toString(36).slice(2, 9); try { localStorage.setItem(SID_KEY, s); } catch (e) {} }
    return s;
  }

  function loadLocal() {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveLocal(arr) { try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); } catch (e) {} }

  // One-time demo seed so the dashboard isn't empty on first open. Clearly
  // "local demo" data (the dashboard labels it as such); the Reset button
  // wipes it. Skipped entirely once any real hits exist or a live ENDPOINT
  // is configured.
  function seedIfEmpty() {
    if (ENDPOINT) return;
    try { if (localStorage.getItem('gc_irl_seeded')) return; } catch (e) {}
    const existing = loadLocal();
    const ev = { pride: 9, concert: 10, zion: 8, vietnam: 6, stars: 5, brunch: 5, bees: 4, rodeo: 4, coast: 3, craft: 2, race: 2 };
    const mem = { 'hike-may-9-2026': 7, 'hockey-april-11-2026': 4 };
    const friends = 7, DAY = 86400000, rows = [];
    const rnd = (n) => Math.floor(Math.random() * n);
    for (let f = 0; f < friends; f++) {
      const sidf = 'demo_' + (f + 1);
      const when = () => Date.now() - rnd(11) * DAY - rnd(86400) * 1000;
      if (Math.random() < 0.8) rows.push({ t: when(), sid: sidf, type: 'subscribe', kind: 'calendar', id: ['google', 'apple', 'copy'][rnd(3)], label: 'subscribe' });
      Object.keys(ev).forEach((id) => {
        const heat = ev[id];
        if (rnd(11) < heat) { rows.push({ t: when(), sid: sidf, type: 'open', kind: 'event', id: id });
          if (rnd(11) < heat - 2) rows.push({ t: when(), sid: sidf, type: 'rsvp', kind: 'event', id: id });
          if (rnd(13) < heat - 4) rows.push({ t: when(), sid: sidf, type: 'share', kind: 'event', id: id });
          if (rnd(13) < heat - 5) rows.push({ t: when(), sid: sidf, type: 'addcal', kind: 'event', id: id });
        }
      });
      Object.keys(mem).forEach((id) => { const heat = mem[id];
        if (rnd(9) < heat) { rows.push({ t: when(), sid: sidf, type: 'open', kind: 'memory', id: id });
          if (rnd(11) < heat) rows.push({ t: when(), sid: sidf, type: 'share', kind: 'memory', id: id }); }
      });
    }
    saveLocal(existing.concat(rows));
    try { localStorage.setItem('gc_irl_seeded', '1'); } catch (e) {}
  }
  seedIfEmpty();

  // Record one interaction. type: open|share|rsvp|subscribe|addcal
  // target kind: event|memory|calendar ; id: slug
  function hit(type, kind, id, label) {
    const row = { t: Date.now(), sid: sid(), type, kind, id: id || '', label: label || '' };
    // always cache locally (offline-safe + instant dashboard in local mode)
    const arr = loadLocal(); arr.push(row); saveLocal(arr);
    if (ENDPOINT) {
      try {
        const body = JSON.stringify(row);
        if (navigator.sendBeacon) navigator.sendBeacon(ENDPOINT, body);
        else fetch(ENDPOINT, { method: 'POST', body, mode: 'no-cors', keepalive: true });
      } catch (e) {}
    }
    return row;
  }

  // Pull all rows (dashboard). Live endpoint first, fall back to local.
  async function all() {
    if (ENDPOINT) {
      try {
        const r = await fetch(ENDPOINT + (ENDPOINT.includes('?') ? '&' : '?') + 'mode=all', { method: 'GET' });
        if (r.ok) { const j = await r.json(); if (Array.isArray(j)) return j; if (j && j.rows) return j.rows; }
      } catch (e) {}
    }
    return loadLocal();
  }

  function reset() { saveLocal([]); }

  window.Track = { hit, all, reset, sid, get endpoint() { return ENDPOINT; } };
})();
