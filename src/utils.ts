import { PhysicalAssessment } from "./types";

// Dynamic SVG silhouettes for Trainer Preset Photos (styled in cyberpunk neon)
export const MOCK_FRONT_TRAINER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%"><rect width="400" height="600" fill="%23050716"/><defs><radialGradient id="g" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="%231a2c5b"/><stop offset="100%" stop-color="%23050716"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="400" height="600" fill="url(%23g)"/><path d="M 200,80 C 230,80 230,150 200,150 C 170,150 170,80 200,80 Z" fill="%230f1d43" stroke="%2300f0ff" stroke-width="2" filter="url(%23glow)"/><path d="M 152,190 C 180,180 220,180 248,190 L 260,260 C 240,270 160,270 140,260 Z" fill="%23172e6b" stroke="%2300f0ff" stroke-width="2" filter="url(%23glow)"/><path d="M 140,260 L 145,340 C 155,360 245,360 255,340 L 260,260" fill="%23122556" stroke="%2300f0ff" stroke-dasharray="2 2"/><path d="M 148,340 L 170,550 L 195,550 L 192,380 L 208,380 L 205,550 L 230,550 L 252,340 Z" fill="%230e1a40" stroke="%2300f0ff" stroke-width="1.5"/><path d="M 152,190 L 115,280 C 110,300 120,314 130,290 L 140,260" fill="none" stroke="%2300f0ff" stroke-width="1.5"/><path d="M 248,190 L 285,280 C 290,300 280,314 270,290 L 260,260" fill="none" stroke="%2300f0ff" stroke-width="1.5"/><line x1="200" y1="150" x2="200" y2="380" stroke="%23bd00ff" stroke-width="1" stroke-dasharray="4 4" filter="url(%23glow)"/><circle cx="200" cy="220" r="4" fill="%23ff007f"/><circle cx="176" cy="190" r="4" fill="%2300f0ff"/><circle cx="224" cy="190" r="4" fill="%2300f0ff"/><circle cx="180" cy="340" r="4" fill="%2300f0ff"/><circle cx="220" cy="340" r="4" fill="%2300f0ff"/><circle cx="185" cy="460" r="4" fill="%2300f0ff"/><circle cx="215" cy="460" r="4" fill="%2300f0ff"/><text x="200" y="580" fill="%2300f0ff" font-family="monospace" font-size="12" text-anchor="middle" letter-spacing="2">TRAINER - FRENTE</text></svg>`;

export const MOCK_SIDE_TRAINER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%"><rect width="400" height="600" fill="%23050716"/><defs><radialGradient id="g" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="%231a2c5b"/><stop offset="100%" stop-color="%23050716"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="400" height="600" fill="url(%23g)"/><path d="M 185,85 C 215,80 215,150 185,145 C 165,145 165,85 185,85 Z" fill="%230f1d43" stroke="%23ff007f" stroke-width="2" filter="url(%23glow)"/><path d="M 160,192 C 190,170 230,185 225,250 L 210,340 C 200,355 180,355 170,340 Z" fill="%23172e6b" stroke="%23ff007f" stroke-width="2" filter="url(%23glow)"/><path d="M 175,340 L 180,550 L 205,550 L 210,340 Z" fill="%230e1a40" stroke="%23ff007f" stroke-width="1.5"/><path d="M 190,195 L 175,275 C 170,290 185,295 190,270 L 195,230" fill="none" stroke="%23ff007f" stroke-width="1.5"/><line x1="200" y1="40" x2="200" y2="560" stroke="%2339ff14" stroke-width="1.5" stroke-dasharray="5 5" filter="url(%23glow)"/><circle cx="200" cy="115" r="5" fill="%2339ff14"/><circle cx="200" cy="210" r="5" fill="%2339ff14"/><circle cx="200" cy="340" r="5" fill="%2339ff14"/><circle cx="200" cy="450" r="5" fill="%2339ff14"/><circle cx="200" cy="550" r="5" fill="%2339ff14"/><text x="200" y="580" fill="%23ff007f" font-family="monospace" font-size="12" text-anchor="middle" letter-spacing="2">TRAINER - PERFIL</text></svg>`;

