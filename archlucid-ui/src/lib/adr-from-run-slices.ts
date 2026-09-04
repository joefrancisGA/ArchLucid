/** Serializable inputs for client-side MADR-style markdown (no network). */
export type AdrGeneratorManifestCounts = {
  decisions: number;
  warnings: number;
  unresolvedIssues: number;
};

export type AdrGeneratorExplanationSlice = {
  overallAssessment: string;
  riskPosture: string;
  themeSummaries: readonly string[];
  summary: string;
  keyDrivers: readonly string[];
  riskImplications: readonly string[];
  costImplications: readonly string[];
  complianceImplications: readonly string[];
  detailedNarrative: string;
  structuredReasoning: string | null;
  alternativesConsidered: readonly string[] | null;
  caveats: readonly string[] | null;
  provenanceLine: string | null;
  faithfulnessWarning: string | null;
  deterministicFallbackUsed: boolean;
};

export type AdrGeneratorFindingSlice = {
  findingId: string;
  title: string;
  recommendation: string;
  severityLabel: string;
  aiReasoningExcerpt: string;
  trustLabel?: string | null;
  trustLabelReason?: string | null;
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
};

export const DEFAULT_MAX_FINDINGS = 20;
export const EXCERPT_CAP = 1200;
export const NARRATIVE_CAP = 4000;
