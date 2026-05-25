import type { components } from "@/lib/openapi-schemas";

/**
 * Optional list enrichments not yet on OpenAPI `RunSummaryResponse` but returned by some endpoints.
 */
type RunSummaryWireExtensions = {
  findingCount?: number | null;
  warningCount?: number | null;
  artifactCount?: number | null;
  /** Architecture request id when returned by list/detail endpoints (used for restore from archive). */
  requestId?: string | null;
  /** When true, the backing architecture request is archived and hidden from default lists. */
  isArchived?: boolean | null;
  /** When true, the run was created via an idempotency replay. */
  idempotencyReplayed?: boolean | null;
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
  >;

/** A single diff entry from run or manifest comparison (section/key/before/after). */
export type DiffItem = {
  section: string;
  key: string;
  diffKind: string;
  beforeValue?: string | null;
  afterValue?: string | null;
  notes?: string | null;
};

/** Manifest-level comparison with added/removed/changed counts and flat diffs. */
export type ManifestComparison = {
  leftManifestId: string;
  rightManifestId: string;
  leftManifestHash: string;
  rightManifestHash: string;
  addedCount: number;
  removedCount: number;
  changedCount: number;
  diffs: DiffItem[];
};

/** Legacy flat-diff comparison between two runs. */
export type RunComparison = {
  leftRunId: string;
  rightRunId: string;
  runLevelDiffs: DiffItem[];
  manifestComparison?: ManifestComparison | null;
  runLevelDiffCount?: number;
  hasManifestComparison?: boolean;
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
export type ReplayValidation = {
  contextPresent: boolean;
  graphPresent: boolean;
  findingsPresent: boolean;
  manifestPresent: boolean;
  tracePresent: boolean;
  artifactsPresent: boolean;
  manifestHashMatches: boolean;
  artifactBundlePresentAfterReplay: boolean;
  notes: string[];
  hasValidationNotes?: boolean;
};

/** Full replay response including mode, rebuilt IDs, and validation results. */
export type ReplayResponse = {
  runId: string;
  mode: string;
  replayedUtc: string;
  rebuiltManifestId?: string | null;
  rebuiltManifestHash?: string | null;
  rebuiltArtifactBundleId?: string | null;
  validation: ReplayValidation;
  hasRebuildOutput?: boolean;
  validationNoteCount?: number;
};

/** LLM usage rollup — **OpenAPI** `RunAgentLlmCostEstimateResponse`. */
export type RunAgentExecutionLlmCostEstimate = components["schemas"]["RunAgentLlmCostEstimateResponse"];

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
 * Authority run detail (`GET /v1/authority/runs/{runId}`): **OpenAPI** `RunDetailDto` plus sporadic merges.
 *
 * Snapshot/manifest/binary-adjacent fields stay **`unknown`** at the boundary so curated static-demo placeholders
 * and evolving DTO variants do not fight generated schema literals.
 *
 * After `coerceRunDetail` succeeds, **`run`** includes required `runId` / `projectId` / `createdUtc`.
 */
export type RunDetail = Omit<RunDetailDtoBase, "run" | keyof RunDetailSnapshots> &
  RunDetailOptionalWireExtras & {
    run: NonNullable<RunDetailDtoBase["run"]> & {
      runId: string;
      projectId: string;
      createdUtc: string;
    };
    contextSnapshot?: unknown;
    graphSnapshot?: unknown;
    findingsSnapshot?: unknown;
    decisionTrace?: unknown;
    goldenManifest?: unknown;
    artifactBundle?: unknown;
    results?: unknown;
  };

/** Node in decision provenance graph (`GET …/provenance`). */
export type ProvenanceNode = {
  id: string;
  type: number;
  referenceId: string;
  name: string;
  metadata?: Record<string, string>;
};

export type ProvenanceEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  type: number;
};

export type DecisionProvenanceGraph = {
  id: string;
  runId: string;
  nodes: ProvenanceNode[];
  edges: ProvenanceEdge[];
};

/** Pipeline audit timeline row (`GET …/pipeline-timeline`). */
export type PipelineTimelineItem = {
  eventId: string;
  occurredUtc: string;
  eventType: string;
  actorUserName: string;
  correlationId?: string | null;
};
