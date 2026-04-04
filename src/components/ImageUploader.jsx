// 이미지 업로더 + 누끼(배경 제거) 기능
import { useRef, useState } from 'react';
import { removeBackground } from '@imgly/background-removal';

export default function ImageUploader({ label, value, onChange, primaryColor = '#3ECFB2' }) {
  const inputRef = useRef();
  const [bgRemoving, setBgRemoving] = useState(false);
  const [bgError, setBgError] = useState('');

  function handleFile(file) {
    if (!file) return;
    setBgError('');
    const reader = new FileReader();
    reader.onload = (e) => onChange(e.target.result);
    reader.readAsDataURL(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  }

  async function handleRemoveBg() {
    if (!value) return;
    setBgRemoving(true);
    setBgError('');
    try {
      // base64 → Blob
      const res = await fetch(value);
      const blob = await res.blob();
      const resultBlob = await removeBackground(blob);
      const url = URL.createObjectURL(resultBlob);
      // Blob URL → base64 (SVG embed용)
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target.result);
        URL.revokeObjectURL(url);
        setBgRemoving(false);
      };
      reader.readAsDataURL(resultBlob);
    } catch (e) {
      setBgError('누끼 실패: ' + e.message);
      setBgRemoving(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-sm font-medium text-gray-600">{label}</label>}
      <div
        className="relative border-2 border-dashed rounded-xl cursor-pointer transition-colors"
        style={{
          height: value ? 'auto' : 88,
          borderColor: value ? primaryColor : '#E5E7EB',
          backgroundColor: value ? `${primaryColor}0D` : '#F9FAFB',
        }}
        onClick={() => !value && inputRef.current.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        {value ? (
          <div className="flex items-start p-3 gap-3">
            <img src={value} alt="" className="h-16 w-16 object-cover rounded-lg flex-shrink-0 bg-[#f0f0f0]" />
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
              <p className="text-xs font-medium" style={{ color: primaryColor }}>이미지 업로드됨</p>
              <div className="flex gap-1.5 flex-wrap">
                <button
                  className="text-xs px-2.5 py-1 rounded-lg border transition-all"
                  style={{ borderColor: '#E5E7EB', color: '#6B7280' }}
                  onClick={(e) => { e.stopPropagation(); inputRef.current.click(); }}
                >
                  변경
                </button>
                <button
                  className="text-xs px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1 disabled:opacity-50"
                  style={bgRemoving
                    ? { borderColor: '#E5E7EB', color: '#9CA3AF' }
                    : { borderColor: primaryColor, color: primaryColor }}
                  onClick={(e) => { e.stopPropagation(); handleRemoveBg(); }}
                  disabled={bgRemoving}
                >
                  {bgRemoving ? (
                    <><span className="animate-spin inline-block">⟳</span> 처리중...</>
                  ) : (
                    '✂️ 누끼 따기'
                  )}
                </button>
                <button
                  className="text-xs px-2 py-1 rounded-lg text-gray-300 hover:text-red-400 transition-all"
                  onClick={(e) => { e.stopPropagation(); onChange(null); setBgError(''); }}
                >
                  ✕
                </button>
              </div>
              {bgError && <p className="text-[10px] text-red-400">{bgError}</p>}
              {bgRemoving && (
                <p className="text-[10px] text-gray-400">
                  첫 실행 시 AI 모델 로드로 30초~1분 소요됩니다.
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-1">
            <span className="text-xl">📁</span>
            <span className="text-xs">클릭 또는 드래그</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
    </div>
  );
}
