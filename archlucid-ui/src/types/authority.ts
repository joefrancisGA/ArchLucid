import type { components } from "@/lib/openapi-schemas";

/**
 * Optional snapshot/list enrichments not always surfaced on **`RunSummaryResponse`**
 * but returned by list/summary endpoints in practice.
 */
type RunSummaryWireExtensions = {
  contextSnapshotId?: string | null;
  graphSnapshotId?: string | null;
  findingsSnapshotId?: string | null;
  goldenManifestId?: string | null;
  decisionTraceId?: string | null;
  artifactBundleId?: string | null;
  findingCount?: number | null;
  warningCount?: number | null;
  artifactCount?: number | null;
};

/**
 * Lightweight summary — **OpenAPI** `RunSummaryResponse` plus list/summary keys the shell treats as present after fetch.
 */
export type RunSummary = components["schemas"]["RunSummaryResponse"] &
  RunSummaryWireExtensions & {
    runId: string;
    projectId: string;
    createdUtc: string;
  };

/**
 * Golden manifest summary for operator review headers.
 *
 * **Note:** The v1 snapshot uses `ManifestSummaryResponse` for a different document-shaped DTO elsewhere; this shape
 * matches the authority manifest summary endpoint in practice (`GET /v1/authority/manifests/{manifestId}/summary`).
 */
export type ManifestSummary = {
  manifestId: string;
  runId: string;
  createdUtc: string;
  manifestHash: string;
  ruleSetId: string;
  ruleSetVersion: string;
  decisionCount: number;
  warningCount: number;
  unresolvedIssueCount: number;
  status: string;
  hasWarnings?: boolean;
  hasUnresolvedIssues?: boolean;
  operatorSummary?: string;
};

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
