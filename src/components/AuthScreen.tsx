import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Shield, Sparkles, User, Dumbbell, Award, Target, Flame } from 'lucide-react';

interface AuthScreenProps {
  onRegisterComplete: (profile: UserProfile) => void;
}

export default function AuthScreen({ onRegisterComplete }: AuthScreenProps) {
  const [name, setName] = useState('');
  const [age, setAge] = useState(28);
  const [height, setHeight] = useState(175);
  const [weight, setWeight] = useState(78);
  const [gender, setGender] = useState<'M' | 'F' | 'Outro'>('M');
  const [goal, setGoal] = useState<'emagrecer' | 'ganhar_massa' | 'definicao' | 'saude'>('definicao');

  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError("Por favor, informe seu nome.");
      return;
    }
    
    setFormError("");
    onRegisterComplete({
      name,
      age: Number(age),
      height: Number(height),
      weight: Number(weight),
      gender,
      goal,
      isPremium: true,
      registeredAt: new Date().toISOString()
    });
  };

  const loadDemoVisitor = () => {
    onRegisterComplete({
      name: "Atleta Demo",
      age: 26,
      height: 180,
      weight: 84,
      gender: "M",
      goal: "definicao",
      isPremium: true,
      registeredAt: new Date().toISOString()
    });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#040715]/95 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(30,58,138,0.2)] relative overflow-hidden space-y-6">
        
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 left-1/4 translate-y-1/2 w-48 h-48 bg-purple-500/10 blur-3xl rounded-full" />

        <div className="text-center relative z-10">
          {/* Logo Brand Emblem */}
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/30 mb-4 border border-indigo-400/20">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          
          <h2 className="text-2xl font-display font-black tracking-tight text-white uppercase sm:text-3xl">
            BodyTrack <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-pink-500">AI</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
            Visão computacional de alta fidelidade e escaneamento biomecânico para transformar seu treino.
          </p>
        </div>

        {/* Action Form */}
        <form onSubmit={handleSubmit} className="space-y-4 relative z-10 pt-2">
          
          {/* Form input: Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Nome Atleta</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Glaucio Veroneze"
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all duration-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Form input: Age */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Idade</label>
              <input
                type="number"
                min="10"
                max="100"
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500"
              />
            </div>

            {/* Form list: Gender */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Sexo Biológico</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500 cursor-pointer"
              >
                <option value="M" className="bg-slate-900 text-slate-200">Masculino</option>
                <option value="F" className="bg-slate-900 text-slate-200">Feminino</option>
                <option value="Outro" className="bg-slate-900 text-slate-200">Outro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Form input: Height */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Altura (cm)</label>
              <input
                type="number"
                min="100"
                max="250"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500"
              />
            </div>

            {/* Form input: Weight */}
            <div className="space-y-1">
              <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Peso Atual (kg)</label>
              <input
                type="number"
                min="30"
                max="300"
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-850 rounded-xl text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500"
              />
            </div>
          </div>

          {/* Form input: Target Goal */}
          <div className="space-y-1.5 pb-2">
            <label className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block mb-1">Objetivo Fitness Principal</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { key: 'emagrecer', label: 'Emagrecimento', icon: Flame, color: 'text-amber-500' },
                { key: 'ganhar_massa', label: 'Ganhar Musculatura', icon: Dumbbell, color: 'text-blue-400' },
                { key: 'definicao', label: 'Definição Corporal', icon: Award, color: 'text-cyan-400' },
                { key: 'saude', label: 'Saúde e Postura', icon: Target, color: 'text-green-400' },
              ].map((item) => {
                const IconComp = item.icon;
                const isSelected = goal === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setGoal(item.key as any)}
                    className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)] text-white'
                        : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-350 hover:border-slate-800'
                    }`}
                  >
                    <IconComp className={`w-4 h-4 shrink-0 ${item.color}`} />
                    <span className="text-xs font-semibold leading-tight font-sans text-slate-300">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {formError && (
            <p className="text-xs font-semibold text-red-400 animate-pulse text-center">{formError}</p>
          )}

          {/* Submit register */}
          <button
            type="submit"
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold font-sans rounded-xl tracking-wider text-center flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30 cursor-pointer pt-3"
          >
            <Sparkles className="w-4 h-4" />
            COMEÇAR ESCANEAMENTO
          </button>
        </form>

        {/* Demo profiles quick entrance bypass */}
        <div className="border-t border-slate-900/80 pt-4 text-center">
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Quer experimentar o sistema completo agora? Entre como um atleta demonstrativo para testar todos os recursos desbloqueados.
          </p>
          <button
            onClick={loadDemoVisitor}
            className="mt-2.5 text-xs font-mono font-bold text-cyan-400 hover:text-cyan-300 underline focus:outline-none cursor-pointer"
          >
            Acessar com Perfil de Teste (PRO Completo)
          </button>
        </div>

      </div>
    </div>
  );
}
