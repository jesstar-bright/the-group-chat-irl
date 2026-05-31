# Real RSVP Identity + Perf Swap — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cosmetic "X friends are in" / fake avatars with a real per-event RSVP roster (typed name + optional Google photo), and swap React dev→production builds — without breaking the claude.ai/design edit workflow.

**Architecture:** All RSVP logic lives in two new repo-managed files: `rsvp-core.js` (pure, Node-testable functions) and `rsvp.jsx` (browser React module exposing `window.RSVP`, `RSVP.Count`, `RSVP.Faces`, and a self-mounted name-prompt portal). The existing Google Apps Script web app gains an `RSVPs` tab + a scoped `?mode=rsvps` endpoint; analytics (`Sheet1`) is untouched. `app.jsx` gets exactly 3 marked `/* RSVP HOOK */` edits. RSVP writes reuse `track.js`'s existing `/exec` endpoint and anonymous `sid`.

**Tech Stack:** Vanilla React 18 (UMD via unpkg) + in-browser Babel standalone, Google Identity Services (client-side ID token), Google Apps Script + Sheets, Node built-in test runner (`node --test`), `@babel/standalone` (transpile gate), `@playwright/test` (E2E).

**Scope:** Launch-focused per spec. Builds spec §1–11 + the *cheap* §12 security (input validation, length caps, `https://`-only photos, React escaping). **Deferred (not built here):** spec §13 analytics pipeline, and the heavy §12 items (rate-limiting, CSP, moderation UI, CAPTCHA, server-side token verification). Data model stays **raw `sid`**.

**Reference:** `docs/superpowers/specs/2026-05-31-rsvp-identity-design.md`. Copilot's superseded draft is at `docs/superpowers/patches/rsvp.draft.copilot.jsx` (do not build on it).

---

## File structure

| File | New? | Responsibility |
|---|---|---|
| `rsvp-core.js` | new | Pure functions: `initials`, `colorFor`, `firstName`, `sanitizeName`, `isValidPhotoUrl`, `decodeIdToken`, `dedupeRoster`. Dual export (Node `module.exports` + browser `window.RSVPCore`). No DOM, no React. |
| `rsvp.jsx` | new | Browser React module. Identity (`me` in localStorage), roster fetch/cache, `toggle`, Google sign-in, components `RSVP.Count`/`RSVP.Faces`, self-mounted name-prompt portal. Exposes `window.RSVP`. |
| `tests/rsvp-core.test.js` | new | `node --test` unit tests for every `rsvp-core.js` function. |
| `tests/transpile-check.js` | new | Standing gate: transpiles `rsvp.jsx`/`app.jsx`/`tweaks-panel.jsx` with the exact browser Babel. |
| `tests/rsvp.spec.js` | new | Playwright E2E happy-path (mocked endpoints). |
| `package.json` | new | `scripts.test`, devDeps `@babel/standalone`, `@playwright/test`. |
| `.gitignore` | modify | add `node_modules/`. |
| `index.html` | modify (design-managed) | #2 React swap; add `rsvp-core.js` + `rsvp.jsx` + GIS lib + client-id config. |
| `app.jsx` | modify (design-managed) | 3 `/* RSVP HOOK */` edits in the `EventDetail` whoin block. |
| `Apps Script` (Google, manual) | modify | `RSVPs` tab + `?mode=rsvps` GET + `rsvp` POST upsert + validation. |
| `BACKEND-SETUP.md` | modify | document the RSVP tab/endpoint, OAuth Client ID, curl tests. |
| `docs/superpowers/patches/APPLY_RSVP_HOOKS.copilot-draft.md` | replace | becomes the real re-apply checklist (supersedes Copilot version). |

---

## Task 1: Test scaffold (package.json + .gitignore)

**Files:**
- Create: `package.json`
- Modify: `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "the-group-chat-irl",
  "version": "1.0.0",
  "private": true,
  "description": "The Group Chat: IRL — social calendar site",
  "scripts": {
    "test": "node --test tests/",
    "transpile-check": "node tests/transpile-check.js",
    "test:e2e": "playwright test"
  },
  "devDependencies": {
    "@babel/standalone": "7.29.0",
    "@playwright/test": "^1.48.0"
  }
}
```

- [ ] **Step 2: Add `node_modules/` to `.gitignore`**

Append these lines to `.gitignore`:

```
# Node tooling (tests only — the site itself ships no build)
node_modules/
test-results/
playwright-report/
```

- [ ] **Step 3: Install dev dependencies**

