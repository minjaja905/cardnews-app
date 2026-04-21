import { useState, useEffect, useCallback, memo } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateMemeVariations } from '../lib/claudeApi';
import { generateCard, makeDefaultParams } from '../lib/svgGenerator';
import { applyStyle, COLOR_THEMES } from '../data/styles';
import { downloadOne, downloadZip } from '../lib/export';
import CardPreview from '../components/CardPreview';
import HeroLineEditor from '../components/HeroLineEditor';
import TextListEditor from '../components/TextListEditor';
import ImageUploader from '../components/ImageUploader';
import StylePicker from '../components/StylePicker';
import CopyVariations from '../components/CopyVariations';

// 기본 6장 라벨 — 추가 페이지는 번호로 표시
const BASE_LABELS = ['커버', '유래', '확산', '이럴때', '브랜드', '마무리'];
const getLabel = (n) => BASE_LABELS[n - 1] ?? `추가${n - 6}`;

const STEPS = [
  { n: 1, label: '주제' },
  { n: 2, label: '스타일' },
  { n: 3, label: '카피선택' },
  { n: 4, label: '편집' },
  { n: 5, label: '다운로드' },
];

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}
function Inp({ style: s, ...rest }) {
  return (
    <input
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none w-full bg-white"
      style={s}
      {...rest}
    />
  );
}

