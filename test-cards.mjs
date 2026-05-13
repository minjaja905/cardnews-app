// 카드 디자인 미리보기 테스트 — 헤일메리 스타일 샘플 데이터
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { generateCard, generatePhraseCard } from './src/lib/svgGenerator.js';

mkdirSync('./test-output', { recursive: true });

const samples = {
  card1: {
    volNum: 8,
    date: '26.04.11',
    heroLines: [
      { text: '실수했을 때', color: '#1A1A1A' },
      { text: '다같이 라을라~~~', color: '#3ECFB2' },
    ],
    badgeLabel: '대리공감 밈',
    subtitle: '',
    coverImg: null,
  },
  card2: {
    heroLines: [
      { text: '발원지는 사무실.', color: '#1A1A1A' },
      { text: '회사에서 하품하다가', color: '#1A1A1A' },
      { text: '소리낸 씰 푼다', color: '#3ECFB2' },
    ],
    memoLines: ['와 사무실에서 하품하다가 상대 열려서 소리낸'],
    descLines: [
      '입 쫙 벌리고 있었는데 라를라~~~',
      '이런 개귀여운 생각이 소리로 나왔어',
      '설화야? 죽고싶어 ㅋㅋㅋ',
    ],
    sourceText: '2026.02.05 · 추천 17',
    mainImg: null,
  },
  card3: {
    heroLines: [
      { text: '웃픈 실수인데,', color: '#1A1A1A' },
      { text: '동물 친구들이', color: '#1A1A1A' },
      { text: '따라하면서 확 퍼짐ㅋㅋ', color: '#3ECFB2' },
    ],
    subtitleLines: [
      '동물친구들 나잖 ㄱ여워',
      '하품 크게 하다 소리나는 거 다들 있잖아요',
      '출처: @dog_yawn_archive',
    ],
    mintBoxLines: [
      '하품소리 모음집 계정까지 생겼다는 후문',
      '반려동물 계정들이 릴스로 퍼뜨리기 시작',
      '라을라~~~! 이미 유행 시작됐어요',
    ],
    spreadImg1: null,
  },
  card4: {
    heroLines: [
      { text: '이럴 때', color: '#1A1A1A' },
      { text: '써보세요.', color: '#3ECFB2' },
    ],
    bullets: [
      '🚀 뭔가 엄청 좋을 때: "좋음, 좋음, 좋음!"',
      '😂 친구가 뭔가 설명할 때: "이해함, 질문?"',
      '🎬 영화 보고 나서 아무 말도 안 나올 때',
      '💼 회의에서 보고할 때 갑자기 로키 말투로',
    ],
    calloutLines: ['좋음, 좋음, 좋음! 이제 다들 쓸 준비됐죠, 질문?'],
  },
  card5: {
    heroLines: [
      { text: '하나 더 있어요.', color: '#1A1A1A' },
      { text: '재즈 손동작, 👍 혹은 👎', color: '#3ECFB2' },
    ],
    summaryLines: [
      '둘의 수신호 체계인데,',
      '로키의 구조 특성 상 위로 엄지를 올릴 수 없고 내리기만 가능',
      '촬영팀도 다 같이 👎를 하는 사진들이 많음!',
      '프로젝트 헤일메리 진짜 좋음, 좋음, 좋음! 👎',
    ],
  },
};

Object.entries(samples).forEach(([name, params]) => {
  const num = parseInt(name.replace('card', ''));
  const svg = generateCard(num, params);
  writeFileSync(`./test-output/${name}.svg`, svg, 'utf-8');
  console.log(`✓ ${name}.svg`);
});

// 컬렉션 카드 테스트
const phraseData = [
  {
    heroLines: [{ text: '좋음, 좋음, 좋음!', color: '#3ECFB2' }],
    summaryLines: ['뭔가 엄청 마음에 들 때 세 번 반복하는 로키 말투', '영어로는 "awesome, awesome, awesome!"'],
    bullets: ['🚀 영화 보고 나서 할 말이 없을 때', '💼 칭찬할 때 강조하고 싶을 때'],
    badgeLabel: '영화 밈',
  },
  {
    heroLines: [{ text: '이해함,', color: '#1A1A1A' }, { text: '질문?', color: '#3ECFB2' }],
    summaryLines: ['로키가 뭔가 이해했는지 확인할 때 쓰는 말', '인간과 다른 소통 방식에서 나온 특유의 어투'],
    bullets: ['😂 친구 설명 듣고 모를 때', '🎓 수업 끝나고 교수님한테'],
    badgeLabel: 'SF 밈',
  },
  {
    heroLines: [{ text: '원함, 원함, 원함.', color: '#1A1A1A' }],
    summaryLines: ['원하는 걸 세 번 말하는 로키 특유의 강조법', '절제된 듯하면서도 강렬한 욕망 표현'],
    bullets: ['🛍️ 쇼핑할 때 참을 수 없을 때', '🍕 배고플 때 뭔가 간절히 원할 때'],
    badgeLabel: '트렌드',
  },
];

phraseData.forEach((params, i) => {
  const svg = generatePhraseCard(i + 1, params);
  writeFileSync(`./test-output/phrase${i + 1}.svg`, svg, 'utf-8');
  console.log(`✓ phrase${i + 1}.svg`);
});

// HTML 미리보기 (base64 인라인 SVG)
const cards = ['card1','card2','card3','card4','card5','phrase1','phrase2','phrase3'];
const imgs = cards.map(name => {
  try {
    const svg = readFileSync(`./test-output/${name}.svg`, 'utf-8');
    const b64 = Buffer.from(svg).toString('base64');
    return `<div class="card"><h3>${name}</h3><img src="data:image/svg+xml;base64,${b64}"></div>`;
  } catch { return ''; }
}).join('\n');

const html = `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8"><title>카드 미리보기</title>
<style>body{background:#888;margin:0;padding:24px;display:flex;flex-wrap:wrap;gap:24px;}
.card{width:360px;}.card h3{color:white;font-family:sans-serif;font-size:13px;margin:0 0 6px;}
.card img{width:100%;display:block;border-radius:12px;}</style></head>
<body>${imgs}</body></html>`;

writeFileSync('./test-output/preview.html', html, 'utf-8');
console.log('\n📁 test-output/ 폴더에 저장됨');
console.log('🌐 open test-output/preview.html');
