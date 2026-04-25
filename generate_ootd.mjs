// 출근룩 추천 ① 유니클로 x Soft Round
// 풀블리드 사진 / 커버만 하단 그라디언트 / 핸들 중앙 상단 / #B6ECF1 포인트
import { readFileSync, writeFileSync, mkdirSync } from 'fs';

const FONT_DIR  = '/Users/mj/Documents/민지/Claude-MJ/PROJECTS/Card news/cardnews-app/public/fonts';
const PHOTO_DIR = '/Users/mj/Documents/민지/Claude-MJ/PROJECTS/Card news/OOTD/Raw photos (MJ)';
const OUT_DIR   = '/Users/mj/Documents/민지/Claude-MJ/PROJECTS/Card news/OOTD/출근룩_01_유니클로';

mkdirSync(OUT_DIR, { recursive: true });

function b64(path)        { return readFileSync(path).toString('base64'); }
function imgUrl(fn)       { return `data:image/jpeg;base64,${b64(`${PHOTO_DIR}/${fn}`)}`; }
function fontUrl(fn, fmt) { return `data:font/${fmt};base64,${b64(`${FONT_DIR}/${fn}`)}`; }
function esc(s)           { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

const ACCENT = '#B6ECF1';

// ── 폰트 embed ────────────────────────────────────────────────────────────────
const FONTS = `
  @font-face {
    font-family: 'Yang organization Gothic Bold';
    src: url('${fontUrl('yangfont02.ttf','truetype')}') format('truetype');
    font-weight: 700;
  }
  @font-face {
    font-family: 'Pretendard';
    src: url('${fontUrl('Pretendard-Regular.otf','opentype')}') format('opentype');
    font-weight: 400;
  }
  @font-face {
    font-family: 'Pretendard';
    src: url('${fontUrl('Pretendard-Bold.otf','opentype')}') format('opentype');
    font-weight: 700;
  }`;

// ── 공통 defs ─────────────────────────────────────────────────────────────────
const DEFS = `
  <style>${FONTS}</style>
  <filter id="ts" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="1" stdDeviation="6" flood-color="black" flood-opacity="0.55"/>
  </filter>
  <filter id="tsheavy" x="-20%" y="-20%" width="140%" height="140%">
    <feDropShadow dx="0" dy="0" stdDeviation="14" flood-color="black" flood-opacity="0.72"/>
  </filter>
  <linearGradient id="covgrad" x1="0" y1="0" x2="0" y2="1350" gradientUnits="userSpaceOnUse">
    <stop offset="50%" stop-color="black" stop-opacity="0"/>
    <stop offset="100%" stop-color="black" stop-opacity="0.75"/>
  </linearGradient>`;

function wrap(body) {
  return `<svg width="1080" height="1350" viewBox="0 0 1080 1350"
  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>${DEFS}</defs>
  ${body}
</svg>`;
}

// [단어] 마크업을 tspan으로 파싱
function parseAccentLine(text) {
  return String(text || '').split(/(\[[^\]]*\])/).map(part => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return `<tspan fill="${ACCENT}">${esc(part.slice(1, -1))}</tspan>`;
    }
    return part ? `<tspan fill="white">${esc(part)}</tspan>` : '';
  }).join('');
}

// ── 커버 카드 ─────────────────────────────────────────────────────────────────
// line1, line2: Yang organization Gothic Bold 84px / 행간 120
// [단어]로 강조색 지정 — 위치 무관
function cover(imgDataUrl, { line1, line2 }) {
  const Y1 = 1060;
  const Y2 = Y1 + 120;

  const textLine = (text, y) => !text ? '' : `<text x="540" y="${y}"
    font-family="'Yang organization Gothic Bold', sans-serif"
    font-weight="700" font-size="84" text-anchor="middle"
    filter="url(#tsheavy)">${parseAccentLine(text)}</text>`;

  return wrap(`
  <image href="${imgDataUrl}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>
  <rect width="1080" height="1350" fill="url(#covgrad)"/>
  <!-- 핸들 -->
  <text x="540" y="72"
    font-family="'Pretendard', sans-serif"
    font-weight="400" font-size="22"
    fill="white" fill-opacity="0.52" text-anchor="middle"
    filter="url(#ts)">@minjaja.pdf</text>
  ${textLine(line1, Y1)}
  ${textLine(line2, Y2)}
  `);
}

