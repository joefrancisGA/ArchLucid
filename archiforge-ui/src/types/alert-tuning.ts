import type { RuleSimulationResult } from "@/types/alert-simulation";

export type ThresholdCandidate = {
  thresholdValue: number;
  label: string;
};

export type NoiseScoreBreakdown = {
  coverageScore: number;
  noisePenalty: number;
  suppressionPenalty: number;
  densityPenalty: number;
  finalScore: number;
  notes: string[];
};

export type ThresholdCandidateEvaluation = {
  candidate: ThresholdCandidate;
  simulationResult: RuleSimulationResult;
  scoreBreakdown: NoiseScoreBreakdown;
};

export type ThresholdRecommendationResult = {
  evaluatedUtc: string;
  ruleKind: string;
  tunedMetricType: string;
  recommendedCandidate?: ThresholdCandidateEvaluation | null;
  summaryNotes: string[];
  candidates: ThresholdCandidateEvaluation[];
};
