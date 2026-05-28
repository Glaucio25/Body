import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Sparkles, AlertCircle, RefreshCw, Check } from 'lucide-react';
import { MOCK_FRONT_TRAINER, MOCK_SIDE_TRAINER, MOCK_BACK_TRAINER } from '../utils';

interface PhotoCaptureProps {
  onCaptureComplete: (photos: { front?: string; side?: string; back?: string }) => void;
}

export default function PhotoCapture({ onCaptureComplete }: PhotoCaptureProps) {
  const [activeStep, setActiveStep] = useState<'front' | 'side' | 'back'>('front');
  const [photos, setPhotos] = useState<{ front?: string; side?: string; back?: string }>({});
  
  const [useWebcam, setUseWebcam] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showGuide, setShowGuide] = useState(true);

  // Auto trigger positioning instruction modal only for the initial front step
  React.useEffect(() => {
    if (activeStep === 'front' && !photos.front) {
      setShowGuide(true);
    }
  }, [activeStep]);

  // Guidelines for each view angle
  const guidelines = {
    front: {
      title: "Frente",
      silhouette: "Alinhar ombros e quadril horizontalmente",
      checks: [
        "Fique de pé na postura anatômica",
        "Mantenha os braços levemente afastados do tronco",
        "Olhe fixamente para a lente da câmera",
      ]
    },
    side: {
      title: "Perfil (Lado)",
      silhouette: "Alinhar orelha, ombros e quadril verticalmente",
      checks: [
        "Fique totalmente de lado para o sensor",
        "Mantenha o braço próximo da linha lombar",
        "Olhe para frente (90° em relação ao quadril)",
      ]
    },
    back: {
      title: "Costas",
      silhouette: "Alinhar escápulas e calcanhares",
      checks: [
        "Braços discretamente afastados",
        "Cabelo preso se houver comprimento",
        "Fique no mesmo ponto de focagem da frente",
      ]
    }
  };

  const handleStartCamera = async () => {
    setUseWebcam(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error(err);
      setCameraError("Câmera do dispositivo inacessível no iframe ou sem permissões.");
      setUseWebcam(false);
    }
  };

  const handleStopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setUseWebcam(false);
  };

  const handleCaptureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(-1, 1); // mirror flip
        ctx.drawImage(videoRef.current, -canvas.width, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        
        const updated = { ...photos, [activeStep]: dataUrl };
        setPhotos(updated);

        // Auto-advance step immediately while keeping camera stream running
        if (activeStep === 'front') {
          setActiveStep('side');
        } else if (activeStep === 'side') {
          setActiveStep('back');
        } else if (activeStep === 'back') {
          handleStopCamera();
          onCaptureComplete(updated);
        }
      }
    }
  };

  const savePhoto = (dataUrl: string) => {
    const updated = { ...photos, [activeStep]: dataUrl };
    setPhotos(updated);
  };

  const handleSendStep = () => {
    if (activeStep === 'front') {
      if (!photos.front) return;
      setActiveStep('side');
    } else if (activeStep === 'side') {
      if (!photos.side) return;
      setActiveStep('back');
    } else if (activeStep === 'back') {
      if (!photos.back) return;
      handleApplyCompleted();
    }
  };

  // Upload custom photo from storage with auto-advance support
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const dataUrl = reader.result;
          const updated = { ...photos, [activeStep]: dataUrl };
          setPhotos(updated);
          
          // Auto-advance step here too for uploaded files
          if (activeStep === 'front') {
            setActiveStep('side');
          } else if (activeStep === 'side') {
            setActiveStep('back');
          } else if (activeStep === 'back') {
            onCaptureComplete(updated);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Instant demo preset injector
  const handleLoadTrainerPresets = () => {
    const presets = {
      front: MOCK_FRONT_TRAINER,
      side: MOCK_SIDE_TRAINER,
      back: MOCK_BACK_TRAINER
    };
    setPhotos(presets);
    onCaptureComplete(presets);
  };

  const handleApplyCompleted = () => {
    onCaptureComplete(photos);
  };

  const currentStepInfo = guidelines[activeStep];

  return (
    <div className="bg-[#050814]/90 border border-slate-800/80 rounded-2xl p-4 md:p-6 shadow-xl space-y-6">
      
       {/* Dynamic wizard breadcrumbs */}
      <div className="flex justify-around items-center gap-4 bg-slate-950 p-3 rounded-xl border border-slate-900/80">
        {(['front', 'side', 'back'] as const).map((step) => {
          const isDone = !!photos[step];
          const isCurrent = activeStep === step;

          return (
            <button
              key={step}
              onClick={() => {
                handleStopCamera();
                setActiveStep(step);
              }}
              className={`flex items-center gap-2 text-xs font-mono tracking-wider font-semibold transition-all duration-150 ${
                isCurrent 
                  ? 'text-cyan-400' 
                  : isDone 
                    ? 'text-emerald-400' 
                    : 'text-slate-500'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                isCurrent 
                  ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.4)]' 
                  : isDone 
                    ? 'bg-emerald-500/10 border-emerald-500' 
                    : 'bg-slate-900 border-slate-800'
              }`}>
                {isDone ? <Check className="w-3 h-3 text-emerald-400" /> : step === 'front' ? '1' : step === 'side' ? '2' : '3'}
              </div>
              <span className="hidden sm:inline capitalize">{step === 'front' ? 'Frente' : step === 'side' ? 'Perfil (Lado)' : 'Costas'}</span>
            </button>
          );
        })}
      </div>

      {/* Main interaction workspace: camera pane / preview frame */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Viewfinder stage */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="border border-slate-800 bg-slate-950 rounded-2xl aspect-[3/4] relative overflow-hidden flex flex-col items-center justify-center">
            
            {/* Outline alignment watermark contour overlay */}
            <div className="absolute inset-x-8 inset-y-12 border border-dashed border-slate-800/60 rounded-xl pointer-events-none flex flex-col items-center justify-center">
              {/* Silhouette placement guides */}
              <div className="w-24 h-24 border border-cyan-500/20 rounded-full mb-10 opacity-30" />
              <div className="w-32 h-44 border border-cyan-500/20 rounded-t-3xl opacity-30" />
              <span className="text-[9px] font-mono text-cyan-400/30 uppercase mt-4 block absolute bottom-6">{currentStepInfo.silhouette}</span>
            </div>

            {/* Render options screen conditionally */}
            {useWebcam ? (
              <div className="absolute inset-0 select-none">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                
                {/* ----------------- GHOST GUIDES & POINTS OVERLAYS ----------------- */}
                {activeStep === 'front' && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 animate-pulse duration-1000" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Corner Borders */}
                    <path d="M 20 40 L 20 20 L 40 20" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 280 40 L 280 20 L 260 20" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 20 360 L 20 380 L 40 380" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 280 360 L 280 380 L 260 380" stroke="#00f0ff" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Central Vertical Plumb Line */}
                    <line x1="150" y1="20" x2="150" y2="380" stroke="rgba(6, 182, 212, 0.45)" strokeWidth="1" strokeDasharray="3 3" />
                    
                    {/* Horizontal Level Guides */}
                    <line x1="30" y1="105" x2="270" y2="105" stroke="rgba(244, 63, 94, 0.4)" strokeWidth="0.8" strokeDasharray="2 2" />
                    <line x1="30" y1="195" x2="270" y2="195" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="0.8" strokeDasharray="2 2" />

                    {/* Head Guide Ring */}
                    <circle cx="150" cy="55" r="24" stroke="rgba(0, 240, 255, 0.5)" strokeWidth="1" strokeDasharray="3 2" />
                    <circle cx="150" cy="55" r="2.5" fill="#00f0ff" />
                    <text x="150" y="24" fill="#00f0ff" fontSize="7.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold" letterSpacing="0.5">ALINHAR CABEÇA</text>

                    {/* Shoulder Level Target Marks */}
                    <g>
                      <circle cx="102" cy="105" r="9" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="2 2" />
                      <circle cx="102" cy="105" r="2.5" fill="#f43f5e" />
                      <text x="102" y="91" fill="#f43f5e" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">OMBRO E.</text>
                    </g>
                    <g>
                      <circle cx="198" cy="105" r="9" stroke="#f43f5e" strokeWidth="0.8" strokeDasharray="2 2" />
                      <circle cx="198" cy="105" r="2.5" fill="#f43f5e" />
                      <text x="198" y="91" fill="#f43f5e" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">OMBRO D.</text>
                    </g>

                    {/* Pelvic Simetry Marks */}
                    <g>
                      <circle cx="105" cy="195" r="9" stroke="#a855f7" strokeWidth="0.8" strokeDasharray="2 2" />
                      <circle cx="105" cy="195" r="2.5" fill="#a855f7" />
                      <text x="105" y="181" fill="#a855f7" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">QUADRIL E.</text>
                    </g>
                    <g>
                      <circle cx="195" cy="195" r="9" stroke="#a855f7" strokeWidth="0.8" strokeDasharray="2 2" />
                      <circle cx="195" cy="195" r="2.5" fill="#a855f7" />
                      <text x="195" y="181" fill="#a855f7" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">QUADRIL D.</text>
                    </g>

                    {/* Knee alignment */}
                    <g>
                      <circle cx="110" cy="285" r="6" stroke="#10b981" strokeWidth="0.7" strokeDasharray="2 2" />
                      <circle cx="110" cy="285" r="2" fill="#10b981" />
                    </g>
                    <g>
                      <circle cx="190" cy="285" r="6" stroke="#10b981" strokeWidth="0.7" strokeDasharray="2 2" />
                      <circle cx="190" cy="285" r="2" fill="#10b981" />
                    </g>
                    <text x="150" y="302" fill="#10b981" fontSize="7" fontFamily="monospace" textAnchor="middle" letterSpacing="0.2">ALINHAMENTO DOS JOELHOS</text>

                    {/* Transparent body silhouette template */}
                    <path 
                      d="M150,27 C164,27 168,40 150,83 C132,83 136,40 150,27 Z M95,108 C115,102 135,102 150,102 C165,102 185,102 205,108 L195,195 L180,285 L175,370 L154,370 L150,195 L146,370 L125,370 L120,285 L105,195 Z" 
                      fill="none" 
                      stroke="rgba(0, 240, 255, 0.12)" 
                      strokeWidth="1" 
                    />
                  </svg>
                )}

                {activeStep === 'side' && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Corner Borders */}
                    <path d="M 20 40 L 20 20 L 40 20" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 280 40 L 280 20 L 260 20" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 20 360 L 20 380 L 40 380" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 280 360 L 280 380 L 260 380" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Plumb Level vertical line */}
                    <line x1="150" y1="20" x2="150" y2="380" stroke="rgba(236, 72, 153, 0.7)" strokeWidth="1.2" strokeDasharray="3 3" />

                    {/* Alignment Targets */}
                    <g>
                      <circle cx="150" cy="55" r="7" stroke="#ec4899" strokeWidth="1" />
                      <circle cx="150" cy="55" r="2" fill="#39ff14" />
                      <text x="162" y="58" fill="#ec4899" fontSize="6.5" fontFamily="monospace" fontWeight="bold">1. CANAL AUDITIVO</text>
                    </g>
                    <g>
                      <circle cx="150" cy="110" r="7" stroke="#ec4899" strokeWidth="1" />
                      <circle cx="150" cy="110" r="2" fill="#39ff14" />
                      <text x="162" y="113" fill="#ec4899" fontSize="6.5" fontFamily="monospace" fontWeight="bold">2. EIXO DO OMBRO</text>
                    </g>
                    <g>
                      <circle cx="150" cy="195" r="7" stroke="#ec4899" strokeWidth="1" />
                      <circle cx="150" cy="195" r="2" fill="#39ff14" />
                      <text x="162" y="198" fill="#ec4899" fontSize="6.5" fontFamily="monospace" fontWeight="bold">3. CRISTA PÉLVICA</text>
                    </g>
                    <g>
                      <circle cx="150" cy="285" r="7" stroke="#ec4899" strokeWidth="1" />
                      <circle cx="150" cy="285" r="2" fill="#39ff14" />
                      <text x="162" y="288" fill="#ec4899" fontSize="6.5" fontFamily="monospace" fontWeight="bold">4. JOELHO LATERAL</text>
                    </g>
                    <g>
                      <circle cx="150" cy="360" r="7" stroke="#ec4899" strokeWidth="1" />
                      <circle cx="150" cy="360" r="2" fill="#39ff14" />
                      <text x="162" y="363" fill="#ec4899" fontSize="6.5" fontFamily="monospace" fontWeight="bold">5. TORNOZELO</text>
                    </g>

                    <text x="150" y="24" fill="#ec4899" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold" letterSpacing="0.5">ALINHAR PERFIL COM A LINHA ROSA</text>
                    
                    <path 
                      d="M138,32 C138,25 156,25 156,32 C156,45 140,50 148,83 C155,83 162,100 156,120 C150,140 160,180 152,195 C144,220 155,285 148,360 L140,360 L135,285 Z" 
                      fill="none" 
                      stroke="rgba(236, 72, 153, 0.12)" 
                      strokeWidth="1" 
                    />
                  </svg>
                )}

                {activeStep === 'back' && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 300 400" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Corner Borders */}
                    <path d="M 20 40 L 20 20 L 40 20" stroke="#bd00ff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 280 40 L 280 20 L 260 20" stroke="#bd00ff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 20 360 L 20 380 L 40 380" stroke="#bd00ff" strokeWidth="1.5" strokeLinecap="round" />
                    <path d="M 280 360 L 280 380 L 260 380" stroke="#bd00ff" strokeWidth="1.5" strokeLinecap="round" />

                    {/* Plum Line and Horizontal rules */}
                    <line x1="150" y1="20" x2="150" y2="380" stroke="rgba(189, 0, 255, 0.45)" strokeWidth="1" strokeDasharray="3 3" />
                    <line x1="30" y1="120" x2="270" y2="120" stroke="rgba(189, 0, 255, 0.35)" strokeWidth="0.8" strokeDasharray="2 2" />
                    <line x1="30" y1="195" x2="270" y2="195" stroke="rgba(189, 0, 255, 0.35)" strokeWidth="0.8" strokeDasharray="2 2" />

                    <g>
                      <circle cx="150" cy="85" r="8" stroke="#bd00ff" strokeWidth="1" />
                      <circle cx="150" cy="85" r="2" fill="#39ff14" />
                      <text x="150" y="71" fill="#bd00ff" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">VÉRTEBRA C7</text>
                    </g>

                    <g>
                      <circle cx="112" cy="120" r="8" stroke="#bd00ff" strokeWidth="0.8" strokeDasharray="2 1" />
                      <circle cx="112" cy="120" r="2" fill="#bd00ff" />
                      <text x="112" y="108" fill="#bd00ff" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ESCÁPULA E.</text>
                    </g>
                    <g>
                      <circle cx="188" cy="120" r="8" stroke="#bd00ff" strokeWidth="0.8" strokeDasharray="2 1" />
                      <circle cx="188" cy="120" r="2" fill="#bd00ff" />
                      <text x="188" y="108" fill="#bd00ff" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ESCÁPULA D.</text>
                    </g>

                    <g>
                      <circle cx="106" cy="195" r="8" stroke="#bd00ff" strokeWidth="0.8" strokeDasharray="2 1" />
                      <circle cx="106" cy="195" r="2" fill="#bd00ff" />
                      <text x="106" y="211" fill="#bd00ff" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ILÍACA E.</text>
                    </g>
                    <g>
                      <circle cx="194" cy="195" r="8" stroke="#bd00ff" strokeWidth="0.8" strokeDasharray="2 1" />
                      <circle cx="194" cy="195" r="2" fill="#bd00ff" />
                      <text x="194" y="211" fill="#bd00ff" fontSize="6.5" fontFamily="monospace" textAnchor="middle" fontWeight="bold">ILÍACA D.</text>
                    </g>

                    <text x="150" y="24" fill="#bd00ff" fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold" letterSpacing="0.5">ALINHAMENTO ESCAPULAR / COSTAS</text>
                    
                    <path 
                      d="M150,27 C164,27 168,40 150,83 C132,83 136,40 150,27 Z M95,108 C115,102 135,102 150,102 L205,108 L195,195 L180,285 L175,370 L154,370 L150,195 L146,370 L125,370 L120,285 L105,195 Z" 
                      fill="none" 
                      stroke="rgba(189, 0, 255, 0.12)" 
                      strokeWidth="1" 
                    />
                  </svg>
                )}
                {/* ------------------------------------------------------------- */}
                
                {/* Captured frame button overlay on top of video */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 z-20">
                  <button
                    onClick={handleCaptureFrame}
                    className="w-14 h-14 bg-red-600 border-4 border-white shadow-xl hover:bg-red-500 rounded-full flex items-center justify-center transition-all focus:outline-none cursor-pointer"
                    title="Capturar Foto"
                  />
                  
                  <button
                    onClick={handleStopCamera}
                    className="px-4 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-xs text-slate-300 flex items-center justify-center cursor-pointer"
                  >
                    Sair
                  </button>
                </div>
              </div>
            ) : photos[activeStep] ? (
              <div className="absolute inset-0 flex flex-col justify-between p-4 bg-slate-950">
                <div className="w-full h-full flex items-center justify-center">
                  <img
                    src={photos[activeStep]}
                    alt={`Preview ${guidelines[activeStep].title}`}
                    className="max-w-full max-h-full object-contain rounded-lg aspect-[3/4]"
                  />
                </div>
                <div className="relative z-10 flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => {
                      setPhotos({ ...photos, [activeStep]: undefined });
                    }}
                    className="p-1 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg text-[10px] font-mono text-red-400 flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Limpar
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-4 max-w-xs z-10">
                <Camera className="w-10 h-10 text-slate-500 mx-auto" />
                <div>
                  <h5 className="text-xs font-mono uppercase tracking-wider text-slate-300">Nenhuma Imagem Selecionada</h5>
                  <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                    Ative a webcam do seu celular/computador ou carregue uma imagem direto dos seus arquivos.
                  </p>
                </div>
                
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={handleStartCamera}
                    className="py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 rounded-xl text-xs font-bold font-sans text-white flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-900/30"
                  >
                    <Camera className="w-4 h-4" />
                    Ativar Câmera Web
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="py-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    Enviar Foto Local
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            )}
          </div>
          
          {cameraError && (
            <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[11px] text-red-400 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{cameraError}</span>
            </div>
          )}
        </div>

        {/* Right Column: Guidance details & check list */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2.5">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-black">Guia de Captura</span>
                <h4 className="text-lg font-display font-medium text-white capitalize mt-0.5">Posicionamento: {guidelines[activeStep].title}</h4>
              </div>
              <button
                onClick={() => setShowGuide(true)}
                className="flex items-center gap-1.5 text-[10px] font-mono text-cyan-400 hover:text-cyan-300 bg-cyan-950/40 border border-cyan-400/20 px-2.5 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                <span>Ver Pontos ⨀</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-900 rounded-xl space-y-3.5">
              <div className="flex gap-2 text-xs">
                <div className="w-4 h-4 bg-cyan-400/10 rounded border border-cyan-400 flex items-center justify-center text-[9px] text-cyan-400 font-mono mt-0.5">L</div>
                <div>
                  <span className="font-semibold text-slate-300">Iluminação Uniforme</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Evite sombras fortes laterais para o algoritmo visualizar os contornos do shape.</p>
                </div>
              </div>

              <div className="flex gap-2 text-xs">
                <div className="w-4 h-4 bg-cyan-400/10 rounded border border-cyan-400 flex items-center justify-center text-[9px] text-cyan-400 font-mono mt-0.5">D</div>
                <div>
                  <span className="font-semibold text-slate-300">Distância de 2m</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Seu corpo inteiro deve caber perfeitamente no quadro vertical com folga acima e abaixo.</p>
                </div>
              </div>
            </div>

            {/* Custom check list items */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">CHECKLIST DE POSTURA</span>
              {currentStepInfo.checks.map((text, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Preset Injector Onboarding for quick demo testing */}
          <div className="bg-[#091129]/30 border border-blue-900/40 p-4 rounded-xl space-y-3 pt-3.5">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-mono text-slate-200 font-bold uppercase tracking-wider">Testar com Preset do Treinador</h5>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">
                  Não quer tirar ou carregar fotos suas agora? Injecte fotos e dados de simetria reais clicando no botão abaixo!
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLoadTrainerPresets}
              className="w-full py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all duration-150"
            >
              <span>Injetar Fotos & Dados Demo</span>
            </button>
          </div>

          {/* Ready triggers action */}
          <div className="pt-2">
            {activeStep === 'front' ? (
              <button
                onClick={handleSendStep}
                disabled={!photos.front}
                className={`w-full py-3.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition duration-200 ${
                  photos.front
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white shadow-lg shadow-indigo-900/40 cursor-pointer'
                    : 'bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <span>{photos.front ? 'Enviar Foto de Frente ➔' : 'Capture/Envie a Foto de Frente'}</span>
              </button>
            ) : activeStep === 'side' ? (
              <button
                onClick={handleSendStep}
                disabled={!photos.side}
                className={`w-full py-3.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition duration-200 ${
                  photos.side
                    ? 'bg-gradient-to-r from-pink-600 to-purple-600 hover:opacity-95 text-white shadow-lg shadow-pink-900/40 cursor-pointer'
                    : 'bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <span>{photos.side ? 'Enviar Foto de Lado ➔' : 'Capture/Envie a Foto de Lado'}</span>
              </button>
            ) : (
              <button
                onClick={handleSendStep}
                disabled={!photos.back}
                className={`w-full py-3.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition duration-200 ${
                  photos.back
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-500 hover:opacity-95 text-white shadow-lg shadow-emerald-900/40 cursor-pointer animate-pulse'
                    : 'bg-slate-900 border border-slate-850 text-slate-500 cursor-not-allowed opacity-50'
                }`}
              >
                <span>{photos.back ? 'Enviar Foto de Costas e Gerar Laudo ✓' : 'Capture/Envie a Foto de Costas'}</span>
              </button>
            )}

            <p className="text-center text-[10px] font-mono text-slate-400 mt-2.5 leading-relaxed">
              {activeStep === 'front'
                ? (!photos.front ? 'Etapa 1: Capture ou envie a foto de FRENTE.' : 'Foto de FRENTE pronta! Clique em "Enviar" para ir para a de LADO.')
                : activeStep === 'side'
                ? (!photos.side ? 'Etapa 2: Capture ou envie a foto de LADO (Perfil).' : 'Foto de LADO pronta! Clique em "Enviar" para ir para as COSTAS.')
                : (!photos.back ? 'Etapa 3: Capture ou envie a foto de COSTAS.' : 'Foto de COSTAS pronta! Clique em "Enviar" para finalizar.')}
            </p>
          </div>
        </div>

      </div>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#050814]/95 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
            {/* Top Close button option */}
            <button
              onClick={() => setShowGuide(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors font-sans text-sm p-1 cursor-pointer"
            >
              ✕
            </button>

            {/* Step badge */}
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] font-mono Daniel uppercase tracking-widest font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-400/10 inline-block">
                {activeStep === 'front' ? 'Etapa 1: Frente' : activeStep === 'side' ? 'Etapa 2: Lado (Perfil)' : 'Etapa 3: Costas'}
              </span>
              <h3 className="text-base font-display font-medium text-slate-100 mt-1.5">
                {activeStep === 'front' 
                  ? 'Guia de Posicionamento: Foto de Frente' 
                  : activeStep === 'side' 
                    ? 'Guia de Posicionamento: Foto de Lado' 
                    : 'Guia de Posicionamento: Foto de Costas'}
              </h3>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                {activeStep === 'front'
                  ? 'Fique de pé olhando diretamente para a câmera. O software medirá a simetria de seus ombros, braços, quadril e calinhamentos biológicos.'
                  : activeStep === 'side'
                    ? 'Fique posicionado totalmente de perfil (lado) para a câmera. Mediremos o alinhamento corporal vertical, pelve e pés.'
                    : 'Fique de costas para a câmera. O sistema mapeará o equilíbrio escapular e desnivelamento das cristas ilíacas.'}
              </p>
            </div>

            {/* Visual anatomical points preview panel */}
            <div className="bg-slate-950/80 rounded-xl border border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center p-4">
              {/* Left Column: Visual Body Silhouette */}
              <div className="bg-[#030611]/50 p-2.5 rounded-lg border border-slate-900 flex items-center justify-center">
                {activeStep === 'front' ? (
                  <svg className="w-24 h-36" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Head */}
                    <path d="M50 15 C55 15 57 23 50 23 C43 23 45 15 50 15 Z" fill="#0f1d43" stroke="#00f0ff" strokeWidth="0.8" />
                    {/* Chest/Abdomen */}
                    <path d="M38 30 C45 28 55 28 62 30 L66 45 C60 48 40 48 34 45 Z" fill="#172e6b" stroke="#00f0ff" strokeWidth="0.8" />
                    {/* Pelvis/Legs */}
                    <path d="M34 45 L38 80 L46 80 L50 48 L54 80 L62 80 L66 45 Z" fill="#0e1a40" stroke="#00f0ff" strokeWidth="0.6" />
                    <line x1="50" y1="10" x2="50" y2="135" stroke="#a855f7" strokeWidth="0.5" strokeDasharray="2 2" />
                    {/* Dots with labels references */}
                    <circle cx="50" cy="21" r="2" fill="#39ff14" className="animate-ping" style={{ transformOrigin: '50px 21px' }} />
                    <circle cx="50" cy="21" r="1.5" fill="#39ff14" />
                    <circle cx="38" cy="30" r="1.5" fill="#ff007f" />
                    <circle cx="62" cy="30" r="1.5" fill="#ff007f" />
                    <circle cx="36" cy="52" r="1.5" fill="#ff007f" />
                    <circle cx="64" cy="52" r="1.5" fill="#ff007f" />
                    <circle cx="38" cy="80" r="1.5" fill="#00f0ff" />
                    <circle cx="62" cy="80" r="1.5" fill="#00f0ff" />
                  </svg>
                ) : activeStep === 'side' ? (
                  <svg className="w-24 h-36" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Side Head */}
                    <path d="M50 15 C54 15 54 23 48 23 C44 23 46 15 50 15 Z" fill="#0f1d43" stroke="#ff007f" strokeWidth="0.8" />
                    {/* Side Torso */}
                    <path d="M43 30 C48 28 58 28 54 48 L50 80 L44 80 L41 48 Z" fill="#172e6b" stroke="#ff007f" strokeWidth="0.8" />
                    <line x1="49" y1="10" x2="49" y2="135" stroke="#39ff14" strokeWidth="0.5" strokeDasharray="2 2" />
                    <circle cx="48" cy="20" r="2" fill="#39ff14" className="animate-ping" style={{ transformOrigin: '48px 20px' }} />
                    <circle cx="48" cy="20" r="1.5" fill="#39ff14" />
                    <circle cx="49" cy="31" r="1.5" fill="#39ff14" />
                    <circle cx="48" cy="52" r="1.5" fill="#39ff14" />
                    <circle cx="49" cy="80" r="1.5" fill="#39ff14" />
                  </svg>
                ) : (
                  <svg className="w-24 h-36" viewBox="0 0 100 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Back Head */}
                    <path d="M50 15 C55 15 57 23 50 23 C43 23 45 15 50 15 Z" fill="#0f1d43" stroke="#cd14ff" strokeWidth="0.8" />
                    {/* Back Torso */}
                    <path d="M38 30 C45 28 55 28 62 30 L66 45 C60 48 40 48 34 45 Z" fill="#172e6b" stroke="#cd14ff" strokeWidth="0.8" />
                    {/* Pelvis/Legs */}
                    <path d="M34 45 L38 80 L46 80 L50 48 L54 80 L62 80 L66 45 Z" fill="#0e1a40" stroke="#cd14ff" strokeWidth="0.6" />
                    <line x1="50" y1="10" x2="50" y2="135" stroke="#bd00ff" strokeWidth="0.5" strokeDasharray="2 2" />
                    <circle cx="50" cy="18" r="2" fill="#39ff14" className="animate-ping" style={{ transformOrigin: '50px 18px' }} />
                    <circle cx="50" cy="18" r="1.5" fill="#39ff14" />
                    <circle cx="43" cy="28" r="1.5" fill="#cd14ff" />
                    <circle cx="57" cy="28" r="1.5" fill="#cd14ff" />
                    <circle cx="40" cy="52" r="1.5" fill="#cd14ff" />
                    <circle cx="60" cy="52" r="1.5" fill="#cd14ff" />
                  </svg>
                )}
              </div>

              {/* Right Column: Key Anatomical Points List */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">Landmarks / Pontos</span>
                <div className="space-y-1 text-slate-300">
                  {activeStep === 'front' ? (
                    <>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Cabeça / Queixo</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Ombros (D/E)</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Cotovelos (D/E)</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Cintura / Quadril</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Joelhos (D/E)</div>
                    </>
                  ) : activeStep === 'side' ? (
                    <>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" /> Ouvido / Cervical</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-450 bg-emerald-400" /> Eixo do Ombro</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-430 bg-emerald-400" /> Crista Pélvica</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-420 bg-emerald-400" /> Articulação Joelho</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-emerald-410 bg-emerald-400" /> Eixo Calcanhar</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> Vértebra C7</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" /> Escápula Direita</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" /> Escápula Esquerda</div>
                      <div className="flex items-center gap-1.5 text-[10px]"><span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" /> Cristas Ilíacas</div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Checklist recommendations */}
            <div className="space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-900">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block font-bold text-center sm:text-left">Critérios de Execução</span>
              <div className="space-y-1.5 text-xs text-slate-300">
                {currentStepInfo.checks.map((text, idx) => (
                  <div key={idx} className="flex items-start gap-2 leading-relaxed">
                    <span className="text-cyan-400 font-bold mt-0.5 select-none">✓</span>
                    <span className="text-[11px] text-slate-300">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ready Confirm control */}
            <button
              onClick={() => setShowGuide(false)}
              className="w-full py-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-950/50 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <span>Estou Pronto e Posicionado!</span>
              <span>➔</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