// ── CardEditor — MemeWizard 밖에서 정의해야 리렌더 시 재마운트 방지 ──────────────
const CardEditor = memo(function CardEditor({ n, params, onUpdate, coverImage, onCoverImageChange, primaryColor }) {
  const key = `card${n}`;
  const p = params?.[key] || {};

  if (n > 6) return (
    <div className="flex flex-col gap-4">
      <Field label="히어로 텍스트">
        <HeroLineEditor lines={p.heroLines || []} onChange={v => onUpdate(key, 'heroLines', v)} />
      </Field>
      <Field label="배지 라벨">
        <Inp value={p.badgeLabel || ''} onChange={e => onUpdate(key, 'badgeLabel', e.target.value)} placeholder="라벨" />
      </Field>
      <Field label="한 줄 소개">
        <Inp value={p.subtitle || ''} onChange={e => onUpdate(key, 'subtitle', e.target.value)} />
      </Field>
    </div>
  );
  if (n === 1) return (
    <div className="flex flex-col gap-4">
      <Field label="커버 배경 이미지">
        <ImageUploader
          value={coverImage || null}
          onChange={onCoverImageChange}
          primaryColor={primaryColor}
        />
      </Field>
      <Field label="히어로 텍스트">
        <HeroLineEditor lines={p.heroLines || []} onChange={v => onUpdate(key, 'heroLines', v)} />
      </Field>
      <Field label="배지 라벨">
        <Inp value={p.badgeLabel || ''} onChange={e => onUpdate(key, 'badgeLabel', e.target.value)} placeholder="밈 이름 짧게" />
      </Field>
      <Field label="요약 한 줄">
        <Inp value={p.subtitle || ''} onChange={e => onUpdate(key, 'subtitle', e.target.value)} placeholder="20자 이내" />
      </Field>
    </div>
  );
  if (n === 2) return (
    <div className="flex flex-col gap-4">
      <Field label="밈 사진">
        <ImageUploader
          value={coverImage || null}
          onChange={onCoverImageChange}
          primaryColor={primaryColor}
        />
      </Field>
      <Field label="히어로 텍스트">
        <HeroLineEditor lines={p.heroLines || []} onChange={v => onUpdate(key, 'heroLines', v)} />
      </Field>
      <Field label="좌측 텍스트 박스">
        <TextListEditor lines={p.leftBoxLines || []} onChange={v => onUpdate(key, 'leftBoxLines', v)} placeholder="텍스트" maxLines={4} />
      </Field>
      <Field label="우측 텍스트 박스">
        <TextListEditor lines={p.rightBoxLines || []} onChange={v => onUpdate(key, 'rightBoxLines', v)} placeholder="텍스트" maxLines={4} />
      </Field>
      <Field label="하단 요약 박스">
        <TextListEditor lines={p.summaryLines || []} onChange={v => onUpdate(key, 'summaryLines', v)} placeholder="요약" maxLines={4} />
      </Field>
    </div>
  );
  if (n === 3) return (
    <div className="flex flex-col gap-4">
      <Field label="히어로 텍스트">
        <HeroLineEditor lines={p.heroLines || []} onChange={v => onUpdate(key, 'heroLines', v)} />
      </Field>
      <Field label="소제목 (2줄)">
        <TextListEditor lines={p.subtitleLines || []} onChange={v => onUpdate(key, 'subtitleLines', v)} placeholder="소제목" maxLines={3} />
      </Field>
      <Field label="오른쪽 캡션">
        <Inp value={p.captionRight || ''} onChange={e => onUpdate(key, 'captionRight', e.target.value)} />
      </Field>
      <Field label="핵심 인사이트 박스">
        <TextListEditor lines={p.mintBoxLines || []} onChange={v => onUpdate(key, 'mintBoxLines', v)} placeholder="인사이트" maxLines={2} />
      </Field>
      <Field label="출처">
        <Inp value={p.sourceText || ''} onChange={e => onUpdate(key, 'sourceText', e.target.value)} />
      </Field>
    </div>
  );
  if (n === 4) return (
    <div className="flex flex-col gap-4">
      <Field label="히어로 텍스트">
        <HeroLineEditor lines={p.heroLines || []} onChange={v => onUpdate(key, 'heroLines', v)} />
      </Field>
      <Field label="오른쪽 캡션">
        <Inp value={p.captionRight || ''} onChange={e => onUpdate(key, 'captionRight', e.target.value)} />
      </Field>
      <Field label="상황 bullet (이모지 포함, 4개)">
        <TextListEditor lines={p.bullets || []} onChange={v => onUpdate(key, 'bullets', v)} placeholder="🍊 상황" maxLines={4} />
      </Field>
      <Field label="브랜드 callout">
        <TextListEditor lines={p.calloutLines || []} onChange={v => onUpdate(key, 'calloutLines', v)} placeholder="callout" maxLines={3} />
      </Field>
    </div>
  );
  if (n === 5) return (
    <div className="flex flex-col gap-4">
      <Field label="히어로 텍스트">
        <HeroLineEditor lines={p.heroLines || []} onChange={v => onUpdate(key, 'heroLines', v)} />
      </Field>
      <Field label="이미지 왼쪽 캡션">
        <TextListEditor lines={p.leftCaption || []} onChange={v => onUpdate(key, 'leftCaption', v)} placeholder="캡션" maxLines={2} />
      </Field>
      <Field label="이미지 오른쪽 캡션">
        <TextListEditor lines={p.rightCaption || []} onChange={v => onUpdate(key, 'rightCaption', v)} placeholder="캡션" maxLines={2} />
      </Field>
      <Field label="핵심 요약 (2줄 굵게 + 1줄 설명)">
        <TextListEditor lines={p.summaryLines || []} onChange={v => onUpdate(key, 'summaryLines', v)} placeholder="요약" maxLines={3} />
      </Field>
    </div>
  );
  if (n === 6) return (
    <div className="flex flex-col gap-4">
      <Field label="히어로 텍스트 (중앙)">
        <Inp value={p.heroText || ''} onChange={e => onUpdate(key, 'heroText', e.target.value)} placeholder="밈 이름" />
      </Field>
      <Field label="소자 코멘트">
        <Inp value={p.subText || ''} onChange={e => onUpdate(key, 'subText', e.target.value)} placeholder="조용히 💫" />
      </Field>
      <Field label="CTA 2줄">
        <TextListEditor lines={p.ctaLines || []} onChange={v => onUpdate(key, 'ctaLines', v)} placeholder="CTA" maxLines={2} />
      </Field>
    </div>
  );
  return null;
});

