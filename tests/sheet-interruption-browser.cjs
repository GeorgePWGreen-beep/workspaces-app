/* eslint-disable @typescript-eslint/no-require-imports */
// Local fixtures: friends-server.cjs, search-server.cjs, friends-app.cjs --search.
// Chromium uses real touch input; WebKit checks the same pointer/spring paths.
const path = require('node:path'), fs = require('node:fs'), assert = require('node:assert/strict');
const playwright = require(process.env.PLAYWRIGHT_MODULE || path.resolve('.npm-cache/hot-seats-qa/tools/node_modules/@playwright/test'));
const expect = playwright.expect.configure({ timeout: 15000 });
const engine = process.env.QA_BROWSER || 'chromium';
const app = process.env.SHEET_QA_URL || 'http://localhost:3106';
assert(['localhost', '127.0.0.1'].includes(new URL(app).hostname));
const output = '.npm-cache/sheet-performance'; fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await playwright[engine].launch({ headless: true });
  const measurements = [];
  try {
    for (const width of (process.env.SHEET_QA_WIDTH ? [Number(process.env.SHEET_QA_WIDTH)] : [390, 360])) {
      for (const fresh of [true, false]) {
        const height = width === 360 ? 780 : 844;
        const context = await browser.newContext({ viewport: { width, height }, isMobile: engine === 'chromium', hasTouch: engine === 'chromium' });
        await context.addInitScript(() => {
          window.__sheetInputs = [];
          for (const type of ['pointerdown', 'pointerup', 'pointercancel', 'lostpointercapture', 'dragstart', 'dragend']) document.addEventListener(type, event => {
            const target = event.target instanceof Element ? event.target : null;
            window.__sheetInputs.push({ type, pointer: event.pointerId, target: target?.tagName, inSheet: !!target?.closest('.hs-bottom-sheet'), y: event.clientY, transform: document.querySelector('.hs-bottom-sheet')?.style.transform });
            if (window.__sheetInputs.length > 60) window.__sheetInputs.shift();
          }, true);
        });
        if (!fresh) await context.addInitScript(() => {
          localStorage.setItem('hot-seats.onboarding-complete.v1', 'true');
          localStorage.setItem('hot-seats.nearby-guidance.v1', 'seen');
          localStorage.setItem('hot-seats.city.v1', 'Exeter');
        });
        await context.route('https://api.mapbox.com/**', r => r.fulfill({ contentType: 'application/json', body: JSON.stringify({ version: 8, sources: {}, layers: [] }) }));
        await context.route('**/_next/image*', r => r.fulfill({ contentType: 'image/jpeg', body: fs.readFileSync('public/cafes/hot-numbers.jpg') }));
        const page = await context.newPage(), errors = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('console', message => { if (/hydration|did not match|server rendered HTML/i.test(message.text())) errors.push(message.text()); });
        const cdp = engine === 'chromium' ? await context.newCDPSession(page) : null;
        let pointerY = 0, pointerX = width / 2;
        const move = async y => {
          pointerY = y;
          if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: pointerX, y, id: 1 }] });
          else await page.mouse.move(pointerX, y);
        };
        const down = async (y, x = width / 2) => {
          pointerY = y;
          pointerX = x;
          if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
          else { await page.mouse.move(x, y); await page.mouse.down(); }
        };
        const up = async () => {
          if (cdp) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          else await page.mouse.up();
        };
        const click = name => page.getByRole('button', { name, exact: true }).filter({ visible: true }).first().click();
        const sheet = page.locator('.hs-bottom-sheet');
        const top = () => sheet.evaluate(e => e.getBoundingClientRect().top);
        const flushMotion = () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const content = () => sheet.locator(':scope > div').nth(1);
        const rest = async state => {
          if (state === 'closed') {
            await expect(sheet).toHaveCount(0);
            await expect(page.getByRole('button', { name: 'Open Nearby' })).toBeVisible();
          } else {
            try {
              await expect.poll(async () => Math.abs(await top() - height * (state === 'expanded' ? .05 : .55))).toBeLessThan(1);
            } catch (error) {
              fs.writeFileSync(`${output}/${engine}-input-failure.json`, JSON.stringify(await page.evaluate(() => window.__sheetInputs), null, 2));
              throw error;
            }
            await page.waitForTimeout(150);
          }
        };
        const gesture = async (distance, { slow = false, body = false, rapid = false } = {}) => {
          const heading = body ? await sheet.getByRole('heading').first().boundingBox() : null;
          if (rapid) await down(height - 210, 8); // Interior stays under the finger during moving hit-testing.
          else await down(heading ? heading.y + heading.height / 2 : await top() + 20);
          const start = pointerY, steps = slow ? 20 : 4;
          for (let step = 1; step <= steps; step++) {
            await move(Math.max(4, Math.min(height - 4, start + distance * step / steps)));
            await page.waitForTimeout(slow ? 20 : 8);
          }
          if (slow) await page.waitForTimeout(130); // Remove flick velocity; test distance thresholds.
          await up();
        };
        const grab = async (name, delta) => {
          if (name === 'opening') {
            await page.waitForFunction(() => {
              const element = document.querySelector('.hs-bottom-sheet');
              return element && element.getBoundingClientRect().top < innerHeight - 170;
            });
          }
          if (name === 'queued-close') {
            await page.waitForFunction(() => document.querySelector('.hs-bottom-sheet')?.getBoundingClientRect().top > innerHeight * .05 + 3);
          }
          const initial = await top();
          assert(initial > height * .05 + 3 && initial < height - 25, `${name}: spring must still be in flight (${initial})`);
          // Aim inside the sheet's empty side padding, with room for its last
          // animation frame between reading the bounds and dispatching input.
          const movingDown = ['closing', 'reverse-collapsing', 'queued-close'].includes(name);
          await down(movingDown ? height - 35 : Math.min(height - 35, initial + 150), 8);
          await flushMotion(); // Flush MotionValue rendering without assuming a headless frame rate.
          const frozen = await top();
          await page.waitForTimeout(70);
          const held = await top();
          assert(Math.abs(held - frozen) < 1, `${name}: cancelled spring kept moving (${initial} -> ${frozen} -> ${held})`);
          const start = pointerY;
          await move(start + delta);
          await flushMotion();
          const actual = await top() - frozen;
          // Downward overscroll retains the original 0.2 resistance.
          const expected = delta > 0 && frozen > height * .55 ? delta * .2 : delta;
          assert(Math.abs(actual - expected) < 2, `${name}: ${delta}px input moved sheet ${actual}px (expected ${expected})`);
          await page.waitForTimeout(550);
          assert(Math.abs(await top() - frozen - actual) < 1, `${name}: stale completion resumed/unmounted the held sheet`);
          measurements.push({ engine, width, fresh, name, input: delta, expected, actual: Number(actual.toFixed(3)) });
          return start;
        };

        await page.goto(app, { timeout: 120000 });
        if (fresh) await click('Explore without an account');
        await click('Open Nearby');
        await rest('collapsed');
        await expect(content()).toHaveCSS('overflow-y', 'hidden');
        await page.mouse.move(width / 2, height - 70); await page.mouse.wheel(0, 240);
        assert.equal(await content().evaluate(e => e.scrollTop), 0, 'collapsed list stays locked');

        await gesture(-260, { slow: true, body: true }); await rest('expanded');
        await expect(content()).toHaveCSS('overflow-y', 'auto');
        // Scroll a genuine multi-cafe fixture list while fully expanded.
        if (cdp) { await down(height - 180); await move(height - 250); await move(height - 350); await up(); }
        else { await page.mouse.move(width / 2, height - 180); await page.mouse.wheel(0, 280); }
        await expect.poll(() => content().evaluate(e => e.scrollTop)).toBeGreaterThan(0);
        await content().evaluate(e => e.scrollTo({ top: 0 })); await page.waitForTimeout(150);
        await gesture(230, { slow: true }); await rest('collapsed');
        await gesture(210, { slow: true }); await rest('closed');

        await click('Open Nearby');
        await grab('opening', -12); await up(); await rest('collapsed');
        await click('Close Nearby');
        await grab('closing', -12); await up(); await rest('collapsed');

        await gesture(-180, { slow: true }); // Interrupt the expanding spring and reverse down.
        let start = await grab('reverse-expanding', 12);
        await move(start + 220); await page.waitForTimeout(130); await up(); await rest('collapsed');
        await gesture(-260, { slow: true }); await rest('expanded');
        await gesture(150, { slow: true }); // Interrupt the collapsing spring and reverse up.
        start = await grab('reverse-collapsing', -12);
        await move(start - 200); await page.waitForTimeout(130); await up(); await rest('expanded');

        // Close from expanded normally queues collapse -> dismiss. Grabbing must cancel both.
        await click('Close Nearby');
        await grab('queued-close', -12); await up(); await rest('collapsed');
        await page.waitForTimeout(650); await rest('collapsed');

        // Rapid repetitions cancel the previous destination, with no intermediate resting stop.
        for (let step = 0; step < 6; step++) {
          await gesture(step % 2 ? 190 : -190, { rapid: true });
          await page.waitForTimeout(35);
        }
        await rest('collapsed');
        await gesture(-260, { slow: true }); await rest('expanded');
        await page.getByRole('button').filter({ has: page.getByRole('heading', { name: 'Arrietty', exact: true }) }).filter({ visible: true }).first().click();
        await expect(page.getByRole('dialog', { name: 'Arrietty details' })).toBeVisible();
        await gesture(230, { slow: true }); await rest('collapsed');
        await gesture(210, { slow: true }); await rest('closed');
        for (const name of ['Saved', 'Friends', 'Nearby']) {
          await click(`Open ${name}`); await rest('collapsed');
          await gesture(210, { slow: true }); await rest('closed');
        }
        await page.reload(); await expect(page.getByRole('button', { name: 'Open Nearby' })).toBeVisible();
        await expect(sheet).toHaveCount(0);
        assert.deepEqual(errors, []);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await context.close();
        console.log(`PASS ${engine} ${width} ${fresh ? 'first visit' : 'returning'}: interruption, reversals, repeated swipes, three snaps, scroll, cards, dock`);
      }
    }
  } finally {
    for (const context of browser.contexts()) for (const page of context.pages()) {
      if (!page.isClosed()) fs.writeFileSync(`${output}/${engine}-input-failure.json`, JSON.stringify(await page.evaluate(() => window.__sheetInputs), null, 2));
    }
    await browser.close();
    fs.writeFileSync(`${output}/${engine}-interruptions.json`, JSON.stringify(measurements, null, 2));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
