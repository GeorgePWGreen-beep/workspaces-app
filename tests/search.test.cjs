/* eslint-disable @typescript-eslint/no-require-imports */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeCafeSearch, searchCafes, cafeNameSearchRank, obviousCafeResult } = require('../.next/search-tests/utils/cafeSearch.js');
const { resultsCamera, resultsPadding, resultsViewportKey } = require('../.next/search-tests/utils/mapViewport.js');
const { filterCafes, toggleQuickFilter } = require('../.next/search-tests/utils/filters.js');
const { createDefaultFilters } = require('../.next/search-tests/types/filters.js');

const cafe = (name, extra = {}) => ({ name, studyScore: 70, city: 'Exeter', coords: [-3.53, 50.72],
  wifi: 'Great WiFi', noise: 'Quiet', sockets: 'Plenty', busyness: 'Moderate', price: '££',
  coffee: 'Good', seating: 'Comfortable', seatCount: null, isIndependent: true, weeklyOpeningHours: null, ...extra });
const cafes = [cafe('Suki Cafe'), cafe('The Sunset Society'), cafe('18g Coffee Roasters'), cafe('Arrietty'), cafe('Boatyard Bakery')];
const names = (rows, query) => searchCafes(rows, query).map(cafe => cafe.name);

for (const [query, expected] of [
  ['Suki Cafe', 'Suki Cafe'], ['suk', 'Suki Cafe'], ['sun', 'The Sunset Society'], ['18', '18g Coffee Roasters'],
  ['nset', 'The Sunset Society'], ['sukki', 'Suki Cafe'], ['ariety', 'Arrietty'], ['boatyerd', 'Boatyard Bakery'],
  ['SUKI CAFE', 'Suki Cafe'], ['the sunset', 'The Sunset Society'], ['Sunset Society', 'The Sunset Society'],
  [' SUKI   CAFÉ! ', 'Suki Cafe'], ['suki caff', 'Suki Cafe'],
]) test(`name search: ${query}`, () => assert.equal(names(cafes, query)[0], expected));

test('apostrophes, accents, punctuation and whitespace normalize', () => {
  assert.equal(normalizeCafeSearch('  Joe’s—Café!!  '), 'joes cafe');
  assert.deepEqual(names([cafe("Joe's Café")], 'joes cafe'), ["Joe's Café"]);
});
test('strict ranking tiers, score tie-breaks, and immutable input', () => {
  const rows = [cafe('Sukki', { studyScore: 100 }), cafe('Asuki', { studyScore: 99 }), cafe('The Suki'),
    cafe('Suki Coffee', { studyScore: 90 }), cafe('Suki Cafe', { studyScore: 60 }), cafe('Suki', { studyScore: 20 })];
  const before = structuredClone(rows);
  assert.deepEqual(names(rows, 'suki'), ['Suki', 'Suki Coffee', 'Suki Cafe', 'The Suki', 'Asuki', 'Sukki']);
  assert.deepEqual(rows, before);
});
test('no result, bounded typos, and literal-only short/numeric queries', () => {
  for (const query of ['zzzzzz', 'sukxxxxx', '19']) assert.deepEqual(names(cafes, query), []);
  assert.equal(cafeNameSearchRank('Suki', 'suk'), 100);
  assert.equal(cafeNameSearchRank('Suki', 'sak'), null);
});
test('empty normalized queries preserve current ordering', () => assert.deepEqual(searchCafes(cafes, ' !!! '), cafes));
test('Enter selects a unique/better name match, never resolves score-only ties', () => {
  assert.equal(obviousCafeResult(searchCafes(cafes, 'sukki'), 'sukki'), cafes[0]);
  const tied = [cafe('Coffee One', { studyScore: 90 }), cafe('Coffee Two')];
  assert.equal(obviousCafeResult(tied, 'coffee'), null);
  assert.equal(obviousCafeResult([cafe('Coffee'), ...tied], 'coffee').name, 'Coffee');
  assert.equal(obviousCafeResult([], 'nothing'), null);
});
test('city and active filters constrain suggestions; clearing restores filtered city set', () => {
  const rows = [...cafes, cafe('Suki Cambridge', { city: 'Cambridge' }), cafe('Suki Loud', { noise: 'Loud' })];
  const filters = toggleQuickFilter(createDefaultFilters(), 'quiet');
  const context = { city: 'Exeter', search: 'sukki', coordinates: null, now: null };
  assert.deepEqual(filterCafes(rows, filters, context), [cafes[0]]);
  assert.deepEqual(filterCafes(rows, filters, { ...context, search: '' }), cafes);
  assert.deepEqual(filterCafes(rows, filters, { ...context, city: 'Cambridge' }).map(cafe => cafe.name), ['Suki Cambridge']);
});
test('single result focuses at useful zoom; no results leave camera alone', () => {
  assert.deepEqual(resultsCamera([cafes[0]]), { kind: 'focus', center: cafes[0].coords, zoom: 16 });
  assert.equal(resultsCamera([]), null);
});
test('multiple results include every coordinate with a capped zoom', () => {
  assert.deepEqual(resultsCamera([cafe('a', { coords: [-3.5, 50.7] }), cafe('b', { coords: [-3.6, 50.8] }), cafe('c', { coords: [-3.55, 50.75] })]),
    { kind: 'fit', bounds: [[-3.6, 50.7], [-3.5, 50.8]], maxZoom: 15 });
});
test('map intent changes with search, clearing, quick/full filters and repeated selections', () => {
  const filters = createDefaultFilters(), key = resultsViewportKey('suki', filters, 0);
  assert.equal(key, resultsViewportKey(' SÚKI! ', { ...filters }, 0));
  for (const next of [resultsViewportKey('', filters, 0), resultsViewportKey('sun', filters, 0),
    resultsViewportKey('suki', toggleQuickFilter(filters, 'quiet'), 0), resultsViewportKey('suki', { ...filters, minStudyScore: 80 }, 0),
    resultsViewportKey('suki', filters, 1)]) assert.notEqual(next, key);
  assert.equal(resultsViewportKey('', { ...filters, noise: ['Quiet', 'Moderate'] }, 0), resultsViewportKey('', { ...filters, noise: ['Moderate', 'Quiet'] }, 0));
});
test('mobile padding leaves space between controls and collapsed sheet/dock', () => {
  for (const height of [400, 844]) {
    const padding = resultsPadding(height, true, true);
    assert(padding.top + padding.bottom < height);
    assert(padding.bottom > resultsPadding(height, true, false).bottom);
  }
  const dropdown = resultsPadding(844, true, true, 357);
  assert(dropdown.top - 44 > 357, 'the whole marker clears the dropdown');
  assert(dropdown.top + dropdown.bottom < 844);
});