export default function MemeWizard() {
  const store = useAppStore();
  const {
    step, setStep, topic, setTopic, details, setDetails,
    volNum, setVolNum, date, setDate, style, setStyle,
    variations, setVariations, selectedVar, setSelectedVar,
    params, setParams, updateParam, images, setImage,
    aiLoading, setAiLoading, aiError, setAiError, setPage,
    cardCount, setCardCount,
    coverType, setCoverType,
  } = store;

  const [activeCard, setActiveCard] = useState(1);
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'images'
  const [exportFormat, setExportFormat] = useState('svg');
  const [exportLoading, setExportLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const ESTIMATED_SEC = 25;

  const primary = COLOR_THEMES[style.themeKey]?.primary || '#3ECFB2';

  // ── AI 타이머 ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aiLoading) { setElapsedSec(0); return; }
    const t = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [aiLoading]);
  const cardNums = Array.from({ length: cardCount }, (_, i) => i + 1);

  // ── SVG 빌드 ─────────────────────────────────────────────────────────────────
  function buildCardParams(n) {
    const base = { memeName: topic, volNum: Number(volNum) || 1, date };
    const p = params?.[`card${n}`] || {};
    if (n === 1) return { ...base, ...p, coverImg: coverType === 'photo' ? images.cover : null };
    if (n === 2) return { ...base, ...p, mainImg: images.origin };
    if (n === 3) return { ...base, ...p, spreadImg1: images.spread1, spreadImg2: images.spread2 };
    if (n === 4) return { ...base, ...p, sideImg: images.side };
    if (n === 5) return { ...base, ...p, centerImg: images.center };
    // 추가 카드 (7+): extra_N 이미지 지원
    return { ...base, ...p, coverImg: images[`extra_${n}`] };
  }

  const [svgs, setSvgs] = useState({});

  const rebuildSvgs = useCallback(() => {
    if (!params) return;
    const built = {};
    for (const n of cardNums) {
      const raw = generateCard(Math.min(n, 6), buildCardParams(n));
      built[n] = applyStyle(raw, style);
    }
    setSvgs(built);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, images, topic, volNum, date, style, cardCount]);

  useEffect(() => { rebuildSvgs(); }, [rebuildSvgs]);

  // ── AI 생성 ──────────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!topic.trim()) { setAiError('밈 이름을 입력해주세요'); return; }
    setAiError('');
    setAiLoading(true);
    try {
      const vars = await generateMemeVariations({ topic, details, volNum, date });
      setVariations(vars);
      applyVariation(vars, 0);
      setStep(3);
    } catch (e) {
      setAiError(e.message);
    } finally {
      setAiLoading(false);
    }
  }

  function applyVariation(vars, idx) {
    const v = vars[idx];
    if (!v) return;
    const defaults = makeDefaultParams(topic, Number(volNum) || 1, date);
    const merged = {};
    for (let n = 1; n <= Math.max(cardCount, 6); n++) {
      merged[`card${n}`] = { ...defaults[`card${n}`], ...(v[`card${n}`] || {}) };
    }
    setParams(merged);
    setSelectedVar(idx);
  }

  function skipToManual() {
    const defaults = makeDefaultParams(topic, Number(volNum) || 1, date);
    setParams(defaults);
    setStep(4);
  }

  // ── 페이지 추가/삭제 ──────────────────────────────────────────────────────────
  function addCard() {
    const n = cardCount + 1;
    setCardCount(n);
    const defaults = makeDefaultParams(topic, Number(volNum) || 1, date);
    const newCard = defaults.card1; // 커버 구조를 기본으로
    updateParam(`card${n}`, 'heroLines', [{ text: `추가 카드 ${n - 6}`, color: '#1A1A1A' }]);
    setActiveCard(n);
  }

  function removeCard(n) {
    if (cardCount <= 1) return;
    setCardCount(cardCount - 1);
    if (activeCard === n) setActiveCard(Math.max(1, n - 1));
  }

  // ── 카드별 편집 ───────────────────────────────────────────────────────────────
  function setCardParam(cardKey, field, value) { updateParam(cardKey, field, value); }

  // ── 이미지 패널 — 모든 카드 지원 ─────────────────────────────────────────────
  function ImagesPanel() {
    const imageSlots = [
      { key: 'origin',  label: '카드 2 — 유래 스크린샷' },
      { key: 'spread1', label: '카드 3 — 확산 이미지 (좌)' },
      { key: 'spread2', label: '카드 3 — 확산 이미지 (우)' },
      { key: 'side',    label: '카드 4 — 이럴 때 우측' },
      { key: 'center',  label: '카드 5 — 브랜드 중앙' },
      ...Array.from({ length: Math.max(0, cardCount - 6) }, (_, i) => ({
        key: `extra_${i + 7}`,
        label: `카드 ${i + 7} — 추가 이미지`,
      })),
    ];
    return (
      <div className="flex flex-col gap-4">
        <div className="text-xs text-gray-400 bg-amber-50 border border-amber-100 px-3 py-2 rounded-xl">
          💡 이미지는 브라우저 메모리에만 저장됩니다. 새로고침하면 삭제됩니다.
        </div>
        {imageSlots.map(({ key, label }) => (
          <ImageUploader
            key={key}
            label={label}
            value={images[key] || null}
            onChange={(v) => setImage(key, v)}
            primaryColor={primary}
          />
        ))}
      </div>
    );
  }

  // ── 다운로드 ──────────────────────────────────────────────────────────────────
  async function handleDownloadAll() {
    setExportLoading(true);
    try {
      const slug = `김밈지_${(topic || 'cardnews').replace(/\s+/g, '_')}_vol${String(volNum || '').padStart(2, '0')}`;
      await downloadZip({
        svgs: cardNums.map((n) => svgs[n] || ''),
        labels: cardNums.map(getLabel),
        slug,
        format: exportFormat,
      });
    } catch (e) {
      alert('다운로드 실패: ' + e.message);
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDownloadOne(n) {
    try {
      await downloadOne({ svgString: svgs[n] || '', filename: `${n}_${getLabel(n)}.svg`, format: exportFormat });
    } catch (e) {
      alert('다운로드 실패: ' + e.message);
    }
  }

  const PREVIEW_SCALE = 0.21;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      {/* ── 헤더 — flex-shrink으로 레이아웃 고정 ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-4 h-14 flex items-center gap-3">
          {/* 왼쪽: 홈 버튼 + 타이틀 — min-w-0 truncate로 넘침 방지 */}
          <div className="flex items-center gap-2 min-w-0 flex-shrink-0" style={{ width: 160 }}>
            <button
              onClick={() => setPage('home')}
              className="text-sm text-gray-400 hover:text-gray-600 whitespace-nowrap flex-shrink-0"
            >
              ← 홈
            </button>
            <span className="text-gray-200 flex-shrink-0">|</span>
            <span className="text-sm font-bold text-gray-900 truncate">밈 카드뉴스</span>
          </div>

          {/* 중앙: 스텝 네비게이션 — flex-shrink-0으로 고정 */}
          <div className="flex items-center gap-0.5 flex-shrink-0 mx-auto">
            {STEPS.map((s) => {
              const active = step === s.n;
              const done = step > s.n;
              return (
                <button
                  key={s.n}
                  onClick={() => done && setStep(s.n)}
                  className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                    active ? 'text-white font-semibold' :
                    done ? 'cursor-pointer' : 'text-gray-300 cursor-default'
                  }`}
                  style={active ? { backgroundColor: primary } : done ? { color: primary } : {}}
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                    style={active
                      ? { backgroundColor: 'white', color: primary }
                      : done
                      ? { backgroundColor: primary, color: 'white' }
                      : { backgroundColor: '#E5E7EB', color: '#9CA3AF' }}
                  >
                    {done ? '✓' : s.n}
                  </span>
                  <span className="hidden md:inline whitespace-nowrap">{s.label}</span>
                </button>
              );
            })}
          </div>

          {/* 오른쪽: 초기화 — 고정 */}
          <button
            onClick={() => { if (confirm('작업 내용이 초기화됩니다. 계속할까요?')) store.reset(); }}
            className="text-xs text-gray-300 hover:text-gray-500 flex-shrink-0 ml-auto"
          >
            초기화
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-4 py-5">
        <div className="flex gap-5">
          {/* ── 왼쪽 패널 ── */}
          <div className="w-72 flex-shrink-0 flex flex-col gap-3 sticky top-[60px] self-start max-h-[calc(100vh-80px)] overflow-y-auto">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <h2 className="font-bold text-gray-900">밈 기본 정보</h2>
                <Field label="밈 이름 *">
                  <Inp
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                    placeholder="예: 그정도 판단 능력은 있습니다."
                    onKeyDown={e => e.key === 'Enter' && topic.trim() && setStep(2)}
                  />
                </Field>
                <Field label="Vol 번호">
                  <Inp type="number" value={volNum} onChange={e => setVolNum(e.target.value)} placeholder="예: 3" />
                </Field>
                <Field label="날짜">
                  <Inp value={date} onChange={e => setDate(e.target.value)} placeholder="예: 25.04.01" />
                </Field>
                <Field label="추가 컨텍스트 (출처, 방향성 등)">
                  <textarea
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none bg-white"
                    rows={3}
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="예: 트위터에서 시작된 밈, CS 대화 스크린샷"
                  />
                </Field>
                <Field label="커버 배경">
                  <div className="flex gap-2">
                    {[
                      { val: 'color', icon: '🎨', label: '컬러 배경' },
                      { val: 'photo', icon: '🖼️', label: '배경사진' },
                    ].map(({ val, icon, label }) => (
                      <button
                        key={val}
                        onClick={() => setCoverType(val)}
                        className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-all"
                        style={coverType === val
                          ? { borderColor: primary, backgroundColor: `${primary}15`, color: primary }
                          : { borderColor: '#E5E7EB', color: '#9CA3AF' }}
                      >
                        <span className="text-base">{icon}</span>
                        {label}
                      </button>
                    ))}
                  </div>
                  {coverType === 'photo' && (
                    <div className="mt-2">
                      <ImageUploader
                        value={images.cover || null}
                        onChange={(v) => setImage('cover', v)}
                        primaryColor={primary}
                      />
                    </div>
                  )}
                </Field>
                {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                <button
                  onClick={() => setStep(2)}
                  disabled={!topic.trim()}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={!topic.trim()
                    ? { backgroundColor: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' }
                    : { backgroundColor: primary, color: 'white' }}
                >
                  다음: 스타일 설정 →
                </button>
              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <h2 className="font-bold text-gray-900">스타일 설정</h2>
                <div className="overflow-y-auto" style={{ maxHeight: '60vh' }}>
                  <StylePicker style={style} onChange={setStyle} />
                </div>
                {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                <button
                  onClick={handleGenerate}
                  disabled={aiLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
                  style={{ backgroundColor: aiLoading ? '#9CA3AF' : primary }}
                >
                  {aiLoading ? `✨ AI 생성 중... ${elapsedSec}s / ~${ESTIMATED_SEC}s` : '✨ AI 카피 3가지 생성'}
                </button>
                {aiLoading && (
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(95, (elapsedSec / ESTIMATED_SEC) * 100)}%`,
                        backgroundColor: primary,
                      }}
                    />
                  </div>
                )}
                <button onClick={skipToManual} className="text-xs text-gray-400 hover:text-gray-600 text-center">AI 없이 직접 작성하기 →</button>
                <button onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-600 text-center">← 주제 수정</button>
              </div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">카피 선택</h2>
                  <button
                    onClick={handleGenerate}
                    disabled={aiLoading}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{ color: primary, backgroundColor: `${primary}15` }}
                  >
                    {aiLoading ? `${elapsedSec}s...` : '↺ 재생성'}
                  </button>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: '57vh' }}>
                  <CopyVariations
                    variations={variations}
                    selectedIndex={selectedVar}
                    onSelect={(idx) => applyVariation(variations, idx)}
                    themeKey={style.themeKey}
                  />
                </div>
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: primary }}
                >
                  선택 완료 → 텍스트 편집
                </button>
                <button onClick={() => setStep(2)} className="text-xs text-gray-400 hover:text-gray-600 text-center">← 스타일 수정</button>
              </div>
            )}

            {/* STEP 4 */}
            {step === 4 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-3">
                {/* 탭: 텍스트 / 이미지 */}
                <div className="flex gap-1 p-1 bg-gray-50 rounded-xl">
                  {['text', 'images'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={activeTab === tab
                        ? { backgroundColor: 'white', color: primary, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }
                        : { color: '#9CA3AF' }}
                    >
                      {tab === 'text' ? '텍스트 편집' : '이미지'}
                    </button>
                  ))}
                </div>

                {activeTab === 'text' ? (
                  <>
                    {/* 카드 탭 선택 + 추가/삭제 */}
                    <div className="flex flex-wrap gap-1 items-center">
                      {cardNums.map(n => (
                        <div key={n} className="relative group">
                          <button
                            onClick={() => setActiveCard(n)}
                            className="px-2 py-1 rounded-lg text-xs font-medium transition-all"
                            style={activeCard === n
                              ? { backgroundColor: primary, color: 'white' }
                              : { backgroundColor: '#F3F4F6', color: '#6B7280' }}
                          >
                            {n}. {getLabel(n)}
                          </button>
                          {/* 삭제 버튼 (7번 이상만) */}
                          {n > 6 && (
                            <button
                              onClick={() => removeCard(n)}
                              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-400 text-white text-[9px] items-center justify-center hidden group-hover:flex"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      {/* 카드 추가 버튼 */}
                      {cardCount < 12 && (
                        <button
                          onClick={addCard}
                          className="px-2 py-1 rounded-lg text-xs font-medium border border-dashed transition-all"
                          style={{ borderColor: primary, color: primary }}
                        >
                          + 추가
                        </button>
                      )}
                    </div>
                    <div className="overflow-y-auto pr-0.5" style={{ maxHeight: '48vh' }}>
                      <CardEditor
                        n={activeCard}
                        params={params}
                        onUpdate={setCardParam}
                        coverImage={activeCard === 2 ? images.origin : images.cover}
                        onCoverImageChange={(v) => setImage(activeCard === 2 ? 'origin' : 'cover', v)}
                        primaryColor={primary}
                      />
                    </div>
                  </>
                ) : (
                  <div className="overflow-y-auto" style={{ maxHeight: '55vh' }}>
                    <ImagesPanel />
                  </div>
                )}

                <button
                  onClick={() => setStep(5)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: primary }}
                >
                  다운로드 →
                </button>
                <button onClick={() => setStep(3)} className="text-xs text-gray-400 hover:text-gray-600 text-center">← 카피 변경</button>
              </div>
            )}

            {/* STEP 5 */}
            {step === 5 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <h2 className="font-bold text-gray-900">다운로드</h2>
                <div className="flex gap-2 p-1 bg-gray-50 rounded-xl">
                  {['svg', 'png'].map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => setExportFormat(fmt)}
                      className="flex-1 py-2 rounded-lg text-sm font-bold uppercase transition-all"
                      style={exportFormat === fmt
                        ? { backgroundColor: primary, color: 'white' }
                        : { color: '#9CA3AF' }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
                {exportFormat === 'png' && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 p-2 rounded-lg">
                    💡 PNG는 커스텀 폰트가 시스템 폰트로 대체될 수 있습니다. 고품질은 SVG → Figma 권장.
                  </p>
                )}
                <button
                  onClick={handleDownloadAll}
                  disabled={exportLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: exportLoading ? '#9CA3AF' : primary }}
                >
                  {exportLoading ? '변환 중...' : `📦 ${exportFormat.toUpperCase()} ${cardCount}장 ZIP`}
                </button>
                <div className="flex flex-col gap-1.5">
                  {cardNums.map(n => (
                    <button
                      key={n}
                      onClick={() => handleDownloadOne(n)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-200 text-sm"
                    >
                      <span className="text-gray-700">{n}. {getLabel(n)}</span>
                      <span className="text-xs font-medium" style={{ color: primary }}>↓ {exportFormat.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
                {exportFormat === 'svg' && (
                  <p className="text-xs text-gray-400 text-center">Figma에 SVG 드래그앤드롭 → PNG 내보내기</p>
                )}
                <button onClick={() => setStep(4)} className="text-xs text-gray-400 hover:text-gray-600 text-center">← 텍스트 수정</button>
              </div>
            )}
          </div>

          {/* ── 오른쪽: 전체 미리보기 패널 ── */}
          <div className="flex-1 min-w-0 bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">
                실시간 미리보기
                <span className="ml-2 text-xs text-gray-400 font-normal">{cardCount}장</span>
              </h2>
              <span className="text-xs text-gray-400">1080 × 1350 px</span>
            </div>
            {params ? (
              <div className="flex flex-wrap gap-3 justify-start">
                {cardNums.map(n => (
                  <div
                    key={n}
                    onClick={() => { setActiveCard(n); if (step < 4) setStep(4); setActiveTab('text'); }}
                    className="cursor-pointer rounded-xl transition-all"
                    style={activeCard === n && step === 4
                      ? { outline: `2px solid ${primary}`, outlineOffset: 3 }
                      : {}}
                  >
                    <CardPreview
                      svgString={svgs[n] || ''}
                      cardNum={n}
                      label={`${n}. ${getLabel(n)}`}
                      scale={PREVIEW_SCALE}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 text-center">
                <p className="text-gray-400 text-sm">주제를 입력하고 AI 카피를 생성하면<br/>여기에 미리보기가 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
