RSVP Hook: exact edits to apply to `app.jsx`

Place these three small edits in the `EventDetail` component's whoin block (search for the text "friends are in" to locate the block). Each edit is marked `/* RSVP HOOK */` so you can grep for it after a design re-export.

1) Replace the count text

Before:
  {6 + (ev.id.length % 5)} friends are in

After:
  /* RSVP HOOK */ <RSVPCount eventId={ev.id} />

2) Replace the avatars placeholder

Before:
  <Faces />

After:
  /* RSVP HOOK */ <RSVPFaces eventId={ev.id} />

3) Extend the "I'm in" handler to call the RSVP toggle

Find the existing handler where the button toggles local RSVP state (it likely calls `Track.hit('rsvp', ...)` or flips `rsvps[ev.id]`). Add a call to `RSVP.toggle(ev.id, me)` where `me` is the local identity object (the existing app keeps local rsvp state; `RSVP.toggle` owns identity persistence). Example:

Before (approx):
  onClick={() => { /* existing local toggle */ rsvps[ev.id] = !rsvps[ev.id]; Track.hit('rsvp', ...); }}

After (approx):
  /* RSVP HOOK */ onClick={() => {
    /* existing local toggle for instant visual feedback */
    rsvps[ev.id] = !rsvps[ev.id];
    Track.hit('rsvp', ...);
    /* delegate identity + persistence to the RSVP module we added */
    RSVP.toggle(ev.id, me);
  }}

Notes:
- `me` should be the local `{ sid, name, photo }` object already stored by your app; if you don't have one yet, create it from `localStorage.gc_irl_me` or let `RSVP.toggle` prompt for a name before upserting.
- The `RSVPCount` component is provided in `rsvp.jsx` as `window.RSVP.RSVPCount`; `RSVP.toggle` is `window.RSVP.toggle`.
- Keep these edits wrapped with the `/* RSVP HOOK */` comments so they are easy to re-apply after `app.jsx` gets re-exported by the design tool.

If you want, I can open your `app.jsx` and apply these exact replacements — paste it here or grant access to the file and I'll patch it automatically.
