/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');const assert=require('node:assert/strict');
const {readOnboardingState,readGuestPreferences,togglePriority,ONBOARDING_COMPLETE_KEY,ONBOARDING_STARTED_KEY,GUEST_PREFERENCES_KEY}=require('../.next/onboarding-tests/lib/onboarding.js');
const {CITY_STORAGE_KEY,NEARBY_GUIDANCE_KEY}=require('../.next/onboarding-tests/lib/cities.js');
const storage=(values={})=>({getItem:key=>values[key]??null});
const preferences={atmosphere_preference:'balanced',session_length:'long',priorities:['wifi','space']};
test('new visitors onboard; completed users still receive Nearby if not yet introduced',()=>{
 assert.deepEqual(readOnboardingState(storage()),{city:null,complete:false,nearbySeen:false});
 assert.deepEqual(readOnboardingState(storage({[ONBOARDING_COMPLETE_KEY]:'true',[CITY_STORAGE_KEY]:'Exeter'})),{city:'Exeter',complete:true,nearbySeen:false});
 assert.equal(readOnboardingState(storage({[ONBOARDING_COMPLETE_KEY]:'true',[NEARBY_GUIDANCE_KEY]:'seen'})).nearbySeen,true);
});
test('legacy city or Nearby use bypasses onboarding without reopening Nearby',()=>{
 for(const city of ['Exeter','Cambridge'])assert.deepEqual(readOnboardingState(storage({[CITY_STORAGE_KEY]:city})),{city,complete:true,nearbySeen:true});
 assert.deepEqual(readOnboardingState(storage({[NEARBY_GUIDANCE_KEY]:'seen'})),{city:null,complete:true,nearbySeen:true});
});
test('unfinished city selection is not mistaken for a returning legacy user',()=>{
 assert.deepEqual(readOnboardingState(storage({[ONBOARDING_STARTED_KEY]:'true',[CITY_STORAGE_KEY]:'Cambridge'})),{city:'Cambridge',complete:false,nearbySeen:false});
 assert.equal(readOnboardingState(storage({[CITY_STORAGE_KEY]:'London'})).complete,false);
});
test('guest preferences are validated and contain only canonical fields',()=>{
 assert.deepEqual(readGuestPreferences(storage({[GUEST_PREFERENCES_KEY]:JSON.stringify({...preferences,user_id:'ignore',unknown:true})})),preferences);
 for(const value of ['oops','null',JSON.stringify({...preferences,priorities:['wifi','wifi']}),JSON.stringify({...preferences,priorities:['wifi','coffee','space','sockets']}),JSON.stringify({...preferences,atmosphere_preference:'loud'})])assert.equal(readGuestPreferences(storage({[GUEST_PREFERENCES_KEY]:value})),null);
 assert.equal(readGuestPreferences({getItem(){throw new Error('blocked')}}),null);
});
test('priority toggles enforce three, allow deselection and do not mutate input',()=>{
 const initial=['wifi','coffee','space'];assert.deepEqual(togglePriority(initial,'sockets'),initial);assert.deepEqual(togglePriority(initial,'coffee'),['wifi','space']);assert.deepEqual(togglePriority(['wifi'],'sockets'),['wifi','sockets']);assert.deepEqual(initial,['wifi','coffee','space']);
});
