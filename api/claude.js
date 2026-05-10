export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' });
  }

  const { endpoint, ...body } = req.body;
  const targetUrl = endpoint === 'web-search'
    ? 'https://api.anthropic.com/v1/messages'
    : 'https://api.anthropic.com/v1/messages';

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };
  if (endpoint === 'web-search') {
    headers['anthropic-beta'] = 'web-search-2025-03-05';
  }

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
