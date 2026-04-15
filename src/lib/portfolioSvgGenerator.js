// 포트폴리오 카드뉴스 SVG 생성 — 퍼스널 브랜딩 스타일 (센터 레이아웃)
// 1080 × 1350 px (인스타그램 4:5)

function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function svgWrap(body, extraDefs = '') {
  return `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="gshdw" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="3" stdDeviation="10" flood-color="black" flood-opacity="0.45"/>
    </filter>
${extraDefs}
  </defs>
${body}
</svg>`;
}

// ── 텍스트 줄바꿈 (SVG는 자동 줄바꿈 없음) ───────────────────────────────────
function wrapSvgText(text, maxChars) {
  if (!text) return [''];
  if (text.length <= maxChars) return [text];
  const result = [];
  for (let i = 0; i < text.length; i += maxChars) {
    result.push(text.slice(i, i + maxChars));
  }
  return result;
}

// ── 다크 배경 ──────────────────────────────────────────────────────────────────
function darkBg(id) {
  return `<defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1350" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#111318"/>
      <stop offset="100%" stop-color="#181C26"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#${id})"/>`;
}

// ── 공통: 핸들 (@minjaja.pdf) ─────────────────────────────────────────────────
function handle() {
  return `<text x="60" y="76" font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
    font-size="26" fill="white" fill-opacity="0.45">@minjaja.pdf</text>`;
}

// ── 공통: 파트 배지 (우상단) ───────────────────────────────────────────────────
function partBadge(part) {
  if (!part) return '';
  const w = part.length * 22 + 52;
  const x = 1080 - 60 - w;
  return `<rect x="${x}" y="52" width="${w}" height="40" rx="20"
    fill="#3ECFB2" fill-opacity="0.15"/>
  <rect x="${x}" y="52" width="${w}" height="40" rx="20"
    fill="none" stroke="#3ECFB2" stroke-opacity="0.50" stroke-width="1.5"/>
  <text x="${x + w / 2}" y="78" font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
    font-size="20" fill="#3ECFB2" text-anchor="middle">${escXml(part)}</text>`;
}

// ── 공통: 섹션 라벨 (가운데 정렬) ──────────────────────────────────────────────
function sectionLabel(label) {
  return `<text x="540" y="178" text-anchor="middle"
    font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
    font-weight="800" font-size="20" fill="#3ECFB2" letter-spacing="4">${escXml(label)}</text>
  <rect x="500" y="196" width="80" height="3" rx="1.5" fill="#3ECFB2" fill-opacity="0.70"/>`;
}

// ── 공통: 히어로 텍스트 (가운데 정렬 + 자동 줄바꿈) ──────────────────────────
function heroText(lines, y1, size = 72, lineH = 90) {
  const safe = (lines || []).filter(l => l && l.text).slice(0, 2);
  if (!safe.length) return '';

  // 한글 기준 글자 너비 추정 (size * 0.88), 좌우 패딩 80px 확보
  const maxChars = Math.max(6, Math.floor(900 / (size * 0.88)));

  const expanded = [];
  for (const line of safe) {
    wrapSvgText(line.text, maxChars).forEach(t =>
      expanded.push({ text: t, color: line.color || 'white' })
    );
  }

  const tspans = expanded
    .map((l, i) =>
      `<tspan x="540" dy="${i === 0 ? '0' : lineH}" fill="${l.color}">${escXml(l.text)}</tspan>`
    )
    .join('\n    ');

  return `<text x="540" y="${y1}" text-anchor="middle"
    font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
    font-weight="800" font-size="${size}" letter-spacing="-1">
    ${tspans}
  </text>`;
}

// 히어로 텍스트 높이 계산 (동적 y 포지셔닝용)
function heroTextH(lines, size = 72, lineH = 90) {
  const safe = (lines || []).filter(l => l && l.text).slice(0, 2);
  if (!safe.length) return 0;
  const maxChars = Math.max(6, Math.floor(900 / (size * 0.88)));
  let total = 0;
  for (const line of safe) total += wrapSvgText(line.text, maxChars).length;
  return size + (total - 1) * lineH;
}

