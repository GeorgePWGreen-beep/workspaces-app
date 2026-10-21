/* eslint-disable @typescript-eslint/no-require-imports -- Isolated profile mutation tests. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, dependencies = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const compiledModule = { exports: {} };
  vm.runInNewContext(source, { exports: compiledModule.exports, module: compiledModule, require: name => dependencies[name] ?? require(name) });
  return compiledModule.exports;
}
const utils = load('utils/profile.ts');
const { updateOwnProfile } = load('lib/data/profile.ts', { '../../utils/profile': utils });
const plain = value => JSON.parse(JSON.stringify(value));
const row = { id: 'alice', username: 'alice_studies', display_name: 'Alice Green', avatar_url: null, created_at: 'created', updated_at: 'updated' };
function fixture(result = { data: row, error: null }) {
  const calls = [];
  const chain = {};
  for (const method of ['from', 'update', 'eq', 'select']) chain[method] = (...args) => { calls.push([method, ...plain(args)]); return chain; };
  chain.single = async () => { calls.push(['single']); if (result instanceof Error) throw result; return result; };
  return { client: chain, calls };
}

test('display names are trimmed, whitespace is normalized, and 1–40 Unicode characters are accepted', () => {
  assert.equal(utils.normalizeDisplayName('  Alice \n Green  '), 'Alice Green');
  for (const name of ['', '   ', '\t\n']) assert(utils.validateProfileEdits({ displayName: name }).displayName);
  for (const name of ['George', '李'.repeat(40), '𐐀'.repeat(40)]) assert.equal(utils.validateProfileEdits({ displayName: name }).displayName, undefined);
  assert(utils.validateProfileEdits({ displayName: 'x'.repeat(41) }).displayName);
  assert.equal(utils.profileInitials(' Alice Green '), 'AG');
  assert.equal(utils.profileInitials('georgegreen'), 'GE');
  assert.equal(utils.profileInitials('  '), 'HS');
});

test('only catalog presets and default initials are accepted as new avatar values', () => {
  assert.equal(utils.avatarPresetSource('initials', 'sage'), null);
  for (const { id: style } of utils.AVATAR_STYLES) for (const { id: colour } of utils.AVATAR_COLOURS) {
    const source = utils.avatarPresetSource(style, colour);
    assert.deepEqual(plain(utils.parseAvatarPreset(source)), { style, colour });
    assert.equal(utils.validateProfileEdits({ displayName: 'Alice', avatar: source }).avatar, undefined);
  }
  for (const source of ['https://example.test/photo.png', 'javascript:alert(1)', 'data:image/svg+xml,anything', `${utils.AVATAR_PRESET_PREFIX}leaf/unknown`, `${utils.AVATAR_PRESET_PREFIX}leaf/sage?url=evil`, `${utils.AVATAR_PRESET_PREFIX}../leaf/sage`, 'https://hotseats.co.uk.evil.test/avatars/presets/v1/leaf/sage']) {
    assert.equal(utils.parseAvatarPreset(source), null);
    assert(utils.validateProfileEdits({ displayName: 'Alice', avatar: source }).avatar);
  }
});

test('invalid fields and absent identity never issue a database request', async () => {
  const { client, calls } = fixture();
  assert.equal((await updateOwnProfile(client, '', { displayName: 'Alice' })).ok, false);
  assert.equal((await updateOwnProfile(client, 'alice', { displayName: ' ' })).field, 'displayName');
  assert.equal((await updateOwnProfile(client, 'alice', { displayName: 'Alice', avatar: 'https://untrusted.test/image' })).field, 'avatar');
  assert.deepEqual(calls, []);
});

test('human portrait identifiers round-trip every supported choice and reject malformed values', () => {
  for (const { id: presentation } of utils.AVATAR_PRESENTATIONS) for (const { id: hairColour } of utils.AVATAR_HAIR_COLOURS) for (const { id: appearance } of utils.AVATAR_APPEARANCES) for (const { id: hair } of utils.AVATAR_HAIRSTYLES) {
    for (const { id: skin } of utils.AVATAR_SKIN_TONES) for (const { id: colour } of utils.AVATAR_COLOURS) {
      const portrait = { appearance, hair, skin, colour, presentation, hairColour };
      const source = utils.portraitAvatarSource(portrait);
      assert.deepEqual(plain(utils.parsePortraitAvatar(source)), portrait);
      assert.equal(utils.validateProfileEdits({ displayName: 'Alice', avatar: source }).avatar, undefined);
    }
  }
  const valid = utils.portraitAvatarSource(utils.DEFAULT_PORTRAIT);
  for (const value of [valid + '/extra', valid + '?skin=light', valid + '#anything', valid.replace('/oval/', '/unknown/'), valid.replace('/sand/', '/invalid/'), valid.replace('/parted/', '/%70arted/'), valid.replace('/v3/', '/v4/'), valid.replace('/boy/', '/unknown/'), valid.replace('/black', '/purple'), valid.replace('/black', ''), valid.replace('/v3/', '/v2/')]) {
    assert.equal(utils.parsePortraitAvatar(value), null);
    assert(utils.validateProfileEdits({ displayName: 'Alice', avatar: value }).avatar);
  }
  assert.equal(utils.parsePortraitAvatar(null), null);
  assert.equal(utils.parsePortraitAvatar(utils.avatarPresetSource('leaf', 'sage')), null);
});

test('the shared avatar renders human portraits, legacy icons, photos and initials compatibly', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const portrait = load('components/PortraitAvatar.tsx', { '@/utils/profile': utils });
  const { default: Avatar } = load('components/ProfileAvatar.tsx', { '@/utils/profile': utils, './PortraitAvatar': portrait });
  const render = source => renderToStaticMarkup(React.createElement(Avatar, { name: 'Alice Green', source }));
  assert.match(render(utils.portraitAvatarSource(utils.DEFAULT_PORTRAIT)), /data-portrait="v3"/);
  for (const style of ['leaf', 'coffee', 'book']) assert.match(render(utils.avatarPresetSource(style, 'sage')), /<svg/);
  assert.match(render(null), />AG<\/span>/);
  const unknownVersion = render('https://hotseats.co.uk/avatars/presets/v3/unknown');
  assert.match(unknownVersion, />AG<\/span>/);
  assert(!unknownVersion.includes('<img'));
  assert.match(render('https://existing.example/photo.png'), /<img[^>]+referrerPolicy="no-referrer"/);
});

test('v2 portraits retain their choices and render consistently when upgraded', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { default: Portrait } = load('components/PortraitAvatar.tsx', { '@/utils/profile': utils });
  const render = config => renderToStaticMarkup(React.createElement(Portrait, { portrait: config }));
  for (const { id: appearance } of utils.AVATAR_APPEARANCES) for (const { id: hair } of utils.AVATAR_HAIRSTYLES) {
    for (const { id: skin } of utils.AVATAR_SKIN_TONES) for (const { id: colour } of utils.AVATAR_COLOURS) {
      const legacy = `${utils.LEGACY_PORTRAIT_AVATAR_PREFIX}${appearance}/${hair}/${skin}/${colour}`;
      const expected = { appearance, hair, skin, colour, presentation: 'boy', hairColour: 'black' };
      const parsed = utils.parsePortraitAvatar(legacy);
      assert.deepEqual(plain(parsed), expected);
      assert.equal(utils.validateProfileEdits({ displayName: 'Alice', avatar: legacy }).avatar, undefined);
      assert.equal(render(parsed), render(expected));
      const updated = { ...parsed, presentation: 'girl', hairColour: 'blonde' };
      assert.deepEqual(plain(utils.parsePortraitAvatar(utils.portraitAvatarSource(updated))), updated);
    }
    const base = { ...utils.DEFAULT_PORTRAIT, appearance, hair };
    assert.notEqual(render(base), render({ ...base, presentation: 'girl' }));
    for (const option of utils.AVATAR_HAIR_COLOURS) {
      assert(render({ ...base, hairColour: option.id }).includes(`fill="${option.fill}"`));
    }
  }
  for (const suffix of ['/extra', '?colour=black', '#test']) {
    assert.equal(utils.parsePortraitAvatar(`${utils.LEGACY_PORTRAIT_AVATAR_PREFIX}oval/parted/sand/sage${suffix}`), null);
  }
});

test('portrait artwork stays flat and minimal across presentations and hairstyles', () => {
  const React = require('react');
  const { renderToStaticMarkup } = require('react-dom/server');
  const { default: Portrait } = load('components/PortraitAvatar.tsx', { '@/utils/profile': utils });
  for (const { id: presentation } of utils.AVATAR_PRESENTATIONS) {
    for (const { id: hair } of utils.AVATAR_HAIRSTYLES) {
      const markup = renderToStaticMarkup(React.createElement(Portrait, {
        portrait: { ...utils.DEFAULT_PORTRAIT, presentation, hair },
      }));
      assert((markup.match(/<path /g) || []).length <= 6);
      assert(!/<(?:defs|clipPath|linearGradient|radialGradient|filter|image)\b/.test(markup));
      assert(!/opacity=/.test(markup));
      assert.match(markup, /aria-hidden="true"/);
      assert.match(markup, /viewBox="0 0 100 100"/);
    }
  }
});

test('updates only display name/avatar on the current user and requires a returned row', async () => {
  const source = utils.portraitAvatarSource({ ...utils.DEFAULT_PORTRAIT, appearance: 'defined', hair: 'waves', skin: 'brown', colour: 'forest', presentation: 'girl', hairColour: 'ginger' });
  const confirmed = { ...row, avatar_url: source };
  const { client, calls } = fixture({ data: confirmed, error: null });
  const result = await updateOwnProfile(client, 'alice', { displayName: ' Alice  Green ', avatar: source, username: 'renamed', id: 'bob' });
  assert.equal(result.ok, true);
  assert.deepEqual(plain(result.profile), confirmed);
  assert.deepEqual(calls, [
    ['from', 'profiles'], ['update', { display_name: 'Alice Green', avatar_url: source }], ['eq', 'id', 'alice'],
    ['select', 'id,username,display_name,avatar_url,created_at,updated_at'], ['single'],
  ]);
});

test('name-only saves preserve existing avatars, while null explicitly restores initials', async () => {
  const retained = fixture();
  await updateOwnProfile(retained.client, 'alice', { displayName: 'Alice' });
  assert.deepEqual(retained.calls[1], ['update', { display_name: 'Alice' }]);
  const reset = fixture();
  await updateOwnProfile(reset.client, 'alice', { displayName: 'Alice', avatar: null });
  assert.deepEqual(reset.calls[1], ['update', { display_name: 'Alice', avatar_url: null }]);
});

test('missing rows, denied writes and network failures cannot report success or leak database details', async () => {
  for (const result of [
    { data: null, error: null }, { data: { ...row, id: 'bob' }, error: null },
    ...['PGRST116', '42501', 'PGRST301', 'PGRST303', '23514', 'unexpected'].map(code => ({ data: null, error: { code, message: 'private-database-detail' } })),
    new Error('private-database-detail'),
  ]) {
    const response = await updateOwnProfile(fixture(result).client, 'alice', { displayName: 'Alice' });
    assert.equal(response.ok, false);
    assert(!response.message.includes('private-database-detail'));
  }
});
