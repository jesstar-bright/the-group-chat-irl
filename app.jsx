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
      <div className="cv-top"><span className="cv-kind">{ev.kind}</span><span className="cv-glyph">{GL[GLYPH[ev.id]] || GL.star}</span></div>
      <div>
        <div className="cv-date"><span className="d">{d}</span><span className="mo">{mo}</span></div>
        {big && <div className="cv-place">{ev.place}</div>}
      </div>
    </div>
  );
}
function GlyphTile({ ev }) { return <div className="gtile">{GL[GLYPH[ev.id]] || GL.star}</div>; }

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
function Home({ nav, openSub }) {
  const up = GC.EVENTS.slice(0, 2);
  return (
    <div className="view">
      <Head mode="home" />
      <div className="pad" style={{ paddingTop: 8 }}>
        <div className="eyebrow">Summer in Utah · {GC.EVENTS.length} plans locked</div>
        <h1 className="d1">Touch grass<br />with the crew.</h1>
        <p className="lede">Gaby &amp; Jess plan it, you just show up. Subscribe once and every hike, soak &amp; slope lands in your calendar.</p>
        <div style={{ marginTop: 18 }} />
        <button className="btn acc" onClick={openSub}>{I.cal}<span>Subscribe to the calendar</span></button>
        <div className="subnote">Adds to Google · Apple · Outlook — auto-updates forever</div>
      </div>

      <div className="pad" style={{ marginTop: 30 }}>
        <div className="sech"><h2>Next up</h2><button className="more" onClick={() => nav('agenda')}>See all {GC.EVENTS.length}{I.chev}</button></div>
        {up.map((ev) => (
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
      </div>

      <div className="pad" style={{ marginTop: 26 }}>
        <div className="band">
          <div className="eyebrow">The whole summer</div>
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

function Agenda({ nav }) {
  return (
    <div className="view">
      <div className="pad" style={{ paddingTop: 6 }}>
        <div className="eyebrow">Summer ’26</div>
        <h1 className="d1" style={{ fontSize: 30 }}>The agenda</h1>
        <p className="lede">Everything we’ve committed to, in order. Tap any plan to see what to expect.</p>
      </div>
      <div className="pad" style={{ marginTop: 18 }}>
        <div className="elist">
          {GC.EVENTS.map((ev) => (
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
          <span className="chip">{I.pin}{ev.place}</span>
        </div>
      </div>

      <div className="pad expect" style={{ marginTop: 24 }}>
        <div className="sech"><h2>What to expect</h2></div>
        <p>{ev.expect}</p>
      </div>

      <div className="pad" style={{ marginTop: 22 }}>
        <div className="facts4">
          {ev.facts.map(([k, v], i) => <div key={i} className="f"><div className="k">{k}</div><div className="v">{v}</div></div>)}
        </div>
      </div>

      <div className="pad" style={{ marginTop: 22 }}>
        <div className="sech"><h2>Bring</h2></div>
        <ul className="checks">
          {ev.bring.map((b, i) => <li key={i}><span className="dot">{I.chk}</span><div>{b}</div></li>)}
        </ul>
      </div>

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
  const md = m.media[idx];
  return (
    <div className="lbox" onClick={onClose}>
      <div className="lbtop"><button className="lbclose" onClick={onClose}>{I.close}</button></div>
      <div className="lbstage" onClick={(e) => e.stopPropagation()}>
        {md.type === 'video'
          ? <iframe src={'https://drive.google.com/file/d/' + md.id + '/preview'} allow="autoplay" />
          : <img src={GC.drivePhoto(md.id, 1600)} alt="" />}
      </div>
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
  const scrollerRef = useRef(null);
  const toastT = useRef(0);

  const toast = (msg) => { setToastMsg(msg); clearTimeout(toastT.current); toastT.current = setTimeout(() => setToastMsg(''), 1700); };

  const nav = (name, id = null) => {
    setStack((s) => [...s, route]);
    setRoute({ name, id });
    if (name === 'event') Track.hit('open', 'event', id, (GC.EVENTS.find((e) => e.id === id) || {}).title);
    if (name === 'memory') Track.hit('open', 'memory', id, (GC.MEMORIES.find((e) => e.id === id) || {}).title);
  };
  const back = () => { setStack((s) => { if (!s.length) { setRoute({ name: 'home', id: null }); return s; } const prev = s[s.length - 1]; setRoute(prev); return s.slice(0, -1); }); };

  // reset scroll + header state on route change
  useEffect(() => {
    const sc = scrollerRef.current && scrollerRef.current.parentElement;
    if (sc) { sc.scrollTop = 0; setScrolled(false); }
  }, [route]);
  useEffect(() => {
    const sc = scrollerRef.current && scrollerRef.current.parentElement;
    if (!sc) return;
    const onScroll = () => setScrolled(sc.scrollTop > 6);
    sc.addEventListener('scroll', onScroll);
    return () => sc.removeEventListener('scroll', onScroll);
  }, []);

  const ev = route.name === 'event' ? GC.EVENTS.find((e) => e.id === route.id) : null;
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
    <div className="gc" ref={scrollerRef}>
      {head}
      {route.name === 'home' && <Home nav={nav} openSub={() => { setSub(true); }} />}
      {route.name === 'agenda' && <Agenda nav={nav} />}
      {route.name === 'event' && ev && <EventDetail ev={ev} nav={nav} share={shareEvent} addCal={addCal} rsvp={rsvp} rsvpOn={!!rsvps[ev.id]} />}
      {route.name === 'memories' && <Memories nav={nav} />}
      {route.name === 'memory' && mem && <MemoryDetail m={mem} openLb={(i) => setLb({ idx: i })} share={shareMem} />}

      {sub && <SubscribeSheet onClose={() => setSub(false)} toast={toast} />}
      {lb && mem && <Lightbox m={mem} idx={lb.idx} setIdx={(i) => setLb({ idx: i })} onClose={() => setLb(null)} />}
      <div className={'toast' + (toastMsg ? ' show' : '')}>{toastMsg}</div>
    </div>
  );
}

/* ---------------- mount in iOS frame, scaled to viewport ---------------- */
function Stage() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const fit = () => { const s = Math.min(1, (window.innerHeight - 40) / 874, (window.innerWidth - 32) / 402); setScale(s); };
    fit(); window.addEventListener('resize', fit); return () => window.removeEventListener('resize', fit);
  }, []);
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#eceef1' }}>
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        <IOSDevice>
          <App />
        </IOSDevice>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Stage />);
