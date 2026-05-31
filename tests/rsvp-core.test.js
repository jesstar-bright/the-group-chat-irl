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
