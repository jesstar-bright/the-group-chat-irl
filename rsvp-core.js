/* rsvp-core.js — pure RSVP helpers. No DOM, no React.
   Loaded in the browser as a plain <script> (exposes window.RSVPCore)
   and required by Node tests (module.exports). See the design spec. */
(function (root) {
  var COLORS = ['#2f7cc0', '#5b8f5b', '#c08a2f', '#9a5bb0', '#2c8fa6', '#1f6aa8'];

  function initials(name) {
    var s = String(name == null ? '' : name).trim();
    return s ? s[0].toUpperCase() : '?';
  }

  function colorFor(name) {
    var s = String(name == null ? '' : name);
    var h = 0;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return COLORS[h % COLORS.length];
  }

  function sanitizeName(name) {
    var s = String(name == null ? '' : name);
    s = s.replace(/[\x00-\x1F<>]/g, ''); // control chars + angle brackets
    s = s.replace(/\s+/g, ' ').trim();
    return s.slice(0, 50);
  }

  function isValidPhotoUrl(url) {
    var s = String(url == null ? '' : url).trim();
    if (s.length === 0 || s.length > 200) return false;
    if (/\s/.test(s)) return false;
    return /^https:\/\//i.test(s);
  }

  function firstName(name) {
    var s = sanitizeName(name);
    return s ? s.split(' ')[0] : '';
  }

  function b64urlDecode(str) {
    var s = String(str).replace(/-/g, '+').replace(/_/g, '/');
    var pad = s.length % 4 ? '='.repeat(4 - (s.length % 4)) : '';
    s = s + pad;
    if (typeof Buffer !== 'undefined') return Buffer.from(s, 'base64').toString('utf8');
    return decodeURIComponent(escape(atob(s))); // browser, UTF-8 safe
  }

  function decodeIdToken(jwt) {
    try {
      var parts = String(jwt == null ? '' : jwt).split('.');
      if (parts.length < 2 || !parts[1]) return null;
      var p = JSON.parse(b64urlDecode(parts[1]));
      return { name: p.name || '', picture: p.picture || '', email: p.email || '' };
    } catch (e) { return null; }
  }

  function dedupeRoster(rows) {
    var latest = {};
    (rows || []).forEach(function (r) {
      var k = r.event_id + '|' + r.device_id;
      if (!latest[k] || (r.t || 0) >= (latest[k].t || 0)) latest[k] = r;
    });
    var out = {};
    Object.keys(latest).forEach(function (k) {
      var r = latest[k];
      if (r.state !== 'in') return;
      var nm = firstName(r.name);
      if (!r.event_id || !nm) return;
      (out[r.event_id] = out[r.event_id] || []).push({
        name: nm, photo: isValidPhotoUrl(r.photo) ? r.photo : ''
      });
    });
    return out;
  }

  var RSVPCore = { COLORS: COLORS, initials: initials, colorFor: colorFor,
    sanitizeName: sanitizeName, isValidPhotoUrl: isValidPhotoUrl,
    firstName: firstName, decodeIdToken: decodeIdToken,
    dedupeRoster: dedupeRoster };

  if (typeof module !== 'undefined' && module.exports) module.exports = RSVPCore;
  if (root) root.RSVPCore = RSVPCore;
})(typeof window !== 'undefined' ? window : null);
