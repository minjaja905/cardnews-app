// 일반 카드뉴스 SVG 생성 — 다크 에디토리얼 스타일
// 1080 × 1350 px (인스타그램 4:5)

function escXml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SHADOW = `<filter id="gshdw" x="-5%" y="-5%" width="110%" height="110%">
    <feDropShadow dx="0" dy="3" stdDeviation="10" flood-color="black" flood-opacity="0.45"/>
  </filter>`;

function svgWrap(body, extraDefs = '') {
  return `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
${SHADOW}
${extraDefs}
  </defs>
${body}
</svg>`;
}

// ── 다크 배경 (bgImage 있으면 이미지 → 그라데이션 순서) ──────────────────────
function darkBg(id, bgImage = null) {
  if (bgImage) {
    // 이미지 배경: 항상 그라데이션 오버레이로 텍스트 가독성 확보
    return `<defs>
      <linearGradient id="${id}ov" x1="0" y1="0" x2="0" y2="1350" gradientUnits="userSpaceOnUse">
        <stop offset="0%"   stop-color="black" stop-opacity="0.22"/>
        <stop offset="35%"  stop-color="black" stop-opacity="0.30"/>
        <stop offset="100%" stop-color="black" stop-opacity="0.82"/>
      </linearGradient>
    </defs>
    <image href="${bgImage}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>
    <rect width="1080" height="1350" fill="url(#${id}ov)"/>`;
  }
  return `<defs>
    <linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1350" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#141416"/>
      <stop offset="100%" stop-color="#1C1E28"/>
    </linearGradient>
    <linearGradient id="${id}ov" x1="0" y1="0" x2="0" y2="1350" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="black" stop-opacity="0"/>
      <stop offset="55%"  stop-color="black" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="black" stop-opacity="0.54"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#${id})"/>
  <rect width="1080" height="1350" fill="url(#${id}ov)"/>`;
}

// ── 공통 요소 ─────────────────────────────────────────────────────────────────
function topHandle() {
  return `<text x="60" y="76" font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
    font-size="26" fill="white" fill-opacity="0.48">@minjaja.pdf</text>`;
}

function nextHint() {
  return `<text x="1020" y="1308" font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
    font-size="26" fill="white" fill-opacity="0.42" text-anchor="end">→ 다음 페이지로</text>`;
}

// ── 히어로 텍스트 (tspan, 최대 2줄) ──────────────────────────────────────────
function heroText(lines, y1, size = 90, lineH = 104) {
  const safe = (lines || []).filter(l => l && l.text).slice(0, 2);
  if (!safe.length) return '';
  const [first, ...rest] = safe;
  return `<text x="60" y="${y1}"
    font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
    font-weight="800" font-size="${size}" letter-spacing="-3"
    fill="${first.color || 'white'}">
    <tspan x="60" dy="0">${escXml(first.text)}</tspan>
    ${rest.map(l => `<tspan x="60" dy="${lineH}" fill="${l.color || 'white'}">${escXml(l.text)}</tspan>`).join('')}
  </text>`;
}

// ── 본문 텍스트 (tspan, 최대 3줄) ─────────────────────────────────────────────
function bodyText(textOrLines, y, size = 38, lineH = 52, opacity = 0.68) {
  const src = typeof textOrLines === 'string'
    ? textOrLines
    : (textOrLines || []).join('\n');
  const lines = src.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3);
  if (!lines.length) return '';
  return `<text x="60" y="${y}"
    font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
    font-size="${size}" fill="white" fill-opacity="${opacity}">
    ${lines.map((l, i) => `<tspan x="60" dy="${i === 0 ? '0' : lineH}">${escXml(l)}</tspan>`).join('')}
  </text>`;
}

// ── 섹션 라벨 (번호 + 제목 + 구분선) ─────────────────────────────────────────
function sectionHeader(num, title) {
  const numSvg = num
    ? `<text x="60" y="798" font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
        font-weight="800" font-size="22" fill="#3ECFB2" letter-spacing="4">${escXml(num)}</text>`
    : '';
  const titleX = num ? 120 : 60;
  const titleSvg = title
    ? `<text x="${titleX}" y="798" font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
        font-size="22" fill="white" fill-opacity="0.50">${escXml(title)}</text>`
    : '';
  return `${numSvg}${titleSvg}
  <rect x="60" y="816" width="56" height="4" rx="2" fill="#3ECFB2" fill-opacity="0.65"/>`;
}

