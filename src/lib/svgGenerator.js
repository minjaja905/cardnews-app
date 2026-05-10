// SVG 생성 엔진 — 1080 × 1350 px (인스타 4:5)
// 디자인: 검정박스 → 사진 → 텍스트 → teal 인사이트 (vertical 3-zone)

// ── 공통 유틸 ────────────────────────────────────────────────────────────────

function escXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function clampFontSize(text, base, maxWidth) {
  const len = String(text).length || 1;
  const needed = Math.floor(maxWidth / (len * 0.68));
  return Math.min(base, Math.max(needed, Math.floor(base * 0.55)));
}

function wrapText(text, maxPx, fontSize) {
  const avgW = fontSize * 0.75;
  const maxChars = Math.max(4, Math.floor(maxPx / avgW));
  const result = [];
  let str = String(text || '');
  while (str.length > maxChars) {
    let cut = maxChars;
    for (let i = maxChars - 1; i >= Math.max(1, maxChars - 6); i--) {
      if (str[i] === ' ') { cut = i + 1; break; }
    }
    result.push(str.slice(0, cut).trimEnd());
    str = str.slice(cut).trimStart();
  }
  if (str) result.push(str);
  return result.length ? result : [''];
}

const SHADOW_DEF = `<filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
    <feDropShadow dx="0" dy="3" stdDeviation="8" flood-opacity="0.12"/>
  </filter>`;

function svgWrap(content, extraDefs = '') {
  return `<svg width="1080" height="1350" viewBox="0 0 1080 1350" fill="none"
     xmlns="http://www.w3.org/2000/svg">
  <defs>
${SHADOW_DEF}
${extraDefs}
  </defs>
${content}
</svg>`;
}

// ── 공통 컴포넌트 ─────────────────────────────────────────────────────────────

function mintBg() {
  return `<rect width="1080" height="1350" fill="#C8EDE3"/>`;
}

function bars() {
  return `<rect x="0" y="0" width="1080" height="6" fill="#3ECFB2"/>
  <rect x="0" y="1344" width="1080" height="6" fill="#3ECFB2"/>`;
}

function footer() {
  return `<text x="540" y="1272" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="26" fill="#3ECFB2" text-anchor="middle">@minjaja.pdf</text>
  <text x="540" y="1304" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="18" fill="#888888" text-anchor="middle">Content Marketer · Meme Curator</text>`;
}

// 검정 박스 — heroLines 포함, 박스 높이 자동
// returns { svg, endY }
function heroBox(heroLines, boxY = 75) {
  const lines = (heroLines || []).slice(0, 3).filter(l => l?.text);
  if (!lines.length) return { svg: '', endY: boxY };

  const BOX_W = 760;
  const BOX_X = (1080 - BOX_W) / 2;
  const FS0 = clampFontSize(lines[0].text, 84, BOX_W - 80);
  const LH0 = Math.floor(FS0 * 1.28);

  // 각 줄의 높이 합산
  const lineHeights = lines.map((line, i) => {
    const fs = i === 0 ? FS0 : clampFontSize(line.text, Math.floor(FS0 * 0.88), BOX_W - 80);
    return Math.floor(fs * 1.28);
  });
  const totalTextH = lineHeights.reduce((a, b) => a + b, 0);
  const BOX_H = totalTextH + 54;

  // 각 줄의 baseline y (박스 상단에서 vertical center)
  const padTop = Math.floor((BOX_H - totalTextH) / 2);
  let curY = boxY + padTop;

  const textSvg = lines.map((line, i) => {
    const fs = i === 0 ? FS0 : clampFontSize(line.text, Math.floor(FS0 * 0.88), BOX_W - 80);
    const lh = lineHeights[i];
    const baseline = curY + Math.floor(fs * 0.82);
    curY += lh;
    const fill = line.color === '#3ECFB2' ? '#3ECFB2' : 'white';
    return `<text x="540" y="${baseline}"
      font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
      font-weight="800" font-size="${fs}" letter-spacing="-2"
      fill="${fill}" text-anchor="middle">${escXml(line.text)}</text>`;
  }).join('\n');

  return {
    svg: `<rect x="${BOX_X}" y="${boxY}" width="${BOX_W}" height="${BOX_H}" rx="12" fill="#1A1A1A"/>
${textSvg}`,
    endY: boxY + BOX_H,
  };
}

