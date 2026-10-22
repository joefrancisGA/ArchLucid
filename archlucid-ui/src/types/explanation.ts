export type {
  RunExplanation,
  ExplanationProvenance,
  ExplanationResult,
  CitationReference,
  RunExplanationSummary,
  ComparisonExplanation,
} from "@/types/explanation-run";

export { isDeterministicExplanationFallback } from "@/types/explanation-run";

export type {
  StructuredExplanation,
  FindingConfidenceLevel,
  FindingConfidenceLevelWire,
  FindingTraceConfidenceDto,
  FindingExplainabilityEvidence,
  FindingEvidenceChain,
  FindingLlmAudit,
  FindingExplainability,
} from "@/types/explanation-structured";

export {
  normalizeFindingConfidenceLevel,
  normalizeFiniteRatio,
  traceCompletenessPercent,
} from "@/types/explanation-structured";
