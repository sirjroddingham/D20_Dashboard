export interface Metric {
  score: number | null;
  weight: number;
}

export interface SafetyMetrics {
  speeding: Metric;
  seatbelt: Metric;
  distractions: Metric;
  signSignal: Metric;
  followingDistance: Metric;
}

export interface QualityMetrics {
  cdfDpmo: Metric;
  ced: Metric;
  dcr: Metric;
  dsb: Metric;
  pod: Metric;
}

export type Standing = string;

export interface ScorecardRow {
  _id: string;
  week: string;
  name: string;
  transporterId: string;
  standing: Standing;
  overallScore: number;
  packagesDelivered: number;
  safety: SafetyMetrics;
  quality: QualityMetrics;
  normalizedSafetyScore: number;
  normalizedQualityScore: number;
  hasSafetyData: boolean;
}

export interface DATrailingAvg {
  transporterId: string;
  name: string;
  weekCount: number;
  totalPackages: number;
  avgOverallScore: number;
  avgSafetyScore: number;
  avgQualityScore: number;
}
