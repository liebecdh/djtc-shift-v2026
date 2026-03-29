import React, { useState } from 'react';

export default function App() {
  const [status, setStatus] = useState("아래 버튼을 누르면 완성된 아이콘이 다운로드됩니다.");

  const generateAndDownload = () => {
    setStatus("아이콘 만드는 중...");
    
    // 512x512 사이즈의 도화지(캔버스) 생성
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    const img = new Image();
    // 외부 이미지 다운로드를 위한 권한 설정
    img.crossOrigin = "Anonymous";
    // 사용자님이 사용하시던 꿈돌이 원본 링크
    img.src = "https://raw.githubusercontent.com/liebecdh/ggumdori/d3fae1262ef50794739cd6b9bf8c6862aea6512d/IMG_4504.png";
    
    img.onload = () => {
      try {
        // 1. 하얀색 배경 칠하기
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 512, 512);
        
        // 2. 가운데에 예쁜 여백을 두고 이미지 그리기 (상하좌우 80px 여백, 크기 352x352)
        ctx.drawImage(img, 80, 80, 352, 352);
        
        // 3. 다운로드 실행
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = "icon.png";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setStatus("✅ 완벽한 icon.png 다운로드 완료! 스택블리츠 public 폴더에 올려주세요.");
      } catch (e) {
        setStatus("🚨 에러가 발생했습니다. (보안 정책 문제일 수 있습니다)");
      }
    };

    img.onerror = () => {
      setStatus("🚨 이미지 주소를 불러오지 못했습니다.");
    };
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1a050a] text-white p-5 text-center">
      <h1 className="text-[#D4AF37] text-3xl font-black mb-4 drop-shadow-md">
        🎁 아이콘 자판기
      </h1>
      <p className="mb-10 text-white/80 font-bold">
        {status}
      </p>
      <button 
        onClick={generateAndDownload}
        className="px-8 py-4 bg-blue-500/20 text-blue-400 border border-blue-500/50 font-black rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:bg-blue-500/30 transition-all active:scale-95"
      >
        ✨ 하얀 바탕 아이콘 만들기
      </button>
      
      <div className="mt-12 p-4 bg-white/5 rounded-2xl border border-white/10 max-w-[300px] text-sm text-white/60">
        <strong className="text-white block mb-2">📌 사용 순서</strong>
        1. 위 버튼을 눌러 사진을 다운받으세요.<br/>
        2. 다운받은 사진을 public 폴더에 넣으세요.<br/>
        3. App.js 코드를 원래 앱 코드로 되돌리세요!
      </div>
    </div>
  );
}