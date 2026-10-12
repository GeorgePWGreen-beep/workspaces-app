/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const {NextRequest}=require('next/server');
const {validateRecoveryEmail,validateNewPassword,recoveryRequestResult,RECOVERY_EMAIL_SENT}=require('../.next/auth-tests/utils/auth.js');
const recovery=require('../.next/auth-tests/utils/passwordRecovery.js');
const {hasRecoveryClaims,recoverySessionStatus,exchangeRecoveryCode,updateRecoveredPassword}=recovery;
const now=Math.floor(Date.now()/1000);
const claims={sub:'user-1',exp:now+3600,amr:[{method:'recovery',timestamp:now}]};
function fixture(overrides={}){
 const calls=[];
 const auth={
  async getUser(){calls.push('getUser');return {data:{user:{id:'user-1'}},error:null};},
  async getClaims(){calls.push('getClaims');return {data:{claims},error:null};},
  async exchangeCodeForSession(code){calls.push(['exchange',code]);return {data:{session:{user:{id:'user-1'}}},error:null};},
  async updateUser(value){calls.push(['update',value]);return {data:{user:{id:'user-1'}},error:null};},
  ...overrides,
 };
 return {auth,calls};
}
function loadServerFile(file,auth){
 const source=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const compiledModule={exports:{}};
 const localRequire=id=>id==='@/lib/supabase/server'?{createClient:async()=>({auth})}:id==='@/utils/passwordRecovery'?recovery:require(id);
 vm.runInNewContext(source,{module:compiledModule,exports:compiledModule.exports,require:localRequire,URL},{filename:file});
 return compiledModule.exports;
}