// ── 아이템 슬라이드 (사진 1장) ────────────────────────────────────────────────
function itemSlide(imgDataUrl, { brandName, productName, textX = 60, textY = 650, anchor = 'start' }) {
  return wrap(`
  <image href="${imgDataUrl}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>
  <!-- 핸들 -->
  <text x="540" y="72"
    font-family="'Pretendard', sans-serif"
    font-weight="400" font-size="22"
    fill="white" fill-opacity="0.52" text-anchor="middle"
    filter="url(#ts)">@minjaja.pdf</text>
  <!-- 브랜드명 -->
  <text x="${textX}" y="${textY}"
    font-family="'Pretendard', sans-serif"
    font-weight="700" font-size="40"
    fill="white" text-anchor="${anchor}"
    filter="url(#ts)">${esc(brandName)}</text>
  <!-- 제품명 + 가격 -->
  <text x="${textX}" y="${textY + 54}"
    font-family="'Pretendard', sans-serif"
    font-weight="400" font-size="30"
    fill="white" fill-opacity="0.88" text-anchor="${anchor}"
    filter="url(#ts)">${esc(productName)}</text>
  `);
}

// ── 아이템 슬라이드 (사진 2장) ────────────────────────────────────────────────
// subImage: 우측 하단 오버레이 (x=652, y=850, w=366, h=449)
function itemSlide2Photo(bgDataUrl, subDataUrl, { brandName, productName, textX = 60, textY = 650, anchor = 'start' }) {
  return wrap(`
  <image href="${bgDataUrl}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>
  <!-- 서브 사진: 우측 하단 오버레이 -->
  <image href="${subDataUrl}" x="652" y="850" width="366" height="449" preserveAspectRatio="xMidYMid slice"/>
  <rect x="652" y="850" width="366" height="449" fill="none" stroke="white" stroke-opacity="0.15" stroke-width="1"/>
  <!-- 핸들 -->
  <text x="540" y="72"
    font-family="'Pretendard', sans-serif"
    font-weight="400" font-size="22"
    fill="white" fill-opacity="0.52" text-anchor="middle"
    filter="url(#ts)">@minjaja.pdf</text>
  <!-- 브랜드명 -->
  <text x="${textX}" y="${textY}"
    font-family="'Pretendard', sans-serif"
    font-weight="700" font-size="40"
    fill="white" text-anchor="${anchor}"
    filter="url(#ts)">${esc(brandName)}</text>
  <!-- 제품명 + 가격 -->
  <text x="${textX}" y="${textY + 54}"
    font-family="'Pretendard', sans-serif"
    font-weight="400" font-size="30"
    fill="white" fill-opacity="0.88" text-anchor="${anchor}"
    filter="url(#ts)">${esc(productName)}</text>
  `);
}

// ── 생성 ─────────────────────────────────────────────────────────────────────
const img9526 = imgUrl('IMG_9526.JPG'); // 커버 — 그레이 맨투맨 + 캡
const img8735 = imgUrl('IMG_8735.JPG'); // 배기커브진 전신
const img8736 = imgUrl('IMG_8736.JPG'); // 소프트립T 서브샷 (오버레이)
const img0417 = imgUrl('0417.JPG');     // V-neck MTM

const cards = [
  {
    file: '1_커버.svg',
    svg: cover(img9526, {
      line1: '매일 들려입기 좋은',
      line2: '[출근룩] 추천템',
    }),
  },
  {
    file: '2_배기커브진.svg',
    svg: itemSlide(img8735, {
      brandName:   '유니클로',
      productName: '배기커브진 BLUE / 49,900원',
      textX: 60,
      textY: 950,
      anchor: 'start',
    }),
  },
  {
    file: '3_소프트립T.svg',
    svg: itemSlide2Photo(img8735, img8736, {
      brandName:   '유니클로',
      productName: '소프트립T 긴팔 NAVY / 19,900원',
      textX: 60,
      textY: 720,
      anchor: 'start',
    }),
  },
  {
    file: '4_VneckMTM.svg',
    svg: itemSlide(img0417, {
      brandName:   'Soft Round (은젤님 공구)',
      productName: 'V-neck MTM Gray / 31,000원',
      textX: 60,
      textY: 1060,
      anchor: 'start',
    }),
  },
  {
    file: '5_합계.svg',
    svg: itemSlide(img9526, {
      brandName:   '세 개 합계 100,800원',
      productName: '49,900 + 19,900 + 31,000 (배송비 별도)',
      textX: 540,
      textY: 1080,
      anchor: 'middle',
    }),
  },
];

for (const { file, svg } of cards) {
  writeFileSync(`${OUT_DIR}/${file}`, svg);
  console.log(`✓ ${file}`);
}
console.log(`\n완료 → ${OUT_DIR}`);
