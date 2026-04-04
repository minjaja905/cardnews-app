// SVG + PNG 내보내기 유틸리티
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// ── SVG → PNG 변환 (Canvas API) ───────────────────────────────────────────────
export function svgToPngBlob(svgString, width = 1080, height = 1350) {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (pngBlob) resolve(pngBlob);
        else reject(new Error('PNG 변환 실패'));
      }, 'image/png');
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('SVG 이미지 로드 실패'));
    };
    img.src = url;
  });
}

// ── 단일 카드 다운로드 ────────────────────────────────────────────────────────
export async function downloadOne({ svgString, filename, format }) {
  if (format === 'png') {
    const pngBlob = await svgToPngBlob(svgString);
    saveAs(pngBlob, filename.replace('.svg', '.png'));
  } else {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    saveAs(blob, filename);
  }
}

// ── 전체 ZIP 다운로드 ─────────────────────────────────────────────────────────
export async function downloadZip({ svgs, labels, slug, format }) {
  const zip = new JSZip();

  if (format === 'png') {
    // PNG 변환은 순차 처리 (canvas 동시 생성 제한)
    for (let i = 0; i < svgs.length; i++) {
      const pngBlob = await svgToPngBlob(svgs[i]);
      const label = (labels[i] || `card${i + 1}`).replace(/[^\w가-힣]/g, '_');
      zip.file(`${i + 1}_${label}.png`, pngBlob);
    }
  } else {
    svgs.forEach((svg, i) => {
      const label = (labels[i] || `card${i + 1}`).replace(/[^\w가-힣]/g, '_');
      zip.file(`${i + 1}_${label}.svg`, svg);
    });
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  const ext = format === 'png' ? 'png' : 'svg';
  saveAs(blob, `${slug}_${ext}.zip`);
}
