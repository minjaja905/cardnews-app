// 동적 폰트 로더 — /public/fonts/manifest.json에서 읽어 <style> 태그로 주입
// 폴더에 폰트 추가 + manifest.json 업데이트 후 새로고침 버튼 클릭 시 반영

let cachedFonts = [];

function formatHint(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (ext === 'otf') return 'opentype';
  if (ext === 'ttf') return 'truetype';
  if (ext === 'woff2') return 'woff2';
  if (ext === 'woff') return 'woff';
  return 'truetype';
}

export async function loadFonts() {
  try {
    // cache-bust로 항상 최신 manifest 가져오기
    const res = await fetch(`/fonts/manifest.json?t=${Date.now()}`);
    if (!res.ok) throw new Error(`manifest 로드 실패: ${res.status}`);
    cachedFonts = await res.json();

    // 기존 동적 폰트 스타일 제거
    document.getElementById('dynamic-fonts')?.remove();

    // @font-face 생성
    const faces = cachedFonts.flatMap((f) => {
      const result = [];
      // 제목 (Bold)
      if (f.title) {
        result.push(`@font-face {
  font-family: '${f.id}';
  src: url('/fonts/${f.title.file}') format('${formatHint(f.title.file)}');
  font-weight: ${f.title.weight};
  font-style: normal;
  font-display: swap;
}`);
      }
      // 본문 (Light/Regular)
      if (f.body && f.body.file !== f.title?.file) {
        result.push(`@font-face {
  font-family: '${f.id}';
  src: url('/fonts/${f.body.file}') format('${formatHint(f.body.file)}');
  font-weight: ${f.body.weight};
  font-style: normal;
  font-display: swap;
}`);
      }
      // 미디엄
      if (f.medium && f.medium.file !== f.title?.file && f.medium.file !== f.body?.file) {
        result.push(`@font-face {
  font-family: '${f.id}';
  src: url('/fonts/${f.medium.file}') format('${formatHint(f.medium.file)}');
  font-weight: ${f.medium.weight};
  font-style: normal;
  font-display: swap;
}`);
      }
      return result;
    });

    const style = document.createElement('style');
    style.id = 'dynamic-fonts';
    style.textContent = faces.join('\n');
    document.head.appendChild(style);

    return cachedFonts;
  } catch (e) {
    console.error('폰트 로드 오류:', e);
    return [];
  }
}

export function getFonts() {
  return cachedFonts;
}

// SVG에서 히어로 font-family를 선택된 폰트로 교체
// - heroWeight: 제목 font-weight (title.weight)
// - bodyWeight: 본문 font-weight (body.weight)
export function applyFontToSvg(svgString, fontDef) {
  if (!fontDef) return svgString;
  const { id, title, body } = fontDef;

  let result = svgString;

  // 히어로/제목 폰트 교체 (Pretendard ExtraBold, Black Han Sans 등)
  result = result.replace(
    /'Pretendard ExtraBold'[^"]*|'Black Han Sans'[^"]*|'Noto Serif KR'[^"]*/g,
    `'${id}'`
  );

  // 히어로 font-weight 교체
  // font-weight="800" → title.weight
  result = result.replace(/font-weight="800"/g, `font-weight="${title?.weight || '700'}"`);

  // 본문 폰트 교체 (LeeSeoyun, Apple SD Gothic Neo 등)
  result = result.replace(
    /'LeeSeoyun',[^"]*/g,
    `'${id}', sans-serif`
  );

  return result;
}
