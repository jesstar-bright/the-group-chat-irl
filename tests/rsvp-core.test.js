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