export const MOCK_BACK_TRAINER = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" width="100%" height="100%"><rect width="400" height="600" fill="%23050716"/><defs><radialGradient id="g" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="%231a2c5b"/><stop offset="100%" stop-color="%23050716"/></radialGradient><filter id="glow"><feGaussianBlur stdDeviation="6" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><rect width="400" height="600" fill="url(%23g)"/><path d="M 200,80 C 230,80 230,150 200,150 C 170,150 170,80 200,80 Z" fill="%230f1d43" stroke="%23cd14ff" stroke-width="2" filter="url(%23glow)"/><path d="M 152,190 C 180,180 220,180 248,190 L 260,260 C 240,270 160,270 140,260 Z" fill="%23172e6b" stroke="%23cd14ff" stroke-width="2" filter="url(%23glow)"/><path d="M 148,340 L 170,550 L 195,550 L 192,380 L 208,380 L 205,550 L 230,550 L 252,340 Z" fill="%230e1a40" stroke="%23cd14ff" stroke-width="1.5"/><circle cx="200" cy="188" r="4" fill="%2339ff14"/><circle cx="170" cy="220" r="4" fill="%23cd14ff"/><circle cx="230" cy="220" r="4" fill="%23cd14ff"/><circle cx="180" cy="340" r="4" fill="%23cd14ff"/><circle cx="220" cy="340" r="4" fill="%23cd14ff"/><text x="200" y="580" fill="%23cd14ff" font-family="monospace" font-size="12" text-anchor="middle" letter-spacing="2">TRAINER - COSTAS</text></svg>`;

