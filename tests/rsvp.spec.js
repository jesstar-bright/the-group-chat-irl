const { test, expect } = require('@playwright/test');

// Mock the Apps Script endpoint so the run is deterministic and offline.
async function mockEndpoint(page, rosterRef) {
  await page.route(/\/exec(\?.*)?$/, async (route) => {
    const req = route.request();
    if (req.method() === 'GET' && req.url().includes('mode=rsvps')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(rosterRef.value) });
    }
    // POST upsert — record "in" so the reconcile GET reflects it
    try {
      const body = JSON.parse(req.postData() || '{}');
      if (body.kind === 'rsvp' && body.state === 'in') {
        rosterRef.value[body.event] = [{ name: body.name, photo: body.photo || '' }];
      } else if (body.kind === 'rsvp' && body.state === 'out') {
        delete rosterRef.value[body.event];
      }
    } catch (e) {}
    return route.fulfill({ status: 200, contentType: 'text/plain', body: 'ok' });
  });
}

test('tapping "I\'m in" prompts for name then shows a real count', async ({ page }) => {
  const rosterRef = { value: {} };
  await mockEndpoint(page, rosterRef);

  await page.goto('/');
  // Open the first event card → event detail
  await page.locator('.ecard').first().click();
  await expect(page.locator('.whoin')).toBeVisible();

  // No real RSVPs yet → count line is empty (never shows "0 friends are in")
  await expect(page.locator('.whoin .lbl')).toHaveText('');

  // Tap "I'm in" → name prompt appears
  await page.getByRole('button', { name: /I'm in/ }).click();
  await expect(page.locator('#rsvp-portal .sheet')).toBeVisible();

  // Enter name, submit
  await page.locator('#rsvp-portal input').fill('Sam');
  await page.locator('#rsvp-portal').getByRole('button', { name: /I'm in/ }).click();

  // Optimistic: count updates to "1 friend is in" and an avatar with initial "S"
  await expect(page.locator('.whoin .lbl')).toContainText('1 friend is in');
  await expect(page.locator('.whoin .faces .face').first()).toHaveText('S');
});
