/* eslint-disable @typescript-eslint/no-require-imports */
// Run only against tests/support/friends-server.cjs and friends-app.cjs.
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || path.resolve('.npm-cache/hot-seats-qa/tools/node_modules/@playwright/test'));
(async () => {
  fs.mkdirSync('.npm-cache/account-entry-qa', { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    async function newDevice() {
      const context = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        localStorage.setItem('hot-seats.onboarding-complete.v1', 'true');
        localStorage.setItem('hot-seats.city.v1', 'Exeter');
      });
      await context.route('https://api.mapbox.com/**', route => route.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [] }) }));
      // Presets must be rendered locally, not downloaded as images.
      await context.route('https://hotseats.co.uk/avatars/presets/**', () => { throw new Error('Preset requested over the network'); });
      return context;
    }
    const context = await newDevice();
    const page = await context.newPage();
    const runtimeErrors = [];
    page.on('pageerror', error => runtimeErrors.push(error.message));
    const openAccount = target => target.getByRole('button', { name: /^Open (account|profile)/ }).filter({ visible: true }).click();
    async function signIn(target) {
      await target.getByRole('button', { name: 'Sign in', exact: true }).click();
      await target.getByLabel('Email', { exact: true }).fill('alice_studies@example.test');
      await target.getByLabel('Password', { exact: true }).fill('study-time-2026');
      await target.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(target.getByRole('dialog', { name: 'Your account', exact: true })).toBeVisible();
    }
    await page.goto('http://localhost:3105', { timeout: 120000 });
    await openAccount(page);
    await signIn(page);
    const account = page.getByRole('dialog', { name: 'Your account', exact: true });
    const editor = page.getByRole('dialog', { name: 'Edit profile', exact: true });
    const edit = () => account.getByRole('button', { name: 'Edit profile', exact: true }).click();
    const selectRadio = name => editor.getByRole('radio', { name, exact: true }).locator('..').click();
    await edit();
    await expect(editor.getByLabel('Display name', { exact: true })).toHaveValue('alice_studies');
    await expect(editor.getByText('@alice_studies', { exact: true })).toBeVisible();
    await editor.getByLabel('Display name', { exact: true }).fill('Discard me');
    await selectRadio('Soft');
    await page.keyboard.press('Escape');
    await expect(account.getByRole('button', { name: 'Edit profile', exact: true })).toBeFocused();
    await edit();
    await expect(editor.getByLabel('Display name', { exact: true })).toHaveValue('alice_studies');
    await expect(editor.locator('input[type="radio"]:checked')).toHaveCount(0);

    const writes = [];
    let failure = null;
    let releaseSave;
    let holdSave = new Promise(resolve => { releaseSave = resolve; });
    await context.route('**/rest/v1/profiles*', async route => {
      if (route.request().method() !== 'PATCH') return route.continue();
      writes.push(route.request().postDataJSON());
      if (holdSave) { await holdSave; holdSave = null; }
      if (failure) {
        const code = failure; failure = null;
        return route.fulfill({ status: code === 'PGRST116' ? 406 : 503, contentType: 'application/json', body: JSON.stringify({ code, message: 'private-database-detail' }) });
      }
      return route.continue();
    });
    for (const name of ['   ', 'x'.repeat(41)]) {
      await editor.getByLabel('Display name', { exact: true }).fill(name);
      await editor.getByRole('button', { name: 'Save changes', exact: true }).click();
      await expect(editor.getByRole('alert')).toBeVisible();
      await expect(editor.getByLabel('Display name', { exact: true })).toBeFocused();
    }
    assert.equal(writes.length, 0);
    await editor.getByLabel('Display name', { exact: true }).fill('  George  Green  ');
    await selectRadio('Oval');
    const preview = editor.locator('[aria-label="Profile preview"] svg');
    const boyPortrait = await preview.innerHTML();
    await selectRadio('Girl');
    assert.notEqual(await preview.innerHTML(), boyPortrait);
    await selectRadio('Boy');
    assert.equal(await preview.innerHTML(), boyPortrait);
    await selectRadio('Girl');
    await editor.getByRole('tab', { name: 'Appearance', exact: true }).focus();
    await page.keyboard.press('ArrowRight');
    await expect(editor.getByRole('tab', { name: 'Hair', exact: true })).toBeFocused();
    await selectRadio('Long');
    for (const [name, fill] of [['Brown', '#654637'], ['Blonde', '#bd965b'], ['Black', '#302d29'], ['Ginger', '#a85e3b']]) {
      await selectRadio(name);
      await expect(editor.getByRole('radio', { name, exact: true })).toBeChecked();
      await expect(preview.locator(`path[fill="${fill}"]`).first()).toBeVisible();
    }
    await editor.getByRole('tab', { name: 'Skin tone', exact: true }).click();
    await selectRadio('Medium');
    await editor.getByRole('tab', { name: 'Background', exact: true }).click();
    await selectRadio('Clay');
    await expect(editor.locator('[aria-label="Profile preview"] svg[data-portrait="v3"]')).toBeVisible();
    await editor.getByRole('tab', { name: 'Hair', exact: true }).click();
    for (const width of [320, 375]) {
      await page.setViewportSize({ width, height: 812 });
      const overflow = await editor.evaluate(el => el.firstElementChild.scrollWidth > el.firstElementChild.clientWidth);
      assert.equal(overflow, false);
    }
    await page.screenshot({ path: path.resolve('.npm-cache/account-entry-qa/edit-profile.png') });
    await page.setViewportSize({ width: 375, height: 460 });
    await editor.getByRole('button', { name: 'Save changes', exact: true }).scrollIntoViewIfNeeded();
    const action = await editor.getByRole('button', { name: 'Save changes', exact: true }).boundingBox();
    assert(action.y >= 0 && action.y + action.height <= 460);
    await page.setViewportSize({ width: 375, height: 812 });
    await editor.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect.poll(() => writes.length).toBe(1);
    await expect(editor.getByRole('button', { name: 'Saving changes…', exact: true })).toBeDisabled();
    await expect(editor.getByRole('button', { name: 'Cancel', exact: true })).toBeDisabled();
    await expect(page.getByText('Profile updated.', { exact: true })).toHaveCount(0);
    releaseSave();
    await expect(account.getByRole('heading', { name: 'George Green', exact: true })).toBeVisible();
    await expect(account.getByText('Profile updated.', { exact: true })).toBeVisible();
    await expect(account.locator('header svg[data-portrait="v3"]')).toBeVisible();
    assert.deepEqual(writes[0], { display_name: 'George Green', avatar_url: 'https://hotseats.co.uk/avatars/presets/v3/oval/long/tan/clay/girl/ginger' });
    await expect(page.locator('button[aria-label="Open account for alice_studies"]').filter({ visible: true }).locator('svg[data-portrait="v3"]')).toHaveCount(1);

    await edit();
    await editor.getByLabel('Display name', { exact: true }).fill('A failed edit');
    failure = 'unavailable';
    await editor.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(editor.getByRole('alert')).toContainText('try again');
    await expect(editor.getByLabel('Display name', { exact: true })).toHaveValue('A failed edit');
    failure = 'PGRST116';
    await editor.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(editor.getByRole('alert')).toContainText('could not be found');
    await editor.getByRole('button', { name: 'Cancel', exact: true }).click();
    await expect(account.getByRole('heading', { name: 'George Green', exact: true })).toBeVisible();
    await page.reload();
    await openAccount(page);
    await expect(account.getByRole('heading', { name: 'George Green', exact: true })).toBeVisible();
    await expect(account.locator('header svg[data-portrait="v3"]')).toBeVisible();

    const secondDevice = await newDevice();
    const secondPage = await secondDevice.newPage();
    await secondPage.goto('http://localhost:3105');
    await openAccount(secondPage);
    await signIn(secondPage);
    await expect(secondPage.getByRole('heading', { name: 'George Green', exact: true })).toBeVisible();
    await expect(secondPage.locator('dialog header svg[data-portrait="v3"]')).toBeVisible();
    await secondDevice.close();

    await edit();
    await selectRadio('Defined');
    await editor.getByRole('button', { name: 'Keep current avatar', exact: true }).click();
    await expect(editor.getByRole('radio', { name: 'Oval', exact: true })).toBeChecked();
    await expect(editor.getByRole('radio', { name: 'Girl', exact: true })).toBeChecked();
    await editor.getByRole('tab', { name: 'Hair', exact: true }).click();
    await expect(editor.getByRole('radio', { name: 'Ginger', exact: true })).toBeChecked();
    await editor.getByRole('button', { name: 'Save changes', exact: true }).click();
    await expect(account.locator('header svg[data-portrait="v3"]')).toBeVisible();
    assert.equal(writes.at(-1).avatar_url, undefined);
    await account.getByRole('button', { name: 'Log out', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Make yourself at home', exact: true })).toBeVisible();
    await signIn(page);
    await expect(account.getByRole('heading', { name: 'George Green', exact: true })).toBeVisible();
    await expect(account.locator('header svg[data-portrait="v3"]')).toBeVisible();
    await expect(account.getByText('@alice_studies', { exact: true })).toBeVisible();
    assert.deepEqual(runtimeErrors, []);
    console.log('PASS: cancel/focus, validation, portrait controls/keyboard tabs, live preview, mobile layout, confirmed saves/loading, shared avatar, failures/missing rows, reload, second device, keep-current and sign-out/sign-in persistence.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
