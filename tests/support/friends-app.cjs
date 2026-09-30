/* eslint-disable @typescript-eslint/no-require-imports */
// Copy the app into an ignored directory so an existing dev server is untouched.
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const app = path.resolve('.npm-cache/friends-qa/app');
fs.mkdirSync(app, { recursive: true });
for (const folder of ['app', 'components', 'data', 'lib', 'public', 'types', 'utils']) fs.cpSync(folder, path.join(app, folder), { recursive: true });
for (const file of ['package.json', 'package-lock.json', 'tsconfig.json', 'next-env.d.ts', 'next.config.ts', 'postcss.config.mjs', 'proxy.ts']) if (fs.existsSync(file)) fs.copyFileSync(file, path.join(app, file));
if (!fs.existsSync(path.join(app, 'node_modules'))) fs.symlinkSync(path.resolve('node_modules'), path.join(app, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
const child = spawn(process.execPath, [path.resolve('node_modules/next/dist/bin/next'), 'dev', '--webpack', '--port', '3105'], {
  cwd: app, stdio: 'inherit', env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:54335',
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'friends-local-fixture-only',
    NEXT_PUBLIC_MAPBOX_TOKEN: 'pk.local-test-token',
  },
});
child.on('exit', code => process.exit(code ?? 1));