// ── 포인트 아이템 ─────────────────────────────────────────────────────────────
function pointItem(text, y) {
  return `<rect x="60" y="${y}" width="5" height="36" rx="2.5" fill="#3ECFB2" fill-opacity="0.80"/>
  <text x="86" y="${y + 27}" font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
    font-size="30" fill="white" fill-opacity="0.88">${escXml(text)}</text>`;
}

// ── CARD 1 — 커버 ─────────────────────────────────────────────────────────────
function gCard1({ topic, category, heroLines, hook, bgImage }) {
  const safeHero = ((heroLines && heroLines.length)
    ? heroLines
    : [{ text: topic || '', color: 'white' }]
  ).filter(l => l && l.text).slice(0, 2);

  // 카테고리 pill: rect y=824~876
  const catW = category ? Math.max(160, category.length * 26 + 60) : 0;
  const catSvg = category ? `
    <rect x="60" y="824" width="${catW}" height="52" rx="10"
      fill="#3ECFB2" fill-opacity="0.15"/>
    <rect x="60" y="824" width="${catW}" height="52" rx="10"
      fill="none" stroke="#3ECFB2" stroke-opacity="0.50" stroke-width="1.5"/>
    <text x="84" y="860" font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
      font-size="28" fill="#3ECFB2">${escXml(category)}</text>` : '';

  // 히어로: line1 y=972, line2 y=1076 (lineH=104)
  const heroSvg = heroText(safeHero, 972, 90, 104);

  // 훅: 2줄 히어로일 때 y=1148, 1줄일 때 y=1060
  const hookY = safeHero.length > 1 ? 1148 : 1060;
  const hookSvg = hook
    ? `<text x="60" y="${hookY}"
        font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
        font-size="34" fill="white" fill-opacity="0.60">${escXml(hook)}</text>`
    : '';

  const body = `
  ${darkBg('c1bg', bgImage)}
  ${topHandle()}
  ${catSvg}
  ${heroSvg}
  ${hookSvg}`;

  return svgWrap(body);
}

// ── CARD 2 — 도입 ─────────────────────────────────────────────────────────────
function gCard2({ topic, heroLines, body: bodyTxt, highlight, bgImage }) {
  const safeHero = ((heroLines && heroLines.length)
    ? heroLines
    : [{ text: topic || '', color: 'white' }]
  ).filter(l => l && l.text).slice(0, 2);

  const n = safeHero.length;
  // 히어로: y=960 (1줄), y=960+y=1062 (2줄)
  const heroY1 = 960;
  const heroLastY = heroY1 + (n - 1) * 102;

  // 본문: 히어로 마지막 줄 기준 80px 아래
  const bodyY = heroLastY + 80;

  // 본문 텍스트 (최대 3줄)
  const bodyLines = [];
  if (bodyTxt) bodyLines.push(...bodyTxt.split('\n').filter(Boolean).slice(0, 3));
  const bodySvg = bodyLines.length ? bodyText(bodyLines, bodyY, 38, 52, 0.68) : '';

  // highlight: 본문 아래, 공간이 있을 때만
  const hlY = bodyY + Math.max(1, bodyLines.length) * 52 + 28;
  const hlSvg = highlight && hlY + 60 < 1290
    ? `<rect x="60" y="${hlY - 10}" width="960" height="56" rx="10"
        fill="#3ECFB2" fill-opacity="0.12"/>
       <rect x="60" y="${hlY - 10}" width="5" height="56" rx="2.5" fill="#3ECFB2"/>
       <text x="86" y="${hlY + 28}" font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
         font-weight="700" font-size="26" fill="white">${escXml(highlight)}</text>`
    : '';

  const body = `
  ${darkBg('c2bg', bgImage)}
  ${topHandle()}
  <rect x="60" y="862" width="56" height="4" rx="2" fill="#3ECFB2" fill-opacity="0.55"/>
  ${heroText(safeHero, heroY1, 88, 102)}
  ${bodySvg}
  ${hlSvg}
  ${nextHint()}`;

  return svgWrap(body);
}

