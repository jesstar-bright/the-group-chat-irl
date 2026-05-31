# The Group Chat: IRL — Real RSVP Identity + Perf Fix

**Date:** 2026-05-31
**Status:** Approved design — ready for implementation plan
**Scope:** Two independent workstreams from the QA audit:
- **#1** — Replace the cosmetic "X friends are in" / fake avatars with a real, per-event RSVP roster (names + optional Google photos).
- **#2** — Reduce front-end weight by swapping React dev → production builds, without breaking the claude.ai/design edit workflow.

---

## 1. Background & problem

The site is a static, client-side React app (JSX transpiled in-browser via Babel standalone) deployed to `jesstar-bright.github.io/the-group-chat-irl`. It already has an analytics backend: a **Google Apps Script web app + Google Sheet** (`Sheet1`, columns `t · sid · type · kind · id · label`). `track.js` POSTs interaction rows; the private `dashboard.html` GETs them all.

The QA audit found:
- **#1** — `app.jsx` shows `{6 + (ev.id.length % 5)} friends are in` (a number derived from the event's name length) and hardcoded letter avatars. The "I'm in" toggle lives only in component state and resets on refresh. It *does* fire an anonymous `Track.hit('rsvp', …)`, but there is no identity and nothing real is displayed.
- **#2** — Ships React's development build and transpiles JSX in every visitor's browser on each load.

### Google privacy constraints (why the literal ask isn't buildable)

The original idea — "show who said yes to the calendar invite, with their Gmail photos" — is blocked by Google's model:
- **Calendar subscribers are not readable.** Subscribing to a shared calendar (what the "Subscribe" button does) returns the visitor nothing-back; Google never reveals who subscribed, even to the owner.
- **Event RSVPs** require each person to be an individually-invited attendee, and reading responses needs authenticated Calendar API access *as the organizer* — not a public key.
- **Gmail photos cannot be fetched from an email address.** The only way to obtain a person's Google name/photo is if **they sign into our site** and consent, at which point we read *their own* profile.

**Therefore:** "X friends are in" = people who tap **"I'm in"** on our site, per event (which is exactly where that text lives).

---

## 2. Decisions (locked)

