import React, { useState } from 'react';
import { PhysicalAssessment } from '../types';
import { formatDate } from '../utils';
import { TrendingDown, Activity, Sparkles } from 'lucide-react';

interface EvolutionChartProps {
  assessments: PhysicalAssessment[];
}

export default function EvolutionChart({ assessments = [] }: EvolutionChartProps) {
  const [activeTab, setActiveTab] = useState<'weight' | 'bodyFat' | 'score'>('bodyFat');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (assessments.length === 0) {
    return (
      <div className="bg-slate-950 border border-slate-900 rounded-2xl p-6 text-center text-slate-500 text-xs">
        Sem dados suficientes para processar gráficos de tendência.
      </div>
    );
  }

  // Sort assessments by date ascending to plot nicely
  const sortedAssess = [...assessments].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Setup bounds & parameters for drawing bespoke high-tech SVG Chart
  const width = 600;
  const height = 240;
  const paddingX = 50;
  const paddingY = 40;

  const getChartValues = () => {
    if (activeTab === 'weight') {
      return {
        key: 'weight' as const,
        label: 'Peso Corporal (kg)',
        color: '#ff007f', // pink neon
        unit: 'kg',
        values: sortedAssess.map((a) => a.weight),
      };
    }
    if (activeTab === 'score') {
      return {
        key: 'score' as const,
        label: 'Score Corporal IA (0-100)',
        color: '#39ff14', // green neon
        unit: 'pt',
        values: sortedAssess.map((a) => a.metrics.score),
      };
    }
    return {
      key: 'bodyFat' as const,
      label: 'Percentual de Gordura (%)',
      color: '#00f0ff', // cyan neon
      unit: '%',
      values: sortedAssess.map((a) => a.metrics.bodyFat),
    };
  };

  const currentTab = getChartValues();
  const dataPoints = currentTab.values;

  // Max and min value for custom bounds clipping
  const yMax = Math.max(...dataPoints) * 1.05;
  const yMin = Math.max(0, Math.min(...dataPoints) * 0.9);
  const yRange = yMax - yMin || 1;

  // Translate index and value to SVG coordinates
  const getCoords = (index: number, val: number) => {
    const xStep = (width - paddingX * 2) / (sortedAssess.length - 1 || 1);
    const x = paddingX + index * xStep;
    const yScaled = ((val - yMin) / yRange) * (height - paddingY * 2);
    const y = height - paddingY - yScaled;
    return { x, y };
  };

  // Generate SVG path string with smooth bezier curve
  let pathStr = '';
  let fillPathStr = '';
  
  if (sortedAssess.length > 0) {
    const coords = sortedAssess.map((a, idx) => getCoords(idx, dataPoints[idx]));
    
    // Line Path
    pathStr = coords.reduce((acc, curr, idx) => {
      if (idx === 0) return `M ${curr.x} ${curr.y}`;
      return `${acc} L ${curr.x} ${curr.y}`;
    }, '');

    // Connected Area Under Cover
    fillPathStr = `${pathStr} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`;
  }

  return (
    <div className="bg-[#050814]/90 border border-slate-800/80 rounded-2xl p-4 md:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h4 className="text-sm font-display tracking-wide font-black text-slate-200 uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Tendência de Evolução
          </h4>
          <p className="text-[11px] font-mono text-slate-500">MÉTRICAS DINÂMICAS DETECTADAS NAS FOTOS</p>
        </div>

        {/* Tab Buttons for active metric */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('bodyFat')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-sans transition-all duration-150 ${
              activeTab === 'bodyFat' ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            BF %
          </button>
          <button
            onClick={() => setActiveTab('weight')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-sans transition-all duration-150 ${
              activeTab === 'weight' ? 'bg-slate-800 text-pink-500' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Peso
          </button>
          <button
            onClick={() => setActiveTab('score')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg font-sans transition-all duration-150 ${
              activeTab === 'score' ? 'bg-slate-800 text-green-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Shape Score
          </button>
        </div>
      </div>

      {/* SVG Canvas Chart frame */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto block select-none"
        >
          {/* Defs block with visual neon gradients */}
          <defs>
            <linearGradient id={`gradient-${activeTab}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={currentTab.color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={currentTab.color} stopOpacity="0.0" />
            </linearGradient>
            <filter id="neon-glow">
              <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines horizontal */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = paddingY + ratio * (height - paddingY * 2);
            return (
              <line
                key={idx}
                x1={paddingX}
                y1={y}
                x2={width - paddingX}
                y2={y}
                stroke="#111827"
                strokeWidth="1"
                strokeDasharray="2 3"
              />
            );
          })}

          {/* Connected Cover area shading fill */}
          {fillPathStr && (
            <path d={fillPathStr} fill={`url(#gradient-${activeTab})`} />
          )}

          {/* Main neon outline line */}
          {pathStr && (
            <path
              d={pathStr}
              fill="none"
              stroke={currentTab.color}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#neon-glow)"
            />
          )}

          {/* Coordinate Anchor Points circles */}
          {sortedAssess.map((item, idx) => {
            const val = dataPoints[idx];
            const { x, y } = getCoords(idx, val);
            const isHovered = hoveredIndex === idx;

            return (
              <g
                key={item.id}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="cursor-pointer"
              >
                {/* Invisible hover area buffer */}
                <circle cx={x} cy={y} r="18" fill="transparent" />

                {/* Visible tracking center circle */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? "7" : "4.5"}
                  fill="#030712"
                  stroke={currentTab.color}
                  strokeWidth="2.5"
                  className="transition-all duration-200"
                />

                {/* Small indicator label */}
                <text
                  x={x}
                  y={y - 12}
                  fill={isHovered ? "#ffffff" : "#6b7280"}
                  fontSize={isHovered ? "11" : "9"}
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight={isHovered ? "bold" : "normal"}
                >
                  {val}{currentTab.unit}
                </text>
              </g>
            );
          })}

          {/* X Axis horizontal bottom line */}
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#1f2937"
            strokeWidth="1"
          />

          {/* X Axis Date labels */}
          {sortedAssess.map((item, idx) => {
            const xStep = (width - paddingX * 2) / (sortedAssess.length - 1 || 1);
            const x = paddingX + idx * xStep;

            return (
              <text
                key={item.id}
                x={x}
                y={height - 18}
                fill="#4b5563"
                fontSize="8.5"
                fontFamily="monospace"
                textAnchor="middle"
              >
                {formatDate(item.date).split(' de ')[0]}
              </text>
            );
          })}
        </svg>

        {/* Floating details panel */}
        {hoveredIndex !== null && (
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 bg-slate-900/90 border border-slate-700/80 py-1.5 px-3 rounded-lg text-center backdrop-blur-md">
            <span className="text-[10px] font-mono text-slate-400 capitalize">
              {formatDate(sortedAssess[hoveredIndex].date)}
            </span>
            <div className="text-xs font-mono font-bold text-white mt-0.5">
              {currentTab.label}: <span style={{ color: currentTab.color }}>{dataPoints[hoveredIndex]}{currentTab.unit}</span>
            </div>
          </div>
        )}
      </div>

      {/* Metric comparison highlight */}
      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-900/80 text-center">
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase block">Análise Inicial</span>
          <span className="text-xs font-mono font-bold text-slate-300">
            {dataPoints[0]}{currentTab.unit}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase block">Mais Recente</span>
          <span className="text-xs font-mono font-bold text-cyan-400">
            {dataPoints[dataPoints.length - 1]}{currentTab.unit}
          </span>
        </div>
        <div>
          <span className="text-[9px] font-mono text-slate-500 uppercase block">Total Dif</span>
          <span className={`text-xs font-mono font-bold ${
            (dataPoints[dataPoints.length - 1] - dataPoints[0]) <= 0 ? 'text-green-400' : 'text-amber-400'
          }`}>
            {Number((dataPoints[dataPoints.length - 1] - dataPoints[0]).toFixed(1))}{currentTab.unit}
          </span>
        </div>
      </div>
    </div>
  );
}
