/* eslint-disable @typescript-eslint/no-require-imports */
// Start friends-server.cjs, search-server.cjs and friends-app.cjs --search first.
const path = require('node:path');
const { chromium, expect } = require(process.env.PLAYWRIGHT_MODULE || path.resolve('.npm-cache/hot-seats-qa/tools/node_modules/@playwright/test'));
const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = 'http://localhost:3106';
const shots = '.npm-cache/search-qa/screenshots';
fs.mkdirSync(shots, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of (process.env.SEARCH_QA_WIDTH ? [Number(process.env.SEARCH_QA_WIDTH)] : [390, 360, 1440])) {
      const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        localStorage.setItem('hot-seats.onboarding-complete.v1', 'true');
        localStorage.setItem('hot-seats.city.v1', 'Exeter');
        localStorage.setItem('hot-seats.nearby-guidance.v1', 'seen');
      });
      // Keep the real Mapbox camera, projection, canvas and markers; stub tile services only.
      await context.route('https://api.mapbox.com/**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [] }) }));
      await context.route('**/_next/image*', r => r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync('public/cafes/hot-numbers.jpg') }));
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(app, { timeout: 120000 });
      const input = page.getByRole('combobox').filter({ visible: true });
      const suggestions = page.getByRole('dialog', { name: 'Cafe suggestions' });
      const click = name => page.getByRole('button', { name: name === 'Filters' ? /^Filters(?:,|$)/ : name, exact: true }).filter({ visible: true }).first().click();
      await expect(input).toBeVisible();
      await page.waitForFunction(() => {
        const element = document.querySelector('.mapboxgl-map');
        if (!element) return false;
        // Test-only access through React refs avoids shipping a production debug API.
        let fiber = element[Object.keys(element).find(key => key.startsWith('__reactFiber'))];
        while (fiber) {
          let hook = fiber.memoizedState;
          while (hook) {
            const candidate = hook.memoizedState?.current;
            if (candidate?.getCenter && candidate?.fitBounds) { window.searchMap = candidate; return candidate.loaded(); }
            hook = hook.next;
          }
          fiber = fiber.return;
        }
        return false;
      });
      await page.evaluate(() => {
        window.cameraCalls = [];
        for (const method of ['fitBounds', 'flyTo']) {
          const original = window.searchMap[method];
          window.searchMap[method] = function (...args) {
            window.cameraCalls.push({ method, args }); return original.apply(this, args);
          };
        }
      });
      const calls = () => page.evaluate(() => window.cameraCalls.length);
      const settled = () => page.waitForTimeout(950);
      const fits = () => page.evaluate(() => window.cameraCalls.filter(call => call.method === 'fitBounds').length);
      const checkOverflow = async () => assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const checkPins = async () => {
        const positions = await page.evaluate(() => {
          const map = window.searchMap, rect = map.getContainer().getBoundingClientRect();
          const popup = [...document.querySelectorAll('[data-cafe-search-popup]')].map(el => el.getBoundingClientRect()).find(rect => rect.width > 0);
          const sheet = document.querySelector('.hs-bottom-sheet')?.getBoundingClientRect();
          return [...document.querySelectorAll('.hs-map-marker')].filter(el => el.style.display !== 'none').map(el => {
            const pin = el.getBoundingClientRect();
            return { name: el.textContent, x: pin.left - rect.left, y: pin.top - rect.top, right: pin.right - rect.left, bottom: pin.bottom - rect.top, width: rect.width, height: rect.height,
              visibleTop: innerWidth < 768 ? Math.max(250, popup?.bottom ?? 0) : 0, visibleBottom: innerWidth < 768 ? Math.min(innerHeight - 90, sheet?.top ?? innerHeight) : innerHeight };
          });
        });
        assert(positions.length);
        for (const pin of positions) assert(pin.x >= 0 && pin.right <= pin.width && pin.y >= pin.visibleTop && pin.bottom <= pin.visibleBottom, JSON.stringify(pin));
      };

      await input.fill('s'); await expect(suggestions).not.toBeVisible();
      for (const [query, name] of [['suk', 'Suki Cafe'], ['sun', 'The Sunset Society'], ['18', '18g Coffee Roasters'], ['sukki', 'Suki Cafe'], ['ariety', 'Arrietty'], ['boatyerd', 'Boatyard Bakery']]) {
        await input.fill(query);
        await expect(suggestions.getByRole('button', { name: new RegExp(name) })).toBeVisible();
      }
      await input.fill('sukki'); await settled();
      assert(Math.abs(await page.evaluate(() => window.searchMap.getZoom()) - 16) < 0.01);
      await page.screenshot({ path: `${shots}/typo-${width}.png` });
      await suggestions.getByRole('button', { name: /Suki Cafe/ }).click();
      await expect(suggestions).not.toBeVisible();
      const details = width < 768 ? page.getByRole('dialog', { name: 'Suki Cafe details' }) : page.getByRole('complementary', { name: 'Suki Cafe details' });
      await expect(details).toBeVisible();
      assert(await page.evaluate(() => document.activeElement.tagName !== 'INPUT'));
      await settled(); await checkPins();
      await page.screenshot({ path: `${shots}/selected-${width}.png` });
      await click('Close cafe details'); await expect(details).not.toBeVisible();
      await input.fill('coffee'); await settled();
      assert(await suggestions.getByRole('button').count() > 1);
      const beforeEnter = await calls();
      await input.press('Enter'); await expect(suggestions).toBeVisible();
      assert.equal(await calls(), beforeEnter);
      await checkPins(); await checkOverflow();
      await page.screenshot({ path: `${shots}/multiple-${width}.png` });
      if (width < 768) {
        // Simulate the visual viewport shrinking when a software keyboard opens.
        await page.evaluate(() => {
          Object.defineProperty(visualViewport, 'height', { configurable: true, value: 300 });
          visualViewport.dispatchEvent(new Event('resize'));
        });
        const popupRect = await suggestions.boundingBox();
        assert(popupRect.y + popupRect.height <= 288);
        assert(await suggestions.evaluate(element => element.scrollHeight > element.clientHeight));
        await checkOverflow();
        await page.evaluate(() => { delete visualViewport.height; visualViewport.dispatchEvent(new Event('resize')); });
      }
      await input.press('ArrowDown');
      await expect(suggestions.getByRole('button').first()).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(suggestions.getByRole('button').nth(1)).toBeFocused();
      await page.keyboard.press('Escape'); await expect(suggestions).not.toBeVisible(); await expect(input).toBeFocused();

      const beforePan = await calls();
      const mapRect = await page.locator('.mapboxgl-canvas').boundingBox();
      const x = mapRect.x + mapRect.width * 0.6, y = 380;
      await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 30, y + 25, { steps: 5 }); await page.mouse.up();
      await settled(); assert.equal(await calls(), beforePan, 'manual pan must not trigger a results refit');
      const beforeZoom = await page.evaluate(() => window.searchMap.getZoom());
      await page.mouse.wheel(0, 250); await settled();
      assert.notEqual(await page.evaluate(() => window.searchMap.getZoom()), beforeZoom, 'manual wheel zoom works');
      assert.equal(await calls(), beforePan, 'manual zoom must not refit');
      const beforeFilter = await fits();
      await click('Quiet'); await settled(); assert(await fits() > beforeFilter, 'quick filter fits results');
      await checkPins();
      await click('Clear search'); await settled();
      await expect(input).toHaveValue(''); await expect(suggestions).not.toBeVisible();
      await expect(page.getByRole('button', { name: 'Quiet', exact: true }).filter({ visible: true })).toHaveAttribute('aria-pressed', 'true');
      const quietNames = await page.locator('.hs-map-marker:visible button').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label')));
      await input.fill('zzzzzzzz'); await settled();
      await expect(suggestions).toContainText('No matching cafes');
      assert.equal(await page.locator('.hs-map-marker:visible').count(), 0);
      const emptyCamera = await page.evaluate(() => [window.searchMap.getCenter().toArray(), window.searchMap.getZoom()]);
      await input.fill('zzzzzzzzx'); await settled();
      assert.deepEqual(await page.evaluate(() => [window.searchMap.getCenter().toArray(), window.searchMap.getZoom()]), emptyCamera);
      await page.screenshot({ path: `${shots}/empty-${width}.png` });
      await click('Clear search'); await settled();
      assert.deepEqual(await page.locator('.hs-map-marker:visible button').evaluateAll(buttons => buttons.map(button => button.getAttribute('aria-label'))), quietNames);
      await click('Quiet'); await settled();
      await input.fill('ariety'); await input.press('Enter');
      await expect(width < 768 ? page.getByRole('dialog', { name: 'Arrietty details' }) : page.getByRole('complementary', { name: 'Arrietty details' })).toBeVisible();
      await click('Close cafe details'); await click('Clear search'); await input.press('Tab'); await settled();

      if (width < 768) {
        await expect(page.getByRole('button', { name: 'Open Nearby' })).toBeVisible();
        const beforeSheet = await calls();
        await click('Open Nearby'); await settled(); assert.equal(await calls(), beforeSheet, 'opening Nearby must not move the camera');
        await expect(page.getByRole('region', { name: 'nearby workspaces' })).toBeVisible();
      }
      await click('Filters');
      const beforeFullFilter = await fits();
      await page.getByRole('dialog', { name: 'Filters', exact: true }).getByRole('button', { name: '80+', exact: true }).click();
      await settled(); assert(await fits() > beforeFullFilter, 'full filter sheet fits the reduced cafe set');
      await click('Close filters'); await settled(); await checkPins();
      assert.equal(await page.locator('.hs-map-marker:visible').count(), 2);
      const beforeSheetGesture = await calls();
      if (width < 768) {
        const region = page.getByRole('region', { name: 'nearby workspaces' });
        const rect = await region.boundingBox();
        await page.mouse.move(width / 2, rect.y + 22); await page.mouse.down();
        await page.mouse.move(width / 2, 44, { steps: 25 }); await page.mouse.up(); await settled();
        assert.equal(await calls(), beforeSheetGesture, 'sheet drag must not move the map');
        await page.screenshot({ path: `${shots}/nearby-${width}.png` });
      }
      await click('Filters');
      const beforeEmptyFilter = await calls();
      await page.getByRole('dialog', { name: 'Filters', exact: true }).getByRole('button', { name: '90+', exact: true }).click();
      await settled(); assert.equal(await calls(), beforeEmptyFilter, 'zero-result filter must leave camera alone');
      await click('Clear all'); await click('Close filters'); await settled();
      await click('Change city');
      await click('Cambridge');
      await input.fill('suki'); await expect(suggestions).toContainText('No matching cafes');
      await input.fill('bould'); await expect(suggestions.getByRole('button', { name: /Bould Brothers Coffee/ })).toBeVisible();
      await checkOverflow();
      assert.deepEqual(errors, []);
      console.log(`${width}x844: partial/typo search, keyboard, selection, real Mapbox focus/fit, filters, clear, empty, city, Nearby and overflow passed`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
