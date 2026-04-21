// Claude API 연동 — 밈/일반/포트폴리오 카드뉴스 텍스트 3-variation 생성
import { MEME_SYSTEM_PROMPT } from '../data/memeRules';
import { GENERAL_SYSTEM_PROMPT } from '../data/generalRules';
import { PORTFOLIO_SYSTEM_PROMPT } from '../data/portfolioRules';

const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const MODEL = 'claude-sonnet-4-6';

async function callClaude(systemPrompt, userMsg, retries = 2) {
  if (!API_KEY) throw new Error('VITE_CLAUDE_API_KEY 환경변수가 설정되지 않았습니다.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });

  // 529 Overloaded — 자동 재시도 (최대 2회, 3초 간격)
  if (res.status === 529 || res.status === 503) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 3000));
      return callClaude(systemPrompt, userMsg, retries - 1);
    }
    throw new Error('Claude 서버가 혼잡합니다 (Overloaded). 잠시 후 다시 시도해주세요.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API 오류 ${res.status}`);
  }

  const data = await res.json();
  const raw = data.content[0]?.text || '';

  // JSON 추출 (```json 블록 or 순수 JSON)
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('AI 응답 파싱 실패 — JSON을 찾을 수 없습니다.');

  let jsonStr = match[0];

  // 단계별 JSON 정제 함수
  function fixJson(s) {
    // 1) trailing comma 제거
    s = s.replace(/,(\s*[}\]])/g, '$1');
    // 2) 문자열 내 리터럴 제어문자를 문자 단위로 이스케이프
    let result = '';
    let inString = false;
    let escaped = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (escaped) {
        result += ch;
        escaped = false;
      } else if (ch === '\\' && inString) {
        result += ch;
        escaped = true;
      } else if (ch === '"') {
        result += ch;
        inString = !inString;
      } else if (inString && ch === '\n') {
        result += '\\n';
      } else if (inString && ch === '\r') {
        result += '\\r';
      } else if (inString && ch === '\t') {
        result += '\\t';
      } else {
        result += ch;
      }
    }
    return result;
  }

  try {
    return JSON.parse(jsonStr);
  } catch {
    try {
      return JSON.parse(fixJson(jsonStr));
    } catch (e2) {
      throw new Error(`AI 응답 파싱 실패: ${e2.message}`);
    }
  }
}

// ── 밈 카드뉴스 3-variation 생성 ──────────────────────────────────────────────
export async function generateMemeVariations({ topic, details, volNum, date }) {
  const userMsg = `밈 이름: "${topic}"
Vol 번호: ${volNum || '01'}
날짜: ${date || ''}
${details ? `추가 컨텍스트: ${details}` : ''}

위 밈에 대한 김밈지 카드뉴스 6장 텍스트를 3가지 스타일(A-위트, B-인포, C-감성)로 생성해주세요.
반드시 JSON만 반환하고, 마크다운 코드블록 없이 응답하세요.`;

  const result = await callClaude(MEME_SYSTEM_PROMPT, userMsg);

  if (!result.variations || !Array.isArray(result.variations)) {
    throw new Error('AI 응답 구조 오류 — variations 배열을 찾을 수 없습니다.');
  }
  return result.variations; // [{label, card1..card6}] × 3
}

// ── 일반 카드뉴스 3-variation 생성 ────────────────────────────────────────────
export async function generateGeneralVariations({ topic, details }) {
  const userMsg = `주제: "${topic}"
${details ? `상세 내용: ${details}` : ''}

위 주제로 인스타그램 카드뉴스 6장 텍스트를 3가지 스타일(A-실용, B-스토리, C-데이터)로 생성해주세요.
반드시 JSON만 반환하고, 마크다운 코드블록 없이 응답하세요.`;

  const result = await callClaude(GENERAL_SYSTEM_PROMPT, userMsg);

  if (!result.variations || !Array.isArray(result.variations)) {
    throw new Error('AI 응답 구조 오류 — variations 배열을 찾을 수 없습니다.');
  }
  return result.variations;
}

// ── 포트폴리오 카드뉴스 3-variation 생성 ──────────────────────────────────────
export async function generatePortfolioVariations({ part, projectName, problem, solution, impacts, tools, seriesNum }) {
  const userMsg = `파트: ${part || '업무 생산성'}
프로젝트명: "${projectName}"
시리즈 번호: ${seriesNum || '01'}
Problem: ${problem}
Solution: ${solution}
Impact: ${(impacts || []).join(' / ')}
사용 도구: ${(tools || []).join(', ')}

위 포트폴리오 프로젝트로 인스타그램 카드뉴스 6장 텍스트를 3가지 스타일(A-임팩트, B-스토리, C-기술어필)로 생성해주세요.
반드시 JSON만 반환하고, 마크다운 코드블록 없이 응답하세요.`;

  const result = await callClaude(PORTFOLIO_SYSTEM_PROMPT, userMsg);

  if (!result.variations || !Array.isArray(result.variations)) {
    throw new Error('AI 응답 구조 오류 — variations 배열을 찾을 수 없습니다.');
  }
  return result.variations;
}

