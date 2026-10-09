/* eslint-disable @typescript-eslint/no-require-imports */
// Name/location fixtures only; never writes to a database. Start friends-server first.
const http = require('node:http');
(async () => {
  const rows = await (await fetch('http://127.0.0.1:54335/rest/v1/cafes')).json();
  const base = rows.find(row => row.slug === 'arrietty');
  const names = ['Suki Cafe', 'The Sunset Society', '18g Coffee Roasters', 'Boatyard Bakery', 'Coffee House', 'Coffee Corner'];
  const cafes = [...rows, ...names.map((name, index) => ({
    ...base, id: `00000000-0000-4000-8000-00000000000${index}`, slug: name.toLowerCase().replaceAll(' ', '-'), name,
    study_score: 80 - index * 3, latitude: 50.716 + index * 0.003, longitude: -3.543 + index * 0.004,
    noise: index === 4 ? 'Loud' : 'Quiet', description: 'Isolated browser test fixture.',
  }))];
  http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(req.url.startsWith('/rest/v1/cafes') ? cafes : {}));
  }).listen(54336, '127.0.0.1', () => console.log('Search fixture ready on 127.0.0.1:54336 (synthetic cafe locations)'));
})().catch(error => { console.error(error); process.exitCode = 1; });
