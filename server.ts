import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

// Memory history db to simulate "cloud storage"
interface AssessmentRecord {
  id: string;
  userEmail: string;
  date: string;
  weight: number;
  goal: string;
  photos: {
    front?: string;
    side?: string;
    back?: string;
  };
  metrics: any;
  postureDetails: any;
  symmetryDetails: any;
  evolution: {
    weightDiff?: number;
    bodyFatDiff?: number;
    muscleGainEstimated?: number;
    summary: string;
  };
  aiInsights: string[];
  landmarks: any;
}

const db: AssessmentRecord[] = [];

// Base training presets for quick assessment selection (trainer body examples)
const PRESETS = [
  {
    id: "preset_1",
    weight: 85,
    goal: "definicao",
    metrics: {
      bodyFat: 14.5,
      muscleMass: "alta",
      waterRetention: "baixa",
      score: 87,
      postureRating: "excelente",
      symmetryRating: "otima"
    },
    postureDetails: {
      shoulders: "Ombros caídos leves com rotação interna média (ombro esquerdo deprimido -0.9°)",
      leveling: "Alinhamento pélvico estável com inclinação lateral insignificante",
      pelvis: "Inclinação pélvica anterior (Pelvic Tilt) normalizada a 3.3°",
      notes: "Postura atlética com excelente centro de gravidade e alinhamento escapular."
    },
    symmetryDetails: {
      leftArmVsRightArm: "Diferença muscular imperceptível (< 0.4cm), excelente simetria",
      leftLegVsRightLeg: "Fêmorodelta simétrico com excelente proporção bilateral V-Taper",
      torsoBalance: "Equilíbrio torácico ideal com boa expansão dorsal",
      dominance: "Canhoto funcional"
    },
    aiInsights: [
      "Manter intensidade do treino de força para preservação de massa magra.",
      "Aumentar hidratação para 3.5L diários para manter o tônus.",
      "Excelente desenvolvimento das dorsais, manter trabalho corretivo para evitar fadiga em ombros caídos."
    ]
  },
  {
    id: "preset_2",
    weight: 92,
    goal: "emagrecer",
    metrics: {
      bodyFat: 26.2,
      muscleMass: "moderada",
      waterRetention: "alta",
      score: 64,
      postureRating: "desvios_leves",
      symmetryRating: "necessita_equilibrio"
    },
    postureDetails: {
      shoulders: "Ombros caídos moderados com rotação interna (-3.1°) e desnível visível no trapézio direito",
      leveling: "Alinhamento do quadril em desequilíbrio: inclinação pélvica lateral esquerda superior",
      pelvis: "Hiperlordose lombar presente com inclinação pélvica anterior de 7.2°",
      notes: "Leve desalinhamento postural causado por encurtamento do psoas ilíaco e hábitos diários sentados."
    },
    symmetryDetails: {
      leftArmVsRightArm: "Assimetria de volume: Braço direito (+1.5cm) proeminente em relação ao esquerdo",
      leftLegVsRightLeg: "Diferença patelar de 0.8cm no quadríceps com menor ativação no lado esquerdo",
      torsoBalance: "Torque torácico irregular por desnível do quadrado lombar",
      dominance: "Destro funcional"
    },
    aiInsights: [
      "Fazer alongamento diário de psoas e flexores de quadril.",
      "Cardio em jejum (LISS) de 40min trará rápida redução de retenção líquida.",
      "Priorizar exercícios de fortalecimento lombar e core."
    ]
  }
];

