// 컬러 테마: primary 외에 그라디언트 색상도 함께 정의
export const COLOR_THEMES = {
  mint:   { key: 'mint',   label: '민트',  primary: '#3ECFB2', gradStart: '#AEEADB', gradMid: '#DDF5EF' },
  purple: { key: 'purple', label: '퍼플',  primary: '#8B5CF6', gradStart: '#C4B5FD', gradMid: '#EDE9FE' },
  coral:  { key: 'coral',  label: '코랄',  primary: '#F97066', gradStart: '#FCA5A5', gradMid: '#FEE2E2' },
  blue:   { key: 'blue',   label: '블루',  primary: '#3B82F6', gradStart: '#93C5FD', gradMid: '#DBEAFE' },
  gold:   { key: 'gold',   label: '골드',  primary: '#F59E0B', gradStart: '#FCD34D', gradMid: '#FEF3C7' },
  mono:   { key: 'mono',   label: '모노',  primary: '#374151', gradStart: '#D1D5DB', gradMid: '#F3F4F6' },
  indigo: { key: 'indigo', label: '인디고', primary: '#6366F1', gradStart: '#C7D2FE', gradMid: '#EEF2FF' },
};

// SVG 문자열에 테마 색상 적용 (post-process)
export function applyTheme(svgString, themeKey) {
  const t = COLOR_THEMES[themeKey] || COLOR_THEMES.mint;
  if (themeKey === 'mint') return svgString;
  return svgString
    .replace(/#3ECFB2/gi, t.primary)
    .replace(/#AEEADB/gi, t.gradStart)
    .replace(/#DDF5EF/gi, t.gradMid);
}

// SVG에 폰트 적용 — manifest fontDef 사용
// fontDef: { id, title: {weight}, body: {weight} }
export function applyFont(svgString, fontDef) {
  if (!fontDef || fontDef.id === 'pretendard') return svgString;
  const { id, title, body } = fontDef;
  const tw = title?.weight || '700';
  const bw = body?.weight || '400';

  let result = svgString;

  // ── 히어로 폰트: font-family 속성 전체 교체 (콤마 누락 버그 방지) ────────────
  result = result.replace(
    /font-family="'Pretendard ExtraBold'[^"]*"/g,
    `font-family="'${id}', sans-serif"`
  );
  result = result.replace(
    /font-family="'Black Han Sans'[^"]*"/g,
    `font-family="'${id}', sans-serif"`
  );
  result = result.replace(
    /font-family="'Noto Serif KR'[^"]*"/g,
    `font-family="'${id}', sans-serif"`
  );

  // 히어로 weight 교체 (800 → title weight)
  result = result.replace(/font-weight="800"/g, `font-weight="${tw}"`);

  // ── 본문 폰트: 첫 항목이 Pretendard든 LeeSeoyun이든 전체 교체 + body weight 삽입 ──
  // 밈 카드 패턴: 'LeeSeoyun',...
  result = result.replace(
    /font-family="'LeeSeoyun'[^"]*"/g,
    `font-family="'${id}', sans-serif" font-weight="${bw}"`
  );
  // 일반 카드 패턴: 'Pretendard','Apple SD Gothic Neo',...
  result = result.replace(
    /font-family="'Pretendard','Apple SD Gothic Neo'[^"]*"/g,
    `font-family="'${id}', sans-serif" font-weight="${bw}"`
  );
  // 그 외 단독 'Pretendard'... ('Pretendard ExtraBold'는 위에서 이미 처리됨)
  result = result.replace(
    /font-family="'Pretendard'[^"]*"/g,
    `font-family="'${id}', sans-serif" font-weight="${bw}"`
  );

  return result;
}

// 두 가지 스타일 한번에 적용
// style = { themeKey, fontDef }  (fontDef = manifest의 폰트 객체)
export function applyStyle(svgString, { themeKey, fontDef }) {
  return applyFont(applyTheme(svgString, themeKey), fontDef);
}