// ── 포트폴리오 줄글 자동 파싱 ─────────────────────────────────────────────────
export async function parsePortfolioText(rawText) {
  const systemPrompt = `당신은 포트폴리오 텍스트 파싱 전문가입니다.
사용자가 노션 등에서 복붙한 포트폴리오 텍스트를 읽고, 카드뉴스 제작에 필요한 구조화된 정보를 추출합니다.
반드시 아래 JSON 형식만 반환하고, 마크다운 코드블록 없이 응답하세요.`;

  const userMsg = `아래 포트폴리오 텍스트에서 정보를 추출해주세요:

${rawText}

다음 JSON 형식으로 반환하세요:
{
  "projectName": "프로젝트명 (핵심만, 20자 이내)",
  "problem": "Problem 내용 요약 (2-3문장)",
  "solution": "Solution 내용 요약 (2-3문장)",
  "impacts": ["임팩트1 (간결하게)", "임팩트2", "임팩트3"],
  "tools": ["도구1", "도구2", "도구3"]
}`;

  const result = await callClaude(systemPrompt, userMsg);
  return result;
}

// ── plain text 응답용 헬퍼 ────────────────────────────────────────────────────
async function callClaudeText(systemPrompt, userMsg, retries = 2) {
  if (!API_KEY) throw new Error('VITE_CLAUDE_API_KEY 환경변수가 설정되지 않았습니다.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });

  if (res.status === 529 || res.status === 503) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 3000));
      return callClaudeText(systemPrompt, userMsg, retries - 1);
    }
    throw new Error('Claude 서버가 혼잡합니다. 잠시 후 다시 시도해주세요.');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API 오류 ${res.status}`);
  }

  const data = await res.json();
  return (data.content[0]?.text || '').trim();
}

// ── 이미지 → 포트폴리오 정보 추출 (Vision) ───────────────────────────────────
export async function parseImageToPortfolioInfo(base64, mediaType) {
  if (!API_KEY) throw new Error('VITE_CLAUDE_API_KEY 환경변수가 설정되지 않았습니다.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: `당신은 포트폴리오 카드뉴스 이미지를 분석하는 전문가입니다.
카드뉴스 이미지에서 프로젝트 정보를 추출하여 JSON으로 반환합니다.
반드시 JSON만 반환하고, 마크다운 코드블록 없이 응답하세요.`,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: base64 },
          },
          {
            type: 'text',
            text: `이 카드뉴스 이미지를 분석해서 아래 JSON 형식으로 정보를 추출해주세요.
텍스트가 일부만 보여도 최대한 파악해주세요.

{
  "seriesNum": "시리즈 번호 (숫자만, 예: 01)",
  "projectName": "프로젝트명",
  "part": "업무 생산성 또는 생활 생산성",
  "problem": "문제 상황 요약",
  "solution": "해결 방법 요약",
  "impacts": ["성과1", "성과2", "성과3"],
  "tools": ["도구1", "도구2"]
}

파악하기 어려운 항목은 빈 문자열이나 빈 배열로 두세요.`,
          },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API 오류 ${res.status}`);
  }

  const data = await res.json();
  const raw = data.content[0]?.text || '';
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('이미지 분석 실패');
  return JSON.parse(match[0]);
}

