import React, { useState, useEffect } from 'react';
import { UserProfile, PhysicalAssessment } from './types';
import { DEFAULT_HISTORY_DEMO, formatDate, translateGoal } from './utils';

// UI Sub components
import AuthScreen from './components/AuthScreen';
import PhotoCapture from './components/PhotoCapture';
import AnatomicalOverlay from './components/AnatomicalOverlay';
import ComparisonSlider from './components/ComparisonSlider';
import EvolutionChart from './components/EvolutionChart';
import PremiumGate from './components/PremiumGate';
import PdfExporter from './components/PdfExporter';

// Lucide icons
import {
  Dumbbell,
  Sparkles,
  Layers,
  Columns,
  LogOut,
  Calendar,
  ChevronRight,
  TrendingDown,
  Activity,
  Award,
  AlertCircle,
  HelpCircle,
  Clock,
  Heart,
  TrendingUp,
  Sliders,
  Sparkle,
  Ruler,
  Scale,
  Lock,
  Trash2
} from 'lucide-react';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [assessments, setAssessments] = useState<PhysicalAssessment[]>([]);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'photos' | 'compare' | 'export' | 'premium'>('dashboard');
  
  // Selection states for assessment comparison
  const [selectedLeftId, setSelectedLeftId] = useState<string>('');
  const [selectedRightId, setSelectedRightId] = useState<string>('');
  const [focusedAssessmentId, setFocusedAssessmentId] = useState<string>('');

  // Active capturing orientation status
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  // Sync state from LocalStorage on mount
  useEffect(() => {
    const storedProfile = localStorage.getItem('bt_profile');
    const storedAssessments = localStorage.getItem('bt_assessments');

    if (storedProfile) {
      const parsed = JSON.parse(storedProfile);
      parsed.isPremium = true; // Auto-activate premium for all users
      setProfile(parsed);
      localStorage.setItem('bt_profile', JSON.stringify(parsed));
    }
    if (storedAssessments) {
      const parsed = JSON.parse(storedAssessments) as PhysicalAssessment[];
      setAssessments(parsed);
      if (parsed.length > 0) {
        setFocusedAssessmentId(parsed[parsed.length - 1].id);
        setSelectedLeftId(parsed[0].id);
        setSelectedRightId(parsed[parsed.length - 1].id);
      }
    }
  }, []);

  // Save changes to LocalStorage
  const saveProfile = (newProfile: UserProfile | null) => {
    setProfile(newProfile);
    if (newProfile) {
      localStorage.setItem('bt_profile', JSON.stringify(newProfile));
    } else {
      localStorage.removeItem('bt_profile');
    }
  };

  const saveAssessments = (updatedList: PhysicalAssessment[]) => {
    setAssessments(updatedList);
    localStorage.setItem('bt_assessments', JSON.stringify(updatedList));

    if (updatedList.length > 0) {
      if (!focusedAssessmentId) setFocusedAssessmentId(updatedList[updatedList.length - 1].id);
      if (!selectedLeftId) setSelectedLeftId(updatedList[0].id);
      if (!selectedRightId) setSelectedRightId(updatedList[updatedList.length - 1].id);
    }
  };

  // Handle new login profile registration completing onboarding wizard
  const handleOnboardingComplete = (newProfile: UserProfile) => {
    // Keep isPremium true to unlock all PRO features
    const demoAdjustedProfile = { ...newProfile, isPremium: true };
    saveProfile(demoAdjustedProfile);

    // If profile has demo name, load the full pre-populated history template so they have rich statistics immediately!
    if (demoAdjustedProfile.name.includes("Demo") || demoAdjustedProfile.name.trim() === "Atleta Demo") {
      saveAssessments(DEFAULT_HISTORY_DEMO);
      setFocusedAssessmentId(DEFAULT_HISTORY_DEMO[DEFAULT_HISTORY_DEMO.length - 1].id);
      setSelectedLeftId(DEFAULT_HISTORY_DEMO[0].id);
      setSelectedRightId(DEFAULT_HISTORY_DEMO[DEFAULT_HISTORY_DEMO.length - 1].id);
    } else {
      // Clean start for personalized users
      saveAssessments([]);
    }
  };

  // Log Out athlete clearing states
  const handleLogout = () => {
    localStorage.removeItem('bt_profile');
    localStorage.removeItem('bt_assessments');
    setProfile(null);
    setAssessments([]);
    setActiveTab('dashboard');
  };

  // Send visual frame photos and anthropometrics data to Node Express server API
  const handlePhotosCaptured = async (capturedPhotos: { front?: string; side?: string; back?: string }) => {
    if (!profile) return;

    setLoadingAnalysis(true);
    setAnalysisError(null);
    setAnalysisStatus("Lendo alinhamento pélvico e landmarks...");

    const statusUpdates = [
      "Processando landmarks biomecânicos...",
      "Invocando Gemini AI para análise visual...",
      "Calculando desvios escapulares...",
      "Estimando tônus e percentual de gordura...",
      "Gerando insights de treino recomendados...",
    ];

    let updateIdx = 0;
    const interval = setInterval(() => {
      if (updateIdx < statusUpdates.length) {
        setAnalysisStatus(statusUpdates[updateIdx]);
        updateIdx++;
      }
    }, 1800);

    try {
      // Assemble request payload
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profile.name,
          age: profile.age,
          height: profile.height,
          weight: profile.weight,
          gender: profile.gender,
          goal: profile.goal,
          email: profile.name + "@bodytrack.ai", // mock session unique key
          photos: capturedPhotos,
          comparisonOption: assessments.length > 0 ? assessments[assessments.length - 1].id : null
        })
      });

      const data = await res.json();
      clearInterval(interval);

      if (data.success && data.assessment) {
        // Add assessment to local lists
        const assessmentResult = data.assessment as PhysicalAssessment;
        const updated = [...assessments, assessmentResult];
        saveAssessments(updated);
        
        // Select newly calculated assessments
        setFocusedAssessmentId(assessmentResult.id);
        setSelectedRightId(assessmentResult.id);
        
        // Push notification of success
        setActiveTab('dashboard');
      } else {
        throw new Error(data.error || "Ocorreu uma inconsistência no escaneamento visual da IA.");
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setAnalysisError(err.message || "Não foi possível sincronizar com o servidor BodyTrack.");
    } finally {
      setLoadingAnalysis(false);
    }
  };

  // Unlocking Pro VIP tier upgrade status
  const handleUnlockPremium = () => {
    alert("Sandbox Demo: Esta é uma versão de demonstração de testes configurada com restrições de assinatura. Em produção real, essa ação processaria o checkout da Stripe ou MercadoPago para ativar imediatamente a geração de relatórios PDF ilimitados.");
  };

  // Clear simulated storage history from physical databases if they want fresh tests
  const handleResetAppHistory = async () => {
    try {
      await fetch("/api/history/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: profile?.name + "@bodytrack.ai" })
      });
    } catch (e) {
      console.log("No cloud clearing supported standard reset fallback triggered.");
    }
    saveAssessments([]);
    setFocusedAssessmentId('');
  };

  // Find currently selected focused assessment record
  const focusedAssess = assessments.find(a => a.id === focusedAssessmentId) || assessments[assessments.length - 1];

  // Render registration if no profile is active yet
  if (!profile) {
    return (
      <div className="min-h-screen bg-[#03050d] text-slate-100 flex flex-col justify-between">
        <AuthScreen onRegisterComplete={handleOnboardingComplete} />
        <footer className="py-4 text-center text-[10px] font-mono text-slate-600">
          BODYTRACK AI SYSTEMS © 2026 • WORKSPACE PROTOTYPE
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#03050c] text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* Decorative ambient gradients */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/10 via-transparent to-transparent pointer-events-none z-0" />

      {/* Primary Shell Container */}
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 relative z-10 space-y-6">
        
        {/* Top Header Athlete bar */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-950/80 border border-slate-850/60 p-4 rounded-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-xl flex items-center justify-center font-display font-black text-white text-lg tracking-tight">
              BT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold text-white leading-none">{profile.name}</h1>
                {profile.isPremium ? (
                  <span className="bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-[8.5px] font-mono font-black py-0.5 px-1.5 rounded tracking-wider uppercase">PRO</span>
                ) : (
                  <span className="bg-slate-800 text-slate-400 text-[8px] font-mono py-0.5 px-1.5 rounded tracking-wider">FREE</span>
                )}
              </div>
              <p className="text-[10px] font-mono text-slate-550 mt-1 uppercase tracking-widest">
                Meta: {translateGoal(profile.goal)} • {profile.weight}kg • {profile.height}cm
              </p>
            </div>
          </div>

          {/* Quick assessment action triggers and Reset */}
          <div className="flex flex-wrap items-center gap-2.5">
            {assessments.length > 0 && (
              <div className="flex items-center gap-1.5 bg-red-950/20 p-1 border border-red-500/20 rounded-xl">
                {!showConfirmClear ? (
                  <button
                    onClick={() => setShowConfirmClear(true)}
                    className="p-1.5 px-3 text-red-400 text-[11px] font-bold hover:bg-red-900/20 rounded-lg transition flex items-center gap-1 cursor-pointer"
                    title="Limpar todos os dados"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpar Tudo</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 py-0.5">
                    <span className="text-[9px] font-mono text-red-400 uppercase font-bold select-none">Tem certeza?</span>
                    <button
                      onClick={() => {
                        handleResetAppHistory();
                        setShowConfirmClear(false);
                      }}
                      className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold rounded-lg transition cursor-pointer"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setShowConfirmClear(false)}
                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] font-bold rounded-lg border border-slate-800 transition cursor-pointer"
                    >
                      Não
                    </button>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setActiveTab('photos')}
              className="p-2 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-[11px] font-bold text-white rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-900/20"
            >
              <Dumbbell className="w-3.5 h-3.5" />
              <span>Novo Escaneamento</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 text-xs bg-slate-900 hover:bg-slate-850 text-slate-400 hover:text-slate-200 border border-slate-800 rounded-xl transition cursor-pointer"
              title="Trocar Atleta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Tab Navigation Menu */}
        <nav className="flex bg-slate-950/90 border border-slate-850/60 p-1.5 rounded-2xl md:p-2">
          {[
            { key: 'dashboard', label: 'Dashboard', icon: Activity },
            { key: 'photos', label: 'Análise Biométrica', icon: Layers },
            { key: 'compare', label: 'Evolução Lado-a-Lado', icon: Columns },
            { key: 'export', label: 'Relatórios PDF', icon: Award },
            { key: 'premium', label: 'Previsão Pro AI', icon: Sliders },
          ].map((tab) => {
            const IconComp = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 py-3 text-xs font-semibold rounded-xl flex flex-col md:flex-row items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-cyan-400 font-bold border-b border-cyan-400/30'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <IconComp className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                </div>
                <span className="hidden md:inline flex items-center gap-1 select-none">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        {/* Global Loading Spinner / AI scan notifications in progress */}
        {loadingAnalysis && (
          <div className="bg-[#040816]/95 border border-cyan-500/20 rounded-2xl p-8 text-center flex flex-col items-center justify-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 animate-[pulse_2s_infinite]" />
            <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-400 rounded-full animate-spin" />
            <div>
              <h4 className="text-sm font-mono tracking-wider font-bold text-slate-200 uppercase">Processando Análise Visual</h4>
              <p className="text-[11px] text-slate-400 mt-1 animate-pulse">{analysisStatus}</p>
            </div>
          </div>
        )}

        {/* Render actual content module based on active Tab */}
        {!loadingAnalysis && (
          <div className="transition-all duration-300">
            {activeTab === 'dashboard' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left Column: General stats dashboard and big circular gauge */}
                <div className="lg:col-span-8 space-y-6">
                  {/* Big gauge card for Shape Score & Weight */}
                  {focusedAssess ? (
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-950/80 border border-slate-850/60 p-5 md:p-6 rounded-2xl relative overflow-hidden">
                      {/* Decorative grid */}
                      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
                      
                      {/* Score gauge circle wheel */}
                      <div className="md:col-span-5 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-850/60 pb-5 md:pb-0 md:pr-6 relative z-10">
                        <div className="relative w-36 h-36 flex items-center justify-center">
                          {/* Circle meter background */}
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="72" cy="72" r="62" fill="transparent" stroke="#111827" strokeWidth="8" />
                            <circle
                              cx="72"
                              cy="72"
                              r="62"
                              fill="transparent"
                              stroke="url(#accentGrad)"
                              strokeWidth="8"
                              strokeDasharray={2 * Math.PI * 62}
                              strokeDashoffset={2 * Math.PI * 62 * (1 - focusedAssess.metrics.score / 100)}
                              strokeLinecap="round"
                            />
                            <defs>
                              <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#00f0ff" />
                                <stop offset="100%" stopColor="#bd00ff" />
                              </linearGradient>
                            </defs>
                          </svg>

                          <div className="absolute text-center">
                            <span className="text-3xl font-display font-black text-white">{focusedAssess.metrics.score}</span>
                            <span className="text-[10px] font-mono text-slate-500 uppercase block tracking-widest mt-0.5">SHAPE SCORE</span>
                          </div>
                        </div>
                      </div>

                      {/* Diagnostic indices and details list */}
                      <div className="md:col-span-7 space-y-4 relative z-10 flex flex-col justify-center">
                        <div>
                          <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 uppercase mb-1">
                            <span>Avaliação Ativa</span>
                            <span>{formatDate(focusedAssess.date)}</span>
                          </div>
                          <h3 className="text-lg font-display font-black text-slate-100 uppercase tracking-tight">
                            Relatório Visu-Somatotipo
                          </h3>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-slate-900 border border-slate-850/60 rounded-xl">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Gordura Corporal</span>
                            <div className="text-sm font-mono font-bold text-cyan-400 mt-0.5">{focusedAssess.metrics.bodyFat}%</div>
                          </div>

                          <div className="p-3 bg-slate-900 border border-slate-850/60 rounded-xl">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Massa Muscular</span>
                            <div className="text-sm font-mono font-bold text-slate-200 capitalize mt-0.5">{focusedAssess.metrics.muscleMass}</div>
                          </div>

                          <div className="p-3 bg-slate-900 border border-slate-850/60 rounded-xl">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Postura Corporal</span>
                            <div className="text-sm font-mono font-bold text-green-400 capitalize mt-0.5">
                              {focusedAssess.metrics.postureRating && focusedAssess.metrics.postureRating.replace('_', ' ')}
                            </div>
                          </div>

                          <div className="p-3 bg-slate-900 border border-slate-850/60 rounded-xl">
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Simetria Geral</span>
                            <div className="text-sm font-mono font-bold text-purple-400 capitalize mt-0.5">
                              {focusedAssess.metrics.symmetryRating && focusedAssess.metrics.symmetryRating.replace('_', ' ')}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-950 p-8 rounded-2xl text-center border border-dashed border-slate-800 text-slate-500">
                      Nenhum laudo visual gerado ainda. Toque em "Novo Escaneamento" acima para registrar!
                    </div>
                  )}

                  {/* Dynamic Trend Evolution chart */}
                  {assessments.length > 0 && (
                    <EvolutionChart assessments={assessments} />
                  )}

                  {/* Detailed Posture and Symmetry Report Panel */}
                  {focusedAssess && (
                    <div className="bg-slate-950 border border-slate-850/60 p-5 rounded-2xl space-y-5 relative overflow-hidden">
                      {/* Sub-glowing background effect */}
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl pointer-events-none rounded-full" />
                      
                      <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-cyan-400" />
                          <div>
                            <h4 className="text-sm font-display font-black text-slate-200 uppercase tracking-wide">
                              Laudo Biomecânico de Alinhamento e Simetria
                            </h4>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">Detecção estática de desníveis e compensações</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase border font-semibold ${
                            focusedAssess.metrics.postureRating === 'excelente' || focusedAssess.metrics.postureRating === 'boa'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-amber-600/10 border-amber-500/20 text-amber-400'
                          }`}>
                            Postura: {focusedAssess.metrics.postureRating ? focusedAssess.metrics.postureRating.replace('_', ' ') : 'N/A'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-mono uppercase border font-semibold ${
                            focusedAssess.metrics.symmetryRating === 'otima' || focusedAssess.metrics.symmetryRating === 'estavel'
                              ? 'bg-purple-500/10 border-purple-500/20 text-purple-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            Simetria: {focusedAssess.metrics.symmetryRating ? focusedAssess.metrics.symmetryRating.replace('_', ' ') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      {/* Diagnostic Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        
                        {/* Column 1: Posture Diagnostics */}
                        <div className="p-4 bg-slate-900/40 border border-slate-850/50 rounded-xl space-y-3">
                          <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest border-b border-slate-850/60 pb-2">
                            <Ruler className="w-4 h-4" />
                            <span>Controle de Desvios Posturais</span>
                          </div>
                          
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Ombros e Clavículas (Protusão/Queda)</span>
                              <p className="text-xs text-slate-200 font-sans font-medium leading-relaxed bg-[#0a0f1e] p-2 rounded border border-slate-850/40">
                                {focusedAssess.postureDetails.shoulders}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold text-slate-400">Quadril (Nivelamento Lateral)</span>
                              <p className="text-xs text-slate-200 font-sans font-medium leading-relaxed bg-[#0a0f1e] p-2 rounded border border-slate-850/40">
                                {focusedAssess.postureDetails.leveling}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Pelve e Coluna (Pelvic Tilt)</span>
                              <p className="text-xs text-slate-200 font-sans font-medium leading-relaxed bg-[#0a0f1e] p-2 rounded border border-slate-850/40">
                                {focusedAssess.postureDetails.pelvis}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Symmetry Diagnostics */}
                        <div className="p-4 bg-[#0a0815]/30 border border-slate-850/40 rounded-xl space-y-3">
                          <div className="flex items-center gap-2 text-xs font-mono font-bold text-purple-400 uppercase tracking-widest border-b border-slate-850/60 pb-2">
                            <Scale className="w-4 h-4" />
                            <span>Equilíbrio Muscular e Lateralidade</span>
                          </div>
                          
                          <div className="space-y-2.5">
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Membros Superiores (Braços/Dorsais)</span>
                              <p className="text-xs text-slate-200 font-sans font-medium leading-relaxed bg-[#0b0716]/60 p-2 rounded border border-slate-850/40">
                                {focusedAssess.symmetryDetails.leftArmVsRightArm}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Membros Inferiores (Coxas/Pernas)</span>
                              <p className="text-xs text-slate-200 font-sans font-medium leading-relaxed bg-[#0b0716]/60 p-2 rounded border border-slate-850/40">
                                {focusedAssess.symmetryDetails.leftLegVsRightLeg}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] font-mono text-slate-500 uppercase block">Ativação do Core e Flancos</span>
                              <p className="text-xs text-slate-200 font-sans font-medium leading-relaxed bg-[#0b0716]/60 p-2 rounded border border-slate-850/40">
                                {focusedAssess.symmetryDetails.torsoBalance}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Quick Disclaimer */}
                      <div className="px-3 py-2 bg-indigo-950/20 border border-indigo-500/10 rounded-xl flex items-center gap-2 text-[10px] text-slate-400 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        <span>A visão computacional do BodyTrack AI analisa biomecanicamente desvios usando os eixos anatômicos marcados nas suas fotos. Use as recomendações do treino corretivo abaixo para alinhar!</span>
                      </div>
                    </div>
                  )}

                  {/* AI Recommendations panel */}
                  {focusedAssess && (
                    <div className="bg-slate-950 border border-slate-850/60 p-5 rounded-2xl space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-amber-400" />
                        <div>
                          <h4 className="text-sm font-display font-black text-slate-200 uppercase tracking-wide">
                            Insights Nutricionais e de Treino IA
                          </h4>
                          <span className="text-[9px] font-mono text-slate-550 uppercase">Plano adaptativo ao seu shape atual</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {focusedAssess.aiInsights.map((insight, idx) => (
                          <div key={idx} className="p-3.5 bg-slate-900/60 border border-slate-850/40 rounded-xl flex items-start gap-2.5">
                            <Heart className="w-3.5 h-3.5 text-pink-500 mt-0.5 shrink-0" />
                            <p className="text-xs text-slate-300 leading-relaxed font-sans">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Column: Historical timeline & mini profile */}
                <div className="lg:col-span-4 space-y-6">
                  {/* Assessments list vertical */}
                  <div className="bg-[#050814]/90 border border-slate-850/60 p-4 rounded-2xl space-y-4 shadow-xl">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-sm font-display font-black text-slate-200 uppercase tracking-widest">Sessões Gravadas</h4>
                        <span className="text-[9px] font-mono text-slate-550">LINHA DE TEMPO BIO-HISTÓRICA</span>
                      </div>
                      {assessments.length > 0 && (
                        <button
                          onClick={handleResetAppHistory}
                          className="text-[9px] font-mono text-red-400 hover:text-red-300 underline"
                        >
                          Limpar Tudo
                        </button>
                      )}
                    </div>

                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                      {assessments.map((record) => {
                        const isFocused = focusedAssessmentId === record.id;
                        return (
                          <button
                            key={record.id}
                            onClick={() => {
                              setFocusedAssessmentId(record.id);
                            }}
                            className={`w-full p-3 rounded-xl border text-left flex justify-between items-center gap-2 transition cursor-pointer select-none ${
                              isFocused
                                ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.2)]'
                                : 'bg-slate-950 border-slate-900 hover:border-slate-800'
                            }`}
                          >
                            <div className="space-y-1">
                              <span className="text-[11px] font-mono font-bold text-slate-200 block">
                                {formatDate(record.date)}
                              </span>
                              <div className="flex gap-2 text-[10px] font-mono text-slate-500 font-semibold uppercase">
                                <span>{record.weight}kg</span>
                                <span>BF: <span className="text-cyan-400">{record.metrics.bodyFat}%</span></span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-mono font-black text-indigo-400">Score {record.metrics.score}</span>
                              <ChevronRight className="w-4 h-4 text-slate-600" />
                            </div>
                          </button>
                        );
                      })}
                      
                      {assessments.length === 0 && (
                        <p className="text-center py-6 text-xs text-slate-500 font-sans">Histórico vazio. Registre fotos!</p>
                      )}
                    </div>
                  </div>

                  {/* Kinesiology diagnostics quick widget */}
                  {focusedAssess && (
                    <div className="p-4.5 bg-slate-950/70 border border-slate-850/60 rounded-2xl space-y-4">
                      <div>
                        <h4 className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-black">Somatotipo e Postura</h4>
                        <p className="text-[10px] text-slate-550 mt-0.5">RESUMO FOTO-KINESIOLÓGICO IA</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <div className="p-2.5 bg-slate-900/60 rounded-lg">
                          <span className="font-semibold text-slate-400 font-sans block text-[10px]">Eixo Ombro-Dorsal:</span>
                          <span className="text-slate-200 mt-0.5 block">{focusedAssess.postureDetails.shoulders}</span>
                        </div>

                        <div className="p-2.5 bg-slate-900/60 rounded-lg">
                          <span className="font-semibold text-slate-400 font-sans block text-[10px]">Simetria Girdle:</span>
                          <span className="text-slate-200 mt-0.5 block">{focusedAssess.symmetryDetails.leftArmVsRightArm}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

            {activeTab === 'photos' && (
              <div className="space-y-6">
                {/* Visualizer list with landmarks points overlay */}
                {assessments.length > 0 && focusedAssess && (
                  <div className="space-y-6">
                    {/* Visualizer Selector Header bar */}
                    <div className="flex justify-between items-center bg-slate-950 p-4 border border-slate-900 rounded-xl">
                      <div>
                        <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-widest">Explorador de Anatomia IA</span>
                        <h4 className="text-sm font-semibold text-slate-200">Pontos Estáticos de Biometria</h4>
                      </div>
                      <select
                        value={focusedAssessmentId}
                        onChange={(e) => setFocusedAssessmentId(e.target.value)}
                        className="bg-slate-900 border border-slate-800 rounded-lg font-sans text-xs p-2 text-slate-400 cursor-pointer"
                      >
                        {assessments.map(a => (
                          <option key={a.id} value={a.id}>
                            Laudo de {formatDate(a.date)}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Interactive overlay grid row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <AnatomicalOverlay
                        photoUrl={focusedAssess.photos.front}
                        landmarks={focusedAssess.landmarks?.front}
                        title="Frente"
                        type="front"
                      />
                      <AnatomicalOverlay
                        photoUrl={focusedAssess.photos.side}
                        landmarks={focusedAssess.landmarks?.side}
                        title="Perfil"
                        type="side"
                      />
                      <AnatomicalOverlay
                        photoUrl={focusedAssess.photos.back}
                        landmarks={focusedAssess.landmarks?.back}
                        title="Costas"
                        type="back"
                      />
                    </div>
                  </div>
                )}

                {/* Photo Capturing section */}
                <PhotoCapture onCaptureComplete={handlePhotosCaptured} />
              </div>
            )}

            {activeTab === 'compare' && (
              <div className="space-y-6">
                <ComparisonSlider
                  assessments={assessments}
                  selectedLeftId={selectedLeftId}
                  selectedRightId={selectedRightId}
                  onSetLeftId={setSelectedLeftId}
                  onSetRightId={setSelectedRightId}
                />
              </div>
            )}

            {activeTab === 'export' && (
              <div>
                {focusedAssess ? (
                  <PdfExporter assessment={focusedAssess} />
                ) : (
                  <div className="border border-dashed border-slate-800 p-8 rounded-2xl text-center text-slate-500 text-xs">
                    Nenhuma avaliação física carregada para gerar o PDF. Registre novas fotos primeiro!
                  </div>
                )}
              </div>
            )}

            {activeTab === 'premium' && (
              <PremiumGate
                isPremium={profile.isPremium || false}
                onUnlockPremium={handleUnlockPremium}
              />
            )}
          </div>
        )}

      </div>
    </div>
  );
}
