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
  return `<rect width="1080" height="1350" fill="#EDF9F5"/>`;
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

function footerDark() {
  return `<text x="540" y="1272" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="22" fill="rgba(255,255,255,0.85)" text-anchor="middle">@minjaja.pdf</text>
  <text x="540" y="1300" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="16" fill="rgba(255,255,255,0.45)" text-anchor="middle">Content Marketer · Meme Curator</text>`;
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

// 중앙 정렬 사진 — 직사각형 (rx=0)
function centeredPhoto(src, photoY, photoH = 460) {
  if (!src) return { svg: '', endY: photoY };
  const W = 800;
  const X = (1080 - W) / 2;
  const clipId = `mainClip_${photoY}`;
  return {
    svg: `<image href="${src}" x="${X}" y="${photoY}" width="${W}" height="${photoH}"
         preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>
  <clipPath id="${clipId}">
    <rect x="${X}" y="${photoY}" width="${W}" height="${photoH}" rx="0"/>
  </clipPath>`,
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

// 흰색 원 배지 + 히어로 텍스트 (cards 2-5)
// Figma 스펙: Pretendard Bold 70, text box Y=160
// returns { svg, endY }
function heroWithBadge(cardNum, heroLines, startY = 50) {
  const badgeNum = cardNum - 1;
  const cx = 540, cy = startY + 50, r = 40;
  const badge = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="white"/>
<text x="${cx}" y="${cy + 16}" text-anchor="middle"
  font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
  font-weight="800" font-size="42" fill="#1A1A1A">${badgeNum}</text>`;

  const lines = (heroLines || []).slice(0, 3).filter(l => l?.text);
  if (!lines.length) return { svg: badge, endY: cy + r + 10 };

  const FS = 70;
  const LH = 84;
  // Figma text box top Y=160, first baseline = 160 + FS*0.82 ≈ 217
  let curY = 160 + Math.floor(FS * 0.82);

  const textSvg = lines.map((line) => {
    const baseline = curY;
    curY += LH;
    const fill = line.color === '#3ECFB2' ? '#3ECFB2' : 'white';
    return `<text x="540" y="${baseline}"
      font-family="'Pretendard','sans-serif"
      font-weight="700" font-size="${FS}" letter-spacing="-1"
      fill="${fill}" text-anchor="middle">${escXml(line.text)}</text>`;
  }).join('\n');

  return { svg: badge + '\n' + textSvg, endY: curY };
}

// 힌트 박스 — 직사각형, LeeSeoyun 23
// returns { svg, endY }
function hintPill(text, y) {
  if (!text) return { svg: '', endY: y };
  const w = Math.min(960, String(text).length * 18 + 80);
  const x = Math.floor((1080 - w) / 2);
  return {
    svg: `<rect x="${x}" y="${y}" width="${w}" height="56" rx="0"
      fill="white" fill-opacity="0.7" stroke="#DDDDDD" stroke-width="1"/>
<text x="540" y="${y + 36}" text-anchor="middle"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
  font-size="23" fill="#555555">${escXml(text)}</text>`,
    endY: y + 56,
  };
}

// 좌측 틸 인사이트 박스 — 직사각형, LeeSeoyun 23
// returns { svg, endY }
function tealInsightBox(text, y) {
  if (!text) return { svg: '', endY: y };
  const h = 68;
  return {
    svg: `<rect x="60" y="${y}" width="960" height="${h}" rx="0" fill="#3ECFB2" fill-opacity="0.25"/>
<rect x="60" y="${y}" width="6" height="${h}" rx="0" fill="#3ECFB2"/>
<text x="88" y="${y + 43}"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
  font-size="23" fill="#0F5C4E">${escXml(text)}</text>`,
    endY: y + h,
  };
}

// 흰색 설명 박스 — 직사각형, LeeSeoyun 23
// returns { svg, endY }
function whiteBlock(textLines, y, { fontSize = 23, lineH = 38 } = {}) {
  if (!textLines?.length) return { svg: '', endY: y };
  const allWrapped = textLines.flatMap(t => wrapText(String(t), 880, fontSize));
  const h = allWrapped.length * lineH + 52;
  const textSvg = allWrapped.map((t, i) =>
    `<text x="100" y="${y + 38 + i * lineH}"
      font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
      font-size="${fontSize}" fill="#333333">${escXml(t)}</text>`
  ).join('\n');
  return {
    svg: `<rect x="60" y="${y}" width="960" height="${h}" rx="0"
      fill="white" fill-opacity="0.85" stroke="#E0E0E0" stroke-width="1"/>
${textSvg}`,
    endY: y + h,
  };
}

// 큰 teal 마무리 텍스트 (카드 3·5용)
function tealBigText(text, y) {
  if (!text) return '';
  const fs = clampFontSize(text, 52, 900);
  return `<text x="540" y="${y}"
    font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
    font-weight="800" font-size="${fs}" letter-spacing="-1"
    fill="#3ECFB2" text-anchor="middle">${escXml(text)}</text>`;
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
// 레퍼런스: 풀블리드 사진 + 아래로 갈수록 어두워지는 그라디언트
// 히어로 텍스트 흰색 좌측정렬, 하단 영역, 민트 뱃지 텍스트 위
function card1({ volNum, date, subtitle, heroLines, badgeLabel, coverImg }) {
  const safeHero = (heroLines || []).slice(0, 3).filter(l => l?.text);

  // Figma 스펙: font-size=100, x=103, y=874 (first baseline)
  const C1_FS = 100;
  const C1_LH = 125;
  const heroSvg = safeHero.map((line, i) =>
    `<text x="103" y="${874 + i * C1_LH}"
      font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
      font-weight="800" font-size="${C1_FS}" letter-spacing="-2"
      fill="${line.color === '#3ECFB2' ? '#3ECFB2' : 'white'}">${escXml(line.text)}</text>`
  ).join('\n');

  // 뱃지 — ascender(82px) + gap(12px) + height(40px) 위
  const badgeY = 874 - Math.floor(C1_FS * 0.82) - 12 - 40;
  const badgeW = badgeLabel ? Math.min(280, String(badgeLabel).length * 19 + 56) : 0;
  const badgeSvg = badgeLabel ? `<rect x="103" y="${badgeY}" width="${badgeW}" height="40" rx="20" fill="#3ECFB2"/>
<text x="${103 + badgeW / 2}" y="${badgeY + 27}"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
  font-size="18" fill="white" text-anchor="middle">${escXml(badgeLabel)}</text>` : '';

  const gradId = 'c1g';
  const extraDefs = `<linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
    <stop offset="0%" stop-color="#000" stop-opacity="0.04"/>
    <stop offset="38%" stop-color="#000" stop-opacity="0.18"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.84"/>
  </linearGradient>`;

  const body = `
${coverImg
  ? `<image href="${coverImg}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>`
  : `<rect width="1080" height="1350" fill="#1A2820"/>`}
<rect width="1080" height="1350" fill="url(#${gradId})"/>
${bars()}
<text x="103" y="88"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
  font-size="26" fill="white">김밈지</text>
<text x="1020" y="74"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
  font-size="17" fill="rgba(255,255,255,0.65)" text-anchor="end">이번 주 마케터가 주목한 밈</text>
<text x="1020" y="94"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
  font-size="17" fill="rgba(255,255,255,0.65)" text-anchor="end">${escXml(date || '')} · vol.${String(volNum || '').padStart(2, '0')}</text>
${badgeSvg}
${heroSvg}
${footerDark()}`;

  return svgWrap(body, extraDefs);
}

// ── 밈카드 공통: 배경 + 오버레이 ─────────────────────────────────────────────
// bgImg 있으면 풀블리드 이미지 + 그라디언트 오버레이, 없으면 투명 (배경 없음)
function memeCardBg(bgImg) {
  if (!bgImg) return '';
  return `<image href="${bgImg}" x="0" y="0" width="1080" height="1350"
    preserveAspectRatio="xMidYMid slice"/>
<defs>
  <linearGradient id="memeOvG" x1="0" y1="0" x2="0" y2="1" gradientUnits="objectBoundingBox">
    <stop offset="0%"   stop-color="#000" stop-opacity="0.08"/>
    <stop offset="40%"  stop-color="#000" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="#000" stop-opacity="0.72"/>
  </linearGradient>
</defs>
<rect width="1080" height="1350" fill="url(#memeOvG)"/>`;
}

// 커뮤니티 포스트 스타일 오버레이 카드
// returns { svg, endY }
function postCard(lines, y, { source = '' } = {}) {
  if (!lines?.length) return { svg: '', endY: y };
  const allWrapped = lines.flatMap(t => wrapText(String(t), 840, 28));
  const h = allWrapped.length * 48 + (source ? 100 : 68);
  const headerH = 52;

  const textSvg = allWrapped.map((t, i) =>
    `<text x="100" y="${y + headerH + 12 + (i + 1) * 48}"
      font-family="'Pretendard','sans-serif" font-size="28" fill="#222222">${escXml(t)}</text>`
  ).join('\n');

  const sourceSvg = source
    ? `<text x="100" y="${y + h - 24}" font-family="'Pretendard','sans-serif"
        font-size="20" fill="#AAAAAA">${escXml(source)}</text>`
    : '';

  return {
    svg: `<rect x="60" y="${y}" width="960" height="${h}" rx="16" fill="white" filter="url(#shadow)"/>
<rect x="60" y="${y}" width="960" height="${headerH}" rx="0" fill="#F4F4F4"/>
<rect x="60" y="${y}" width="960" height="${headerH}" rx="16" fill="#F4F4F4"/>
<rect x="60" y="${y + headerH - 8}" width="960" height="8" fill="#F4F4F4"/>
<text x="100" y="${y + 34}" font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
  font-weight="800" font-size="20" fill="#888888">커뮤니티 반응</text>
<rect x="60" y="${y + headerH}" width="960" height="1" fill="#E8E8E8"/>
${textSvg}
${sourceSvg}`,
    endY: y + h,
  };
}

// ── CARD 2 — 유래 ─────────────────────────────────────────────────────────────
// 레이아웃: 투명 배경 / 배지+히어로 / 사진 영역 / 설명 박스 / 출처 / 하단 teal
function card2({ heroLines, memoLines, descLines, summaryLines, sourceText, mainImg }) {
  const parts = [bars()];

  const hero = heroWithBadge(2, heroLines, 50);
  parts.push(hero.svg);

  // 사진 영역 — 히어로 아래 전체 너비
  const PHOTO_X = 60, PHOTO_W = 960;
  const photoY = Math.max(hero.endY + 24, 300);
  const photoH = hero.endY > 420 ? 380 : 440;
  const clipId = 'c2Photo';

  if (mainImg) {
    parts.push(
      `<image href="${mainImg}" x="${PHOTO_X}" y="${photoY}" width="${PHOTO_W}" height="${photoH}"
        preserveAspectRatio="xMidYMid slice" clip-path="url(#${clipId})"/>`,
      `<clipPath id="${clipId}">
        <rect x="${PHOTO_X}" y="${photoY}" width="${PHOTO_W}" height="${photoH}" rx="0"/>
      </clipPath>`
    );
  } else {
    parts.push(
      `<rect x="${PHOTO_X}" y="${photoY}" width="${PHOTO_W}" height="${photoH}" rx="0"
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1.5" stroke-dasharray="8 5"/>`,
      `<text x="540" y="${photoY + Math.floor(photoH / 2) - 16}" text-anchor="middle"
        font-family="sans-serif" font-size="44" fill="rgba(255,255,255,0.18)">📷</text>`,
      `<text x="540" y="${photoY + Math.floor(photoH / 2) + 26}" text-anchor="middle"
        font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="22" fill="rgba(255,255,255,0.2)">밈 사진 추가</text>`
    );
  }

  let y = photoY + photoH + 28;

  // descLines — 흰색 반투명 설명 박스
  const dLines = descLines || [];
  if (dLines.length > 0) {
    const box = whiteBlock(dLines, y, { fontSize: 24, lineH: 40 });
    parts.push(box.svg);
    y = box.endY + 16;
  }

  // 출처 소자
  if (sourceText) {
    parts.push(
      `<text x="88" y="${y + 22}"
        font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="19" fill="rgba(255,255,255,0.35)">출처: ${escXml(sourceText)}</text>`
    );
    y += 38;
  }

  // 하단 teal 요약 — summaryLines[0] 우선, 없으면 memoLines[0]
  const tealText = summaryLines?.[0] || memoLines?.[0] || '';
  if (tealText) {
    parts.push(tealBigText(tealText, Math.max(y + 56, 1155)));
  }

  parts.push(footerDark());
  return svgWrap(parts.join('\n'));
}

// ── CARD 3 — 확산 ─────────────────────────────────────────────────────────────
// 레퍼런스: 사진 bg + 다크 오버레이 / 흰색 원 배지 "2" 중앙 상단
// / 흰색 히어로 텍스트 중앙 / 3개 스크린샷 오버랩 레이아웃
// mintBoxLines[0/1] → 캡션 라벨, mintBoxLines[2] → 하단 틸 텍스트
function card3({ heroLines, subtitleLines, mintBoxLines, spreadImg1 }) {
  const parts = [memeCardBg(spreadImg1), bars()];

  const hero = heroWithBadge(3, heroLines, 50);
  parts.push(hero.svg);

  // 3개 스크린샷 플레이스홀더 — 레퍼런스 좌표 비율 유지
  // left: x=100 y=572 w=357 h=462 / middle: x=404 y=508 w=301 h=322
  // right: x=666 y=683 w=375 h=318
  const screenshotY = Math.max(hero.endY + 28, 460);
  const yOff = screenshotY - 508;

  const screenshots = [
    { x: 100, y: 572 + yOff, w: 357, h: 430, fill: '#303030' },
    { x: 404, y: 508 + yOff, w: 301, h: 300, fill: '#3A3A3A' },
    { x: 666, y: 648 + yOff, w: 375, h: 298, fill: '#2A2A2A' },
  ];

  screenshots.forEach(({ x, y, w, h, fill }) => {
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="0" fill="${fill}"/>
<text x="${x + w / 2}" y="${y + h / 2 + 10}" text-anchor="middle"
  font-family="sans-serif" font-size="32" fill="#666">🖼</text>`);
  });

  // 우측 상단 캡션 라벨 (레퍼런스: translate(780.5, 572) w=214 h=43)
  const capText = mintBoxLines?.[0] || subtitleLines?.[0] || '';
  if (capText) {
    const capX = 780, capY = 508 + yOff;
    const capW = Math.min(290, String(capText).length * 15 + 48);
    parts.push(`<rect x="${capX}" y="${capY}" width="${capW}" height="40" rx="8" fill="rgba(255,255,255,0.9)"/>
<text x="${capX + 16}" y="${capY + 27}"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
  font-size="19" fill="#1A1A1A">${escXml(capText)}</text>`);
  }

  // subtitleLines[1/2] or mintBoxLines[1] → 하단 설명
  const descLines = (subtitleLines || []).slice(1);
  if (descLines.length > 0) {
    const descY = screenshots[0].y + screenshots[0].h + 36;
    descLines.slice(0, 2).forEach((t, i) => {
      parts.push(`<text x="540" y="${descY + i * 38}"
        font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="22" fill="rgba(255,255,255,0.7)" text-anchor="middle">${escXml(t)}</text>`);
    });
  }

  // 하단 큰 틸 텍스트
  const closingLine = mintBoxLines?.[2] || mintBoxLines?.[1] || null;
  if (closingLine) parts.push(tealBigText(closingLine, 1200));

  // 출처
  const srcLine = mintBoxLines?.[0] && subtitleLines?.length > 2 ? subtitleLines[subtitleLines.length - 1] : '';
  if (srcLine) {
    parts.push(`<text x="60" y="1240"
      font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
      font-size="18" fill="rgba(255,255,255,0.4)">출처: ${escXml(srcLine)}</text>`);
  }

  parts.push(footerDark());
  return svgWrap(parts.join('\n'));
}

// ── CARD 4 — 마케터 활용 팁 ──────────────────────────────────────────────────
// params: heroLines, descText, reasonLines (2-3개), insightText
function card4({ heroLines, descText, reasonLines, insightText, sideImg }) {
  const parts = [memeCardBg(sideImg), bars()];

  const hero = heroWithBadge(4, heroLines, 60);
  parts.push(hero.svg);

  let y = hero.endY + 32;

  // 설명 한 줄 (흰색, 작은)
  if (descText) {
    const wrapped = wrapText(String(descText), 900, 26);
    wrapped.forEach((t, i) => {
      parts.push(`<text x="540" y="${y + 28 + i * 40}"
        font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="26" fill="rgba(255,255,255,0.75)" text-anchor="middle">${escXml(t)}</text>`);
    });
    y += wrapped.length * 40 + 32;
  }

  // 이유/방법 rows — 번호(teal) + 텍스트(흰 배경 반투명)
  const reasons = (reasonLines || []).slice(0, 3);
  const BOX_W = 960, BOX_X = 60, NUM_W = 52, ROW_H = 76;
  reasons.forEach((text, i) => {
    const rowY = y + i * (ROW_H + 12);
    const fs = clampFontSize(String(text), 27, BOX_W - NUM_W - 64);
    parts.push(
      `<rect x="${BOX_X}" y="${rowY}" width="${BOX_W}" height="${ROW_H}" rx="0" fill="white" fill-opacity="0.12"/>` +
      `<rect x="${BOX_X}" y="${rowY}" width="${NUM_W}" height="${ROW_H}" rx="0" fill="#3ECFB2" fill-opacity="0.75"/>` +
      `<text x="${BOX_X + NUM_W / 2}" y="${rowY + 48}" text-anchor="middle"` +
      ` font-family="'Pretendard ExtraBold','Pretendard',sans-serif" font-weight="800" font-size="28" fill="white">${i + 1}</text>` +
      `<text x="${BOX_X + NUM_W + 22}" y="${rowY + 48}"` +
      ` font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif" font-size="${fs}" fill="white">${escXml(String(text))}</text>`
    );
  });

  const afterReasons = y + reasons.length * (ROW_H + 12);

  if (insightText) {
    parts.push(divider(Math.max(afterReasons + 28, 1060)));
    parts.push(tealBigText(insightText, Math.max(afterReasons + 120, 1170)));
  }

  parts.push(footerDark());
  return svgWrap(parts.join('\n'));
}

