/* eslint-disable @typescript-eslint/no-require-imports */
const {test}=require('node:test');const assert=require('node:assert/strict');
const {readOnboardingState,readGuestPreferences,togglePriority,initialBrowseCity,completeOnboarding,resetOnboarding,ONBOARDING_COMPLETE_KEY,ONBOARDING_STARTED_KEY,GUEST_PREFERENCES_KEY}=require('../.next/onboarding-tests/lib/onboarding.js');
const {CITY_STORAGE_KEY,NEARBY_GUIDANCE_KEY}=require('../.next/onboarding-tests/lib/cities.js');
const storage=(values={})=>({getItem:key=>values[key]??null});
const preferences={atmosphere_preference:'balanced',session_length:'long',priorities:['wifi','space']};
const {initializeFeatureIntroductions,completeFeatureIntroduction,FEATURE_INTRODUCTION_KEYS,PROGRESSIVE_ONBOARDING_KEY}=require('../.next/onboarding-tests/lib/onboarding.js');
const writableStorage=(values={})=>({...storage(values),setItem:(key,value)=>{values[key]=value},removeItem:key=>{delete values[key]}});

test('new visitors enrol, with independent score and Match completion across visits',()=>{
 const values={},store=writableStorage(values);
 assert.deepEqual(initializeFeatureIntroductions(store,false),{studyScore:false,match:false});
 completeOnboarding(store);
 completeFeatureIntroduction(store,'studyScore');
 assert.equal(values[FEATURE_INTRODUCTION_KEYS.match],undefined);
 assert.deepEqual(initializeFeatureIntroductions(store,true),{studyScore:true,match:false});
 completeFeatureIntroduction(store,'match');
 assert.deepEqual(initializeFeatureIntroductions(store,true),{studyScore:true,match:true});
});
test('existing visitors do not receive newly added cues; reset preserves preferences',()=>{
 const values={[CITY_STORAGE_KEY]:'Cambridge',[GUEST_PREFERENCES_KEY]:JSON.stringify(preferences)};
 const store=writableStorage(values);
 assert.deepEqual(initializeFeatureIntroductions(store,true),{studyScore:true,match:true});
 assert.equal(values[PROGRESSIVE_ONBOARDING_KEY],undefined);
 values[FEATURE_INTRODUCTION_KEYS.studyScore]='seen';
 values[FEATURE_INTRODUCTION_KEYS.match]='seen';
 assert.deepEqual(initializeFeatureIntroductions(store,true,true),{studyScore:false,match:false});
 assert.equal(values[CITY_STORAGE_KEY],'Cambridge');
 assert.deepEqual(readGuestPreferences(store),preferences);
 completeFeatureIntroduction(store,'match');
 assert.deepEqual(initializeFeatureIntroductions(store,true),{studyScore:false,match:true});
});
test('readable completion survives a storage write failure',()=>{
 const store={...writableStorage({[PROGRESSIVE_ONBOARDING_KEY]:'started',[FEATURE_INTRODUCTION_KEYS.studyScore]:'seen'}),setItem(){throw new Error('quota')}};
 assert.deepEqual(initializeFeatureIntroductions(store,true),{studyScore:true,match:false});
});
test('first-time visitors receive welcome; completed users keep their normal map',()=>{
 assert.deepEqual(readOnboardingState(storage()),{city:null,complete:false,nearbySeen:false});
 assert.deepEqual(readOnboardingState(storage({[ONBOARDING_COMPLETE_KEY]:'true',[CITY_STORAGE_KEY]:'Exeter'})),{city:'Exeter',complete:true,nearbySeen:true});
 assert.equal(readOnboardingState(storage({[ONBOARDING_COMPLETE_KEY]:'true',[NEARBY_GUIDANCE_KEY]:'seen'})).nearbySeen,true);
});

test('initial city preserves a choice and opens a populated city without a chooser',()=>{
 assert.equal(initialBrowseCity('Cambridge',['Exeter','Cambridge']),'Cambridge');
 assert.equal(initialBrowseCity(null,['Cambridge','Exeter']),'Exeter');
 assert.equal(initialBrowseCity(null,['Cambridge']),'Cambridge');
 assert.equal(initialBrowseCity(null,[]),'Exeter');
 assert.equal(initialBrowseCity('Exeter',['Cambridge']),'Exeter');
});

test('finishing or skipping onboarding persists completion without changing preferences/city',()=>{
 const values={[ONBOARDING_STARTED_KEY]:'true',[CITY_STORAGE_KEY]:'Cambridge',[GUEST_PREFERENCES_KEY]:JSON.stringify(preferences)};
 const store={...storage(values),setItem:(key,value)=>{values[key]=value},removeItem:key=>{delete values[key]}};
 completeOnboarding(store);
 assert.equal(readOnboardingState(store).nearbySeen,true);
 assert.equal(values[ONBOARDING_COMPLETE_KEY],'true');
 assert.equal(values[ONBOARDING_STARTED_KEY],undefined);
 assert.equal(values[CITY_STORAGE_KEY],'Cambridge');
 assert.deepEqual(readGuestPreferences(store),preferences);
 completeOnboarding(store);
 assert.equal(readOnboardingState(store).nearbySeen,true);
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


test('restored welcome ignores unfinished contextual tutorial flags',()=>{
 const values={[PROGRESSIVE_ONBOARDING_KEY]:'started',[FEATURE_INTRODUCTION_KEYS.studyScore]:'seen'};
 assert.equal(readOnboardingState(storage(values)).complete,false);
 values[ONBOARDING_COMPLETE_KEY]='true';
 assert.equal(readOnboardingState(storage(values)).complete,true);
});

test('development reset starts welcome again while preserving preferences and city',()=>{
 const values={[ONBOARDING_COMPLETE_KEY]:'true',[NEARBY_GUIDANCE_KEY]:'seen',[CITY_STORAGE_KEY]:'Cambridge',[GUEST_PREFERENCES_KEY]:JSON.stringify(preferences),[FEATURE_INTRODUCTION_KEYS.match]:'seen'};
 const store=writableStorage(values);
 resetOnboarding(store);
 assert.equal(readOnboardingState(store).complete,false);
 assert.equal(values[ONBOARDING_STARTED_KEY],'true');
 assert.equal(values[CITY_STORAGE_KEY],'Cambridge');
 assert.deepEqual(readGuestPreferences(store),preferences);
 completeOnboarding(store);
 assert.equal(readOnboardingState(store).complete,true);
 assert.equal(values[ONBOARDING_STARTED_KEY],undefined);
});

test('completed old Nearby onboarding wins over a stale started marker',()=>{
 assert.equal(readOnboardingState(storage({[ONBOARDING_STARTED_KEY]:'true',[NEARBY_GUIDANCE_KEY]:'seen'})).complete,true);
});
