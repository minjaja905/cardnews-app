import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generateGeneralVariations, researchTopics } from '../lib/claudeApi';
import { generateGeneralCard, makeDefaultGeneralParams, GENERAL_CARD_LABELS } from '../lib/generalSvgGenerator';
import { applyStyle, COLOR_THEMES } from '../data/styles';
import { downloadOne, downloadZip } from '../lib/export';
import CardPreview from '../components/CardPreview';
import TextListEditor from '../components/TextListEditor';
import HeroLineEditor from '../components/HeroLineEditor';
import StylePicker from '../components/StylePicker';
import CopyVariations from '../components/CopyVariations';

const CARD_NUMS = [1, 2, 3, 4, 5, 6];

const STEPS = [
  { n: 1, label: '주제' },
  { n: 2, label: '스타일' },
  { n: 3, label: '카피 선택' },
  { n: 4, label: '편집' },
  { n: 5, label: '다운로드' },
];

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-gray-500">{label}</label>
      {children}
    </div>
  );
}

function Input({ ...props }) {
  return (
    <input
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none w-full"
      {...props}
    />
  );
}

// ── 배경 이미지 업로더 ────────────────────────────────────────────────────────
function BgImageUploader({ value, onChange }) {
  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <>
          <img
            src={value}
            alt="bg"
            className="w-14 h-[70px] object-cover rounded-lg border border-gray-200 flex-shrink-0"
          />
          <div className="flex flex-col gap-1.5 flex-1">
            <label className="flex items-center justify-center gap-1.5 py-1.5 border border-gray-200 rounded-lg text-xs text-gray-500 cursor-pointer hover:border-gray-400 transition-all">
              이미지 교체
              <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </label>
            <button
              onClick={() => onChange(null)}
              className="py-1.5 border border-red-100 rounded-lg text-xs text-red-400 hover:bg-red-50 transition-all"
            >
              삭제
            </button>
          </div>
        </>
      ) : (
        <label className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 cursor-pointer hover:border-[#3ECFB2] hover:text-[#3ECFB2] transition-all">
          <span className="text-base">🖼</span> 배경 이미지 업로드
          <input type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </label>
      )}
    </div>
  );
}

