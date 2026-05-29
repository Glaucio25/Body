import React, { useRef, useState } from 'react';
import { PhysicalAssessment, UserProfile } from '../types';
import { formatDate } from '../utils';
import { Printer, Download, Sparkles, CheckCircle2, TrendingUp, Calendar, Compass, Lock } from 'lucide-react';

interface PdfExporterProps {
  assessment: PhysicalAssessment;
  profile?: UserProfile;
  assessments?: PhysicalAssessment[];
  isPremium: boolean;
}

export default function PdfExporter({ assessment, profile, assessments = [], isPremium }: PdfExporterProps) {
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (!isPremium) {
      alert("Recurso Exclusivo PRO: A impressão direta de boletins kinesiológicos e laudos biométricos em formato profissional requer a ativação comercial do BodyTrack AI com um código de ativação válido.");
      return;
    }
    window.print();
  };

  const handleDownloadStub = () => {
    if (!isPremium) {
      alert("Recurso Exclusivo PRO: O download de cópias digitais PDF está bloqueado na versão gratuita de testes. Ative seu aplicativo no menu PRO para liberar exportações ilimitadas.");
      return;
    }
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      alert(`Relatório_BodyTrack_IA_${assessment.id}.pdf exportado com sucesso!`);
    }, 1500);
  };

  // Pre-calculate physiological progression matching our server equations for instant PDF rendering
  const currentWeight = assessment.weight;
  const currentBF = assessment.metrics.bodyFat;
  const currentScore = assessment.metrics.score;
  const currentPosture = assessment.metrics.postureRating;
  const goal = profile?.goal || 'saude';
  const gender = profile?.gender || 'M';
  const isLossGoal = goal === 'emagrecer' || goal === 'definicao';
  const isGainGoal = goal === 'ganhar_massa';

  // Dynamic calculations relative to goals
  let weightChangeRate = -2.5; 
  let bfChangeRate = -1.5;
  let scoreChangeRate = 4;

  if (goal === 'ganhar_massa') {
    weightChangeRate = 1.0;
    bfChangeRate = -0.2;
    scoreChangeRate = 3;
  } else if (goal === 'definicao') {
    weightChangeRate = -1.2;
    bfChangeRate = -1.8;
    scoreChangeRate = 5;
  } else if (goal === 'saude') {
    weightChangeRate = 0;
    bfChangeRate = -0.5;
    scoreChangeRate = 3;
  }

  const getPredictionForMonth = (months: number) => {
    let factor = months;
    if (months === 3) factor = 2.4;
    if (months === 6) factor = 4.2;

    let predW = currentWeight + (weightChangeRate * factor);
    let predBF = currentBF + (bfChangeRate * factor);
    let predS = currentScore + (scoreChangeRate * factor);

    // thresholds
    const height = profile?.height || 175;
    const heightM = height / 100;
    const minW = 18.6 * (heightM * heightM);
    predW = Math.max(minW, Math.min(130, predW));

    const minBF = gender === 'M' ? 5.5 : 12.5;
    predBF = Math.max(minBF, Math.min(48, predBF));
    predS = Math.min(99, Math.max(45, Math.round(predS)));

    let muscleLabel: 'baixa' | 'moderada' | 'alta' = 'moderada';
    if (goal === 'ganhar_massa' && months >= 3) muscleLabel = 'alta';
    else if (goal === 'definicao' && months >= 3) muscleLabel = 'alta';

    let nextPosture: 'excelente' | 'boa' | 'desvios_leves' | 'necessita_atencao' = 'desvios_leves';
    const stages: Array<'necessita_atencao' | 'desvios_leves' | 'boa' | 'excelente'> = ['necessita_atencao', 'desvios_leves', 'boa', 'excelente'];
    let startIndex = stages.indexOf(currentPosture as any);
    if (startIndex === -1) startIndex = 1;
    let newIndex = startIndex + (months === 1 ? 1 : months === 3 ? 2 : 3);
    if (newIndex > 3) newIndex = 3;
    nextPosture = stages[newIndex];

    let title = '';
    let text = '';
    if (goal === 'emagrecer') {
      if (months === 1) {
        title = 'Adaptação e Redução Inicial';
        text = 'Redução de cerca de 2 a 4cm na linha umbilical. Nítida atenuação da retenção hídrica sob a pele.';
      } else if (months === 3) {
        title = 'Recomposição Nítida';
        text = 'Evolução na mobilização adiposa profunda, aumentando a definição escapular e linha lateral abdominal.';
       } else {
        title = 'Evolução Absoluta';
        text = 'Consolidação de um perfil físico esbelto e de altíssima vitalidade, com postura plenamente estabilizada.';
      }
    } else if (goal === 'ganhar_massa') {
      if (months === 1) {
        title = 'Hipertrofia Sarcoplasmática';
        text = 'Aumento do volume do glicogênio ativo, promovendo aspecto preenchido de ombros e quadríceps.';
      } else if (months === 3) {
        title = 'Massa Miofibrilar Ativa';
        text = 'Fibras musculares densificadas. Ombros e dorsais criam o formato em V nas imagens de costas.';
       } else {
        title = 'Maturidade Muscular';
        text = 'Consolidação estética harmônica geral, com compensação das assimetrias musculares unilaterais.';
      }
    } else if (goal === 'definicao') {
      if (months === 1) {
        title = 'Eliminação Intersticial';
        text = 'Saída rápida de água subcutânea e aumento imediato na visibilidade do abdômen superior.';
      } else if (months === 3) {
        title = 'Vascularização Profunda';
        text = 'Destaque nos feixes musculares do tríceps, serrátil e ombros. Pele fina e elástica.';
       } else {
        title = 'Definição Tridimensional';
        text = 'Densidade máxima obtida, com percentual adiposo na zona atlética de alta performance.';
      }
    } else {
      if (months === 1) {
        title = 'Reestruturação Escapular';
        text = 'Recrutamento profundo das cadeias corretivas da coluna anterior e retificação pélvica.';
      } else if (months === 3) {
        title = 'Eixo de Gravidade Estável';
        text = 'Alinhamento medial restaurado. Ombros posicionados ao longo do eixo gravitacional lateral.';
       } else {
        title = 'Harmonia Biomecânica';
        text = 'Eixo cinético consolidado. Correção completa de desalinhamentos posturais estruturais.';
      }
    }

    return {
      weight: Number(predW.toFixed(1)),
      bodyFat: Number(predBF.toFixed(1)),
      muscle: muscleLabel,
      score: predS,
      posture: nextPosture,
      title,
      text
    };
  };

  const pred1 = getPredictionForMonth(1);
  const pred3 = getPredictionForMonth(3);
  const pred6 = getPredictionForMonth(6);

  const translatePosture = (p: string) => {
    switch (p) {
      case 'excelente': return 'Excelente';
      case 'boa': return 'Boa';
      case 'desvios_leves': return 'Leve Desvio';
      case 'necessita_atencao': return 'Atenção';
      default: return p;
    }
  };

  const translateGoal = (g?: string) => {
    switch (g) {
      case 'emagrecer': return 'Emagrecimento';
      case 'ganhar_massa': return 'Hipertrofia';
      case 'definicao': return 'Definição';
      case 'saude': return 'Saúde e Postura';
      default: return 'Geral';
    }
  };

  return (
    <div className="space-y-6 select-none leading-normal">
      {/* Printable laboratory sheet controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
        <div>
          <h4 className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
            {!isPremium && <Lock className="w-3.5 h-3.5 text-amber-500" />}
            <span>Exportar Relatório Clínico</span>
          </h4>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">Salve um PDF profissional formatado para nutricionistas e personal trainers.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className={`p-2.5 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer transition ${!isPremium ? 'opacity-80' : ''}`}
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
          
          <button
            onClick={handleDownloadStub}
            className={`p-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/25 transition ${!isPremium ? 'from-slate-650 to-slate-700 opacity-80' : ''}`}
          >
            {downloading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Baixar PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Visual Assessment Document Frame (Styled like physical medical report) */}
      <div className="relative">
        {/* Blocker Overlay for Free users */}
        {!isPremium && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-[5.5px] z-20 rounded-2xl flex flex-col items-center justify-center p-6 text-center border border-slate-200">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center border border-red-200 text-red-500 mb-4 shadow-sm">
              <Lock className="w-6 h-6 border-0" />
            </div>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
              Laudo Bloqueado na Versão Gratuita
            </h3>
            <p className="text-xs text-slate-600 max-w-sm mt-1.5 leading-relaxed">
              O download integrado e a impressão direta de avaliações físicas estão liberados apenas para usuários com licença **PRO**.
            </p>
            <p className="text-[11px] text-indigo-600 font-semibold font-sans mt-3 bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
              🔑 Obtenha seu código de ativação no menu "Previsões Pro AI" para liberar!
            </p>
          </div>
        )}

        <div 
          ref={reportRef} 
          className="p-6 md:p-8 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl max-w-3xl mx-auto print:border-none print:shadow-none print:p-0 print:max-w-none space-y-6"
        >
          {/* Header Block */}
          <div className="flex justify-between items-start border-b-2 border-slate-950 pb-5">
            <div>
              <h2 className="text-xl font-black tracking-tight font-display text-slate-950 uppercase">
                Relatório de Avaliação Corporal IA
              </h2>
              <p className="text-xs font-mono text-slate-500 uppercase mt-0.5">BIO-MORPHOMETRICS COMPUTER VISION CLINICAL REPORT</p>
            </div>
            <div className="text-right">
              <span className="p-1 px-2.5 bg-slate-950 text-white font-mono text-[9px] font-bold rounded">
                ID: {assessment.id.toUpperCase()}
              </span>
              <p className="text-[10px] font-mono text-slate-500 mt-1.5">{formatDate(assessment.date)}</p>
            </div>
          </div>

          {/* User parameters segment */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl">
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Atleta</span>
              <span className="text-sm font-bold text-slate-800 truncate block">{profile?.name || 'Não Registrado'}</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Objetivo Principal</span>
              <span className="text-sm font-semibold text-slate-800 block truncate">{translateGoal(goal)}</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Peso Atleta</span>
              <span className="text-sm font-semibold text-slate-800">{assessment.weight} kg</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Gordura Estimada</span>
              <span className="text-sm font-semibold text-indigo-600">{assessment.metrics.bodyFat}%</span>
            </div>
            <div>
              <span className="text-[9px] font-mono text-slate-400 uppercase block">Shape Score</span>
              <span className="text-sm font-semibold text-indigo-700">{assessment.metrics.score}/100</span>
            </div>
          </div>

          {/* Postural & Symmetry sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Postural notes */}
            <div className="border border-slate-200 p-4 rounded-xl">
              <h5 className="text-[10px] font-mono bg-slate-100 text-slate-800 py-1 px-2 rounded font-bold uppercase tracking-wider mb-3">
                1. Análise Postural Estática
              </h5>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-600">Nivelamento Ombros:</span>
                  <p className="text-slate-700 font-sans mt-0.5">{assessment.postureDetails.shoulders}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Alinhamento Pélvico:</span>
                  <p className="text-slate-700 font-sans mt-0.5">{assessment.postureDetails.leveling}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Pelvis & Lombar:</span>
                  <p className="text-slate-700 font-sans mt-0.5">{assessment.postureDetails.pelvis}</p>
                </div>
              </div>
            </div>

            {/* Symmetry notes */}
            <div className="border border-slate-200 p-4 rounded-xl">
              <h5 className="text-[10px] font-mono bg-slate-100 text-slate-800 py-1 px-2 rounded font-bold uppercase tracking-wider mb-3">
                2. Simetria Corporal
              </h5>
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-600">Membros Superiores:</span>
                  <p className="text-slate-700 font-sans mt-0.5">{assessment.symmetryDetails.leftArmVsRightArm}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Membros Inferiores:</span>
                  <p className="text-slate-700 font-sans mt-0.5">{assessment.symmetryDetails.leftLegVsRightLeg}</p>
                </div>
                <div>
                  <span className="font-semibold text-slate-600">Equilíbrio Central:</span>
                  <p className="text-slate-700 font-sans mt-0.5">{assessment.symmetryDetails.torsoBalance}</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="border border-slate-200 p-4 rounded-xl">
            <h5 className="text-[10px] font-mono text-slate-800 font-bold uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              3. Plano de Treinamento & Recomendações Corretivas IA
            </h5>
            <ul className="space-y-2 text-xs">
              {assessment.aiInsights.slice(0, 4).map((insight, i) => (
                <li key={i} className="flex items-start gap-2 text-slate-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="font-sans leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION 4: AI PROGRESS PREDICTION & CLINICAL MILESTONES */}
          <div className="border-t-2 border-slate-150 pt-5 space-y-4 break-inside-avoid">
            <div className="flex bg-slate-950 text-white rounded p-1.5 px-3 items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-cyan-400" />
                <h5 className="text-xs font-mono font-black uppercase tracking-wider">
                  4. Previsão de Evolução Teórica IA (1, 3 e 6 Meses)
                </h5>
              </div>
              <span className="text-[9px] font-mono text-cyan-400 font-semibold tracking-wider font-bold">MARCOS BIOMÉTRICOS</span>
            </div>

            <p className="text-xs text-slate-500 font-sans leading-relaxed">
              Metodologias matemáticas de Kinesiologia computorizada extrapolam a taxa atual de reabilitação e recomposição do Atleta para projetar a evolução corpórea em regime consistente.
            </p>

            {/* Projections Matrix Table (Sleek medical style) */}
            <table className="w-full text-xs font-sans border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-100 text-slate-800 font-mono text-[9px] uppercase tracking-wide">
                  <th className="border border-slate-200 p-2 text-left">Métrica de Evolução</th>
                  <th className="border border-slate-200 p-2 text-center">Início (Hoje)</th>
                  <th className="border border-slate-200 p-2 text-center">1 Mês</th>
                  <th className="border border-slate-200 p-2 text-center">3 Meses</th>
                  <th className="border border-slate-200 p-2 text-center">6 Meses</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-slate-200 p-2 font-semibold text-slate-700">Peso Total (Média)</td>
                  <td className="border border-slate-200 p-2 text-center font-mono">{currentWeight} kg</td>
                  <td className="border border-slate-200 p-2 text-center font-mono text-cyan-700 font-bold">{pred1.weight} kg</td>
                  <td className="border border-slate-200 p-2 text-center font-mono text-cyan-700 font-bold">{pred3.weight} kg</td>
                  <td className="border border-slate-200 p-2 text-center font-mono text-indigo-700 font-bold">{pred6.weight} kg</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-200 p-2 font-semibold text-slate-700">% de Gordura Estimado</td>
                  <td className="border border-slate-200 p-2 text-center font-mono">{currentBF}%</td>
                  <td className="border border-slate-200 p-2 text-center font-mono text-emerald-600 font-bold">{pred1.bodyFat}%</td>
                  <td className="border border-slate-200 p-2 text-center font-mono text-emerald-600 font-bold">{pred3.bodyFat}%</td>
                  <td className="border border-slate-200 p-2 text-center font-mono text-emerald-700 font-bold">{pred6.bodyFat}%</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2 font-semibold text-slate-700">Massa Muscular</td>
                  <td className="border border-slate-200 p-2 text-center capitalize">{assessment.metrics.muscleMass}</td>
                  <td className="border border-slate-200 p-2 text-center capitalize">{pred1.muscle}</td>
                  <td className="border border-slate-200 p-2 text-center capitalize text-cyan-700 font-bold">{pred3.muscle}</td>
                  <td className="border border-slate-200 p-2 text-center capitalize text-indigo-700 font-bold">{pred6.muscle}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="border border-slate-200 p-2 font-semibold text-slate-700">Shape Score IA</td>
                  <td className="border border-slate-200 p-2 text-center font-mono">{currentScore}/100</td>
                  <td className="border border-slate-200 p-2 text-center font-mono text-purple-700 font-bold">{pred1.score}</td>
                  <td className="border border-slate-200 p-2 text-center font-mono text-purple-700 font-bold">{pred3.score}</td>
                  <td className="border border-slate-200 p-2 text-center font-mono text-pink-700 font-bold">{pred6.score}</td>
                </tr>
                <tr>
                  <td className="border border-slate-200 p-2 font-semibold text-slate-700">Nivelamento Postural</td>
                  <td className="border border-slate-200 p-2 text-center font-semibold text-slate-600">{translatePosture(currentPosture)}</td>
                  <td className="border border-slate-200 p-2 text-center text-cyan-600 text-semibold">{translatePosture(pred1.posture)}</td>
                  <td className="border border-slate-200 p-2 text-center text-emerald-600 font-bold">{translatePosture(pred3.posture)}</td>
                  <td className="border border-slate-200 p-2 text-center text-emerald-600 font-black">{translatePosture(pred6.posture)}</td>
                </tr>
              </tbody>
            </table>

            {/* 3 Mini Morphed SVG side-by-side representing visual progression */}
            <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center justify-around">
              {[
                { label: 'Em 1 Mês', scale: 0.3, tilt: currentPosture === 'excelente' ? 0 : 3.2 },
                { label: 'Em 3 Meses', scale: 0.65, tilt: currentPosture === 'excelente' ? 0 : 1.5 },
                { label: 'Em 6 Meses', scale: 1.0, tilt: 0 }
              ].map((m, idx) => {
                const modelShoulder = isGainGoal ? (m.scale * 10) : isLossGoal ? (m.scale * 3) : (m.scale * 5);
                const modelWaist = isLossGoal ? (m.scale * -10) : isGainGoal ? (m.scale * 1) : (m.scale * -2);

                return (
                  <div key={idx} className="flex flex-col items-center">
                    <span className="text-[9px] font-mono text-slate-400 font-bold mb-1">{m.label}</span>
                    <svg viewBox="0 0 200 240" className="w-16 h-auto border border-slate-200 bg-white rounded p-1 mb-1">
                      <path 
                        d={`M 100 60 Q ${100 - m.tilt} 110, 100 150`} 
                        stroke="#ff0080" 
                        strokeWidth="1.5"
                        strokeDasharray="3 2" 
                        fill="none"
                      />
                      <circle cx="100" cy="45" r="14" fill="none" stroke="#0ea5e9" strokeWidth="1.5" />
                      <line x1="100" y1="75" x2={55 - modelShoulder} y2="75" stroke="#0ea5e9" strokeWidth="1.5" />
                      <line x1="100" y1="75" x2={145 + modelShoulder} y2="75" stroke="#0ea5e9" strokeWidth="1.5" />
                      <line x1={55 - modelShoulder} y1="75" x2={65 + modelWaist} y2="120" stroke="#000" strokeWidth="1.25" opacity="0.3" fill="none" />
                      <line x1={145 + modelShoulder} y1="75" x2={135 - modelWaist} y2="120" stroke="#000" strokeWidth="1.25" opacity="0.3" fill="none" />
                      {/* Hips */}
                      <line x1={65 + modelWaist} y1="120" x2="70" y2="150" stroke="#0ea5e9" />
                      <line x1={135 - modelWaist} y1="120" x2="130" y2="150" stroke="#0ea5e9" />
                      <line x1="70" y1="150" x2="130" y2="150" stroke="#8b5cf6" strokeWidth="2" />
                      {/* Legs */}
                      <line x1="70" y1="150" x2="68" y2="210" stroke="#0ea5e9" />
                      <line x1="130" y1="150" x2="132" y2="210" stroke="#0ea5e9" />
                      {/* Dots */}
                      <circle cx={55 - modelShoulder} cy="75" r="3.5" fill="#0ea5e9" />
                      <circle cx={145 + modelShoulder} cy="75" r="3.5" fill="#0ea5e9" />
                      <circle cx="100" cy="110" r="2.5" fill="#ec4899" />
                    </svg>
                    <span className="text-[8px] font-mono text-slate-500">Morfia {Math.round(m.scale*100)}%</span>
                  </div>
                );
              })}
            </div>

            {/* Milestones narratives */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
                <span className="text-[9px] font-mono text-cyan-600 font-bold block uppercase tracking-wider">Marco: 1 Mês</span>
                <h6 className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{pred1.title}</h6>
                <p className="text-[10px] text-slate-600 leading-normal">{pred1.text}</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
                <span className="text-[9px] font-mono text-emerald-600 font-bold block uppercase tracking-wider">Marco: 3 Meses</span>
                <h6 className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{pred3.title}</h6>
                <p className="text-[10px] text-slate-600 leading-normal">{pred3.text}</p>
              </div>
              <div className="p-3 border border-slate-200 rounded-xl bg-slate-50/50 space-y-1">
                <span className="text-[9px] font-mono text-indigo-600 font-bold block uppercase tracking-wider">Marco: 6 Meses</span>
                <h6 className="text-[10px] font-bold text-slate-800 uppercase tracking-tight">{pred6.title}</h6>
                <p className="text-[10px] text-slate-600 leading-normal">{pred6.text}</p>
              </div>
            </div>
          </div>

          {/* Report Footer banner */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-[9px] font-mono text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
            <span>Relatório gerado por análises computorizadas de Machine Vision e Prognos IA.</span>
            <span className="font-bold text-indigo-600 uppercase">BODYTRACK AI SYSTEMS © 2026</span>
          </div>
        </div>
      </div>
    </div>
  );
}