// 중앙 정렬 사진
function centeredPhoto(src, photoY, photoH = 460) {
  if (!src) return { svg: '', endY: photoY };
  const W = 800;
  const X = (1080 - W) / 2;
  const clipId = `mainClip_${photoY}`;
  return {
    svg: `<image href="${src}" x="${X}" y="${photoY}" width="${W}" height="${photoH}"
         preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>
  <clipPath id="${clipId}">
    <rect x="${X}" y="${photoY}" width="${W}" height="${photoH}" rx="20"/>
  </clipPath>
  <rect x="${X}" y="${photoY}" width="${W}" height="${photoH}" rx="20"
        fill="none" stroke="#FFFFFF" stroke-opacity="0.3" stroke-width="1.5"/>`,
    endY: photoY + photoH,
  };
}

// 중앙 정렬 본문 텍스트 블록
// returns { svg, endY }
function bodyBlock(lines, startY, { fontSize = 30, color = '#333333', lineH = 46, bold = false } = {}) {
  if (!lines?.length) return { svg: '', endY: startY };
  const allWrapped = lines.flatMap(t => wrapText(t, 860, fontSize));
  const ff = bold
    ? `font-family="'Pretendard ExtraBold','Pretendard',sans-serif" font-weight="800"`
    : `font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"`;
  const svg = allWrapped.map((t, i) =>
    `<text x="540" y="${startY + i * lineH}" ${ff}
      font-size="${fontSize}" fill="${color}" text-anchor="middle">${escXml(t)}</text>`
  ).join('\n');
  return { svg, endY: startY + allWrapped.length * lineH };
}

// teal 인사이트 한 줄 (중앙)
function tealLine(text, y) {
  if (!text) return '';
  const fs = clampFontSize(text, 28, 900);
  return `<text x="540" y="${y}"
    font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="${fs}" fill="#3ECFB2" text-anchor="middle">${escXml(text)}</text>`;
}

// 좌측 정렬 큰 텍스트 (일반 모드 내부 카드용 — 박스 없음)
// returns { svg, endY }
function heroLeft(heroLines, startY = 100) {
  const lines = (heroLines || []).slice(0, 3).filter(l => l?.text);
  if (!lines.length) return { svg: '', endY: startY };

  const FS0 = clampFontSize(lines[0].text, 84, 960);
  let curY = startY + Math.floor(FS0 * 0.82);

  const svg = lines.map((line, i) => {
    const fs = i === 0 ? FS0 : clampFontSize(line.text, Math.floor(FS0 * 0.88), 960);
    const baseline = curY;
    curY += Math.floor(fs * 1.3);
    return `<text x="60" y="${baseline}"
      font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
      font-weight="800" font-size="${fs}" letter-spacing="-2"
      fill="${line.color || '#1A1A1A'}">${escXml(line.text)}</text>`;
  }).join('\n');

  return { svg, endY: curY };
}

// thin divider
function divider(y) {
  return `<rect x="200" y="${y}" width="680" height="1.5" fill="#1A1A1A" fill-opacity="0.12"/>`;
}

