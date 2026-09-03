export type {
  ClosedLoopReasoningSourceText,
  ArchitectureIntelligenceFramingQuestion,
  ArchitectureIntelligenceSpecialistFinding,
  ClosedLoopReasoningResult,
  ArchitectureIntelligenceProductSourceContext,
} from "@/lib/architecture/architecture-intelligence-api-types";

export {
  fetchArchitectureIntelligenceProductSourceContext,
  runArchitectureIntelligenceReasoning,
  continueArchitectureIntelligenceReasoning,
  buildArchitectureIntelligenceRunRequest,
  formatArchitectureIntelligenceSpendSummary,
} from "@/lib/architecture/architecture-intelligence-api-closed-loop";

export {
  primaryDescriptionFromSources,
  buildArchitectureIntelligenceSourcesFromDraftFields,
} from "@/lib/architecture/architecture-intelligence-api-specialist";