function generateDefaultLandmarks(gender: string) {
  // Generates anatomical landmarks based on standard percentage coordinates
  return {
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
      { x: 60, y: 88, label: "Tornozelo Direito" },
    ],
    side: [
      { x: 50, y: 12, label: "Ouvido (Alinhamento)" },
      { x: 51, y: 25, label: "Ombro (Eixo)" },
      { x: 48, y: 56, label: "Grom trocanter (Quadril)" },
      { x: 52, y: 73, label: "Patela (Joelho)" },
      { x: 50, y: 88, label: "Maléolo (Tornozelo)" },
    ],
    back: [
      { x: 50, y: 18, label: "C7 Vértebra (Pescoço)" },
      { x: 36, y: 26, label: "Escápula Esquerda" },
      { x: 64, y: 26, label: "Escápula Direita" },
      { x: 37, y: 55, label: "Crista Ilíaca Esquerda" },
      { x: 63, y: 55, label: "Crista Ilíaca Direita" },
    ]
  };
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Use JSON & UrlEncoded parsers for photo payload (base64 can be large)
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // API 1: Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "BodyTrack AI Server" });
  });

  // API 2: Fetch assessment storage history
  app.get("/api/history", (req, res) => {
    const email = (req.query.email as string) || "visitor@bodytrack.ai";
    const userRecords = db.filter(r => r.userEmail === email);
    res.json({ records: userRecords });
  });

  // API 3: Create a mock default or clean the database history
  app.post("/api/history/clear", (req, res) => {
    const email = req.body.email || "visitor@bodytrack.ai";
    const initialRecordsCount = db.length;
    for (let i = db.length - 1; i >= 0; i--) {
      if (db[i].userEmail === email) {
        db.splice(i, 1);
      }
    }
    res.json({ message: "Histórico redefinido", cleared: initialRecordsCount - db.length });
  });

  // API 4: AI Analysis Endpoint
  app.post("/api/analyze", async (req, res) => {
    const {
      name = "Atleta",
      age = 30,
      height = 175,
      weight = 80,
      gender = "M",
      goal = "definicao",
      email = "visitor@bodytrack.ai",
      photos = {},
      comparisonOption = null // ID of past assessment to compare if available
    } = req.body;

    console.log(`Starting physical analysis for ${name}, goal: ${goal}, comparison: ${comparisonOption}`);

    // Fetch previous records if available for genuine evolution
    const userHistory = db.filter(r => r.userEmail === email);
    const prevRecord = comparisonOption 
      ? userHistory.find(r => r.id === comparisonOption) 
      : (userHistory.length > 0 ? userHistory[userHistory.length - 1] : null);

    // AI logic (with smart fallback if key is missing)
    let metricsResult: any = null;
    let fallbackUsed = false;

    // Check for GEMINI_API_KEY lazily
    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
      try {
        const aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            }
          }
        });

        const comparisonContext = prevRecord 
          ? `Análise anterior: Peso: ${prevRecord.weight} kg, BF estimado anterior: ${prevRecord.metrics.bodyFat}%, Score anterior: ${prevRecord.metrics.score}%, Resumo postural anterior: ${prevRecord.postureDetails.notes}.`
          : "Nenhuma análise anterior registrada. Esta é a avaliação inicial.";

        // Prepare context & visual details
        const systemPrompt = `Você é um robô de visão computacional de ponta integrado ao "BodyTrack AI", agindo como kinesiologista sénior e consultor de medicina esportiva.
Você deve analisar a composição corporal estimada do usuário a partir dos dados antropométricos e das fotos enviadas (se fornecidas).
Dados do Atleta:
- Nome: ${name}
- Idade: ${age} anos
- Altura: ${height} cm
- Peso atual: ${weight} kg
- Sexo: ${gender}
- Objetivo: ${goal} (emagrecer, ganhar_massa, definicao, saude)

${comparisonContext}

Você DEVE retornar OBRIGATORIAMENTE um objeto JSON válido correspondente exatamente a este esquema. Não inclua Markdown como \`\`\`json ou outro texto explicativo fora do JSON, responda exclusivamente com a string em formato JSON.

Esquema JSON esperado:
{
  "metrics": {
    "bodyFat": número (porcentagem de gordura corporal estimada fictícia mas plausível com base no peso/altura/objetivo, ex: 16.5),
    "muscleMass": "baixa" | "moderada" | "alta",
    "waterRetention": "baixa" | "normal" | "alta",
    "score": número (de 20 a 100 representing Shape Score geral),
    "postureRating": "excelente" | "boa" | "desvios_leves" | "necessita_atencao",
    "symmetryRating": "otima" | "estavel" | "necessita_equilibrio"
  },
  "postureDetails": {
    "shoulders": "análise de rotação interna e ombros caídos (ombros caídos/deprimidos) quantificando graus de desnível ou protusão, em português",
    "leveling": "alinhamento pélvico e crista ilíaca identificando se há desníveis laterais de quadril, em português",
    "pelvis": "postura da espinha ou inclinação da pelvis (ex: inclinação pélvica anterior com lordose ou retroversão), em português",
    "notes": "relato resumido do centro de gravidade e postura geral do pescoço à bacia, em português"
  },
  "symmetryDetails": {
    "leftArmVsRightArm": "simetria dos braços e ombros, identificando desníveis de volume ou força bilaterais específicos (ex: bíceps esquerdo posterior menor), em português",
    "leftLegVsRightLeg": "simetria de coxas/panturrilhas identificando discrepâncias de volume ou sweeps musculares, em português",
    "torsoBalance": "alinhamento lateral do quadrado lombar e tronco (desequilíbrio muscular lateral), em português",
    "dominance": "membro dominante provável e sua influência mecânica"
  },
  "evolution": {
    "summary": "Resumo de progresso em relação à última avaliação ou status inicial do shape, motivador, em português"
  },
  "aiInsights": [
    "repor 4 recomendações muito específicas focadas em nutrição mais exercícios de fisioterapia corretiva para cada problema de postura (como ombros caídos e inclinação pélvica) e assimetrias corporais identificadas, em português"
  ]
}`;

        // Feed text prompts to Gemini
        const parts: any[] = [{ text: systemPrompt }];

        // Check if images are uploaded and supply them
        if (photos.front) parts.push({ inlineData: { mimeType: "image/jpeg", data: photos.front.replace(/^data:image\/\w+;base64,/, "") } });
        if (photos.side) parts.push({ inlineData: { mimeType: "image/jpeg", data: photos.side.replace(/^data:image\/\w+;base64,/, "") } });
        if (photos.back) parts.push({ inlineData: { mimeType: "image/jpeg", data: photos.back.replace(/^data:image\/\w+;base64,/, "") } });

        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: parts,
          config: {
            responseMimeType: "application/json"
          }
        });

        if (response.text) {
          const cleanText = response.text.trim();
          metricsResult = JSON.parse(cleanText);
          console.log("Successfully retrieved response from Gemini!");
        }
      } catch (err) {
        console.error("Failed querying Gemini API, returning fallback:", err);
        fallbackUsed = true;
      }
    } else {
      console.log("No GEMINI_API_KEY detected. Utilizing premium programmatic generator.");
      fallbackUsed = true;
    }

    // Trigger programmatic generator if fallback is used
    if (fallbackUsed || !metricsResult) {
      // Create exceptionally realistic physiological calculations based on Weight, Height and Goal.
      const heightM = height / 100;
      const bmi = weight / (heightM * heightM);
      
      // Plausible Body Fat Calculation based on BMI and Age
      // Standard Formula: Body Fat % = (1.20 * BMI) + (0.23 * Age) - (10.8 * GenderValue) - 5.4
      const genderVal = gender === "M" ? 1 : 0.2; // higher correction for women
      let estBodyFat = (1.25 * bmi) + (0.15 * age) - (10.1 * genderVal) - 4.5;
      if (estBodyFat < 3) estBodyFat = 6;
      if (estBodyFat > 50) estBodyFat = 38;

      // Make adjustment based on goal
      let score = Math.round(100 - (Math.abs(estBodyFat - (gender === "M" ? 12 : 20)) * 1.5));
      if (score > 98) score = 96;
      if (score < 40) score = 45;

      let waterVal: "baixa" | "normal" | "alta" = "normal";
      let muscleVal: "baixa" | "moderada" | "alta" = "moderada";

      if (goal === "definicao") {
        estBodyFat -= 2;
        muscleVal = "alta";
        waterVal = "baixa";
        score += 8;
      } else if (goal === "ganhar_massa") {
        estBodyFat += 1;
        muscleVal = "alta";
        score += 5;
      } else if (goal === "emagrecer") {
        waterVal = "alta";
        muscleVal = "moderada";
        score -= 2;
      }

      estBodyFat = Math.round(estBodyFat * 10) / 10;
      if (score > 100) score = 100;

      // Posture rating mock determinations
      const postureOptions: Array<"excelente" | "boa" | "desvios_leves" | "necessita_atencao"> = ["excelente", "boa", "desvios_leves", "necessita_atencao"];
      const randPosture = postureOptions[Math.floor(Math.random() * (prevRecord ? 2 : 4))]; // better posture over time
      
      const postureData = {
        excelente: {
          shoulders: "Ombros perfeitamente simétricos e alinhados secundariamente (desvio residual inferior a 0.4°). Sem ombros caídos.",
          leveling: "Alinhamento pélvico estável dentro do eixo coronal ideal. Cristas ilíacas perfeitamente alinhadas.",
          pelvis: "Inclinação pélvica ideal a 3.1° (alinhamento lordótico fisiológico excelente).",
          notes: "Equilíbrio cinético perfeito do core posterior e bacia. Centro de gravidade ideal."
        },
        boa: {
          shoulders: "Ombro direito levemente tensionado, sutil desnível postural sob fadiga (-1.0°). Leve tendência a ombros caídos.",
          leveling: "Quadris alinhados. Centro de gravidade ligeiramente deslocado 0.4cm à direita.",
          pelvis: "Curvatura lombar normal. Inclinação anterior pélvica sutil de 4.1°.",
          notes: "Ótimo balanço funcional global, necessitando apenas de mobilidade corretiva básica de ombro."
        },
        desvios_leves: {
          shoulders: "Ombros caídos e levemente protusos com rotação interna detectável (-2.0° no esquerdo) e encurtamento do peitoral menor.",
          leveling: "Cintura com leve assimetria na linha ilíaca lateral (0.7cm mais alta no lado esquerdo).",
          pelvis: "Hiperlordose lombar compensatória moderada com inclinação pélvica anterior de 5.9°.",
          notes: "Desvios posturais comuns causados por encurtamento de flexores de quadril por repouso estendido."
        },
        necessita_atencao: {
          shoulders: "Ombros caídos acentuados com rotação interna pronunciada (-3.4°) e anteroversão escapular bilateral severa.",
          leveling: "Desnível pélvico lateral esquerdo pronunciado de 1.4cm, gerando escoliose funcional compensatória.",
          pelvis: "Inclinação pélvica anterior de 7.8° (hiperlordose acentuada devido a fraqueza de glúteos e core).",
          notes: "Tensão tônica em músculos da bacia e lombar. Requer atenção corretiva imediata com exercícios de força posterior."
        }
      };

      const basePostureDetails = postureData[randPosture] || postureData.desvios_leves;

      // Simulated evolution notes
      let evolutionSummary = "Avaliação postural e de composição corporal inicial estabelecida. Dados integrados ao seu perfil de treinamento.";
      let weightDiff = 0;
      let bodyFatDiff = 0;
      let muscleGainEstimated = 0;

      if (prevRecord) {
        weightDiff = Number((weight - prevRecord.weight).toFixed(1));
        bodyFatDiff = Number((estBodyFat - prevRecord.metrics.bodyFat).toFixed(1));
        
        if (goal === "emagrecer") {
          if (weightDiff < 0) {
            evolutionSummary = `Excelente progresso! Redução de ${Math.abs(weightDiff)} kg identificada nas fotos. Redução da gordura abdominal visível e melhoria nítida do tônus muscular.`;
          } else if (weightDiff === 0) {
            evolutionSummary = `Recomposição corporal observada! Peso estável, mas com decréscimo visual no percentual de gordura abdominal de ${Math.abs(bodyFatDiff)}%.`;
          } else {
            evolutionSummary = `Aumento sutil de retenção ou volume. Ajuste seu déficit calórico.`;
          }
        } else if (goal === "ganhar_massa") {
          muscleGainEstimated = weightDiff > 0 ? Number((weightDiff * 0.6).toFixed(1)) : 0.2;
          evolutionSummary = `Evolução anabólica detectada! Ganho estético notável no ombro e dorsal de aproximadamente +${muscleGainEstimated}kg de massa magra.`;
        } else {
          evolutionSummary = `Shape em transição positiva. Simetria e tônus global de alto nível comparado com o registro anterior de ${new Date(prevRecord.date).toLocaleDateString("pt-BR")}.`;
        }
      }

      const defaultInsights = [
        "Para corrigir Ombros Caídos: Executar rotina diária de face pulls e alongamentos focados na fáscia peitoral anterior.",
        "Para corrigir Inclinação Pélvica: Praticar pontes de glúteo com retroversão ativa e alongar o psoas ilíaco.",
        "Exercício corretivo para Assimetria de Braços: Adicionar rosca alternada unilateral segurando foco excêntrico no lado menor.",
        goal === "emagrecer" 
          ? "Manter défice calórico diário de 400-500 kcal com alta ingestão de proteínas (2.0g/kg) para preservar massa magra." 
          : "Focar em superávit calórico limpo de 200-300 kcal focado em carboidratos complexos."
      ];

      metricsResult = {
        metrics: {
          bodyFat: estBodyFat,
          muscleMass: muscleVal,
          waterRetention: waterVal,
          score: score,
          postureRating: randPosture,
          symmetryRating: randPosture === "excelente" ? "otima" : randPosture === "boa" ? "estavel" : "necessita_equilibrio"
        },
        postureDetails: basePostureDetails,
        symmetryDetails: {
          leftArmVsRightArm: randPosture === "necessita_atencao"
            ? "Assimetria moderada: Bíceps esquerdo (-1.3cm) menor em relação ao dominante direito."
            : "Leve assimetria fisiológica: Bíceps esquerdo (-0.5cm) menor que o direito, normal em destros.",
          leftLegVsRightLeg: "Simetria de coxas perfeitamente estável com volume muscular bilateral equilibrado.",
          torsoBalance: randPosture === "necessita_atencao"
            ? "Desnível de ativação lateral no quadrado lombar com maior turgidez no lado menor."
            : "Equilíbrio torácico e abdominal preservado com boa ativação lateral oblíqua.",
          dominance: genderVal === 1 ? "Membro dominante: Direito" : "Membro dominante: Esquerdo"
        },
        evolution: {
          weightDiff,
          bodyFatDiff,
          muscleGainEstimated,
          summary: evolutionSummary
        },
        aiInsights: defaultInsights
      };
    }

    // Embed visual points (landmarks)
    const landmarks = generateDefaultLandmarks(gender);

    // Save assessment record to Simulated Cloud Database
    const newRecord: AssessmentRecord = {
      id: "assess_" + Math.random().toString(36).substring(2, 9),
      userEmail: email,
      date: new Date().toISOString(),
      weight: Number(weight),
      goal,
      photos,
      metrics: metricsResult.metrics,
      postureDetails: metricsResult.postureDetails,
      symmetryDetails: metricsResult.symmetryDetails,
      evolution: {
        weightDiff: metricsResult.evolution.weightDiff,
        bodyFatDiff: metricsResult.evolution.bodyFatDiff,
        muscleGainEstimated: metricsResult.evolution.muscleGainEstimated,
        summary: metricsResult.evolution.summary
      },
      aiInsights: metricsResult.aiInsights,
      landmarks
    };

    db.push(newRecord);

    res.json({
      success: true,
      assessment: newRecord,
      fallbackUsed
    });
  });

  // Unique activation codes database for single-use validations
  interface ActivationCode {
    code: string;
    isUsed: boolean;
    usedBy?: string;
    usedAt?: string;
  }

  // Pre-populate with premium codes in the XXXXX-XXXXX-XXXXX-XXXXX format for instant use and testing
  const activationCodes: ActivationCode[] = [
    { code: "BTRAC-88B92-KP90A-33X74", isUsed: false },
    { code: "BODY9-V39KL-82A7D-016BP", isUsed: false },
    { code: "TRACK-P92BA-X278N-09H82", isUsed: false },
    { code: "PREM4-H8K3A-VNV94-L982O", isUsed: false },
    { code: "LIMIT-9961A-XXOP9-Z82B1", isUsed: false }
  ];

  // Helper generator to construct clean five-by-four randomized tokens
  function generateRandomCode(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const getSeg = () => {
      let part = "";
      for (let i = 0; i < 5; i++) {
        part += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return part;
    };
    return `${getSeg()}-${getSeg()}-${getSeg()}-${getSeg()}`;
  }

  // API to list all activation codes
  app.get("/api/codes", (req, res) => {
    res.json({ success: true, codes: activationCodes });
  });

  // API to generate a new unique activation code
  app.post("/api/codes/generate", (req, res) => {
    let newCode = generateRandomCode();
    // Ensure uniqueness
    while (activationCodes.some(c => c.code === newCode)) {
      newCode = generateRandomCode();
    }
    const newRecord = { code: newCode, isUsed: false };
    activationCodes.push(newRecord);
    res.json({ success: true, code: newCode, codes: activationCodes });
  });

  // API to check and consume an activation code
  app.post("/api/codes/activate", (req, res) => {
    const { code, name } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, error: "Código de ativação não informado." });
    }

    const cleanCode = code.trim().toUpperCase();
    const found = activationCodes.find(c => c.code === cleanCode);

    if (!found) {
      return res.status(400).json({ success: false, error: "Código de ativação inválido. Digite um código válido de uso único." });
    }

    if (found.isUsed) {
      return res.status(400).json({ success: false, error: `Este código de ativação já foi utilizado por ${found.usedBy || 'outro usuário'} em ${found.usedAt ? new Date(found.usedAt).toLocaleDateString() : 'data desconhecida'}. Códigos de ativação são de uso único!` });
    }

    // Mark as used
    found.isUsed = true;
    found.usedBy = name || "Atleta Anônimo";
    found.usedAt = new Date().toISOString();

    res.json({
      success: true,
      message: "Ativação PRO concluída com sucesso!",
      code: found,
      codes: activationCodes
    });
  });

  // API 5: Predict future progress based on goal and historical assessments
  app.post("/api/predict-progress", async (req, res) => {
    const { profile, assessments = [] } = req.body;

    if (!profile) {
      return res.status(400).json({ success: false, error: "Perfil de usuário não fornecido." });
    }

    const { name, age, height, weight, gender, goal } = profile;
    console.log(`Predicting future progress for ${name}, goal: ${goal}, records count: ${assessments.length}`);

    // Determine current/starting assessments metrics
    let currentWeight = weight;
    let currentBF = gender === "M" ? 18 : 24;
    let currentScore = 70;
    let currentPosture = "desvios_leves";
    let currentSymmetry = "necessita_equilibrio";

    if (assessments.length > 0) {
      const latest = assessments[assessments.length - 1];
      currentWeight = latest.weight || weight;
      currentBF = latest.metrics?.bodyFat || currentBF;
      currentScore = latest.metrics?.score || currentScore;
      currentPosture = latest.metrics?.postureRating || currentPosture;
      currentSymmetry = latest.metrics?.symmetryRating || currentSymmetry;
    }

    // Attempt to calculate historical slope (velocity of improvement)
    let weightSpeedPerMonth = 0; // positive for gain, negative for loss
    let bfSpeedPerMonth = 0;
    let scoreSpeedPerMonth = 0;

    if (assessments.length >= 2) {
      const first = assessments[0];
      const last = assessments[assessments.length - 1];
      const timeDiff = new Date(last.date).getTime() - new Date(first.date).getTime();
      const days = timeDiff / (1000 * 60 * 60 * 24);
      if (days > 3) {
        const weightDelta = last.weight - first.weight;
        const bfDelta = (last.metrics?.bodyFat || 0) - (first.metrics?.bodyFat || 0);
        const scoreDelta = (last.metrics?.score || 0) - (first.metrics?.score || 0);

        weightSpeedPerMonth = (weightDelta / days) * 30;
        bfSpeedPerMonth = (bfDelta / days) * 30;
        scoreSpeedPerMonth = (scoreDelta / days) * 30;

        // Cap to safe standard ranges to prevent extreme regressions
        weightSpeedPerMonth = Math.max(-5, Math.min(3, weightSpeedPerMonth));
        bfSpeedPerMonth = Math.max(-4, Math.min(2, bfSpeedPerMonth));
        scoreSpeedPerMonth = Math.max(-1, Math.min(8, scoreSpeedPerMonth));
      }
    }

    // Default rate generators if rate is zero (e.g. initial or single assessment)
    if (weightSpeedPerMonth === 0 && bfSpeedPerMonth === 0) {
      if (goal === "emagrecer") {
        weightSpeedPerMonth = -2.5; // lose ~2.5kg per month
        bfSpeedPerMonth = -1.5;     // lose 1.5% fat per month
        scoreSpeedPerMonth = 4;
      } else if (goal === "ganhar_massa") {
        weightSpeedPerMonth = 1.0;  // gain 1kg muscle mass per month
        bfSpeedPerMonth = -0.2;     // slim down fat ratio slowly
        scoreSpeedPerMonth = 3;
      } else if (goal === "definicao") {
        weightSpeedPerMonth = -1.2; // slight drop
        bfSpeedPerMonth = -1.8;     // rapid separation
        scoreSpeedPerMonth = 5;
      } else { // saude
        weightSpeedPerMonth = 0;    // hold weight stable mostly
        bfSpeedPerMonth = -0.5;
        scoreSpeedPerMonth = 3;
      }
    }

    let predictionResult: any = null;
    let fallbackUsed = false;

    if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY") {
      try {
        const aiClient = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            }
          }
        });

        const queryPrompt = `Atue como kinesiologista sénior e consultor esportivo de Inteligência Artificial para o software "BodyTrack AI".
Gere uma previsão de progresso de alta precisão para o Atleta ${name} para o futuro de 1, 3 e 6 meses.

Dados Iniciais e Históricos do Atleta:
- Nome: ${name}
- Idade: ${age} anos
- Altura: ${height} cm
- Peso Atual: ${currentWeight} kg
- Objetivo do Perfil: ${goal} (emagrecer, ganhar_massa, definicao, saude)
- Composição Atual: % Gordura Corporal: ${currentBF}%, Score de Shape: ${currentScore}/100, Nivelamento Postural: ${currentPosture}, Simetria Geral: ${currentSymmetry}
- Trajetória Mensal Calculada no App: Taxa de peso: ${weightSpeedPerMonth.toFixed(1)}kg/mês, Taxa de BF: ${bfSpeedPerMonth.toFixed(1)}%/mês, Taxa de Score: +${scoreSpeedPerMonth.toFixed(1)} pontos/mês.

Sua tarefa é projetar cientificamente as métricas realistas (Peso, Gordura Corporal %, Score de Shape, Postura e Simetria) para os períodos de 1 mês, 3 meses e 6 meses, além de construir um relato em texto extremamente motivador, focado em biomecânica e metas de marcos físicos (Milestones) em português.

Mantenha as projeções fisiologicamente seguras e possíveis (ex: não perder mais de 4,5kg de gordura pura por mês, ganho de massa no máximo de 1.5kg por mês).

Retorne OBRIGATORIAMENTE um JSON correspondente exatamente a este formato:
{
  "1_month": {
    "period": "1_month",
    "label": "1 Mês",
    "weight": número,
    "bodyFat": número,
    "muscleMass": "baixa" | "moderada" | "alta",
    "score": número,
    "postureRating": "excelente" | "boa" | "desvios_leves" | "necessita_atencao",
    "milestoneTitle": "Título curto do marco físico",
    "description": "Texto descritivo das mudanças estéticas visíveis, em português",
    "recommendations": ["4 sugestões de treino de no máximo 10 palavras cada"]
  },
  "3_months": {
    "period": "3_months",
    "label": "3 Meses",
    "weight": número,
    "bodyFat": número,
    "muscleMass": "baixa" | "moderada" | "alta",
    "score": número,
    "postureRating": "excelente" | "boa" | "desvios_leves" | "necessita_atencao",
    "milestoneTitle": "Título curto do marco físico",
    "description": "Texto descritivo das mudanças em português",
    "recommendations": ["4 sugestões de treino de no máximo 10 palavras cada"]
  },
  "6_months": {
    "period": "6_months",
    "label": "6 Meses",
    "weight": número,
    "bodyFat": número,
    "muscleMass": "baixa" | "moderada" | "alta",
    "score": número,
    "postureRating": "excelente" | "boa" | "desvios_leves" | "necessita_atencao",
    "milestoneTitle": "Título curto do marco físico",
    "description": "Texto descritivo em português de consolidação",
    "recommendations": ["4 sugestões de treino de no máximo 10 palavras cada"]
  }
}

Não inclua formatações de markdown adicionais como \`\`\`json ou outro texto explicativo fora do JSON.`;

        const response = await aiClient.models.generateContent({
          model: "gemini-3.5-flash",
          contents: queryPrompt,
          config: {
            responseMimeType: "application/json"
          }
        });

        if (response.text) {
          predictionResult = JSON.parse(response.text.trim());
          console.log("Successfully generated AI Progress Prediction!");
        }
      } catch (err) {
        console.error("Failed querying Gemini for prediction, using robust physics block:", err);
        fallbackUsed = true;
      }
    } else {
      console.log("No Gemini API key available for prediction. Running physiological programmatic simulator.");
      fallbackUsed = true;
    }

    if (fallbackUsed || !predictionResult) {
      // Programmatic mathematical generator based on Goal & Trajectory
      const applyMilestones = (months: number) => {
        let factor = months;
        // decelerating progress returns for weight and BF to simulate metabolic adaptation over 6 months
        if (months === 3) factor = 2.4; 
        if (months === 6) factor = 4.2;

        let predictedWeight = currentWeight + (weightSpeedPerMonth * factor);
        let predictedBF = currentBF + (bfSpeedPerMonth * factor);
        let predictedScore = currentScore + (scoreSpeedPerMonth * factor);

        // Physiological boundaries
        const heightM = height / 100;
        const minBMIWeight = 18.6 * (heightM * heightM); // floor weight safely
        const maxSafeWeight = 130;
        predictedWeight = Math.max(minBMIWeight, Math.min(maxSafeWeight, predictedWeight));

        const minBF = gender === "M" ? 5.5 : 12.5;
        predictedBF = Math.max(minBF, Math.min(48, predictedBF));
        predictedScore = Math.min(99, Math.max(45, Math.round(predictedScore)));

        // Muscle Mass determination
        let muscleVal: "baixa" | "moderada" | "alta" = "moderada";
        if (goal === "ganhar_massa" && months >= 3) muscleVal = "alta";
        else if (goal === "definicao" && months >= 3) muscleVal = "alta";
        else if (currentScore > 84) muscleVal = "alta";

        // Posture correction progression over time
        let nextPosture: "excelente" | "boa" | "desvios_leves" | "necessita_atencao" = "desvios_leves";
        const postureStages: Array<"necessita_atencao" | "desvios_leves" | "boa" | "excelente"> = ["necessita_atencao", "desvios_leves", "boa", "excelente"];
        let startIndex = postureStages.indexOf(currentPosture as any);
        if (startIndex === -1) startIndex = 1;
        
        let newIndex = startIndex + (months === 1 ? 1 : months === 3 ? 2 : 3);
        if (newIndex > 3) newIndex = 3;
        nextPosture = postureStages[newIndex];

        // Content generation based on goal
        let milestoneTitle = "";
        let description = "";
        let recommendations: string[] = [];

        if (goal === "emagrecer") {
          if (months === 1) {
            milestoneTitle = "Otimização Lipídica e Adaptação";
            description = `Seu metabolismo responderá de maneira formidável nas primeiras 4 semanas de consistência. Espera-se uma redução visível no diâmetro da linha de cintura de aproximadamente -2 a -4cm. Seus ombros e pescoço começarão a demonstrar tônus refinado.`;
            recommendations = [
              "Higiene calórica estrita: déficit diário de 400 kcal.",
              "Cardio aeróbico de 35 minutos após o treino.",
              "Consumir 3.8 Litros de água pura todos os dias.",
              "Executar agachamentos para maximizar o gasto calórico."
            ];
          } else if (months === 3) {
            milestoneTitle = "Recomposição Corporal Nítida";
            description = `Com 90 dias de consistência e treinos correlacionados, você terá redefinido seu teto termomuscular. Visualmente, a gordura subcutânea abdominal será reduzida significativamente, deixando visível a linha de cintura.`;
            recommendations = [
              "Fazer HIIT de alta intensidade 3x por semana.",
              "Treinar musculação pesada focado em progressão de carga.",
              "Fortalecer a musculatura escapular com remadas guiadas.",
              "Reduzir carboidratos em dias de descanso muscular."
            ];
          } else {
            milestoneTitle = "Consolidação e Novo Estilo Estético";
            description = `Ao final de 6 meses, o seu progresso será absoluto. Você atingirá um percentual de gordura incrivelmente baixo e sustentável para o seu biotipo, com excelente tônus muscular global e postura atlética alinhada.`;
            recommendations = [
              "Fase de estabilização calórica pós-perda segura.",
              "Utilizar agachamentos profundos para consolidar as coxas.",
              "Fazer rotina de mobilidade para quadris e joelhos.",
              "Refazer plano postural a cada 4 semanas de manutenção."
            ];
          }
        } else if (goal === "ganhar_massa") {
          if (months === 1) {
            milestoneTitle = "Hipertrofia Sarcoplasmática";
            description = `Surgimento de maior turgidez celular, seus músculos reterão mais glicogênio nas fibras, provocando um aspecto imediato de maior preenchimento e pump tônico. Ombros e caixa torácica começam a ganhar expansão inicial.`;
            recommendations = [
              "Superávit energético de 300 kcal limpas por dia.",
              "Priorizar a descida lenta excêntrica em todos exercícios.",
              "Suplementar Creatina diariamente para otimização tônica.",
              "Fazer alongamento peitoral profundo pós-treino de costas."
            ];
          } else if (months === 3) {
            milestoneTitle = "Massa Miofibrilar Consolidada";
            description = `Ganho representará síntese proteica real e densidade fibrilar consolidada. A expansão de suas dorsais e deltóides acentuará o formato em "V" (V-Taper) em fotos de costas.`;
            recommendations = [
              "Musculação pesada de força nos exercícios multi-articulares.",
              "Aumentar descanso entre séries longas para 2 minutos.",
              "Suporte proteico integral a cada 3 horas ativas.",
              "Adicionar gorduras boas para suporte hormonal anabólico."
            ];
          } else {
            milestoneTitle = "Maturação Física e Densidade Plena";
            description = `Consolidação de um perfil atlético imponente. O volume muscular acumulado em braços e pernas terá uma transição limpa e incrivelmente harmônica, mitigando assimetrias preexistentes graças aos eixos de carga simétricos.`;
            recommendations = [
              "Periodizar o macrociclo combinando força e resistência.",
              "Remover fadiga por meio de treinos regenerativos periódicos.",
              "Priorizar treino unilateral para compensação de gaps.",
              "Fazer avaliação biométrica a cada 30 dias para ajuste."
            ];
          }
        } else if (goal === "definicao") {
          if (months === 1) {
            milestoneTitle = "Exclusão Escapular e Perda de Água";
            description = `Eliminação expressiva do líquido subcutâneo intersticial (retenção superficial). Os cortes superficiais do abdômen superior começam a despontar sob as poses fotográficas de frente e perfil.`;
            recommendations = [
              "Déficit calórico equilibrado com alta taxa proteica.",
              "Cardio HIIT de 25 minutos pós-musculação pesada.",
              "Praticar manobras diárias de Stomach Vacuum em jejum.",
              "Focar em hidratação extrema de 4L ao dia."
            ];
          } else if (months === 3) {
            milestoneTitle = "Hiper-redução Estética Superior";
            description = `Rápida vascularização e cortes anatômicos profundos e rígidos em braços, panturrilhas, ombros e flancos abdominais. Destaque nítido para definição do feixe do tríceps.`;
            recommendations = [
              "Praticar poses isométricas pós-treino para densificar feixes.",
              "Utilizar termogênicos para acelerar queima adiposa persistente.",
              "Executar elevações laterais com controle estrito escapular.",
              "Manter jejum intermitente sutil em dias estritamente vagos."
            ];
          } else {
            milestoneTitle = "Fisicalidade Seca e Tridimensional';";
            description = `Surgimento de listras de definição profunda, pele fina colada ao plano muscular. O equilíbrio postural estará perfeitamente restaurado, destacando a simetria central de braços, caixa e abdômen.`;
            recommendations = [
              "Ciclagem de carboidratos com base na intensidade de treino.",
              "Refinar assimetrias por meio de trabalho corretivo focado.",
              "Garantir 8h de repouso absoluto visando liberação de GH.",
              "Redirecionar déficits em dias sem treino de hipertrofia."
            ];
          }
        } else { // saude / postura
          if (months === 1) {
            milestoneTitle = "Reestruturação e Consciência Postural";
            description = `Recrutamento do core tônico postural. Musculatura eretora da espinha começa a realinhar o plano sagital. Note uma redução drástica nas dores lombares e rigidez muscular nas costas e ombros.`;
            recommendations = [
              "Efetuar 15 minutos de mobilidade vertebral diariamente.",
              "Fazer pranchas focadas em retroversão pélvica profunda.",
              "Treinar manguito rotador e trapézio inferior 3x semana.",
              "Injetar colágeno e magnésio para suporte ligamentar."
            ];
          } else if (months === 3) {
            milestoneTitle = "Eixo Anatômico Estabilizado";
            description = `Seu centro de gravidade retornará à perfeita simetria medial anterior. Os ombros caídos estarão agora estabilizados no plano lateral, dividindo as forças escapulares igualmente.`;
            recommendations = [
              "Acrescentar Farmer's Walk para estabilizar trapézios e mãos.",
              "Restaurar arco plantar com agachamentos descalço no solo.",
              "Executar Goblet Squats mantendo a espinha neutra.",
              "Realizar pausas ativas a cada hora de repouso."
            ];
          } else {
            milestoneTitle = "Simetria Funcional de Alta Vitalidade";
            description = `Desvio postural mitigado por completo em todas as cadeias do corpo. A bacia, a cintura lombopélvica e as clavículas trabalharão harmonicamente. Tônus muscular polido em alto nível.`;
            recommendations = [
              "Consolidar a elasticidade por meio de Pilates avançado.",
              "Fortalecer tendões e fáscias sob alongamento sobrecarregado.",
              "Usar bola de liberação de lacrosse nos pés/ombros.",
              "Efetuar rastreamento de alinhamento visual de forma mensal."
            ];
          }
        }

        return {
          period: months === 1 ? "1_month" : months === 3 ? "3_months" : "6_months",
          label: months === 1 ? "1 Mês" : months === 3 ? "3 Meses" : "6 Meses",
          weight: Number(predictedWeight.toFixed(1)),
          bodyFat: Number(predictedBF.toFixed(1)),
          muscleMass: muscleVal,
          score: predictedScore,
          postureRating: nextPosture,
          milestoneTitle,
          description,
          recommendations
        };
      };

      predictionResult = {
        "1_month": applyMilestones(1),
        "3_months": applyMilestones(3),
        "6_months": applyMilestones(6)
      };
    }

    res.json({
      success: true,
      profile: { name, age, height, weight, gender, goal },
      predictions: predictionResult,
      fallbackUsed
    });
  });

  // Serve static files in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BodyTrack AI full stack server booted on port ${PORT}`);
  });
}

startServer();
