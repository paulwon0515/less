import React, { useState, useEffect } from 'react';
import { UploadCloud, Box, Activity, Image as ImageIcon, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { DEFAULT_SIGN_TYPES, DEFAULT_SETTINGS } from './signTypes';
import { useImageAnalysis, calculateEstimate } from './useImageAnalysis';

export default function CustomerPage() {
  const [dimensions, setDimensions] = useState({ width: '', depth: '' });
  const [signType, setSignType] = useState('A1');
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [signTypes, setSignTypes] = useState(DEFAULT_SIGN_TYPES);
  const [isLoading, setIsLoading] = useState(true);

  const {
    imagePreview,
    isAnalyzing,
    isHovering,
    analysisResult,
    fileInputRef,
    handleImageUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useImageAnalysis();

  // Fetch settings from server on mount
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings) setSettings({ ...DEFAULT_SETTINGS, ...data.settings });
        if (data.signTypes) setSignTypes({ ...DEFAULT_SIGN_TYPES, ...data.signTypes });
      })
      .catch(() => {
        // Fallback to localStorage if server fails
        try {
          const savedSettings = localStorage.getItem('lpss_settings');
          if (savedSettings) setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(savedSettings) });
          const savedTypes = localStorage.getItem('lpss_signTypes');
          if (savedTypes) setSignTypes({ ...DEFAULT_SIGN_TYPES, ...JSON.parse(savedTypes) });
        } catch {}
      })
      .finally(() => setIsLoading(false));
  }, []);

  const { H_mm, finalPrice } = calculateEstimate({
    analysisResult, dimensions, signType, signTypes, settings,
  });

  const typeGroups = {};
  Object.keys(signTypes).forEach((key) => {
    const prefix = key.charAt(0);
    if (!typeGroups[prefix]) typeGroups[prefix] = [];
    typeGroups[prefix].push(key);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-teal-500/30">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              Layered<span className="text-black">&</span> 간판 견적
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">

            {/* Image Upload */}
            <div
              className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
                isHovering ? 'border-teal-500 bg-teal-50' : 'border-slate-300 bg-white hover:bg-slate-50'
              } ${imagePreview ? 'h-64' : 'h-56'} shadow-sm`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isAnalyzing && (
                <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-teal-600">
                  <Activity className="w-8 h-8 animate-pulse mb-3" />
                  <p className="font-medium animate-pulse text-slate-700">이미지 분석 중...</p>
                </div>
              )}
              {imagePreview ? (
                <div className="absolute inset-0 group">
                  <img src={imagePreview} alt="Signage preview" className="w-full h-full object-contain p-4 transition-all duration-300" />
                  <div className="absolute inset-0 bg-white/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-sm">
                    <button onClick={() => fileInputRef.current?.click()} className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full font-medium shadow-sm transition-all flex items-center">
                      <UploadCloud className="w-4 h-4 mr-2 text-teal-600" /> 이미지 변경
                    </button>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-400">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium text-slate-600">간판 이미지를 여기에 드래그 앤 드롭 하세요.</p>
                  <p className="text-xs text-slate-400 mt-1 mb-4">PNG, JPG 포맷 지원</p>
                  <button onClick={() => fileInputRef.current?.click()} className="px-6 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full text-sm font-medium shadow-sm transition-colors">파일 선택</button>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>

            {/* Dimensions */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
                <Box className="w-5 h-5 mr-2 text-teal-500" /> 외곽 크기
              </h3>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">가로 길이</label>
                  <div className="relative">
                    <input type="number" placeholder="0" value={dimensions.width} onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                    <span className="absolute right-4 top-3.5 text-slate-400 text-sm font-medium">cm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">입체 두께</label>
                  <div className="relative">
                    <input type="number" placeholder="0" value={dimensions.depth} onChange={(e) => setDimensions({ ...dimensions, depth: e.target.value })} className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all" />
                    <span className="absolute right-4 top-3.5 text-slate-400 text-sm font-medium">cm</span>
                  </div>
                </div>
              </div>
              {H_mm > 0 && (
                <div className="mt-5 p-3 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">자동 계산된 세로 높이</span>
                  <span className="text-teal-700 font-bold">{(H_mm / 10).toFixed(1)} cm</span>
                </div>
              )}
            </div>

            {/* Sign Type Selection */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6">
              <h3 className="text-lg font-bold text-slate-800 mb-5 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-teal-500" /> 간판 타입
              </h3>
              <div className="space-y-5">
                {Object.entries(typeGroups).map(([prefix, keys]) => (
                  <div key={prefix}>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{prefix} Series</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                      {keys.map((key) => (
                        <button
                          key={key}
                          onClick={() => setSignType(key)}
                          className={`relative p-3 rounded-xl border text-center transition-all duration-200 overflow-hidden ${
                            signType === key
                              ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {signType === key && <div className="absolute top-1 right-1"><CheckCircle2 className="w-4 h-4 text-teal-600" /></div>}
                          <span className={`text-sm font-bold ${signType === key ? 'text-teal-700' : 'text-slate-600'}`}>{key}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Quote Result */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-8 border-b border-slate-100 pb-4">예상 견적</h3>

              <div className="relative z-10 flex flex-col items-center justify-center py-6">
                <div className="text-slate-500 font-medium text-sm mb-2">총 예상 금액</div>
                <div className="text-5xl font-extrabold text-slate-900 mb-2 tracking-tight">
                  {finalPrice > 0 ? `₩${finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '₩0'}
                </div>
                {finalPrice > 0 && (
                  <p className="text-sm text-slate-400 mt-2 font-medium">* 실제 견적은 상담 후 확정됩니다.</p>
                )}
              </div>

              <button
                disabled={finalPrice === 0}
                onClick={() => window.open('http://talk.naver.com/WCD69US', '_blank')}
                className="w-full mt-6 py-4 px-6 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl font-bold shadow-md shadow-slate-900/10 transition-all flex items-center justify-center group cursor-pointer disabled:cursor-not-allowed"
              >
                견적 문의하기
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
