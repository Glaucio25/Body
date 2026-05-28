import React, { useRef, useState } from 'react';
import { PhysicalAssessment } from '../types';
import { formatDate } from '../utils';
import { FileUp, Clipboard, Printer, Download, Sparkles, CheckCircle2 } from 'lucide-react';

interface PdfExporterProps {
  assessment: PhysicalAssessment;
}

export default function PdfExporter({ assessment }: PdfExporterProps) {
  const [downloading, setDownloading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadStub = () => {
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      // Simulate download notification trigger
      alert(`Relatório_BodyTrack_${assessment.id}.pdf exportado com sucesso!`);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Printable laboratory sheet controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-950 border border-slate-800 rounded-xl">
        <div>
          <h4 className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">Exportar Relatório Visu-Médico</h4>
          <p className="text-[11px] text-slate-500 font-sans mt-0.5">Salve um PDF profissional formatado para nutricionistas e personal trainers.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="p-2.5 px-4 bg-slate-900 hover:bg-slate-850 border border-slate-700/80 rounded-xl text-xs font-semibold text-slate-300 flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir</span>
          </button>
          
          <button
            onClick={handleDownloadStub}
            className="p-2.5 px-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:opacity-90 rounded-xl text-xs font-bold text-white flex items-center gap-2 cursor-pointer shadow-lg shadow-cyan-900/25"
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
      <div 
        ref={reportRef} 
        className="p-6 md:p-8 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-xl max-w-2xl mx-auto print:border-none print:shadow-none print:p-0"
      >
        {/* Header Block */}
        <div className="flex justify-between items-start border-b-2 border-slate-950 pb-6 mb-6">
          <div>
            <h2 className="text-xl font-black tracking-tight font-display text-slate-950 uppercase">
              Relatório Geral BodyTrack AI
            </h2>
            <p className="text-xs font-mono text-slate-500 uppercase mt-0.5">BIO-MORPHOMETRICS COMPUTER VISION REPORT</p>
          </div>
          <div className="text-right">
            <span className="p-1 px-2.5 bg-slate-950 text-white font-mono text-[9px] font-bold rounded">
              ID: {assessment.id.toUpperCase()}
            </span>
            <p className="text-[10px] font-mono text-slate-500 mt-1.5">{formatDate(assessment.date)}</p>
          </div>
        </div>

        {/* User parameters segment */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-xl mb-6">
          <div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">Peso Registrado</span>
            <span className="text-sm font-semibold text-slate-800">{assessment.weight} kg</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">Score de Shape</span>
            <span className="text-sm font-semibold text-slate-800">{assessment.metrics.score}/100</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">Gordura Estimada</span>
            <span className="text-sm font-semibold text-indigo-600">{assessment.metrics.bodyFat}%</span>
          </div>
          <div>
            <span className="text-[9px] font-mono text-slate-400 uppercase block">Massa Muscular</span>
            <span className="text-sm font-semibold text-slate-800 capitalize">{assessment.metrics.muscleMass}</span>
          </div>
        </div>

        {/* Left column postural + Right column symmetry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Postural notes */}
          <div className="border border-slate-200 p-4.5 rounded-xl">
            <h5 className="text-xs font-mono bg-slate-100 text-slate-800 py-1 px-2 rounded-md font-bold uppercase tracking-wider mb-3">
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
          <div className="border border-slate-200 p-4.5 rounded-xl">
            <h5 className="text-xs font-mono bg-slate-100 text-slate-800 py-1 px-2 rounded-md font-bold uppercase tracking-wider mb-3">
              2. Simetria Muscular
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
                <span className="font-semibold text-slate-600">Equilíbrio Lateral:</span>
                <p className="text-slate-700 font-sans mt-0.5">{assessment.symmetryDetails.torsoBalance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="border-t-2 border-slate-200 pt-5">
          <h5 className="text-xs font-mono text-slate-800 font-bold uppercase tracking-wider mb-3 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            3. Recomendações e Plano de Ação IA
          </h5>
          <ul className="space-y-2.5">
            {assessment.aiInsights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-slate-700 line-clamp-3">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-600 shrink-0 mt-0.5" />
                <span className="font-sans font-medium">{insight}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Report Footer banner */}
        <div className="mt-8 border-t border-slate-100 pt-5 text-center text-[10px] font-mono text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>Relatório gerado automaticamente por algoritmos de Machine Vision.</span>
          <span className="font-bold text-indigo-600">BODYTRACK AI SYSTEMS © 2026</span>
        </div>
      </div>
    </div>
  );
}
