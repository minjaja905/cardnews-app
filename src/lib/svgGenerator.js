// SVG 생성 엔진 — Python generate_svgs.py → JS 포팅
// 1080 × 1350 px (인스타 4:5)

// ── 공통 컴포넌트 ─────────────────────────────────────────────────────────────

function bars() {
  return `<rect x="0" y="0" width="1080" height="5" fill="#3ECFB2"/>
  <rect x="0" y="1340" width="1080" height="10" fill="#3ECFB2"/>`;
}

function footer() {
  return `<text x="540" y="1284" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="26" fill="#3ECFB2" text-anchor="middle">@minjaja.pdf</text>
  <text x="540" y="1316" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="18" fill="#999999" text-anchor="middle">Content Marketer · Meme Curator</text>`;
}

function gradBg(gid = 'bg') {
  return `<defs>
    <linearGradient id="${gid}" x1="0" y1="0" x2="0" y2="1350" gradientUnits="userSpaceOnUse">
      <stop offset="0%"   stop-color="#AEEADB"/>
      <stop offset="55%"  stop-color="#DDF5EF"/>
      <stop offset="100%" stop-color="#F7F7F5"/>
    </linearGradient>
  </defs>
  <rect width="1080" height="1350" fill="url(#${gid})"/>`;
}

function sparkle(cx, cy, r = 18, color = '#3ECFB2') {
  const ri = r * 0.22;
  const d = `M${cx} ${cy - r}L${(cx + ri).toFixed(1)} ${(cy - ri).toFixed(1)}L${cx + r} ${cy}` +
    `L${(cx + ri).toFixed(1)} ${(cy + ri).toFixed(1)}L${cx} ${cy + r}` +
    `L${(cx - ri).toFixed(1)} ${(cy + ri).toFixed(1)}L${cx - r} ${cy}` +
    `L${(cx - ri).toFixed(1)} ${(cy - ri).toFixed(1)}Z`;
  return `<path d="${d}" fill="${color}"/>`;
}

function badge(num) {
  return `<circle cx="80" cy="108" r="40" fill="#1A1A1A"/>
  <text x="80" y="119" font-family="'Pretendard ExtraBold'"
        font-weight="800" font-size="34" fill="white" text-anchor="middle">${num}</text>`;
}

function pillDark(x, y, w, h, text, fontSize = 19) {
  const rx = h / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#1A1A1A"/>
  <text x="${x + Math.floor(w / 2)}" y="${y + Math.floor(h / 2) + Math.floor(fontSize / 3)}"
        font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="${fontSize}" fill="white" text-anchor="middle">${text}</text>`;
}

function pillMint(x, y, w, h, text, fontSize = 20) {
  const rx = h / 2;
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#3ECFB2"/>
  <text x="${x + Math.floor(w / 2)}" y="${y + Math.floor(h / 2) + Math.floor(fontSize / 3)}"
        font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="${fontSize}" fill="white" text-anchor="middle">${text}</text>`;
}

// hero: lines = [{text, color}]
function hero(lines, x = 60, yStart = 220, size = 78, lineH = 90) {
  return lines.map((line, i) => {
    const yi = yStart + i * lineH;
    // line.mint: 해당 줄에서 민트 처리할 단어 or 구간
    if (line.mintWord) {
      const parts = line.text.split(line.mintWord);
      const before = parts[0];
      const after = parts.slice(1).join(line.mintWord);
      return `<text x="${x}" y="${yi}" font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
        font-weight="800" font-size="${size}" letter-spacing="-2" fill="${line.color || '#1A1A1A'}">
        ${before ? `<tspan fill="#1A1A1A">${escXml(before)}</tspan>` : ''}
        <tspan fill="#3ECFB2">${escXml(line.mintWord)}</tspan>
        ${after ? `<tspan fill="#1A1A1A">${escXml(after)}</tspan>` : ''}
      </text>`;
    }
    return `<text x="${x}" y="${yi}" font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
      font-weight="800" font-size="${size}" letter-spacing="-2"
      fill="${line.color || '#1A1A1A'}">${escXml(line.text)}</text>`;
  }).join('\n');
}

function escXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const SHADOW_DEF = `<filter id="shadow" x="-5%" y="-5%" width="110%" height="110%">
    <feDropShadow dx="0" dy="2" stdDeviation="6" flood-opacity="0.10"/>
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

function imgTag(src, x, y, w, h, clipId, rx = 14) {
  if (!src) return '';
  return `<image href="${src}" x="${x}" y="${y}" width="${w}" height="${h}"
         preserveAspectRatio="xMidYMid slice"
         clip-path="url(#${clipId})"/>
  <clipPath id="${clipId}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"/>
  </clipPath>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}"
        fill="none" stroke="#E0E0E0" stroke-width="1.5"/>`;
}

// ── CARD 1 — 커버 ──────────────────────────────────────────────────────────────
function card1({ volNum, date, subtitle, heroLines, badgeLabel, coverImg }) {
  const safeHero = (heroLines || []).slice(0, 3);
  const lineCount = safeHero.length;

  // 히어로 텍스트 (120px, y=268 시작 — Figma y=178 → SVG baseline +90)
  const heroSvg = safeHero.map((line, i) =>
    `<text x="60" y="${268 + i * 140}"
      font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
      font-weight="800" font-size="120" letter-spacing="-2"
      fill="${line.color || '#1A1A1A'}">${escXml(line.text)}</text>`
  ).join('\n');

  // 배지 y: 2줄=540, 3줄=680 (히어로 겹침 방지)
  const badgeY = lineCount >= 3 ? 680 : 540;
  const badgeCenterX = 85 + 196 / 2; // 183
  const badgeTextY = badgeY + 26; // 세로 중앙 베이스라인
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

// ── CARD 2 — 이 밈이 무엇인지 ────────────────────────────────────────────────────
function card2({ heroLines, leftBoxLines, rightBoxLines, mainImg, summaryLines }) {
  // 넘버링 뱃지: 원형 cx=80 cy=106 (Figma x=48 y=74 w=h=64)
  const badgeSvg = `<circle cx="80" cy="106" r="32" fill="#1A1A1A"/>
  <text x="80" y="119"
    font-family="'Pretendard ExtraBold','Pretendard',sans-serif"
    font-weight="800" font-size="36" fill="white" text-anchor="middle">2</text>`;

  // 히어로 텍스트: Figma x=150 y=100 → SVG y=160, Pretendard Bold 80px, 줄간격 96
  const heroSvg = (heroLines || []).slice(0, 3).map((line, i) =>
    `<text x="150" y="${160 + i * 96}"
      font-family="'Pretendard','Apple SD Gothic Neo',sans-serif"
      font-weight="700" font-size="80" letter-spacing="-2"
      fill="${line.color || '#1A1A1A'}">${escXml(line.text)}</text>`
  ).join('\n');

  // 주요 사진: 중앙 w=640, clipPath 적용
  const photoX = 220;
  const photoY = 430;
  const photoW = 640;
  const photoH = 560;
  const photoSvg = mainImg ? imgTag(mainImg, photoX, photoY, photoW, photoH, 'card2MainImg', 16) : '';

  // 좌측 텍스트 박스: x=16, 흰 박스 + 검은 텍스트 LeeSeoyun 18px 가운데 정렬
  const leftLines = leftBoxLines || [];
  const boxLineH = 26;
  const leftBoxH = leftLines.length * boxLineH + 28;
  const leftBoxX = 16;
  const leftBoxY = 470;
  const leftBoxW = 188;
  const leftBoxSvg = leftLines.length ? `
  <rect x="${leftBoxX}" y="${leftBoxY}" width="${leftBoxW}" height="${leftBoxH}"
    rx="12" fill="white" fill-opacity="0.95" filter="url(#shadow)"/>
  ${leftLines.map((t, i) => `<text x="${leftBoxX + leftBoxW / 2}" y="${leftBoxY + 20 + i * boxLineH}"
    font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="18" fill="#1A1A1A" text-anchor="middle">${escXml(t)}</text>`).join('\n')}` : '';

  // 우측 텍스트 박스: x=876 (220+640+16)
  const rightLines = rightBoxLines || [];
  const rightBoxH = rightLines.length * boxLineH + 28;
  const rightBoxX = 876;
  const rightBoxY = 470;
  const rightBoxW = 188;
  const rightBoxSvg = rightLines.length ? `
  <rect x="${rightBoxX}" y="${rightBoxY}" width="${rightBoxW}" height="${rightBoxH}"
    rx="12" fill="white" fill-opacity="0.95" filter="url(#shadow)"/>
  ${rightLines.map((t, i) => `<text x="${rightBoxX + rightBoxW / 2}" y="${rightBoxY + 20 + i * boxLineH}"
    font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="18" fill="#1A1A1A" text-anchor="middle">${escXml(t)}</text>`).join('\n')}` : '';

  // 하단 요약 박스 (고정 y=1040)
  const sumLines = summaryLines || [];
  const summaryBoxH = Math.max(72, sumLines.length * 30 + 32);
  const summarySvg = `
  <rect x="40" y="1040" width="1000" height="${summaryBoxH}" rx="16"
    fill="white" fill-opacity="0.88" filter="url(#shadow)"/>
  <rect x="40" y="1040" width="5" height="${summaryBoxH}" rx="3" fill="#3ECFB2"/>
  ${sumLines.map((t, i) => `<text x="60" y="${1040 + 26 + i * 30}"
    font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
    font-size="20" fill="#1A1A1A">${escXml(t)}</text>`).join('\n')}`;

  const body = `
  ${gradBg()}
  ${bars()}
  ${badgeSvg}
  ${heroSvg}
  ${photoSvg}
  ${leftBoxSvg}
  ${rightBoxSvg}
  ${summarySvg}
  ${footer()}`;

  return svgWrap(body);
}

// ── CARD 3 — 확산 ──────────────────────────────────────────────────────────────
function card3({ heroLines, subtitleLines, spreadImg1, spreadImg2, captionRight, mintBoxLines, sourceText }) {
  const safeHero3 = (heroLines || []).slice(0, 3);
  const heroSvg = safeHero3.map((line, i) => {
    const y = 228 + i * 90;
    return `<text x="58" y="${y}" font-family="'Pretendard ExtraBold'"
        font-weight="800" font-size="82" letter-spacing="-2" fill="${line.color || '#1A1A1A'}">${escXml(line.text)}</text>`;
  }).join('\n');

  // 소제목·이미지 y를 히어로 줄 수에 따라 동적 계산
  const h3Count = safeHero3.length || 2;
  const h3LastBaseline = 228 + (h3Count - 1) * 90;
  const subtitleBaseY = Math.max(360, h3LastBaseline + 42);
  const subCount3 = (subtitleLines || []).length;
  const imgBaseY = Math.max(412, subtitleBaseY + subCount3 * 24 + 28);

  const subtitleSvg = (subtitleLines || []).map((t, i) =>
    `<text x="58" y="${subtitleBaseY + i * 24}" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="20" fill="#555555">${escXml(t)}</text>`
  ).join('\n');

  const img1Svg = spreadImg1 ? imgTag(spreadImg1, 52, imgBaseY, 400, 520, 'blogClip') : '';
  const img2TopSvg = spreadImg2 ? imgTag(spreadImg2, 476, imgBaseY, 550, 260, 'ipodTop') : '';
  const img2BotSvg = spreadImg2 ? imgTag(spreadImg2, 476, imgBaseY + 270, 550, 248, 'ipodBot') : '';

  const mintBox = mintBoxLines?.length ? `
  <rect x="52" y="960" width="976" height="${mintBoxLines.length * 28 + 32}" rx="16" fill="#3ECFB2" opacity="0.15"/>
  <rect x="52" y="960" width="976" height="${mintBoxLines.length * 28 + 32}" rx="16"
        fill="none" stroke="#3ECFB2" stroke-width="1.5"/>
  ${mintBoxLines.map((t, i) => {
    const font = i === 0 ? `font-family="'Pretendard ExtraBold'" font-weight="800" font-size="21" fill="#1A1A1A"` :
      `font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif" font-size="19" fill="#444444"`;
    return `<text x="72" y="${994 + i * 28}" ${font}>${escXml(t)}</text>`;
  }).join('\n')}` : '';

  const body = `
  ${gradBg()}
  ${bars()}
  ${badge(3)}
  ${heroSvg}
  ${subtitleSvg}
  ${img1Svg}
  ${img2TopSvg}
  ${img2BotSvg}
  ${captionRight ? `<text x="1002" y="448" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="17" fill="#666666" text-anchor="end">${escXml(captionRight)}</text>` : ''}
  ${mintBox}
  ${sourceText ? `<text x="540" y="1074" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="15" fill="#AAAAAA" text-anchor="middle">${escXml(sourceText)}</text>` : ''}
  ${sparkle(980, 188, 10)}
  ${sparkle(44, 310, 7, '#1A1A1A')}
  ${footer()}`;

  return svgWrap(body);
}

// ── CARD 4 — 이럴 때 ──────────────────────────────────────────────────────────
function card4({ heroLines, captionRight, bullets, sideImg, calloutLines }) {
  const heroSvg = (heroLines || []).map((line, i) => {
    const y = 228 + i * 90;
    return `<text x="58" y="${y}" font-family="'Pretendard ExtraBold'"
        font-weight="800" font-size="82" letter-spacing="-2" fill="${line.color || '#1A1A1A'}">${escXml(line.text)}</text>`;
  }).join('\n');

  const bulletSvg = (bullets || []).slice(0, 4).map((text, i) => {
    const y = 490 + i * 66;
    return `<rect x="56" y="${y - 36}" width="470" height="52" rx="26" fill="#1A1A1A"/>
  <text x="80" y="${y}" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="21" fill="white">${escXml(text)}</text>`;
  }).join('\n');

  const sideImgSvg = sideImg ? `<image href="${sideImg}" x="556" y="320" width="490" height="460"
         preserveAspectRatio="xMidYMid meet"/>` : '';

  const calloutY = 772;
  const calloutSvg = calloutLines?.length ? `
  <rect x="56" y="${calloutY}" width="968" height="${calloutLines.length * 28 + 44}" rx="16"
        fill="white" fill-opacity="0.75" filter="url(#shadow)"/>
  ${calloutLines.map((t, i) => {
    const font = i === 0
      ? `font-family="'Pretendard ExtraBold'" font-weight="800" font-size="22" fill="#1A1A1A"`
      : `font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif" font-size="19" fill="#555555"`;
    return `<text x="80" y="${calloutY + 36 + i * 28}" ${font}>${escXml(t)}</text>`;
  }).join('\n')}` : '';

  const body = `
  ${gradBg()}
  ${bars()}
  ${badge(4)}
  ${heroSvg}
  ${captionRight ? `<text x="1020" y="228" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="18" fill="#666666" text-anchor="end">${escXml(captionRight)}</text>` : ''}
  ${sideImgSvg}
  ${bulletSvg}
  <rect x="56" y="756" width="968" height="1" fill="#D0D0D0"/>
  ${calloutSvg}
  ${sparkle(985, 185, 11)}
  ${sparkle(44, 370, 7, '#1A1A1A')}
  ${footer()}`;

  return svgWrap(body);
}

// ── CARD 5 — 브랜드 활용 ────────────────────────────────────────────────────────
function card5({ heroLines, centerImg, leftCaption, rightCaption, summaryLines }) {
  const heroSvg = (heroLines || []).map((line, i) => {
    const sizes = [76, 76, 68];
    const size = sizes[i] || 68;
    const y = 218 + i * 84;
    return `<text x="58" y="${y}" font-family="'Pretendard ExtraBold'"
        font-weight="800" font-size="${size}" letter-spacing="-2" fill="${line.color || '#1A1A1A'}">${escXml(line.text)}</text>`;
  }).join('\n');

  const imgSvg = centerImg ? `<image href="${centerImg}" x="200" y="414" width="680" height="480"
         preserveAspectRatio="xMidYMid meet"
         clip-path="url(#scottClip)"/>
  <clipPath id="scottClip">
    <rect x="200" y="414" width="680" height="480" rx="16"/>
  </clipPath>
  <rect x="200" y="414" width="680" height="480" rx="16"
        fill="none" stroke="#E0E0E0" stroke-width="1.5"/>` : '';

  const leftCaptionSvg = leftCaption?.length ? `
  <rect x="200" y="640" width="310" height="44" rx="8"
        fill="white" fill-opacity="0.90" filter="url(#shadow)"/>
  <text x="216" y="668" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="18" fill="#1A1A1A">${escXml(leftCaption[0] || '')}</text>
  ${leftCaption[1] ? `<rect x="200" y="692" width="310" height="38" rx="8" fill="#1A1A1A" fill-opacity="0.88"/>
  <text x="216" y="716" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="17" fill="white">${escXml(leftCaption[1])}</text>` : ''}` : '';

  const rightCaptionSvg = rightCaption?.length ? `
  <rect x="530" y="420" width="328" height="52" rx="8"
        fill="white" fill-opacity="0.90" filter="url(#shadow)"/>
  <text x="546" y="442" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="17" fill="#444444">${escXml(rightCaption[0] || '')}</text>
  ${rightCaption[1] ? `<text x="546" y="462" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="17" fill="#3ECFB2">${escXml(rightCaption[1])}</text>` : ''}` : '';

  const summarySvg = summaryLines?.length ? `
  <rect x="56" y="920" width="40" height="3" fill="#3ECFB2"/>
  <text x="108" y="924" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="16" fill="#888888">▶ 내용 핵심 요약</text>
  ${summaryLines.map((t, i) => {
    const font = i < 2
      ? `font-family="'Pretendard ExtraBold'" font-weight="800" font-size="24" fill="#1A1A1A"`
      : `font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif" font-size="20" fill="#666666"`;
    return `<text x="56" y="${958 + i * 28}" ${font}>${escXml(t)}</text>`;
  }).join('\n')}` : '';

  const body = `
  ${gradBg()}
  ${bars()}
  ${badge(5)}
  ${heroSvg}
  ${imgSvg}
  ${leftCaptionSvg}
  ${rightCaptionSvg}
  ${summarySvg}
  ${sparkle(985, 185, 10)}
  ${sparkle(42, 340, 7, '#1A1A1A')}
  ${footer()}`;

  return svgWrap(body);
}

// ── CARD 6 — 마무리 ────────────────────────────────────────────────────────────
function card6({ memeName, volNum, date, heroText, subText, ctaLines }) {
  const extra = `<radialGradient id="glow" cx="50%" cy="38%" r="38%" gradientUnits="objectBoundingBox">
      <stop offset="0%"   stop-color="#3ECFB2" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="#3ECFB2" stop-opacity="0"/>
    </radialGradient>`;

  const body = `
  <rect width="1080" height="1350" fill="#F7F7F5"/>
  <ellipse cx="540" cy="480" rx="500" ry="300" fill="url(#glow)"/>
  ${bars()}
  <text x="60" y="64" font-family="'Pretendard ExtraBold'"
        font-weight="800" font-size="22" fill="#1A1A1A">김밈지</text>
  <text x="1020" y="54" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="13" fill="#999999" text-anchor="end">${escXml(memeName || '')}</text>
  <text x="1020" y="70" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="13" fill="#999999" text-anchor="end">${escXml(date || '')} · vol.${String(volNum || '').padStart(2,'0')}</text>
  <rect x="60" y="82" width="960" height="1.5" fill="#E8E8E8"/>
  <text x="540" y="400" font-family="'Pretendard ExtraBold'"
        font-weight="800" font-size="62" letter-spacing="-2" fill="#1A1A1A"
        text-anchor="middle">${escXml(heroText || memeName || '')}</text>
  ${subText ? `<text x="540" y="460" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="20" fill="#888888" text-anchor="middle">${escXml(subText)}</text>` : ''}
  <rect x="340" y="490" width="400" height="1" fill="#E0E0E0"/>
  ${(ctaLines || ['재밌으셨다면, 저장 눌러주세요!', '↳↳ 팔로우하면 매주 찾아올게요']).map((t, i) => {
    const font = i === 0
      ? `font-family="'Pretendard ExtraBold'" font-weight="800" font-size="28" fill="#1A1A1A"`
      : `font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif" font-size="22" fill="#555555"`;
    return `<text x="540" y="${554 + i * 44}" ${font} text-anchor="middle">${escXml(t)}</text>`;
  }).join('\n')}
  <rect x="370" y="958" width="340" height="54" rx="27" fill="#3ECFB2"/>
  <text x="540" y="990" font-family="'LeeSeoyun','Apple SD Gothic Neo',sans-serif"
        font-size="21" fill="white" text-anchor="middle">팔로우하고 밈박사 되기 ✦</text>
  ${sparkle(86, 200, 18)}
  ${sparkle(119, 153, 10)}
  ${sparkle(157, 176, 6, '#1A1A1A')}
  ${sparkle(772, 244, 12)}
  ${sparkle(807, 175, 6)}
  ${sparkle(1025, 211, 8, '#1A1A1A')}
  ${sparkle(83, 333, 5, '#1A1A1A')}
  ${sparkle(64, 376, 14)}
  ${sparkle(1020, 420, 22)}
  ${sparkle(971, 359, 10, '#1A1A1A')}
  ${footer()}`;

  return svgWrap(body, extra);
}

// ── 공개 API ───────────────────────────────────────────────────────────────────
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
    // Card 1
    card1: {
      heroLines: [{ text: memeName, color: '#1A1A1A' }],
      badgeLabel: memeName,
      subtitle: '',
      coverImg: null,
    },
    // Card 2
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
    // Card 3
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
    // Card 4
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
    // Card 5
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
    // Card 6
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
