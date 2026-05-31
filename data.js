/* ============================================================
   data.js — real content for The Group Chat: IRL (Open Air build)
   Pulled from the original site. Exposes window.GC.
   ============================================================ */
(function () {
  // Public Google Calendar (from the original site).
  const CAL_ID = '3179309fd12b282465b51c255a015281f95693867608c11ded8531d961fd099d@group.calendar.google.com';

  // ── Live upcoming-event count ───────────────────────────────
  // Paste a Google Calendar API key here to make the displayed count
  // reflect the REAL shared calendar (incl. events Gaby/Jess add in
  // Google beyond the curated list below). Leave '' to use the
  // date-filtered count of the curated events — works offline today.
  // Make a key: console.cloud.google.com → APIs & Services → Credentials
  // → Create API key → restrict to "Google Calendar API".
  const CAL_API_KEY = 'AIzaSyC_POY0P4OFLQmr5oh1tLQVGxkfG-DC30E';
  const CAL = {
    id: CAL_ID,
    // "Add by URL" deep-link (opens Google Calendar add-calendar dialog)
    google: 'https://calendar.google.com/calendar/u/0?cid=MzE3OTMwOWZkMTJiMjgyNDY1YjUxYzI1NWEwMTUyODFmOTU2OTM4Njc2MDhjMTFkZWQ4NTMxZDk2MWZkMDk5ZEBncm91cC5jYWxlbmRhci5nb29nbGUuY29t',
    // webcal:// subscription — Apple Calendar / Outlook auto-subscribe + refresh
    webcal: 'webcal://calendar.google.com/calendar/ical/' + encodeURIComponent(CAL_ID) + '/public/basic.ics',
    // plain https ICS — copy/paste anywhere
    ics: 'https://calendar.google.com/calendar/ical/' + encodeURIComponent(CAL_ID) + '/public/basic.ics',
  };

  // Per-event "Add to calendar" (single event) — Google render link.
  function gcalLink(ev) {
    const s = ev.start.replace(/-/g, '');
    const e = (ev.end || ev.start).replace(/-/g, '');
    const endPlus = String(Number(e) + 1); // all-day end is exclusive
    const p = new URLSearchParams({
      action: 'TEMPLATE',
      text: ev.title,
      dates: s + '/' + endPlus,
      details: (ev.blurb || '') + '\n\nvia The Group Chat: IRL',
      location: ev.place || '',
    });
    return 'https://calendar.google.com/calendar/render?' + p.toString();
  }

  // ---- EVENTS (chronological) -------------------------------
  const EVENTS = [
    {
      id: 'pride', title: 'Utah Pride Festival', start: '2026-06-07',
      when: 'Sun · Jun 7 · 12 PM', place: 'Washington Square Park, SLC',
      tag: 'Up next', cap: 'photo · pride festival',
      effort: null, kind: 'Festival',
      blurb: 'The festival weekend energy we wait all year for.',
      expect: 'Washington Square Park goes full color for the weekend. We meet at the main gate at noon, wander the booths and stages together, and post up somewhere shady when it gets hot. Tickets are needed for entry — grab yours before you come.',
      bring: ['Ticket (buy ahead)', 'Sunscreen + water', 'Cash for vendors', 'Comfy shoes'],
      facts: [['Cost', 'Ticketed'], ['Vibe', 'Big crowd'], ['Heat', 'Bring water'], ['Meet', 'Main gate']],
      tickets: 'https://www.utahpridecenter.org/',
    },
    {
      id: 'stars', title: 'Star Party', start: '2026-06-10',
      when: 'Wed · Jun 10 · 9 PM', place: 'Willard Eccles Observatory, U of U',
      cap: 'photo · night sky + dome',
      effort: 'Easy', kind: 'Free · walk-up',
      blurb: 'Free telescope night up at the observatory.',
      expect: 'Free, walk-up telescope viewing at the university observatory. We carpool up around 8:30 so we beat the line for the dome. It runs cold once the sun is fully down, so layer up even though it is June.',
      bring: ['Warm layers', 'Closed-toe shoes', 'Red flashlight if you have one', 'Patience for the line'],
      facts: [['Cost', 'Free'], ['Effort', 'Easy'], ['Temp', 'Runs cold'], ['Meet', 'Carpool 8:30']],
    },
    {
      id: 'race', title: 'Desert Thunder Raceway', start: '2026-06-12',
      when: 'Fri · Jun 12 · 5:30 PM', place: 'Price, UT (dinner first)',
      cap: 'photo · dirt track lights',
      effort: 'Easy', kind: 'Road trip',
      blurb: 'Drive to Price, dinner first, then the raceway.',
      expect: 'A little road trip south. We grab dinner in Price first, then head to the raceway for the night races. It gets loud — ear protection is genuinely required, not a suggestion. Carpools leave SLC around 3:30.',
      bring: ['Ear protection (required)', 'A layer for after dark', 'Cash for snacks', 'Carpool gas money'],
      facts: [['Drive', '~2 hrs'], ['Ears', 'Protection!'], ['Food', 'Dinner first'], ['Leave', '3:30 PM']],
    },
    {
      id: 'brunch', title: 'Butterflies & Brunch', start: '2026-06-13',
      when: 'Sat · Jun 13 · 9:30 AM', place: 'Aubergine + Thanksgiving Point',
      cap: 'photo · brunch table',
      effort: 'Easy', kind: 'Brunch + indoor',
      blurb: 'Brunch in Lehi, then the Butterfly Biosphere.',
      expect: 'Brunch at Aubergine in Lehi to start, then over to the Butterfly Biosphere at Thanksgiving Point. We are also celebrating Ivanna — she booked her first role! Reservation is under the group; just show up by 9:30.',
      bring: ['Appetite', 'Camera for the butterflies', 'A few bucks for the biosphere', 'Birthday/celebration energy'],
      facts: [['Start', 'Brunch 9:30'], ['Then', 'Butterflies'], ['Cost', 'Brunch + entry'], ['Note', 'Ivanna!']],
    },
    {
      id: 'bees', title: 'Bees Game', start: '2026-06-16',
      when: 'Tue · Jun 16 · 6:30 PM', place: 'Daybreak Ballpark, South Jordan',
      cap: 'photo · ballpark evening',
      effort: 'Easy', kind: 'Ballgame',
      blurb: 'Salt Lake Bees at the new Daybreak Ballpark.',
      expect: 'Evening baseball at the new Daybreak Ballpark. Seats are together in the group block. Those evening games get breezy once the sun drops behind the outfield, so bring a sweatshirt even if it is warm at first pitch.',
      bring: ['Sweatshirt', 'Cash for the concourse', 'Your ticket from the group block', 'A glove if you are hopeful'],
      facts: [['First pitch', '6:35'], ['Seats', 'Group block'], ['Eve', 'Breezy'], ['Park', 'Daybreak']],
    },
    {
      id: 'craft', title: 'Craft Night & a Movie', start: '2026-06-28',
      when: 'Sun · Jun 28 · 6 PM', place: "Kate's place",
      cap: 'photo · craft table',
      effort: 'Easy', kind: 'Cozy night in',
      blurb: 'Keychains and charms, then a movie at Kate\u2019s.',
      expect: 'A low-key night in at Kate\u2019s. We make keychains and charms, then put on a movie. The BYO-snack rotation continues, so bring something to share. Movie and craft are TBD — vote in the chat.',
      bring: ['A snack to share', 'Any charm beads you have', 'Cozy socks', 'Movie suggestions'],
      facts: [['Where', "Kate's"], ['Make', 'Charms'], ['Then', 'Movie'], ['Bring', 'A snack']],
    },
    {
      id: 'concert', title: 'Hilary Duff', start: '2026-07-17',
      when: 'Fri · Jul 17 · 6:30 PM', place: 'UFCU Amphitheatre, West Valley',
      cap: 'photo · amphitheatre stage',
      effort: 'Easy', kind: 'Concert',
      blurb: 'The reunion-tour energy we deserve.',
      expect: 'Hilary Duff at the UFCU Amphitheatre — the reunion-tour energy we absolutely deserve. We carpool from SLC and meet at the rideshare lot. Doors at 6:30; come early if you want a good lawn spot.',
      bring: ['Ticket', 'Lawn blanket', 'Throwback playlist energy', 'Carpool plan'],
      facts: [['Doors', '6:30'], ['Carpool', 'From SLC'], ['Seats', 'Lawn'], ['Cost', 'Ticketed']],
    },
    {
      id: 'rodeo', title: "Days of '47 Rodeo", start: '2026-07-24',
      when: 'Fri · Jul 24 · 8 PM', place: "Days of '47 Arena, SLC",
      cap: 'photo · rodeo arena',
      effort: 'Easy', kind: 'Rodeo',
      blurb: 'Utah\u2019s flagship rodeo, with a sunset finale.',
      expect: 'Utah\u2019s flagship rodeo on the state holiday. Seats are together. Cowboy hat is optional, but the sunset finale over the arena is not to be missed. Get there a little early — Pioneer Day traffic is real.',
      bring: ['Ticket', 'Hat (optional but fun)', 'Cash for fair food', 'A little early arrival'],
      facts: [['Start', '8 PM'], ['Holiday', "Pioneer Day"], ['Traffic', 'Leave early'], ['Finale', 'Sunset']],
    },
    {
      id: 'coast', title: 'Oregon Coast Roadtrip', start: '2026-08-05', end: '2026-08-09',
      when: 'Wed → Sat · Aug 5–9', place: 'Cannon Beach + PNW',
      cap: 'photo · foggy coastline',
      effort: 'Trip', kind: 'Road trip · 4 days',
      blurb: 'A PNW reset — tidepools and foggy mornings.',
      expect: 'A four-day PNW reset. Cannon Beach as home base, tidepools, foggy mornings, and fleeces in August. Full trip details — lodging, drive splits, packing — drop closer to the date. Lock your seat in the carpool early.',
      bring: ['Fleece + rain layer', 'Closed shoes for tidepools', 'Road-trip snacks', 'Your share of lodging'],
      facts: [['Days', '4'], ['Base', 'Cannon Beach'], ['Weather', 'Cool + foggy'], ['Details', 'Coming']],
    },
    {
      id: 'zion', title: 'Labor Day in Zion', start: '2026-09-04', end: '2026-09-07',
      when: 'Fri → Mon · Sep 4–7', place: 'St. George + Zion',
      cap: 'photo · zion canyon walls',
      effort: 'Trip', kind: 'Long weekend',
      blurb: 'St. George + Zion, private-pool Airbnb.',
      expect: 'A long-weekend escape to St. George and Zion: four days, a private-pool Airbnb, and a handful of activity options to vote on (canyon overlook, e-bike the scenic drive, mini golf, Quail Creek). Originally a June plan, moved to Labor Day for the long weekend.',
      bring: ['Hiking shoes', 'Swimsuit (pool!)', 'Sun everything', 'Your share of the Airbnb'],
      facts: [['Days', '4'], ['Stay', 'Pool Airbnb'], ['Heat', 'Hot — early starts'], ['Activities', 'Vote soon']],
    },
    {
      id: 'vietnam', title: 'Vietnam', start: '2026-09-25', end: '2026-10-08',
      when: 'Sep 25 → Oct 8', place: 'Hanoi · Hoi An · HCMC',
      cap: 'photo · lanterns, hoi an',
      effort: 'Big trip', kind: 'Two weeks abroad',
      blurb: 'The "we\u2019ve been saying this for years" trip.',
      expect: 'Two weeks across Vietnam — likely Hanoi, Hoi An, and Ho Chi Minh City with a beach stretch in between. The trip we\u2019ve been saying we\u2019d do for years. Itinerary, flights, and budget are TBD; this is the early heads-up to start saving and check your passport.',
      bring: ['Valid passport (6+ mo)', 'Flight savings started', 'Light, breathable clothes', 'A sense of adventure'],
      facts: [['Length', '2 weeks'], ['Cities', '3+'], ['Status', 'Planning'], ['Now', 'Save + passport']],
    },
  ];

  // ---- MEMORIES (with real Drive photos from the original site) ----
  const drivePhoto = (id, size = 1600) => 'https://lh3.googleusercontent.com/d/' + id + '=w' + size;
  const driveThumb = (id, size = 800) => 'https://drive.google.com/thumbnail?id=' + id + '&sz=w' + size;

  const MEMORIES = [
    {
      id: 'hike-may-9-2026', title: 'Morning Hike', subtitle: 'Donut Falls Trail',
      dateLabel: 'May 9, 2026', catchphrase: 'Trail mix friends',
      driveFolder: 'https://drive.google.com/drive/folders/1aNOZC_xfnWHZUuzYVDQKvcKDmgxBfn5O',
      cover: '1ppVl_JA9gfRw4_1nYSjuD0WhZyGwpGhI',
      media: [
        { id: '1ppVl_JA9gfRw4_1nYSjuD0WhZyGwpGhI', type: 'photo' },
        { id: '1UWiQ64Pzt3scOQmpqWEX0nbfApTM-bVU', type: 'photo' },
        { id: '1AiLwnrXzcdhzV5Jff76hbkJUxTPeCyoC', type: 'photo' },
        { id: '1F8cYe7i4yrejMrG6dSt7LS_BHJbwPxW2', type: 'photo' },
        { id: '1gBQTGIyqS22qoY_FbXwAwgxSFk181ZPH', type: 'photo' },
        { id: '1YgdsTxRmZn-gnqMrrr2T1aJxcyABWXDk', type: 'photo' },
        { id: '1tTvw0dLZRwldKCT46C9-ZUbM6tvxoUTE', type: 'photo' },
      ],
    },
    {
      id: 'hockey-april-11-2026', title: 'Grizzlies Hockey Night', subtitle: 'Maverik Center · West Valley',
      dateLabel: 'April 11, 2026', catchphrase: 'Penalty box energy',
      driveFolder: 'https://drive.google.com/drive/folders/1URHfChv1OokfAbSPrdKrr1npxiD60K3e',
      cover: '1dS4PeO0ULrbMVGeD35i17KTqTqYX9Q_P',
      media: [
        { id: '1dS4PeO0ULrbMVGeD35i17KTqTqYX9Q_P', type: 'photo' },
        { id: '19S46z3YKS-IgzHbLIs4bXTt3KVjvD5s_', type: 'photo' },
        { id: '1ZQcCiYLtswkpfkGqclZp27vB-QFwRjEm', type: 'photo' },
        { id: '17JHUfZAbpud2WZ5x7UwqAd9sP6AyLzhb', type: 'video' },
      ],
    },
  ];

  // Curated events whose date is still in the future (past ones drop off).
  function upcomingEvents() {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return EVENTS
      .filter((ev) => new Date((ev.end || ev.start) + 'T23:59:59') >= today)
      .sort((a, b) => a.start.localeCompare(b.start));
  }

  // ── Live Google Calendar → event cards ──────────────────────
  const _MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const _DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const _p2 = (n) => String(n).padStart(2, '0');
  const _fmtDate = (d) => d.getFullYear() + '-' + _p2(d.getMonth() + 1) + '-' + _p2(d.getDate());
  const _fmtTime = (d) => { let h = d.getHours(), m = d.getMinutes(); const ap = h < 12 ? 'AM' : 'PM'; h = h % 12 || 12; return h + (m ? ':' + _p2(m) : '') + ' ' + ap; };

  // pick an activity glyph from words in the title/location
  function guessGlyphKey(text) {
    const s = (text || '').toLowerCase();
    const has = (...w) => w.some((x) => s.includes(x));
    if (has('hike','trail','peak','mountain','climb','canyon','summit','ski','snow')) return 'mtn';
    if (has('coffee','brunch','dinner','lunch','breakfast','eat','food','cafe','drinks','bar')) return 'cup';
    if (has('concert','music','show','duff','tour','dj','band')) return 'music';
    if (has('game','baseball','bees','basketball','hockey','soccer','match','race','raceway')) return 'ball';
    if (has('springs','soak','pool','lake','river','paddle','sup','kayak','beach','coast','swim','water')) return 'waves';
    if (has('flight','vietnam','abroad','passport','international','airport','japan','europe','trip')) return 'plane';
    if (has('star','sunset','night','observatory','astronomy')) return 'star';
    if (has('pride','festival','party','celebrate','birthday','market','fair')) return 'sparkle';
    if (has('rodeo','ranch','western')) return 'flag';
    return 'star';
  }

  // turn a calendar event description into blurb / what-to-expect / bring list.
  // Conventions Gaby & Jess can use in the event description:
  //   • first line = the one-liner shown on the card
  //   • a line starting "Bring:" becomes the packing checklist (comma-separated)
  function parseDesc(desc) {
    if (!desc) return { blurb: '', expect: '', bring: [] };
    const text = desc.replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n')
      .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim();
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
    let bring = []; const kept = [];
    lines.forEach((l) => {
      const m = l.match(/^bring\s*:\s*(.+)$/i);
      if (m) bring = m[1].split(/[,;]/).map((s) => s.trim()).filter(Boolean);
      else kept.push(l);
    });
    return { blurb: kept[0] || '', expect: kept.join(' '), bring };
  }

  function _parseStart(it) {
    if (it.start && it.start.dateTime) return { d: new Date(it.start.dateTime), hasTime: true };
    const p = ((it.start && it.start.date) || '1970-01-01').split('-').map(Number);
    return { d: new Date(p[0], p[1] - 1, p[2]), hasTime: false };
  }
  function _parseEnd(it, start) {
    if (it.end && it.end.dateTime) return { d: new Date(it.end.dateTime), hasTime: true };
    if (it.end && it.end.date) { const p = it.end.date.split('-').map(Number); const d = new Date(p[0], p[1] - 1, p[2]); d.setDate(d.getDate() - 1); return { d, hasTime: false }; }
    return { d: start.d, hasTime: start.hasTime };
  }
  function _formatWhen(s, e) {
    const sDow = _DOW[s.d.getDay()], sMo = _MO[s.d.getMonth()], sDate = s.d.getDate();
    if (s.hasTime) return sDow + ' · ' + sMo + ' ' + sDate + ' · ' + _fmtTime(s.d);
    if (_fmtDate(s.d) === _fmtDate(e.d)) return sDow + ' · ' + sMo + ' ' + sDate;
    const eMo = _MO[e.d.getMonth()], eDate = e.d.getDate(), eDow = _DOW[e.d.getDay()];
    if (sMo === eMo) return sDow + ' → ' + eDow + ' · ' + sMo + ' ' + sDate + '–' + eDate;
    return sMo + ' ' + sDate + ' → ' + eMo + ' ' + eDate;
  }

  function mapGEvent(it) {
    const s = _parseStart(it), e = _parseEnd(it, s);
    const d = parseDesc(it.description);
    const multi = _fmtDate(s.d) !== _fmtDate(e.d);
    return {
      id: it.id,
      title: it.summary || 'Untitled plan',
      start: _fmtDate(s.d),
      end: _fmtDate(e.d),
      place: it.location || '',
      when: _formatWhen(s, e),
      kind: multi ? 'Multi-day' : 'On the calendar',
      cap: 'photo · ' + (it.summary || 'plan').toLowerCase(),
      blurb: d.blurb || (it.summary || ''),
      expect: d.expect || 'Details land here as Gaby & Jess fill in the calendar event. Tap “Add to calendar” so you don’t miss it.',
      bring: d.bring,
      facts: [],
      glyph: guessGlyphKey((it.summary || '') + ' ' + (it.location || '')),
      htmlLink: it.htmlLink || '',
      live: true,
    };
  }

  // Fetch upcoming events from the public shared calendar and map them to cards.
  // Returns an array when CAL_API_KEY is set + fetch succeeds, else null
  // (caller falls back to the curated EVENTS so the site always works).
  async function fetchEvents() {
    if (!CAL_API_KEY) return null;
    try {
      const url = 'https://www.googleapis.com/calendar/v3/calendars/'
        + encodeURIComponent(CAL_ID) + '/events?key=' + CAL_API_KEY
        + '&timeMin=' + new Date().toISOString()
        + '&singleEvents=true&orderBy=startTime&maxResults=250';
      const r = await fetch(url);
      if (!r.ok) return null;
      const j = await r.json();
      if (!Array.isArray(j.items)) return null;
      return j.items.filter((it) => it.status !== 'cancelled' && (it.start && (it.start.date || it.start.dateTime))).map(mapGEvent);
    } catch (e) { return null; }
  }

  window.GC = { CAL, EVENTS, MEMORIES, gcalLink, drivePhoto, driveThumb, upcomingEvents, fetchEvents, hasLiveKey: !!CAL_API_KEY };
})();
