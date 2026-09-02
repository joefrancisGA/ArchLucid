import type { components } from "@/lib/openapi-schemas";

type EvaluationScoreSchema = components["schemas"]["EvaluationScoreResponse"];

/** OpenAPI score fields may deserialize as strings; UI math expects numbers. */
export type EvaluationScoreResponse = Omit<
  EvaluationScoreSchema,
  "confidenceScore" | "determinismScore" | "improvementDelta" | "regressionRiskScore" | "simulationScore"
> & {
  confidenceScore?: number | null;
  determinismScore?: number | null;
  improvementDelta?: number | null;
  regressionRiskScore?: number | null;
  simulationScore?: number | null;
};

type EvolutionCandidateChangeSetResponseSchema = components["schemas"]["EvolutionCandidateChangeSetResponse"];
export type EvolutionCandidateChangeSetResponse = EvolutionCandidateChangeSetResponseSchema &
  Required<
    Pick<
      EvolutionCandidateChangeSetResponseSchema,
      "candidateChangeSetId" | "sourcePlanId" | "status" | "title" | "summary" | "derivationRuleVersion" | "createdUtc"
    >
  >;
type EvolutionCandidateChangeSetListResponseSchema = components["schemas"]["EvolutionCandidateChangeSetListResponse"];
export type EvolutionCandidateChangeSetListResponse = EvolutionCandidateChangeSetListResponseSchema &
  Required<Pick<EvolutionCandidateChangeSetListResponseSchema, "candidates">>;
type EvolutionSimulationRunWithEvaluationResponseSchema =
  components["schemas"]["EvolutionSimulationRunWithEvaluationResponse"];
export type EvolutionSimulationRunWithEvaluationResponse = EvolutionSimulationRunWithEvaluationResponseSchema &
  Required<
    Pick<
      EvolutionSimulationRunWithEvaluationResponseSchema,
      "simulationRunId" | "baselineArchitectureRunId" | "evaluationMode" | "outcomeJson" | "completedUtc" | "isShadowOnly"
    >
  >;
type EvolutionResultsResponseSchema = components["schemas"]["EvolutionResultsResponse"];
export type EvolutionResultsResponse = EvolutionResultsResponseSchema &
  Required<Pick<EvolutionResultsResponseSchema, "candidate" | "planSnapshotJson" | "simulationRuns">>;
type EvolutionSimulateResponseSchema = components["schemas"]["EvolutionSimulateResponse"];
export type EvolutionSimulateResponse = EvolutionSimulateResponseSchema &
  Required<Pick<EvolutionSimulateResponseSchema, "candidate" | "simulationRuns">>;
