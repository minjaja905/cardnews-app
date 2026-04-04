import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const defaultDate = () => {
  const d = new Date();
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

// Pretendard = 기본 fontDef (manifest 로드 전 fallback)
const DEFAULT_FONT_DEF = { id: 'pretendard', title: { weight: '700' }, body: { weight: '400' } };

export const useAppStore = create(
  persist(
    (set) => ({
      // ── 네비게이션 ─────────────────────────────────────────────────────────
      page: 'home',
      setPage: (page) => set({ page }),

      // ── 위저드 스텝 ─────────────────────────────────────────────────────────
      step: 1,
      setStep: (step) => set({ step }),

      // ── 기본 정보 ──────────────────────────────────────────────────────────
      topic: '',
      setTopic: (v) => set({ topic: v }),
      details: '',
      setDetails: (v) => set({ details: v }),
      volNum: '',
      setVolNum: (v) => set({ volNum: v }),
      date: defaultDate(),
      setDate: (v) => set({ date: v }),

      // ── 스타일 ────────────────────────────────────────────────────────────
      style: {
        themeKey: 'mint',
        fontDef: DEFAULT_FONT_DEF,
      },
      setStyle: (s) => set((state) => ({ style: { ...state.style, ...s } })),

      // ── 페이지 수 ─────────────────────────────────────────────────────────
      cardCount: 6,
      setCardCount: (n) => set({ cardCount: Math.max(1, Math.min(12, n)) }),

      // ── AI 카피 변형 ──────────────────────────────────────────────────────
      aiLoading: false,
      setAiLoading: (v) => set({ aiLoading: v }),
      aiError: '',
      setAiError: (v) => set({ aiError: v }),
      variations: [],
      setVariations: (v) => set({ variations: v }),
      selectedVar: 0,
      setSelectedVar: (i) => set({ selectedVar: i }),

      // ── 확정된 카드 파라미터 ──────────────────────────────────────────────
      params: null,
      setParams: (p) => set({ params: p }),
      updateParam: (cardKey, field, value) =>
        set((state) => ({
          params: {
            ...state.params,
            [cardKey]: { ...state.params?.[cardKey], [field]: value },
          },
        })),

      // ── 이미지 (키: cover, origin, spread1, spread2, side, center, extra_7 ...) ──
      images: {},
      setImage: (key, val) => set((state) => ({ images: { ...state.images, [key]: val } })),

      // ── 프로젝트 시작 ─────────────────────────────────────────────────────
      startProject: (mode) =>
        set({
          page: mode,
          step: 1,
          topic: '',
          details: '',
          volNum: '',
          date: defaultDate(),
          cardCount: 6,
          aiLoading: false,
          aiError: '',
          variations: [],
          selectedVar: 0,
          params: null,
          images: {},
        }),

      reset: () =>
        set({
          page: 'home',
          step: 1,
          topic: '',
          details: '',
          volNum: '',
          cardCount: 6,
          aiLoading: false,
          aiError: '',
          variations: [],
          selectedVar: 0,
          params: null,
          images: {},
        }),
    }),
    {
      name: 'cardnews-app-store',
      partialize: (state) => ({
        style: state.style,
      }),
    }
  )
);
