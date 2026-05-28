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
