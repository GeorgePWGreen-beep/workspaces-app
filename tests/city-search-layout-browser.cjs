/* eslint-disable @typescript-eslint/no-require-imports */
// Run with friends-server.cjs, search-server.cjs and friends-app.cjs --search.
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || path.resolve('.npm-cache/hot-seats-qa/tools/node_modules/@playwright/test'));
const shots = '.npm-cache/search-qa/city-pills';
fs.mkdirSync(shots, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [320, 375, 393, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        localStorage.setItem('hot-seats.onboarding-complete.v1', 'true');
        if (!localStorage.getItem('hot-seats.city.v1')) localStorage.setItem('hot-seats.city.v1', 'Exeter');
        localStorage.setItem('hot-seats.nearby-guidance.v1', 'seen');
      });
      await context.route('https://api.mapbox.com/**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [] }) }));
      await context.route('**/_next/image*', r => r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync('public/cafes/hot-numbers.jpg') }));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto('http://localhost:3106', { timeout: 120000 });
      const header = page.locator('[data-map-search-controls]');
      const input = page.getByRole('combobox').filter({ visible: true });
      const popup = page.getByRole('dialog', { name: 'Cafe suggestions' });
      const cityButton = () => width < 768 ? header.getByRole('button', { name: /^Change city/ }) : page.getByRole('button', { name: 'Change city', exact: true }).filter({ visible: true });
      const changeCity = async city => {
        await cityButton().click();
        await page.getByRole('dialog', { name: 'Where are you studying?' }).getByRole('button', { name: city, exact: true }).click();
        await expect(input).toHaveValue('');
        await expect(popup).not.toBeVisible();
      };
      const checkLayout = async city => {
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        if (width >= 768) { await expect(header).not.toBeVisible(); return; }
        await expect(cityButton()).toHaveAccessibleName(`Change city, currently ${city}`);
        const cityRect = await cityButton().boundingBox();
        const searchRect = await input.locator('..').boundingBox();
        assert.equal(cityRect.y, searchRect.y);
        assert.equal(cityRect.height, searchRect.height);
        assert(cityRect.height >= 44 && cityRect.width >= 44);
        assert(Math.abs(searchRect.x - cityRect.x - cityRect.width - 8) < 1);
        assert(searchRect.x + searchRect.width <= width - 19);
        assert(await cityButton().evaluate(el => el.scrollWidth <= el.clientWidth));
        assert(await input.evaluate(el => getComputedStyle(el).textOverflow !== 'ellipsis'));
        await expect(input).toHaveAttribute('placeholder', 'Search cafés...');
      };
      const mapInCity = async longitude => {
        await page.waitForFunction(lng => {
          const el = document.querySelector('.mapboxgl-map');
          if (!el) return false;
          let fiber = el[Object.keys(el).find(key => key.startsWith('__reactFiber'))];
          while (fiber) {
            let hook = fiber.memoizedState;
            while (hook) {
              const map = hook.memoizedState?.current;
              if (map?.getCenter && map?.fitBounds) return map.loaded() && Math.abs(map.getCenter().lng - lng) < .1;
              hook = hook.next;
            }
            fiber = fiber.return;
          }
          return false;
        }, longitude);
      };
      await expect(input).toBeVisible();
      await checkLayout('Exeter');
      await input.fill('coffee');
      await expect(popup).toBeVisible();
      await input.press('ArrowDown');
      await expect(popup.getByRole('button').first()).toBeFocused();
      await page.keyboard.press('Escape');
      await expect(input).toBeFocused();
      await expect(popup).not.toBeVisible();
      await input.fill('Suki Cafe');
      await input.press('Enter');
      await expect(page.getByRole(width < 768 ? 'dialog' : 'complementary', { name: 'Suki Cafe details' })).toBeVisible();
      assert(new URL(page.url()).searchParams.has('cafe'));
      await changeCity('Cambridge');
      await expect(page.getByRole(width < 768 ? 'dialog' : 'complementary', { name: 'Suki Cafe details' })).not.toBeVisible();
      assert(!new URL(page.url()).searchParams.has('cafe'));
      await checkLayout('Cambridge');
      await mapInCity(.1218);
      assert.equal(await page.evaluate(() => localStorage.getItem('hot-seats.city.v1')), 'Cambridge');
      await page.screenshot({ path: `${shots}/cambridge-${width}.png` });
      await input.fill('suki'); await expect(popup).toContainText('No matching cafes');
      await input.fill('bould'); await expect(popup.getByRole('button', { name: /Bould Brothers Coffee/ })).toBeVisible();
      if (width < 768) {
        const rect = await popup.boundingBox();
        assert(Math.abs(rect.x - 20) < 1 && Math.abs(rect.width - (width - 40)) < 1);
        const hit = await popup.getByRole('button').first().evaluate(el => {
          const r = el.getBoundingClientRect(); return el.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
        });
        assert(hit, 'suggestions must be unobscured');
        await page.screenshot({ path: `${shots}/suggestions-${width}.png` });
        await page.evaluate(() => {
          Object.defineProperty(visualViewport, 'height', { configurable: true, value: 300 });
          visualViewport.dispatchEvent(new Event('resize'));
        });
        const small = await popup.boundingBox(); assert(small.y + small.height <= 288);
        await page.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event('resize')); });
      }
      const query = 'Bould Brothers Coffee near the city centre';
      await input.fill(query); await expect(input).toHaveValue(query);
      await page.getByRole('button', { name: 'Clear search', exact: true }).filter({ visible: true }).click();
      await expect(input).toHaveValue(''); await expect(input).toBeFocused(); await expect(popup).not.toBeVisible();
      await page.reload();
      await expect(input).toBeVisible(); await checkLayout('Cambridge'); await mapInCity(.1218);
      await input.fill('bould'); await changeCity('Exeter'); await checkLayout('Exeter'); await mapInCity(-3.5339);
      await input.fill('suki'); await expect(popup.getByRole('button', { name: /Suki Cafe/ })).toBeVisible();
      assert.deepEqual(errors, []);
      console.log(`PASS ${width}px: pill layout, city switching/map/persistence, selection reset, suggestions, keyboard, clear and full query value`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
