/* app.jsx — The Group Chat: IRL · Open Air build (interactive prototype) */
const { useState, useEffect, useRef } = React;
const GC = window.GC;

/* ---------------- icons ---------------- */
const I = {
  cal:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4.5" width="18" height="17" rx="3"/><path d="M3 9h18M8 2.5v4M16 2.5v4"/></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  pin:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z"/><circle cx="12" cy="9" r="2.4"/></svg>,
  chk:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M4 12l5 5L20 6"/></svg>,
  share: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M12 3v13M7 8l5-5 5 5"/></svg>,
  back:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M15 6l-6 6 6 6"/></svg>,
  chev:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 6l6 6-6 6"/></svg>,
  play:  <svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 5v14l11-7z"/></svg>,
  close: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6L6 18"/></svg>,
  link:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 15l6-6M10 6l1-1a4 4 0 0 1 6 6l-1 1M14 18l-1 1a4 4 0 0 1-6-6l1-1"/></svg>,
  apple: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 13c0 3 2 4 2 4s-1.4 3-3.3 3c-1 0-1.4-.6-2.7-.6s-1.7.6-2.6.6C7.3 20 5 16.8 5 13.6 5 10.4 7 9 8.9 9c1 0 1.9.7 2.5.7S12.9 9 14.2 9c.8 0 2.3.3 3 1.7-2.1 1.1-1.2 2.3-1.2 2.3M13.4 7c.6-.7 1-1.6.9-2.5-.8 0-1.8.5-2.4 1.2-.5.6-1 1.5-.8 2.4.9.1 1.7-.4 2.3-1.1"/></svg>,
  google:<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="17" rx="3" fill="#fff" stroke="#dadce0"/><path d="M9.5 9.5h5M9.5 13h5M9.5 16h3" stroke="#4285F4" strokeWidth="1.6" strokeLinecap="round"/></svg>,
  spark: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 5.4L19 9l-5.4 1.6L12 16l-1.6-5.4L5 9l5.4-1.6z"/></svg>,
};

const FACES = [['A','#2f7cc0'],['M','#5b8f5b'],['K','#c08a2f'],['R','#9a5bb0'],['+','#9aa4b2']];
function Faces({ n = 4 }) {
  return <div className="faces">{FACES.slice(0, n).map(([l, c], i) => <div key={i} className="face" style={{ background: c }}>{l}</div>)}</div>;
}

/* Drive photo with graceful placeholder fallback */
function Photo({ id, size = 900, cap = 'photo', fill = true }) {
  const [ok, setOk] = useState(!!id);
  const st = fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } : {};
  if (!ok) return <div className="ph" style={fill ? { position: 'absolute', inset: 0 } : {}}><span className="cap">{cap}</span></div>;
  return <img src={GC.drivePhoto(id, size)} alt="" loading="lazy" style={st} onError={() => setOk(false)} />;
}
/* striped placeholder (events have no real photos yet) */
function Ph({ cap, style, className = '' }) {
  return <div className={'ph ' + className} style={style}><span className="cap">{cap}</span></div>;
}

