/* eslint-disable @typescript-eslint/no-require-imports */
// Run against the local friends-server.cjs and friends-app.cjs fixture.
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || path.resolve('.npm-cache/hot-seats-qa/tools/node_modules/@playwright/test'));
const shots = '.npm-cache/live-coming-soon';
fs.mkdirSync(shots, { recursive: true });
(async () => {
 const browser = await chromium.launch({ headless: true });
 try {
  for (const width of [320, 375, 393]) {
   const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
   await context.addInitScript(() => {
    localStorage.setItem('hot-seats.onboarding-complete.v1', 'true');
    localStorage.setItem('hot-seats.city.v1', 'Exeter');
    localStorage.setItem('hot-seats.nearby-guidance.v1', 'seen');
   });
   await context.route('https://api.mapbox.com/**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [] }) }));
   const page = await context.newPage();
   const errors = [], liveRequests = [];
   page.on('pageerror', e => errors.push(e.message));
   page.on('request', r => { if (/\/rest\/v1\/.*(check.?in|leaderboard|study.points|study.sessions)/i.test(r.url())) liveRequests.push(r.url()); });
   await page.goto('http://localhost:3105', { timeout: 120000 });
   const dock = page.getByRole('navigation', { name: 'Map navigation' });
   await expect(dock).toBeVisible();
   assert.deepEqual(await dock.getByRole('button').allTextContents(), ['Nearby', 'Saved', 'Friends', 'LIVE']);
   await page.getByRole('button', { name: 'Open LIVE', exact: true }).click();
   const live = page.getByRole('region', { name: 'LIVE', exact: true });
   await expect(live).toBeVisible();
   const settled = () => page.waitForTimeout(900);
   await settled();
   const drag = async toY => {
    const r = await live.boundingBox(); await page.mouse.move(width / 2, r.y + 24); await page.mouse.down();
    await page.mouse.move(width / 2, toY, { steps: 20 }); await page.mouse.up(); await settled();
   };
   await drag(65); assert((await live.boundingBox()).y < 60);
   await expect(live).toContainText('A new way to study together.');
   await expect(live.getByText('Coming soon', { exact: true })).toBeVisible();
   await expect(live.getByRole('heading', { name: 'Study together. Go further.' })).toBeVisible();
   const features = live.getByRole('list', { name: 'Upcoming LIVE features' });
   await expect(features.getByRole('listitem')).toHaveCount(4);
   assert.deepEqual(await features.getByRole('heading').allTextContents(), ['Study Sessions', 'Studying Now', 'Leaderboards', 'Recent Activity']);
   await expect(features).toContainText('See friends who choose to share their caf\u00e9.');
   await expect(live).toContainText("We're building LIVE with privacy in mind. More soon.");
   await expect(live.getByRole('button')).toHaveCount(1);
   await expect(live.getByRole('switch')).toHaveCount(0);
   await expect(live.getByRole('tablist')).toHaveCount(0);
   await expect(live.getByRole('table')).toHaveCount(0);
   assert(await live.evaluate(el => el.scrollWidth <= el.clientWidth));
   await page.screenshot({ path: `${shots}/live-${width}.png` });
   await drag(500); assert((await live.boundingBox()).y > 400);
   await drag(760); await expect(live).not.toBeVisible(); await expect(dock).toBeVisible();
   await page.getByRole('button', { name: 'Open LIVE', exact: true }).click(); await expect(live).toBeVisible();
   await live.getByRole('button', { name: 'Close LIVE' }).click(); await expect(dock).toBeVisible();
   assert.deepEqual(liveRequests, []); assert.deepEqual(errors, []);
   console.log(`PASS ${width}px: Coming Soon content, four feature rows, no functional controls/data requests, existing sheet gestures and close`);
   await context.close();
  }
 } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