export const DEFAULT_HISTORY_DEMO: PhysicalAssessment[] = [
  {
    id: "assess_demo_1",
    date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
    weight: 88.5,
    photos: {
      front: MOCK_FRONT_TRAINER,
      side: MOCK_SIDE_TRAINER,
      back: MOCK_BACK_TRAINER
    },
    metrics: {
      bodyFat: 21.8,
      muscleMass: "moderada",
      waterRetention: "alta",
      score: 72,
      postureRating: "desvios_leves",
      symmetryRating: "necessita_equilibrio"
    },
    postureDetails: {
      shoulders: "Ombros caídos com rotação interna pronunciada (-1.8° de desnível) e leve protusão escapular.",
      leveling: "Alinhamento do quadril em estabilidade primária com desvio lateral esquerdo de 0.6cm.",
      pelvis: "Inclinação pélvica anterior (Pelvic Tilt) de 5.2° com hiponeutralidade lombar compensatória.",
      notes: "Contratura reflexa por hábitos posturais sedentários prolongados."
    },
    symmetryDetails: {
      leftArmVsRightArm: "Assimetria significativa: Bíceps esquerdo (-1.2cm) menor em relação ao dominante.",
      leftLegVsRightLeg: "Simetria de coxas estável com gap de volume menor que 0.3cm.",
      torsoBalance: "Desnível de ativação no quadrado lombar esquerdo.",
      dominance: "Destro natural"
    },
    evolution: {
      summary: "Ponto inicial registrado. Foco principal em estimulação metabólica e correção postural."
    },
    aiInsights: [
      "Focar em deficit calórico seguro de 300 kcal focado em consumo de carboidratos complexos.",
      "Para corrigir Ombros Caídos: Iniciar rotina de alongamento de peitorais com fortalecimento imediato de trapézio inferior, romboides e manguito rotador.",
      "Para estabilizar a Inclinação Pélvica: Executar retroversão pélvica ativa em pontes para glúteo e alongar ativamente o psoas ilíaco.",
      "Aumentar ingesta proteica para manter tônus e evitar catabolismo durante o emagrecimento.",
      "Para corrigir Assimetrias de Braço: Incluir rosca alternada com foco unilateral na fase excêntrica do braço esquerdo."
    ],
    landmarks: {
      front: [
        { x: 50, y: 15, label: "Cabeça / Queixo" },
        { x: 38, y: 25, label: "Ombro Esquerdo" },
        { x: 62, y: 25, label: "Ombro Direito" },
        { x: 30, y: 40, label: "Cotovelo Esquerdo" },
        { x: 70, y: 40, label: "Cotovelo Direito" },
        { x: 34, y: 48, label: "Cintura Direita" },
        { x: 66, y: 48, label: "Cintura Esquerda" },
        { x: 36, y: 56, label: "Quadril Esquerdo" },
        { x: 64, y: 56, label: "Quadril Direito" },
        { x: 38, y: 72, label: "Joelho Esquerdo" },
        { x: 62, y: 72, label: "Joelho Direito" },
        { x: 40, y: 88, label: "Tornozelo Esquerdo" },
        { x: 60, y: 88, label: "Tornozelo Direito" }
      ],
      side: [
        { x: 50, y: 12, label: "Ouvido (Alinhamento)" },
        { x: 51, y: 25, label: "Ombro (Eixo)" },
        { x: 48, y: 56, label: "Grom trocanter (Quadril)" },
        { x: 52, y: 73, label: "Patela (Joelho)" },
        { x: 50, y: 88, label: "Maléolo (Tornozelo)" }
      ],
      back: [
        { x: 50, y: 18, label: "C7 Vértebra (Pescoço)" },
        { x: 36, y: 26, label: "Escápula Esquerda" },
        { x: 64, y: 26, label: "Escápula Direita" },
        { x: 37, y: 55, label: "Crista Ilíaca Esquerda" },
        { x: 63, y: 55, label: "Crista Ilíaca Direita" }
      ]
    }
  },
  {
    id: "assess_demo_2",
    date: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
    weight: 86.2,
    photos: {
      front: MOCK_FRONT_TRAINER, // Same profile but simulated progress
      side: MOCK_SIDE_TRAINER,
      back: MOCK_BACK_TRAINER
    },
    metrics: {
      bodyFat: 19.4,
      muscleMass: "moderada",
      waterRetention: "alta",
      score: 79,
      postureRating: "boa",
      symmetryRating: "estavel"
    },
    postureDetails: {
      shoulders: "Melhoria: Ombros menos caídos (-0.7°); rotação interna reduzida devido a rotina de fortalecimento do manguito.",
      leveling: "Alinhamento do quadril centralizado no eixo pélvico e plano coronal estável.",
      pelvis: "Inclinação pélvica anterior reduzida de 5.2° para 3.8° (retorno gradual ao eixo neutro).",
      notes: "Postura significativamente mais ereta e equilibrada nos pontos de fixação lateral."
    },
    symmetryDetails: {
      leftArmVsRightArm: "Braço esquerdo em recomposição ativa, gap reduzido de -1.2cm para -0.4cm.",
      leftLegVsRightLeg: "Simetria quadríceps muscular perfeitamente preservada.",
      torsoBalance: "Perfeita estabilização torácica e equilíbrio do quadrado lombar bilateral.",
      dominance: "Destro natural"
    },
    evolution: {
      weightDiff: -2.3,
      bodyFatDiff: -2.4,
      muscleGainEstimated: 0.2,
      summary: "Excelente queima lipídica corporal! Evolução acelerada de postura e redução de assimetria unilateral de membro devido a exercícios direcionados."
    },
    aiInsights: [
      "Perfeito progresso! Continuar focado em cardio leve a moderado em dias alternados.",
      "Para manter controle de Ombros Caídos: Continuar com crucifixo invertido e remadas com ênfase na contração escapular.",
      "Para manter Alinhamento Pélvico: Continuar reforçando o core profundo (Transverso do abdômen) e glúteos.",
      "Inserir remada curvada suspensa ou pegada neutra aberta para alinhar a coluna posterior."
    ],
    landmarks: {
      front: [
        { x: 50, y: 15, label: "Cabeça / Queixo" },
        { x: 38, y: 25, label: "Ombro Esquerdo" },
        { x: 62, y: 25, label: "Ombro Direito" },
        { x: 30, y: 40, label: "Cotovelo Esquerdo" },
        { x: 70, y: 40, label: "Cotovelo Direito" },
        { x: 34, y: 48, label: "Cintura Direita" },
        { x: 66, y: 48, label: "Cintura Esquerda" },
        { x: 36, y: 56, label: "Quadril Esquerdo" },
        { x: 64, y: 56, label: "Quadril Direito" },
        { x: 38, y: 72, label: "Joelho Esquerdo" },
        { x: 62, y: 72, label: "Joelho Direito" },
        { x: 40, y: 88, label: "Tornozelo Esquerdo" },
        { x: 60, y: 88, label: "Tornozelo Direito" }
      ],
      side: [
        { x: 50, y: 12, label: "Ouvido (Alinhamento)" },
        { x: 51, y: 25, label: "Ombro (Eixo)" },
        { x: 48, y: 56, label: "Grom trocanter (Quadril)" },
        { x: 52, y: 73, label: "Patela (Joelho)" },
        { x: 50, y: 88, label: "Maléolo (Tornozelo)" }
      ],
      back: [
        { x: 50, y: 18, label: "C7 Vértebra (Pescoço)" },
        { x: 36, y: 26, label: "Escápula Esquerda" },
        { x: 64, y: 26, label: "Escápula Direita" },
        { x: 37, y: 55, label: "Crista Ilíaca Esquerda" },
        { x: 63, y: 55, label: "Crista Ilíaca Direita" }
      ]
    }
  }
];

export function formatDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  } catch (e) {
    return isoString;
  }
}

export function translateGoal(goal: string): string {
  switch (goal) {
    case "emagrecer":
      return "Definir e Perder Células de Gordura";
    case "ganhar_massa":
      return "Hipertrofia e Ganho de Massa Magra";
    case "definicao":
      return "Definição Muscular Avançada";
    case "saude":
      return "Alinhamento de Postura e Saúde";
    default:
      return goal;
  }
}
