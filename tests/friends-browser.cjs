/* eslint-disable @typescript-eslint/no-require-imports */
// Run against the isolated fixture described in docs/friends-v1.md, never live Auth.
const path = require('node:path');
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || path.resolve('.npm-cache/hot-seats-qa/tools/node_modules/@playwright/test'));
const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = process.env.FRIENDS_QA_APP_URL || 'http://localhost:3105';
assert(['localhost', '127.0.0.1'].includes(new URL(app).hostname));
const shots = '.npm-cache/friends-qa/screenshots'; fs.mkdirSync(shots, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [390, 360, 1440]) {
      const errors = [];
      const make = async () => {
        const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
        await context.addInitScript(() => {
          localStorage.setItem('hot-seats.onboarding-complete.v1', 'true');
          localStorage.setItem('hot-seats.city.v1', 'Exeter');
          localStorage.setItem('hot-seats.nearby-guidance.v1', 'seen');
        });
        await context.route('https://api.mapbox.com/**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [] }) }));
        await context.route('https://avatars.example.test/**', r => r.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><rect width="44" height="44" fill="#c7d5b7"/><circle cx="22" cy="17" r="8" fill="#435e3e"/><path d="M7 44V34a15 15 0 0 1 30 0v10" fill="#435e3e"/></svg>' }));
        const page = await context.newPage();
        page.on('pageerror', e => errors.push(e.message));
        await page.goto(app, { timeout: 120000 });
        await page.getByRole('button', { name: width < 768 ? 'Open Friends' : 'Friends', exact: true }).click();
        await expect(page.getByText('Sign in to connect with friends.', { exact: true })).toBeVisible();
        return { context, page };
      };
      const click = (p, name) => p.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
      const snapshot = async (p, name) => {
        await p.waitForTimeout(250);
        assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        const panel = width < 768 ? p.getByRole('region', { name: 'friends workspaces' }) : p.getByRole('complementary', { name: 'Friends' });
        assert(await panel.evaluate(e => e.scrollWidth <= e.clientWidth));
        await p.screenshot({ path: `${shots}/${name}-${width}.png` });
      };
      const login = async (p, username) => {
        await click(p, 'Sign in');
        await expect(p.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
        await p.getByLabel('Email', { exact: true }).fill(username + '@example.test');
        await p.getByLabel('Password', { exact: true }).fill('study-time-2026');
        await p.locator('dialog[open]').getByRole('button', { name: 'Sign in', exact: true }).click();
        await expect(p.getByRole('heading', { name: 'Your account' })).toBeVisible();
        await click(p, 'Close account');
        await expect(p.getByRole('button', { name: 'Refresh friends' })).toBeEnabled();
      };
      const search = async (p, username) => { await p.getByLabel('Find by username', { exact: true }).fill(username); await click(p, 'Search users'); };
      const { context, page } = await make();
      await snapshot(page, 'signed-out');
      await click(page, 'Create account');
      await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible();
      await click(page, 'Close account');
      await login(page, 'alice_studies');
      await expect(page.getByRole('button', { name: 'Friends (0)', exact: true })).toBeVisible();
      await snapshot(page, 'empty');
      await click(page, 'Find friends');
      await search(page, '@ALICE_STUDIES'); await expect(page.getByText('That’s you. Search for a friend’s username.')).toBeVisible();
      await search(page, 'nobody_here'); await expect(page.getByText('No user found. Check the full username and try again.')).toBeVisible();
      await search(page, '@BOB_STUDIES'); await expect(page.getByRole('button', { name: 'Add friend', exact: true })).toBeVisible();
      await snapshot(page, 'search');
      await click(page, 'Add friend'); await expect(page.getByText('Friend request sent.', { exact: true })).toBeVisible();
      await click(page, 'Cancel request'); await expect(page.getByText('Request cancelled.', { exact: true })).toBeVisible();
      await click(page, 'Add friend'); await click(page, 'Requests (1)');
      await expect(page.getByRole('region', { name: 'Outgoing requests' }).getByText('@bob_studies')).toBeVisible();
      await snapshot(page, 'outgoing');
      const { context: recipientContext, page: recipient } = await make();
      await login(recipient, 'bob_studies'); await click(recipient, 'Requests (1)');
      await expect(recipient.getByRole('region', { name: 'Incoming requests' }).getByText('@alice_studies')).toBeVisible();
      await snapshot(recipient, 'incoming');
      await click(recipient, 'Decline'); await expect(recipient.getByText('Request declined.', { exact: true })).toBeVisible();
      // Stale outgoing cancellation must surface an inline error and reconcile state.
      await click(page, 'Cancel request'); await expect(page.locator('[role=alert]:not(#__next-route-announcer__)')).toContainText('changed or was removed');
      await click(page, 'Add friend'); await click(recipient, 'Refresh friends');
      await click(recipient, 'Accept'); await expect(recipient.getByText('You’re now friends.', { exact: true })).toBeVisible();
      await click(page, 'Refresh friends'); await click(page, 'Friends (1)');
      await expect(page.getByText('@bob_studies').last()).toBeVisible();
      // Clear the search result so the accepted-list actions are unambiguous.
      await page.getByLabel('Find by username').fill('');
      await snapshot(page, 'accepted');
      await click(page, 'Remove'); await snapshot(page, 'remove');
      await context.route('**/rest/v1/friendships*', r => r.request().method() === 'DELETE' ? r.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Temporary test outage' }) }) : r.continue());
      await click(page, 'Remove friend'); await expect(page.locator('[role=alert]:not(#__next-route-announcer__)')).toContainText('Check your connection');
      await expect(page.getByRole('button', { name: 'Friends (1)', exact: true })).toBeVisible();
      await context.unroute('**/rest/v1/friendships*');
      await click(page, 'Remove friend'); await expect(page.getByText('Friend removed.', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Friends (0)', exact: true })).toBeVisible();
      await context.route('**/rest/v1/rpc/get_friendships*', r => r.fulfill({ status: 503, body: '{}' }));
      await click(page, 'Refresh friends'); await expect(page.locator('[role=alert]:not(#__next-route-announcer__)')).toContainText('couldn’t be loaded');
      await context.unroute('**/rest/v1/rpc/get_friendships*'); await click(page, 'Retry friends');
      await expect(page.getByRole('button', { name: 'Refresh friends' })).toBeEnabled();
      await click(page, 'Close Friends');
      if (width < 768) {
        await expect(page.getByRole('button', { name: 'Open Friends' })).toBeVisible();
        await click(page, 'Open Saved'); await expect(page.getByText('Save your favourite study spots and they\'ll appear here.')).toBeVisible();
        // Drag down from collapsed to dismiss; the existing dock must return.
        await page.waitForTimeout(600);
        const sheet = page.locator('.hs-bottom-sheet'); const box = await sheet.boundingBox();
        await page.mouse.move(width / 2, box.y + 20); await page.mouse.down(); await page.mouse.move(width / 2, 840, { steps: 20 }); await page.mouse.up();
        await expect(page.getByRole('button', { name: 'Open Nearby' })).toBeVisible();
        await click(page, 'Open Nearby'); await expect(page.getByRole('heading', { name: 'Best seats in Exeter' })).toBeVisible();
      } else {
        await expect(page.getByRole('complementary', { name: 'Friends' })).toHaveCount(0);
        await page.setViewportSize({ width: 390, height: 844 });
        await expect(page.getByRole('button', { name: 'Open Friends' })).toBeVisible();
        await expect(page.locator('.hs-bottom-sheet')).toHaveCount(0);
        await click(page, 'Open Friends');
        await expect(page.getByRole('region', { name: 'friends workspaces' })).toBeVisible();
        await page.setViewportSize({ width: 1440, height: 844 });
        await expect(page.getByRole('complementary', { name: 'Friends' })).toBeVisible();
        await click(page, 'Close Friends');
        await expect(page.getByRole('complementary', { name: 'Friends' })).toHaveCount(0);
      }
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, result: 'PASS', flows: 'signed out, auth entry, search, send, cancel, decline, stale, accept, remove failure/retry, load failure/retry, navigation', horizontalOverflow: false }));
      await context.close(); await recipientContext.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
