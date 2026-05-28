import React, { useState } from 'react';
import { Sparkles, Check, Flame, Zap, Award, Info } from 'lucide-react';

interface PremiumGateProps {
  isPremium: boolean;
  onUnlockPremium: () => void;
}

export default function PremiumGate({ isPremium, onUnlockPremium }: PremiumGateProps) {
  const [days, setDays] = useState(0);

  // Dynamic simulation values based on morph slider (Days 0 to 90)
  const muscleProgress = +(1.2 + (days / 90) * 4.8).toFixed(1); // Gain up to 6.0kg muscle
  const fatReduction = +(2.0 + (days / 90) * 8.5).toFixed(1); // Lose up to 10.5% body fat
  const postureRating = days >= 60 ? 'Excelente (100% Alinhado)' : days >= 30 ? 'Muito Bom' : 'Regular (Melhorando)';

  return (
    <div className="space-y-8">
      {/* Simulation Playground Panel: "Como vou ficar em 3 meses" */}
      <div className="bg-[#040816] border border-cyan-500/30 rounded-2xl p-5 md:p-6 shadow-[0_0_20px_rgba(0,240,255,0.1)] relative overflow-hidden">
        {/* Glow grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#091026_1px,transparent_1px),linear-gradient(to_bottom,#091026_1px,transparent_1px)] bg-[size:24px_24px] opacity-25" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-[10px] font-mono tracking-widest uppercase border border-cyan-500/30 rounded">Simulador Avançado</span>
            <span className="p-1 px-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded text-[8.5px] font-mono font-black tracking-widest uppercase">PREMONITY IA</span>
          </div>
          
          <h3 className="text-xl font-display font-black text-slate-100 uppercase tracking-tight">
            Como eu vou ficar em <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400">90 dias?</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Arraste o cursor abaixo para simular a projeção visual e estrutural de evolução recomendada pela IA.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Morphing Interactive SVG Model preview */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-xl flex flex-col items-center justify-center select-none aspect-video md:aspect-[4/3]">
              <span className="text-[9px] font-mono text-slate-500 mb-2">MODELAÇÃO VOLUMÉTRICA IA - DIA {days}</span>
              
              <svg viewBox="0 0 200 240" className="w-full max-w-[140px] h-auto drop-shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                <defs>
                  <radialGradient id="simGrad" cx="50%" cy="40%" r="50%">
                    <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#bd00ff" stopOpacity="0.2" />
                  </radialGradient>
                </defs>
                {/* Simulated human node lines morphing depending on days */}
                <g fill="none" stroke="#00f0ff" strokeWidth="1.5">
                  {/* Spine connection */}
                  <line x1="100" y1="50" x2="100" y2="150" stroke="#ff007f" strokeDasharray="3 3" />
                  
                  {/* Left Shoulder: gets wider based on muscle gain days */}
                  <line x1="100" y1="80" x2={55 - (days/90)*8} y2="80" />
                  {/* Right Shoulder */}
                  <line x1="100" y1="80" x2={145 + (days/90)*8} y2="80" />

                  {/* Left waist: gets narrower based on fat loss days */}
                  <line x1="100" y1="125" x2={68 + (days/90)*6} y2="125" />
                  {/* Right waist */}
                  <line x1="100" y1="125" x2={132 - (days/90)*6} y2="125" />

                  {/* Pelvis hips */}
                  <line x1="100" y1="150" x2="70" y2="150" />
                  <line x1="100" y1="150" x2="130" y2="150" />

                  {/* Left Leg */}
                  <line x1="70" y1="150" x2={65 - (days/90)*1.2} y2="210" />
                  {/* Right Leg */}
                  <line x1="130" y1="150" x2={135 + (days/90)*1.2} y2="210" />
                </g>

                {/* Simulated head */}
                <circle cx="100" cy="45" r="16" fill="#040816" stroke="#00f0ff" strokeWidth="2" />
                
                {/* Joint nodes */}
                <circle cx={55 - (days/90)*8} cy="80" r="4.5" fill="#39ff14" />
                <circle cx={145 + (days/90)*8} cy="80" r="4.5" fill="#39ff14" />
                <circle cx={68 + (days/90)*6} cy="125" r="4" fill="#00f0ff" />
                <circle cx={132 - (days/90)*6} cy="125" r="4" fill="#00f0ff" />
                <circle cx="70" cy="150" r="4.5" fill="#bd00ff" />
                <circle cx="130" cy="150" r="4.5" fill="#bd00ff" />
              </svg>
            </div>

            {/* Projection metrics panel */}
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Músculo Estimado</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-mono font-bold text-green-400">+{muscleProgress}</span>
                  <span className="text-xs font-mono text-slate-400">kg de massa magra</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Gordura Corporal</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-xl font-mono font-bold text-cyan-400">-{fatReduction}</span>
                  <span className="text-xs font-mono text-slate-400">% de percentual adiposo</span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl">
                <span className="text-[10px] font-mono text-slate-500 uppercase">Alinhamento Postural</span>
                <p className="text-xs font-mono font-bold text-purple-400 mt-1">{postureRating}</p>
              </div>
            </div>
          </div>

          {/* Draggable slider input range */}
          <div className="mt-6">
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-2">
              <span>Dia 0 (Hoje)</span>
              <span>Dia 30</span>
              <span>Dia 60</span>
              <span>Dia 90 (Fim)</span>
            </div>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Subscription offer details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        
        {/* Tier Free */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-2">Plano Standard</span>
            <h4 className="text-lg font-display font-medium text-slate-300">Basic Free</h4>
            <p className="text-xs text-slate-500 mt-1 mb-5">Para quem quer apenas guardar registros esporádicos.</p>
            
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-xs text-slate-400">
                <Check className="w-4 h-4 text-slate-600" />
                1 análise corporal por semana
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-400">
                <Check className="w-4 h-4 text-slate-600" />
                Comparação básica de fotos antes/depois
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-400">
                <Check className="w-4 h-4 text-slate-600" />
                Score de shape simples
              </li>
            </ul>
          </div>
          <button className="w-full mt-8 py-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-400 select-none cursor-not-allowed">
            Plano Ativo
          </button>
        </div>

        {/* Tier Pro Premium */}
        <div className="bg-gradient-to-b from-[#0a112c] to-slate-950 border-2 border-indigo-500/80 rounded-2xl p-6 flex flex-col justify-between relative">
          <div className="absolute top-0 right-6 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-mono text-[9px] font-bold tracking-widest px-3 py-1 rounded-full uppercase shadow-lg">
            MAIS RECOMENDADO
          </div>
          
          <div>
            <span className="text-[10px] font-mono text-indigo-400 uppercase tracking-widest block mb-2">Acesso Total</span>
            <h4 className="text-xl font-display font-extrabold text-white flex items-center gap-2">
              BodyTrack Premium PRO
              <Sparkles className="w-4 h-4 text-amber-400" />
            </h4>
            
            <div className="flex items-baseline gap-1 mt-2 mb-5">
              <span className="text-2xl font-mono font-black text-white">R$ 29,90</span>
              <span className="text-xs text-slate-400">/mês</span>
            </div>
            
            <ul className="space-y-3 border-t border-slate-850 pt-5">
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Flame className="w-4 h-4 text-cyan-400 shrink-0" />
                Mapeamento muscular em fotos ilimitadas
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Zap className="w-4 h-4 text-pink-500 shrink-0" />
                Dicas de treino e sugestão de dieta integrada por IA
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Award className="w-4 h-4 text-green-400 shrink-0" />
                Previsão de evolução muscular volumétrica em 3D
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-300">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                Exportação de relatórios profissionais em PDF completo
              </li>
            </ul>
          </div>

          {isPremium ? (
            <div className="w-full mt-8 py-3 text-center bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs font-mono text-cyan-400 font-bold">
              ASSINATURA PREMIUM ATIVA
            </div>
          ) : (
            <button
              onClick={onUnlockPremium}
              className="w-full mt-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-pink-600 text-white rounded-xl text-xs font-bold leading-none hover:opacity-90 active:scale-[0.98] transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] cursor-pointer"
            >
              Assinar Premium Agora
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