// ── CARD 3 — 핵심 내용 1 ─────────────────────────────────────────────────────
function gCard3({ topic, sectionNum, sectionTitle, heroLines, points, bgImage }) {
  const safeHero = ((heroLines && heroLines.length)
    ? heroLines
    : [{ text: topic || '', color: 'white' }]
  ).filter(l => l && l.text).slice(0, 2);

  const n = safeHero.length;
  const heroY1 = 942;
  const heroLastY = heroY1 + (n - 1) * 96;

  // 포인트: 히어로 이후 64px
  const ptY0 = heroLastY + 64;
  const safePoints = (points || []).slice(0, 3);
  const ptSvg = safePoints.map((text, i) => {
    const y = ptY0 + i * 62;
    return pointItem(text, y);
  }).join('\n');

  const body = `
  ${darkBg('c3bg', bgImage)}
  ${topHandle()}
  ${sectionHeader(sectionNum || '01', sectionTitle)}
  ${heroText(safeHero, heroY1, 84, 96)}
  ${ptSvg}
  ${nextHint()}`;

  return svgWrap(body);
}

// ── CARD 4 — 핵심 내용 2 ─────────────────────────────────────────────────────
function gCard4({ topic, sectionNum, sectionTitle, heroLines, points, bgImage }) {
  const safeHero = ((heroLines && heroLines.length)
    ? heroLines
    : [{ text: topic || '', color: 'white' }]
  ).filter(l => l && l.text).slice(0, 2);

  const n = safeHero.length;
  const heroY1 = 942;
  const heroLastY = heroY1 + (n - 1) * 96;

  const ptY0 = heroLastY + 64;
  const safePoints = (points || []).slice(0, 3);
  const ptSvg = safePoints.map((text, i) => {
    const y = ptY0 + i * 62;
    // 카드 3과 스타일 차별화: 배경 rect 교대 적용
    const accent = i % 2 === 0;
    return `<rect x="60" y="${y - 4}" width="960" height="48" rx="24"
      fill="${accent ? '#3ECFB2' : 'white'}" fill-opacity="${accent ? '0.10' : '0.05'}"/>
    ${pointItem(text, y)}`;
  }).join('\n');

  const body = `
  ${darkBg('c4bg', bgImage)}
  ${topHandle()}
  ${sectionHeader(sectionNum || '02', sectionTitle)}
  ${heroText(safeHero, heroY1, 84, 96)}
  ${ptSvg}
  ${nextHint()}`;

  return svgWrap(body);
}

// ── CARD 5 — 핵심 요약 ────────────────────────────────────────────────────────
function gCard5({ topic, heroLines, summaries, closingLine, bgImage }) {
  const defaultHero = [
    { text: '정리하면', color: 'white' },
    { text: '이거예요.', color: '#3ECFB2' },
  ];
  const safeHero = ((heroLines && heroLines.length)
    ? heroLines
    : defaultHero
  ).filter(l => l && l.text).slice(0, 2);

  const n = safeHero.length;
  const heroY1 = 616;
  const heroLastY = heroY1 + (n - 1) * 102;

  // 구분선 + 요약 아이템
  const divY = heroLastY + 52;
  const sumY0 = divY + 44;
  const safeSums = (summaries || []).slice(0, 3);

  const sumSvg = safeSums.map((text, i) => {
    const y = sumY0 + i * 84;
    return `<rect x="60" y="${y}" width="960" height="52" rx="4"
      fill="white" fill-opacity="0.05"/>
    <rect x="60" y="${y}" width="5" height="52" rx="2.5" fill="#3ECFB2"/>
    <text x="86" y="${y + 35}" font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
      font-weight="700" font-size="28" fill="white" fill-opacity="0.92">${escXml(text)}</text>`;
  }).join('\n');

  // 클로징 라인
  const closeY = sumY0 + safeSums.length * 84 + 44;
  const closeSvg = closingLine && closeY + 60 < 1300
    ? `<rect x="360" y="${closeY - 10}" width="360" height="56" rx="28"
        fill="#3ECFB2" fill-opacity="0.18"/>
       <text x="540" y="${closeY + 27}" font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
         font-size="24" fill="#3ECFB2" text-anchor="middle">${escXml(closingLine)}</text>`
    : '';

  const body = `
  ${darkBg('c5bg', bgImage)}
  ${topHandle()}
  ${heroText(safeHero, heroY1, 86, 102)}
  <rect x="60" y="${divY}" width="960" height="2" fill="white" fill-opacity="0.12"/>
  ${sumSvg}
  ${closeSvg}`;

  return svgWrap(body);
}

