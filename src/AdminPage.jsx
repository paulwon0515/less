import React, { useState, useEffect } from 'react';
import { UploadCloud, Settings, Box, Clock, Activity, Image as ImageIcon, CheckCircle2, ChevronRight, Zap, Save, ArrowLeft } from 'lucide-react';
import { DEFAULT_SIGN_TYPES, DEFAULT_SETTINGS } from './signTypes';
import { useImageAnalysis, calculateEstimate } from './useImageAnalysis';

export default function AdminPage() {
  const [dimensions, setDimensions] = useState({ width: '', depth: '' });
  const [signType, setSignType] = useState('A1');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [saveFlash, setSaveFlash] = useState(false);

  // Load persisted settings or defaults
  const loadSettings = () => {
    try {
      const saved = localStorage.getItem('lpss_settings');
      return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
    } catch { return { ...DEFAULT_SETTINGS }; }
  };

  const loadSignTypes = () => {
    try {
      const saved = localStorage.getItem('lpss_signTypes');
      return saved ? { ...DEFAULT_SIGN_TYPES, ...JSON.parse(saved) } : { ...DEFAULT_SIGN_TYPES };
    } catch { return { ...DEFAULT_SIGN_TYPES }; }
  };

  const [settings, setSettings] = useState(loadSettings);
  const [signTypes, setSignTypes] = useState(loadSignTypes);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateTypeCost = (key, value) => {
    setSignTypes((prev) => ({
      ...prev,
      [key]: { ...prev[key], costPerHour: Number(value) },
    }));
  };

  const saveAll = () => {
    localStorage.setItem('lpss_settings', JSON.stringify(settings));
    localStorage.setItem('lpss_signTypes', JSON.stringify(signTypes));
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1500);
  };

  const {
    imagePreview,
    isAnalyzing,
    processedImagePreview,
    showProcessedOverlay,
    setShowProcessedOverlay,
    isHovering,
    analysisResult,
    fileInputRef,
    handleImageUpload,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  } = useImageAnalysis();

  const result = calculateEstimate({
    analysisResult, dimensions, signType, signTypes, settings,
  });

  const { H_mm, timeMinutes, estimatedWeight_g, pureArea_cm2, timeCost, materialCost, finalPrice } = result;

  // Group types by letter prefix
  const typeGroups = {};
  Object.keys(signTypes).forEach((key) => {
    const prefix = key.charAt(0);
    if (!typeGroups[prefix]) typeGroups[prefix] = [];
    typeGroups[prefix].push(key);
  });

  return (
    <div className="min-h-screen bg-[#0f1115] text-gray-200 font-sans selection:bg-blue-500/30">
      <header className="sticky top-0 z-50 bg-[#0f1115]/80 backdrop-blur-md border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <a href="#/" className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </a>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-600 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Settings className="text-white w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-100 to-gray-400 tracking-tight">
              LPSS <span className="text-orange-400">Admin</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              className={`p-2 rounded-full transition-colors ${isSettingsOpen ? 'bg-orange-500/10 text-orange-400' : 'hover:bg-gray-800 text-gray-400 hover:text-white'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={saveAll}
              className={`px-4 py-2 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
                saveFlash
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30'
                  : 'bg-orange-500/10 text-orange-400 border border-orange-500/30 hover:bg-orange-500/20'
              }`}
            >
              <Save className="w-4 h-4" />
              {saveFlash ? '저장 완료!' : '설정 저장'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Settings Panel */}
        {isSettingsOpen && (
          <div className="mb-8 p-6 bg-gray-900/50 border border-gray-800 rounded-2xl backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Settings className="w-5 h-5 mr-2 text-orange-400" />
              하이브리드 엔진 세팅
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">채움 계수 (Fill Factor)</label>
                <input type="number" step="0.01" value={settings.fillFactor} onChange={(e) => updateSetting('fillFactor', Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-orange-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">무게 여유분 (Buffer)</label>
                <input type="number" step="0.01" value={settings.weightBuffer} onChange={(e) => updateSetting('weightBuffer', Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-orange-500 outline-none text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">g당 소요 시간</label>
                <div className="relative">
                  <input type="number" step="0.01" value={settings.timePerGram} onChange={(e) => updateSetting('timePerGram', Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-orange-500 outline-none text-sm" />
                  <span className="absolute right-3 top-2.5 text-gray-600 text-xs">분</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">준비 시간 (Setup)</label>
                <div className="relative">
                  <input type="number" value={settings.setupTime} onChange={(e) => updateSetting('setupTime', Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-orange-500 outline-none text-sm" />
                  <span className="absolute right-3 top-2.5 text-gray-600 text-xs">분</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">필라멘트 밀도</label>
                <div className="relative">
                  <input type="number" step="0.01" value={settings.filamentDensity} onChange={(e) => updateSetting('filamentDensity', Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-orange-500 outline-none text-sm" />
                  <span className="absolute right-3 top-2.5 text-gray-600 text-xs">g/cm³</span>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">재료 단가 (Cost/g)</label>
                <div className="relative">
                  <input type="number" value={settings.filamentPricePerGram} onChange={(e) => updateSetting('filamentPricePerGram', Number(e.target.value))} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-white focus:ring-1 focus:ring-orange-500 outline-none text-sm" />
                  <span className="absolute right-3 top-2.5 text-gray-600 text-xs">₩</span>
                </div>
              </div>
            </div>

            {/* Type Cost Editor */}
            <h3 className="text-sm font-semibold text-gray-300 mb-3 mt-6 uppercase tracking-wider">타입별 시간당 비용 편집</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {Object.entries(signTypes).map(([key, { costPerHour }]) => (
                <div key={key} className="bg-gray-950 border border-gray-800 rounded-xl p-3">
                  <label className="block text-xs font-bold text-orange-400 mb-1.5">{key}</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="1000"
                      value={costPerHour}
                      onChange={(e) => updateTypeCost(key, e.target.value)}
                      className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2 py-1.5 text-white focus:ring-1 focus:ring-orange-500 outline-none text-sm"
                    />
                    <span className="absolute right-2 top-2 text-gray-600 text-xs">₩/h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 space-y-6">

            {/* Image Upload with overlay toggle */}
            <div
              className={`relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ${
                isHovering ? 'border-orange-500 bg-orange-500/5' : 'border-gray-800 bg-gray-900/30 hover:bg-gray-900/50'
              } ${imagePreview ? 'h-64' : 'h-48'}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {isAnalyzing && (
                <div className="absolute inset-0 z-20 bg-gray-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-orange-400">
                  <Activity className="w-8 h-8 animate-pulse mb-3" />
                  <p className="font-medium animate-pulse">이미지 분석 중...</p>
                </div>
              )}
              {imagePreview ? (
                <div className="absolute inset-0 group">
                  <img src={showProcessedOverlay && processedImagePreview ? processedImagePreview : imagePreview} alt="Signage preview" className="w-full h-full object-contain p-4 transition-all duration-300" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300 backdrop-blur-sm gap-4">
                    <div className="flex gap-3">
                      {processedImagePreview && (
                        <button onClick={(e) => { e.stopPropagation(); setShowProcessedOverlay(!showProcessedOverlay); }} className="px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-full font-medium text-sm backdrop-blur-md transition-all flex items-center">
                          <Activity className="w-4 h-4 mr-1.5" /> {showProcessedOverlay ? '원본' : '인식 범위'}
                        </button>
                      )}
                      <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium text-sm backdrop-blur-md transition-all flex items-center">
                        <UploadCloud className="w-4 h-4 mr-1.5" /> 변경
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-4 text-gray-500">
                    <ImageIcon className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium text-gray-300">간판 이미지를 드래그 앤 드롭 하세요.</p>
                  <button onClick={() => fileInputRef.current?.click()} className="mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-full text-sm font-medium transition-colors">파일 선택</button>
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
            </div>

            {/* Dimensions */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <Box className="w-5 h-5 mr-2 text-orange-500" /> 외곽 크기 (Bounding Box)
                </h3>
                {pureArea_cm2 > 0 && (
                  <span className="px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-lg text-sm font-medium">
                    순수 단면적: {pureArea_cm2.toLocaleString(undefined, { maximumFractionDigits: 1 })} cm²
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">가로 길이 (Width)</label>
                  <div className="relative">
                    <input type="number" placeholder="0" value={dimensions.width} onChange={(e) => setDimensions({ ...dimensions, width: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 outline-none" />
                    <span className="absolute right-4 top-3.5 text-gray-600 text-sm">cm</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wider">입체 두께 (Depth)</label>
                  <div className="relative">
                    <input type="number" placeholder="0" value={dimensions.depth} onChange={(e) => setDimensions({ ...dimensions, depth: e.target.value })} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-orange-500/50 outline-none" />
                    <span className="absolute right-4 top-3.5 text-gray-600 text-sm">cm</span>
                  </div>
                </div>
              </div>
              {H_mm > 0 && (
                <div className="mt-4 p-3 bg-gray-950/50 rounded-xl border border-gray-800 flex justify-between items-center text-sm">
                  <span className="text-gray-400">자동 계산된 세로 높이 (Auto Height)</span>
                  <span className="text-gray-300 font-medium">{(H_mm / 10).toFixed(1)} cm</span>
                </div>
              )}
            </div>

            {/* Sign Type Selection — with cost info */}
            <div className="bg-gray-900/30 border border-gray-800 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-5 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-teal-400" /> 간판 타입 (시간당 비용)
              </h3>
              <div className="space-y-4">
                {Object.entries(typeGroups).map(([prefix, keys]) => (
                  <div key={prefix}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{prefix} Series</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {keys.map((key) => (
                        <button
                          key={key}
                          onClick={() => setSignType(key)}
                          className={`relative p-3 rounded-xl border text-left transition-all duration-200 flex flex-col items-start overflow-hidden ${
                            signType === key
                              ? 'bg-orange-500/10 border-orange-500 ring-1 ring-orange-500'
                              : 'bg-gray-950 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          {signType === key && <div className="absolute top-1 right-1"><CheckCircle2 className="w-3.5 h-3.5 text-orange-500" /></div>}
                          <span className={`text-sm font-bold ${signType === key ? 'text-orange-400' : 'text-gray-300'}`}>{key}</span>
                          <span className="text-xs text-gray-500">₩{signTypes[key].costPerHour.toLocaleString()}/h</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Detailed Quote Result */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-gradient-to-b from-gray-900 to-[#0c0d10] border border-gray-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-6">Admin Estimated Quote</h3>

              <div className="space-y-4 relative z-10">

                {analysisResult.isValid && (
                  <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                    <div className="flex justify-between items-center bg-orange-500/5 p-3 rounded-xl border border-orange-500/10">
                      <div className="flex items-center text-orange-400/80">
                        <Clock className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Est. Print Time</span>
                      </div>
                      <div className="text-orange-400 font-semibold">
                        {timeMinutes > 0 ? `${Math.floor(timeMinutes / 60)}h ${Math.floor(timeMinutes % 60)}m` : '0h 0m'}
                      </div>
                    </div>
                  </div>
                )}

                {estimatedWeight_g > 0 && (
                  <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50 flex justify-between items-center">
                    <div className="flex items-center text-gray-400">
                      <Box className="w-4 h-4 mr-2" />
                      <span className="text-sm font-medium">Estimated Weight</span>
                    </div>
                    <div className="text-lg font-semibold text-white">
                      {estimatedWeight_g.toLocaleString(undefined, { maximumFractionDigits: 1 })} <span className="text-sm text-gray-500 font-normal">g</span>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-800">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-gray-400 font-medium text-sm">출력 시간 비용 (₩{signTypes[signType]?.costPerHour.toLocaleString()}/h)</span>
                    <span className="text-gray-300">₩{timeCost > 0 ? timeCost.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}</span>
                  </div>
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-gray-400 font-medium text-sm">재료 비용 (Material Cost)</span>
                    <span className="text-gray-300">₩{materialCost > 0 ? materialCost.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}</span>
                  </div>

                  <div className="flex justify-between items-end pt-4 border-t border-gray-800/50">
                    <div className="text-gray-500 font-medium text-sm">Total Price</div>
                    <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-amber-300">
                      ₩{finalPrice > 0 ? finalPrice.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '0'}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
