/* rsvp.jsx — real per-event RSVP roster (typed name + optional Google photo).
   Load order (index.html): React, ReactDOM, Babel, GIS client, data.js,
   track.js, rsvp-core.js, rsvp.jsx, app.jsx.
   Exposes window.RSVP and components RSVP.Count / RSVP.Faces.
   Spec: docs/superpowers/specs/2026-05-31-rsvp-identity-design.md */
(function () {
  const { useState, useEffect } = React;
  const C = window.RSVPCore;
  const ME_KEY = 'gc_irl_me';
  // Reuse the live analytics web app + anonymous sid that track.js owns.
  const endpoint = (window.Track && window.Track.endpoint) || '';

  /* ---------- identity (me) ---------- */
  function loadMe() {
    let me = {};
    try { me = JSON.parse(localStorage.getItem(ME_KEY) || '{}'); } catch (e) {}
    if (!me.sid) {
      me.sid = (window.Track && window.Track.sid)
        ? window.Track.sid()
        : 'f_' + Math.random().toString(36).slice(2, 9);
    }
    return me;
  }
  function saveMe(m) { try { localStorage.setItem(ME_KEY, JSON.stringify(m)); } catch (e) {} }
  let me = loadMe();

  /* ---------- roster cache ---------- */
  let roster = {};                 // { eventId: [{name, photo}] }
  const subs = new Set();
  const notify = () => subs.forEach((fn) => { try { fn(); } catch (e) {} });
  function subscribe(fn) { subs.add(fn); return () => subs.delete(fn); }
  function rosterFor(id) { return (roster[id] || []).slice(); }
  function count(id) { return (roster[id] || []).length; }
  function amIn(id) {
    const mine = C.firstName(me.name);
    return !!mine && rosterFor(id).some((r) => r.name === mine);
  }

  async function fetchRosters() {
    if (!endpoint) return;
    try {
      const r = await fetch(endpoint + (endpoint.includes('?') ? '&' : '?') + 'mode=rsvps');
      if (!r.ok) return;
      const data = await r.json();
      if (data && typeof data === 'object' && !Array.isArray(data)) { roster = data; notify(); }
    } catch (e) { /* silent — keep cache, never break the UI */ }
  }

  function upsert(eventId, state) {
    if (!endpoint) return;
    const body = JSON.stringify({
      kind: 'rsvp', event: eventId, sid: me.sid,
      name: C.firstName(me.name), photo: me.photo || '', state: state
    });
    try {
      if (navigator.sendBeacon) navigator.sendBeacon(endpoint, body);
      else fetch(endpoint, { method: 'POST', body: body, mode: 'no-cors', keepalive: true });
    } catch (e) { /* silent */ }
  }

  // optimistic local roster mutation
  function setLocal(eventId, isIn) {
    const mine = C.firstName(me.name);
    const cur = (roster[eventId] || []).filter((r) => r.name !== mine);
    roster[eventId] = isIn
      ? cur.concat([{ name: mine, photo: C.isValidPhotoUrl(me.photo) ? me.photo : '' }])
      : cur;
    notify();
  }

  /* ---------- name prompt (self-mounted portal; no app.jsx footprint) ---------- */
  let promptState = null; // { resolve }
  function openNamePrompt() {
    return new Promise((resolve) => { promptState = { resolve: resolve }; renderPortal(); });
  }
  function closeNamePrompt(result) {
    const p = promptState; promptState = null; renderPortal();
    if (p) p.resolve(result);
  }

  /* ---------- public toggle ---------- */
  async function toggle(eventId) {
    if (!me.name) {
      const name = await openNamePrompt();
      if (!name) return;                 // cancelled — do not record
      me = Object.assign({}, me, { name: C.sanitizeName(name) });
      saveMe(me);
    }
    const goingIn = !amIn(eventId);
    setLocal(eventId, goingIn);           // optimistic
    upsert(eventId, goingIn ? 'in' : 'out');
    setTimeout(fetchRosters, 1200);       // gentle reconcile
  }

  /* ---------- optional Google photo ---------- */
  function signInWithGoogle() {
    const cid = window.GC_GOOGLE_CLIENT_ID;
    if (!cid || !(window.google && google.accounts && google.accounts.id)) return; // silent fallback
    google.accounts.id.initialize({
      client_id: cid,
      callback: function (resp) {
        const claims = C.decodeIdToken(resp && resp.credential);
        if (!claims) return;
        me = Object.assign({}, me, {
          name: C.sanitizeName(claims.name) || me.name,
          photo: C.isValidPhotoUrl(claims.picture) ? claims.picture : (me.photo || '')
        });
        saveMe(me);
        Object.keys(roster).forEach((eid) => { if (amIn(eid)) { setLocal(eid, true); upsert(eid, 'in'); } });
        notify();
      }
    });
    google.accounts.id.prompt();
  }

  /* ---------- components ---------- */
  function Avatar({ r }) {
    if (r.photo) {
      return <img className="face" src={r.photo} alt="" referrerPolicy="no-referrer"
        style={{ objectFit: 'cover' }} onError={(e) => { e.target.style.visibility = 'hidden'; }} />;
    }
    return <div className="face" style={{ background: C.colorFor(r.name) }}>{C.initials(r.name)}</div>;
  }

  function Faces({ eventId, max = 5 }) {
    const [, force] = useState(0);
    useEffect(() => subscribe(() => force((n) => n + 1)), []);
    const list = rosterFor(eventId);
    if (!list.length) return <div className="faces" />;
    const shown = list.slice(0, max);
    const extra = list.length - shown.length;
    return (
      <div className="faces">
        {shown.map((r, i) => <Avatar key={r.name + i} r={r} />)}
        {extra > 0 && <div className="face" style={{ background: '#9aa4b2' }}>{'+' + extra}</div>}
      </div>
    );
  }

  function Count({ eventId }) {
    const [, force] = useState(0);
    useEffect(() => subscribe(() => force((n) => n + 1)), []);
    const n = count(eventId);
    if (!n) return null;                  // never render "0 friends are in"
    return <React.Fragment>{n} {n === 1 ? 'friend is' : 'friends are'} in</React.Fragment>;
  }

  function NamePrompt() {
    const [val, setVal] = useState('');
    if (!promptState) return null;
    const submit = () => { const v = C.sanitizeName(val); if (v) closeNamePrompt(v); };
    return (
      <div className="scrim" onClick={() => closeNamePrompt(null)}>
        <div className="sheet" onClick={(e) => e.stopPropagation()}>
          <div className="grab" />
          <h3>You're in! What's your name?</h3>
          <p>So the crew can see who's coming. Your first name is perfect.</p>
          <input autoFocus value={val} placeholder="Your first name"
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', fontSize: 16,
              border: '1px solid #d6dee7', borderRadius: 12, margin: '6px 0 12px', outline: 'none' }} />
          <button className="btn acc" onClick={submit}><span>I'm in</span></button>
          {window.GC_GOOGLE_CLIENT_ID &&
            <button className="btn ghost" style={{ marginTop: 8 }}
              onClick={() => { submit(); signInWithGoogle(); }}><span>Add your photo — sign in with Google</span></button>}
        </div>
      </div>
    );
  }

  let portalRoot = null, portalReactRoot = null;
  function renderPortal() {
    if (!portalRoot) {
      portalRoot = document.createElement('div');
      portalRoot.id = 'rsvp-portal';
      document.body.appendChild(portalRoot);
      portalReactRoot = ReactDOM.createRoot(portalRoot);
    }
    portalReactRoot.render(<NamePrompt />);
  }

  /* ---------- expose + init ---------- */
  window.RSVP = {
    toggle: toggle, fetchRosters: fetchRosters, rosterFor: rosterFor, count: count,
    amIn: amIn, subscribe: subscribe, signInWithGoogle: signInWithGoogle,
    Count: Count, Faces: Faces, get me() { return me; }
  };
  fetchRosters();
})();
