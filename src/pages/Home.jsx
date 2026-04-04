import { useAppStore } from '../store/useAppStore';

const MODES = [
  {
    key: 'meme',
    emoji: '🔥',
    title: '밈 카드뉴스',
    subtitle: '김밈지 시리즈',
    desc: '요즘 핫한 밈을 6장 카드뉴스로\n2030 여성이 저장하고 싶은 콘텐츠',
    tags: ['위트 · 공감', '브랜드 활용법', '트위터 감성'],
    color: '#3ECFB2',
    grad: 'from-[#AEEADB] to-[#F0FDF9]',
  },
  {
    key: 'general',
    emoji: '📋',
    title: '일반 카드뉴스',
    subtitle: '정보 · 트렌드 · 팁',
    desc: '어떤 주제든 깔끔하게 정리\n저장욕구 폭발하는 정보성 콘텐츠',
    tags: ['실용 팁', '트렌드 분석', '인사이트 정리'],
    color: '#6366F1',
    grad: 'from-[#C7D2FE] to-[#F5F3FF]',
  },
];

export default function Home() {
  const startProject = useAppStore((s) => s.startProject);

  return (
    <div className="min-h-screen bg-[#F7F7F5]" style={{ fontFamily: "'Pretendard','Apple SD Gothic Neo',sans-serif" }}>
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-screen-md mx-auto px-6 h-14 flex items-center gap-2">
          <span className="text-lg font-extrabold text-gray-900">카드뉴스 메이커</span>
          <span className="text-xs text-gray-400">by @minjaja.pdf</span>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-6 py-14">
        {/* 히어로 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 leading-tight">
            인스타 카드뉴스,<br/>
            <span style={{ color: '#3ECFB2' }}>AI가 써드릴게요.</span>
          </h1>
          <p className="text-gray-400 text-base">
            주제 입력 → 스타일 선택 → 3가지 카피 비교 → SVG/PNG 다운로드
          </p>
        </div>

        {/* 모드 선택 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {MODES.map((mode) => (
            <button
              key={mode.key}
              onClick={() => startProject(mode.key)}
              className={`text-left p-6 rounded-3xl bg-gradient-to-br ${mode.grad} border border-white hover:shadow-lg transition-all hover:-translate-y-0.5 active:translate-y-0`}
            >
              <div className="flex items-start justify-between mb-4">
                <span className="text-4xl">{mode.emoji}</span>
                <span
                  className="text-xs px-3 py-1 rounded-full font-medium text-white"
                  style={{ backgroundColor: mode.color }}
                >
                  {mode.subtitle}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-gray-900 mb-2">{mode.title}</h2>
              <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line mb-4">
                {mode.desc}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {mode.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2.5 py-1 rounded-full bg-white bg-opacity-70 font-medium"
                    style={{ color: mode.color }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>

        {/* 플로우 설명 */}
        <div className="mt-12 bg-white rounded-2xl p-6 shadow-sm">
          <p className="text-xs font-semibold text-gray-400 mb-4 uppercase tracking-wider">진행 플로우</p>
          <div className="flex items-center gap-0 flex-wrap">
            {['주제 입력', '스타일 설정', 'AI 카피 생성', '텍스트 편집', '이미지 추가', 'SVG/PNG 다운로드'].map((step, i, arr) => (
              <div key={step} className="flex items-center">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: '#3ECFB2' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-xs text-gray-600 whitespace-nowrap">{step}</span>
                </div>
                {i < arr.length - 1 && (
                  <span className="text-gray-200 mx-1 text-xs">→</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
