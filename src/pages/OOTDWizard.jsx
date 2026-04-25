import { useState, useCallback, useEffect } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateOOTDCover, generateOOTDSlide, generateOOTDSlide2Photo } from '../lib/ootdSvgGenerator';
import { loadFonts } from '../lib/fontLoader';
import { downloadOne, downloadZip } from '../lib/export';
import CardPreview from '../components/CardPreview';

const ACCENT = '#B6ECF1';
const ACCENT_DARK = '#5bb8c4';

const POSITION_PRESETS = [
  { label: '↖', textX: 60,   textY: 200,  anchor: 'start'  },
  { label: '↑', textX: 540,  textY: 200,  anchor: 'middle' },
  { label: '↗', textX: 1020, textY: 200,  anchor: 'end'    },
  { label: '←', textX: 60,   textY: 650,  anchor: 'start'  },
  { label: '·', textX: 540,  textY: 650,  anchor: 'middle' },
  { label: '→', textX: 1020, textY: 650,  anchor: 'end'    },
  { label: '↙', textX: 60,   textY: 1060, anchor: 'start'  },
  { label: '↓', textX: 540,  textY: 1060, anchor: 'middle' },
  { label: '↘', textX: 1020, textY: 1060, anchor: 'end'    },
];

function readAsDataURL(file) {
  return new Promise((res) => {
    const r = new FileReader();
    r.onload = (e) => res(e.target.result);
    r.readAsDataURL(file);
  });
}

function PhotoUploader({ value, onChange, small, label }) {
  async function handleFile(e) {
    const f = e.target.files?.[0];
    if (f) onChange(await readAsDataURL(f));
  }

  if (value) {
    return (
      <div className="relative">
        <img
          src={value}
          alt="bg"
          className={`object-cover rounded-xl border border-gray-200 ${small ? 'w-20 h-24' : 'w-full h-40'}`}
          style={small ? {} : { objectPosition: 'center top' }}
        />
        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 rounded-xl opacity-0 hover:opacity-100 cursor-pointer transition-opacity text-white text-xs font-bold">
          교체
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      </div>
    );
  }

  return (
    <label
      className={`flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-[#5bb8c4] transition-all text-gray-400 hover:text-[#5bb8c4] ${small ? 'w-20 h-24 text-[10px]' : 'w-full h-24 text-xs'}`}
    >
      <span className="text-xl">🖼</span>
      {!small && <span>{label || '사진 업로드'}</span>}
      {small && label && <span className="text-center leading-tight">{label}</span>}
      <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </label>
  );
}

const defaultSlide = (id) => ({
  id,
  bgImage: null,
  subImage: null,
  brandName: '',
  productName: '',
  presetIdx: 3,
  textX: 60,
  textY: 650,
  anchor: 'start',
});

