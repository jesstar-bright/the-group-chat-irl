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

**Trust model (explicit, accepted):** the Google ID token is **not** cryptographically verified — we only read `name`/`picture` to decorate an avatar. The worst case (a spoofed name/photo) is identical to the risk of someone typing a fake name. Server-side verification is unnecessary complexity for this use (YAGNI).

---

## 6. `app.jsx` hook points (the 3 marked edits)

All three live in the `EventDetail` component's "whoin" block (currently around `app.jsx:294-299`). Each is wrapped in a `/* RSVP HOOK */` comment so it's greppable and re-appliable after a design re-export.

1. **Count text** — replace `{6 + (ev.id.length % 5)} friends are in` with `<RSVPCount eventId={ev.id} />`.
2. **Avatars** — replace `<Faces />` (in the whoin block) with `<RSVPFaces eventId={ev.id} />`.
3. **"I'm in" handler** — the existing `rsvp` handler **also** calls `RSVP.toggle(ev.id)` (which handles the name prompt, optimistic roster update, and Sheet upsert). The button's on/off visual continues to read from app's existing local `rsvps` state for instant feedback; `RSVP.toggle` owns identity + persistence and the roster reconciles on the next `?mode=rsvps` fetch. (Keeping the button visual on local state holds the footprint to exactly 3 edits — see the known cancel-name edge in §8.)

> **Re-apply checklist (after any `app.jsx` re-export from claude.ai/design):**
> `grep -n "friends are in" app.jsx` to find the whoin block, then re-apply the 3 edits above. The spec's "before/after" snippets are the source of truth. `RSVPFaces`/`RSVPCount` and the generic home-page `<Faces />` are intentionally left alone — only the event-detail whoin block changes.

The generic `<Faces />` on the Home carousel cards stays as-is (decorative); only the event-detail page shows real rosters. (Future enhancement, out of scope: real counts on cards.)

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

## 12. Out of scope (YAGNI)

Explicitly **not** building: maybe/no responses (just in/out), comments or chat on events, editing someone else's RSVP, server-side token verification, realtime live updates (fetch-on-load + refresh-on-action suffices at friend scale), "who came" rosters on past Memories, and real counts on the Home carousel cards.

---

## 13. Workstream independence

#1 (RSVP) and #2 (perf swap) are independent and can be implemented/shipped separately. #2 is a small self-contained `index.html` change; #1 is the substantive feature. The implementation plan may sequence #2 first (trivial, low-risk) or run them in parallel.