// ── CARD 1 — 커버 ─────────────────────────────────────────────────────────────
function card1({ volNum, date, subtitle, heroLines, badgeLabel, coverImg }) {
  const safeHero = (heroLines || []).slice(0, 3);
  const lineCount = safeHero.length;

  const heroSvg = safeHero.map((line, i) =>
    `<text x="60" y="${268 + i * 140}"
      font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
      font-weight="800" font-size="120" letter-spacing="-2"
      fill="${line.color || '#1A1A1A'}">${escXml(line.text)}</text>`
  ).join('\n');

  const badgeY = lineCount >= 3 ? 680 : 540;
  const badgeCenterX = 85 + 196 / 2;
  const badgeTextY = badgeY + 26;
  const dividerY = badgeY + 55;
  const subtitleY = dividerY + 30;

  const badgeSvg = badgeLabel ? `
  <rect x="85" y="${badgeY}" width="196" height="40" rx="20" fill="#3ECFB2"/>
  <text x="${badgeCenterX}" y="${badgeTextY}"
    font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="18" fill="#FFFFFF" text-anchor="middle">${escXml(badgeLabel)}</text>
  <text x="293" y="${badgeTextY}"
    font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="14" fill="#3ECFB2" text-anchor="start">♥♥</text>` : '';

  const body = `
  ${coverImg
    ? `<image href="${coverImg}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="1080" height="1350" fill="#AEEADB"/>`}
  <rect width="1080" height="1350" fill="#F7F7F5" fill-opacity="0.75"/>
  ${bars()}
  <text x="80" y="96"
    font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="28" fill="#000000" text-anchor="start">김밈지</text>
  <rect x="80" y="110" width="66" height="3.5" fill="#3ECFB2"/>
  <text x="833" y="89"
    font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="18" fill="#FFFFFF" text-anchor="end">이번 주 마케터가 주목한 밈</text>
  <text x="870" y="109"
    font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="18" fill="#FFFFFF" text-anchor="end">${escXml(date || '')} · vol.${String(volNum || '').padStart(2, '0')}</text>
  ${heroSvg}
  ${badgeSvg}
  <rect x="80" y="${dividerY}" width="920" height="1" fill="#E8E8E8"/>
  ${subtitle ? `<text x="80" y="${subtitleY}"
    font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="22" fill="#1A1A1A">${escXml(subtitle)}</text>` : ''}
  ${footer()}`;

  return svgWrap(body);
}

// ── CARD 2 — 유래 ─────────────────────────────────────────────────────────────
// params: heroLines, summaryLines, mainImg  (leftBoxLines/rightBoxLines 무시)
function card2({ heroLines, summaryLines, mainImg }) {
  const parts = [mintBg(), bars()];

  const box = heroLeft(heroLines, 100);
  parts.push(box.svg);

  const photo = centeredPhoto(mainImg, box.endY + 44, 460);
  parts.push(photo.svg);

  const bodyY = photo.endY + 52;
  const lines = (summaryLines || []).slice(0, -1);
  const lastLine = summaryLines?.length ? summaryLines[summaryLines.length - 1] : null;

  const body = bodyBlock(lines, bodyY, { fontSize: 29, color: '#333333', lineH: 46 });
  parts.push(body.svg);

  if (lastLine) {
    const tealY = Math.max(body.endY + 36, bodyY + 36);
    parts.push(tealLine(lastLine, tealY));
  }

  parts.push(footer());
  return svgWrap(parts.join('\n'));
}

// ── CARD 3 — 확산 ─────────────────────────────────────────────────────────────
// params: heroLines, subtitleLines, mintBoxLines, spreadImg1, spreadImg2(무시), sourceText
function card3({ heroLines, subtitleLines, mintBoxLines, sourceText, spreadImg1 }) {
  const parts = [mintBg(), bars()];

  const box = heroLeft(heroLines, 100);
  parts.push(box.svg);

  const photo = centeredPhoto(spreadImg1, box.endY + 44, 450);
  parts.push(photo.svg);

  const bodyY = photo.endY + 52;
  const body = bodyBlock(subtitleLines, bodyY, { fontSize: 29, color: '#333333', lineH: 46 });
  parts.push(body.svg);

  const insightText = mintBoxLines?.[0] || null;
  if (insightText) {
    const tealY = Math.max(body.endY + 44, bodyY + 44);
    parts.push(tealLine(insightText, tealY));
  }

  if (sourceText) {
    parts.push(`<text x="540" y="1220" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
      font-size="16" fill="#AAAAAA" text-anchor="middle">${escXml(sourceText)}</text>`);
  }

  parts.push(footer());
  return svgWrap(parts.join('\n'));
}

// ── CARD 4 — 이럴 때 ──────────────────────────────────────────────────────────
// params: heroLines, bullets, calloutLines, sideImg, captionRight(무시)
function card4({ heroLines, bullets, calloutLines, sideImg }) {
  const parts = [mintBg(), bars()];

  const box = heroLeft(heroLines, 100);
  parts.push(box.svg);

  let contentY = box.endY + 44;

  if (sideImg) {
    const photo = centeredPhoto(sideImg, contentY, 300);
    parts.push(photo.svg);
    contentY = photo.endY + 48;
  }

  // 간결한 텍스트 리스트 (말풍선 제거)
  const bulletItems = (bullets || []).slice(0, 3);
  bulletItems.forEach((text, i) => {
    const y = contentY + i * 58;
    const fs = clampFontSize(text, 26, 900);
    parts.push(`<text x="60" y="${y + 36}"
      font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
      font-size="${fs}" fill="#3ECFB2">· </text>
    <text x="88" y="${y + 36}"
      font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
      font-size="${fs}" fill="#1A1A1A">${escXml(text)}</text>`);
  });

  const afterBullets = contentY + bulletItems.length * 58 + 36;

  const insightText = calloutLines?.[0] || null;
  if (insightText) {
    parts.push(tealLine(insightText, afterBullets));
  }

  parts.push(footer());
  return svgWrap(parts.join('\n'));
}

// ── CARD 5 — 브랜드 활용 ────────────────────────────────────────────────────────
// params: heroLines, summaryLines, centerImg  (leftCaption/rightCaption 무시)
function card5({ heroLines, summaryLines, centerImg }) {
  const parts = [mintBg(), bars()];

  const box = heroLeft(heroLines, 100);
  parts.push(box.svg);

  const photo = centeredPhoto(centerImg, box.endY + 44, 450);
  parts.push(photo.svg);

  const bodyY = photo.endY + 52;
  const lines = (summaryLines || []).slice(0, -1);
  const lastLine = summaryLines?.length ? summaryLines[summaryLines.length - 1] : null;

  const body = bodyBlock(lines, bodyY, { fontSize: 29, color: '#333333', lineH: 46 });
  parts.push(body.svg);

  if (lastLine) {
    const tealY = Math.max(body.endY + 40, bodyY + 40);
    parts.push(tealLine(lastLine, tealY));
  }

  parts.push(footer());
  return svgWrap(parts.join('\n'));
}

// ── CARD 6 — 마무리 ────────────────────────────────────────────────────────────
function card6({ memeName, heroText, subText, ctaLines }) {
  const displayName = heroText || memeName || '';

  const extra = `<radialGradient id="glow6" cx="50%" cy="40%" r="40%" gradientUnits="objectBoundingBox">
      <stop offset="0%"   stop-color="#3ECFB2" stop-opacity="0.22"/>
      <stop offset="100%" stop-color="#3ECFB2" stop-opacity="0"/>
    </radialGradient>`;

  const parts = [
    `<rect width="1080" height="1350" fill="#F4FBF8"/>`,
    `<ellipse cx="540" cy="500" rx="520" ry="320" fill="url(#glow6)"/>`,
    bars(),
  ];

  // 브랜딩 상단
  parts.push(`<text x="540" y="110" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="22" fill="#3ECFB2" text-anchor="middle" letter-spacing="1">김밈지</text>
  <rect x="440" y="118" width="200" height="2" fill="#3ECFB2" fill-opacity="0.4"/>`);

  // 밈 이름 (중앙 큰 텍스트)
  const fs = clampFontSize(displayName, 68, 920);
  parts.push(`<text x="540" y="430" font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
    font-weight="800" font-size="${fs}" letter-spacing="-2"
    fill="#1A1A1A" text-anchor="middle">${escXml(displayName)}</text>`);

  if (subText) {
    parts.push(`<text x="540" y="494" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
      font-size="22" fill="#888888" text-anchor="middle">${escXml(subText)}</text>`);
  }

  parts.push(divider(530));

  const ctaArr = ctaLines || ['재밌으셨다면, 저장 눌러주세요!', '↳↳ 팔로우하면 매주 찾아올게요'];
  ctaArr.slice(0, 2).forEach((t, i) => {
    const font = i === 0
      ? `font-family="'Pretendard ExtraBold','Pretendard',sans-serif" font-weight="800" font-size="30" fill="#1A1A1A"`
      : `font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif" font-size="24" fill="#666666"`;
    parts.push(`<text x="540" y="${592 + i * 48}" ${font} text-anchor="middle">${escXml(t)}</text>`);
  });

  // teal CTA 버튼
  parts.push(`<rect x="350" y="990" width="380" height="62" rx="31" fill="#3ECFB2"/>
  <text x="540" y="1028" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="22" fill="white" text-anchor="middle">팔로우하고 밈박사 되기 ✦</text>`);

  parts.push(footer());
  return svgWrap(parts.join('\n'), extra);
}

