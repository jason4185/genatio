// Local dev server — serves frontend and proxies /api/upload to Pinata
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...v] = line.split('=');
    if (k && v.length) process.env[k.trim()] = v.join('=').trim();
  });
}

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.jpg':  'image/jpeg',
  '.png':  'image/png',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
};

async function handleUpload(req, res) {
  const PINATA_JWT = process.env.PINATA_JWT;
  if (!PINATA_JWT) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'PINATA_JWT not set in .env' }));
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  const { default: fetch } = await import('node-fetch').catch(() => ({ default: globalThis.fetch }));
  const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': req.headers['content-type'],
    },
    body,
  });

  const data = await pinataRes.json();
  res.writeHead(pinataRes.ok ? 200 : 502, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(pinataRes.ok ? { cid: data.IpfsHash } : { error: 'Pinata error', detail: data }));
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.url === '/api/upload' && req.method === 'POST') {
    return handleUpload(req, res);
  }

  const urlPath = req.url.split('?')[0];
  let filePath = path.join(__dirname, 'frontend', urlPath === '/' ? 'index.html' : urlPath);

  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'frontend', 'index.html');
  }

  const ext = path.extname(filePath);
  const contentType = MIME[ext] || 'text/plain';

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

server.listen(3001, () => {
  console.log('Genatio dev server running at http://localhost:3001');
});