export default function OOTDWizard() {
  const setPage = useAppStore((s) => s.setPage);

  const [cover, setCover] = useState({ bgImage: null, line1: '', line2white: '', line2accent: '' });
  const [slides, setSlides] = useState([defaultSlide(1)]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [exportFmt, setExportFmt] = useState('svg');
  const [exporting, setExporting] = useState(false);
  const [nextId, setNextId] = useState(2);

  useEffect(() => { loadFonts(); }, []);

  // ── SVG 빌드 ──────────────────────────────────────────────────────────────
  const buildSvgs = useCallback(() => {
    const coverSvg = generateOOTDCover({
      bgImage: cover.bgImage,
      line1: cover.line1,
      line2white: cover.line2white,
      line2accent: cover.line2accent,
    });
    const slideSvgs = slides.map((s) =>
      s.subImage
        ? generateOOTDSlide2Photo({
            bgImage: s.bgImage,
            subImage: s.subImage,
            brandName: s.brandName,
            productName: s.productName,
            textX: s.textX,
            textY: s.textY,
            anchor: s.anchor,
          })
        : generateOOTDSlide({
            bgImage: s.bgImage,
            brandName: s.brandName,
            productName: s.productName,
            textX: s.textX,
            textY: s.textY,
            anchor: s.anchor,
          })
    );
    return [coverSvg, ...slideSvgs];
  }, [cover, slides]);

  const svgs = buildSvgs();

  // ── 슬라이드 조작 ─────────────────────────────────────────────────────────
  function addSlide() {
    setSlides((prev) => [...prev, defaultSlide(nextId)]);
    setNextId((n) => n + 1);
    setActiveIdx(slides.length + 1);
  }

  function removeSlide(idx) {
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setActiveIdx(Math.max(0, activeIdx - 1));
  }

  function updateSlide(idx, patch) {
    setSlides((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  }

  function applyPreset(slideIdx, presetIdx) {
    const p = POSITION_PRESETS[presetIdx];
    updateSlide(slideIdx, { presetIdx, textX: p.textX, textY: p.textY, anchor: p.anchor });
  }

  // ── 다운로드 ─────────────────────────────────────────────────────────────
  async function handleDownloadAll() {
    setExporting(true);
    try {
      const labels = ['커버', ...slides.map((_, i) => `아이템${i + 1}`)];
      await downloadZip({ svgs, labels, slug: 'OOTD', format: exportFmt });
    } catch (e) {
      alert('다운로드 실패: ' + e.message);
    } finally {
      setExporting(false);
    }
  }

  async function handleDownloadOne(i) {
    const label = i === 0 ? '커버' : `아이템${i}`;
    try {
      await downloadOne({ svgString: svgs[i], filename: `${i + 1}_${label}.${exportFmt}`, format: exportFmt });
    } catch (e) {
      alert('다운로드 실패: ' + e.message);
    }
  }

  const PREVIEW_SCALE = 0.2;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-3">
          <button onClick={() => setPage('home')} className="text-sm text-gray-400 hover:text-gray-600">← 홈</button>
          <span className="text-gray-200">|</span>
          <span className="text-sm font-bold text-gray-900">OOTD 카드뉴스</span>
          <span className="text-xs text-gray-400">— 사진 업로드 → 텍스트 입력 → 다운로드</span>
          <div className="flex-1" />
          <button
            onClick={() => setPage('feed')}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:border-[#5bb8c4] hover:text-[#5bb8c4] transition-all font-medium"
          >
            ✍️ 피드 글 쓰기
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6 flex gap-6">
        {/* ── 왼쪽 패널 ── */}
        <div className="w-80 flex-shrink-0 flex flex-col gap-4 sticky top-[60px] self-start max-h-[calc(100vh-80px)] overflow-y-auto">

          {/* 커버 편집 */}
          <div
            className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3 cursor-pointer border-2 transition-all"
            style={{ borderColor: activeIdx === 0 ? ACCENT_DARK : 'transparent' }}
            onClick={() => setActiveIdx(0)}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-900">커버</span>
              <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: ACCENT_DARK }}>1장</span>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
              <p className="text-xs text-gray-400 mb-1.5">배경 사진</p>
              <PhotoUploader value={cover.bgImage} onChange={(v) => setCover((c) => ({ ...c, bgImage: v }))} />
            </div>

            {activeIdx === 0 && (
              <div className="flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                <input
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                  placeholder="서브 타이틀 (작은 글씨)"
                  value={cover.line1}
                  onChange={(e) => setCover((c) => ({ ...c, line1: e.target.value }))}
                />
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="메인 타이틀 (흰색)"
                    value={cover.line2white}
                    onChange={(e) => setCover((c) => ({ ...c, line2white: e.target.value }))}
                  />
                  <input
                    className="w-28 border-2 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    style={{ borderColor: ACCENT, background: '#f0fbfc' }}
                    placeholder="강조 (하늘)"
                    value={cover.line2accent}
                    onChange={(e) => setCover((c) => ({ ...c, line2accent: e.target.value }))}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 아이템 슬라이드 목록 */}
          {slides.map((slide, i) => (
            <div
              key={slide.id}
              className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3 cursor-pointer border-2 transition-all"
              style={{ borderColor: activeIdx === i + 1 ? ACCENT_DARK : 'transparent' }}
              onClick={() => setActiveIdx(i + 1)}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-gray-900">아이템 {i + 1}</span>
                {slides.length > 1 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); removeSlide(i); }}
                    className="text-xs text-gray-300 hover:text-red-400 transition-colors"
                  >
                    삭제
                  </button>
                )}
              </div>

              <div className="flex gap-3" onClick={(e) => e.stopPropagation()}>
                <PhotoUploader value={slide.bgImage} onChange={(v) => updateSlide(i, { bgImage: v })} small />
                <PhotoUploader
                  value={slide.subImage}
                  onChange={(v) => updateSlide(i, { subImage: v })}
                  small
                  label={slide.subImage ? undefined : '서브 사진'}
                />
                <div className="flex-1 flex flex-col gap-2">
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="브랜드명"
                    value={slide.brandName}
                    onChange={(e) => updateSlide(i, { brandName: e.target.value })}
                  />
                  <input
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    placeholder="제품명 / 가격"
                    value={slide.productName}
                    onChange={(e) => updateSlide(i, { productName: e.target.value })}
                  />
                </div>
              </div>

              {slide.subImage && (
                <p className="text-[10px] text-gray-400" onClick={(e) => e.stopPropagation()}>
                  서브 사진 있음 → 우측 하단 오버레이 레이아웃 적용
                </p>
              )}

              {/* 텍스트 위치 프리셋 */}
              {activeIdx === i + 1 && (
                <div onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-gray-400 mb-1.5">텍스트 위치</p>
                  <div className="grid grid-cols-3 gap-1">
                    {POSITION_PRESETS.map((p, pi) => (
                      <button
                        key={pi}
                        onClick={() => applyPreset(i, pi)}
                        className="py-2 rounded-lg text-sm font-bold transition-all"
                        style={slide.presetIdx === pi
                          ? { backgroundColor: ACCENT_DARK, color: 'white' }
                          : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* 슬라이드 추가 */}
          <button
            onClick={addSlide}
            className="py-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#5bb8c4] text-sm font-semibold text-gray-400 hover:text-[#5bb8c4] transition-all"
          >
            + 아이템 추가
          </button>

          {/* 다운로드 */}
          <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <span className="text-sm font-bold text-gray-900">다운로드</span>
            <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
              {['svg', 'png'].map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFmt(fmt)}
                  className="flex-1 py-2 rounded-lg text-sm font-bold uppercase transition-all"
                  style={exportFmt === fmt
                    ? { backgroundColor: ACCENT_DARK, color: 'white' }
                    : { color: '#9ca3af' }}
                >
                  {fmt}
                </button>
              ))}
            </div>
            <button
              onClick={handleDownloadAll}
              disabled={exporting}
              className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
              style={{ backgroundColor: exporting ? '#9ca3af' : ACCENT_DARK }}
            >
              {exporting ? '변환 중...' : `📦 전체 ${svgs.length}장 ZIP`}
            </button>
            <div className="flex flex-col gap-1">
              {svgs.map((_, i) => (
                <button
                  key={i}
                  onClick={() => handleDownloadOne(i)}
                  className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-200 text-sm"
                >
                  <span className="text-gray-700">{i === 0 ? '커버' : `아이템 ${i}`}</span>
                  <span className="text-xs font-medium" style={{ color: ACCENT_DARK }}>↓ {exportFmt.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 피드 글 쓰기 연결 */}
          <button
            onClick={() => setPage('feed')}
            className="py-3 rounded-2xl bg-white border border-gray-100 hover:border-[#5bb8c4] shadow-sm text-sm font-semibold text-gray-500 hover:text-[#5bb8c4] transition-all"
          >
            ✍️ 피드 글 쓰기로 이동
          </button>
        </div>

        {/* ── 미리보기 ── */}
        <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="font-bold text-gray-900">미리보기</span>
            <span className="text-xs text-gray-400">1080 × 1350 px</span>
          </div>
          <div className="flex flex-wrap gap-4 justify-center">
            {svgs.map((svg, i) => (
              <div
                key={i}
                onClick={() => setActiveIdx(i)}
                className="cursor-pointer rounded-xl transition-all"
                style={activeIdx === i ? { outline: `2px solid ${ACCENT_DARK}`, outlineOffset: 4 } : {}}
              >
                <CardPreview
                  svgString={svg}
                  label={i === 0 ? '커버' : `아이템 ${i}`}
                  scale={0.2}
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
