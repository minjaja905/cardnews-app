// OOTD 카드뉴스 SVG 생성기
// 스타일: 풀블리드 사진 / 커버만 하단 그라디언트 / 핸들 중앙 상단 / #B6ECF1 포인트

function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const ACCENT = '#B6ECF1';

const DEFS = `
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

// [단어] 마크업을 tspan으로 파싱 — [text]는 ACCENT, 나머지는 흰색
function parseAccentLine(text) {
  return String(text || '').split(/(\[[^\]]*\])/).map(part => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return `<tspan fill="${ACCENT}">${esc(part.slice(1, -1))}</tspan>`;
    }
    return part ? `<tspan fill="white">${esc(part)}</tspan>` : '';
  }).join('');
}

// ── 커버 카드 ─────────────────────────────────────────────────────────────────
// line1, line2: 모두 Yang organization Gothic Bold 84px
// 강조할 단어는 [대괄호]로 감싸기 — 위치 무관 ([출근룩] 추천템 / 출근룩 [추천템] 모두 가능)
// 행간 120px (피그마 기준)
export function generateOOTDCover({ bgImage, line1, line2 }) {
  const bg = bgImage
    ? `<image href="${bgImage}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>
       <rect width="1080" height="1350" fill="url(#covgrad)"/>`
    : `<rect width="1080" height="1350" fill="#2a2a2a"/>`;

  const Y1 = 1060;
  const Y2 = Y1 + 120; // 행간 120

  const textLine = (text, y) => !text ? '' : `<text x="540" y="${y}"
    font-family="'Yang organization Gothic Bold', sans-serif"
    font-weight="700" font-size="84" text-anchor="middle"
    filter="url(#tsheavy)">${parseAccentLine(text)}</text>`;

  return wrap(`
  ${bg}
  <!-- 핸들 -->
  <text x="540" y="72"
    font-family="'pretendard', 'Pretendard', sans-serif"
    font-weight="400" font-size="22"
    fill="white" fill-opacity="0.52" text-anchor="middle"
    filter="url(#ts)">@minjaja.pdf</text>
  ${textLine(line1, Y1)}
  ${textLine(line2, Y2)}
  `);
}

// ── 아이템 슬라이드 (사진 1장) ────────────────────────────────────────────────
export function generateOOTDSlide({
  bgImage,
  brandName,
  productName,
  textX = 60,
  textY = 700,
  anchor = 'start',
  accentBrand = false, // 브랜드명에 강조색 적용 여부
}) {
  const bg = bgImage
    ? `<image href="${bgImage}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="1080" height="1350" fill="#2a2a2a"/>`;

  return wrap(`
  ${bg}
  <!-- 핸들 -->
  <text x="540" y="72"
    font-family="'pretendard', 'Pretendard', sans-serif"
    font-weight="400" font-size="22"
    fill="white" fill-opacity="0.52" text-anchor="middle"
    filter="url(#ts)">@minjaja.pdf</text>
  <!-- 브랜드명 -->
  <text x="${textX}" y="${textY}"
    font-family="'pretendard', 'Pretendard', sans-serif"
    font-weight="700" font-size="40"
    fill="${accentBrand ? ACCENT : 'white'}" text-anchor="${anchor}"
    filter="url(#ts)">${esc(brandName)}</text>
  <!-- 제품명 + 가격 -->
  <text x="${textX}" y="${textY + 54}"
    font-family="'pretendard', 'Pretendard', sans-serif"
    font-weight="400" font-size="30"
    fill="white" fill-opacity="0.88" text-anchor="${anchor}"
    filter="url(#ts)">${esc(productName)}</text>
  `);
}

// ── 아이템 슬라이드 (사진 2장) ────────────────────────────────────────────────
// bgImage: 풀블리드 배경 사진
// subImage: 우측 하단 오버레이 사진 (고정 위치: x=652 y=850 w=366 h=449)
export function generateOOTDSlide2Photo({
  bgImage,
  subImage,
  brandName,
  productName,
  textX = 60,
  textY = 700,
  anchor = 'start',
  accentBrand = false,
}) {
  const bg = bgImage
    ? `<image href="${bgImage}" x="0" y="0" width="1080" height="1350" preserveAspectRatio="xMidYMid slice"/>`
    : `<rect width="1080" height="1350" fill="#2a2a2a"/>`;

  const sub = subImage
    ? `<!-- 서브 사진: 우측 하단 오버레이 -->
       <image href="${subImage}" x="652" y="850" width="366" height="449" preserveAspectRatio="xMidYMid slice"/>
       <rect x="652" y="850" width="366" height="449" fill="none" stroke="white" stroke-opacity="0.15" stroke-width="1"/>`
    : '';

  return wrap(`
  ${bg}
  ${sub}
  <!-- 핸들 -->
  <text x="540" y="72"
    font-family="'pretendard', 'Pretendard', sans-serif"
    font-weight="400" font-size="22"
    fill="white" fill-opacity="0.52" text-anchor="middle"
    filter="url(#ts)">@minjaja.pdf</text>
  <!-- 브랜드명 -->
  <text x="${textX}" y="${textY}"
    font-family="'pretendard', 'Pretendard', sans-serif"
    font-weight="700" font-size="40"
    fill="${accentBrand ? ACCENT : 'white'}" text-anchor="${anchor}"
    filter="url(#ts)">${esc(brandName)}</text>
  <!-- 제품명 + 가격 -->
  <text x="${textX}" y="${textY + 54}"
    font-family="'pretendard', 'Pretendard', sans-serif"
    font-weight="400" font-size="30"
    fill="white" fill-opacity="0.88" text-anchor="${anchor}"
    filter="url(#ts)">${esc(productName)}</text>
  `);
}

export const OOTD_ACCENT = ACCENT;

// ── 폰트 embed (SVG/PNG 다운로드용) ──────────────────────────────────────────
// fetch 결과를 캐싱해서 다운로드마다 재요청하지 않음
const _fontCache = {};

async function fetchB64(url) {
  if (_fontCache[url]) return _fontCache[url];
  const res = await fetch(url);
  const blob = await res.blob();
  const b64 = await new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(blob);
  });
  _fontCache[url] = b64;
  return b64;
}

export async function embedFontsInSvg(svgString) {
  const [yangB64, regB64, boldB64] = await Promise.all([
    fetchB64('/fonts/yangfont02.ttf'),
    fetchB64('/fonts/Pretendard-Regular.otf'),
    fetchB64('/fonts/Pretendard-Bold.otf'),
  ]);

  const style = `<style>
    @font-face {
      font-family: 'Yang organization Gothic Bold';
      src: url('data:font/truetype;base64,${yangB64}') format('truetype');
      font-weight: 700;
    }
    @font-face {
      font-family: 'Pretendard';
      src: url('data:font/opentype;base64,${regB64}') format('opentype');
      font-weight: 400;
    }
    @font-face {
      font-family: 'Pretendard';
      src: url('data:font/opentype;base64,${boldB64}') format('opentype');
      font-weight: 700;
    }
  </style>`;

  return svgString.replace('</defs>', `${style}</defs>`);
}
