import { useState, useEffect, useCallback } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generatePortfolioVariations, parsePortfolioText, generatePortfolioFeed } from '../lib/claudeApi';
import { generatePortfolioCard, makeDefaultPortfolioParams, PORTFOLIO_CARD_LABELS, setPortfolioFontStyle } from '../lib/portfolioSvgGenerator';
import { applyStyle, COLOR_THEMES } from '../data/styles';
import { downloadOne, downloadZip } from '../lib/export';
import CardPreview from '../components/CardPreview';
import StylePicker from '../components/StylePicker';
import ImageUploader from '../components/ImageUploader';

const CARD_NUMS = [1, 2, 3, 4, 5, 6];

const STEPS = [
  { n: 1, label: '프로젝트' },
  { n: 2, label: '스타일' },
  { n: 3, label: '카피 선택' },
  { n: 4, label: '편집' },
  { n: 5, label: '다운로드' },
  { n: 6, label: '피드 글' },
];

const PARTS = ['업무 생산성', '생활 생산성'];

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline gap-2">
        <label className="text-sm font-medium text-gray-500">{label}</label>
        {hint && <span className="text-xs text-gray-300">{hint}</span>}
      </div>
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

function Textarea({ rows = 3, ...props }) {
  return (
    <textarea
      className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none w-full"
      rows={rows}
      {...props}
    />
  );
}

// ── 도구 태그 입력 ────────────────────────────────────────────────────────────
function ToolTagInput({ tags, onChange }) {
  const [input, setInput] = useState('');

  function addTag(raw) {
    const t = raw.trim();
    if (!t || tags.includes(t)) return;
    onChange([...tags, t]);
    setInput('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && !input && tags.length) {
      onChange(tags.slice(0, -1));
    }
  }

  function removeTag(i) {
    onChange(tags.filter((_, idx) => idx !== i));
  }

  return (
    <div className="border border-gray-200 rounded-lg px-3 py-2 flex flex-wrap gap-1.5 min-h-[40px] cursor-text"
      onClick={() => document.getElementById('tool-tag-input')?.focus()}>
      {tags.map((t, i) => (
        <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: '#3ECFB210', color: '#3ECFB2', border: '1px solid #3ECFB240' }}>
          {t}
          <button onClick={() => removeTag(i)} className="text-[10px] opacity-60 hover:opacity-100">✕</button>
        </span>
      ))}
      <input
        id="tool-tag-input"
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => input.trim() && addTag(input)}
        placeholder={tags.length === 0 ? 'Gemini, Vercel, Apps Script...' : ''}
        className="flex-1 text-sm focus:outline-none min-w-[100px] bg-transparent"
      />
    </div>
  );
}

