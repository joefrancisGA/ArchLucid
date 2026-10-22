import type { components } from "@/lib/openapi-schemas";
import type { RuleSimulationResult } from "@/types/alert-simulation";

type ThresholdCandidateSchema = components["schemas"]["ThresholdCandidate"];

/** A candidate threshold value being evaluated for alert tuning. */
export type ThresholdCandidate = Omit<ThresholdCandidateSchema, "thresholdValue"> &
  Required<Pick<ThresholdCandidateSchema, "label">> & {
    thresholdValue: number;
  };

type NoiseScoreBreakdownSchema = components["schemas"]["NoiseScoreBreakdown"];

/** Noise scoring breakdown for a threshold candidate (coverage, noise, suppression, density). */
export type NoiseScoreBreakdown = Omit<
  NoiseScoreBreakdownSchema,
  "coverageScore" | "noisePenalty" | "suppressionPenalty" | "densityPenalty" | "finalScore"
> &
  Required<Pick<NoiseScoreBreakdownSchema, "notes">> & {
    coverageScore: number;
    noisePenalty: number;
    suppressionPenalty: number;
    densityPenalty: number;
    finalScore: number;
  };

type ThresholdCandidateEvaluationSchema = components["schemas"]["ThresholdCandidateEvaluation"];

/** Full evaluation of a threshold candidate: the candidate itself, simulation results, and noise score. */
export type ThresholdCandidateEvaluation = Omit<ThresholdCandidateEvaluationSchema, "candidate" | "scoreBreakdown"> & {
  candidate: ThresholdCandidate;
  simulationResult: RuleSimulationResult;
  scoreBreakdown: NoiseScoreBreakdown;
};

type ThresholdRecommendationResultSchema = components["schemas"]["ThresholdRecommendationResult"];

/** Result of threshold tuning: all evaluated candidates with the recommended winner. */
export type ThresholdRecommendationResult = Omit<
  ThresholdRecommendationResultSchema &
    Required<
      Pick<ThresholdRecommendationResultSchema, "evaluatedUtc" | "ruleKind" | "tunedMetricType" | "summaryNotes">
    >,
  "candidates" | "recommendedCandidate"
> & {
  recommendedCandidate?: ThresholdCandidateEvaluation | null;
  candidates: ThresholdCandidateEvaluation[];
};