// ── 공통: 본문 텍스트 (가운데 정렬) ───────────────────────────────────────────
function bodyText(text, y, size = 32, lineH = 48, opacity = 0.65) {
  const lines = (typeof text === 'string' ? text : '')
    .split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3);
  if (!lines.length) return '';
  return `<text x="540" y="${y}" text-anchor="middle"
    font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
    font-size="${size}" fill="white" fill-opacity="${opacity}">
    ${lines.map((l, i) => `<tspan x="540" dy="${i === 0 ? '0' : lineH}">${escXml(l)}</tspan>`).join('')}
  </text>`;
}

// ── 공통: 포인트/임팩트 아이템 (왼쪽 정렬 유지 — 가독성) ──────────────────────
function bulletItem(text, y) {
  return `<rect x="100" y="${y}" width="4" height="40" rx="2" fill="#3ECFB2" fill-opacity="0.80"/>
  <text x="124" y="${y + 29}" font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
    font-size="30" fill="white" fill-opacity="0.88">${escXml(text)}</text>`;
}

// ── 공통: 도구 배지들 (가운데 정렬) ───────────────────────────────────────────
function toolBadges(tools, y0 = 800, lineH = 58, gap = 12) {
  if (!tools || tools.length === 0) return '';
  // 먼저 전체 너비 계산 후 시작 x 결정
  const maxRight = 960;
  let rows = [[]];
  let rowWidths = [0];
  let ri = 0;
  for (const tool of tools) {
    const w = tool.length * 20 + 48;
    if (rowWidths[ri] + w + (rows[ri].length ? gap : 0) > maxRight && rows[ri].length) {
      ri++;
      rows.push([]);
      rowWidths.push(0);
    }
    rows[ri].push({ tool, w });
    rowWidths[ri] += w + (rows[ri].length > 1 ? gap : 0);
  }

  let result = '';
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const rowW = rowWidths[r];
    let x = Math.round((1080 - rowW) / 2);
    const y = y0 + r * lineH;
    for (const { tool, w } of row) {
      result += `<rect x="${x}" y="${y}" width="${w}" height="44" rx="22"
        fill="#3ECFB2" fill-opacity="0.12"/>
      <rect x="${x}" y="${y}" width="${w}" height="44" rx="22"
        fill="none" stroke="#3ECFB2" stroke-opacity="0.38" stroke-width="1.5"/>
      <text x="${x + w / 2}" y="${y + 28}" font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
        font-size="21" fill="#3ECFB2" text-anchor="middle">${escXml(tool)}</text>`;
      x += w + gap;
    }
  }
  return result;
}

// ── 공통: 다음 페이지 힌트 ────────────────────────────────────────────────────
function nextHint() {
  return `<text x="1020" y="1308" font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
    font-size="26" fill="white" fill-opacity="0.42" text-anchor="end">→ 다음 페이지로</text>`;
}

