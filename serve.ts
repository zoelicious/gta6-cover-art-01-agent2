/* Coral Dawn — tiny static server for local tries.
   Serves app/ at http://localhost:8080 so the studio can be opened in
   desktop Chrome exactly as a static host would serve it. Node stdlib only. */
import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(join(fileURLToPath(new URL('.', import.meta.url)), 'app'));
const port = Number(process.env.PORT || 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.json': 'application/json'
};

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  let path = normalize(join(root, decodeURIComponent(url.pathname)));
  if (!path.startsWith(root)) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  if (path === root || statSync(path, { throwIfNoEntry: false })?.isDirectory()) {
    path = join(path, 'index.html');
  }
  if (!existsSync(path)) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(path)] || 'application/octet-stream' });
  createReadStream(path).pipe(res);
});

server.listen(port, () => {
  console.log('Coral Dawn studio at http://localhost:' + port);
});
