import { useState, useEffect } from 'react';
import { COLOR_THEMES } from '../data/styles';
import { loadFonts, getFonts } from '../lib/fontLoader';

export default function StylePicker({ style, onChange }) {
  const { themeKey, fontDef } = style;
  const [fonts, setFonts] = useState(getFonts);
  const [refreshing, setRefreshing] = useState(false);

  // 최초 마운트 시 폰트 로드
  useEffect(() => {
    if (fonts.length === 0) handleRefresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRefresh() {
    setRefreshing(true);
    const loaded = await loadFonts();
    setFonts(loaded);
    setRefreshing(false);
    // 현재 선택 폰트가 여전히 목록에 있는지 확인, 없으면 첫 번째로
    if (loaded.length > 0 && !loaded.find((f) => f.id === fontDef?.id)) {
      onChange({ fontDef: loaded[0] });
    }
  }

  const primary = COLOR_THEMES[themeKey]?.primary || '#3ECFB2';

  return (
    <div className="flex flex-col gap-6">
      {/* 메인 컬러 */}
      <div>
        <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">메인 컬러</p>
        <div className="flex flex-wrap gap-3">
          {Object.values(COLOR_THEMES).map((t) => (
            <button
              key={t.key}
              onClick={() => onChange({ themeKey: t.key })}
              title={t.label}
              className="flex flex-col items-center gap-1 p-1.5 rounded-xl transition-all hover:bg-gray-50"
            >
              <span
                className="w-9 h-9 rounded-full block shadow-sm"
                style={{
                  background: `linear-gradient(135deg, ${t.gradStart}, ${t.primary})`,
                  outline: themeKey === t.key ? `2.5px solid ${t.primary}` : '2px solid transparent',
                  outlineOffset: 2,
                }}
              />
              <span className="text-[10px] text-gray-400">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 글꼴 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">글꼴</p>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-all disabled:opacity-50"
            style={{ color: primary, backgroundColor: `${primary}15` }}
            title="/public/fonts/ 폴더의 폰트를 다시 읽습니다"
          >
            <span className={refreshing ? 'animate-spin inline-block' : ''}>↺</span>
            {refreshing ? '로딩...' : '새로고침'}
          </button>
        </div>

        {fonts.length === 0 ? (
          <p className="text-xs text-gray-400 py-3 text-center">폰트를 불러오는 중...</p>
        ) : (
          <div className="flex flex-col gap-2">
            {fonts.map((f) => {
              const isSelected = fontDef?.id === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => onChange({ fontDef: f })}
                  className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left"
                  style={isSelected
                    ? { borderColor: primary, backgroundColor: `${primary}0D` }
                    : { borderColor: '#F3F4F6', backgroundColor: 'white' }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span
                      className="text-base leading-tight"
                      style={{
                        fontFamily: `'${f.id}', sans-serif`,
                        fontWeight: f.title?.weight || '700',
                        color: isSelected ? primary : '#1A1A1A',
                      }}
                    >
                      {f.name}
                    </span>
                    <span
                      className="text-xs"
                      style={{
                        fontFamily: `'${f.id}', sans-serif`,
                        fontWeight: f.body?.weight || '400',
                        color: '#9CA3AF',
                      }}
                    >
                      가나다 ABC 123 — {f.category}
                    </span>
                  </div>
                  {isSelected && (
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0"
                      style={{ backgroundColor: primary }}
                    >
                      ✓
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <p className="text-[10px] text-gray-300 mt-2">
          /public/fonts/ 에 폰트 파일 추가 + manifest.json 수정 후 새로고침
        </p>
      </div>

      {/* 적용 안내 */}
      <div
        className="p-3 rounded-xl flex items-start gap-2"
        style={{ backgroundColor: `${primary}12` }}
      >
        <span className="text-sm flex-shrink-0">🎨</span>
        <span className="text-xs text-gray-500">
          선택한 컬러·글꼴이 모든 카드에 즉시 반영됩니다.
          제목은 <b>굵은</b> 폰트, 본문은 <b>가는</b> 폰트로 자동 구분됩니다.
        </span>
      </div>
    </div>
  );
}
