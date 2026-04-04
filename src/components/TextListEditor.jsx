// 줄 목록 편집기 (여러 줄 텍스트 입력, 예: bullets, descLines, memoLines)

export default function TextListEditor({ label, lines, onChange, placeholder = '텍스트 입력', maxLines = 6 }) {
  function updateLine(i, val) {
    const next = [...lines];
    next[i] = val;
    onChange(next);
  }

  function addLine() {
    if (lines.length >= maxLines) return;
    onChange([...lines, '']);
  }

  function removeLine(i) {
    onChange(lines.filter((_, idx) => idx !== i));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-600">{label}</label>}
      {lines.map((line, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#3ECFB2]"
            value={line}
            placeholder={`${placeholder} ${i + 1}`}
            onChange={(e) => updateLine(i, e.target.value)}
          />
          {lines.length > 1 && (
            <button
              className="text-gray-300 hover:text-red-400 text-lg leading-none w-6"
              onClick={() => removeLine(i)}
            >×</button>
          )}
        </div>
      ))}
      {lines.length < maxLines && (
        <button
          className="text-xs text-gray-400 hover:text-[#3ECFB2] text-left mt-0.5"
          onClick={addLine}
        >+ 추가</button>
      )}
    </div>
  );
}