// ── CARD 5 — 브랜드 활용 ────────────────────────────────────────────────────────
// params: heroLines, summaryLines (마지막 항목=큰 teal 마무리)
function card5({ heroLines, summaryLines, leftCaption, rightCaption, centerImg }) {
  const parts = [memeCardBg(centerImg), bars()];

  const hero = heroWithBadge(5, heroLines, 60);
  parts.push(hero.svg);

  let y = hero.endY + 44;

  const allLines = summaryLines || [];
  const bodyLines = allLines.length > 1 ? allLines.slice(0, -1) : allLines;
  const closingLine = allLines.length > 1 ? allLines[allLines.length - 1] : null;

  // 힌트 필 (summaryLines[0]가 짧으면 pill로)
  if (bodyLines.length === 1 && bodyLines[0]?.length <= 30) {
    const pill = hintPill(bodyLines[0], y);
    parts.push(pill.svg);
    y = pill.endY + 32;
  } else if (bodyLines.length > 0) {
    // 설명 박스
    const box = whiteBlock(bodyLines, y, { fontSize: 28, lineH: 48 });
    parts.push(box.svg);
    y = box.endY + 44;
  }

  // leftCaption / rightCaption 있으면 2열 텍스트 박스
  const lcArr = leftCaption || [];
  const rcArr = rightCaption || [];
  if (lcArr.length || rcArr.length) {
    const rowH = Math.max(lcArr.length, rcArr.length) * 44 + 40;
    if (lcArr.length) {
      parts.push(`<rect x="60" y="${y}" width="460" height="${rowH}" rx="10" fill="white" fill-opacity="0.8"/>
${lcArr.map((t, i) => `<text x="84" y="${y + 36 + i * 44}"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif" font-size="24" fill="#333333">${escXml(t)}</text>`).join('\n')}`);
    }
    if (rcArr.length) {
      parts.push(`<rect x="560" y="${y}" width="460" height="${rowH}" rx="10" fill="white" fill-opacity="0.8"/>
${rcArr.map((t, i) => `<text x="584" y="${y + 36 + i * 44}"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif" font-size="24" fill="#333333">${escXml(t)}</text>`).join('\n')}`);
    }
    y = y + rowH + 44;
  }

  // 큰 teal 마무리 텍스트
  if (closingLine) {
    parts.push(tealBigText(closingLine, Math.max(y + 60, 1100)));
  }

  parts.push(footerDark());
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

// ── CARD COLLECTION — 유행어 컬렉션 ─────────────────────────────────────────
// bgImg 있으면 dark 배경 + 흰 텍스트, 없으면 라이트그레이 + 다크 텍스트
function cardPhrase(num, { heroLines, summaryLines, bullets, badgeLabel, bgImg }) {
  const hasBg = Boolean(bgImg);
  const tag = badgeLabel || '밈';
  const FS = 76;
  const titleColor = hasBg ? 'white' : '#1A1A1A';

  // ① 타이틀
  const lines = (heroLines || []).slice(0, 2).filter(l => l?.text);
  let tY = 160;
  const titleSvg = lines.map(line => {
    const baseline = tY + Math.floor(FS * 0.82);
    tY += Math.floor(FS * 1.3);
    return `<text x="60" y="${baseline}"
      font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
      font-weight="800" font-size="${FS}" letter-spacing="-1"
      fill="${line.color === '#3ECFB2' ? '#3ECFB2' : titleColor}">${escXml(line.text)}</text>`;
  }).join('\n');
  const titleEndY = tY;

  // ② 사진 그리드 플레이스홀더 (직사각형, rx=0)
  const PY = titleEndY + 36;
  const PH = 520;
  const CW = 462; const GAP = 24;
  const sh = Math.floor((PH - GAP) / 2);
  const phFill = hasBg ? 'rgba(255,255,255,0.10)' : '#D8D8D8';
  const phFill2 = hasBg ? 'rgba(255,255,255,0.07)' : '#CCCCCC';
  const phFill3 = hasBg ? 'rgba(255,255,255,0.10)' : '#D2D2D2';
  const photoSvg = `
<rect x="60" y="${PY}" width="${CW}" height="${sh}" rx="0" fill="${phFill}"/>
<rect x="60" y="${PY + sh + GAP}" width="${CW}" height="${sh}" rx="0" fill="${phFill2}"/>
<rect x="${60 + CW + GAP}" y="${PY}" width="${CW}" height="${PH}" rx="0" fill="${phFill3}"/>`;
  const afterPhoto = PY + PH;

  // ③ 키포인트 pill (검정 박스 + 흰 글씨)
  const pillText = bullets?.[0] || null;
  const PILL_Y = afterPhoto + 28;
  const pillSvg = pillText
    ? `<rect x="60" y="${PILL_Y}" width="960" height="64" rx="0" fill="#1A1A1A"/>
<text x="84" y="${PILL_Y + 42}"
  font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
  font-weight="800" font-size="30" fill="white">${escXml(String(pillText))}</text>`
    : '';
  const afterPill = PILL_Y + (pillText ? 88 : 0);

  // ④ 설명 박스
  const descLines = (summaryLines || []).slice(0, 3);
  const remainBullets = (bullets || []).slice(1, 3);
  const boxLineCount = descLines.length + remainBullets.length;
  const BOX_H = Math.max(120, boxLineCount * 50 + 52);
  const BOX_Y = afterPill + 8;
  let by = BOX_Y + 44;
  const descTextColor = hasBg ? 'rgba(255,255,255,0.9)' : '#333333';
  const bulletTextColor = hasBg ? 'white' : '#1A1A1A';
  const boxContent = [
    ...descLines.map(t =>
      `<text x="84" y="${(by += 50) - 50}"
        font-family="'Pretendard','sans-serif"
        font-size="27" fill="${descTextColor}">${escXml(String(t))}</text>`),
    ...remainBullets.map(t =>
      `<text x="72" y="${(by += 54) - 54 + 36}"
        font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
        font-weight="800" font-size="26" fill="#3ECFB2">✦</text>
<text x="108" y="${by - 54 + 36}"
  font-family="'Pretendard','sans-serif"
  font-size="26" fill="${bulletTextColor}">${escXml(String(t))}</text>`),
  ];
  const boxFill = hasBg ? 'rgba(255,255,255,0.12)' : 'none';
  const boxStroke = hasBg ? 'none' : '#BBBBBB';
  const boxSvg = `<rect x="60" y="${BOX_Y}" width="960" height="${BOX_H}" rx="0"
  fill="${boxFill}" stroke="${boxStroke}" stroke-width="1.5"/>
${boxContent.join('\n')}`;

  // ⑤ 뱃지 너비 자동 계산
  const badgeW = Math.min(Math.max(tag.length * 18 + 48, 100), 300);
  const bgLayer = hasBg ? memeCardBg(bgImg) : '';
  const footerColor = '#3ECFB2';
  const footerSubColor = hasBg ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';

  return svgWrap(`
${bgLayer}
<rect x="0" y="0" width="1080" height="6" fill="#3ECFB2"/>
<rect x="0" y="1344" width="1080" height="6" fill="#3ECFB2"/>
<rect x="60" y="56" width="${badgeW}" height="44" rx="8" fill="#3ECFB2"/>
<text x="${60 + badgeW / 2}" y="84" text-anchor="middle"
  font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
  font-weight="800" font-size="22" fill="white" letter-spacing="2">${escXml(tag)}</text>
${titleSvg}
${photoSvg}
${pillSvg}
${boxSvg}
<text x="540" y="1272"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
  font-size="26" fill="${footerColor}" text-anchor="middle">@minjaja.pdf</text>
<text x="540" y="1304"
  font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
  font-size="18" fill="${footerSubColor}" text-anchor="middle">Content Marketer · Meme Curator</text>
  `);
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
      memoLines: [],
      descLines: [],
      summaryLines: [],
      sourceText: '',
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
        { text: '마케터가 이 밈을', color: '#1A1A1A' },
        { text: '주목해야 할 이유', color: '#3ECFB2' },
      ],
      descText: '',
      reasonLines: [],
      insightText: '',
      sideImg: null,
    },
    card5: {
      heroLines: [
        { text: '마케터라면', color: '#1A1A1A' },
        { text: '이렇게 활용해요', color: '#3ECFB2' },
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
