/* eslint-disable @typescript-eslint/no-require-imports -- Node's test runner loads the isolated CommonJS TypeScript output. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createDefaultFilters } = require("../.next/filter-tests/types/filters.js");
const { WEEKDAYS } = require("../.next/filter-tests/types/openingHours.js");
const {
  filterCafes, getCafeOpeningState, matchesOpenNow, toggleQuickFilter,
  isQuickFilterActive, countActiveFilters, countExtendedFilters,
} = require("../.next/filter-tests/utils/filters.js");

const closedWeek = () => Object.fromEntries(WEEKDAYS.map((day) => [day, null]));
const openWeek = () => ({ ...closedWeek(), friday: { open: "08:00", close: "18:00" } });
const context = (overrides = {}) => ({
  city: "Cambridge", search: "", coordinates: null,
  now: new Date("2026-09-11T10:00:00Z"), ...overrides,
});
const cafe = (overrides = {}) => ({
  city: "Cambridge", name: "Test Cafe", studyScore: 70, coords: [0.1218, 52.2053],
  wifi: "Great WiFi", noise: "Quiet", sockets: "Plenty", busyness: "Moderate",
  rating: 4.5, price: "££", image: "", description: "", coffee: "Good",
  seating: "Comfortable", openingHours: "08:00–18:00", weeklyOpeningHours: null,
  seatCount: null, isIndependent: null, lastVerifiedAt: null, ...overrides,
});
const names = (cafes, filters = {}, overrides = {}) => filterCafes(cafes,
  { ...createDefaultFilters(), ...filters }, context(overrides)).map((entry) => entry.name);

test("default filtering preserves optional unknowns, closed cafes, order, and input rows", () => {
  const rows = [cafe({ name: "Unknown" }), cafe({ name: "Closed", weeklyOpeningHours: closedWeek() }),
    cafe({ name: "Open", weeklyOpeningHours: openWeek() })];
  const snapshot = structuredClone(rows);
  const result = filterCafes(rows, createDefaultFilters(), context());
  assert.deepEqual(result, rows);
  assert.notEqual(result, rows);
  assert.equal(result[0], rows[0]);
  assert.deepEqual(rows, snapshot);
});

test("default factory resets every filter without sharing mutable selections", () => {
  const selected = createDefaultFilters();
  selected.prices.push("£");
  selected.wifi.push("Great WiFi");
  selected.minSeats = 20;
  selected.openNow = true;
  const cleared = createDefaultFilters();
  assert.equal(countActiveFilters(cleared), 0);
  assert.equal(countExtendedFilters(cleared), 0);
  assert.deepEqual(cleared.prices, []);
  assert.deepEqual(cleared.wifi, []);
  assert.equal(cleared.minSeats, null);
  assert.equal(cleared.openNow, false);
});

for (const [field, selection, alternative, excluded, filterField = field] of [
  ["price", "£", "££", "£££", "prices"],
  ["wifi", "Great WiFi", "Good WiFi", "Okay WiFi"],
  ["noise", "Quiet", "Moderate", "Loud"],
  ["sockets", "Plenty", "Some", "Few"],
  ["busyness", "Quiet", "Moderate", "Busy"],
  ["coffee", "Excellent", "Good", "Basic"],
  ["seating", "Comfortable", "Average", "Basic"],
]) {
  test(`${field}: one option restricts, multiple options OR together, empty restores all`, () => {
    const rows = [cafe({ name: "First", [field]: selection }),
      cafe({ name: "Second", [field]: alternative }), cafe({ name: "Third", [field]: excluded })];
    assert.deepEqual(names(rows, { [filterField]: [selection] }), ["First"]);
    assert.deepEqual(names(rows, { [filterField]: [selection, alternative] }), ["First", "Second"]);
    assert.deepEqual(names(rows, { [filterField]: [] }), ["First", "Second", "Third"]);
  });
}

test("categories AND with minimum score, independent, Open now, search, and city", () => {
  const matching = cafe({ name: "Corner Coffee", isIndependent: true, weeklyOpeningHours: openWeek() });
  const rows = [matching,
    { ...matching, name: "Wrong search" },
    { ...matching, name: "Corner Exeter", city: "Exeter" },
    { ...matching, name: "Corner Low Score", studyScore: 69 },
    { ...matching, name: "Corner Chain", isIndependent: false },
    { ...matching, name: "Corner Loud", noise: "Loud" },
    { ...matching, name: "Corner WiFi", wifi: "Okay WiFi" },
    { ...matching, name: "Corner Closed", weeklyOpeningHours: closedWeek() },
  ];
  const filters = { cafeType: "independent", noise: ["Quiet"], wifi: ["Great WiFi", "Good WiFi"],
    minStudyScore: 70, openNow: true };
  assert.deepEqual(names(rows, filters, { search: "  CORNER  " }), ["Corner Coffee"]);
  assert.deepEqual(names(rows, filters, { search: "corner", city: "Exeter" }), ["Corner Exeter"]);
  assert.deepEqual(names(rows, { ...filters, minStudyScore: 80 }, { search: "corner" }), []);
});

test("independence requires explicit true or false and never guesses unknown cafes", () => {
  const rows = [cafe({ name: "Independent", isIndependent: true }),
    cafe({ name: "Chain", isIndependent: false }), cafe({ name: "Unknown", isIndependent: null })];
  assert.deepEqual(names(rows, { cafeType: "all" }), ["Independent", "Chain", "Unknown"]);
  assert.deepEqual(names(rows, { cafeType: "independent" }), ["Independent"]);
  assert.deepEqual(names(rows, { cafeType: "non-independent" }), ["Chain"]);
});

test("seat minimum includes the threshold and only excludes unknown seats when active", () => {
  const rows = [cafe({ name: "Unknown" }), cafe({ name: "Zero", seatCount: 0 }),
    cafe({ name: "Ten", seatCount: 10 }), cafe({ name: "Twenty", seatCount: 20 }),
    cafe({ name: "Forty", seatCount: 40 })];
  assert.equal(names(rows).length, 5);
  assert.deepEqual(names(rows, { minSeats: 10 }), ["Ten", "Twenty", "Forty"]);
  assert.deepEqual(names(rows, { minSeats: 20 }), ["Twenty", "Forty"]);
  assert.deepEqual(names(rows, { minSeats: 40 }), ["Forty"]);
});

test("walking uses user coordinates, honors inclusive limits, and ignores legacy walk_time", () => {
  const origin = { latitude: 52.2053, longitude: 0.1218 };
  const rows = [cafe({ name: "Here", walkTime: 99 }),
    cafe({ name: "18 minutes", coords: [0.1218, 52.2153], walkTime: 1 }),
    cafe({ name: "Too distant", coords: [-3.527072, 50.726516], walkTime: 1 }),
    cafe({ name: "Invalid", coords: [NaN, 91] })];
  assert.deepEqual(names(rows, { maxWalkMinutes: 5 }, { coordinates: origin }), ["Here"]);
  assert.deepEqual(names(rows, { maxWalkMinutes: 18 }, { coordinates: origin }), ["Here", "18 minutes"]);
  assert.deepEqual(names(rows, { maxWalkMinutes: 20 }, { coordinates: origin }), ["Here", "18 minutes"]);
  assert.equal(names(rows, {}, { coordinates: origin }).length, 4);
});

test("denied or unavailable location suspends walking while preserving other filters and state", () => {
  const filters = { ...createDefaultFilters(), maxWalkMinutes: 5, cafeType: "independent" };
  const rows = [cafe({ name: "Independent", isIndependent: true }), cafe({ name: "Chain", isIndependent: false })];
  const snapshot = structuredClone(filters);
  assert.deepEqual(filterCafes(rows, filters, context({ coordinates: null })).map((entry) => entry.name), ["Independent"]);
  assert.deepEqual(filters, snapshot);
});

test("unknown opening hours are distinct from closed and Open now uses confirmed hours only", () => {
  const unknown = cafe({ name: "Unknown" });
  const open = cafe({ name: "Open", weeklyOpeningHours: openWeek() });
  const closed = cafe({ name: "Closed", weeklyOpeningHours: closedWeek() });
  assert.equal(getCafeOpeningState(unknown, context().now), "unknown");
  assert.equal(getCafeOpeningState(closed, context().now), "closed");
  assert.equal(getCafeOpeningState(open, context().now), "open");
  assert.equal(getCafeOpeningState(open, null), "unknown");
  assert.equal(getCafeOpeningState(open, new Date("invalid")), "unknown");
  assert.equal(matchesOpenNow(unknown, context().now), false);
  assert.deepEqual(names([unknown, open, closed]), ["Unknown", "Open", "Closed"]);
  assert.deepEqual(names([unknown, open, closed], { openNow: true }), ["Open"]);
});

test("Open now uses UK time at opening/closing boundaries and never legacy text", () => {
  const rows = [cafe({ weeklyOpeningHours: openWeek(), openingHours: "Open 24 hours" })];
  for (const [timestamp, expected] of [
    ["2026-09-11T06:59:00Z", []],
    ["2026-09-11T07:00:00Z", ["Test Cafe"]],
    ["2026-09-11T16:59:00Z", ["Test Cafe"]],
    ["2026-09-11T17:00:00Z", []],
    ["2026-09-12T10:00:00Z", []],
  ]) assert.deepEqual(names(rows, { openNow: true }, { now: new Date(timestamp) }), expected);
});

test("Open now includes overnight hours into a closed following day", () => {
  const overnight = { ...closedWeek(), sunday: { open: "22:00", close: "02:00" } };
  const rows = [cafe({ weeklyOpeningHours: overnight })];
  assert.deepEqual(names(rows, { openNow: true }, { now: new Date("2026-09-14T00:30:00Z") }), ["Test Cafe"]);
  assert.deepEqual(names(rows, { openNow: true }, { now: new Date("2026-09-14T01:00:00Z") }), []);
});

test("quick controls share categories with the sheet and preserve unrelated selections", () => {
  for (const key of ["openNow", "quiet", "wifi", "sockets", "independent"]) {
    const initial = { ...createDefaultFilters(), minSeats: 20 };
    assert.equal(isQuickFilterActive(initial, key), false);
    const enabled = toggleQuickFilter(initial, key);
    assert.equal(isQuickFilterActive(enabled, key), true);
    assert.equal(enabled.minSeats, 20);
    assert.deepEqual(toggleQuickFilter(enabled, key), initial);
    assert.equal(isQuickFilterActive(initial, key), false);
  }
  const mixed = { ...createDefaultFilters(), wifi: ["Great WiFi", "Good WiFi"], cafeType: "non-independent" };
  assert.equal(isQuickFilterActive(mixed, "wifi"), false);
  assert.deepEqual(toggleQuickFilter(mixed, "wifi").wifi, ["Great WiFi"]);
  assert.equal(toggleQuickFilter(mixed, "independent").cafeType, "independent");
});

test("active counts use categories and extended counts exclude visible quick presets", () => {
  let filters = createDefaultFilters();
  for (const key of ["openNow", "quiet", "wifi", "sockets", "independent"]) filters = toggleQuickFilter(filters, key);
  assert.equal(countActiveFilters(filters), 5);
  assert.equal(countExtendedFilters(filters), 0);
  filters = { ...filters, prices: ["£", "££"], minSeats: 20, coffee: ["Excellent"] };
  assert.equal(countActiveFilters(filters), 8);
  assert.equal(countExtendedFilters(filters), 3);
  filters.wifi = ["Great WiFi", "Good WiFi"];
  assert.equal(countExtendedFilters(filters), 4);
});