// ── 포트폴리오 인스타 피드 글 생성 ────────────────────────────────────────────
export async function generatePortfolioFeed({ seriesNum, projectName, part, problem, solution, impacts, tools }) {
  const systemPrompt = `당신은 인스타그램 피드 카피라이터입니다.
@minjaja.pdf 계정의 '시스템화 시리즈' 피드 글을 작성합니다.
2030 여성 팔로워를 타깃으로, 저장욕구를 자극하는 실용적이고 공감되는 문체로 씁니다.

글쓰기 원칙:
- 구어체, 부드럽게, 너무 딱딱하지 않게
- 첫 문장은 짧고 임팩트 있게 — 스크롤을 멈추게
- 본문은 프로젝트 배경·과정을 자연스럽게
- 마지막엔 독자가 써볼 수 있는 활용 포인트 or 공감 마무리
- 이모지 최소화 (없어도 됨)

반드시 아래 형식 그대로 출력하세요. 형식 외 다른 말 없이 피드 글만 출력:

[시스템화 {N}] {제목}

{훅 — 1문장}

{본문 — 2~3문장}

{활용 포인트 or 마무리 — 1~2문장}
-
@minjaja.pdf
팔로우하고 {파트}✦
-
{#태그1 #태그2 #태그3 #태그4 #태그5}`;

  const partLabel = part === '업무 생산성' ? '업무 생산성 높이기' : '생활 생산성 높이기';

  const userMsg = `시리즈 번호: ${seriesNum || '01'}
프로젝트명: ${projectName}
파트: ${partLabel}
문제: ${problem}
해결: ${solution}
성과: ${(impacts || []).filter(Boolean).join(' / ')}
사용 도구: ${(tools || []).join(', ')}

위 내용으로 인스타그램 피드 글을 작성해주세요.`;

  return callClaudeText(systemPrompt, userMsg);
}

// ── 하위 호환 (기존 코드에서 사용하는 경우) ────────────────────────────────────
export async function generateDraft({ memeName, memoContext }) {
  const vars = await generateMemeVariations({ topic: memeName, details: memoContext });
  return vars[0]; // 첫 번째 variation 반환
}

// ── 오늘의 카드뉴스 주제 리서치 (web_search 도구 활용) ──────────────────────────
export async function researchTopics() {
  if (!API_KEY) throw new Error('VITE_CLAUDE_API_KEY 환경변수가 설정되지 않았습니다.');

  const today = new Date().toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric', weekday: 'long',
  });

  const systemPrompt = `당신은 인스타그램 카드뉴스 전문 에디터입니다. 2030 한국 여성 팔로워를 타깃으로 하는 라이프스타일·뷰티·재테크·일상 카드뉴스를 기획합니다.`;

  const userMsg = `오늘 날짜: ${today}

웹 검색으로 최신 트렌드를 조사한 후, 저장율이 높을 인스타그램 카드뉴스 주제 3가지를 추천해주세요.

검색 키워드 예시:
- 한국 라이프스타일 트렌드 ${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월
- 인스타그램 2030 여성 관심 트렌드
- 계절 이슈 핫토픽

반드시 아래 JSON 형식으로만 응답하세요. 설명 없이 JSON만 반환하세요:
{
  "trends_summary": "오늘의 트렌드 한 줄 요약",
  "topics": [
    {
      "title": "카드뉴스 제목 (20자 이내)",
      "category": "라이프 | 뷰티 | 푸드 | 여행 | 재테크 | 자기계발 중 하나",
      "why_now": "지금 이 주제가 뜨는 이유 (1-2문장)",
      "details": "슬라이드 구성 방향:\\n- 포인트1\\n- 포인트2\\n- 포인트3\\n- 포인트4",
      "save_rate": "상 | 중 | 하"
    },
    {
      "title": "...",
      "category": "...",
      "why_now": "...",
      "details": "...",
      "save_rate": "..."
    },
    {
      "title": "...",
      "category": "...",
      "why_now": "...",
      "details": "...",
      "save_rate": "..."
    }
  ],
  "top_pick_index": 0
}`;

  let messages = [{ role: 'user', content: userMsg }];

  for (let turn = 0; turn < 8; turn++) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 5 }],
        messages,
      }),
    });

    if (res.status === 529 || res.status === 503) {
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API 오류 ${res.status}`);
    }

    const data = await res.json();
    messages.push({ role: 'assistant', content: data.content });

    if (data.stop_reason === 'end_turn') {
      const textBlock = data.content.find(b => b.type === 'text');
      const raw = textBlock?.text || '';
      const match = raw.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('AI 응답 파싱 실패 — JSON을 찾을 수 없습니다.');
      return JSON.parse(match[0]);
    }

    if (data.stop_reason === 'tool_use') {
      // web_search 도구 호출 시 — 서버가 실행하거나 지식 기반으로 대체
      const toolResults = data.content
        .filter(b => b.type === 'tool_use')
        .map(b => ({
          type: 'tool_result',
          tool_use_id: b.id,
          content: b.content
            ? (typeof b.content === 'string' ? b.content : JSON.stringify(b.content))
            : '검색 결과를 가져올 수 없습니다. 최신 학습 데이터와 오늘 날짜 기준으로 최선의 트렌드 추천을 해주세요.',
        }));
      messages.push({ role: 'user', content: toolResults });
    }
  }

  throw new Error('리서치 완료 실패 — 최대 시도 초과');
}