| # | Decision | Choice | Rationale |
|---|---|---|---|
| D1 | Identity capture | **Hybrid** | Default = type first name (frictionless, remembered on device). Optional "Add your photo — sign in with Google" for those who want a picture. |
| D2 | RSVP backend | **Extend Apps Script + Sheet** | Reuse existing zero-cost Google infra. New dedicated `RSVPs` tab + a scoped public endpoint. No new services. |
| D3 | Google photo mechanism | **Google Identity Services (GIS), client-side** | Sign-in button returns an ID token (JWT); read `name` + `picture` claims client-side. No token storage, no servers, no People API. |
| D4 | `app.jsx` clobber strategy | **Marked hooks + re-apply checklist** | Feature needs ~3 small edits to the design-managed `app.jsx`; mark them `/* RSVP HOOK */` and document re-apply steps. |
| D5 | Perf fix (#2) | **Production React swap, keep pattern** | Swap dev→prod React builds + update SRI hashes. Keeps Babel-in-browser and the claude.ai/design workflow intact. |
| D6 | Privacy default | **First-name-only + tap-to-leave opt-out** | Minimize personal data published on a public URL while still satisfying "see who's in". |

---

## 3. Architecture & file ownership

Guiding principle: **keep new logic out of design-managed files.** All RSVP logic lives in a new repo-owned file; `app.jsx` gets only a tiny, marked footprint.

| File | Owner | Change |
|---|---|---|
| **`rsvp.jsx`** *(new, repo-managed)* | repo | All RSVP logic + ready-made React components (`RSVPFaces`, `RSVPCount`, identity sheet, Google sign-in). Exposes `window.RSVP`. |
| `app.jsx` | claude.ai/design | 3 marked `/* RSVP HOOK */` edits (see §6). |
| `index.html` | claude.ai/design | Add `<script type="text/babel" src="rsvp.jsx">` (before `app.jsx`) + GIS library `<script src="https://accounts.google.com/gsi/client" async>`. Plus the #2 React swap (§7). |
| Apps Script + Sheet | Jessica (manual) | New `RSVPs` tab + two routes; redeploy. |
| `track.js` | repo | Unchanged. (RSVP still also fires the existing `Track.hit('rsvp', …)` so the dashboard love-score keeps working.) |
| `BACKEND-SETUP.md` | repo | Append the RSVP tab/endpoint + OAuth Client ID setup steps. |

**Load order in `index.html`:** React/ReactDOM → Babel → GIS client → `data.js` → `track.js` → `rsvp.jsx` → `app.jsx`. (`rsvp.jsx` must define `window.RSVP` and its components before `app.jsx` references them — same global-script pattern the existing files already rely on.)

---

## 4. Data model & endpoints

Analytics (`Sheet1`) stays **untouched and private**. RSVPs go in a **separate tab** so the two never mix.

### `RSVPs` tab (new)
Columns: `event_id · device_id · name · photo · state · t`
- **Upserted by `(event_id, device_id)`** — re-tapping never double-counts; toggling off sets `state='out'`.
- `device_id` reuses the existing anonymous `sid` from `track.js`.
- `photo` = a Google profile picture URL, or blank.

### Apps Script routes (added to the existing web app)
- **`POST`** `{ kind:'rsvp', event, sid, name, photo, state:'in'|'out' }`
  → upsert one row in `RSVPs` (find by `event_id`+`device_id`, update or append). Keep the existing analytics `doPost` behavior for all other payloads.
- **`GET`** `?mode=rsvps`
  → returns **only** `{ "<event_id>": [{ name, photo }], … }` for rows where `state='in'`.
  → **Never** returns `device_id`, and **never** touches `Sheet1`. This is the only endpoint the public site calls for rosters.
- Existing **`GET`** (all rows, for the private dashboard) is unchanged.

### Client data flow
- On load, `rsvp.jsx` fetches `?mode=rsvps` **once**, caches the roster map in memory, and exposes `RSVP.rosterFor(eventId)` → `[{name, photo}]` and `RSVP.count(eventId)` → number.
- Tapping "I'm in" optimistically updates the in-memory roster + local state, then POSTs the upsert. A lightweight subscribe/emit lets the `RSVPFaces`/`RSVPCount` components re-render.

---

## 5. Identity & sign-in flow (hybrid)

`rsvp.jsx` owns a `me` record in `localStorage` (key e.g. `gc_irl_me` = `{ sid, name, photo }`), reusing `track.js`'s `sid`.

1. **First "I'm in" tap** → small bottom sheet: *"What's your name?"* → store `name`. Never asked again. RSVP upserts immediately (optimistic). If they cancel without a name, the RSVP is not recorded.
2. **Optional "Add your photo — sign in with Google"** → GIS button → ID token (JWT) → decode payload (base64url) → read `name` (prefill/confirm) + `picture` → store `photo`. Re-upserts the current RSVP with the photo.
3. **Avatar** renders the **photo if present, else colored initials** (first letter of `name`, deterministic color).
4. **"You're in ✓"** (tap again) → `state='out'`, removes you from the roster. This is also the opt-out.

**Trust model (explicit, accepted):** the Google ID token is **not** cryptographically verified in the initial implementation — we only read `name`/`picture` to decorate an avatar. The worst case (a spoofed name/photo) is identical to the risk of someone typing a fake name. Server-side verification is not required for launch (YAGNI) but can be added later for higher assurance.

---

## 6. `app.jsx` hook points (the 3 marked edits)

All three live in the `EventDetail` component's "whoin" block (currently around `app.jsx:294-299`). Each is wrapped in a `/* RSVP HOOK */` comment so it's greppable and re-appliable after a design re-export.

1. **Count text** — replace `{6 + (ev.id.length % 5)} friends are in` with `<RSVPCount eventId={ev.id} />`.
2. **Avatars** — replace `<Faces />` (in the whoin block) with `<RSVPFaces eventId={ev.id} />`.
3. **"I'm in" handler** — the existing `rsvp` handler **also** calls `RSVP.toggle(ev.id)` (which handles the name prompt, optimistic roster update, and Sheet upsert). The button's on/off visual continues to read from app's existing local `rsvps` state for instant feedback; `RSVP.toggle` owns identity + persistence and the roster reconciles on the next `?mode=rsvps` fetch. (Keeping the button visual on local state holds the footprint to exactly 3 edits — see the known cancel-name edge in §8.)

> **Re-apply checklist (after any `app.jsx` re-export from claude.ai/design):**
> `grep -n "friends are in" app.jsx` to find the whoin block, then re-apply the 3 edits above. The spec's "before/after" snippets are the source of truth. `RSVPFaces`/`RSVPCount` and the generic home-page `<Faces />` are intentionally left alone — only the event-detail whoin block changes.

The generic `<Faces />` on the Home carousel cards stays as-is (decorative); only the event-detail page shows real rosters.

---

## 7. Perf fix (#2)

In `index.html`:
- `react.development.js` → `react.production.min.js`
- `react-dom.development.js` → `react-dom.production.min.js`
- **Regenerate the `integrity=` SRI hashes** for the two new URLs (the current hashes are pinned to the dev files; stale hashes make the browser refuse to load the script). Compute with `curl -s <url> | openssl dgst -sha384 -binary | openssl base64 -A`.

Babel-in-browser is intentionally retained (keeps the design workflow simple). Net effect: smaller payload, no dev-mode console warnings.

---

## 8. Error handling (the site must never look broken)

- **RSVP write fails** (offline / endpoint down) → keep optimistic local state; the user still sees themselves "in." No retry loop (mirrors `track.js`).
- **Roster fetch fails** → fall back to showing only the user's own local RSVP. Never render a broken "0 friends are in"; if the roster is empty, **hide the count line** entirely.
- **Google sign-in declined / GIS unavailable** → silently fall back to typed-name (the whole point of hybrid). No error surfaced.
- **Malformed/blank name** → don't record; reopen the name sheet.
- **Cancel-name edge** → because the button visual reads app's local `rsvps` state (§6 hook 3), cancelling the name prompt can briefly show the button "on" while the roster has no entry. Self-corrects on the next roster fetch / reload. Accepted as a minor, transient cosmetic-only mismatch.

---

## 9. Testing

- **Transpile gate:** `rsvp.jsx` and `app.jsx` must transpile under the exact browser Babel build (`@babel/standalone@7.29.0`) — the same node check already used in the QA audit becomes a standing pre-commit check.
- **Unit-testable pure functions** (extract into `rsvp.jsx`, plain JS, runnable in Node):
  - `decodeIdToken(jwt)` → `{ name, picture }` (base64url payload decode).
  - `dedupeRoster(rows)` → latest `state` per `device_id`.
  - `initials(name)` + `colorFor(name)` (deterministic).
- **Apps Script endpoints:** manual `curl` verification (Apps Script can't be unit-tested locally) — POST an `in` then `out`, GET `?mode=rsvps`, confirm the row upserts and that the response contains no `device_id` and no `Sheet1` data. Steps documented in `BACKEND-SETUP.md`.
- **Manual smoke:** serve locally, tap "I'm in," confirm name sheet → optimistic avatar → count increments; confirm tap-again removes.

- **Playwright E2E:** Add a small suite of Playwright tests to validate the full RSVP flow (load, tap "I'm in", name prompt, optimistic UI, POST payload, and final roster/count). Tests should mock the Apps Script endpoints for deterministic runs and also include one end-to-end run against a deployed test site.

  - Install (dev):

    ```bash
    npm install -D @playwright/test
    npx playwright install
    ```

  - Run locally:

    ```bash
    npx playwright test
    ```

  - Minimal example test (`tests/rsvp.spec.js`):

    ```javascript
    import { test, expect } from '@playwright/test';

    test('RSVP flow increments count', async ({ page }) => {
      // Mock roster GET -> empty initially
      await page.route('**/exec?mode=rsvps', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
      );
      // Mock POST upsert to succeed
      await page.route('**/exec', route =>
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true }) })
      );

      await page.goto('http://localhost:3000'); // change to your dev URL
      await page.click('text=I\\'m in'); // adapt selector if needed
      await page.fill('input[name="name"]', 'Sam'); // adapt selector to your prompt
      await page.click('text=Confirm'); // adapt label
      await expect(page.locator('.rsvp-count')).toContainText('1 friends are in');
    });
    ```

  - CI: add a job to run `npm ci`, `npx playwright install --with-deps`, then `npx playwright test` (run headless). Use route mocking for unit CI; optionally run a job against a staging deployment for a true end-to-end smoke.

  - Notes: assert POST payloads via Playwright `route.continue()`/`route.request()` when you want to verify what the client sent; use `page.route()` to simulate backend errors and exercise error-handling paths.

---

## 10. Setup tasks owned by Jessica (like the calendar key)

1. **Google OAuth Client ID (Web)** — Google Cloud console → Credentials → OAuth client ID → Web application; add `https://jesstar-bright.github.io` as an authorized JavaScript origin. The Client ID is public and lives in the page (like the calendar key).
   - ⚠️ **Consent-screen caveat:** configure the OAuth consent screen (External). Basic profile sign-in (`openid email profile`) usually avoids the scary "unverified app" screen, but if it appears, either add friends as **test users** (testing mode) or publish the app. Exact steps to be documented in `BACKEND-SETUP.md`.
2. **Apps Script redeploy** — add the `RSVPs` tab + the two routes, then **Deploy → New deployment** to get a fresh `/exec` version (the existing one keeps working until swapped).

---

## 11. Privacy considerations

- `?mode=rsvps` publishes **first names** (and opted-in photos) of the friend group on a public URL. This is the *intended* "see who's in" behavior, kept minimal via **first-name-only** + the **tap-to-leave opt-out**.
- RSVP identity data (names/photos in the `RSVPs` tab + the public roster endpoint) is added to the scope of the **pending security/compliance review** of the broader architecture.
- No emails are stored or displayed; the Google flow reads `name`/`picture` only.

---

## 12. Security & abuse mitigations

Minimal, practical protections to add before wide public use. These are intentionally lightweight so they fit the current Apps Script + Sheets infra.

> **Launch scope (this iteration):** Build only the cheap, high-value items — **server-side validation & sanitization**, **field length limits**, **`https://`-only photo URLs**, and **client-side React escaping**. The heavier items (**rate limiting**, **CSP**, **admin/moderation view**, **CAPTCHA**, **server-side ID-token verification**) are **documented here but deferred** — add them when abuse appears or before a wider public launch. They are not part of the initial implementation plan.

- **Server-side validation & sanitization (Apps Script):**
  - Reject POSTs missing required fields: `event`, `sid`, `name`.
  - Trim and normalize `name`; reject if empty after trim.
  - Enforce field length limits: `name` ≤ 50 chars, `photo` URL ≤ 200 chars, `event_id` ≤ 100 chars, `device_id`/`sid` ≤ 128 chars.
  - Disallow control characters and HTML angle-brackets in `name` (strip or reject `<`, `>`, null bytes).
  - Accept `photo` only if it starts with `https://` and reject `javascript:`, `data:`, `file:` schemes.

- **Rate limiting & simple abuse heuristics:**
  - Per-`sid` write throttling (example: max 10 writes per hour) enforced in Apps Script.
  - Reject or flag sudden bursts of new unique names from a single `sid` or IP.

- **Google ID token handling:**
  - Prefer server-side verification of GIS ID tokens when persisting `picture` claims (call Google's tokeninfo or verify JWT signatures) for stronger assurance. This is optional for the initial launch; if verification is not performed, treat photos as unverified and display a small "unverified" affordance or avoid trusting them for actions.

- **Output minimization & privacy:**
  - Public `?mode=rsvps` should only include `name` and `photo` (no `sid`, no timestamps, no raw tokens).
  - Keep names first-name-only in the UI; if users supply longer names, store them but slice/format the public output.

- **Client-side safety:**
  - Render all user-supplied text via React (automatic escaping); never use `dangerouslySetInnerHTML` with raw input.
  - Validate inputs on the client (length, simple charset) before POSTing.

- **Hosting & transport:**
  - Keep the Apps Script `Execute as` set to the script owner; choose `Who has access` deliberately (if the public page must fetch without auth, use “Anyone, even anonymous”, understanding the trade-off).
  - Use SRI for third-party scripts and add a Content Security Policy on the static site to limit allowed `script-src`/`connect-src`.

- **Logging, moderation & recovery:**
  - Add an admin-only view to remove abusive RSVP rows (or mark them `state='banned'`).
  - Log suspicious writes in a separate admin sheet or append an `audit` column.

- **Optional stronger mitigations (if abuse occurs):**
  - Add CAPTCHA (reCAPTCHA) for POSTs.
  - Require server-side ID token verification for photos.
  - Use short-lived event tokens or organizer-only write keys for private events.

Add these checks to `BACKEND-SETUP.md` as a mandatory step before production deployment; include example `curl` tests that assert rejection of malformed inputs.

## 13. Data collection & retention (Appendix)

> **Status: DEFERRED — not built in the initial launch.** This appendix describes a future analytics/retention pipeline (hashed `sid_hash` + `PEPPER`, an `Analytics` tab, `DailyAggregates`, a daily cron). The initial implementation keeps the **raw `sid`** data model used by the existing `track.js` / `Sheet1` and the new `RSVPs` tab (§4) — it does **not** introduce `sid_hash` or the analytics pipeline. Treat this section as a design reference for a later iteration, kept here so the privacy thinking isn't lost.

Principles
- Minimize PII: default to anonymous `sid` and aggregates; collect names/photos only when explicitly needed for the roster and with consent.
- Purposeful collection: each field must map to a product question (analytics, reliability, or moderation).
- Short retention for raw rows; store long-term aggregates only.

Recommended analytics signals (low risk)
- Event actions (append-only rows): `t · sid · event_id · action · page · label` where `action` ∈ {`view`,`rsvp_prompt`,`rsvp_in`,`rsvp_out`,`share`}.
- Session summary (daily): `date · sid_hash · session_start · session_seconds · pages · clicks · device_category · locale` (keep `sid_hash` not raw `sid`).
- Performance & errors: `t · sid_hash · page · metric_name · value` and `t · sid_hash · error_hash · message_snippet` (error_snippets should be hashed/truncated to avoid PII).

Fields to avoid or protect
- Emails, full OAuth tokens, raw IP addresses, precise geolocation, or persistent device fingerprints.
- Names/photos: keep in `RSVPs` only and publish only first-name or initials on public APIs.

Retention & aggregation policy (suggested)
- Raw analytics rows: keep 30 days, then delete or truncate to reduce PII surface.
- Aggregates (daily/weekly summaries): keep 2 years for product analysis.
- Audit logs (admin removal actions): keep 90 days.

Analytics sheet schema (Sheets)
- `Analytics` tab (append-only): `t · sid_hash · event_id · action · page · label · locale · device · referrer`.
- `DailyAggregates` tab: `date · event_id · rsvp_in_count · rsvp_out_count · unique_sids` (computed by script or formulas).

Sample Apps Script: append validated analytics row + daily aggregate roll-up

```javascript
// Call this from client POSTs to record analytics (lightweight validation)
function appendAnalyticsRow(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('Analytics');
  if (!sheet) sheet = ss.insertSheet('Analytics');
  var now = (new Date()).toISOString();

  // Basic validation and trimming
  var sid = String(payload.sid || '').trim();
  var sidHash = sid ? Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, sid + (PropertiesService.getScriptProperties().getProperty('PEPPER')||'')) : '';
  var eventId = String(payload.event_id || payload.event || '').slice(0,100);
  var action = String(payload.action || '').slice(0,50);
  var page = String(payload.page || '').slice(0,100);
  var label = String(payload.label || '').slice(0,200);
  var locale = String(payload.locale || '').slice(0,20);
  var device = String(payload.device || '').slice(0,50);
  var referrer = String(payload.referrer || '').slice(0,200);

  if (!eventId || !action) return { ok: false, reason: 'missing event or action' };

  sheet.appendRow([ now, Utilities.base64Encode(sidHash), eventId, action, page, label, locale, device, referrer ]);
  return { ok: true };
}

// Simple daily aggregate job (run once a day via time-driven trigger)
function rollDailyAggregates() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var analytics = ss.getSheetByName('Analytics');
  if (!analytics) return;
  var data = analytics.getDataRange().getValues();
  var header = data.shift();
  var idx = {}; header.forEach(function(h,i){ idx[h]=i; });
  var groups = {};
  data.forEach(function(r){
    var t = r[0];
    var eventId = r[2]||'';
    var action = r[3]||'';
    var date = (new Date(t)).toISOString().slice(0,10);
    var key = date+'|'+eventId;
    groups[key] = groups[key] || { date: date, event: eventId, rsvp_in:0, rsvp_out:0, sids: new Set() };
    if (action === 'rsvp_in') groups[key].rsvp_in++;
    if (action === 'rsvp_out') groups[key].rsvp_out++;
    var sidHash = r[1] || '';
    if (sidHash) groups[key].sids.add(sidHash);
  });

  var agg = ss.getSheetByName('DailyAggregates') || ss.insertSheet('DailyAggregates');
  agg.clear();
  agg.appendRow(['date','event_id','rsvp_in_count','rsvp_out_count','unique_sids']);
  Object.keys(groups).forEach(function(k){
    var g = groups[k];
    agg.appendRow([g.date, g.event, g.rsvp_in, g.rsvp_out, g.sids.size]);
  });
}
```

Add this appendix to `BACKEND-SETUP.md` and wire a cron trigger for `rollDailyAggregates`. Keep `PEPPER` in Script Properties and rotate it if leaked.


## 14. Out of scope (YAGNI)

Explicitly **not** building in the initial implementation: maybe/no responses (just in/out), comments or chat on events, editing someone else's RSVP, server-side token verification (optional future enhancement — not planned for launch), realtime live updates (fetch-on-load + refresh-on-action suffices at friend scale), "who came" rosters on past Memories, and real counts on the Home carousel cards.

---

## 15. Workstream independence

#1 (RSVP) and #2 (perf swap) are independent and can be implemented/shipped separately. #2 is a small self-contained `index.html` change; #1 is the substantive feature. The implementation plan may sequence #2 first (trivial, low-risk) or run them in parallel.
