// Vercel serverless function — proxies file uploads to Pinata IPFS
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const PINATA_JWT = process.env.PINATA_JWT;
  if (!PINATA_JWT) {
    return res.status(500).json({ error: 'PINATA_JWT not configured' });
  }

  // Collect raw body chunks
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);

  // Forward multipart form to Pinata using native fetch
  const contentType = req.headers['content-type'] || '';

  const pinataRes = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${PINATA_JWT}`,
      'Content-Type': contentType,
    },
    body: body,
  });

  if (!pinataRes.ok) {
    const text = await pinataRes.text();
    return res.status(502).json({ error: 'Pinata upload failed', detail: text });
  }

  const data = await pinataRes.json();
  return res.status(200).json({ cid: data.IpfsHash });
}
