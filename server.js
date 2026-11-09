// Local / Docker server: serves the app and the JSON API on one port.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi, reminderTick, init, today } from './lib/app.js';

const PORT = Number(process.env.PORT || 3000);
const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

function serveStatic(req, res, pathname) {
  let file = path.normalize(path.join(PUBLIC, decodeURIComponent(pathname)));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403).end(); return; }
  if (!(fs.existsSync(file) && fs.statSync(file).isFile())) file = path.join(PUBLIC, 'index.html'); // SPA fallback for /c/<slug>
  const ext = path.extname(file);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ['.html', '.js', '.css'].includes(ext) ? 'no-cache' : 'public, max-age=3600' });
  fs.createReadStream(file).pipe(res);
}

http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://x');
  if (pathname === '/healthz') { res.writeHead(200, { 'Content-Type': 'text/plain' }); return res.end('ok'); }
  if (pathname.startsWith('/api/')) return handleApi(req, res);
  serveStatic(req, res, pathname);
}).listen(PORT, '0.0.0.0', async () => {
  await init();
  console.log(`Chores running on http://0.0.0.0:${PORT}  (today=${today()})`);
});
setInterval(() => reminderTick().catch((e) => console.error('reminder tick', e.message)), 60_000);