Run: `npm install`
Expected: creates `node_modules/` and `package-lock.json`, no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json .gitignore
git commit -m "chore: add node test scaffold (node --test, babel, playwright)"
```

---

## Task 2: Perf fix #2 — React dev → production in index.html

**Files:**
- Modify: `index.html` (the two React `<script>` tags)

**Note:** `index.html` is design-managed. These edits go in the APPLY checklist (Task 10) so they survive re-export.

- [ ] **Step 1: Swap the React script tag**

Find this line in `index.html`:

```html
<script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="sha384-hD6/rw4ppMLGNu3tX5cjIb+uRZ7UkRJ6BPkLpg4hAu/6onKUg4lLsHAs9EBPT82L" crossorigin="anonymous"></script>
```

Replace with:

```html
<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js" integrity="sha384-LM+CFh2zMjBg5Vsi2lQ6CWNgFnk7n5GHr/JeJVorlmd1Op4kFD0qB6pjA1+nWcMu" crossorigin="anonymous"></script>
```

- [ ] **Step 2: Swap the ReactDOM script tag**

Find this line in `index.html`:

```html
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="sha384-u6aeetuaXnQ38mYT8rp6sbXaQe3NL9t+IBXmnYxwkUI2Hw4bsp2Wvmx4yRQF1uAm" crossorigin="anonymous"></script>
```

Replace with:

```html
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js" integrity="sha384-9Jx9R8mPziWPpInyVx6yKtkBPnNQGzWGI/SP6sFvfZ1pCcDqgEoQUm8X4tjUfHpz" crossorigin="anonymous"></script>
```

- [ ] **Step 3: Verify the integrity hashes match the live files**

Run:

```bash
for u in react@18.3.1/umd/react.production.min.js react-dom@18.3.1/umd/react-dom.production.min.js; do
  echo "$u"; curl -fsSL "https://unpkg.com/$u" | openssl dgst -sha384 -binary | openssl base64 -A; echo; done
```

Expected output (must match the `integrity=` values above exactly):
```
react@18.3.1/umd/react.production.min.js
LM+CFh2zMjBg5Vsi2lQ6CWNgFnk7n5GHr/JeJVorlmd1Op4kFD0qB6pjA1+nWcMu
react-dom@18.3.1/umd/react-dom.production.min.js
9Jx9R8mPziWPpInyVx6yKtkBPnNQGzWGI/SP6sFvfZ1pCcDqgEoQUm8X4tjUfHpz
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "perf: swap React dev->production builds with SRI hashes (#2)"
```

---

## Task 3: rsvp-core — `initials` + `colorFor` (TDD)

**Files:**
- Create: `rsvp-core.js`
- Test: `tests/rsvp-core.test.js`

- [ ] **Step 1: Write the failing test**

Create `tests/rsvp-core.test.js`:

```js
const test = require('node:test');
const assert = require('node:assert');
const C = require('../rsvp-core.js');

test('initials: first letter uppercased', () => {
  assert.strictEqual(C.initials('gaby'), 'G');
  assert.strictEqual(C.initials('  jess'), 'J');
});

test('initials: empty/blank -> "?"', () => {
  assert.strictEqual(C.initials(''), '?');
  assert.strictEqual(C.initials('   '), '?');
  assert.strictEqual(C.initials(null), '?');
});

