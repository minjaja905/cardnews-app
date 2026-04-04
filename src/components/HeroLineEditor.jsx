// 히어로 텍스트 라인 편집기 — 3색 선택 (흰색 / 검정 / 테마컬러)
// 테마컬러는 #3ECFB2로 저장 → applyStyle() 이 실제 테마색으로 치환

const PALETTE = [
  { value: 'white',   label: '흰색', bg: '#FFFFFF', border: '#d1d5db' },
  { value: '#1A1A1A', label: '검정', bg: '#1A1A1A', border: '#1A1A1A' },
  { value: '#3ECFB2', label: '컬러', bg: '#3ECFB2', border: '#3ECFB2' },
];

export default function HeroLineEditor({ lines, onChange }) {
  function updateLine(i, field, val) {
    const next = lines.map((l, idx) => idx === i ? { ...l, [field]: val } : l);
    onChange(next);
  }

  function addLine() {
    onChange([...lines, { text: '', color: 'white' }]);
  }

  function removeLine(i) {
    onChange(lines.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-2">
      {lines.map((line, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-[#3ECFB2]"
              value={line.text}
              placeholder={`히어로 ${i + 1}줄`}
              onChange={(e) => updateLine(i, 'text', e.target.value)}
            />
            {lines.length > 1 && (
              <button
                className="text-gray-300 hover:text-red-400 text-lg leading-none w-6 flex-shrink-0"
                onClick={() => removeLine(i)}
              >×</button>
            )}
          </div>
          {/* 3-color palette */}
          <div className="flex items-center gap-1.5 pl-0.5">
            {PALETTE.map(c => {
              const active = line.color === c.value;
              return (
                <button
                  key={c.value}
                  title={c.label}
                  onClick={() => updateLine(i, 'color', c.value)}
                  className="w-6 h-6 rounded-full flex-shrink-0 transition-all"
                  style={{
                    backgroundColor: c.bg,
                    border: `2px solid ${c.border}`,
                    outline: active ? `2px solid ${c.border}` : 'none',
                    outlineOffset: '2px',
                    transform: active ? 'scale(1.15)' : 'scale(1)',
                  }}
                />
              );
            })}
            <span className="text-[10px] text-gray-400 ml-1">
              {PALETTE.find(c => c.value === line.color)?.label || ''}
            </span>
          </div>
        </div>
      ))}
      <button
        className="text-xs text-gray-400 hover:text-[#3ECFB2] text-left mt-1"
        onClick={addLine}
      >+ 줄 추가</button>
    </div>
  );
}