// ── 참고 이미지 (배경 아님 — 인셋 사진) ──────────────────────────────────────
function referenceImg(image, cardId, y = 230, w = 820, h = 280) {
  if (!image) return '';
  const x = Math.round((1080 - w) / 2);
  const clipId = `rc${cardId}`;
  return `<clipPath id="${clipId}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"/>
  </clipPath>
  <image x="${x}" y="${y}" width="${w}" height="${h}"
    href="${image}" preserveAspectRatio="xMidYMid slice"
    clip-path="url(#${clipId})" opacity="0.90"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18"
    fill="none" stroke="white" stroke-opacity="0.12" stroke-width="1.5"/>
  <text x="${x + w - 16}" y="${y + h - 16}"
    font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
    font-size="18" fill="white" fill-opacity="0.35" text-anchor="end">참고 이미지</text>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD 1 — 커버
// ─────────────────────────────────────────────────────────────────────────────
function pCard1({ projectLines, tagline, part, seriesNum, image }) {
  const safeLines = (projectLines || []).filter(l => l && l.text).slice(0, 2);
  const hSize = 68;
  const hLineH = 86;

  const hasImg = !!image;
  const imgSvg = hasImg ? referenceImg(image, 'c1', 120, 820, 330) : '';

  const heroY = hasImg ? 560 : 640;
  const heroSvg = heroText(safeLines, heroY, hSize, hLineH);
  const heroH = heroTextH(safeLines, hSize, hLineH);

  // 가운데 장식선 (이미지 없을 때만)
  const decoSvg = !hasImg
    ? `<rect x="492" y="${heroY - 52}" width="96" height="4" rx="2" fill="#3ECFB2" fill-opacity="0.55"/>`
    : '';

  const tagY = heroY + heroH + 56;
  const tagSvg = tagline
    ? `<text x="540" y="${tagY}" text-anchor="middle"
        font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
        font-size="32" fill="white" fill-opacity="0.58">${escXml(tagline)}</text>`
    : '';

  const divSvg = `<rect x="60" y="1120" width="960" height="1" fill="white" fill-opacity="0.10"/>`;
  const seriesSvg = seriesNum
    ? `<text x="60" y="1158" font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
        font-weight="800" font-size="22" fill="#3ECFB2" letter-spacing="3">#${escXml(seriesNum)}</text>`
    : '';
  const sysLabel = `<text x="60" y="1200" font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
    font-size="24" fill="white" fill-opacity="0.38">시스템화 시리즈 · ${escXml(part || '')}</text>`;

  return svgWrap(`
  ${darkBg('p1bg')}
  ${imgSvg}
  ${handle()}
  ${partBadge(part)}
  ${decoSvg}
  ${heroSvg}
  ${tagSvg}
  ${divSvg}
  ${seriesSvg}
  ${sysLabel}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD 2 — 문제 (Problem)
// ─────────────────────────────────────────────────────────────────────────────
function pCard2({ heroLines, body: bodyTxt, points, image }) {
  const safeHero = (heroLines || []).filter(l => l && l.text).slice(0, 2);
  const hSize = 72;
  const hLineH = 90;

  const hasImg = !!image;
  const imgSvg = hasImg ? referenceImg(image, 'c2', 230, 820, 260) : '';

  const heroY = hasImg ? 600 : 310;
  const heroH = heroTextH(safeHero, hSize, hLineH);

  const bodyY = heroY + heroH + 60;
  const bodySvg = bodyText(bodyTxt, bodyY, 32, 48, 0.62);
  const bodyLines = (bodyTxt || '').split('\n').filter(Boolean).slice(0, 3);

  const ptY0 = bodyY + Math.max(1, bodyLines.length) * 48 + 50;
  const safePoints = (points || []).slice(0, 3);
  const ptSvg = safePoints.map((t, i) => bulletItem(t, ptY0 + i * 72)).join('\n');

  return svgWrap(`
  ${darkBg('p2bg')}
  ${handle()}
  ${sectionLabel('PROBLEM')}
  ${imgSvg}
  ${heroText(safeHero, heroY, hSize, hLineH)}
  ${bodySvg}
  ${ptSvg}
  ${nextHint()}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD 3 — 해결 (Solution)
// ─────────────────────────────────────────────────────────────────────────────
function pCard3({ heroLines, body: bodyTxt, toolHighlight, tools, image }) {
  const safeHero = (heroLines || []).filter(l => l && l.text).slice(0, 2);
  const hSize = 72;
  const hLineH = 90;

  const hasImg = !!image;
  const imgSvg = hasImg ? referenceImg(image, 'c3', 230, 820, 260) : '';

  const heroY = hasImg ? 600 : 310;
  const heroH = heroTextH(safeHero, hSize, hLineH);

  const bodyY = heroY + heroH + 60;
  const bodySvg = bodyText(bodyTxt, bodyY, 32, 48, 0.62);
  const bodyLines = (bodyTxt || '').split('\n').filter(Boolean).slice(0, 3);

  const hlY = bodyY + Math.max(1, bodyLines.length) * 48 + 40;
  const hlSvg = toolHighlight
    ? `<rect x="130" y="${hlY - 14}" width="820" height="56" rx="10"
        fill="#3ECFB2" fill-opacity="0.10"/>
       <rect x="130" y="${hlY - 14}" width="5" height="56" rx="2.5" fill="#3ECFB2"/>
       <text x="540" y="${hlY + 24}" text-anchor="middle"
         font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
         font-size="26" fill="white" fill-opacity="0.88">${escXml(toolHighlight)}</text>`
    : '';

  const badgeY = hlY + 90;
  const badgeSvg = toolBadges(tools, badgeY, 56, 10);

  return svgWrap(`
  ${darkBg('p3bg')}
  ${handle()}
  ${sectionLabel('SOLUTION')}
  ${imgSvg}
  ${heroText(safeHero, heroY, hSize, hLineH)}
  ${bodySvg}
  ${hlSvg}
  ${badgeSvg}
  ${nextHint()}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD 4 — 임팩트 (Impact)
// ─────────────────────────────────────────────────────────────────────────────
function pCard4({ heroLines, impacts, image }) {
  const safeHero = (heroLines || []).filter(l => l && l.text).slice(0, 2);
  const hSize = 72;
  const hLineH = 90;

  const hasImg = !!image;
  const imgSvg = hasImg ? referenceImg(image, 'c4', 230, 820, 260) : '';

  const heroY = hasImg ? 600 : 310;
  const heroH = heroTextH(safeHero, hSize, hLineH);

  const impY0 = heroY + heroH + 90;
  const safeImpacts = (impacts || []).slice(0, 3);
  const impSvg = safeImpacts.map((text, i) => {
    const y = impY0 + i * 96;
    return `<rect x="130" y="${y - 8}" width="820" height="72" rx="12"
      fill="white" fill-opacity="${i % 2 === 0 ? '0.05' : '0.03'}"/>
    <rect x="130" y="${y - 8}" width="5" height="72" rx="2.5" fill="#3ECFB2"/>
    <text x="540" y="${y + 34}" text-anchor="middle"
      font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
      font-size="30" fill="white" fill-opacity="0.90">${escXml(text)}</text>`;
  }).join('\n');

  return svgWrap(`
  ${darkBg('p4bg')}
  ${handle()}
  ${sectionLabel('IMPACT')}
  ${imgSvg}
  ${heroText(safeHero, heroY, hSize, hLineH)}
  ${impSvg}
  ${nextHint()}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD 5 — 스택 (Stack)
// ─────────────────────────────────────────────────────────────────────────────
function pCard5({ stackTitle, stackCaption, tools }) {
  const titleSvg = `<text x="540" y="240" text-anchor="middle"
    font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
    font-weight="800" font-size="52" fill="white" letter-spacing="-1">${escXml(stackTitle || '사용한 도구들')}</text>`;

  const badgeSvg = toolBadges(tools, 320, 68, 14);

  const divSvg = `<rect x="60" y="1000" width="960" height="1" fill="white" fill-opacity="0.10"/>`;

  const captionSvg = stackCaption
    ? `<text x="540" y="1056" text-anchor="middle"
        font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
        font-size="30" fill="white" fill-opacity="0.56">${escXml(stackCaption)}</text>`
    : '';

  const aiBadge = `<rect x="390" y="1110" width="300" height="50" rx="25"
    fill="#3ECFB2" fill-opacity="0.15"/>
  <rect x="390" y="1110" width="300" height="50" rx="25"
    fill="none" stroke="#3ECFB2" stroke-opacity="0.50" stroke-width="1.5"/>
  <text x="540" y="1142" text-anchor="middle"
    font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
    font-weight="700" font-size="22" fill="#3ECFB2">AI × 직접 구현 ✦</text>`;

  return svgWrap(`
  ${darkBg('p5bg')}
  ${handle()}
  ${sectionLabel('STACK')}
  ${titleSvg}
  ${badgeSvg}
  ${divSvg}
  ${captionSvg}
  ${aiBadge}
  ${nextHint()}`);
}

// ─────────────────────────────────────────────────────────────────────────────
// CARD 6 — 아웃트로
// ─────────────────────────────────────────────────────────────────────────────
function pCard6({ outroLines, seriesInfo, ctaLine }) {
  const safeOutro = (outroLines || [
    { text: '나는 시스템으로', color: 'white' },
    { text: '일합니다.', color: '#3ECFB2' },
  ]).filter(l => l && l.text).slice(0, 2);

  const glowDef = `<radialGradient id="p6glow" cx="50%" cy="45%" r="45%">
    <stop offset="0%"   stop-color="#3ECFB2" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="#3ECFB2" stop-opacity="0"/>
  </radialGradient>`;

  const heroY = safeOutro.length > 1 ? 500 : 560;
  const heroH = heroTextH(safeOutro, 88, 100);
  const heroLastY = heroY + heroH;

  const divY = heroLastY + 80;
  const divSvg = `<rect x="320" y="${divY}" width="440" height="2" fill="white" fill-opacity="0.15"/>`;

  const sInfoY = divY + 60;
  const sInfoSvg = seriesInfo
    ? `<text x="540" y="${sInfoY}" text-anchor="middle"
        font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
        font-size="26" fill="white" fill-opacity="0.45">${escXml(seriesInfo)}</text>`
    : '';

  const ctaY = sInfoY + 70;
  const ctaSvg = ctaLine
    ? `<text x="540" y="${ctaY}" text-anchor="middle"
        font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
        font-weight="700" font-size="28" fill="white">${escXml(ctaLine)}</text>`
    : '';

  const btnY = Math.max(ctaY + 80, 1020);
  const btnSvg = `<rect x="370" y="${btnY}" width="340" height="58" rx="29" fill="#3ECFB2"/>
  <text x="540" y="${btnY + 37}" text-anchor="middle"
    font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
    font-size="22" fill="white">팔로우하고 더 보기 ✦</text>`;

  const bottomHandle = `<text x="540" y="1288" text-anchor="middle"
    font-family="'Apple SD Gothic Neo',sans-serif" font-weight="300"
    font-size="26" fill="white" fill-opacity="0.40">@minjaja.pdf</text>`;

  return svgWrap(`
  ${darkBg('p6bg')}
  <ellipse cx="540" cy="530" rx="480" ry="280" fill="url(#p6glow)"/>
  ${handle()}
  ${heroText(safeOutro, heroY, 88, 100)}
  ${divSvg}
  ${sInfoSvg}
  ${ctaSvg}
  ${btnSvg}
  ${bottomHandle}`, glowDef);
}

// ─────────────────────────────────────────────────────────────────────────────
// 공개 API
// ─────────────────────────────────────────────────────────────────────────────
export function generatePortfolioCard(cardNum, params) {
  switch (cardNum) {
    case 1: return pCard1(params);
    case 2: return pCard2(params);
    case 3: return pCard3(params);
    case 4: return pCard4(params);
    case 5: return pCard5(params);
    case 6: return pCard6(params);
    default: return '';
  }
}

export const PORTFOLIO_CARD_LABELS = ['커버', '문제', '해결', '임팩트', '스택', '아웃트로'];

export function makeDefaultPortfolioParams({ part = '', projectName = '', problem = '', solution = '', impacts = [], tools = [], seriesNum = '' } = {}) {
  const pLines = projectName.includes('\n')
    ? projectName.split('\n').map((t, i) => ({ text: t.trim(), color: i === 0 ? 'white' : '#3ECFB2' }))
    : [{ text: projectName || '프로젝트명', color: 'white' }, { text: '자동화 시스템', color: '#3ECFB2' }];

  return {
    card1: {
      projectLines: pLines,
      tagline: '반복 업무를 시스템으로',
      part,
      seriesNum,
    },
    card2: {
      heroLines: [
        { text: '이런 불편함이', color: 'white' },
        { text: '있었습니다.', color: '#3ECFB2' },
      ],
      body: problem || '문제 상황을 입력하세요.',
      points: ['😩 불편함 포인트 1', '⏱ 불편함 포인트 2', '🔁 반복 작업 포인트 3'],
    },
    card3: {
      heroLines: [
        { text: '이렇게', color: 'white' },
        { text: '해결했습니다.', color: '#3ECFB2' },
      ],
      body: solution || '해결 방법을 입력하세요.',
      toolHighlight: tools.length ? tools.join(' → ') : '도구 흐름',
      tools,
    },
    card4: {
      heroLines: [
        { text: '결과는', color: 'white' },
        { text: '명확했습니다.', color: '#3ECFB2' },
      ],
      impacts: impacts.length ? impacts : ['⚡ 임팩트 1', '🎯 임팩트 2', '✅ 임팩트 3'],
    },
    card5: {
      stackTitle: '사용한 도구들',
      stackCaption: 'AI와 함께 기획부터 배포까지 직접',
      tools,
    },
    card6: {
      outroLines: [
        { text: '나는 시스템으로', color: 'white' },
        { text: '일합니다.', color: '#3ECFB2' },
      ],
      seriesInfo: `시스템화 시리즈 · ${part}`,
      ctaLine: '다음 시스템화 사례도 구경하세요 →',
    },
  };
}
