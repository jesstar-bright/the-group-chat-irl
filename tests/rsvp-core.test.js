const test = require('node:test');
const assert = require('node:assert');
const C = require('../rsvp-core.js');

test('initials: first letter uppercased', () => {
  assert.strictEqual(C.initials('gaby'), 'G');
  assert.strictEqual(C.initials('  jess'), 'J');
});

test('initials: empty/blank -> "?"', () => {
  assert.strictEqual(C.initials(''), '?');
  assert.strictEqual(C.initials('   '), '?');
  assert.strictEqual(C.initials(null), '?');
});

test('colorFor: deterministic + from palette', () => {
  assert.strictEqual(C.colorFor('Gaby'), C.colorFor('Gaby'));
  assert.ok(C.COLORS.includes(C.colorFor('Gaby')));
  assert.ok(C.COLORS.includes(C.colorFor('')));
});

test('sanitizeName: trims, collapses spaces, strips <> and control chars, caps 50', () => {
  assert.strictEqual(C.sanitizeName('  Sam  '), 'Sam');
  assert.strictEqual(C.sanitizeName('a b<c>d'), 'a bcd');
  assert.strictEqual(C.sanitizeName('Mary   Jane'), 'Mary Jane');
  assert.strictEqual(C.sanitizeName('x'.repeat(80)).length, 50);
  assert.strictEqual(C.sanitizeName(null), '');
});

test('isValidPhotoUrl: only https, <=200 chars, no spaces', () => {
  assert.strictEqual(C.isValidPhotoUrl('https://lh3.googleusercontent.com/a/x'), true);
  assert.strictEqual(C.isValidPhotoUrl('http://x.com/a.png'), false);
  assert.strictEqual(C.isValidPhotoUrl('javascript:alert(1)'), false);
  assert.strictEqual(C.isValidPhotoUrl('https://x.com/ a'), false);
  assert.strictEqual(C.isValidPhotoUrl('https://x.com/' + 'a'.repeat(220)), false);
  assert.strictEqual(C.isValidPhotoUrl(''), false);
});

test('firstName: first token, sanitized', () => {
  assert.strictEqual(C.firstName('Gaby Hernandez'), 'Gaby');
  assert.strictEqual(C.firstName('  Sam  '), 'Sam');
  assert.strictEqual(C.firstName(''), '');
});

test('decodeIdToken: reads name/picture/email from JWT payload', () => {
  // payload {"name":"Gaby","picture":"https://x/p.png","email":"g@x.com"}
  const payload = Buffer.from(JSON.stringify({
    name: 'Gaby', picture: 'https://x/p.png', email: 'g@x.com'
  })).toString('base64').replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_');
  const jwt = 'header.' + payload + '.sig';
  assert.deepStrictEqual(C.decodeIdToken(jwt), { name: 'Gaby', picture: 'https://x/p.png', email: 'g@x.com' });
});

test('decodeIdToken: malformed -> null', () => {
  assert.strictEqual(C.decodeIdToken('not-a-jwt'), null);
  assert.strictEqual(C.decodeIdToken(''), null);
  assert.strictEqual(C.decodeIdToken(null), null);
});

test('dedupeRoster: latest state per (event,device), only "in", first-name + valid photo', () => {
  const rows = [
    { event_id: 'pride', device_id: 'd1', name: 'Sam Lee', photo: 'https://x/p.png', state: 'in', t: 1 },
    { event_id: 'pride', device_id: 'd1', name: 'Sam Lee', photo: '', state: 'out', t: 2 }, // d1 left
    { event_id: 'pride', device_id: 'd2', name: 'Gaby', photo: 'http://bad', state: 'in', t: 1 }, // bad photo -> ''
    { event_id: 'bees', device_id: 'd3', name: 'Kate Smith', photo: '', state: 'in', t: 5 },
  ];
  assert.deepStrictEqual(C.dedupeRoster(rows), {
    pride: [{ name: 'Gaby', photo: '' }],
    bees: [{ name: 'Kate', photo: '' }],
  });
});

test('dedupeRoster: empty/garbage -> {}', () => {
  assert.deepStrictEqual(C.dedupeRoster([]), {});
  assert.deepStrictEqual(C.dedupeRoster(null), {});
});
