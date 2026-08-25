import type { components } from "@/lib/openapi-schemas";
import type { CompareEffectiveGovernanceAtCommitSnapshot } from "@/lib/compare-effective-governance-diff";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

/**
 * Optional list enrichments not yet on OpenAPI `RunSummaryResponse` but returned by some endpoints.
 */
type RunSummaryWireExtensions = {
  /** Golden manifest id when list/summary already resolved it (avoids N× getRunDetail). */
  goldenManifestId?: string | null;
  /** Manifest rule-set version when list endpoints already resolved it (avoids N× getManifestSummary). */
  currentManifestVersion?: string | null;
  findingCount?: number | null;
  warningCount?: number | null;
  artifactCount?: number | null;
  /** INV-002 persisted structural execution mode when merged from run detail. */
  structuralExecutionMode?: components["schemas"]["StructuralExecutionMode"] | number | null;
  /** Architecture request id when returned by list/detail endpoints (used for restore from archive). */
  requestId?: string | null;
  /** When true, the backing architecture request is archived and hidden from default lists. */
  isArchived?: boolean | null;
  /** When true, the run was created via an idempotency replay. */
  idempotencyReplayed?: boolean | null;
  /** Package origin for list badges (`Created` | `Reviewed`). */
  packageOrigin?: string | null;
  /** Synthetic Overview sample row for demo/seeded empty home (TB-1039) — not real tenant activity. */
  demoSeededOverviewInject?: boolean | null;
  /** Detail merge: pipeline re-attempt count when run detail is projected onto summary props. */
  retryCount?: number | null;
  /** Detail merge: creation-span OTel trace id from `RunRecord` when run detail is projected onto summary props. */
  otelTraceId?: string | null;
  /** List/detail merge: finalization timestamp when the API returns it for ordering committed runs. */
  completedUtc?: string | null;
};

/**
 * Lightweight summary — **OpenAPI** `RunSummaryResponse` plus sporadic list keys the shell treats as present after fetch.
 */
export type RunSummary = components["schemas"]["RunSummaryResponse"] &
  RunSummaryWireExtensions & {
    runId: string;
    projectId: string;
    createdUtc: string;
  };

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

/** Agent pipeline result row on authority run detail (`RunDetailDto.results`). */
export type RunDetailAgentResult = components["schemas"]["AgentResult"];

export type TrustEvidenceFieldSnapshot = {
  title: string;
  status: string;
  detail?: string | null;
};

export type RunTrustEvidenceRouteRef = {
  rel: string;
  path: string;
  label: string;
};

export type RunTrustEvidenceTopFindingRow = {
  findingId: string;
  title?: string | null;
  traceCompletenessLabel: string;
  evidencePointersSummary: string;
};

export type RunTrustEvidenceCard = {
  selfAttestationNotice: string;
  executionMode: TrustEvidenceFieldSnapshot;
  goldenManifest: TrustEvidenceFieldSnapshot;
  auditTrail: TrustEvidenceFieldSnapshot;
  agentTraces: TrustEvidenceFieldSnapshot;
  artifactBundlePointer: TrustEvidenceFieldSnapshot;
  traceabilityExport: TrustEvidenceFieldSnapshot;
  aiExplainability: TrustEvidenceFieldSnapshot;
  topFinding?: RunTrustEvidenceTopFindingRow | null;
  links: RunTrustEvidenceRouteRef[];
};

/** Optional fields sporadically merged onto authority run detail JSON beside `RunDetailDto`. */
type RunDetailOptionalWireExtras = {
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

export type RunRetrievalGroundingSummary = {
  readonly traceCount?: number;
  readonly agentsWithTraces?: readonly string[];
  readonly expectedAgentsMissingTraces?: readonly string[];
  readonly averageCitationCoverage?: number;
  readonly totalRetrievedChunks?: number;
  readonly totalGraphRagNeighborsAdded?: number;
  readonly totalGraphRagSeedHits?: number;
  readonly graphRagNeighborHitRate?: number;
  readonly totalRetrievalTokensIn?: number;
  readonly graphRagPilotFloorDisposition?: string;
  readonly graphRagQualityPosture?: string | null;
  readonly disposition?: string;
  readonly operatorDetail?: string | null;
  readonly topologyReferenceArchitectureExemplarCount?: number;
  readonly topologyReferenceArchitectureExemplarDocumentIds?: readonly string[];
  readonly topologyReferenceArchitectureExemplarMissing?: boolean;
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
    };
    contextSnapshot?: unknown;
    graphSnapshot?: unknown;
    findingsSnapshot?: unknown;
    decisionTrace?: unknown;
    goldenManifest?: unknown;
    artifactBundle?: unknown;
    results?: readonly RunDetailAgentResult[] | null;
  };

type ProvenanceNodeSchema = components["schemas"]["ProvenanceNode"];

/** Node in decision provenance graph (`GET …/provenance`). */
export type ProvenanceNode = ProvenanceNodeSchema &
  Required<Pick<ProvenanceNodeSchema, "id" | "referenceId" | "name">> & {
    /** OpenAPI `ProvenanceNodeType` string enum; legacy numeric wire values tolerated. */
    type: NonNullable<ProvenanceNodeSchema["type"]> | number;
  };

type ProvenanceEdgeSchema = components["schemas"]["ProvenanceEdge"];

export type ProvenanceEdge = ProvenanceEdgeSchema &
  Required<Pick<ProvenanceEdgeSchema, "id" | "fromNodeId" | "toNodeId">> & {
    /** OpenAPI `ProvenanceEdgeType` string enum; legacy numeric wire values tolerated. */
    type: NonNullable<ProvenanceEdgeSchema["type"]> | number;
  };

type DecisionProvenanceGraphSchema = components["schemas"]["DecisionProvenanceGraph"];

export type DecisionProvenanceGraph = DecisionProvenanceGraphSchema &
  Required<Pick<DecisionProvenanceGraphSchema, "id" | "runId">> & {
    nodes: ProvenanceNode[];
    edges: ProvenanceEdge[];
  };

type RunPipelineTimelineItemResponseSchema = components["schemas"]["RunPipelineTimelineItemResponse"];

/** Pipeline audit timeline row (`GET …/pipeline-timeline`). */
export type PipelineTimelineItem = RunPipelineTimelineItemResponseSchema &
  Required<
    Pick<RunPipelineTimelineItemResponseSchema, "eventId" | "occurredUtc" | "eventType" | "actorUserName">
  >;
