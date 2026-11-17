/** Serializable inputs for client-side MADR-style markdown (no network). */
export type AdrGeneratorManifestCounts = {
  decisions: number;
  warnings: number;
  unresolvedIssues: number;
};

export type AdrGeneratorExplanationSlice = {
  overallAssessment: string;
  riskPosture: string;
  themeSummaries: readonly string[] | null;
  summary: string;
  keyDrivers: readonly string[] | null;
  riskImplications: readonly string[] | null;
  costImplications: readonly string[] | null;
  complianceImplications: readonly string[] | null;
  detailedNarrative: string;
  structuredReasoning: string | null;
  alternativesConsidered: readonly string[] | null;
  caveats: readonly string[] | null;
  provenanceLine: string | null;
  faithfulnessWarning: string | null;
  deterministicFallbackUsed: boolean | null;
};

export type AdrGeneratorFindingSlice = {
  findingId: string;
  title: string;
  recommendation: string;
  severityLabel: string;
  aiReasoningExcerpt: string;
  trustLabel?: string | null;
  trustLabelReason?: string | null;
  provenanceKind?: string | null;
  semanticSupportBand?: string | null;
  semanticSupportBandScorerVersion?: string | null;
};

export type AdrGeneratorRunInput = {
  runId: string;
  projectId: string;
  reviewTitle: string;
  createdUtc: string;
  manifestStatusLabel: string | null;
  policyPackLabel: string | null;
  manifestCounts: AdrGeneratorManifestCounts | null;
  explanation: AdrGeneratorExplanationSlice | null;
  findings: readonly AdrGeneratorFindingSlice[];
  /** Non-muted findings omitted because of {@link DEFAULT_MAX_FINDINGS} cap. */
  readonly omittedCappedFindingCount?: number;
  /** Muted findings withheld from this ADR export. */
  readonly omittedMutedFindingCount?: number;
  structuralExecutionMode?: import("@/lib/structural-execution-mode").StructuralExecutionModeInput;
  isSample?: boolean | null;
  aggregateQualityGateOutcome?: number | null;
};

export const DEFAULT_MAX_FINDINGS = 20;
export const EXCERPT_CAP = 1200;
export const NARRATIVE_CAP = 4000;
