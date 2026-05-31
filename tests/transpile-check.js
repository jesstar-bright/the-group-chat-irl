// Transpiles the site's JSX with the EXACT Babel build the browser loads.
// If this passes, the in-browser transform will too (no blank page).
const fs = require('fs');
const path = require('path');
const Babel = require('@babel/standalone');

const root = path.join(__dirname, '..');
const files = ['rsvp.jsx', 'tweaks-panel.jsx', 'app.jsx'];
let failed = false;
for (const f of files) {
  const p = path.join(root, f);
  if (!fs.existsSync(p)) { console.log('SKIP (missing):', f); continue; }
  try {
    Babel.transform(fs.readFileSync(p, 'utf8'), { presets: ['react'], filename: f });
    console.log('OK  ', f);
  } catch (e) {
    failed = true;
    console.log('FAIL', f, '-', e.message.split('\n')[0]);
  }
}
process.exit(failed ? 1 : 0);
