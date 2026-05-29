import React, { useState, useEffect } from 'react';
import { 
  Sparkles, Check, Flame, Zap, Award, Info, 
  Brain, Clock, Target, TrendingUp, ShieldAlert, ChevronRight, Activity,
  Lock, Unlock, Copy, Key, RefreshCw
} from 'lucide-react';
import { UserProfile, PhysicalAssessment, PredictionSet, ProgressPrediction } from '../types';

interface PremiumGateProps {
  isPremium: boolean;
  onUnlockPremium: () => void;
  onPremiumActivated: (updatedProfile: UserProfile) => void;
  profile?: UserProfile;
  assessments?: PhysicalAssessment[];
}

export default function PremiumGate({ 
  isPremium, 
  onUnlockPremium, 
  onPremiumActivated,
  profile, 
  assessments = [] 
}: PremiumGateProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'current' | '1_month' | '3_months' | '6_months'>('current');
  const [predictions, setPredictions] = useState<PredictionSet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for activation code
  const [activationCode, setActivationCode] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [activationSuccess, setActivationSuccess] = useState<string | null>(null);

  // Secret admin console states
  const [clickCount, setClickCount] = useState(0);
  const [showAdminConsole, setShowAdminConsole] = useState(false);

  const handleAdminToggleClick = () => {
    if (clickCount >= 4) {
      setShowAdminConsole(!showAdminConsole);
      setClickCount(0);
    } else {
      setClickCount(prev => prev + 1);
    }
  };

  // Simulated code lists for demonstration
  const [serverCodesList, setServerCodesList] = useState<any[]>([]);
  const [loadingCodes, setLoadingCodes] = useState(false);

  // Fetch codes on load to display trainer simulated tools
  const loadServerCodes = async () => {
    setLoadingCodes(true);
    try {
      const res = await fetch('/api/codes');
      const data = await res.json();
      if (data.success) {
        setServerCodesList(data.codes);
      }
    } catch (e) {
      console.error('Failure listing active key matrices:', e);
    } finally {
      setLoadingCodes(false);
    }
  };

  useEffect(() => {
    loadServerCodes();
  }, [isPremium]);

  // Generate a new code dynamically via server
  const handleGenerateNewCode = async () => {
    try {
      const res = await fetch('/api/codes/generate', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setServerCodesList(data.codes);
      }
    } catch (e) {
      alert('Impossível gerar licença no momento. Conexão perdida.');
    }
  };

  // Submit and activate
  const handleVerifyAndActivateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activationCode.trim()) {
      setActivationError('Por favor, informe seu código.');
      return;
    }

    setActivating(true);
    setActivationError(null);
    setActivationSuccess(null);

    try {
      const response = await fetch('/api/codes/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: activationCode,
          name: profile?.name || 'Atleta Demonstrativo'
        })
      });

      const data = await response.json();
      if (data.success) {
        setActivationSuccess('Parabéns! Sua cópia do BodyTrack AI PRO foi validada e ativada!');
        setActivationCode('');
        
        // Callback to upgrade App.tsx profile state in real-time
        if (profile) {
          const updated = { ...profile, isPremium: true };
          onPremiumActivated(updated);
        }
        loadServerCodes();
      } else {
        setActivationError(data.error || 'Código inválido ou já consumido.');
      }
    } catch (err) {
      setActivationError('Servidor off-line. Tente novamente mais tarde.');
    } finally {
      setActivating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    try {
      navigator.clipboard.writeText(code);
      alert(`Código ${code} copiado! Cole no campo acima para ativar sua versão PRO.`);
    } catch (e) {
      alert(`Código: ${code} - Copie e cole este código para simular a compra.`);
    }
  };

  // Fetch predictions inside PRO model
  useEffect(() => {
    async function fetchPredictions() {
      if (!profile) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/predict-progress', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            profile,
            assessments,
          }),
        });
        const data = await response.json();
        if (data.success && data.predictions) {
          setPredictions(data.predictions);
        } else {
          throw new Error(data.error || 'Falha ao recuperar a modelagem preditiva.');
        }
      } catch (err: any) {
        console.error('Error fetching progress predictions:', err);
        setError('Exibindo simulador dinâmico padrão baseado em kinesiologia geral.');
      } finally {
        setLoading(false);
      }
    }

    if (profile) {
      fetchPredictions();
    }
  }, [profile, assessments]);

  // Derive active values based on selection
  let displayWeight = profile?.weight || 75;
  let displayBF = profile?.gender === 'M' ? 18 : 24;
  let displayMuscle: 'baixa' | 'moderada' | 'alta' = 'moderada';
  let displayScore = 70;
  let displayPosture: 'excelente' | 'boa' | 'desvios_leves' | 'necessita_atencao' = 'desvios_leves';
  let displayMilestone = 'Estado Físico Atual';
  let displayDescription = 'Exibindo coordenadas biomecânicas consolidadas do seu corpo no momento inicial do mapeamento.';
  let displayRecommendations: string[] = [
    'Conclua novos escaneamentos biométricos semanalmente.',
    'Mantenha as fotos com a mesma iluminação e distância para máxima precisão.',
    'Utilize roupas de banho escuras ou trajes de compressão adequados.'
  ];

  // Adjust parameters relative to selection
  if (selectedPeriod !== 'current' && predictions) {
    const pred: ProgressPrediction = predictions[selectedPeriod];
    if (pred) {
      displayWeight = pred.weight;
      displayBF = pred.bodyFat;
      displayMuscle = pred.muscleMass;
      displayScore = pred.score;
      displayPosture = pred.postureRating;
      displayMilestone = pred.milestoneTitle;
      displayDescription = pred.description;
      displayRecommendations = pred.recommendations;
    }
  } else if (assessments.length > 0) {
    const latest = assessments[assessments.length - 1];
    displayWeight = latest.weight;
    displayBF = latest.metrics.bodyFat;
    displayMuscle = latest.metrics.muscleMass;
    displayScore = latest.metrics.score;
    displayPosture = latest.metrics.postureRating;
  }

  const isLossGoal = profile?.goal === 'emagrecer' || profile?.goal === 'definicao';
  const isGainGoal = profile?.goal === 'ganhar_massa';

  let progressScale = 0; // 0 to 1 scaling factor
  if (selectedPeriod === '1_month') progressScale = 0.3;
  else if (selectedPeriod === '3_months') progressScale = 0.65;
  else if (selectedPeriod === '6_months') progressScale = 1.0;

  const shoulderOffset = isGainGoal ? (progressScale * 12) : isLossGoal ? (progressScale * 4) : (progressScale * 5); 
  const waistOffset = isLossGoal ? (progressScale * -12) : isGainGoal ? (progressScale * 2) : (progressScale * -3);  
  
  let spineTilt = 4.5; 
  if (displayPosture === 'excelente') spineTilt = 0;
  else if (displayPosture === 'boa') spineTilt = 1.5;
  else if (displayPosture === 'desvios_leves') spineTilt = 3.2;

  const translateGoal = (g?: string) => {
    switch (g) {
      case 'emagrecer': return 'Definição Calórica / Perda';
      case 'ganhar_massa': return 'Hipertrofia Muscular / Bulking';
      case 'definicao': return 'Recomposição / Cortes Secos';
      case 'saude': return 'Correção Biomecânica & Saúde';
      default: return 'Geral';
    }
  };

  const translatePosture = (p: string) => {
    switch (p) {
      case 'excelente': return 'Excelente (Simétrico)';
      case 'boa': return 'Alinhamento Bom (Estável)';
      case 'desvios_leves': return 'Leves Desvios Unilaterais';
      case 'necessita_atencao': return 'Necessita Correção Biomecânica';
      default: return p;
    }
  };

  return (
    <div className="space-y-8">
      {/* LOCKED LAYER OF WORKBOOK SIMULATION */}
      {!isPremium ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT COLUMN: THE CORE ACTIVATION INTERFACE */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Promo Showcase card */}
            <div className="bg-gradient-to-r from-blue-950 to-[#070e28] border border-cyan-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 bg-cyan-500/10 text-cyan-400 rounded-bl-xl font-mono text-[10px] font-bold">
                CONVENÇÃO MUNDIAL DE IA
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="p-1 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded text-stone-100 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-300 animate-pulse" /> PLANO PRO
                  </div>
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">
                    Desbloqueie Versão Definitiva
                  </h3>
                </div>
                
                <p className="text-xs text-slate-300 leading-relaxed">
                  O plano completo te garante acesso à modelagem preditiva avançada de 1, 3 e 6 meses, além de liberação ilimitada de impressões clínicas, exportação de arquivos PDF e desvios de centro de equilíbrio.
                </p>

                {/* Benefits checked list */}
                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Escaneamentos corporais ilimitados</strong> (sem limite de 1 análise).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Exportação e Impressão de PDF</strong> formatados clinicamente.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Prognóstico Morfológico IA de Longo Prazo</strong> (1, 3 e 6 Meses).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Análise em alta fidelidade de desnível do quadrado lombar e assimetrias.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* ACTIVATION FIELD BOX */}
            <div className="bg-slate-950 border border-slate-850 p-6 rounded-2xl space-y-4 relative">
              <div 
                onClick={handleAdminToggleClick}
                className="flex items-center gap-2 text-sm font-bold text-slate-200 font-mono uppercase tracking-widest cursor-pointer select-none active:opacity-80"
                title="Área de Ativação"
              >
                <Key className="w-4 h-4 text-cyan-400" />
                <span>Ativar com Código de Compra</span>
              </div>
              
              <p className="text-xs text-slate-500">
                Insira o código de licença único gerado para sua compra para ativar e habilitar todos os recursos pro instantaneamente.
              </p>

              <form onSubmit={handleVerifyAndActivateCode} className="space-y-3 pt-1">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={activationCode}
                    onChange={(e) => setActivationCode(e.target.value)}
                    placeholder="Cole seu código de uso único aqui (Ex: BTRAC-88B92-KP90A-33X74)"
                    className="flex-1 px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm font-mono text-cyan-300 placeholder-slate-705 uppercase tracking-widest focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    disabled={activating}
                    className="px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-xs text-white uppercase font-bold tracking-wider rounded-xl transition cursor-pointer flex items-center justify-center gap-1 shrink-0 select-none shadow-md shadow-blue-900/10"
                  >
                    {activating ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Ativar</span>
                      </>
                    )}
                  </button>
                </div>

                {activationError && (
                  <p className="p-2.5 bg-red-950/20 text-red-400 text-xs font-mono font-medium rounded-lg border border-red-500/20 text-center animate-shake">
                    ⚠️ {activationError}
                  </p>
                )}

                {activationSuccess && (
                  <p className="p-3 bg-emerald-950/20 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-500/20 text-center">
                    🎉 {activationSuccess}
                  </p>
                )}
              </form>
            </div>

          </div>

          {/* RIGHT COLUMN: BLURRED PROGRESSION MOCKUP FOR CURIOSTY */}
          <div className="lg:col-span-6 relative">
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[6px] z-20 rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-slate-800">
              <div className="w-12 h-12 bg-cyan-700/10 rounded-full flex items-center justify-center border border-cyan-500/30 text-cyan-400 mb-3 animate-[pulse_2s_infinite]">
                <Lock className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold uppercase font-display text-white tracking-wider mb-1.5">
                Modelagem Preditiva Bloqueada
              </h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                As estimativas biomecânicas de ombros, cintura e o modelo 3D dinâmico morfológico estão bloqueados para visualização estática neste perfil gratuito.
              </p>
              <span className="mt-3 text-[10px] font-mono font-black py-1 px-2.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded uppercase tracking-widest">
                Utilize seu código comercial para liberar seu plano PRO!
              </span>
            </div>

            {/* Blurred Mock container */}
            <div className="bg-slate-950/40 p-4 border border-slate-900 rounded-2xl space-y-4 opacity-15 pointer-events-none select-none blur-[2px]">
              <div className="h-6 w-32 bg-slate-800 rounded animate-pulse" />
              <div className="flex gap-4">
                <div className="w-1/2 h-36 bg-slate-900 rounded-xl" />
                <div className="w-1/2 space-y-3">
                  <div className="h-5 bg-slate-800 rounded" />
                  <div className="h-4 bg-slate-900 rounded w-2/3" />
                  <div className="h-4 bg-slate-900 rounded w-5/6" />
                </div>
              </div>
              <div className="h-16 bg-slate-900 rounded-xl" />
            </div>
          </div>

        </div>
      ) : (
        /* SÍNTESE PRINCIPAL PREMIUM FULL RUNTIME IF IS PREMIUM */
        <div className="bg-[#030612] border border-cyan-500/20 rounded-2xl p-5 md:p-6 shadow-[0_0_30px_rgba(0,180,216,0.08)] relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#080f28_1px,transparent_1px),linear-gradient(to_bottom,#080f28_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
          
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] font-mono tracking-widest uppercase border border-cyan-500/20 rounded font-bold">
                    SÍNTESE PREDITIVA DE ALTA PRECISÃO
                  </span>
                  <span className="p-1 px-2 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded text-[8px] font-mono font-black tracking-widest uppercase flex items-center gap-1">
                    <Brain className="w-2.5 h-2.5" /> PROGNOS IA
                  </span>
                </div>
                <h3 className="text-2xl font-display font-black text-slate-100 uppercase tracking-tight">
                  Previsão de Evolução <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400">Biomecânica</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Projeção matemática do seu corpo com base no objetivo atual: <span className="text-cyan-400 font-semibold">{translateGoal(profile?.goal)}</span>
                </p>
              </div>

              {/* Interval Selector Tabs */}
              <div className="flex bg-slate-950/80 p-1 border border-slate-800 rounded-xl max-w-full overflow-x-auto shrink-0">
                {[
                  { key: 'current', label: 'Hoje' },
                  { key: '1_month', label: '1 Mês' },
                  { key: '3_months', label: '3 Meses' },
                  { key: '6_months', label: '6 Meses' },
                ].map((per) => (
                  <button
                    key={per.key}
                    onClick={() => setSelectedPeriod(per.key as any)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 text-xs font-mono font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                      selectedPeriod === per.key
                        ? 'bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.1)]'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {per.label}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="h-[360px] flex flex-col items-center justify-center space-y-4 bg-slate-950/40 border border-slate-900 rounded-2xl">
                <div className="w-10 h-10 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin" />
                <div className="text-center">
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400">Instanciando Matriz Biomecânica</span>
                  <p className="text-[10px] text-slate-500 mt-1">Gerando previsão de volume tecidual e simetria postural em progresso...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* MORPHING WIREFRAME COLUMN - Left */}
                <div className="lg:col-span-5 bg-slate-950/90 border border-slate-850 p-5 rounded-2xl flex flex-col items-center justify-center select-none min-h-[380px] relative overflow-hidden">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-900 border border-slate-800/80 px-2.5 py-1 rounded-md text-[9px] font-mono text-slate-400">
                    <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span>PREDIÇÃO POSTURAL LATERAL & SAGITAL</span>
                  </div>

                  <div className="absolute bottom-3 right-3 text-right text-[8px] font-mono text-slate-600">
                    METROPOLIS SCAN GRID v4.2<br />
                    COORD RATIO: 1.250:1.0
                  </div>

                  <svg viewBox="0 0 200 250" className="w-full max-w-[160px] h-auto drop-shadow-[0_0_20px_rgba(0,240,255,0.25)] mt-4">
                    <defs>
                      <radialGradient id="neonGlowGrad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#00f0ff" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#00f0ff" stopOpacity="0" />
                      </radialGradient>
                    </defs>

                    <circle cx="100" cy="115" r="70" fill="url(#neonGlowGrad)" />

                    <g fill="none" strokeWidth="1.5">
                      <path 
                        d={`M 100 60 Q ${100 - spineTilt} 110, 100 150`} 
                        stroke="#ff0080" 
                        strokeWidth="1.75"
                        strokeDasharray="4 2" 
                      />
                      
                      <circle cx="100" cy="45" r="15" fill="#03050c" stroke="#00f0ff" strokeWidth="1.75" />
                      <line x1="100" y1="75" x2={55 - shoulderOffset} y2="75" stroke="#00f0ff" />
                      <line x1="100" y1="75" x2={145 + shoulderOffset} y2="75" stroke="#00f0ff" />
                      <line x1={55 - shoulderOffset} y1="75" x2={48 - shoulderOffset * 1.2} y2="130" stroke="#00f0ff" strokeWidth="1.25" />
                      <line x1={145 + shoulderOffset} y1="75" x2={152 + shoulderOffset * 1.2} y2="130" stroke="#00f0ff" strokeWidth="1.25" />
                      <line x1="100" y1="75" x2="100" y2="115" stroke="#00f0ff" strokeWidth="1.25" strokeDasharray="3 3" />
                      <line x1={55 - shoulderOffset} y1="75" x2={65 + waistOffset} y2="115" stroke="#02c8ff" />
                      <line x1={145 + shoulderOffset} y1="75" x2={135 - waistOffset} y2="115" stroke="#02c8ff" />
                      <line x1={65 + waistOffset} y1="115" x2="70" y2="150" stroke="#00f0ff" />
                      <line x1={135 - waistOffset} y1="115" x2="130" y2="150" stroke="#00f0ff" />
                      <line x1="70" y1="150" x2="130" y2="150" stroke="#bd00ff" strokeWidth="2" />
                      <line x1="70" y1="150" x2="68" y2="210" stroke="#00f0ff" />
                      <line x1="130" y1="150" x2="132" y2="210" stroke="#00f0ff" />
                      <line x1="68" y1="210" x2="55" y2="212" stroke="#02c8ff" strokeWidth="1" />
                      <line x1="132" y1="210" x2="145" y2="212" stroke="#02c8ff" strokeWidth="1" />
                    </g>

                    <line x1="20" y1="75" x2="180" y2="75" stroke="#334155" strokeWidth="0.5" strokeDasharray="5 5" />
                    <line x1="20" y1="115" x2="180" y2="115" stroke="#334155" strokeWidth="0.5" strokeDasharray="5 5" />
                    <line x1="20" y1="150" x2="180" y2="150" stroke="#bd50ff" strokeWidth="0.5" strokeDasharray="5 5" strokeOpacity="0.4" />

                    <circle cx={55 - shoulderOffset} cy="75" r="4.5" fill="#00f0ff" />
                    <circle cx={145 + shoulderOffset} cy="75" r="4.5" fill="#00f0ff" />
                    <circle cx={65 + waistOffset} cy="115" r="4" fill="#39ff14" />
                    <circle cx={135 - waistOffset} cy="115" r="4" fill="#39ff14" />
                    <circle cx="70" cy="150" r="4.5" fill="#bd00ff" />
                    <circle cx="130" cy="150" r="4.5" fill="#bd00ff" />
                    <circle cx="100" cy="30" r="2.5" fill="#ff00aa" />
                    {spineTilt > 0 ? (
                      <g>
                        <circle cx={100 - spineTilt} cy="110" r="3" fill="#ff00aa" />
                        <line x1="100" y1="110" x2={100 - spineTilt} y2="110" stroke="#ff00aa" strokeWidth="0.75" />
                      </g>
                    ) : (
                      <circle cx="100" cy="110" r="3" fill="#10b981" />
                    )}
                  </svg>

                  <div className="mt-3 text-center space-y-1">
                    <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      {selectedPeriod === 'current' ? 'Coordenadas Atuais' : `Morfogênese IA: +${(progressScale*100).toFixed(0)}% de Adaptação`}
                    </span>
                    <p className="text-[9px] text-slate-500 font-mono">
                      Ombros: {isGainGoal ? `+${(shoulderOffset).toFixed(1)}mm` : 'Alinhados'} • Cintura: {waistOffset !== 0 ? `${waistOffset.toFixed(1)}mm` : 'Normal'}
                    </p>
                  </div>
                </div>

                {/* REPORT METRICS & SUMMARY CARD - Right (col-span-7) */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
                  
                  {/* 2x2 Stats Comparison Display */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl relative overflow-hidden">
                      <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-600" /> PESO PROJETADO
                      </span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-mono font-bold text-slate-100">{displayWeight}</span>
                        <span className="text-[11px] font-mono text-slate-400">kg</span>
                      </div>
                      {selectedPeriod !== 'current' && profile && (
                        <span className={`absolute bottom-2 right-3 text-[10px] font-mono leading-none ${
                          displayWeight - profile.weight < 0 ? 'text-green-400' : 'text-cyan-400'
                        }`}>
                          {displayWeight - profile.weight < 0 ? '' : '+'}{(displayWeight - profile.weight).toFixed(1)} kg
                        </span>
                      )}
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl relative overflow-hidden">
                      <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-orange-500" /> INDICE DE GORDURA
                      </span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-mono font-bold text-emerald-400">{displayBF}%</span>
                      </div>
                      {selectedPeriod !== 'current' && assessments.length > 0 && (
                        <span className="absolute bottom-2 right-3 text-[10px] font-mono text-green-400 leading-none">
                          {(displayBF - (assessments[assessments.length-1].metrics.bodyFat)).toFixed(1)}%
                        </span>
                      )}
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl col-span-2 md:col-span-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase flex items-center gap-1">
                        <Award className="w-4 h-4 text-purple-400" /> SHAPE SCORE IA
                      </span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-2xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                          {displayScore}
                        </span>
                        <span className="text-xs text-slate-500 text-mono">/100</span>
                      </div>
                    </div>
                  </div>

                  {/* Milestone Detail Card */}
                  <div className="p-5 bg-gradient-to-r from-slate-950 to-[#050a16] border border-cyan-500/10 rounded-xl space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-1 px-2.5 bg-cyan-500/10 text-cyan-400 font-mono text-[9px] font-bold uppercase rounded border border-cyan-500/20">
                        MARCO HISTÓRICO {selectedPeriod === 'current' ? '0' : selectedPeriod === '1_month' ? '1' : selectedPeriod === '3_months' ? '2' : '3'}
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-700" />
                      <h4 className="text-sm font-bold text-slate-200 uppercase tracking-tight font-mono">
                        {displayMilestone}
                      </h4>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed min-h-[50px]">
                      {displayDescription}
                    </p>

                    <div className="border-t border-slate-900 pt-3 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-500">ALINHAMENTO POSTURAL PREVISTO:</span>
                      <span className={`font-bold ${
                        displayPosture === 'excelente' ? 'text-emerald-400' :
                        displayPosture === 'boa' ? 'text-cyan-400' :
                        displayPosture === 'desvios_leves' ? 'text-orange-400' : 'text-red-400'
                      }`}>
                        {translatePosture(displayPosture)}
                      </span>
                    </div>
                  </div>

                  {/* Recommendations and Postural Drills Checklist */}
                  <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3">
                    <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-red-400" />
                      PRESCRIÇÃO TÔNICA RECOMENDADA DIÁRIA (METAS DE PERÍODO)
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {displayRecommendations.map((rec, idx) => (
                        <div key={idx} className="flex items-start gap-2 text-[11px] text-slate-300 leading-normal bg-slate-900/60 p-2.5 rounded-lg border border-slate-900">
                          <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400 font-mono">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

          </div>
        </div>
      )}

      {/* THE CODE GENERATION PLATFORM (DASHBOARD ADMINISTRADOR SIMULADO - HIDDEN BY DEFAULT) */}
      {showAdminConsole && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping inline-block" />
                <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  🔑 Painel do Treinador / Administração (Checkout Simulado)
                </h4>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Gere códigos de licença únicos e independentes de uso único para vender a seus alunos ou clientes. Cada código é descartável e garante que o mesmo código não seja reutilizado por outras pessoas.
              </p>
            </div>
            
            <button
              onClick={handleGenerateNewCode}
              disabled={loadingCodes}
              className="p-2 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Gerar Código Único ➕</span>
            </button>
          </div>

          {/* List of active keys */}
          <div className="bg-slate-950 border border-slate-900/80 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-2 bg-slate-900/60 p-2.5 text-[9px] font-mono text-slate-500 uppercase font-black uppercase text-center border-b border-slate-900">
              <div className="col-span-4 text-left px-2">CÓDIGO GERADO</div>
              <div className="col-span-3">STATUS</div>
              <div className="col-span-3">USADO POR</div>
              <div className="col-span-2">AÇÃO</div>
            </div>

            <div className="divide-y divide-slate-900 max-h-[140px] overflow-y-auto">
              {serverCodesList.map((codeObj, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-2 px-4 items-center text-center text-xs font-mono">
                  <div className="col-span-4 text-left font-bold text-cyan-400">{codeObj.code}</div>
                  <div className="col-span-3">
                    {codeObj.isUsed ? (
                      <span className="p-1 px-1.5 bg-red-950/20 text-red-500 text-[9px] uppercase border border-red-950/20 rounded font-bold">Consumido</span>
                    ) : (
                      <span className="p-1 px-1.5 bg-emerald-950/20 text-emerald-400 text-[9px] uppercase border border-emerald-950/20 rounded font-black">Ativo (Livre)</span>
                    )}
                  </div>
                  <div className="col-span-3 text-slate-400 text-[11px] truncate">
                    {codeObj.isUsed ? codeObj.usedBy : '—'}
                  </div>
                  <div className="col-span-2">
                    {!codeObj.isUsed ? (
                      <button
                        onClick={() => handleCopyCode(codeObj.code)}
                        className="p-1 px-2.5 bg-slate-900 hover:bg-slate-850 rounded border border-slate-800 text-[10px] text-slate-350 cursor-pointer flex items-center justify-center gap-1 mx-auto transition"
                        title="Copiar licença"
                      >
                        <Copy className="w-3 h-3 text-cyan-400" />
                        <span>Copiar</span>
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-650">—</span>
                    )}
                  </div>
                </div>
              ))}
              
              {serverCodesList.length === 0 && (
                <p className="text-center py-4 text-xs text-slate-600">Nenhum código registrado no servidor.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