// ── CARD 6 — 마무리 ───────────────────────────────────────────────────────────
function gCard6({ topic, heroText: ht, keyMessage, ctaLines, bgImage }) {
  const glow = `<radialGradient id="g6glow" cx="50%" cy="40%" r="40%">
      <stop offset="0%"   stop-color="#3ECFB2" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#3ECFB2" stop-opacity="0"/>
    </radialGradient>`;

  const ctaArr = ctaLines && ctaLines.length
    ? ctaLines
    : ['유용하셨다면 저장해두세요 🔖', '↳ 팔로우하면 매주 유용한 콘텐츠를'];

  const body = `
  ${darkBg('c6bg', bgImage)}
  <ellipse cx="540" cy="520" rx="480" ry="280" fill="url(#g6glow)"/>
  ${topHandle()}
  <text x="540" y="490"
    font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
    font-weight="800" font-size="64" letter-spacing="-2" fill="white" text-anchor="middle">
    ${escXml(ht || '기억하세요')}
  </text>
  ${keyMessage
    ? `<text x="540" y="572" font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
        font-size="28" fill="white" fill-opacity="0.60" text-anchor="middle">${escXml(keyMessage)}</text>`
    : ''}
  <rect x="340" y="616" width="400" height="2" fill="white" fill-opacity="0.18"/>
  ${ctaArr.map((t, i) => {
    const font = i === 0
      ? `font-family="'Pretendard ExtraBold','Pretendard',sans-serif" font-weight="800" font-size="30" fill="white"`
      : `font-family="'Pretendard','Apple SD Gothic Neo',sans-serif" font-size="24" fill="white" fill-opacity="0.58"`;
    return `<text x="540" y="${676 + i * 54}" ${font} text-anchor="middle">${escXml(t)}</text>`;
  }).join('\n')}
  <rect x="370" y="962" width="340" height="58" rx="29" fill="#3ECFB2"/>
  <text x="540" y="999" font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
    font-size="22" fill="white" text-anchor="middle">팔로우하고 더 알아가기 ✦</text>
  <text x="540" y="1252" font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
    font-size="26" fill="white" fill-opacity="0.44" text-anchor="middle">@minjaja.pdf</text>`;

  return svgWrap(body, glow);
}

// ── 공개 API ──────────────────────────────────────────────────────────────────
export function generateGeneralCard(cardNum, params) {
  switch (cardNum) {
    case 1: return gCard1(params);
    case 2: return gCard2(params);
    case 3: return gCard3(params);
    case 4: return gCard4(params);
    case 5: return gCard5(params);
    case 6: return gCard6(params);
    default: return '';
  }
}

export const GENERAL_CARD_LABELS = ['커버', '도입', '내용1', '내용2', '요약', '마무리'];

export function makeDefaultGeneralParams(topic = '') {
  return {
    card1: {
      category: '카드뉴스',
      heroLines: [
        { text: topic || '주제를 입력하세요', color: 'white' },
        { text: '', color: '#3ECFB2' },
      ],
      hook: '스크롤 멈추고 저장하세요',
    },
    card2: {
      heroLines: [
        { text: '왜 지금', color: 'white' },
        { text: '알아야 할까요?', color: '#3ECFB2' },
      ],
      body: '도입 내용을 입력하세요.\n공감가는 상황을 먼저 제시하세요.',
      highlight: '핵심 한 줄',
    },
    card3: {
      sectionNum: '01',
      sectionTitle: '첫 번째 포인트',
      heroLines: [
        { text: '핵심', color: 'white' },
        { text: '내용1', color: '#3ECFB2' },
      ],
      points: ['📌 포인트 1', '📌 포인트 2', '📌 포인트 3'],
    },
    card4: {
      sectionNum: '02',
      sectionTitle: '두 번째 포인트',
      heroLines: [
        { text: '핵심', color: 'white' },
        { text: '내용2', color: '#3ECFB2' },
      ],
      points: ['✅ 포인트 1', '✅ 포인트 2', '✅ 포인트 3'],
    },
    card5: {
      heroLines: [
        { text: '정리하면', color: 'white' },
        { text: '이거예요.', color: '#3ECFB2' },
      ],
      summaries: ['요약 1', '요약 2', '요약 3'],
      closingLine: '마지막 인사이트',
    },
    card6: {
      heroText: '기억하세요',
      keyMessage: '가장 중요한 메시지',
      ctaLines: ['유용하셨다면 저장해두세요 🔖', '↳ 팔로우하면 매주 유용한 콘텐츠를'],
    },
  };
}