// ── CARD COLLECTION — 유행어 컬렉션 (Style A/B/C 순환) ────────────────────────
// 이 카드는 기존 디자인 유지 (유행어 컬렉션 전용)
function cardPhrase(num, { heroLines, summaryLines, bullets, badgeLabel }) {
  const phraseText = heroLines?.[0]?.text || '';
  const numStr = badgeLabel || String(num).padStart(2, '0');
  const fs = clampFontSize(phraseText, 96, 920);
  const heroCount = Math.min((heroLines || []).length || 1, 3);
  const heroBlockH = heroCount * Math.floor(fs * 1.3);
  const style = ['A', 'B', 'C'][(num - 1) % 3];

  const BG = `<rect width="1080" height="1350" fill="#F1FAF8"/>`;

  const phraseLeft = (yBase) =>
    (heroLines || [{ text: phraseText, color: '#1A1A1A' }]).slice(0, 3).map((line, i) => {
      const lfs = i === 0 ? fs : clampFontSize(line.text, Math.floor(fs * 0.88), 920);
      const lH = Math.floor(lfs * 1.3);
      return `<text x="60" y="${yBase + i * lH}"
        font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
        font-weight="800" font-size="${lfs}" letter-spacing="-2"
        fill="${line.color || '#1A1A1A'}">${escXml(line.text)}</text>`;
    }).join('\n');

  const phraseCenter = (yBase, baseFsOverride) => {
    const bfs = baseFsOverride || fs;
    return (heroLines || [{ text: phraseText, color: '#1A1A1A' }]).slice(0, 3).map((line, i) => {
      const lfs = i === 0 ? bfs : clampFontSize(line.text, Math.floor(bfs * 0.88), 960);
      const lH = Math.floor(lfs * 1.3);
      return `<text x="540" y="${yBase + i * lH}"
        font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
        font-weight="800" font-size="${lfs}" letter-spacing="-2"
        fill="${line.color || '#1A1A1A'}" text-anchor="middle">${escXml(line.text)}</text>`;
    }).join('\n');
  };

  const whiteBox = (x, y, w, lines) => {
    const h = Math.max(80, lines.length * 50 + 36);
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16"
      fill="white" stroke="#C8EDE3" stroke-width="1.5"/>
    ${lines.map((t, i) => `<text x="${x + 32}" y="${y + 52 + i * 50}"
      font-family="${i === 0
        ? "'Pretendard ExtraBold','Pretendard',sans-serif\" font-weight=\"800\" font-size=\"28\" fill=\"#1A1A1A\""
        : "'LeeSeoyun','Apple SD Gothic Neo',sans-serif\" font-size=\"24\" fill=\"#666666\""}">${escXml(t)}</text>`
    ).join('\n')}`;
  };

  if (style === 'A') {
    const PHRASE_Y = 230;
    const bbY = Math.max(570, PHRASE_Y + heroBlockH + 60);
    const bbLines = (summaryLines || []).slice(0, 2);
    return svgWrap(`
    ${BG}
    ${bars()}
    <text x="60" y="88" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
      font-size="19" fill="#3ECFB2" letter-spacing="1">컬렉션 ${numStr}</text>
    <rect x="60" y="98" width="64" height="2" fill="#3ECFB2" fill-opacity="0.5"/>
    ${phraseLeft(PHRASE_Y)}
    ${bbLines.length ? whiteBox(60, bbY, 960, bbLines) : ''}
    ${footer()}`);
  }

  if (style === 'B') {
    const cfs = clampFontSize(phraseText, 108, 960);
    const cHeroH = heroCount * Math.floor(cfs * 1.3);
    const PHRASE_Y = 260;
    const divY = Math.max(580, PHRASE_Y + cHeroH + 50);
    const bbY = divY + 40;
    const bbLines = (summaryLines || []).slice(0, 2);
    return svgWrap(`
    ${BG}
    ${bars()}
    <text x="540" y="90" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
      font-size="19" fill="#3ECFB2" text-anchor="middle" letter-spacing="2">컬렉션 ${numStr}</text>
    <rect x="400" y="100" width="280" height="2" fill="#3ECFB2" fill-opacity="0.4"/>
    ${phraseCenter(PHRASE_Y, cfs)}
    <rect x="60" y="${divY}" width="960" height="1.5" fill="#C8E8E2"/>
    ${bbLines.length ? whiteBox(60, bbY, 960, bbLines) : ''}
    ${footer()}`);
  }

  // Style C
  const PHRASE_Y = 210;
  const bbLines = (summaryLines || []).slice(0, 2);
  const bbY = Math.max(560, PHRASE_Y + heroBlockH + 60);
  return svgWrap(`
  ${BG}
  ${bars()}
  <text x="60" y="88" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="19" fill="#3ECFB2" letter-spacing="1">컬렉션 ${numStr}</text>
  <rect x="60" y="98" width="64" height="2" fill="#3ECFB2" fill-opacity="0.5"/>
  ${phraseLeft(PHRASE_Y)}
  ${bbLines.length ? whiteBox(60, bbY, 960, bbLines) : ''}
  ${footer()}`);
}

// ── 공개 API ───────────────────────────────────────────────────────────────────
export function generatePhraseCard(phraseNum, params) {
  return cardPhrase(phraseNum, params);
}

export function generateCard(cardNum, params) {
  switch (cardNum) {
    case 1: return card1(params);
    case 2: return card2(params);
    case 3: return card3(params);
    case 4: return card4(params);
    case 5: return card5(params);
    case 6: return card6(params);
    default: return '';
  }
}

export function makeDefaultParams(memeName = '', volNum = 1, date = '') {
  return {
    memeName,
    volNum,
    date,
    card1: {
      heroLines: [{ text: memeName, color: '#1A1A1A' }],
      badgeLabel: memeName,
      subtitle: '',
      coverImg: null,
    },
    card2: {
      heroLines: [
        { text: '이 밈의', color: '#1A1A1A' },
        { text: '정체는?', color: '#3ECFB2' },
      ],
      leftBoxLines: [],
      rightBoxLines: [],
      summaryLines: [],
      mainImg: null,
    },
    card3: {
      heroLines: [
        { text: '이 밈,', color: '#1A1A1A' },
        { text: '어디서 봤죠?', color: '#3ECFB2' },
      ],
      subtitleLines: [],
      captionRight: '',
      mintBoxLines: [],
      sourceText: '',
      spreadImg1: null,
      spreadImg2: null,
    },
    card4: {
      heroLines: [
        { text: '이럴 때', color: '#1A1A1A' },
        { text: '써보세요.', color: '#3ECFB2' },
      ],
      captionRight: '',
      bullets: [],
      calloutLines: [],
      sideImg: null,
    },
    card5: {
      heroLines: [
        { text: '브랜드에서', color: '#1A1A1A' },
        { text: '이렇게', color: '#1A1A1A' },
        { text: '써보세요.', color: '#3ECFB2' },
      ],
      centerImg: null,
      leftCaption: [],
      rightCaption: [],
      summaryLines: [],
    },
    card6: {
      heroText: memeName,
      subText: '조용히 💫',
      ctaLines: [
        '재밌으셨다면, 저장 눌러주세요!',
        '↳↳ 팔로우하면 매주 찾아올게요',
      ],
    },
  };
}