/* ---- activity glyphs (line icons, one per event) ---- */
const GL = {
  sparkle: <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.6 6.4L20 10l-6.4 1.6L12 18l-1.6-6.4L4 10l6.4-1.6z"/></svg>,
  star:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z"/></svg>,
  music:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="18" r="2.2"/><circle cx="17" cy="16" r="2.2"/><path d="M9.2 18V6l10-2v10M9.2 8l10-2"/></svg>,
  mtn:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M3 19l6-11 4 6 2-3 6 8z"/><circle cx="17.5" cy="6.5" r="1.5"/></svg>,
  ball:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="9"/><path d="M5.2 8C8 9 10 12 10 21M18.8 8C16 9 14 12 14 21"/></svg>,
  sun:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="4.4"/><path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M5 5l1.7 1.7M17.3 17.3 19 19M19 5l-1.7 1.7M6.7 17.3 5 19"/></svg>,
  waves:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 8c2 0 2 1.6 4.5 1.6S10 8 12 8s2 1.6 4.5 1.6S19 8 21 8M3 13c2 0 2 1.6 4.5 1.6S10 13 12 13s2 1.6 4.5 1.6S19 13 21 13M3 18c2 0 2 1.6 4.5 1.6S10 18 12 18s2 1.6 4.5 1.6S19 18 21 18"/></svg>,
  flag:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 21V4M5 4h11l-2 3.5L16 11H5"/></svg>,
  plane:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 4 3 11l6 2 2 6 3-5 4 4z"/></svg>,
  cup:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9h11v4a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z"/><path d="M16 10h2.5a2.5 2.5 0 0 1 0 5H16M8 3v2M12 3v2"/></svg>,
};
const GLYPH = {
  pride: 'sparkle', stars: 'star', race: 'flag', brunch: 'cup', bees: 'ball', craft: 'sparkle',
  concert: 'music', rodeo: 'star', coast: 'waves', zion: 'mtn', vietnam: 'plane',
};
const MO = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
function ymd(s) { const p = s.split('-').map(Number); return { d: String(p[2]).padStart(2, '0'), mo: MO[p[1] - 1] }; }

/* date-tile event cover — single blue family, glyph differentiates */
function DateCover({ ev, big }) {
  const { d, mo } = ymd(ev.start);
  return (
    <div className={'cover' + (big ? ' big' : '')}>
      <div className="cv-top"><span className="cv-kind">{ev.kind}</span><span className="cv-glyph">{GL[ev.glyph || GLYPH[ev.id]] || GL.star}</span></div>
      <div>
        <div className="cv-date"><span className="d">{d}</span><span className="mo">{mo}</span></div>
        {big && <div className="cv-place">{ev.place}</div>}
      </div>
    </div>
  );
}
function GlyphTile({ ev }) { return <div className="gtile">{GL[ev.glyph || GLYPH[ev.id]] || GL.star}</div>; }

/* ---------------- header ---------------- */
function Head({ mode, title, onBack, onAction, scrolled }) {
  return (
    <div className={'apphead' + (scrolled ? ' scrolled' : '')}>
      <div className="statusgap" />
      <div className="bar">
        {mode === 'home' ? (
          <>
            <div className="brand">THE GROUP CHAT<span>: IRL</span></div>
            <div className="who">Gaby &amp; Jess</div>
          </>
        ) : (
          <>
            <button className="back" onClick={onBack} aria-label="Back">{I.back}</button>
            <div className="htitle">{title}</div>
            {onAction ? <button className="hact" onClick={onAction} aria-label="Share">{I.share}</button> : <div style={{ width: 36 }} />}
          </>
        )}
      </div>
    </div>
  );
}

/* ====================================================================
   SCREENS
   ==================================================================== */
/* ---- tweakable hero config (eyebrow / welcome line / accent) ---- */
const EYEBROWS = [
  "From SLC, exploring everywhere",
  "SLC-based · adventures near & far",
  "From SLC to everywhere · {n} plans",
  "Home base: SLC · plans all over",
  "Your crew, your calendar · {n} plans",
  "Salt Lake City · {n} plans on the calendar",
];
const LEDES = {
  "Standing invite": "Consider this your standing invite. Gaby & Jess keep the plans coming — subscribe once and you’ll never miss one. It’s always better when you’re there.",
  "We want you there": "We plan it, we book it, we round everyone up — all you do is show up. Subscribe once and you’re in on everything, and we’d genuinely love to have you along.",
  "Short & sweet": "Gaby & Jess keep the plans coming. Subscribe once, never miss one — it’s always better with you there.",
};
const ACCENTS = [
  ["#2f7cc0", "#1d5e9a", "#eaf2fb"], // sky (brand)
  ["#1f6aa8", "#154d7d", "#e7f0f8"], // deep ocean
  ["#3b86d8", "#2563ad", "#ecf3fc"], // bright
  ["#2c8fa6", "#1e6b7e", "#e6f3f6"], // blue-teal
];
const TWEAK_DEFAULTS = {
  eyebrow: "Your crew, your calendar · {n} plans",
  eyebrowCustom: "",
  lede: "Standing invite",
  accent: ["#2c8fa6", "#1e6b7e", "#e6f3f6"],
};

