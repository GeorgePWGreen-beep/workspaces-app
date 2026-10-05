/* eslint-disable @typescript-eslint/no-require-imports */
// Run only with tests/support/friends-server.cjs and friends-app.cjs (local fixture).
const path = require('node:path');
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || path.resolve('.npm-cache/hot-seats-qa/tools/node_modules/@playwright/test'));
const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = 'http://localhost:3105';
const shots = '.npm-cache/cafe-actions-qa/screenshots'; fs.mkdirSync(shots, { recursive: true });

(async () => {
  // Reset only this isolated fixture account so interrupted runs are repeatable.
  const fixture = 'http://127.0.0.1:54335';
  const login = await (await fetch(fixture + '/auth/v1/token', { method: 'POST', body: JSON.stringify({ email: 'alice_studies@example.test', password: 'study-time-2026' }) })).json();
  const headers = { Authorization: 'Bearer ' + login.access_token };
  const rows = await (await fetch(fixture + '/rest/v1/saved_cafes?user_id=eq.' + login.user.id, { headers })).json();
  for (const row of rows) await fetch(fixture + '/rest/v1/saved_cafes?user_id=eq.' + login.user.id + '&cafe_id=eq.' + row.cafe_id, { method: 'DELETE', headers });
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of (process.env.CAFE_QA_WIDTH ? [Number(process.env.CAFE_QA_WIDTH)] : [360, 375, 393, 1440])) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        // Do not complete onboarding: a public shared link must open for a new visitor.
        Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: undefined });
        Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => { window.copiedLink = text; } } });
      });
      await context.route('https://api.mapbox.com/**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [] }) }));
      await context.route('**/_next/image*', r => r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync('public/cafes/hot-numbers.jpg') }));
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const click = name => page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
      const details = () => width < 768 ? page.getByRole('dialog', { name: 'Arrietty details' }) : page.getByRole('complementary', { name: 'Arrietty details' });
      const expand = async () => {
        if (width >= 768) return;
        await page.waitForTimeout(700);
        const box = await details().boundingBox();
        if (box.y > 100) {
          await page.mouse.move(width / 2, box.y + 22); await page.mouse.down();
          await page.mouse.move(width / 2, 44, { steps: 25 }); await page.mouse.up(); await page.waitForTimeout(700);
        }
      };
      const openDetails = async () => {
        await page.goto(app + '/?cafe=arrietty', { timeout: 120000 });
        await expect(details()).toBeVisible(); await expand();
        await details().getByRole('button', { name: 'Directions', exact: true }).scrollIntoViewIfNeeded();
      };
      const closeDetails = async () => {
        if (width < 768) await page.getByRole('button', { name: 'Close cafe details', exact: true }).filter({ visible: true }).click({ position: { x: 5, y: 5 } });
        else await click('Close cafe details');
        await expect(details()).not.toBeVisible();
      };
      const openSaved = async () => {
        await click(width < 768 ? 'Open Saved' : 'Saved');
        await expect(page.getByRole('heading', { name: 'Saved', exact: true })).toBeVisible();
        await page.waitForTimeout(800);
      };
      const saveButton = () => details().getByRole('button', { name: 'Save', exact: true });
      const savedButton = () => details().getByRole('button', { name: 'Saved', exact: true });
      await openDetails();
      await click('Share'); await expect(page.getByText('Link copied', { exact: true })).toBeVisible();
      assert.equal(await page.evaluate(() => window.copiedLink), app + '/?cafe=arrietty');
      await page.evaluate(() => { navigator.clipboard.writeText = async () => { throw new Error('denied'); }; });
      await click('Share'); await expect(details().getByRole('alert')).toContainText("Couldn't copy the link");
      await page.evaluate(() => { Object.defineProperty(navigator, 'share', { configurable: true, writable: true, value: async data => { window.sharedCafe = data; } }); });
      await click('Share');
      assert.deepEqual(await page.evaluate(() => window.sharedCafe), { title: 'Arrietty on Hot Seats', text: 'Check out Arrietty on Hot Seats', url: app + '/?cafe=arrietty' });
      await page.evaluate(() => { navigator.share = async () => { throw new DOMException('Cancelled', 'AbortError'); }; });
      await click('Share'); await expect(details().getByRole('alert')).toHaveCount(0);
      await page.evaluate(() => { navigator.share = async () => { throw new Error('denied'); }; });
      await click('Share'); await expect(details().getByRole('alert')).toContainText("Couldn't share");
      await click('Directions');
      const chooser = page.getByRole('dialog', { name: 'Directions', exact: true });
      await expect(chooser).toBeVisible();
      for (const name of ['Apple Maps', 'Google Maps']) {
        const link = chooser.getByRole('link', { name: new RegExp(name) });
        const url = new URL(await link.getAttribute('href'));
        assert.match(url.searchParams.get(name === 'Apple Maps' ? 'daddr' : 'destination'), /^50\./);
        assert.equal(await link.getAttribute('target'), '_blank');
        const rect = await link.boundingBox(); assert(rect.height >= 44 && rect.x >= 0 && rect.x + rect.width <= width);
      }
      await page.screenshot({ path: `${shots}/directions-${width}.png` });
      await page.keyboard.press('Escape'); await expect(chooser).not.toBeVisible();
      await click('Directions'); await chooser.click({ position: { x: 2, y: 2 } }); await expect(chooser).not.toBeVisible();
      await click('Directions'); await click('Close directions');
      await saveButton().click();
      await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
      await page.getByLabel('Email', { exact: true }).fill('alice_studies@example.test');
      await page.getByLabel('Password', { exact: true }).fill('study-time-2026');
      await page.locator('dialog[open]').getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();
      await click('Close account'); await expect(saveButton()).toBeEnabled();

      // Delay writes to prove state updates before the server responds.
      const delay = async route => { if (['POST', 'DELETE'].includes(route.request().method())) await new Promise(resolve => setTimeout(resolve, 700)); await route.continue(); };
      await context.route('**/rest/v1/saved_cafes*', delay);
      const before = await saveButton().boundingBox();
      await saveButton().click(); await expect(savedButton()).toBeVisible(); await expect(savedButton()).toBeDisabled();
      const after = await savedButton().boundingBox(); assert(Math.abs(before.width - after.width) < 1);
      await expect(savedButton()).toBeEnabled(); await context.unroute('**/rest/v1/saved_cafes*', delay);
      await page.reload(); await expect(details()).toBeVisible(); await expand();
      await savedButton().scrollIntoViewIfNeeded(); await expect(savedButton()).toBeEnabled();
      for (const name of ['Saved', 'Share', 'Directions']) {
        const rect = await details().getByRole('button', { name, exact: true }).boundingBox();
        assert(rect.height >= 44 && rect.width >= 44 && rect.x >= 0 && rect.x + rect.width <= width);
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert(await details().evaluate(e => e.scrollWidth <= e.clientWidth));
      await page.screenshot({ path: `${shots}/actions-${width}.png` });
      await closeDetails(); await openSaved();
      const card = page.locator('.hs-cafe-list-card').filter({ hasText: 'Arrietty' });
      await expect(card).toBeVisible(); assert.equal(await card.evaluate(e => getComputedStyle(e).backgroundColor), 'rgb(247, 250, 245)');
      await page.screenshot({ path: `${shots}/saved-${width}.png` });
      await card.click(); await expect(details()).toBeVisible(); await expand();
      await savedButton().scrollIntoViewIfNeeded(); await expect(savedButton()).toBeEnabled();
      await closeDetails(); await openSaved();
      const failDelete = route => route.request().method() === 'DELETE' ? route.fulfill({ status: 503, body: '{}' }) : route.continue();
      await context.route('**/rest/v1/saved_cafes*', failDelete);
      await click('Remove Arrietty from Saved'); await expect(page.getByText("Couldn't remove this cafe. Please try again.")).toBeVisible();
      await expect(card).toBeVisible(); await context.unroute('**/rest/v1/saved_cafes*', failDelete);
      await click('Remove Arrietty from Saved');
      await expect(page.getByText("Save your favourite study spots and they'll appear here.")).toBeVisible();
      await click('Close Saved');
      await openDetails(); await expect(saveButton()).toBeEnabled();
      const failSave = route => route.request().method() === 'POST' ? route.fulfill({ status: 503, body: '{}' }) : route.continue();
      await context.route('**/rest/v1/saved_cafes*', failSave);
      await saveButton().click(); await expect(details().getByRole('alert')).toContainText("Couldn't save"); await expect(saveButton()).toBeEnabled();
      await context.unroute('**/rest/v1/saved_cafes*', failSave);
      await saveButton().click(); await expect(savedButton()).toBeEnabled();
      await savedButton().click(); await expect(saveButton()).toBeEnabled();
      await closeDetails(); await openSaved();
      await expect(page.getByText("Save your favourite study spots and they'll appear here.")).toBeVisible();
      if (width === 393) {
        await click('Close Saved');
        const failLoad = route => route.request().method() === 'GET' ? route.fulfill({ status: 503, body: '{}' }) : route.continue();
        await context.route('**/rest/v1/saved_cafes*', failLoad);
        await openDetails(); await expect(details().getByRole('alert')).toContainText("Couldn't load your saved cafes", { timeout: 30000 });
        await expect(saveButton()).toBeDisabled();
        await context.unroute('**/rest/v1/saved_cafes*', failLoad);
        await click('Try again'); await expect(saveButton()).toBeEnabled();
        await saveButton().click(); await expect(savedButton()).toBeEnabled();
        await closeDetails(); await click('Open account for alice_studies'); await click('Log out');
        await click('Close account'); await openSaved();
        await expect(page.getByText('Sign in to keep your favourite study spots together.')).toBeVisible();
        await expect(card).toHaveCount(0);
        // Clean up through the local fixture account, not a production session.
        const savedRows = await (await fetch(fixture + '/rest/v1/saved_cafes?user_id=eq.' + login.user.id, { headers })).json();
        for (const row of savedRows) await fetch(fixture + '/rest/v1/saved_cafes?user_id=eq.' + login.user.id + '&cafe_id=eq.' + row.cafe_id, { method: 'DELETE', headers });
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: deep link, auth, share branches, directions, saved tint, optimistic writes, rollback, reload, no overflow`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
