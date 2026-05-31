/* Minimal RSVP client: window.RSVP + RSVPCount React component
   Drop this as a <script type="text/babel" src="rsvp.jsx"></script>
   Set `window.RSVP_ENDPOINT = 'https://<YOUR_WEBAPP>/exec'` before loading if available.
*/
(function(){
  const DEFAULT_ENDPOINT = window.RSVP_ENDPOINT || 'https://REPLACE_WITH_YOUR_WEBAPP/exec';
  let endpoint = DEFAULT_ENDPOINT;
  let roster = {}; // { eventId: [ {name,photo}, ... ] }
  let subs = [];

  function notify(){ subs.forEach(s=>{ try{ s(); }catch(e){} }); }

  async function fetchRosters(){
    try{
      const res = await fetch(endpoint + '?mode=rsvps');
      if(!res.ok) return;
      const data = await res.json();
      roster = data || {};
      notify();
    }catch(err){
      console.warn('RSVP fetch failed', err);
    }
  }

  function rosterFor(eventId){ return roster[eventId] ? roster[eventId].slice() : []; }
  function count(eventId){ return (roster[eventId]||[]).length; }

  function subscribe(cb){ subs.push(cb); return ()=>{ subs = subs.filter(x=>x!==cb); }; }

  async function toggle(eventId, me){
    // `me` should be { sid, name, photo }
    if(!me || !me.sid || !me.name) {
      console.warn('RSVP.toggle requires me {sid,name}');
      return;
    }
    const current = rosterFor(eventId);
    const exists = current.some(r=>r.name === me.name && (me.photo ? r.photo === me.photo : true));

    // optimistic local update
    if(exists){
      roster[eventId] = current.filter(r=>!(r.name === me.name && (me.photo ? r.photo === me.photo : true)));
    } else {
      roster[eventId] = current.concat([{ name: me.name, photo: me.photo || '' }]);
    }
    notify();

    // send upsert
    try{
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind: 'rsvp', event: eventId, sid: me.sid, name: me.name, photo: me.photo || '', state: exists ? 'out' : 'in' })
      });
    }catch(err){
      console.warn('RSVP POST failed', err);
    }

    // gentle re-sync
    setTimeout(fetchRosters, 1000);
  }

  function init(opts){
    if(opts && opts.url) endpoint = opts.url;
    // kick off background fetch
    fetchRosters();
    return window.RSVP;
  }

  // expose API
  window.RSVP = {
    init,
    fetchRosters,
    rosterFor,
    count,
    subscribe,
    toggle,
    setEndpoint: (u) => { endpoint = u; }
  };

  // React component (no JSX to keep Babel simple)
  function RSVPCount(props){
    const eventId = props && props.eventId;
    const [n, setN] = React.useState(window.RSVP.count(eventId) || 0);
    React.useEffect(() => {
      let mounted = true;
      const update = () => { if(!mounted) return; setN(window.RSVP.count(eventId) || 0); };
      const unsub = window.RSVP.subscribe(update);
      // initial
      update();
      return () => { mounted = false; unsub(); };
    }, [eventId]);
    if(!n) return null; // hide if 0 or unknown
    return React.createElement('div', { className: 'rsvp-count' }, String(n) + ' friends are in');
  }

  window.RSVP.RSVPCount = RSVPCount;

  // auto-init if endpoint already provided on window
  if(window.RSVP_ENDPOINT) window.RSVP.init({ url: window.RSVP_ENDPOINT });

})();