/* horizontal snap carousel with Instagram-style dots + right-edge fade hint */
function Carousel({ children }) {
  const ref = useRef(null);
  const [active, setActive] = useState(0);
  const [atEnd, setAtEnd] = useState(false);
  const n = React.Children.count(children);
  const onScroll = () => {
    const el = ref.current; if (!el) return;
    const cards = el.children;
    const x = el.scrollLeft + 24;
    let best = 0, bestD = Infinity;
    for (let i = 0; i < cards.length; i++) {
      const d = Math.abs(cards[i].offsetLeft - x);
      if (d < bestD) { bestD = d; best = i; }
    }
    const end = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    setAtEnd(end);
    setActive(end ? cards.length - 1 : best);
  };
  useEffect(() => { onScroll(); }, []);
  const go = (i) => {
    const el = ref.current; if (!el || !el.children[i]) return;
    el.scrollTo({ left: el.children[i].offsetLeft - 20, behavior: 'smooth' });
  };
  return (
    <div className="carousel-wrap">
      <div className="carousel" ref={ref} onScroll={onScroll}>{children}</div>
      <div className={'carousel-fade' + (atEnd ? ' hide' : '')} aria-hidden="true" />
      <div className="dots" role="tablist">
        {Array.from({ length: n }).map((_, i) => (
          <button key={i} className={'dot' + (i === active ? ' on' : '')} aria-label={'Go to card ' + (i + 1)} onClick={() => go(i)} />
        ))}
      </div>
    </div>
  );
}

