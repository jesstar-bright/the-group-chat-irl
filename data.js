/* ============================================================
   data.js — real content for The Group Chat: IRL (Open Air build)
   Pulled from the original site. Exposes window.GC.
   ============================================================ */
(function () {
  // Public Google Calendar (from the original site).
  const CAL_ID = '3179309fd12b282465b51c255a015281f95693867608c11ded8531d961fd099d@group.calendar.google.com';
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

  window.GC = { CAL, EVENTS, MEMORIES, gcalLink, drivePhoto, driveThumb };
})();
