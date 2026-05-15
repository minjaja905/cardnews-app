const ALLOWED_ORIGINS = new Set([
  process.env.ALLOWED_ORIGIN || 'https://cardnews-app-pi.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
]);
const ALLOWED_MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS_LIMIT = 8192;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Origin 제한 — 허용 도메인 외 전부 차단 (빈 Origin 포함)
  const origin = req.headers.origin || '';
  if (!ALLOWED_ORIGINS.has(origin)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const apiKey = process.env.CLAUDE_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'CLAUDE_API_KEY not configured' });
  }

  const { endpoint, system, messages, tools, max_tokens } = req.body;

  // 모델·토큰 강제 고정 — 클라이언트 값 무시
  const safeBody = {
    model: ALLOWED_MODEL,
    max_tokens: Math.min(Number(max_tokens) || MAX_TOKENS_LIMIT, MAX_TOKENS_LIMIT),
    system,
    messages,
  };

  // web_search 도구만 허용
  if (endpoint === 'web-search' && Array.isArray(tools)) {
    safeBody.tools = tools.filter(t => t.type === 'web_search_20250305');
  }

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };
  if (endpoint === 'web-search') {
    headers['anthropic-beta'] = 'web-search-2025-03-05';
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers,
    body: JSON.stringify(safeBody),
  });

  const data = await response.json();
  return res.status(response.status).json(data);
}
