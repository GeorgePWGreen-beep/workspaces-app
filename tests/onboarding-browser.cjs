/* eslint-disable @typescript-eslint/no-require-imports */
// Run against the isolated friends-server.cjs / friends-app.cjs fixtures only.
const path = require('node:path');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const playwright = require(process.env.PLAYWRIGHT_MODULE || path.resolve('.npm-cache/hot-seats-qa/tools/node_modules/@playwright/test'));
const expect = playwright.expect.configure({ timeout: 15000 });
const engine = process.env.QA_BROWSER || 'chromium';
const app = 'http://localhost:3105';
fs.mkdirSync('.npm-cache/onboarding-qa/screenshots',{recursive:true});
(async () => {
 const browser = await playwright[engine].launch({headless:true});
 try {
  for (const width of [360, 1440]) {
   const context = await browser.newContext({viewport:{width,height:740}, reducedMotion:'reduce', ...(width < 768 ? {isMobile:true,hasTouch:true}: {})});
   await context.route('https://api.mapbox.com/**', route => route.fulfill({contentType:'application/json',body:JSON.stringify({version:8,sources:{},layers:[]})}));
   await context.route('**/_next/image*', route => route.fulfill({contentType:'image/jpeg',body:fs.readFileSync('public/cafes/hot-numbers.jpg')}));
   const page = await context.newPage(), errors=[];
   page.on('pageerror', error => errors.push(error.message));
   page.on('console', message => {if (/hydration|did not match|server rendered HTML/i.test(message.text())) errors.push(message.text());});
   const click = name => page.getByRole('button',{name,exact:true}).filter({visible:true}).first().click();
   const welcome = page.getByRole('heading',{name:'Find your perfect place to study.'});
   const map = async () => {
    await expect(page.locator('.mapboxgl-canvas')).toBeVisible();
    await expect(page.getByRole('region',{name:'nearby workspaces'})).not.toBeVisible();
    await expect(page.getByRole('heading',{name:'Your next study spot starts here.'})).not.toBeVisible();
    if(width<768) await expect(page.getByRole('button',{name:'Open Nearby'})).toBeVisible();
   };
   await page.goto(app,{timeout:120000});
   await expect(welcome).toBeVisible();
   const scoreToggle = page.getByRole('button',{name:/Study Scores See how good/});
   await expect(scoreToggle).toHaveAttribute('aria-expanded','false');
   await scoreToggle.focus(); await page.keyboard.press('Enter');
   await expect(scoreToggle).toHaveAttribute('aria-expanded','true');
   await expect(page.getByText('Every café gets a Study Score out of 100 based on Wi-Fi, noise, seating, sockets, coffee, busyness and available space.')).toBeVisible();
   for(const text of ['85–100','Excellent','70–84','Great','60–69','Good','Below 60','Fair']) await expect(page.getByText(text,{exact:true})).toBeVisible();
   await page.screenshot({path:`.npm-cache/onboarding-qa/screenshots/restored-${engine}-${width}-welcome.png`});
   await page.getByRole('button',{name:'Get started',exact:true}).scrollIntoViewIfNeeded();
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await scoreToggle.click(); await expect(scoreToggle).toHaveAttribute('aria-expanded','false');
   await click('Get started');
   await expect(page.getByRole('heading',{name:'Make Hot Seats yours'})).toBeVisible();
   const circle=page.getByRole('img',{name:'Study Score 84 out of 100 — Great'});
   await expect(circle).toBeVisible(); assert.equal(await circle.locator('svg circle').count(),2);
   await expect(page.getByText('93%',{exact:true})).toBeVisible();
   await page.screenshot({path:`.npm-cache/onboarding-qa/screenshots/restored-${engine}-${width}-match.png`});
   await click('Personalise my matches');
   await expect(page.getByRole('heading',{name:'What atmosphere helps you focus?'})).toBeVisible();
   await click('Go back');
   await expect(page.getByRole('heading',{name:'Make Hot Seats yours'})).toBeVisible();
   await click('Skip for now'); await map();
   assert.equal(await page.evaluate(()=>localStorage.getItem('hot-seats.onboarding-complete.v1')),'true');
   await page.reload(); await map(); await expect(welcome).not.toBeVisible();
   // Pending old tutorial flags must never revive contextual cues or Nearby.
   await page.evaluate(()=>{localStorage.setItem('hot-seats.progressive-onboarding.v1','started');localStorage.removeItem('hot-seats.match-introduction.v1');});
   await page.reload(); await map();
   await page.goto(app+'/?intro=reset'); await expect(welcome).toBeVisible();
   await click('Explore without an account'); await map();
   // Existing guest preference flow still completes without registration.
   await page.goto(app+'/?intro=reset'); await click('Get started'); await click('Personalise my matches');
   await page.getByText('Balanced',{exact:true}).click(); await expect(page.getByRole('radio',{name:/Balanced/})).toBeChecked(); await click('Continue');
   await page.getByText('2+ hours',{exact:true}).click(); await click('Continue');
   await page.getByText('Wi-Fi',{exact:true}).click(); await click('Save preferences');
   await expect(page.getByRole('heading',{name:"You're all set."})).toBeVisible();
   await expect(circle).toBeVisible(); await click('Explore Exeter'); await map();
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('hot-seats.guest-study-preferences.v1')).atmosphere_preference),'balanced');
   assert.deepEqual(errors,[]);
   await context.close();
   console.log(`PASS ${engine} ${width}: welcome, accessible explanation, detail score circle, navigation, skip, guest save, returning map and retired cues`);
  }
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