test('recovery email and password rules match registration and require confirmation',()=>{
 assert.equal(validateRecoveryEmail(' hello@example.test '),undefined);
 for(const email of ['','bad','a b@example.test','a@'])assert(validateRecoveryEmail(email));
 assert.deepEqual(validateNewPassword('12345678','12345678'),{});
 assert(validateNewPassword('1234567','1234567').password);
 assert(validateNewPassword('12345678','87654321').confirmation);
 assert(validateNewPassword('12345678','').confirmation);
});
test('reset request responses never disclose account existence or backend messages',()=>{
 assert.equal(RECOVERY_EMAIL_SENT,"If an account exists with this email, we've sent a password reset link.");
 for(const code of [undefined,'user_not_found','user_banned','email_not_confirmed','invalid_credentials'])assert.deepEqual(recoveryRequestResult(code?{code,message:'secret-token'}:null),{ok:true});
 assert.match(recoveryRequestResult({status:429}).message,/wait/);
 for(const error of [{status:500},{name:'AuthRetryableFetchError'},{code:'unexpected',message:'secret-token'}]){
  const result=recoveryRequestResult(error);assert.equal(result.ok,false);assert(!result.message.includes('secret-token'));
 }
});
test('only fresh, verified recovery claims for the current user qualify',()=>{
 assert(hasRecoveryClaims(claims,'user-1',now));
 for(const modified of [{...claims,sub:'other'},{...claims,exp:now},{...claims,amr:[{method:'password',timestamp:now}]},{...claims,amr:[{method:'recovery',timestamp:now-3600}]},{...claims,amr:[{method:'recovery',timestamp:now+120}]},{...claims,amr:['recovery']},{...claims,amr:undefined}])assert.equal(hasRecoveryClaims(modified,'user-1',now),false);
});
test('session validation contacts Auth and validates claims; signed-out and revoked sessions fail',async()=>{
 const {auth,calls}=fixture();assert.equal(await recoverySessionStatus(auth),'ready');assert.deepEqual(calls,['getUser','getClaims']);
 assert.equal(await recoverySessionStatus(fixture({getUser:async()=>({data:{user:null},error:null})}).auth),'invalid');
 assert.equal(await recoverySessionStatus(fixture({getUser:async()=>({error:{status:401}})}).auth),'invalid');
 assert.equal(await recoverySessionStatus(fixture({getClaims:async()=>({data:null,error:{status:401}})}).auth),'invalid');
 assert.equal(await recoverySessionStatus(fixture({getUser:async()=>{throw Error('credentials')}}).auth),'retry');
});
test('PKCE callback rejects absent, oversized, expired and non-recovery codes',async()=>{
 const {auth,calls}=fixture();
 for(const code of [null,'','a'.repeat(4097)])assert.equal(await exchangeRecoveryCode(auth,code),'invalid');
 assert.deepEqual(calls,[]);
 assert.equal(await exchangeRecoveryCode(auth,'valid-code'),'ready');
 assert.equal(await exchangeRecoveryCode(fixture({exchangeCodeForSession:async()=>({error:{code:'flow_state_expired',status:400}})}).auth,'old-code'),'invalid');
 assert.equal(await exchangeRecoveryCode(fixture({getClaims:async()=>({data:{claims:{...claims,amr:[{method:'password',timestamp:now}]}},error:null})}).auth,'sign-in-code'),'invalid');
 assert.equal(await exchangeRecoveryCode(fixture({exchangeCodeForSession:async()=>{throw Error('network')}}).auth,'code'),'retry');
});
test('password update validates fields and session again before calling Supabase',async()=>{
 const {auth,calls}=fixture();
 assert.equal((await updateRecoveredPassword(auth,'short','short')).ok,false);assert.deepEqual(calls,[]);
 assert.equal((await updateRecoveredPassword(auth,'long-enough','different')).ok,false);assert.deepEqual(calls,[]);
 assert.deepEqual(await updateRecoveredPassword(auth,'long-enough','long-enough'),{ok:true});
 assert.deepEqual(calls,['getUser','getClaims',['update',{password:'long-enough'}]]);
 const invalid=fixture({getUser:async()=>({data:{user:null},error:null})});
 assert.equal((await updateRecoveredPassword(invalid.auth,'long-enough','long-enough')).status,'invalid');
 assert.equal(invalid.calls.length,0);
});
test('password update sanitizes rate limits, weak/same passwords, session expiry and network failures',async()=>{
 for(const [error,match,status] of [[{status:429},/wait/,undefined],[{code:'weak_password'},/stronger/,undefined],[{code:'same_password'},/different/,undefined],[{status:401},/expired/,'invalid'],[{status:500},/try again/,undefined]]){
  const result=await updateRecoveredPassword(fixture({updateUser:async()=>({error:{...error,message:'secret-token'}})}).auth,'long-enough','long-enough');
  assert.equal(result.ok,false);assert.match(result.message,match);assert.equal(result.status,status);assert(!result.message.includes('secret-token'));
 }
 const result=await updateRecoveredPassword(fixture({updateUser:async()=>{throw Error('secret-token')}}).auth,'long-enough','long-enough');assert.match(result.message,/connection/);
});
test('recovery callback strips tokens/errors, forbids open redirects and sets private headers on both origins',async()=>{
 for(const origin of ['http://localhost:3000','https://hotseats.co.uk']){
  const {auth,calls}=fixture();const {GET}=loadServerFile('app/auth/recovery/route.ts',auth);
  const response=await GET(new NextRequest(origin+'/auth/recovery?code=test-code&next=https://evil.test'));
  assert.equal(response.headers.get('location'),origin+'/auth/reset-password');
  assert.equal(response.headers.get('cache-control'),'private, no-store');assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert(calls.some(call=>Array.isArray(call)&&call[0]==='exchange'));
  calls.length=0;
  const failed=await GET(new NextRequest(origin+'/auth/recovery?error=access_denied&error_description=secret-token&code=bad'));
  assert.equal(failed.headers.get('location'),origin+'/auth/reset-password?error=invalid');assert.deepEqual(calls,[]);
 }
});
test('server action rejects malformed input and independently checks session',async()=>{
 const {auth,calls}=fixture();const {resetPassword}=loadServerFile('app/auth/reset-password/actions.ts',auth);
 assert.equal((await resetPassword(null,null)).ok,false);assert.deepEqual(calls,[]);
 assert.equal((await resetPassword('x'.repeat(4097),'x'.repeat(4097))).ok,false);assert.deepEqual(calls,[]);
 assert.equal((await resetPassword('good-password','good-password')).ok,true);
 assert(calls.includes('getUser'));
});
test('existing email confirmation routing remains separate and unchanged',async()=>{
 const {auth}=fixture();const {GET}=loadServerFile('app/auth/confirm/route.ts',auth);
 const response=await GET(new NextRequest('https://hotseats.co.uk/auth/confirm?code=signup-code'));
 assert.equal(response.headers.get('location'),'https://hotseats.co.uk/?auth=confirmed');
});