function Home({ nav, openSub, t, count, events, live }) {
  const rawEyebrow = (t.eyebrowCustom && t.eyebrowCustom.trim()) ? t.eyebrowCustom : t.eyebrow;
  const eyebrowText = rawEyebrow.replace('{n}', count);
  const ledeText = LEDES[t.lede] || LEDES["Standing invite"];
  return (
    <div className="view">
      <Head mode="home" />
      <div className="pad" style={{ paddingTop: 8 }}>
        <div className="eyebrow">{eyebrowText}</div>
        <h1 className="d1">The Group Chat:<br /><span style={{ color: 'var(--acc)' }}>IRL</span></h1>
        <p className="lede">{ledeText}</p>
        <div style={{ marginTop: 18 }} />
        <button className="btn acc" onClick={openSub}>{I.cal}<span>Subscribe to the calendar</span></button>
        <div className="subnote">Adds to Google · Apple · Outlook — auto-updates forever</div>
        {live && <div className="subnote" style={{ color: 'var(--acc-ink)', fontWeight: 700, marginTop: 6 }}>● Live — these plans come straight from our Google Calendar</div>}
      </div>

      <div style={{ marginTop: 30 }}>
        <div className="pad"><div className="sech"><h2>Next up</h2></div></div>
        <Carousel>
          {events.slice(0, 3).map((ev) => (
            <button key={ev.id} className="ecard" onClick={() => nav('event', ev.id)}>
              <DateCover ev={ev} />
              <div className="body">
                <div className="when">{ev.when}</div>
                <h3>{ev.title}</h3>
                <div className="meta">{ev.place}</div>
                <div className="row"><Faces /><span className="pill">What to expect →</span></div>
              </div>
            </button>
          ))}
          <button className="seeall-card" onClick={() => nav('agenda')}>
            <span className="sa-arrow">{I.chev}</span>
            <span className="sa-t">See all {count}</span>
            <span className="sa-s">the full lineup →</span>
          </button>
        </Carousel>
      </div>

      <div className="pad" style={{ marginTop: 26 }}>
        <div className="band">
          <div className="eyebrow">All year, one calendar</div>
          <h3>One calendar, zero group-chat chaos.</h3>
          <p>Subscribe and the agenda lives in the calendar you already check. New plans appear automatically — no “wait, when is that?” ever again.</p>
          <button className="btn" onClick={openSub}>{I.cal}<span>Get the calendar</span></button>
        </div>
      </div>

      <div className="pad" style={{ marginTop: 28 }}>
        <div className="sech"><h2>Memories</h2><button className="more" onClick={() => nav('memories')}>View all{I.chev}</button></div>
        <div className="mems">
          {GC.MEMORIES.map((m) => (
            <button key={m.id} className="mcard" onClick={() => nav('memory', m.id)}>
              <div className="pic"><Photo id={m.cover} size={600} cap={m.title} /><span className="count">{m.media.length} photos</span></div>
              <div className="cap"><b>{m.title}</b><span>{m.dateLabel}</span></div>
            </button>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

function Agenda({ nav, events }) {
  return (
    <div className="view">
      <div className="pad" style={{ paddingTop: 6 }}>
        <div className="eyebrow">All year · 2026</div>
        <h1 className="d1" style={{ fontSize: 30 }}>The agenda</h1>
        <p className="lede">Everything we’ve committed to, in order. Tap any plan to see what to expect.</p>
      </div>
      <div className="pad" style={{ marginTop: 18 }}>
        <div className="elist">
          {events.map((ev) => (
            <button key={ev.id} className="erow" onClick={() => nav('event', ev.id)}>
              <GlyphTile ev={ev} />
              <div className="col">
                <div className="when">{ev.when}</div>
                <h3>{ev.title}</h3>
                <div className="meta">{ev.place}</div>
              </div>
              <span className="chev">{I.chev}</span>
            </button>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function EventDetail({ ev, nav, share, addCal, rsvp, rsvpOn }) {
  return (
    <div className="view">
      <DateCover ev={ev} big />
      <div className="pad" style={{ marginTop: 18 }}>
        <div className="eyebrow" style={{ color: 'var(--acc-ink)' }}>{ev.kind}</div>
        <h1 className="d1" style={{ fontSize: 30, marginTop: 8 }}>{ev.title}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{ev.blurb}</p>
        <div className="chips" style={{ marginTop: 16 }}>
          <span className="chip">{I.cal}{ev.when.split(' · ').slice(0, 2).join(' · ')}</span>
          {ev.when.split(' · ')[2] && <span className="chip">{I.clock}{ev.when.split(' · ')[2]}</span>}
          {ev.place && <span className="chip">{I.pin}{ev.place}</span>}
        </div>
      </div>

      <div className="pad expect" style={{ marginTop: 24 }}>
        <div className="sech"><h2>What to expect</h2></div>
        <p>{ev.expect}</p>
      </div>

      {ev.facts && ev.facts.length > 0 && (
        <div className="pad" style={{ marginTop: 22 }}>
          <div className="facts4">
            {ev.facts.map(([k, v], i) => <div key={i} className="f"><div className="k">{k}</div><div className="v">{v}</div></div>)}
          </div>
        </div>
      )}

      {ev.bring && ev.bring.length > 0 && (
        <div className="pad" style={{ marginTop: 22 }}>
          <div className="sech"><h2>Bring</h2></div>
          <ul className="checks">
            {ev.bring.map((b, i) => <li key={i}><span className="dot">{I.chk}</span><div>{b}</div></li>)}
          </ul>
        </div>
      )}

      <div className="pad" style={{ marginTop: 22 }}>
        <div className="whoin">
          <div><div className="lbl">{6 + (ev.id.length % 5)} friends are in</div><div style={{ marginTop: 8 }}><Faces /></div></div>
          <button className={'rsvp' + (rsvpOn ? ' on' : '')} onClick={rsvp}>{rsvpOn ? "You're in ✓" : "I'm in"}</button>
        </div>
      </div>

      {ev.tickets && (
        <div className="pad" style={{ marginTop: 16 }}>
          <a className="btn ghost" href={ev.tickets} target="_blank" rel="noopener">{I.link}<span>Get tickets</span></a>
        </div>
      )}

      <div style={{ height: 24 }} />
      <div className="actbar">
        <button className="btn acc" onClick={addCal}>{I.cal}<span>Add to calendar</span></button>
        <button className="iconbtn" onClick={share}>{I.share}</button>
      </div>
    </div>
  );
}

function Memories({ nav }) {
  return (
    <div className="view">
      <div className="pad" style={{ paddingTop: 6 }}>
        <div className="eyebrow">The ones we’ve done</div>
        <h1 className="d1" style={{ fontSize: 30 }}>Memories</h1>
        <p className="lede">Photo galleries from past hangs. Open one, then share it however you like.</p>
      </div>
      <div className="pad" style={{ marginTop: 18 }}>
        <div className="mems" style={{ gap: 12 }}>
          {GC.MEMORIES.map((m) => (
            <button key={m.id} className="mcard" onClick={() => nav('memory', m.id)}>
              <div className="pic" style={{ height: 130 }}><Photo id={m.cover} size={700} cap={m.title} /><span className="count">{m.media.length} photos</span></div>
              <div className="cap"><b>{m.title}</b><span>{m.subtitle} · {m.dateLabel}</span></div>
            </button>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

function MemoryDetail({ m, openLb, share }) {
  return (
    <div className="view">
      <div className="ehero" style={{ height: 210, position: 'relative' }}><Photo id={m.cover} size={1200} cap={m.title} /></div>
      <div className="pad" style={{ marginTop: 18 }}>
        <div className="eyebrow" style={{ color: 'var(--acc-ink)' }}>{m.dateLabel} · {m.media.length} photos</div>
        <h1 className="d1" style={{ fontSize: 30, marginTop: 8 }}>{m.title}</h1>
        <p className="lede" style={{ marginTop: 10 }}>{m.subtitle} — “{m.catchphrase}.”</p>
      </div>

      <div className="pad" style={{ marginTop: 20 }}>
        <div className="gal">
          {m.media.map((md, i) => (
            <button key={md.id} className={'g' + (i === 0 ? ' tall' : '') + (md.type === 'video' ? ' is-video' : '')}
              style={i === 0 ? { height: 'auto', minHeight: 200 } : {}} onClick={() => openLb(i)}>
              <Photo id={md.id} size={i === 0 ? 1000 : 500} cap={md.type === 'video' ? 'video' : 'photo'} />
            </button>
          ))}
        </div>
      </div>

      <div className="pad" style={{ marginTop: 22 }}>
        <div className="song">
          <div className="ph alb" />
          <div className="t"><b>Song of the day</b><span>add the crew’s pick →</span></div>
          <button className="play">{I.play}</button>
        </div>
      </div>

      <div className="pad" style={{ marginTop: 20 }}>
        <div className="sech"><h2>Share the memory</h2></div>
        <div className="share-row">
          <button className="sbtn" onClick={() => share('story')}><span className="ic">{I.share}</span><span>IG Story</span></button>
          <button className="sbtn" onClick={() => share('link')}><span className="ic">{I.link}</span><span>Copy link</span></button>
          <a className="sbtn" href={m.driveFolder} target="_blank" rel="noopener" onClick={() => share('album')}><span className="ic">{I.spark}</span><span>Full album</span></a>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <div className="footer">
      <a className="credit" href="https://brightstudio.build/" target="_blank" rel="noopener">
        Designed &amp; built by <b>Bright&nbsp;Studio</b> ↗
      </a>
    </div>
  );
}

/* ---------------- subscribe sheet ---------------- */
function SubscribeSheet({ onClose, toast }) {
  const [copied, setCopied] = useState(false);
  const pick = (provider) => {
    Track.hit('subscribe', 'calendar', provider, provider);
    if (provider === 'google') window.open(GC.CAL.google, '_blank', 'noopener');
    else if (provider === 'apple') { window.location.href = GC.CAL.webcal; }
    else if (provider === 'copy') {
      navigator.clipboard?.writeText(GC.CAL.ics).then(() => {}, () => {});
      setCopied(true); toast('Calendar link copied'); setTimeout(() => { setCopied(false); onClose(); }, 1100); return;
    }
    toast('Opening ' + (provider === 'google' ? 'Google Calendar' : 'Calendar') + '…');
    setTimeout(onClose, 600);
  };
  return (
    <div className="scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h3>Subscribe to the calendar</h3>
        <p>One tap. New plans sync automatically — you’ll never have to ask “when is that?” again.</p>
        <button className="subopt" onClick={() => pick('google')}>
          <span className="ico">{I.google}</span><span className="tx"><b>Google Calendar</b><span>Add to your Google account</span></span><span className="arr">{I.chev}</span>
        </button>
        <button className="subopt" onClick={() => pick('apple')}>
          <span className="ico">{I.apple}</span><span className="tx"><b>Apple Calendar</b><span>Subscribe via webcal — auto-refreshes</span></span><span className="arr">{I.chev}</span>
        </button>
        <button className={'subopt' + (copied ? ' copied' : '')} onClick={() => pick('copy')}>
          <span className="ico">{copied ? I.chk : I.link}</span><span className="tx"><b>{copied ? 'Copied!' : 'Copy link (Outlook + others)'}</b><span>Paste into any calendar app</span></span>
        </button>
      </div>
    </div>
  );
}

/* ---------------- lightbox ---------------- */
function Lightbox({ m, idx, setIdx, onClose }) {
  const n = m.media.length;
  const md = m.media[idx];
  const go = (d) => setIdx((idx + d + n) % n);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [idx]);
  const touchX = useRef(null);
  const onTouchStart = (e) => { touchX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };
  return (
    <div className="lbox" onClick={onClose}>
      <div className="lbtop">
        <span className="lbcount">{n > 1 ? (idx + 1) + ' / ' + n : ''}</span>
        <button className="lbclose" onClick={onClose} aria-label="Close">{I.close}</button>
      </div>
      <div className="lbstage" onClick={(e) => e.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {md.type === 'video'
          ? <iframe src={'https://drive.google.com/file/d/' + md.id + '/preview'} allow="autoplay" />
          : <img src={GC.drivePhoto(md.id, 1600)} alt="" />}
      </div>
      {n > 1 && (
        <React.Fragment>
          <button className="lbnav prev" onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo">{I.back}</button>
          <button className="lbnav next" onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo">{I.chev}</button>
        </React.Fragment>
      )}
    </div>
  );
}

/* ====================================================================
   ROOT
   ==================================================================== */
function App() {
  const [route, setRoute] = useState({ name: 'home', id: null });
  const [stack, setStack] = useState([]);
  const [sub, setSub] = useState(false);
  const [lb, setLb] = useState(null); // {idx}
  const [toastMsg, setToastMsg] = useState('');
  const [rsvps, setRsvps] = useState({});
  const [scrolled, setScrolled] = useState(false);
  const toastT = useRef(0);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // apply accent palette (stays within the blues)
  useEffect(() => {
    const r = document.documentElement, p = t.accent;
    if (Array.isArray(p)) { r.style.setProperty('--acc', p[0]); r.style.setProperty('--acc-ink', p[1]); r.style.setProperty('--acc-soft', p[2]); }
  }, [t.accent]);

  // Events: curated list now; swap to the LIVE Google Calendar when a key is set.
  const [events, setEvents] = useState(() => GC.upcomingEvents());
  const [live, setLive] = useState(false);
  useEffect(() => {
    let alive = true;
    GC.fetchEvents().then((evs) => { if (alive && evs && evs.length) { setEvents(evs); setLive(true); } });
    return () => { alive = false; };
  }, []);
  const count = events.length;

  const toast = (msg) => { setToastMsg(msg); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToastMsg(''), 1700); };

  const nav = (name, id = null) => {
    setStack((s) => [...s, route]);
    setRoute({ name, id });
    if (name === 'event') Track.hit('open', 'event', id, (GC.EVENTS.find((e) => e.id === id) || {}).title);
    if (name === 'memory') Track.hit('open', 'memory', id, (GC.MEMORIES.find((e) => e.id === id) || {}).title);
  };
  const back = () => { setStack((s) => { if (!s.length) { setRoute({ name: 'home', id: null }); return s; } const prev = s[s.length - 1]; setRoute(prev); return s.slice(0, -1); }); };

  // reset scroll + header state on route change
  useEffect(() => { window.scrollTo(0, 0); setScrolled(false); }, [route]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const ev = route.name === 'event' ? (events.find((e) => e.id === route.id) || GC.EVENTS.find((e) => e.id === route.id)) : null;
  const mem = route.name === 'memory' ? GC.MEMORIES.find((e) => e.id === route.id) : null;

  const shareEvent = () => {
    Track.hit('share', 'event', ev.id, ev.title);
    const url = location.href.split('#')[0] + '#event/' + ev.id;
    if (navigator.share) navigator.share({ title: ev.title, text: 'Come to ' + ev.title + ' with the crew!', url }).catch(() => {});
    else { navigator.clipboard?.writeText(url); toast('Link copied — paste in the chat'); }
  };
  const addCal = () => { Track.hit('addcal', 'event', ev.id, ev.title); window.open(GC.gcalLink(ev), '_blank', 'noopener'); toast('Opening calendar…'); };
  const rsvp = () => { setRsvps((r) => ({ ...r, [ev.id]: !r[ev.id] })); if (!rsvps[ev.id]) Track.hit('rsvp', 'event', ev.id, ev.title); };
  const shareMem = (kind) => { Track.hit('share', 'memory', mem.id, mem.title); if (kind === 'link') { navigator.clipboard?.writeText(location.href.split('#')[0] + '#memory/' + mem.id); toast('Link copied'); } else if (kind === 'story') toast('Story image ready to post'); };

  // header config
  let head = null;
  if (route.name !== 'home') {
    const titles = { agenda: 'The Agenda', memories: 'Memories', event: ev && ev.title, memory: mem && mem.title };
    const action = route.name === 'event' ? shareEvent : route.name === 'memory' ? (() => shareMem('link')) : null;
    head = <Head mode="sub" title={titles[route.name]} onBack={back} onAction={action} scrolled={scrolled} />;
  }

  return (
    <div className="gc">
      {head}
      {route.name === 'home' && <Home nav={nav} openSub={() => { setSub(true); }} t={t} count={count} events={events} live={live} />}
      {route.name === 'agenda' && <Agenda nav={nav} events={events} />}
      {route.name === 'event' && ev && <EventDetail ev={ev} nav={nav} share={shareEvent} addCal={addCal} rsvp={rsvp} rsvpOn={!!rsvps[ev.id]} />}
      {route.name === 'memories' && <Memories nav={nav} />}
      {route.name === 'memory' && mem && <MemoryDetail m={mem} openLb={(i) => setLb({ idx: i })} share={shareMem} />}

      {sub && <SubscribeSheet onClose={() => setSub(false)} toast={toast} />}
      {lb && mem && <Lightbox m={mem} idx={lb.idx} setIdx={(i) => setLb({ idx: i })} onClose={() => setLb(null)} />}
      <div className={'toast' + (toastMsg ? ' show' : '')}>{toastMsg}</div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Hero eyebrow" />
        <TweakSelect label="Preset" value={t.eyebrow} options={EYEBROWS.map((e) => ({ value: e, label: e.replace('{n}', count) }))} onChange={(v) => setTweak('eyebrow', v)} />
        <TweakText label="Or write your own" value={t.eyebrowCustom} placeholder="Custom eyebrow…" onChange={(v) => setTweak('eyebrowCustom', v)} />
        <TweakSection label="Welcome line" />
        <TweakSelect label="Tone" value={t.lede} options={Object.keys(LEDES)} onChange={(v) => setTweak('lede', v)} />
        <TweakSection label="Accent — stays in the blues" />
        <TweakColor label="Shade" value={t.accent} options={ACCENTS} onChange={(v) => setTweak('accent', v)} />
      </TweaksPanel>
    </div>
  );
}

/* ---------------- mount responsively: full-bleed on phones, centered column on desktop ---------------- */
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
