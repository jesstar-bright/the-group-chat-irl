# Going crew-wide — shared backend setup

Right now the site tracks taps & shares in each phone's own browser (`localStorage`)
and the **Crew Insights** dashboard (`dashboard.html`) reads that back. That's a real,
working **per-device demo** — great for testing, but each phone only sees its own activity.

To make the dashboard show **everyone's** activity combined, point the tracker at a tiny
shared backend. The easiest zero-cost option (you're already in Google) is a **Google Sheet
+ Apps Script web app**. ~10 minutes, no servers, no bill.

---

## 1. Make the Sheet
1. Create a new Google Sheet — name it `Group Chat IRL — hits`.
2. Row 1 headers (exactly): `t  sid  type  kind  id  label`

## 2. Add the Apps Script
In the Sheet: **Extensions → Apps Script**, delete the placeholder, paste this, **Save**:

```javascript
const SHEET = 'Sheet1'; // tab name

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const r = JSON.parse(e.postData.contents);
    const sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
    sh.appendRow([r.t || Date.now(), r.sid || '', r.type || '', r.kind || '', r.id || '', r.label || '']);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('err: ' + err);
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const sh = SpreadsheetApp.getActive().getSheetByName(SHEET);
  const vals = sh.getDataRange().getValues();
  vals.shift(); // drop header row
  const rows = vals
    .filter(function (v) { return v[0]; })
    .map(function (v) { return { t: Number(v[0]), sid: v[1], type: v[2], kind: v[3], id: v[4], label: v[5] }; });
  return ContentService
    .createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 3. Deploy it
1. **Deploy → New deployment → Web app**.
2. *Execute as:* **Me**. *Who has access:* **Anyone**.
3. **Deploy**, authorize, and copy the **Web app URL** (ends in `/exec`).

## 4. Flip the switch
Open `app/track.js`, top of the file:

```javascript
const ENDPOINT = ''; // ← paste your /exec URL here
```

Paste your URL between the quotes. That's it.

- The **site** now POSTs every tap/share to the Sheet (invisible to friends, as before).
- The **dashboard** now GETs the combined rows — the "Local demo" badge flips to **Live · crew-wide**, and the seeded demo data is ignored.

---

## Notes & options
- **Privacy:** only an anonymous random `sid` per device is stored — no names, no logins.
  Counts are aggregate. You can clear the Sheet anytime to reset.
- **CORS:** Apps Script web apps allow the cross-origin `GET`/beacon `POST` this uses. If a
  browser ever blocks the dashboard `GET`, publish `dashboard.html` on the same host as the
  site (both static files) and it's a non-issue.
- **Other backends:** anything that accepts a JSON `POST` and returns a JSON array on `GET`
  works the same way — Firebase, Supabase, a Cloudflare Worker + KV, etc. Only `ENDPOINT`
  changes.
- **What to do with the data later:** the dashboard already ranks events by love-score
  (taps + RSVPs×2 + shares×3). Use it to decide what to repeat, what to drop, and when to
  add more of a popular kind of hang. We can grow this into trends-over-time, per-friend
  streaks, or "plan the next one" suggestions whenever you want.
```