// ── 카드별 편집 (GeneralWizard 외부 — 내부 정의 시 매 렌더마다 언마운트됨) ────
function CardEditor({ n, p, onSet }) {
  if (n === 1) return (
    <div className="flex flex-col gap-4">
      <Field label="배경 이미지">
        <BgImageUploader value={p.bgImage || null} onChange={v => onSet('bgImage', v)} />
      </Field>
      <Field label="카테고리 라벨">
        <Input value={p.category || ''} onChange={e => onSet('category', e.target.value)} placeholder="마케팅팁 · 트렌드 · 라이프" />
      </Field>
      <Field label="히어로 텍스트">
        <HeroLineEditor lines={p.heroLines || []} onChange={v => onSet('heroLines', v)} />
      </Field>
      <Field label="훅 한 줄 (20자 이내)">
        <Input value={p.hook || ''} onChange={e => onSet('hook', e.target.value)} placeholder="스크롤 멈추고 저장하세요" />
      </Field>
    </div>
  );

  if (n === 2) return (
    <div className="flex flex-col gap-4">
      <Field label="배경 이미지">
        <BgImageUploader value={p.bgImage || null} onChange={v => onSet('bgImage', v)} />
      </Field>
      <Field label="히어로 텍스트">
        <HeroLineEditor lines={p.heroLines || []} onChange={v => onSet('heroLines', v)} />
      </Field>
      <Field label="도입 본문 (2-3줄)">
        <textarea
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
          rows={3}
          value={p.body || ''}
          onChange={e => onSet('body', e.target.value)}
          placeholder="공감/도입 설명"
        />
      </Field>
      <Field label="핵심 한 줄 강조">
        <Input value={p.highlight || ''} onChange={e => onSet('highlight', e.target.value)} placeholder="핵심 한 줄" />
      </Field>
    </div>
  );

  if (n === 3 || n === 4) return (
    <div className="flex flex-col gap-4">
      <Field label="배경 이미지">
        <BgImageUploader value={p.bgImage || null} onChange={v => onSet('bgImage', v)} />
      </Field>
      <Field label={`섹션 번호 (예: 0${n - 2})`}>
        <Input value={p.sectionNum || ''} onChange={e => onSet('sectionNum', e.target.value)} placeholder={`0${n - 2}`} />
      </Field>
      <Field label="소제목">
        <Input value={p.sectionTitle || ''} onChange={e => onSet('sectionTitle', e.target.value)} placeholder="소제목" />
      </Field>
      <Field label="히어로 텍스트">
        <HeroLineEditor lines={p.heroLines || []} onChange={v => onSet('heroLines', v)} />
      </Field>
      <Field label="포인트 (3개, 이모지 포함)">
        <TextListEditor lines={p.points || []} onChange={v => onSet('points', v)} placeholder="📌 포인트" maxLines={4} />
      </Field>
    </div>
  );

  if (n === 5) return (
    <div className="flex flex-col gap-4">
      <Field label="배경 이미지">
        <BgImageUploader value={p.bgImage || null} onChange={v => onSet('bgImage', v)} />
      </Field>
      <Field label="히어로 텍스트">
        <HeroLineEditor lines={p.heroLines || []} onChange={v => onSet('heroLines', v)} />
      </Field>
      <Field label="핵심 요약 3개">
        <TextListEditor lines={p.summaries || []} onChange={v => onSet('summaries', v)} placeholder="요약" maxLines={4} />
      </Field>
      <Field label="마지막 인사이트 한 줄">
        <Input value={p.closingLine || ''} onChange={e => onSet('closingLine', e.target.value)} placeholder="마지막 인사이트" />
      </Field>
    </div>
  );

  if (n === 6) return (
    <div className="flex flex-col gap-4">
      <Field label="배경 이미지">
        <BgImageUploader value={p.bgImage || null} onChange={v => onSet('bgImage', v)} />
      </Field>
      <Field label="히어로 텍스트">
        <Input value={p.heroText || ''} onChange={e => onSet('heroText', e.target.value)} placeholder="기억하세요" />
      </Field>
      <Field label="핵심 메시지">
        <Input value={p.keyMessage || ''} onChange={e => onSet('keyMessage', e.target.value)} placeholder="가장 중요한 메시지" />
      </Field>
      <Field label="CTA (2줄)">
        <TextListEditor lines={p.ctaLines || []} onChange={v => onSet('ctaLines', v)} placeholder="CTA" maxLines={2} />
      </Field>
    </div>
  );

  return null;
}

