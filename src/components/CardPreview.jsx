// 실시간 SVG 미리보기 — CSS transform으로 정확한 축소 스케일 적용

export default function CardPreview({ svgString, cardNum, scale = 0.22, label }) {
  const W = 1080;
  const H = 1350;
  const w = Math.round(W * scale);
  const h = Math.round(H * scale);

  return (
    <div className="flex flex-col items-center gap-1">
      {/* 컨테이너: 정확한 축소 크기로 고정, overflow hidden */}
      <div
        className="rounded-lg overflow-hidden shadow-sm border border-gray-100 bg-gray-50 flex-shrink-0"
        style={{ width: w, height: h, position: 'relative' }}
      >
        {svgString ? (
          // SVG를 원본 크기로 렌더링한 뒤 CSS transform으로 축소
          <div
            style={{
              width: W,
              height: H,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              pointerEvents: 'none',
            }}
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
            미리보기
          </div>
        )}
      </div>
      <span className="text-[11px] text-gray-400">{label ?? `카드 ${cardNum}`}</span>
    </div>
  );
}
