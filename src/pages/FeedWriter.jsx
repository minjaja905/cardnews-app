import { useState, useRef } from 'react';
import { useAppStore } from '../store/useAppStore';
import { generatePortfolioFeed, parseImageToPortfolioInfo } from '../lib/claudeApi';

const primary = '#3ECFB2';

const PARTS = ['업무 생산성', '생활 생산성'];

export default function FeedWriter() {
  const reset = useAppStore((s) => s.reset);

  const [seriesNum, setSeriesNum] = useState('');
  const [projectName, setProjectName] = useState('');
  const [part, setPart] = useState('업무 생산성');
  const [problem, setProblem] = useState('');
  const [solution, setSolution] = useState('');
  const [impacts, setImpacts] = useState(['', '', '']);
  const [tools, setTools] = useState('');

  const [feedText, setFeedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const [parseLoading, setParseLoading] = useState(false);
  const fileInputRef = useRef(null);

  function handleImageFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      setParseLoading(true);
      setError('');
      try {
        const mediaType = file.type;
        const base64 = dataUrl.split(',')[1];
        const info = await parseImageToPortfolioInfo(base64, mediaType);
        if (info.seriesNum) setSeriesNum(info.seriesNum);
        if (info.projectName) setProjectName(info.projectName);
        if (info.part) setPart(info.part);
        if (info.problem) setProblem(info.problem);
        if (info.solution) setSolution(info.solution);
        if (info.impacts?.length) setImpacts([...info.impacts, '', ''].slice(0, 3));
        if (info.tools?.length) setTools(info.tools.join(', '));
      } catch (e) {
        setError('이미지 분석 실패: ' + e.message);
      } finally {
        setParseLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleGenerate() {
    if (!projectName.trim()) { setError('프로젝트명을 입력해주세요.'); return; }
    setError('');
    setLoading(true);
    try {
      const text = await generatePortfolioFeed({
        seriesNum: seriesNum || '01',
        projectName,
        part,
        problem,
        solution,
        impacts: impacts.filter(Boolean),
        tools: tools.split(/[,，、]/).map(t => t.trim()).filter(Boolean),
      });
      setFeedText(text);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(feedText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert('복사 실패 — 텍스트를 직접 선택해서 복사해주세요.');
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F7F5]" style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-screen-md mx-auto px-6 h-14 flex items-center gap-3">
          <button onClick={reset} className="text-gray-400 hover:text-gray-600 text-sm">← 홈</button>
          <span className="text-lg font-extrabold text-gray-900">피드 글 작성</span>
          <span className="text-xs px-2 py-0.5 rounded-full text-white font-medium" style={{ backgroundColor: primary }}>시스템화</span>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 py-10 flex flex-col gap-6">
        {/* 입력 폼 */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-5">
          <h2 className="font-bold text-gray-900">프로젝트 정보</h2>

          {/* 이미지 업로드 */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); handleImageFile(e.dataTransfer.files[0]); }}
            className="relative cursor-pointer rounded-2xl border-2 border-dashed border-gray-200 hover:border-[#3ECFB2] transition-all overflow-hidden"
            style={{ minHeight: 120 }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => handleImageFile(e.target.files[0])}
            />
            {imagePreview ? (
              <div className="flex items-center gap-4 p-4">
                <img src={imagePreview} alt="업로드된 카드" className="w-20 h-auto rounded-xl object-cover shadow-sm" />
                <div className="flex-1">
                  {parseLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0" style={{ borderColor: primary, borderTopColor: 'transparent' }} />
                      <span className="text-sm text-gray-500">이미지 분석 중...</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-gray-700">분석 완료</p>
                      <p className="text-xs text-gray-400">다른 이미지로 바꾸려면 클릭</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8">
                <span className="text-2xl">🖼️</span>
                <p className="text-sm font-medium text-gray-500">카드 이미지 업로드</p>
                <p className="text-xs text-gray-400">클릭하거나 드래그 — AI가 내용을 자동으로 파악해요</p>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 w-24">
              <label className="text-xs font-medium text-gray-500">시리즈 번호</label>
              <input
                value={seriesNum}
                onChange={e => setSeriesNum(e.target.value)}
                placeholder="01"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <label className="text-xs font-medium text-gray-500">프로젝트명 *</label>
              <input
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                placeholder="청첩장 직접 만들기"
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">파트</label>
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
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">문제 상황</label>
            <textarea
              value={problem}
              onChange={e => setProblem(e.target.value)}
              placeholder="어떤 불편함이 있었나요?"
              rows={2}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">해결 방법</label>
            <textarea
              value={solution}
              onChange={e => setSolution(e.target.value)}
              placeholder="어떻게 해결했나요?"
              rows={2}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-gray-400"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">성과 (최대 3개)</label>
            {impacts.map((v, i) => (
              <input
                key={i}
                value={v}
                onChange={e => setImpacts(prev => prev.map((p, j) => j === i ? e.target.value : p))}
                placeholder={`성과 ${i + 1}`}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
              />
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-gray-500">사용 도구 (쉼표로 구분)</label>
            <input
              value={tools}
              onChange={e => setTools(e.target.value)}
              placeholder="Claude, Figma, Notion"
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
            />
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
            style={{ backgroundColor: loading ? '#9ca3af' : primary }}
          >
            {loading ? '작성 중...' : '피드 글 생성하기'}
          </button>
        </div>

        {/* 결과 */}
        {(loading || feedText) && (
          <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">생성된 피드 글</h2>
              {feedText && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                  style={{ backgroundColor: loading ? '#9ca3af' : '#6b7280' }}
                >
                  ↻ 다시 생성
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div
                  className="w-8 h-8 rounded-full border-2 animate-spin"
                  style={{ borderColor: primary, borderTopColor: 'transparent' }}
                />
                <p className="text-sm text-gray-400">피드 글 작성 중...</p>
              </div>
            ) : (
              <>
                <textarea
                  value={feedText}
                  onChange={e => setFeedText(e.target.value)}
                  rows={18}
                  className="w-full text-sm text-gray-800 leading-relaxed border border-gray-100 rounded-xl p-4 resize-none focus:outline-none focus:border-gray-300"
                />
                <button
                  onClick={handleCopy}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all"
                  style={{ backgroundColor: copied ? '#10b981' : primary }}
                >
                  {copied ? '✓ 복사됨' : '클립보드에 복사'}
                </button>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