export default function GeneralWizard() {
  const store = useAppStore();
  const { step, setStep, topic, setTopic, details, setDetails,
    style, setStyle, variations, setVariations, selectedVar, setSelectedVar,
    params, setParams, updateParam, aiLoading, setAiLoading,
    aiError, setAiError, setPage } = store;

  const [activeCard, setActiveCard] = useState(1);
  const [exportFormat, setExportFormat] = useState('svg');
  const [exportLoading, setExportLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('text'); // 'text' | 'images'
  const [elapsedSec, setElapsedSec] = useState(0);
  const ESTIMATED_SEC = 25;

  // 주제 리서치 상태
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchElapsed, setResearchElapsed] = useState(0);
  const [researchResults, setResearchResults] = useState(null);
  const [researchError, setResearchError] = useState('');
  const RESEARCH_ESTIMATED_SEC = 35;

  const primary = COLOR_THEMES[style.themeKey]?.primary || '#3ECFB2';

  // ── AI 타이머 ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aiLoading) { setElapsedSec(0); return; }
    const t = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [aiLoading]);

  // ── 리서치 타이머 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!researchLoading) { setResearchElapsed(0); return; }
    const t = setInterval(() => setResearchElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [researchLoading]);

  // ── SVG 빌드 ─────────────────────────────────────────────────────────────────
  const [svgs, setSvgs] = useState({});

  const rebuildSvgs = useCallback(() => {
    if (!params) return;
    const built = {};
    for (const n of CARD_NUMS) {
      const cardParams = { topic, ...params[`card${n}`] };
      const raw = generateGeneralCard(n, cardParams);
      built[n] = applyStyle(raw, style);
    }
    setSvgs(built);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, topic, style]);

  useEffect(() => { rebuildSvgs(); }, [rebuildSvgs]);

  // ── AI 생성 ──────────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!topic.trim()) { setAiError('주제를 입력해주세요'); return; }
    setAiError('');
    setAiLoading(true);
    try {
      const vars = await generateGeneralVariations({ topic, details });
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
    const defaults = makeDefaultGeneralParams(topic);
    const merged = {
      card1: { ...defaults.card1, ...v.card1 },
      card2: { ...defaults.card2, ...v.card2 },
      card3: { ...defaults.card3, ...v.card3 },
      card4: { ...defaults.card4, ...v.card4 },
      card5: { ...defaults.card5, ...v.card5 },
      card6: { ...defaults.card6, ...v.card6 },
    };
    setParams(merged);
    setSelectedVar(idx);
  }

  function handleSelectVariation(idx) {
    applyVariation(variations, idx);
  }

  // ── 주제 리서치 ───────────────────────────────────────────────────────────────
  async function handleResearch() {
    setResearchError('');
    setResearchLoading(true);
    setResearchResults(null);
    try {
      const result = await researchTopics();
      setResearchResults(result);
    } catch (e) {
      setResearchError(e.message);
    } finally {
      setResearchLoading(false);
    }
  }

  function applyResearchTopic(topic_obj) {
    setTopic(topic_obj.title);
    setDetails(topic_obj.details + '\n\n[카테고리: ' + topic_obj.category + ']\n[지금 뜨는 이유: ' + topic_obj.why_now + ']');
  }

  function skipToManual() {
    setParams(makeDefaultGeneralParams(topic));
    setStep(4);
  }

  // ── 다운로드 ──────────────────────────────────────────────────────────────────
  async function handleDownloadAll() {
    setExportLoading(true);
    try {
      const slug = `카드뉴스_${(topic || 'general').replace(/\s+/g, '_')}`;
      await downloadZip({
        svgs: CARD_NUMS.map(n => svgs[n] || ''),
        labels: GENERAL_CARD_LABELS,
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
    const label = GENERAL_CARD_LABELS[n - 1];
    try {
      await downloadOne({ svgString: svgs[n] || '', filename: `${n}_${label}.svg`, format: exportFormat });
    } catch (e) {
      alert('다운로드 실패: ' + e.message);
    }
  }

  const PREVIEW_SCALE = 0.22;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0" style={{ width: 180 }}>
            <button
              onClick={() => setPage('home')}
              className="text-sm text-gray-400 hover:text-gray-600 whitespace-nowrap flex-shrink-0"
            >
              ← 홈
            </button>
            <span className="text-gray-200 flex-shrink-0">|</span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-bold text-gray-900 whitespace-nowrap">일반 카드뉴스</span>
              {topic && <span className="text-xs text-gray-400 truncate">— {topic}</span>}
            </div>
          </div>

          {/* 스텝 네비게이션 */}
          <div className="flex items-center gap-1 flex-shrink-0 mx-auto">
            {STEPS.map((s) => {
              const active = step === s.n;
              const done = step > s.n;
              return (
                <button
                  key={s.n}
                  onClick={() => done && setStep(s.n)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs transition-all ${
                    active ? 'text-white font-semibold' :
                    done ? 'cursor-pointer' : 'text-gray-300 cursor-default'
                  }`}
                  style={active ? { backgroundColor: primary } : done ? { color: primary } : {}}
                >
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={active ? { backgroundColor: 'white', color: primary } :
                      done ? { backgroundColor: primary, color: 'white' } :
                      { backgroundColor: '#e5e7eb', color: '#9ca3af' }}
                  >
                    {done ? '✓' : s.n}
                  </span>
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => { if (confirm('작업 내용이 초기화됩니다. 계속할까요?')) store.reset(); }}
            className="text-xs text-gray-300 hover:text-gray-500 flex-shrink-0 ml-auto"
          >
            초기화
          </button>
        </div>
      </header>

      <main className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="flex gap-6">
          {/* ── 왼쪽 패널 ── */}
          <div className="w-80 flex-shrink-0 flex flex-col gap-4">

            {/* STEP 1 */}
            {step === 1 && (
              <div className="flex flex-col gap-4">

                {/* AI 리서치 섹션 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">AI 주제 리서치</h2>
                    {researchResults && (
                      <span className="text-xs text-gray-400">{researchResults.trends_summary}</span>
                    )}
                  </div>

                  {!researchResults && !researchLoading && (
                    <p className="text-xs text-gray-400 leading-relaxed">
                      오늘의 트렌드를 검색해서 저장율 높은 카드뉴스 주제 3개를 추천해드립니다.
                    </p>
                  )}

                  {researchError && <p className="text-xs text-red-500">{researchError}</p>}

                  {!researchLoading && (
                    <button
                      onClick={handleResearch}
                      className="w-full py-2.5 rounded-xl font-bold text-sm transition-all text-white"
                      style={{ backgroundColor: primary }}
                    >
                      🔍 {researchResults ? '다시 리서치' : '오늘의 주제 AI 리서치'}
                    </button>
                  )}

                  {researchLoading && (
                    <>
                      <div className="text-center py-2">
                        <p className="text-sm font-medium text-gray-600">
                          🔍 트렌드 검색 중... {researchElapsed}s / ~{RESEARCH_ESTIMATED_SEC}s
                        </p>
                        <p className="text-xs text-gray-400 mt-1">웹 검색으로 오늘의 핫이슈를 분석하고 있어요</p>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-1.5 rounded-full transition-all duration-1000"
                          style={{
                            width: `${Math.min(90, (researchElapsed / RESEARCH_ESTIMATED_SEC) * 100)}%`,
                            backgroundColor: primary,
                          }}
                        />
                      </div>
                    </>
                  )}

                  {/* 리서치 결과 카드 3개 */}
                  {researchResults && (
                    <div className="flex flex-col gap-3">
                      {researchResults.topics.map((t, i) => {
                        const isTop = i === researchResults.top_pick_index;
                        return (
                          <div
                            key={i}
                            className="rounded-xl border p-4 flex flex-col gap-2 transition-all"
                            style={isTop
                              ? { borderColor: primary, backgroundColor: `${primary}08` }
                              : { borderColor: '#e5e7eb' }}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col gap-1 min-w-0">
                                {isTop && (
                                  <span
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-full w-fit"
                                    style={{ backgroundColor: primary, color: 'white' }}
                                  >
                                    ★ TOP PICK
                                  </span>
                                )}
                                <p className="text-sm font-bold text-gray-900 leading-tight">{t.title}</p>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">{t.category}</span>
                                  <span className="text-[11px] text-gray-400">저장율 <span className="font-bold" style={{ color: primary }}>{t.save_rate}</span></span>
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{t.why_now}</p>
                            <button
                              onClick={() => applyResearchTopic(t)}
                              className="w-full py-1.5 rounded-lg text-xs font-bold transition-all mt-1"
                              style={topic === t.title
                                ? { backgroundColor: primary, color: 'white' }
                                : { backgroundColor: `${primary}15`, color: primary }}
                            >
                              {topic === t.title ? '✓ 선택됨' : '이 주제로 선택'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 직접 입력 섹션 */}
                <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                  <h2 className="font-bold text-gray-900">직접 입력</h2>
                  <Field label="주제 *">
                    <Input
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="예: 인스타 알고리즘 완전 정복"
                      onKeyDown={e => e.key === 'Enter' && topic.trim() && setStep(2)}
                    />
                  </Field>
                  <Field label="상세 내용 · 방향성">
                    <textarea
                      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                      rows={5}
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      placeholder={`어떤 내용을 담고 싶은지 적어주세요.\n\n예:\n- 릴스 우선 노출 알고리즘\n- 저장/공유 지표 중요성\n- 최적 포스팅 시간`}
                    />
                  </Field>
                  {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                  <button
                    onClick={() => setStep(2)}
                    disabled={!topic.trim()}
                    className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                    style={!topic.trim()
                      ? { backgroundColor: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }
                      : { backgroundColor: primary, color: 'white' }}
                  >
                    다음: 스타일 설정 →
                  </button>
                </div>

              </div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-5">
                <h2 className="font-bold text-gray-900">스타일 설정</h2>
                <StylePicker style={style} onChange={setStyle} />
                {aiError && <p className="text-xs text-red-500">{aiError}</p>}
                <button
                  onClick={handleGenerate}
                  disabled={aiLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all text-white"
                  style={{ backgroundColor: aiLoading ? '#9ca3af' : primary }}
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
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">카피 선택</h2>
                  <button
                    onClick={handleGenerate}
                    disabled={aiLoading}
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{ color: primary, backgroundColor: `${primary}15` }}
                  >
                    {aiLoading ? `${elapsedSec}s...` : '↺ 재생성'}
                  </button>
                </div>
                <div className="overflow-y-auto pr-1" style={{ maxHeight: '55vh' }}>
                  <CopyVariations
                    variations={variations}
                    selectedIndex={selectedVar}
                    onSelect={handleSelectVariation}
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
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">텍스트 편집</h2>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ color: primary, backgroundColor: `${primary}15` }}>
                    카드 {activeCard}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {CARD_NUMS.map(n => (
                    <button
                      key={n}
                      onClick={() => setActiveCard(n)}
                      className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                      style={activeCard === n
                        ? { backgroundColor: primary, color: 'white' }
                        : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
                    >
                      {n}. {GENERAL_CARD_LABELS[n - 1]}
                    </button>
                  ))}
                </div>
                <div className="overflow-y-auto pr-1" style={{ maxHeight: '50vh' }}>
                  <CardEditor
                    n={activeCard}
                    p={params?.[`card${activeCard}`] || {}}
                    onSet={(field, val) => updateParam(`card${activeCard}`, field, val)}
                  />
                </div>
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
                        : { color: '#9ca3af' }}
                    >
                      {fmt}
                    </button>
                  ))}
                </div>
                {exportFormat === 'png' && (
                  <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 p-2 rounded-lg">
                    💡 PNG는 브라우저 렌더링 방식으로 커스텀 폰트가 시스템 폰트로 대체될 수 있습니다.
                  </p>
                )}
                <button
                  onClick={handleDownloadAll}
                  disabled={exportLoading}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: exportLoading ? '#9ca3af' : primary }}
                >
                  {exportLoading ? '변환 중...' : `📦 ${exportFormat.toUpperCase()} 6장 ZIP`}
                </button>
                <div className="flex flex-col gap-1.5">
                  {CARD_NUMS.map(n => (
                    <button
                      key={n}
                      onClick={() => handleDownloadOne(n)}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-100 hover:border-gray-200 text-sm"
                    >
                      <span className="text-gray-700">{n}. {GENERAL_CARD_LABELS[n - 1]}</span>
                      <span className="text-xs font-medium" style={{ color: primary }}>↓ {exportFormat.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep(4)} className="text-xs text-gray-400 hover:text-gray-600 text-center">← 텍스트 수정</button>
              </div>
            )}
          </div>

          {/* ── 미리보기 ── */}
          <div className="flex-1 bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">실시간 미리보기</h2>
              <span className="text-xs text-gray-400">1080 × 1350 px</span>
            </div>
            {params ? (
              <div className="flex flex-wrap gap-4 justify-center">
                {CARD_NUMS.map(n => (
                  <div
                    key={n}
                    onClick={() => { setActiveCard(n); if (step < 4) setStep(4); }}
                    className="cursor-pointer rounded-xl transition-all"
                    style={activeCard === n && step === 4
                      ? { outline: `2px solid ${primary}`, outlineOffset: 4 }
                      : {}}
                  >
                    <CardPreview svgString={svgs[n] || ''} cardNum={n} scale={PREVIEW_SCALE} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-gray-400 text-sm">주제를 입력하고 AI 카피를 생성하면<br/>여기에 미리보기가 표시됩니다.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
