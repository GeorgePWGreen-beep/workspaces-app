/* eslint-disable @typescript-eslint/no-require-imports */
// Isolated friends-server.cjs + friends-app.cjs fixtures; real Mapbox gestures/camera.
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium,expect}=require(process.env.PLAYWRIGHT_MODULE||path.resolve('.npm-cache/hot-seats-qa/tools/node_modules/@playwright/test'));
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'no-preference'});
  await context.addInitScript(()=>{localStorage.setItem('hot-seats.onboarding-complete.v1','true');localStorage.setItem('hot-seats.city.v1','Exeter');});
  await context.route('https://api.mapbox.com/**',route=>route.fulfill({contentType:'application/json',body:JSON.stringify({version:8,sources:{},layers:[]})}));
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://localhost:3105',{timeout:120000});
  await page.waitForFunction(()=>{
   const el=document.querySelector('.mapboxgl-map');if(!el)return false;
   let fiber=el[Object.keys(el).find(k=>k.startsWith('__reactFiber'))];
   while(fiber){let hook=fiber.memoizedState;while(hook){const candidate=hook.memoizedState?.current;if(candidate?.getCenter&&candidate?.fitBounds){window.panMap=candidate;return candidate.loaded()&&!candidate.isMoving();}hook=hook.next;}fiber=fiber.return;}return false;
  });
  await page.evaluate(()=>{
   window.panCalls=[];
   for(const method of ['flyTo','fitBounds','easeTo','remove']){
    const original=window.panMap[method];window.panMap[method]=function(...args){window.panCalls.push({method,native:!!args[1]?.originalEvent});return original.apply(this,args);};
   }
   window.panMap.on('dragend',()=>{window.releaseCenter=window.panMap.getCenter().toArray();});
  });
  const client=await context.newCDPSession(page);
  const touch=(type,x)=>client.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y:350,id:1,radiusX:2,radiusY:2,force:1}]});
  for(const mode of ['closed','dismiss-nearby','reduced-motion']){
   if(mode==='dismiss-nearby'){
    await page.getByRole('button',{name:'Open Nearby',exact:true}).click();
    await expect(page.getByRole('region',{name:'nearby workspaces'})).toBeVisible();
    await page.waitForTimeout(600);
   }
   if(mode==='reduced-motion')await page.emulateMedia({reducedMotion:'reduce'});
   await page.evaluate(()=>{window.panCalls=[];window.releaseCenter=null;});
   await touch('touchStart',85);
   for(let x=105;x<=245;x+=20){await touch('touchMove',x);await page.waitForTimeout(16);}
   await touch('touchEnd');
   await page.waitForTimeout(450);
   const result=await page.evaluate(()=>{
    const map=window.panMap,release=window.releaseCenter;
    return {release,center:map.getCenter().toArray(),glidePixels:release?map.project(release).dist(map.project(map.getCenter())):0,calls:window.panCalls,dragEnabled:map.dragPan.isEnabled(),reduced:matchMedia('(prefers-reduced-motion: reduce)').matches};
   });
   console.log(mode,JSON.stringify(result));
   assert(result.release,'native dragend must occur');
   assert(result.dragEnabled,'native drag pan remains enabled');
   assert.equal(result.calls.filter(c=>c.method==='flyTo'||c.method==='fitBounds'||c.method==='remove'||(c.method==='easeTo'&&!c.native)).length,0,'no app camera animation or remount during pan');
   if(mode==='reduced-motion')assert(result.glidePixels<1,'respect reduced-motion preference');
   else {assert(result.glidePixels>8,'native inertia must continue after release');assert(result.calls.some(c=>c.method==='easeTo'&&c.native),'Mapbox provides inertia');}
   if(mode==='dismiss-nearby')await expect(page.getByRole('region',{name:'nearby workspaces'})).not.toBeVisible();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS native touch inertia with Nearby closed/dismissing; reduced-motion preference; no competing camera moves');
  await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
