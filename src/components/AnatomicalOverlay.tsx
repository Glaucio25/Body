import React, { useState } from 'react';
import { LandmarkCoordinate } from '../types';
import { Shield, Sparkles } from 'lucide-react';

interface AnatomicalOverlayProps {
  photoUrl?: string;
  landmarks?: LandmarkCoordinate[];
  title: string;
  type: 'front' | 'side' | 'back';
}

export default function AnatomicalOverlay({ photoUrl, landmarks = [], title, type }: AnatomicalOverlayProps) {
  const [hoveredPoint, setHoveredPoint] = useState<LandmarkCoordinate | null>(null);

  if (!photoUrl) {
    return (
      <div className="border border-slate-800 bg-[#070b1e]/60 rounded-xl aspect-[3/4] flex flex-col items-center justify-center text-center p-4">
        <p className="text-slate-500 font-sans text-sm">Foto de {title} não enviada</p>
      </div>
    );
  }

  // Choose bullet colors depending on type
  const getDotColor = () => {
    if (type === 'front') return 'bg-cyan-400 shadow-cyan-400/80 border-cyan-200';
    if (type === 'side') return 'bg-pink-500 shadow-pink-500/80 border-pink-200';
    return 'bg-purple-500 shadow-purple-500/80 border-purple-200';
  };

  const getOverlayColor = () => {
    if (type === 'front') return 'border-cyan-500/20 bg-cyan-500/5';
    if (type === 'side') return 'border-pink-500/20 bg-pink-500/5';
    return 'border-purple-500/20 bg-purple-500/5';
  };

  return (
    <div className="relative border border-slate-800 bg-slate-950 rounded-2xl overflow-hidden shadow-2xl group transition-all duration-300 hover:border-slate-700">
      {/* Title Header Tag */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 bg-slate-900/85 backdrop-blur-md rounded-full border border-slate-700 text-[10px] font-mono tracking-widest text-slate-300 uppercase">
        <Sparkles className="w-3 h-3 text-cyan-400" />
        {title}
      </div>

      {/* Cyberpunk Alignment Frame */}
      <div className={`absolute inset-4 pointer-events-none rounded-xl border border-dashed transition-colors duration-300 group-hover:border-slate-600 ${getOverlayColor()}`}>
        {/* Alignment corner guides */}
        <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-cyan-400" />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
      </div>

      {/* Actual Photo Visual */}
      <div className="w-full relative select-none">
        <img
          src={photoUrl}
          alt={`Visualidade ${title}`}
          className="w-full h-auto aspect-[3/4] object-contain block bg-[#03050c]"
          referrerPolicy="no-referrer"
        />

        {/* Vision Detection Scanning Horizontal Line */}
        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent shadow-[0_0_10px_rgba(0,240,255,0.6)] animate-[bounce_5s_infinite_ease-in-out] pointer-events-none" />

        {/* SVG/HTML Anatomical Landmarks Layer */}
        {landmarks.map((pt, idx) => (
          <div
            key={idx}
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-crosshair z-20 group/point"
            style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
            onMouseEnter={() => setHoveredPoint(pt)}
            onMouseLeave={() => setHoveredPoint(null)}
          >
            {/* Glowing Coordinate Dot */}
            <div className={`w-3 h-3 rounded-full border shadow-lg transition-transform duration-200 group-hover/point:scale-150 ${getDotColor()}`} />
            
            {/* Compass ripple ring */}
            <div className="absolute -inset-1.5 border border-white/20 rounded-full animate-ping pointer-events-none opacity-40 group-hover/point:opacity-100" />
          </div>
        ))}

        {/* Hovered Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute z-30 px-3 py-1.5 bg-slate-900/90 border border-slate-700 rounded-lg shadow-xl text-center backdrop-blur-md -translate-y-12 -translate-x-1/2 pointer-events-none transition-all duration-200"
            style={{ left: `${hoveredPoint.x}%`, top: `${hoveredPoint.y}%` }}
          >
            <p className="text-[10px] font-mono tracking-wider text-cyan-400 uppercase font-semibold">
              {hoveredPoint.label}
            </p>
            <p className="text-[9px] font-mono text-slate-400">
              X: {hoveredPoint.x}% | Y: {hoveredPoint.y}%
            </p>
          </div>
        )}
      </div>

      {/* Calibration Metadata Footer info block */}
      <div className="p-3 bg-[#060a16] border-t border-slate-800/80 flex justify-between items-center text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-cyan-400/80" />
          BIO-SCANNED
        </span>
        <span>POINTS: {landmarks.length} ACTIVE</span>
      </div>
    </div>
  );
}