test('colorFor: deterministic + from palette', () => {
  assert.strictEqual(C.colorFor('Gaby'), C.colorFor('Gaby'));
  assert.ok(C.COLORS.includes(C.colorFor('Gaby')));
  assert.ok(C.COLORS.includes(C.colorFor('')));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/rsvp-core.test.js`
Expected: FAIL — `Cannot find module '../rsvp-core.js'`.

- [ ] **Step 3: Write minimal implementation**

Create `rsvp-core.js`:

```js
/* rsvp-core.js — pure RSVP helpers. No DOM, no React.
   Loaded in the browser as a plain <script> (exposes window.RSVPCore)
   and required by Node tests (module.exports). See the design spec. */
(function (root) {
  var COLORS = ['#2f7cc0', '#5b8f5b', '#c08a2f', '#9a5bb0', '#2c8fa6', '#1f6aa8'];

  function initials(name) {
    var s = String(name == null ? '' : name).trim();
    return s ? s[0].toUpperCase() : '?';
  }

  function colorFor(name) {
    var s = String(name == null ? '' : name);
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return COLORS[h % COLORS.length];
  }

  var RSVPCore = { COLORS: COLORS, initials: initials, colorFor: colorFor };

  if (typeof module !== 'undefined' && module.exports) module.exports = RSVPCore;
  if (root) root.RSVPCore = RSVPCore;
})(typeof window !== 'undefined' ? window : null);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/rsvp-core.test.js`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add rsvp-core.js tests/rsvp-core.test.js
git commit -m "feat(rsvp-core): initials + deterministic colorFor"
```

---

## Task 4: rsvp-core — `sanitizeName` + `isValidPhotoUrl` (TDD)

**Files:**
- Modify: `rsvp-core.js`
- Modify: `tests/rsvp-core.test.js`

- [ ] **Step 1: Add failing tests**

Append to `tests/rsvp-core.test.js`:

```js
test('sanitizeName: trims, collapses spaces, strips <> and control chars, caps 50', () => {
  assert.strictEqual(C.sanitizeName('  Sam  '), 'Sam');
  assert.strictEqual(C.sanitizeName('a b<c>d'), 'abcd');
  assert.strictEqual(C.sanitizeName('Mary   Jane'), 'Mary Jane');
  assert.strictEqual(C.sanitizeName('x'.repeat(80)).length, 50);
  assert.strictEqual(C.sanitizeName(null), '');
});

test('isValidPhotoUrl: only https, <=200 chars, no spaces', () => {
  assert.strictEqual(C.isValidPhotoUrl('https://lh3.googleusercontent.com/a/x'), true);
  assert.strictEqual(C.isValidPhotoUrl('http://x.com/a.png'), false);
  assert.strictEqual(C.isValidPhotoUrl('javascript:alert(1)'), false);
  assert.strictEqual(C.isValidPhotoUrl('https://x.com/ a'), false);
  assert.strictEqual(C.isValidPhotoUrl('https://x.com/' + 'a'.repeat(220)), false);
  assert.strictEqual(C.isValidPhotoUrl(''), false);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/rsvp-core.test.js`
Expected: FAIL — `C.sanitizeName is not a function`.

- [ ] **Step 3: Implement**

In `rsvp-core.js`, add these two functions above the `var RSVPCore = ...` line:

```js
  function sanitizeName(name) {
    var s = String(name == null ? '' : name);
    s = s.replace(/[ -<>]/g, '');
    s = s.replace(/\s+/g, ' ').trim();
    return s.slice(0, 50);
  }

  function isValidPhotoUrl(url) {
    var s = String(url == null ? '' : url).trim();
    if (s.length === 0 || s.length > 200) return false;
    if (/\s/.test(s)) return false;
    return /^https:\/\//i.test(s);
  }
```

Then extend the export object:

```js
  var RSVPCore = { COLORS: COLORS, initials: initials, colorFor: colorFor,
    sanitizeName: sanitizeName, isValidPhotoUrl: isValidPhotoUrl };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/rsvp-core.test.js`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add rsvp-core.js tests/rsvp-core.test.js
git commit -m "feat(rsvp-core): sanitizeName + isValidPhotoUrl (cheap security)"
```

---

## Task 5: rsvp-core — `firstName` + `decodeIdToken` (TDD)

**Files:**
- Modify: `rsvp-core.js`
- Modify: `tests/rsvp-core.test.js`

- [ ] **Step 1: Add failing tests**

Append to `tests/rsvp-core.test.js`:

```js
test('firstName: first token, sanitized', () => {
  assert.strictEqual(C.firstName('Gaby Hernandez'), 'Gaby');
  assert.strictEqual(C.firstName('  Sam  '), 'Sam');
  assert.strictEqual(C.firstName(''), '');
});

test('decodeIdToken: reads name/picture/email from JWT payload', () => {
  // payload {"name":"Gaby","picture":"https://x/p.png","email":"g@x.com"}
  const payload = Buffer.from(JSON.stringify({
    name: 'Gaby', picture: 'https://x/p.png', email: 'g@x.com'
  })).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = 'header.' + payload + '.sig';
  assert.deepStrictEqual(C.decodeIdToken(jwt), { name: 'Gaby', picture: 'https://x/p.png', email: 'g@x.com' });
});

test('decodeIdToken: malformed -> null', () => {
  assert.strictEqual(C.decodeIdToken('not-a-jwt'), null);
  assert.strictEqual(C.decodeIdToken(''), null);
  assert.strictEqual(C.decodeIdToken(null), null);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/rsvp-core.test.js`
Expected: FAIL — `C.firstName is not a function`.

- [ ] **Step 3: Implement**

In `rsvp-core.js`, add above `var RSVPCore = ...`:

```js
  function firstName(name) {
    var s = sanitizeName(name);
    return s ? s.split(' ')[0] : '';
  }

  function b64urlDecode(str) {
    var s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    var pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
    s = s + pad;
    if (typeof Buffer !== 'undefined') return Buffer.from(s, 'base64').toString('utf8');
    return decodeURIComponent(escape(atob(s))); // browser, UTF-8 safe
  }

  function decodeIdToken(jwt) {
    try {
      var parts = String(jwt == null ? '' : jwt).split('.');
      if (parts.length < 2 || !parts[1]) return null;
      var p = JSON.parse(b64urlDecode(parts[1]));
      return { name: p.name || '', picture: p.picture || '', email: p.email || '' };
    } catch (e) { return null; }
  }
```

Extend the export object:

```js
  var RSVPCore = { COLORS: COLORS, initials: initials, colorFor: colorFor,
    sanitizeName: sanitizeName, isValidPhotoUrl: isValidPhotoUrl,
    firstName: firstName, decodeIdToken: decodeIdToken };
```

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/rsvp-core.test.js`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add rsvp-core.js tests/rsvp-core.test.js
git commit -m "feat(rsvp-core): firstName + decodeIdToken (GIS ID-token claims)"
```

---

## Task 6: rsvp-core — `dedupeRoster` (TDD)

**Files:**
- Modify: `rsvp-core.js`
- Modify: `tests/rsvp-core.test.js`

- [ ] **Step 1: Add failing tests**

Append to `tests/rsvp-core.test.js`:

```js
test('dedupeRoster: latest state per (event,device), only "in", first-name + valid photo', () => {
  const rows = [
    { event_id: 'pride', device_id: 'd1', name: 'Sam Lee', photo: 'https://x/p.png', state: 'in', t: 1 },
    { event_id: 'pride', device_id: 'd1', name: 'Sam Lee', photo: '', state: 'out', t: 2 }, // d1 left
    { event_id: 'pride', device_id: 'd2', name: 'Gaby', photo: 'http://bad', state: 'in', t: 1 }, // bad photo -> ''
    { event_id: 'bees', device_id: 'd3', name: 'Kate Smith', photo: '', state: 'in', t: 5 },
  ];
  assert.deepStrictEqual(C.dedupeRoster(rows), {
    pride: [{ name: 'Gaby', photo: '' }],
    bees: [{ name: 'Kate', photo: '' }],
  });
});

test('dedupeRoster: empty/garbage -> {}', () => {
  assert.deepStrictEqual(C.dedupeRoster([]), {});
  assert.deepStrictEqual(C.dedupeRoster(null), {});
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node --test tests/rsvp-core.test.js`
Expected: FAIL — `C.dedupeRoster is not a function`.

- [ ] **Step 3: Implement**

In `rsvp-core.js`, add above `var RSVPCore = ...`:

```js
  function dedupeRoster(rows) {
    var latest = {};
    (rows || []).forEach(function (r) {
      var k = r.event_id + '|' + r.device_id;
      if (!latest[k] || (r.t || 0) >= (latest[k].t || 0)) latest[k] = r;
    });
    var out = {};
    Object.keys(latest).forEach(function (k) {
      var r = latest[k];
      if (r.state !== 'in') return;
      var nm = firstName(r.name);
      if (!r.event_id || !nm) return;
      (out[r.event_id] = out[r.event_id] || []).push({
        name: nm, photo: isValidPhotoUrl(r.photo) ? r.photo : ''
      });
    });
    return out;
  }
```

Extend the export object to include `dedupeRoster: dedupeRoster`.

- [ ] **Step 4: Run to verify it passes**

Run: `node --test tests/rsvp-core.test.js`
Expected: PASS (10 tests).

- [ ] **Step 5: Commit**

```bash
git add rsvp-core.js tests/rsvp-core.test.js
git commit -m "feat(rsvp-core): dedupeRoster by (event,device), in-only"
```

---

## Task 7: rsvp.jsx — browser RSVP module + components

**Files:**
- Create: `rsvp.jsx`
- Create: `tests/transpile-check.js`

This file is verified by the transpile gate (it uses React + browser APIs, so it isn't unit-tested in Node; its pure logic already lives in `rsvp-core.js`).

- [ ] **Step 1: Write the transpile-gate check**

Create `tests/transpile-check.js`:

```js
// Transpiles the site's JSX with the EXACT Babel build the browser loads.
// If this passes, the in-browser transform will too (no blank page).
const fs = require('fs');
const path = require('path');
const Babel = require('@babel/standalone');

const root = path.join(__dirname, '..');
const files = ['rsvp.jsx', 'tweaks-panel.jsx', 'app.jsx'];
let failed = false;
for (const f of files) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) { console.log('SKIP (missing):', f); continue; }
  try {
    Babel.transform(fs.readFileSync(p, 'utf8'), { presets: ['react'], filename: f });
    console.log('OK  ', f);
  } catch (e) {
    failed = true;
    console.log('FAIL', f, '-', e.message.split('\n')[0]);
  }
}
process.exit(failed ? 1 : 0);
```

- [ ] **Step 2: Run the gate to confirm the current (pre-rsvp.jsx) files still pass**

Run: `node tests/transpile-check.js`
Expected: `OK   tweaks-panel.jsx`, `OK   app.jsx`, `SKIP (missing): rsvp.jsx` is NOT printed (rsvp.jsx skipped only until created). Exit 0.

- [ ] **Step 3: Create `rsvp.jsx`**

```jsx
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
```

- [ ] **Step 4: Run the transpile gate (now includes rsvp.jsx)**

Run: `node tests/transpile-check.js`
Expected: `OK   rsvp.jsx`, `OK   tweaks-panel.jsx`, `OK   app.jsx`. Exit 0.

- [ ] **Step 5: Commit**

```bash
git add rsvp.jsx tests/transpile-check.js
git commit -m "feat(rsvp): browser RSVP module + Count/Faces + name-prompt portal"
```

---

## Task 8: Apps Script backend (manual) + BACKEND-SETUP.md + curl tests

**Files:**
- Modify: `BACKEND-SETUP.md`
- Apps Script (in Google, manual — owned by Jessica)

The Apps Script can't be unit-tested locally; it's verified with `curl` after deploy.

- [ ] **Step 1: Append the RSVP backend section to `BACKEND-SETUP.md`**

Append to `BACKEND-SETUP.md`:

````markdown

---

## RSVP roster (real "who's in")

Adds a second tab + two routes to the SAME Apps Script web app. Analytics
(`Sheet1`) is untouched and stays private.

### 1. Replace the Apps Script with this (keeps the old analytics behavior)

```javascript
const HITS = 'Sheet1';
const RSVPS = 'RSVPs';

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const r = JSON.parse(e.postData.contents);
    if (r.kind === 'rsvp') return upsertRsvp_(r);
    // ---- existing analytics append (unchanged) ----
    const sh = SpreadsheetApp.getActive().getSheetByName(HITS);
    sh.appendRow([r.t || Date.now(), r.sid || '', r.type || '', r.kind || '', r.id || '', r.label || '']);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('err: ' + err);
  } finally {
    lock.releaseLock();
  }
}

function sanitizeName_(v) {
  return String(v == null ? '' : v).replace(/[ -<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 50);
}
function validPhoto_(v) {
  const s = String(v || '').trim();
  return (s.length > 0 && s.length <= 200 && !/\s/.test(s) && /^https:\/\//i.test(s)) ? s : '';
}

function upsertRsvp_(r) {
  const event = String(r.event || '').slice(0, 100);
  const sid = String(r.sid || '').slice(0, 128);
  const name = sanitizeName_(r.name);
  const photo = validPhoto_(r.photo);
  const state = (r.state === 'out') ? 'out' : 'in';
  if (!event || !sid || !name) return ContentService.createTextOutput('err: missing fields');
  const ss = SpreadsheetApp.getActive();
  let sh = ss.getSheetByName(RSVPS);
  if (!sh) { sh = ss.insertSheet(RSVPS); sh.appendRow(['event_id', 'device_id', 'name', 'photo', 'state', 't']); }
  const vals = sh.getDataRange().getValues();
  for (let i = 1; i < vals.length; i++) {
    if (vals[i][0] === event && vals[i][1] === sid) {
      sh.getRange(i + 1, 1, 1, 6).setValues([[event, sid, name, photo, state, Date.now()]]);
      return ContentService.createTextOutput('ok');
    }
  }
  sh.appendRow([event, sid, name, photo, state, Date.now()]);
  return ContentService.createTextOutput('ok');
}

function doGet(e) {
  if (e && e.parameter && e.parameter.mode === 'rsvps') return rosterJson_();
  // ---- existing dashboard behavior (all hit rows, unchanged) ----
  const sh = SpreadsheetApp.getActive().getSheetByName(HITS);
  const vals = sh.getDataRange().getValues();
  vals.shift();
  const rows = vals.filter(function (v) { return v[0]; })
    .map(function (v) { return { t: Number(v[0]), sid: v[1], type: v[2], kind: v[3], id: v[4], label: v[5] }; });
  return ContentService.createTextOutput(JSON.stringify(rows)).setMimeType(ContentService.MimeType.JSON);
}

// Scoped public roster: ONLY name+photo for state==='in'. No device_id, no Sheet1.
function rosterJson_() {
  const sh = SpreadsheetApp.getActive().getSheetByName(RSVPS);
  const out = {};
  if (sh) {
    const vals = sh.getDataRange().getValues();
    for (let i = 1; i < vals.length; i++) {
      const event = vals[i][0], name = vals[i][2], photo = vals[i][3], state = vals[i][4];
      if (state !== 'in' || !event || !name) continue;
      (out[event] = out[event] || []).push({ name: name, photo: photo || '' });
    }
  }
  return ContentService.createTextOutput(JSON.stringify(out)).setMimeType(ContentService.MimeType.JSON);
}
```

### 2. Redeploy
**Deploy → New deployment → Web app**, *Execute as: Me*, *Who has access: Anyone*. Copy the `/exec` URL (the existing one keeps working until you swap it). The site already points at this URL via `track.js`.

### 3. Google OAuth Client ID (for the optional photo)
1. Google Cloud console → **APIs & Services → Credentials → Create credentials → OAuth client ID → Web application**.
2. Under **Authorized JavaScript origins** add `https://jesstar-bright.github.io`.
3. Configure the **OAuth consent screen** (External). Basic profile sign-in usually avoids the "unverified app" warning; if it appears, add friends as **Test users** (testing mode) or publish.
4. Copy the **Client ID** and paste it into `index.html` at `window.GC_GOOGLE_CLIENT_ID = '...'`. Leaving it `''` keeps the name-only flow (photo button hidden).
````

- [ ] **Step 2: After Jessica deploys, verify the endpoints with curl**

Set the deployed URL (note `-L`: Apps Script `/exec` 302-redirects):

```bash
EXEC="https://script.google.com/macros/s/AKfycbwHsieuiHlCqXzW3m4ja6bN2VjkJl2A4Z3H57Ed7erX5P8GpTL2bRxZSp-hZrc2tmIw1g/exec"
# RSVP in
curl -sL -X POST "$EXEC" -H 'Content-Type: application/json' \
  -d '{"kind":"rsvp","event":"__test","sid":"qa1","name":"Sam Lee","photo":"https://x/p.png","state":"in"}'
# Read scoped roster — must show first name only, no device_id
curl -sL "$EXEC?mode=rsvps"
```
Expected: first call prints `ok`; second prints JSON containing `"__test":[{"name":"Sam","photo":"https://x/p.png"}]` and **no** `device_id`/`sid`.

```bash
# Toggle out, then confirm the test event is gone
curl -sL -X POST "$EXEC" -H 'Content-Type: application/json' \
  -d '{"kind":"rsvp","event":"__test","sid":"qa1","name":"Sam","state":"out"}'
curl -sL "$EXEC?mode=rsvps"
# Reject malformed (missing name)
curl -sL -X POST "$EXEC" -H 'Content-Type: application/json' \
  -d '{"kind":"rsvp","event":"__test","sid":"qa2"}'
```
Expected: roster no longer lists `__test`; the malformed POST prints `err: missing fields`.

- [ ] **Step 3: Commit the docs**

```bash
git add BACKEND-SETUP.md
git commit -m "docs: RSVP backend (RSVPs tab, scoped roster endpoint, OAuth, curl tests)"
```

---

## Task 9: Wire index.html (rsvp-core.js, rsvp.jsx, GIS, client-id)

**Files:**
- Modify: `index.html` (design-managed)

- [ ] **Step 1: Replace the closing script block**

Find this block at the bottom of `index.html`:

```html
<script src="data.js"></script>
<script src="track.js"></script>
<script type="text/babel" src="tweaks-panel.jsx"></script>
<script type="text/babel" src="app.jsx"></script>
```

Replace with:

```html
<!-- RSVP: Google sign-in client id (paste your OAuth Web Client ID; '' = name-only) -->
<script>window.GC_GOOGLE_CLIENT_ID = '';</script>
<script src="https://accounts.google.com/gsi/client" async></script>
<script src="data.js"></script>
<script src="track.js"></script>
<script src="rsvp-core.js"></script>
<script type="text/babel" src="tweaks-panel.jsx"></script>
<script type="text/babel" src="rsvp.jsx"></script>
<script type="text/babel" src="app.jsx"></script>
```

- [ ] **Step 2: Verify load order + presence**

Run:

```bash
grep -nE "rsvp-core\.js|rsvp\.jsx|gsi/client|GC_GOOGLE_CLIENT_ID|app\.jsx" index.html
```
Expected: `rsvp-core.js` appears before `rsvp.jsx`, which appears before `app.jsx`; the GIS client and `GC_GOOGLE_CLIENT_ID` lines are present.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: load rsvp-core.js + rsvp.jsx + Google Identity Services"
```

---

## Task 10: app.jsx — the 3 RSVP hooks + re-apply checklist

**Files:**
- Modify: `app.jsx` (design-managed)
- Replace: `docs/superpowers/patches/APPLY_RSVP_HOOKS.copilot-draft.md` → `docs/superpowers/patches/APPLY_RSVP_HOOKS.md`

- [ ] **Step 1: Apply the 3 hooks in the `EventDetail` whoin block**

Find this block in `app.jsx` (search `friends are in`):

```jsx
        <div className="whoin">
          <div><div className="lbl">{6 + (ev.id.length % 5)} friends are in</div><div style={{ marginTop: 8 }}><Faces /></div></div>
          <button className={'rsvp' + (rsvpOn ? ' on' : '')} onClick={rsvp}>{rsvpOn ? "You're in ✓" : "I'm in"}</button>
        </div>
```

Replace with:

```jsx
        <div className="whoin">
          <div><div className="lbl">{/* RSVP HOOK */}<RSVP.Count eventId={ev.id} /></div><div style={{ marginTop: 8 }}>{/* RSVP HOOK */}<RSVP.Faces eventId={ev.id} /></div></div>
          <button className={'rsvp' + (rsvpOn ? ' on' : '')} onClick={() => { rsvp(); /* RSVP HOOK */ RSVP.toggle(ev.id); }}>{rsvpOn ? "You're in ✓" : "I'm in"}</button>
        </div>
```

- [ ] **Step 2: Run the transpile gate**

Run: `node tests/transpile-check.js`
Expected: `OK   rsvp.jsx`, `OK   tweaks-panel.jsx`, `OK   app.jsx`. Exit 0.

- [ ] **Step 3: Run the unit tests (confirm nothing regressed)**

Run: `npm test`
Expected: all `rsvp-core` tests PASS.

- [ ] **Step 4: Write the real re-apply checklist**

Delete the Copilot draft and create `docs/superpowers/patches/APPLY_RSVP_HOOKS.md`:

```bash
git rm docs/superpowers/patches/APPLY_RSVP_HOOKS.copilot-draft.md
```

Create `docs/superpowers/patches/APPLY_RSVP_HOOKS.md`:

````markdown
# Re-apply RSVP hooks after a claude.ai/design re-export

`app.jsx` and `index.html` are regenerated by claude.ai/design. After any
re-export, re-apply the edits below (they live in the repo, not the design tool).
Grep for `RSVP HOOK` to confirm they're present.

## app.jsx — `EventDetail` whoin block (search: `friends are in`)

Replace:
```jsx
<div><div className="lbl">{6 + (ev.id.length % 5)} friends are in</div><div style={{ marginTop: 8 }}><Faces /></div></div>
<button className={'rsvp' + (rsvpOn ? ' on' : '')} onClick={rsvp}>{rsvpOn ? "You're in ✓" : "I'm in"}</button>
```
With:
```jsx
<div><div className="lbl">{/* RSVP HOOK */}<RSVP.Count eventId={ev.id} /></div><div style={{ marginTop: 8 }}>{/* RSVP HOOK */}<RSVP.Faces eventId={ev.id} /></div></div>
<button className={'rsvp' + (rsvpOn ? ' on' : '')} onClick={() => { rsvp(); /* RSVP HOOK */ RSVP.toggle(ev.id); }}>{rsvpOn ? "You're in ✓" : "I'm in"}</button>
```
(Leave the generic Home-carousel `<Faces />` alone — only the whoin block changes.)

## index.html — closing script block

Ensure these load in order (add if the re-export dropped them):
```html
<script>window.GC_GOOGLE_CLIENT_ID = '...';</script>
<script src="https://accounts.google.com/gsi/client" async></script>
...
<script src="rsvp-core.js"></script>
<script type="text/babel" src="rsvp.jsx"></script>   <!-- before app.jsx -->
```
And confirm React is the `.production.min.js` build with the SRI hashes from the plan.

## After re-applying
Run `node tests/transpile-check.js` (expect all OK) before committing.
````

- [ ] **Step 5: Commit**

```bash
git add app.jsx docs/superpowers/patches/
git commit -m "feat(rsvp): wire 3 app.jsx hooks + real re-apply checklist"
```

---

## Task 11: Playwright E2E happy-path

**Files:**
- Create: `tests/rsvp.spec.js`
- Create: `playwright.config.js`

- [ ] **Step 1: Install Playwright browsers**

Run: `npx playwright install chromium`
Expected: downloads Chromium, no errors.

- [ ] **Step 2: Create `playwright.config.js`**

```js
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.js',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'python3 -m http.server 4173',
    port: 4173,
    reuseExistingServer: true,
  },
});
```

- [ ] **Step 3: Write the E2E test**

Create `tests/rsvp.spec.js`:

```js
const { test, expect } = require('@playwright/test');

// Mock the Apps Script endpoint so the run is deterministic and offline.
async function mockEndpoint(page, rosterRef) {
  await page.route(/\/exec(\?.*)?$/, async (route) => {
    const req = route.request();
    if (req.method() === 'GET' && req.url().includes('mode=rsvps')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rosterRef.value) });
    }
    // POST upsert — record "in" so the reconcile GET reflects it
    try {
      const body = JSON.parse(req.postData() || '{}');
      if (body.kind === 'rsvp' && body.state === 'in') {
        rosterRef.value[body.event] = [{ name: body.name, photo: body.photo || '' }];
      } else if (body.kind === 'rsvp' && body.state === 'out') {
        delete rosterRef.value[body.event];
      }
    } catch (e) {}
    return route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' });
  });
}

