import React, { useState, useRef } from 'react';
import { PhysicalAssessment } from '../types';
import { formatDate } from '../utils';
import { Columns, Split, Eye, Layers } from 'lucide-react';

interface ComparisonSliderProps {
  assessments: PhysicalAssessment[];
  selectedLeftId?: string;
  selectedRightId?: string;
  onSetLeftId: (id: string) => void;
  onSetRightId: (id: string) => void;
}

export default function ComparisonSlider({
  assessments = [],
  selectedLeftId,
  selectedRightId,
  onSetLeftId,
  onSetRightId,
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [photoType, setPhotoType] = useState<'front' | 'side' | 'back'>('front');
  const [showOverlays, setShowOverlays] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);

  const leftAssess = assessments.find((a) => a.id === selectedLeftId) || assessments[0];
  const rightAssess = assessments.find((a) => a.id === selectedRightId) || assessments[assessments.length - 1];

  if (assessments.length === 0) {
    return (
      <div className="border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-500">
        Nenhum registro disponível para comparação. Registre fotos ou use o preset do Treinador para testar!
      </div>
    );
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (touchX / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (mouseX / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const leftPhoto = leftAssess?.photos?.[photoType];
  const rightPhoto = rightAssess?.photos?.[photoType];

  return (
    <div className="bg-[#050814]/90 border border-slate-800/80 rounded-2xl p-4 md:p-6 shadow-xl">
      {/* Photo Selector & Comparison Mode Ribbon */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6 border-b border-slate-800/60 pb-5">
        
        {/* Photo orientation buttons */}
        <div className="flex bg-slate-950 p-1.5 rounded-xl border border-slate-800">
          {(['front', 'side', 'back'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setPhotoType(t)}
              className={`px-4 py-2 text-xs font-semibold rounded-lg font-sans transition-all duration-200 capitalize ${
                photoType === t
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t === 'front' ? 'Frente' : t === 'side' ? 'Perfil' : 'Costas'}
            </button>
          ))}
        </div>

        {/* View Mode & Overlays Switches */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all duration-200 ${
              showOverlays
                ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400'
                : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-300'
            }`}
            title="Mostrar pontos de visão computacional"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden md:inline">Pontos IA</span>
          </button>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('slider')}
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 ${
                viewMode === 'slider' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Split className="w-4 h-4" />
              <span>Deslizar</span>
            </button>
            <button
              onClick={() => setViewMode('side-by-side')}
              className={`p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 ${
                viewMode === 'side-by-side' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Lado a Lado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Target Assessments Pickers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Left Assess select */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Registro Base (Passado / Antes)</span>
          <select
            value={selectedLeftId}
            onChange={(e) => onSetLeftId(e.target.value)}
            className="bg-transparent border-none text-sm text-slate-200 font-sans font-medium focus:ring-0 cursor-pointer w-full"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900 border-none">
                {formatDate(a.date)} ({a.weight}kg) - BF: {a.metrics.bodyFat}%
              </option>
            ))}
          </select>
        </div>

        {/* Right Assess select */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col gap-1.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Registro Atual (Depois / Evolução)</span>
          <select
            value={selectedRightId}
            onChange={(e) => onSetRightId(e.target.value)}
            className="bg-transparent border-none text-sm text-slate-200 font-sans font-medium focus:ring-0 cursor-pointer w-full"
          >
            {assessments.map((a) => (
              <option key={a.id} value={a.id} className="bg-slate-900 border-none">
                {formatDate(a.date)} ({a.weight}kg) - BF: {a.metrics.bodyFat}%
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Primary Rendering Arena */}
      <div className="flex flex-col items-center">
        {viewMode === 'slider' ? (
          <div
            ref={containerRef}
            className="w-full max-w-lg relative select-none rounded-2xl overflow-hidden aspect-[3/4] border border-slate-800 shadow-2xl cursor-ew-resize bg-[#030612]"
            onMouseMove={handleMouseMove}
            onTouchMove={handleTouchMove}
          >
            {/* Base Background: Right Photo (Current/After) */}
            <div className="absolute inset-0 w-full h-full">
              {rightPhoto ? (
                <>
                  <img
                    src={rightPhoto}
                    alt="Depois"
                    className="w-full h-full object-contain bg-[#030612]"
                    referrerPolicy="no-referrer"
                  />
                  {showOverlays && rightAssess?.landmarks?.[photoType] && 
                    rightAssess.landmarks[photoType].map((pt, i) => (
                      <div
                        key={i}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-cyan-400 border border-white rounded-full shadow-[0_0_8px_#00f0ff] pointer-events-none"
                        style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                      />
                    ))
                  }
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950 font-sans">
                  Nenhuma foto atual disponível
                </div>
              )}
              {/* Badge: Depois */}
              <div className="absolute bottom-4 right-4 bg-indigo-600/95 backdrop-blur-md border border-indigo-400/30 text-[10px] font-mono tracking-widest px-3 py-1 text-white rounded-md">
                DEPOIS: {formatDate(rightAssess?.date || "")}
              </div>
            </div>

            {/* Clipping Layer: Left Photo (Before/Original) */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${sliderPosition}%` }}
            >
              <div className="absolute inset-0 w-[400px] h-[533px] sm:w-[512px] sm:h-[682px] min-w-[320px] max-w-[200vw]" style={{ width: containerRef.current?.clientWidth || '100%', height: '100%' }}>
                {leftPhoto ? (
                  <>
                    <img
                      src={leftPhoto}
                      alt="Antes"
                      className="w-full h-full object-contain bg-[#030612]"
                      referrerPolicy="no-referrer"
                    />
                    {showOverlays && leftAssess?.landmarks?.[photoType] && 
                      leftAssess.landmarks[photoType].map((pt, i) => (
                        <div
                          key={i}
                          className="absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-pink-500 border border-white rounded-full shadow-[0_0_8px_#ff007f] pointer-events-none"
                          style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                        />
                      ))
                    }
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950 font-sans">
                    Nenhuma foto anterior disponível
                  </div>
                )}
                {/* Badge: Antes */}
                <div className="absolute bottom-4 left-4 bg-slate-900/90 backdrop-blur-md border border-slate-700 text-[10px] font-mono tracking-widest px-3 py-1 text-slate-300 rounded-md">
                  ANTES: {formatDate(leftAssess?.date || "")}
                </div>
              </div>
            </div>

            {/* Visual Slidable Split handle */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-cyan-400 cursor-ew-resize shadow-[0_0_15px_#00f0ff]"
              style={{ left: `${sliderPosition}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 bg-slate-900 border border-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.5)] rounded-full flex items-center justify-center">
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-3 bg-cyan-400 rounded-full" />
                  <div className="w-0.5 h-3 bg-cyan-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Side-by-side Layout and comparison cards */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            {/* Left Frame before */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] border border-slate-800 bg-[#030612]/30">
              {leftPhoto ? (
                <>
                  <img src={leftPhoto} alt="Antes" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  {showOverlays && leftAssess?.landmarks?.[photoType] && 
                    leftAssess.landmarks[photoType].map((pt, i) => (
                      <div
                        key={i}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-pink-500 border border-white rounded-full pointer-events-none"
                        style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                      />
                    ))
                  }
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950">Foto indisponível</div>
              )}
              <div className="absolute top-3 left-3 bg-slate-900/90 text-[9px] font-mono px-2.5 py-1 text-slate-300 border border-slate-700/80 rounded-md">
                ANTES: {formatDate(leftAssess?.date || "")}
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2.5 py-1.5 text-[10px] font-mono text-slate-400 rounded-lg">
                BF: <span className="text-pink-400 font-bold">{leftAssess?.metrics.bodyFat}%</span>
              </div>
            </div>

            {/* Right Frame after */}
            <div className="relative rounded-2xl overflow-hidden aspect-[3/4] border border-slate-800 bg-[#030612]/30">
              {rightPhoto ? (
                <>
                  <img src={rightPhoto} alt="Depois" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  {showOverlays && rightAssess?.landmarks?.[photoType] && 
                    rightAssess.landmarks[photoType].map((pt, i) => (
                      <div
                        key={i}
                        className="absolute -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-cyan-400 border border-white rounded-full pointer-events-none"
                        style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                      />
                    ))
                  }
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-950">Foto indisponível</div>
              )}
              <div className="absolute top-3 left-3 bg-indigo-600/90 text-[9px] font-mono px-2.5 py-1 text-white border border-indigo-400/40 rounded-md">
                DEPOIS: {formatDate(rightAssess?.date || "")}
              </div>
              <div className="absolute bottom-3 left-3 bg-slate-950/80 px-2.5 py-1.5 text-[10px] font-mono text-slate-400 rounded-lg">
                BF: <span className="text-cyan-400 font-bold">{rightAssess?.metrics.bodyFat}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Brief comparative summary */}
      {rightAssess?.evolution && (
        <div className="mt-6 p-4 bg-slate-950 border border-slate-800/80 rounded-xl flex items-start gap-3">
          <Eye className="w-5 h-5 text-cyan-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-mono text-cyan-400 uppercase tracking-widest font-semibold mb-1">
              Diferencial IA Autodetectado
            </p>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {rightAssess.evolution.summary}
            </p>
            {rightAssess.evolution.weightDiff !== undefined && (
              <div className="flex gap-4 mt-2 text-[10px] font-mono">
                <span>Peso: <span className={rightAssess.evolution.weightDiff <= 0 ? 'text-green-400 font-bold' : 'text-amber-400 font-bold'}>
                  {rightAssess.evolution.weightDiff > 0 ? `+${rightAssess.evolution.weightDiff}` : rightAssess.evolution.weightDiff} kg
                </span></span>
                <span>Gordura Estimada: <span className={rightAssess.evolution.bodyFatDiff !== undefined && rightAssess.evolution.bodyFatDiff <= 0 ? 'text-green-400 font-bold' : 'text-slate-400'}>
                  {rightAssess.evolution.bodyFatDiff !== undefined && rightAssess.evolution.bodyFatDiff > 0 ? `+${rightAssess.evolution.bodyFatDiff}` : rightAssess.evolution.bodyFatDiff}%
                </span></span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
