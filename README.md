# The Group Chat: IRL ✨

A single-file landing page for Jess & Gaby's social calendar. Friends subscribe to the live Google Calendar from the site; past events become photo galleries with downloadable iMessage stickers + (eventually) Spotify embeds.

## Files

- **`index.html`** — the entire site. Self-contained: inline CSS, inline JS, no build step, no external dependencies beyond CDN-hosted fonts (Google Fonts) and Drive-hosted photos.

## How to use this with Claude.ai's design tool

1. Go to `claude.ai/design`
2. Drag `index.html` into the design tool (or "Import HTML")
3. Iterate visually — tweak typography, colors, layout. The tool will preserve the single-file structure.
4. When ready: "Publish" gives you a hosted URL.

## How to host it yourself (alternative to Claude design tool)

This is a static HTML file, so any host works:

- **Vercel:** drop the file into a new project, deploy
- **Netlify:** drag-and-drop the folder onto netlify.com/drop
- **Cloudflare Pages:** connect a repo, build command: `none`, output: `./`
- **GitHub Pages:** push to a repo, enable Pages
- **Local test:** `cd ~/Projects/the-group-chat-irl && python3 -m http.server` → open `http://localhost:8000`

Serving over `http://` (not `file://`) is required for the Story-canvas download flow to work cleanly. Photos and the rest of the site work fine either way.

## What's inside the file

- **Topbar + footer** — brand, nav (Agenda · Memories · Zion · Group chat), Subscribe CTA pointing to the public Google Calendar
- **The Agenda hub** (`#/summer`) — hero, calendar subscribe section, 11 event cards in chronological order
- **Per-event detail views** — `#/pride`, `#/stars`, `#/race`, `#/brunch`, `#/bees`, `#/craft`, `#/concert`, `#/rodeo`, `#/coast`, `#/zion` (with sub-pages), `#/vietnam`
- **Zion trip sub-site** — `#/cards`, `#/itinerary`, `#/day-1` … `#/day-4`, `#/votes`, `#/logistics`, `#/budget`, `#/packing` (note: still references June dates, needs regeneration for the Labor Day move)
- **Memories** (`#/memories`) — list of past events with photo galleries
- **Per-memory views** (`#/memory-hike-may-9-2026`, `#/memory-hockey-april-11-2026`) — gallery, lightbox, Spotify embed slot, procedural Canvas sticker

## Live data sources

- **Calendar:** `3179309fd12b282465b51c255a015281f95693867608c11ded8531d961fd099d@group.calendar.google.com` (public subscribe URL embedded in topbar/subscribe section)
- **Hike photos:** `https://drive.google.com/drive/folders/1aNOZC_xfnWHZUuzYVDQKvcKDmgxBfn5O`
- **Hockey photos:** `https://drive.google.com/drive/folders/1URHfChv1OokfAbSPrdKrr1npxiD60K3e`

## Adding a new memory (future)

1. Create a Drive folder, name it `[activity-month-day-year]`, share "anyone with the link → viewer"
2. Drop photos + videos in
3. Open `index.html`, find the `MEMORIES` constant in the bottom script block
4. Add an entry — title, subtitle, date, dateLabel, catchphrase, driveFolder URL, coverId, media array with file IDs and types
5. Add a route entry to `ROUTES` and a parent entry under the back-nav `parent` map (search for `'memories': 'summer'`)

## Open to-dos

- Spotify track picks per memory (the `spotifyTrackId` field is `null` for both memories right now; needs Spotify search via connected MCP)
- Zion sub-site (day-by-day, itinerary) still references June 18–21 dates; need regeneration for Labor Day Sep 4–7
- FTC disclosure stripped — re-add if/when affiliate links go live
- Event cards for "Locked-in · 11 events" eyebrow count is hardcoded; could compute dynamically from card count