test('tapping "I\'m in" prompts for name then shows a real count', async ({ page }) => {
  const rosterRef = { value: {} };
  await mockEndpoint(page, rosterRef);

  await page.goto('/');
  // Open the first event card → event detail
  await page.locator('.ecard').first().click();
  await expect(page.locator('.whoin')).toBeVisible();

  // No real RSVPs yet → count line is empty (never shows "0 friends are in")
  await expect(page.locator('.whoin .lbl')).toHaveText('');

  // Tap "I'm in" → name prompt appears
  await page.getByRole('button', { name: /I'm in/ }).click();
  await expect(page.locator('#rsvp-portal .sheet')).toBeVisible();

  // Enter name, submit
  await page.locator('#rsvp-portal input').fill('Sam');
  await page.locator('#rsvp-portal').getByRole('button', { name: /I'm in/ }).click();

  // Optimistic: count updates to "1 friend is in" and an avatar with initial "S"
  await expect(page.locator('.whoin .lbl')).toContainText('1 friend is in');
  await expect(page.locator('.whoin .faces .face').first()).toHaveText('S');
});
```

- [ ] **Step 4: Run the E2E test**

Run: `npx playwright test`
Expected: 1 passed. (If the `.ecard`/`.whoin` selectors drift, update them to match `app.jsx`/`styles.css`.)

- [ ] **Step 5: Commit**

```bash
git add tests/rsvp.spec.js playwright.config.js
git commit -m "test(rsvp): Playwright happy-path E2E with mocked endpoints"
```

---

## Task 12: Final integration gate + manual smoke

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm test && node tests/transpile-check.js && npx playwright test`
Expected: unit tests PASS, transpile gate all `OK`, Playwright `1 passed`.

- [ ] **Step 2: Manual smoke on the real site (after Jessica deploys the Apps Script + sets the OAuth client id)**

Serve locally: `python3 -m http.server 4173` then open `http://localhost:4173`.
- Open an event → tap **I'm in** → name sheet appears → enter name → count shows "1 friend is in" with your initial avatar.
- Refresh → you persist (roster fetch shows you).
- Tap **You're in ✓** → you're removed.
- Confirm the calendar **Subscribe** flow and lightbox still work (no regressions from the React swap).
- Open `dashboard.html` → confirm analytics still load (Sheet1 untouched).

> Note: the live calendar key and Google sign-in are domain-locked to `jesstar-bright.github.io`, so on `localhost` the calendar falls back to curated events and Google sign-in may not complete — that's expected. Full photo verification happens on the deployed URL.

- [ ] **Step 3: Final commit (if any selector tweaks were needed)**

```bash
git add -A
git commit -m "chore(rsvp): final integration pass"
```

---

## Self-review notes (coverage map)

- Spec §3 file ownership → Tasks 3-7 (`rsvp-core.js`, `rsvp.jsx`), 9 (`index.html`), 10 (`app.jsx`).
- Spec §4 data model + scoped endpoint → Task 8 (`RSVPs` tab, `?mode=rsvps`, upsert) + Task 6 (`dedupeRoster`).
- Spec §5 hybrid identity + GIS → Task 7 (`me`, name prompt, `signInWithGoogle`) + Task 5 (`decodeIdToken`).
- Spec §6 three hooks + checklist → Task 10.
- Spec §7 perf swap → Task 2.
- Spec §8 error handling (silent fallback, never "0 friends") → Task 7 (`Count` returns null, silent catches) + Task 11 (asserts empty count line).
- Spec §9 testing → Tasks 3-6 (unit), 7 (transpile gate), 8 (curl), 11 (Playwright).
- Spec §10 setup tasks → Task 8 (steps 1-3 docs).
- Spec §11 privacy (first-name-only, opt-out) → `firstName` in Task 5/6 + `rosterJson_` omits device_id (Task 8) + toggle-out opt-out (Task 7).
- Spec §12 cheap security → `sanitizeName`/`isValidPhotoUrl` (Task 4) + Apps Script validation (Task 8). Heavy items deferred (documented in spec §12 banner).
- Spec §13 analytics pipeline → DEFERRED (not in plan, per launch scope).