// ── 카피 variation 미리보기 ───────────────────────────────────────────────────
function PortfolioCopyVariations({ variations, selectedIndex, onSelect, themeKey }) {
  const primary = COLOR_THEMES[themeKey]?.primary || '#3ECFB2';
  if (!variations || variations.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {variations.map((v, i) => {
        const selected = i === selectedIndex;
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className="w-full text-left rounded-xl border p-4 transition-all"
            style={selected
              ? { borderColor: primary, backgroundColor: `${primary}08` }
              : { borderColor: '#e5e7eb' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold" style={{ color: selected ? primary : '#9ca3af' }}>
                {v.label || `스타일 ${i + 1}`}
              </span>
              {selected && (
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-bold"
                  style={{ backgroundColor: primary }}>선택됨</span>
              )}
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              {v.card1?.tagline || v.card1?.projectLines?.[1]?.text || ''}
            </p>
            {v.card2?.points?.[0] && (
              <p className="text-xs text-gray-400 mt-1">{v.card2.points[0]}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── 헤드라인 편집 (컴포넌트를 외부에 선언해야 리렌더 시 remount 방지) ─────────
function HeroLineInputs({ lines, fieldName, onSet }) {
  return (
    <Field label="헤드라인 (줄1 / 줄2)">
      <div className="flex flex-col gap-2">
        {[0, 1].map(idx => (
          <Input
            key={idx}
            value={lines[idx]?.text || ''}
            onChange={e => {
              const next = [...lines];
              if (!next[idx]) next[idx] = { text: '', color: idx === 0 ? 'white' : '#3ECFB2' };
              next[idx] = { ...next[idx], text: e.target.value };
              onSet(fieldName, next);
            }}
            placeholder={idx === 0 ? '줄1 (흰색)' : '줄2 (포인트 컬러)'}
          />
        ))}
      </div>
    </Field>
  );
}

// ── 카드별 편집 ───────────────────────────────────────────────────────────────
function PortfolioCardEditor({ n, p, tools, onSet }) {
  const heroLines = p.heroLines || p.projectLines || [];
  const heroFieldName = n === 1 ? 'projectLines' : 'heroLines';

  if (n === 1) return (
    <div className="flex flex-col gap-4">
      <HeroLineInputs lines={heroLines} fieldName={heroFieldName} onSet={onSet} />
      <Field label="태그라인" hint="20자 이내">
        <Input value={p.tagline || ''} onChange={e => onSet('tagline', e.target.value)} placeholder="반복 업무를 시스템으로" />
      </Field>
      <ImageUploader
        label="커버 배경 이미지 (선택)"
        value={p.image || null}
        onChange={v => onSet('image', v)}
        primaryColor="#3ECFB2"
      />
      {p.image && (
        <>
          <Field label={`이미지 크기 (${Math.round((p.imageScale || 1) * 100)}%)`}>
            <input type="range" min="0.5" max="2" step="0.05"
              value={p.imageScale || 1}
              onChange={e => onSet('imageScale', parseFloat(e.target.value))}
              className="w-full accent-[#3ECFB2]" />
          </Field>
          <Field label={`상하 위치 (${p.imageOffsetY || 0}px)`}>
            <input type="range" min="-400" max="400" step="10"
              value={p.imageOffsetY || 0}
              onChange={e => onSet('imageOffsetY', parseInt(e.target.value))}
              className="w-full accent-[#3ECFB2]" />
          </Field>
        </>
      )}
    </div>
  );

  if (n === 2) return (
    <div className="flex flex-col gap-4">
      <HeroLineInputs lines={heroLines} fieldName={heroFieldName} onSet={onSet} />
      <Field label="문제 설명">
        <Textarea rows={3} value={p.body || ''} onChange={e => onSet('body', e.target.value)} placeholder="어떤 불편함이 있었나요?" />
      </Field>
      <Field label="불편함 포인트 3개">
        {[0, 1, 2].map(i => (
          <Input key={i} value={(p.points || [])[i] || ''} onChange={e => {
            const next = [...(p.points || ['', '', ''])];
            next[i] = e.target.value;
            onSet('points', next);
          }} placeholder={`포인트 ${i + 1} (이모지 포함 권장)`} />
        ))}
      </Field>
      <ImageUploader
        label="참고 이미지 (선택)"
        value={p.image || null}
        onChange={v => onSet('image', v)}
        primaryColor="#3ECFB2"
      />
    </div>
  );

  if (n === 3) return (
    <div className="flex flex-col gap-4">
      <HeroLineInputs lines={heroLines} fieldName={heroFieldName} onSet={onSet} />
      <Field label="해결 설명">
        <Textarea rows={3} value={p.body || ''} onChange={e => onSet('body', e.target.value)} placeholder="어떻게 해결했나요?" />
      </Field>
      <Field label="핵심 흐름 한 줄">
        <Input value={p.toolHighlight || ''} onChange={e => onSet('toolHighlight', e.target.value)} placeholder="이메일 → AI파싱 → 자동전달" />
      </Field>
      <ImageUploader
        label="참고 이미지 (선택)"
        value={p.image || null}
        onChange={v => onSet('image', v)}
        primaryColor="#3ECFB2"
      />
    </div>
  );

  if (n === 4) return (
    <div className="flex flex-col gap-4">
      <HeroLineInputs lines={heroLines} fieldName={heroFieldName} onSet={onSet} />
      <Field label="임팩트 3개" hint="수치 포함 권장">
        {[0, 1, 2].map(i => (
          <Input key={i} value={(p.impacts || [])[i] || ''} onChange={e => {
            const next = [...(p.impacts || ['', '', ''])];
            next[i] = e.target.value;
            onSet('impacts', next);
          }} placeholder={`⚡ 임팩트 ${i + 1}`} />
        ))}
      </Field>
      <ImageUploader
        label="참고 이미지 (선택)"
        value={p.image || null}
        onChange={v => onSet('image', v)}
        primaryColor="#3ECFB2"
      />
    </div>
  );

  if (n === 5) return (
    <div className="flex flex-col gap-4">
      <Field label="섹션 제목">
        <Input value={p.stackTitle || '사용한 도구들'} onChange={e => onSet('stackTitle', e.target.value)} />
      </Field>
      <Field label="캡션">
        <Input value={p.stackCaption || ''} onChange={e => onSet('stackCaption', e.target.value)} placeholder="AI와 함께 기획부터 배포까지 직접" />
      </Field>
      <Field label="도구 목록" hint="(Step 1에서 공유됨)">
        <div className="flex flex-wrap gap-1.5">
          {tools.map((t, i) => (
            <span key={i} className="text-xs px-2 py-0.5 rounded-full"
              style={{ backgroundColor: '#3ECFB210', color: '#3ECFB2', border: '1px solid #3ECFB240' }}>
              {t}
            </span>
          ))}
        </div>
      </Field>
    </div>
  );

  if (n === 6) return (
    <div className="flex flex-col gap-4">
      <HeroLineInputs lines={heroLines} fieldName={heroFieldName} onSet={onSet} />
      <Field label="시리즈 정보">
        <Input value={p.seriesInfo || ''} onChange={e => onSet('seriesInfo', e.target.value)} placeholder="시스템화 시리즈 · 업무 생산성" />
      </Field>
      <Field label="CTA">
        <Input value={p.ctaLine || ''} onChange={e => onSet('ctaLine', e.target.value)} placeholder="다음 시스템화 사례도 구경하세요 →" />
      </Field>
      <ImageUploader
        label="아웃트로 배경 이미지 (선택)"
        value={p.image || null}
        onChange={v => onSet('image', v)}
        primaryColor="#3ECFB2"
      />
      {p.image && (
        <>
          <Field label={`이미지 크기 (${Math.round((p.imageScale || 1) * 100)}%)`}>
            <input type="range" min="0.5" max="2" step="0.05"
              value={p.imageScale || 1}
              onChange={e => onSet('imageScale', parseFloat(e.target.value))}
              className="w-full accent-[#3ECFB2]" />
          </Field>
          <Field label={`상하 위치 (${p.imageOffsetY || 0}px)`}>
            <input type="range" min="-400" max="400" step="10"
              value={p.imageOffsetY || 0}
              onChange={e => onSet('imageOffsetY', parseInt(e.target.value))}
              className="w-full accent-[#3ECFB2]" />
          </Field>
        </>
      )}
    </div>
  );

  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN WIZARD
// ─────────────────────────────────────────────────────────────────────────────
export default function PortfolioWizard() {
  const store = useAppStore();
  const { step, setStep, style, setStyle, variations, setVariations, selectedVar, setSelectedVar,
    params, setParams, updateParam, aiLoading, setAiLoading, aiError, setAiError, setPage } = store;

  const primary = COLOR_THEMES[style.themeKey]?.primary || '#3ECFB2';

  // ── 포트폴리오 전용 입력 상태 ─────────────────────────────────────────────
  const [part, setPart] = useState('업무 생산성');
  const [projectName, setProjectName] = useState('');
  const [seriesNum, setSeriesNum] = useState('');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [impacts, setImpacts] = useState(['', '', '']);
  const [tools, setTools] = useState([]);
  const [inputMode, setInputMode] = useState('manual'); // 'manual' | 'paste'
  const [pasteText, setPasteText] = useState('');
  const [parseLoading, setParseLoading] = useState(false);
  const [parseError, setParseError] = useState('');

  const [activeCard, setActiveCard] = useState(1);
  const [exportFormat, setExportFormat] = useState('svg');
  const [exportLoading, setExportLoading] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const ESTIMATED_SEC = 20;
  const [fontReady, setFontReady] = useState(false);
  const [feedText, setFeedText] = useState('');
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState('');
  const [feedCopied, setFeedCopied] = useState(false);

  // ── ef_diary 폰트 SVG embed ───────────────────────────────────────────────
  useEffect(() => {
    fetch('/fonts/EF_Diary.otf')
      .then(r => r.arrayBuffer())
      .then(buf => {
        const bytes = new Uint8Array(buf);
        let b64 = '';
        for (let i = 0; i < bytes.length; i += 8192) {
          b64 += String.fromCharCode(...bytes.subarray(i, i + 8192));
        }
        b64 = btoa(b64);
        setPortfolioFontStyle(
          `@font-face{font-family:'ef_diary';src:url('data:font/otf;base64,${b64}') format('opentype');font-weight:400;font-style:normal;}`
        );
        setFontReady(true);
      })
      .catch(() => { setFontReady(true); });
  }, []);

  // ── AI 타이머 ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!aiLoading) { setElapsedSec(0); return; }
    const t = setInterval(() => setElapsedSec(s => s + 1), 1000);
    return () => clearInterval(t);
  }, [aiLoading]);

  // ── SVG 빌드 ──────────────────────────────────────────────────────────────
  const [svgs, setSvgs] = useState({});

  const rebuildSvgs = useCallback(() => {
    if (!params) return;
    const built = {};
    for (const n of CARD_NUMS) {
      const cardParams = {
        ...params[`card${n}`],
        // card3, card5는 tools를 meta에서 주입
        tools: n === 3 || n === 5 ? tools : undefined,
      };
      const raw = generatePortfolioCard(n, cardParams);
      built[n] = applyStyle(raw, style);
    }
    setSvgs(built);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, tools, style, fontReady]);

  useEffect(() => { rebuildSvgs(); }, [rebuildSvgs]);

  // ── AI 생성 ───────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!projectName.trim()) { setAiError('프로젝트명을 입력해주세요'); return; }
    setAiError('');
    setAiLoading(true);
    try {
      const vars = await generatePortfolioVariations({ part, projectName, problem, solution, impacts, tools, seriesNum });
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
    const defaults = makeDefaultPortfolioParams({ part, projectName, problem, solution, impacts, tools, seriesNum });
    const merged = {
      card1: { ...defaults.card1, ...v.card1, part, seriesNum },
      card2: { ...defaults.card2, ...v.card2 },
      card3: { ...defaults.card3, ...v.card3, tools },
      card4: { ...defaults.card4, ...v.card4 },
      card5: { ...defaults.card5, ...v.card5, tools },
      card6: { ...defaults.card6, ...v.card6 },
    };
    setParams(merged);
    setSelectedVar(idx);
  }

  function skipToManual() {
    const defaults = makeDefaultPortfolioParams({ part, projectName, problem, solution, impacts, tools, seriesNum });
    setParams(defaults);
    setStep(4);
  }

  // ── 피드 글 생성 ──────────────────────────────────────────────────────────
  async function handleGenerateFeed() {
    setFeedError('');
    setFeedLoading(true);
    try {
      const text = await generatePortfolioFeed({ seriesNum, projectName, part, problem, solution, impacts, tools });
      setFeedText(text);
    } catch (e) {
      setFeedError(e.message);
    } finally {
      setFeedLoading(false);
    }
  }

  async function handleCopyFeed() {
    try {
      await navigator.clipboard.writeText(feedText);
      setFeedCopied(true);
      setTimeout(() => setFeedCopied(false), 2000);
    } catch {
      alert('복사 실패 — 텍스트를 직접 선택해서 복사해주세요.');
    }
  }

  // ── 다운로드 ───────────────────────────────────────────────────────────────
  async function handleDownloadAll() {
    setExportLoading(true);
    try {
      const slug = `포트폴리오_${(projectName || 'portfolio').replace(/\s+/g, '_')}`;
      await downloadZip({
        svgs: CARD_NUMS.map(n => svgs[n] || ''),
        labels: PORTFOLIO_CARD_LABELS,
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
    const label = PORTFOLIO_CARD_LABELS[n - 1];
    try {
      await downloadOne({ svgString: svgs[n] || '', filename: `${n}_${label}.svg`, format: exportFormat });
    } catch (e) {
      alert('다운로드 실패: ' + e.message);
    }
  }

  const PREVIEW_SCALE = 0.22;

  async function handleParse() {
    if (!pasteText.trim()) return;
    setParseError('');
    setParseLoading(true);
    try {
      const result = await parsePortfolioText(pasteText);
      if (result.projectName) setProjectName(result.projectName);
      if (result.problem) setProblem(result.problem);
      if (result.solution) setSolution(result.solution);
      if (result.impacts?.length) setImpacts([result.impacts[0] || '', result.impacts[1] || '', result.impacts[2] || '']);
      if (result.tools?.length) setTools(result.tools);
      setInputMode('manual');
    } catch (e) {
      setParseError(e.message);
    } finally {
      setParseLoading(false);
    }
  }

  const step1Valid = projectName.trim().length > 0 && problem.trim().length > 0;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2 flex-shrink-0" style={{ width: 220 }}>
            <button onClick={() => setPage('home')} className="text-sm text-gray-400 hover:text-gray-600 whitespace-nowrap flex-shrink-0">
              ← 홈
            </button>
            <span className="text-gray-200 flex-shrink-0">|</span>
            <div className="flex items-center gap-1 min-w-0">
              <span className="text-sm font-bold text-gray-900 whitespace-nowrap">포트폴리오 카드뉴스</span>
              {projectName && <span className="text-xs text-gray-400 truncate">— {projectName}</span>}
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
          <div className="w-80 flex-shrink-0 flex flex-col gap-4 sticky top-[60px] self-start max-h-[calc(100vh-80px)] overflow-y-auto">

            {/* STEP 1 — 프로젝트 정보 */}
            {step === 1 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-5">
                <div>
                  <h2 className="font-bold text-gray-900">프로젝트 정보</h2>
                </div>

                {/* 입력 방식 탭 */}
                <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
                  {[{ key: 'manual', label: '직접 입력' }, { key: 'paste', label: '✦ 줄글 붙여넣기' }].map(m => (
                    <button
                      key={m.key}
                      onClick={() => setInputMode(m.key)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={inputMode === m.key
                        ? { backgroundColor: 'white', color: primary, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }
                        : { color: '#9ca3af' }}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                {/* 줄글 붙여넣기 모드 */}
                {inputMode === 'paste' && (
                  <div className="flex flex-col gap-3">
                    <Textarea
                      rows={12}
                      value={pasteText}
                      onChange={e => setPasteText(e.target.value)}
                      placeholder="노션 포트폴리오 내용을 그대로 붙여넣으세요.&#10;&#10;예)&#10;펀칭 이미지 메이커 제작 2026&#10;&#10;Problem: 전용 웹툴의 부재&#10;Solution: React + Canvas API로...&#10;Detail & Impact: ..."
                    />
                    {parseError && <p className="text-xs text-red-500">{parseError}</p>}
                    <button
                      onClick={handleParse}
                      disabled={parseLoading || !pasteText.trim()}
                      className="w-full py-2.5 rounded-xl font-bold text-sm text-white transition-all"
                      style={{ backgroundColor: parseLoading || !pasteText.trim() ? '#9ca3af' : primary }}
                    >
                      {parseLoading ? '✦ AI 파싱 중...' : '✦ AI로 자동 파싱'}
                    </button>
                    <p className="text-[11px] text-gray-400 text-center">파싱 후 직접 입력 탭에서 내용 확인·수정 가능</p>
                  </div>
                )}

                {/* 직접 입력 모드 */}
                {inputMode === 'manual' && (<>

                {/* 파트 선택 */}
                <Field label="파트 선택 *">
                  <div className="flex gap-2">
                    {PARTS.map(p => (
                      <button
                        key={p}
                        onClick={() => setPart(p)}
                        className="flex-1 py-2 rounded-xl text-sm font-medium transition-all"
                        style={part === p
                          ? { backgroundColor: primary, color: 'white' }
                          : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="프로젝트명 *">
                  <Input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="기자실 이메일 자동화 시스템" />
                </Field>

                <Field label="시리즈 번호" hint="예: 01, 02">
                  <Input value={seriesNum} onChange={e => setSeriesNum(e.target.value)} placeholder="01" />
                </Field>

                <Field label="Problem *" hint="어떤 불편함이 있었나?">
                  <Textarea rows={3} value={problem} onChange={e => setProblem(e.target.value)}
                    placeholder="매일 수신하는 첨부파일을 수동으로 전달해야 하는 비효율 발생" />
                </Field>

                <Field label="Solution" hint="어떻게 해결했나?">
                  <Textarea rows={3} value={solution} onChange={e => setSolution(e.target.value)}
                    placeholder="Gemini + Apps Script로 파싱~배포까지 자동화 시스템 직접 개발" />
                </Field>

                <Field label="Impact" hint="수치 포함 권장">
                  {[0, 1, 2].map(i => (
                    <Input key={i} value={impacts[i]} onChange={e => {
                      const next = [...impacts];
                      next[i] = e.target.value;
                      setImpacts(next);
                    }} placeholder={['수동 전달 업무 완전 자동화', '중복 저장 방지 로직 구현', '외부 접근 가능한 독립 웹 앱'][i]} />
                  ))}
                </Field>

                <Field label="사용 도구" hint="Enter 또는 , 로 추가">
                  <ToolTagInput tags={tools} onChange={setTools} />
                </Field>

                {aiError && <p className="text-xs text-red-500">{aiError}</p>}

                <button
                  onClick={() => setStep(2)}
                  disabled={!step1Valid}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={!step1Valid
                    ? { backgroundColor: '#f3f4f6', color: '#9ca3af', cursor: 'not-allowed' }
                    : { backgroundColor: primary, color: 'white' }}
                >
                  다음: 스타일 설정 →
                </button>
                </>)}
              </div>
            )}

            {/* STEP 2 — 스타일 */}
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
                <button onClick={() => setStep(1)} className="text-xs text-gray-400 hover:text-gray-600 text-center">← 프로젝트 정보 수정</button>
              </div>
            )}

            {/* STEP 3 — 카피 선택 */}
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
                  <PortfolioCopyVariations
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

            {/* STEP 4 — 편집 */}
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
                      {n}. {PORTFOLIO_CARD_LABELS[n - 1]}
                    </button>
                  ))}
                </div>
                <div className="overflow-y-auto pr-1" style={{ maxHeight: '50vh' }}>
                  <PortfolioCardEditor
                    n={activeCard}
                    p={params?.[`card${activeCard}`] || {}}
                    tools={tools}
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

            {/* STEP 5 — 다운로드 */}
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
                      <span className="text-gray-700">{n}. {PORTFOLIO_CARD_LABELS[n - 1]}</span>
                      <span className="text-xs font-medium" style={{ color: primary }}>↓ {exportFormat.toUpperCase()}</span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setStep(6); if (!feedText) handleGenerateFeed(); }}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white"
                  style={{ backgroundColor: primary }}
                >
                  피드 글 작성하기 →
                </button>
                <button onClick={() => setStep(4)} className="text-xs text-gray-400 hover:text-gray-600 text-center">← 텍스트 수정</button>
              </div>
            )}

            {/* STEP 6 — 피드 글 */}
            {step === 6 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-gray-900">피드 글</h2>
                  <button
                    onClick={handleGenerateFeed}
                    disabled={feedLoading}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium text-white transition-all"
                    style={{ backgroundColor: feedLoading ? '#9ca3af' : primary }}
                  >
                    {feedLoading ? '생성 중...' : '↻ 다시 생성'}
                  </button>
                </div>

                {feedError && (
                  <p className="text-xs text-red-500 bg-red-50 border border-red-100 p-2 rounded-lg">{feedError}</p>
                )}

                {feedLoading && (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: primary, borderTopColor: 'transparent' }} />
                    <p className="text-sm text-gray-400">피드 글 작성 중...</p>
                  </div>
                )}

                {!feedLoading && feedText && (
                  <>
                    <textarea
                      value={feedText}
                      onChange={(e) => setFeedText(e.target.value)}
                      rows={18}
                      className="w-full text-sm text-gray-800 leading-relaxed border border-gray-100 rounded-xl p-4 resize-none focus:outline-none focus:border-gray-300"
                      style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}
                    />
                    <button
                      onClick={handleCopyFeed}
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                      style={feedCopied
                        ? { backgroundColor: '#10b981', color: 'white' }
                        : { backgroundColor: primary, color: 'white' }}
                    >
                      {feedCopied ? '✓ 복사됨' : '클립보드에 복사'}
                    </button>
                  </>
                )}

                <button onClick={() => setStep(5)} className="text-xs text-gray-400 hover:text-gray-600 text-center">← 다운로드로</button>
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
                <p className="text-2xl mb-3">🗂</p>
                <p className="text-gray-400 text-sm">
                  프로젝트 정보를 입력하면<br/>여기에 미리보기가 표시됩니다.
                </p>
                <p className="text-xs text-gray-300 mt-2">커버 · 문제 · 해결 · 임팩트 · 스택 · 아웃트로</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
