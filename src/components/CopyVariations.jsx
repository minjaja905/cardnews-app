// AI가 생성한 3가지 카피 변형을 카드 형태로 보여주고 선택하게 함
import { COLOR_THEMES } from '../data/styles';

function VariationCard({ variation, index, isSelected, onSelect, primaryColor }) {
  const labels = variation.label?.split('—') || [`#${index + 1}`, ''];
  const tag = labels[0]?.trim();
  const subtitle = labels[1]?.trim();

  // 커버 카드(card1)의 heroLines에서 미리보기 텍스트 추출
  const card1 = variation.card1 || {};
  const previewLines = card1.heroLines || [{ text: variation.card1?.title || '', color: '#1A1A1A' }];

  return (
    <button
      onClick={() => onSelect(index)}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${
        isSelected ? 'shadow-md' : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
      }`}
      style={isSelected
        ? { borderColor: primaryColor, backgroundColor: `${primaryColor}0D` }
        : {}}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={isSelected
              ? { backgroundColor: primaryColor, color: 'white' }
              : { backgroundColor: '#F3F4F6', color: '#6B7280' }}
          >
            {index + 1}
          </span>
          <div>
            <span className="text-sm font-bold text-gray-800">{tag}</span>
            {subtitle && <span className="text-xs text-gray-400 ml-1">{subtitle}</span>}
          </div>
        </div>
        {isSelected && (
          <span
            className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: primaryColor, color: 'white' }}
          >
            선택됨
          </span>
        )}
      </div>

      {/* 카피 미리보기 */}
      <div className="space-y-1 pl-9">
        {previewLines.slice(0, 3).map((line, i) => (
          <p
            key={i}
            className="text-sm font-semibold leading-snug"
            style={{ color: line.color === '#3ECFB2' ? primaryColor : '#1A1A1A' }}
          >
            {line.text}
          </p>
        ))}
        {card1.subtitle && (
          <p className="text-xs text-gray-400 mt-1">{card1.subtitle}</p>
        )}
        {card1.hook && (
          <p className="text-xs text-gray-400 mt-1">{card1.hook}</p>
        )}
      </div>

      {/* 카드 내용 요약 토글 */}
      <div className="mt-3 pl-9 border-t border-gray-50 pt-2">
        <div className="flex flex-wrap gap-1">
          {[2, 3, 4, 5, 6].map((n) => {
            const card = variation[`card${n}`];
            const preview = card?.heroLines?.[0]?.text || card?.sectionTitle || card?.heroText || '';
            if (!preview) return null;
            return (
              <span key={n} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-400">
                {n}. {preview.slice(0, 8)}{preview.length > 8 ? '…' : ''}
              </span>
            );
          })}
        </div>
      </div>
    </button>
  );
}

export default function CopyVariations({ variations, selectedIndex, onSelect, themeKey }) {
  const primaryColor = COLOR_THEMES[themeKey]?.primary || '#3ECFB2';

  if (!variations || variations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
          <span className="text-2xl">✨</span>
        </div>
        <p className="text-sm text-gray-400">
          AI 카피 생성 버튼을 눌러<br/>3가지 버전을 비교해보세요
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-gray-400">
        3가지 카피 방향 중 하나를 선택하세요. 선택 후 텍스트 편집 단계에서 세부 수정이 가능합니다.
      </p>
      {variations.map((v, i) => (
        <VariationCard
          key={i}
          variation={v}
          index={i}
          isSelected={selectedIndex === i}
          onSelect={onSelect}
          primaryColor={primaryColor}
        />
      ))}
    </div>
  );
}
