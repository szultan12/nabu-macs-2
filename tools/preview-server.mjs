// Local-only development server. No Home Assistant credentials or service calls.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(fileURLToPath(new URL('../custom_components/nabu_macs/www/', import.meta.url)));
const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
http.createServer(async (req, res) => {
    try {
        const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
        const file = path.resolve(root, '.' + pathname.replace(/^\/nabu_macs(?=\/)/, ''));
        if (!file.startsWith(root + path.sep) && file !== root) { res.writeHead(403).end(); return; }
        const target = file === root ? path.join(root, 'preview.html') : file;
        const body = await fs.readFile(target);
        res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
        res.end(body);
    } catch { res.writeHead(404).end('Not found'); }
}).listen(8130, '127.0.0.1', () => console.log('Preview: http://127.0.0.1:8130/nabu_macs/preview.html'));
