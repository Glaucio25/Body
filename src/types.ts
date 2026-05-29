export interface UserProfile {
  name: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  gender: 'M' | 'F' | 'Outro';
  goal: 'emagrecer' | 'ganhar_massa' | 'definicao' | 'saude';
  isPremium?: boolean;
  registeredAt?: string;
}

export interface LandmarkCoordinate {
  x: number; // percentage of image width (0-100)
  y: number; // percentage of image height (0-100)
  label: string;
}

export interface PhysicalAssessment {
  id: string;
  date: string;
  weight: number;
  photos: {
    front?: string;
    side?: string;
    back?: string;
  };
  metrics: {
    bodyFat: number; // percentage
    muscleMass: 'baixa' | 'moderada' | 'alta';
    waterRetention: 'baixa' | 'normal' | 'alta';
    score: number; // Shape Score (0-100)
    postureRating: 'excelente' | 'boa' | 'desvios_leves' | 'necessita_atencao';
    symmetryRating: 'otima' | 'estavel' | 'necessita_equilibrio';
  };
  postureDetails: {
    shoulders: string;
    leveling: string;
    pelvis: string;
    notes: string;
  };
  symmetryDetails: {
    leftArmVsRightArm: string;
    leftLegVsRightLeg: string;
    torsoBalance: string;
    dominance: string;
  };
  evolution: {
    weightDiff?: number;
    bodyFatDiff?: number;
    muscleGainEstimated?: number;
    summary: string;
  };
  aiInsights: string[];
  landmarks: {
    front?: LandmarkCoordinate[];
    side?: LandmarkCoordinate[];
    back?: LandmarkCoordinate[];
  };
}

export interface ProgressPrediction {
  period: '1_month' | '3_months' | '6_months';
  label: string;
  weight: number;
  bodyFat: number;
  muscleMass: 'baixa' | 'moderada' | 'alta';
  score: number;
  postureRating: 'excelente' | 'boa' | 'desvios_leves' | 'necessita_atencao';
  milestoneTitle: string;
  description: string;
  recommendations: string[];
}

export interface PredictionSet {
  "1_month": ProgressPrediction;
  "3_months": ProgressPrediction;
  "6_months": ProgressPrediction;
}

