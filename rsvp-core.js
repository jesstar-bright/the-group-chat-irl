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

  var RSVPCore = { COLORS: COLORS, initials: initials, colorFor: colorFor,
    sanitizeName: sanitizeName, isValidPhotoUrl: isValidPhotoUrl };

  if (typeof module !== 'undefined' && module.exports) module.exports = RSVPCore;
  if (root) root.RSVPCore = RSVPCore;
})(typeof window !== 'undefined' ? window : null);
