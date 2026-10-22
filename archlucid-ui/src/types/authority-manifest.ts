import type { components } from "@/lib/openapi-schemas";
import type { CompareEffectiveGovernanceAtCommitSnapshot } from "@/lib/compare-effective-governance-diff";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

type ManifestSummaryResponseSchema = components["schemas"]["ManifestSummaryResponse"];

/** Authority manifest counters after fetch — OpenAPI **`ManifestSummaryResponse`** with required primitives for JSX. */
export type ManifestSummary = ManifestSummaryResponseSchema &
  Required<
    Pick<
      ManifestSummaryResponseSchema,
      | "manifestId"
      | "runId"
      | "createdUtc"
      | "manifestHash"
      | "ruleSetId"
      | "ruleSetVersion"
      | "decisionCount"
      | "warningCount"
      | "unresolvedIssueCount"
      | "status"
    >
  > & {
    /** Present when authority pipeline attached ADR 0050 verdict to the manifest. */
    feasibilityVerdict?: ManifestFeasibilityVerdict | null;
    /** Wire extension when manifest export includes policy-at-commit metadata (compare / run detail). */
    effectiveGovernanceAtCommit?: CompareEffectiveGovernanceAtCommitSnapshot | null;
  };

/** A single diff entry from run or manifest comparison (section/key/before/after). */
export type DiffItem = components["schemas"]["DiffItemResponse"];

type ManifestComparisonResponseSchema = components["schemas"]["ManifestComparisonResponse"];

/** Manifest-level comparison with added/removed/changed counts and flat diffs. */
export type ManifestComparison = ManifestComparisonResponseSchema &
  Required<
    Pick<
      ManifestComparisonResponseSchema,
      | "leftManifestId"
      | "rightManifestId"
      | "leftManifestHash"
      | "rightManifestHash"
      | "addedCount"
      | "removedCount"
      | "changedCount"
      | "diffs"
    >
  > & {
    diffs: DiffItem[];
  };

type RunComparisonResponseSchema = components["schemas"]["RunComparisonResponse"];

/** Legacy flat-diff comparison between two runs. */
export type RunComparison = RunComparisonResponseSchema &
  Required<Pick<RunComparisonResponseSchema, "leftRunId" | "rightRunId" | "runLevelDiffs">> & {
    runLevelDiffs: DiffItem[];
    manifestComparison?: ManifestComparison | null;
  };

type ArtifactWire = components["schemas"]["ArtifactDescriptorResponse"];

/**
 * Artifact row — OpenAPI **`ArtifactDescriptorResponse`** normalized for JSX props (omit `null` unions on optional ids).
 */
export type ArtifactDescriptor = Omit<
  ArtifactWire,
  "artifactId" | "artifactType" | "name" | "format" | "createdUtc" | "contentHash" | "manifestId" | "runId"
> & {
  artifactId: string;
  artifactType: string;
  name: string;
  format: string;
  createdUtc: string;
  contentHash: string;
  manifestId?: string;
  runId?: string;
};

/** Validation flags from an authority chain replay. */
export type ReplayValidation = components["schemas"]["ReplayValidationResponse"];

type ReplayResponseSchema = components["schemas"]["ReplayResponse"];

/** Full replay response including mode, rebuilt IDs, and validation results. */
export type ReplayResponse = ReplayResponseSchema &
  Required<Pick<ReplayResponseSchema, "runId" | "mode" | "replayedUtc" | "validation">> & {
    validation: ReplayValidation & Required<Pick<ReplayValidation, "notes">>;
  };

/** LLM usage rollup — **OpenAPI** `RunAgentLlmCostEstimateResponse`. */
export type RunAgentExecutionLlmCostEstimate = components["schemas"]["RunAgentLlmCostEstimateResponse"];
