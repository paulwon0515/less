import { useState, useRef } from 'react';

export function useImageAnalysis() {
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [processedImagePreview, setProcessedImagePreview] = useState(null);
  const [showProcessedOverlay, setShowProcessedOverlay] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  const [analysisResult, setAnalysisResult] = useState({
    bboxWidth: 0,
    bboxHeight: 0,
    pixelArea: 0,
    pixelPerimeter: 0,
    isValid: false,
  });

  const fileInputRef = useRef(null);

  const analyzeImage = (dataUrl) => {
    setIsAnalyzing(true);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const MAX_SIZE = 800;
      let scale = 1;
      if (img.width > MAX_SIZE || img.height > MAX_SIZE) {
        scale = Math.min(MAX_SIZE / img.width, MAX_SIZE / img.height);
      }

      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      let minX = canvas.width, maxX = 0, minY = canvas.height, maxY = 0;

      const isWhiteOrTransparent = (idx) => {
        const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
        return a < 20 || (r > 240 && g > 240 && b > 240 && a > 200);
      };

      const w_px = canvas.width;
      const h_px = canvas.height;
      const isBg = new Uint8Array(w_px * h_px);

      const q = new Uint32Array(w_px * h_px);
      let qHead = 0;
      let qTail = 0;

      for (let y = 0; y < h_px; y++) {
        for (let x = 0; x < w_px; x++) {
          if (x === 0 || x === w_px - 1 || y === 0 || y === h_px - 1) {
            const pos = y * w_px + x;
            if (isWhiteOrTransparent(pos * 4)) {
              isBg[pos] = 1;
              q[qTail++] = pos;
            }
          }
        }
      }

      while (qHead < qTail) {
        const p = q[qHead++];
        const y = Math.floor(p / w_px);
        const x = p % w_px;

        if (x > 0) { const nPos = p - 1; if (isBg[nPos] === 0 && isWhiteOrTransparent(nPos * 4)) { isBg[nPos] = 1; q[qTail++] = nPos; } }
        if (x < w_px - 1) { const nPos = p + 1; if (isBg[nPos] === 0 && isWhiteOrTransparent(nPos * 4)) { isBg[nPos] = 1; q[qTail++] = nPos; } }
        if (y > 0) { const nPos = p - w_px; if (isBg[nPos] === 0 && isWhiteOrTransparent(nPos * 4)) { isBg[nPos] = 1; q[qTail++] = nPos; } }
        if (y < h_px - 1) { const nPos = p + w_px; if (isBg[nPos] === 0 && isWhiteOrTransparent(nPos * 4)) { isBg[nPos] = 1; q[qTail++] = nPos; } }
      }

      for (let y = 0; y < h_px; y++) {
        for (let x = 0; x < w_px; x++) {
          if (isBg[y * w_px + x] === 0) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      let foregroundCount = 0;
      let perimeterCount = 0;

      if (maxX >= minX && maxY >= minY) {
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = canvas.width;
        overlayCanvas.height = canvas.height;
        const oCtx = overlayCanvas.getContext('2d');

        oCtx.drawImage(canvas, 0, 0);
        oCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        oCtx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);

        const oImageData = oCtx.getImageData(0, 0, overlayCanvas.width, overlayCanvas.height);
        const oData = oImageData.data;

        for (let y = minY; y <= maxY; y++) {
          for (let x = minX; x <= maxX; x++) {
            const pos = y * w_px + x;
            if (isBg[pos] === 0) {
              foregroundCount++;

              const oPos = pos * 4;
              oData[oPos] = data[oPos];
              oData[oPos + 1] = Math.min(255, data[oPos + 1] * 0.8 + 80);
              oData[oPos + 2] = data[oPos + 2];
              oData[oPos + 3] = 255;

              if (x === 0 || x === w_px - 1 || y === 0 || y === h_px - 1) {
                perimeterCount++;
              } else {
                if (isBg[pos - 1] === 1 || isBg[pos + 1] === 1 || isBg[pos - w_px] === 1 || isBg[pos + w_px] === 1) {
                  perimeterCount++;
                }
              }
            }
          }
        }

        oCtx.putImageData(oImageData, 0, 0);
        oCtx.strokeStyle = '#22c55e';
        oCtx.lineWidth = Math.max(2, Math.floor(canvas.width / 200));
        oCtx.setLineDash([10, 5]);
        oCtx.strokeRect(minX, minY, maxX - minX, maxY - minY);

        setProcessedImagePreview(overlayCanvas.toDataURL());

        setAnalysisResult({
          bboxWidth: maxX - minX + 1,
          bboxHeight: maxY - minY + 1,
          pixelArea: foregroundCount,
          pixelPerimeter: perimeterCount,
          isValid: true,
        });
      } else {
        setAnalysisResult({ isValid: false });
        setProcessedImagePreview(null);
      }

      setIsAnalyzing(false);
    };
    img.src = dataUrl;
  };

  const processFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
        setProcessedImagePreview(null);
        analyzeImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e) => { processFile(e.target.files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setIsHovering(true); };
  const handleDragLeave = () => { setIsHovering(false); };
  const handleDrop = (e) => { e.preventDefault(); setIsHovering(false); processFile(e.dataTransfer.files[0]); };

  return {
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
  };
}

// Shared calculation function
export function calculateEstimate({ analysisResult, dimensions, signType, signTypes, settings }) {
  const w = parseFloat(dimensions.width) || 0;
  const d = parseFloat(dimensions.depth) || 0;
  const W_mm = w * 10;
  const D_mm = d * 10;

  let H_mm = 0;
  if (analysisResult.isValid && W_mm > 0) {
    H_mm = W_mm * (analysisResult.bboxHeight / analysisResult.bboxWidth);
  }

  let timeMinutes = 0;
  let estimatedWeight_g = 0;
  let pureArea_cm2 = 0;

  if (analysisResult.isValid && W_mm > 0 && H_mm > 0 && D_mm > 0) {
    const pixelSize = Math.max(W_mm / analysisResult.bboxWidth, H_mm / analysisResult.bboxHeight);
    const Area_mm2 = analysisResult.pixelArea * (pixelSize * pixelSize);
    pureArea_cm2 = Area_mm2 / 100;

    const depth_cm = D_mm / 10;
    const boundingVolume_cm3 = pureArea_cm2 * depth_cm;
    estimatedWeight_g = boundingVolume_cm3 * settings.filamentDensity * settings.fillFactor * settings.weightBuffer;

    timeMinutes = (estimatedWeight_g * settings.timePerGram) + settings.setupTime;
  }

  const typeCostPerHour = signTypes[signType]?.costPerHour || 0;
  const timeCost = (timeMinutes / 60) * typeCostPerHour;
  const materialCost = estimatedWeight_g * settings.filamentPricePerGram;
  const finalPrice = timeCost + materialCost;

  return {
    H_mm,
    timeMinutes,
    estimatedWeight_g,
    pureArea_cm2,
    timeCost,
    materialCost,
    finalPrice,
  };
}
