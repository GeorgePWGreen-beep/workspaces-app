/* eslint-disable @typescript-eslint/no-require-imports -- Node's test runner loads the isolated CommonJS TypeScript output. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { WEEKDAYS } = require("../.next/cafe-data-tests/types/openingHours.js");
const { isWeeklyOpeningHours, getOpeningStatus, formatVerifiedDate } = require("../.next/cafe-data-tests/utils/openingHours.js");
const { estimateWalkMinutes } = require("../.next/cafe-data-tests/utils/walking.js");
const { isCity, getLegacyCity } = require("../.next/cafe-data-tests/lib/cities.js");

const closed = () => Object.fromEntries(WEEKDAYS.map((day) => [day, null]));
const week = () => ({ ...closed(), thursday: { open: "08:30", close: "15:00" }, friday: { open: "09:00", close: "17:00" } });
const status = (hours, timestamp) => getOpeningStatus(hours, new Date(timestamp), "Europe/London");

test("weekly schedules require seven days and valid intervals", () => {
  assert.equal(isWeeklyOpeningHours(week()), true);
  assert.equal(isWeeklyOpeningHours(closed()), true);
  for (const invalid of [null, [], {}, { monday: null }, { ...week(), extra: null },
    { ...week(), thursday: { open: "8:30", close: "15:00" } },
    { ...week(), thursday: { open: "24:00", close: "15:00" } },
    { ...week(), thursday: { open: "08:30", close: "08:30" } },
    { ...week(), thursday: { open: "08:30", close: "15:60" } },
    { ...week(), thursday: { open: null, close: "15:00" } },
    { ...week(), thursday: { open: "08:30", close: "15:00", extra: true } }]) {
    assert.equal(isWeeklyOpeningHours(invalid), false);
  }
});

test("opens exactly at opening; closes exactly at closing, in UK summer time", () => {
  assert.equal(status(week(), "2026-09-10T07:29:00Z").label, "Closed · opens 08:30 today");
  assert.equal(status(week(), "2026-09-10T07:30:00Z").label, "Open now · closes 15:00");
  assert.equal(status(week(), "2026-09-10T14:00:00Z").label, "Closed · opens 09:00 tomorrow");
});

test("closed weekdays, weekends, and next-week openings", () => {
  assert.equal(status(week(), "2026-09-13T12:00:00Z").label, "Closed · opens 08:30 on Thursday");
  assert.equal(status(closed(), "2026-09-10T12:00:00Z").label, "Closed today");
  const weekend = { ...closed(), saturday: { open: "10:00", close: "14:00" }, sunday: { open: "11:00", close: "13:00" } };
  assert.equal(status(weekend, "2026-09-12T13:00:00Z").label, "Closed · opens 11:00 tomorrow");
});

test("overnight opening carries through a closed next day and wraps the week", () => {
  const hours = { ...closed(), sunday: { open: "22:00", close: "02:00" } };
  assert.equal(isWeeklyOpeningHours(hours), true);
  assert.equal(status(hours, "2026-09-13T22:00:00Z").label, "Open now · closes 02:00 tomorrow");
  assert.equal(status(hours, "2026-09-14T00:30:00Z").isOpen, true);
  assert.equal(status(hours, "2026-09-14T01:00:00Z").isOpen, false);
});

test("24:00 close supports an entire day without making the next day open", () => {
  const hours = { ...closed(), thursday: { open: "00:00", close: "24:00" } };
  assert.equal(isWeeklyOpeningHours(hours), true);
  assert.equal(status(hours, "2026-09-10T22:59:00Z").isOpen, true);
  assert.equal(status(hours, "2026-09-10T23:00:00Z").isOpen, false);
});

test("UK clock changes do not depend on the viewer's time zone", () => {
  const hours = { ...closed(), sunday: { open: "01:00", close: "03:00" } };
  assert.equal(status(hours, "2026-10-25T00:30:00Z").isOpen, true);
  assert.equal(status(hours, "2026-10-25T01:30:00Z").isOpen, true);
  assert.equal(status(hours, "2026-03-29T01:30:00Z").isOpen, true);
  assert.equal(status(hours, "2026-03-29T02:00:00Z").isOpen, false);
});

test("verification dates hide null/invalid values and use local dates", () => {
  assert.equal(formatVerifiedDate(null, "Europe/London"), null);
  assert.equal(formatVerifiedDate("invalid", "Europe/London"), null);
  assert.equal(formatVerifiedDate("2026-09-09T23:30:00Z", "Europe/London"), "10 Sept 2026");
});

test("walking estimates require a valid nearby origin", () => {
  const origin = { latitude: 52.2053, longitude: 0.1218 };
  assert.equal(estimateWalkMinutes(null, [0.1218, 52.2053]), null);
  assert.equal(estimateWalkMinutes(origin, [0.1218, 52.2053]), 1);
  assert.equal(estimateWalkMinutes(origin, [0.1218, 52.2153]), 18);
  assert.equal(estimateWalkMinutes(origin, [-3.527072, 50.726516]), null);
  assert.equal(estimateWalkMinutes({ ...origin, latitude: NaN }, [0, 0]), null);
  assert.equal(estimateWalkMinutes(origin, [0, 91]), null);
});

test("saved city and legacy backfill never default unknown records to Cambridge", () => {
  assert.equal(isCity("Exeter"), true);
  for (const value of [null, "", "London", "cambridge"]) assert.equal(isCity(value), false);
  assert.equal(getLegacyCity("arrietty", 50.726516, -3.527072), "Exeter");
  assert.equal(getLegacyCity("hot-numbers", 52.2007, 0.1322), "Cambridge");
  assert.equal(getLegacyCity("unknown", 52.2007, 0.1322), null);
  assert.equal(getLegacyCity("hot-numbers", 50.726516, -3.527072), null);
});
