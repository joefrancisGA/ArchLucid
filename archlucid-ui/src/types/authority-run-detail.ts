import type { components } from "@/lib/openapi-schemas";
import type { RunDetailAgentFinding, RunDetailAgentResult } from "@/types/authority-run-detail-wire";
import type {
  RunRetrievalGroundingSummary,
  RunTrustEvidenceCard,
} from "@/types/authority-run-detail-trust";

export type { RunDetailAgentFinding, RunDetailAgentResult } from "@/types/authority-run-detail-wire";

export type {
  TrustEvidenceFieldSnapshot,
  RunTrustEvidenceRouteRef,
  RunTrustEvidenceTopFindingRow,
  RunTrustEvidenceCard,
  RunRetrievalGroundingSummary,
} from "@/types/authority-run-detail-trust";

export type {
  ProvenanceNode,
  ProvenanceEdge,
  DecisionProvenanceGraph,
  PipelineTimelineItem,
} from "@/types/authority-run-detail-provenance";

/** Optional fields sporadically merged onto authority run detail JSON beside `RunDetailDto`. */
type RunDetailOptionalWireExtras = {
  /** OpenAPI `RunDetailDto` may lag `RunDetailsResponse`; wire carries lifecycle phase on authority GET. */
  authorityLifecyclePhase?: components["schemas"]["AuthorityRunLifecyclePhase"] | null;
  trustEvidenceCard?: RunTrustEvidenceCard | null;
  agentExecutionLlmCostEstimate?: components["schemas"]["RunAgentLlmCostEstimateResponse"] | null;
  degradedFindingCoverage?: boolean;
  findingCoverageSummary?: components["schemas"]["RunFindingCoverageSummary"] | null;
  retrievalGroundingSummary?: RunRetrievalGroundingSummary | null;
  lastAgentExecutionFailure?: {
    readonly agentType?: string | null;
    readonly agentTypeKey?: string | null;
    readonly failureClass?: string | null;
    readonly reasonCode?: string | null;
    /** TB-965: RealAgentFailureTriageCatalog scenario id when present. */
    readonly triageScenarioId?: string | null;
    /** TB-965 / TB-964: structural | semantic | faithfulness when quality path recorded it. */
    readonly rejectReasonCategory?: string | null;
  } | null;
  estimatedUsdSavingsSummary?: {
    estimatedUsdSavings?: number | null;
    savingsPricingBasis?: string | null;
    savingsPricingBasisDescription?: string | null;
  } | null;
  decisionExplainability?: unknown;
  engineProvenance?: import("@/lib/review-engine-provenance-display").ReviewRunEngineProvenance | null;
  /** TB-937: required-agent outcome matrix (OpenAPI may lag until regen). */
  agentExecutionOutcomes?: readonly {
    readonly agentType?: string | null;
    readonly outcome?: string | null;
    readonly taskId?: string | null;
    readonly degradationReasonCode?: string | null;
  }[] | null;
};

type RunDetailDtoBase = components["schemas"]["RunDetailDto"];

type RunDetailSnapshots = Pick<
  RunDetailDtoBase,
  | "artifactBundle"
  | "contextSnapshot"
  | "decisionTrace"
  | "findingsSnapshot"
  | "goldenManifest"
  | "graphSnapshot"
>;

/**
 * Authority run detail (`GET /v1/authority/reviews/{runId}`): **OpenAPI** `RunDetailDto` plus sporadic merges.
 *
 * Snapshot/manifest/binary-adjacent fields stay **`unknown`** at the boundary so curated static-demo placeholders
 * and evolving DTO variants do not fight generated schema literals.
 *
 * After `coerceRunDetail` succeeds, **`run`** includes required `runId` / `projectId` / `createdUtc`.
 */
export type RunDetail = Omit<RunDetailDtoBase, "run" | keyof RunDetailSnapshots | "results"> &
  RunDetailOptionalWireExtras & {
    run: NonNullable<RunDetailDtoBase["run"]> & {
      runId: string;
      projectId: string;
      scopeProjectId?: string;
      createdUtc: string;
      legacyRunStatus?: string | null;
      hasGovernanceWarnings?: boolean;
      lastFailureReason?: string | null;
      retryCount?: number;
      operatorGovernanceDecision?: string | null;
      operatorGovernanceDecisionRationale?: string | null;
      operatorGovernanceDecisionUtc?: string | null;
      operatorGovernanceDecisionByUserId?: string | null;
      /** When true, the backing architecture request is archived and hidden from default lists. */
      isArchived?: boolean | null;
      /** Stable architecture identity when the authority run record includes it (CA-45 recurrence scope). */
      architectureId?: string | null;
    };
    contextSnapshot?: unknown;
    graphSnapshot?: unknown;
    findingsSnapshot?: unknown;
    decisionTrace?: unknown;
    goldenManifest?: unknown;
    artifactBundle?: unknown;
    results?: readonly RunDetailAgentResult[] | null;
  };
