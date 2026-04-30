import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import {
  getShowcaseStaticDemoPayload,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
} from "@/lib/showcase-static-demo";
import type { ArtifactDescriptor, ManifestSummary, PipelineTimelineItem, RunDetail, RunSummary } from "@/types/authority";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import type { RunExplanationSummary } from "@/types/explanation";
import type { FindingInspectPayload } from "@/types/finding-inspect";

const DEMO_RUN_IDS_FOR_STATIC_FALLBACK = new Set<string>([
  SHOWCASE_STATIC_DEMO_RUN_ID,
  "claims-intake-modernization-run",
  "claims-intake-run-v1",
  "claims-intake-run-v2",
]);

/** When true, operator run/manifest pages use curated showcase data if the API fails (demo deploys only). */
export function isOperatorDemoStaticMode(): boolean {
  return process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true";
}

/**
 * Curated static payloads when authority APIs error — static-operator image **or** any `NEXT_PUBLIC_DEMO_MODE` build.
 * Eligibility is still limited to {@link isDemoRunIdEligibleForStaticFallback}.
 */
export function isStaticDemoPayloadFallbackEnabled(): boolean {
  return isOperatorDemoStaticMode() || isPublicDemoModeEnv();
}

export function isDemoRunIdEligibleForStaticFallback(runId: string): boolean {
  return DEMO_RUN_IDS_FOR_STATIC_FALLBACK.has(runId.trim());
}

function isDemoRunsListFallbackEnabled(): boolean {
  return isStaticDemoPayloadFallbackEnabled();
}

/**
 * When the runs list API fails (or returns unusable JSON), serve one curated Claims Intake row so
 * primary nav + `/runs` screenshots stay credible in demo / static-operator deploys.
 */
export function tryStaticDemoRunSummariesPaged(projectId: string): { items: RunSummary[]; totalCount: number } | null {
  if (!isDemoRunsListFallbackEnabled()) {
    return null;
  }

  const d = getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
  const chain = d.authorityChain;

  const item: RunSummary = {
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    projectId,
    description: d.run.description,
    createdUtc: d.run.createdUtc,
    goldenManifestId: chain.goldenManifestId ?? undefined,
    hasContextSnapshot: !!chain.contextSnapshotId,
    hasGraphSnapshot: !!chain.graphSnapshotId,
    hasFindingsSnapshot: !!chain.findingsSnapshotId,
    hasGoldenManifest: true,
  };

  return { items: [item], totalCount: 1 };
}

/**
 * When Compare needs two distinct run rows and the live list is empty, serve baseline/updated labels for the Claims
 * Intake demo spine (same eligibility as {@link tryStaticDemoRunSummariesPaged}).
 */
export function tryStaticDemoCompareRunSummaries(projectId: string): { items: RunSummary[]; totalCount: number } | null {
  if (!isDemoRunsListFallbackEnabled()) {
    return null;
  }

  const d = getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
  const chain = d.authorityChain;

  const row = (runId: string, description: string): RunSummary => ({
    runId,
    projectId,
    description,
    createdUtc: d.run.createdUtc,
    goldenManifestId: chain.goldenManifestId ?? undefined,
    hasContextSnapshot: !!chain.contextSnapshotId,
    hasGraphSnapshot: !!chain.graphSnapshotId,
    hasFindingsSnapshot: !!chain.findingsSnapshotId,
    hasGoldenManifest: true,
  });

  return {
    items: [row("claims-intake-run-v1", "Claims Intake — baseline"), row("claims-intake-run-v2", "Claims Intake — updated")],
    totalCount: 2,
  };
}

export function buildStaticDemoRunDetailFromShowcase(urlRunId: string): RunDetail {
  const d = getShowcaseStaticDemoPayload(urlRunId);
  const manifest = d.manifest;
  const chain = d.authorityChain;

  return {
    run: {
      runId: d.run.runId,
      projectId: d.run.projectId,
      description: d.run.description,
      createdUtc: d.run.createdUtc,
      contextSnapshotId: chain.contextSnapshotId ?? undefined,
      graphSnapshotId: chain.graphSnapshotId ?? undefined,
      findingsSnapshotId: chain.findingsSnapshotId ?? undefined,
      goldenManifestId: manifest.manifestId,
      decisionTraceId: chain.decisionTraceId ?? undefined,
      artifactBundleId: chain.artifactBundleId ?? undefined,
    },
    contextSnapshot: { demo: true },
    graphSnapshot: { demo: true },
    findingsSnapshot: { demo: true },
    decisionTrace: { demo: true },
    goldenManifest: { demo: true },
    artifactBundle: { demo: true },
  };
}

export function buildStaticDemoManifestSummaryFromShowcase(urlRunId: string): ManifestSummary {
  const d = getShowcaseStaticDemoPayload(urlRunId);
  const m = d.manifest;

  return {
    manifestId: m.manifestId,
    runId: m.runId,
    createdUtc: m.createdUtc,
    manifestHash: m.manifestHash,
    ruleSetId: m.ruleSetId,
    ruleSetVersion: m.ruleSetVersion,
    decisionCount: m.decisionCount,
    warningCount: m.warningCount,
    unresolvedIssueCount: m.unresolvedIssueCount,
    status: m.status,
    hasWarnings: m.warningCount > 0,
    hasUnresolvedIssues: m.unresolvedIssueCount > 0,
    operatorSummary: m.operatorSummary,
  };
}

export function buildStaticDemoPipelineTimelineFromShowcase(urlRunId: string): PipelineTimelineItem[] {
  const d = getShowcaseStaticDemoPayload(urlRunId);

  return d.pipelineTimeline.map((row) => ({
    eventId: row.eventId,
    occurredUtc: row.occurredUtc,
    eventType: row.eventType,
    actorUserName: row.actorUserName,
    correlationId: row.correlationId ?? undefined,
  }));
}

export function buildStaticDemoArtifactsFromShowcase(urlRunId: string): ArtifactDescriptor[] {
  const d = getShowcaseStaticDemoPayload(urlRunId);
  const manifestId = d.manifest.manifestId;
  const runId = d.run.runId;

  return d.artifacts.map((a) => ({
    artifactId: a.artifactId,
    artifactType: a.artifactType,
    name: a.name,
    format: a.format,
    createdUtc: a.createdUtc,
    contentHash: a.contentHash,
    manifestId,
    runId,
  }));
}

export function tryStaticDemoRunDetail(runId: string): RunDetail | null {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return buildStaticDemoRunDetailFromShowcase(effectiveRunId);
}

/** Curated PHI finding for static demo when inspect API is unavailable (matches manifest deep links). */
export function buildStaticDemoPrimaryFindingInspectPayload(effectiveRunId: string): FindingInspectPayload {
  const d = getShowcaseStaticDemoPayload(effectiveRunId);

  return {
    findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    typedPayload: {
      title: "PHI minimization risk",
      description:
        "Unstructured intake attachments can bypass minimization controls during peak load — monitor exceptions, reinforce " +
        "ingress classification, and keep privacy-office review on a weekly cadence for this modernization path.",
      severity: "Warning",
      category: "Compliance",
      status: "Triaged",
    },
    decisionRuleId: "phi.minimization.intake",
    decisionRuleName: "PHI minimization at intake",
    evidence: [],
    recommendedActions: [
      "Confirm OCR bypass monitoring and alerting for unstructured attachment paths.",
      "Schedule sponsor + privacy review of exception volume before the next release train.",
    ],
    auditRowId: null,
    runId: d.run.runId,
    manifestVersion: "Healthcare Claims Policy Pack v3.4.1",
  };
}

export function tryStaticDemoFindingInspect(runId: string, findingId: string): FindingInspectPayload | null {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);
  const fid = findingId.trim();

  if (fid !== SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID) {
    return null;
  }

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return buildStaticDemoPrimaryFindingInspectPayload(effectiveRunId);
}

export function tryStaticDemoManifestSummary(manifestId: string): ManifestSummary | null {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  if (manifestId !== SHOWCASE_STATIC_DEMO_MANIFEST_ID) {
    return null;
  }

  return buildStaticDemoManifestSummaryFromShowcase(SHOWCASE_STATIC_DEMO_RUN_ID);
}

export function tryStaticDemoPipelineTimeline(runId: string): PipelineTimelineItem[] | null {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return buildStaticDemoPipelineTimelineFromShowcase(effectiveRunId);
}

export function tryStaticDemoArtifacts(runIdForPayload: string, manifestId: string): ArtifactDescriptor[] | null {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  if (manifestId !== SHOWCASE_STATIC_DEMO_MANIFEST_ID) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runIdForPayload);

  return buildStaticDemoArtifactsFromShowcase(effectiveRunId);
}

/** Static fallback for aggregate explanation when the explain API is unavailable (demo static operator mode). */
export function tryStaticDemoExplanationSummary(runId: string): RunExplanationSummary | null {
  if (!isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return getShowcaseStaticDemoPayload(effectiveRunId).runExplanation;
}

/** Curated linkage graph aligned with Claims Intake static showcase payloads (demo static operator mode only). */
export function buildStaticDemoProvenanceGraphFromShowcase(urlRunId: string): ArchitectureRunProvenanceGraph {

  const d = getShowcaseStaticDemoPayload(urlRunId);

  const rid = d.run.runId;

  const manifest = d.manifest;

  const chain = d.authorityChain;

  const timeline = d.pipelineTimeline.map((row) => ({
    timestampUtc: row.occurredUtc,
    kind: row.eventType,
    label: pipelineEventTypeFriendlyLabel(row.eventType),
    referenceId: row.correlationId ?? null,
  }));

  return {

    runId: rid,

    nodes: [

      { id: "n-run", type: "ArchitectureRun", referenceId: rid, name: "Architecture run" },

      {

        id: "n-ctx",

        type: "ContextSnapshot",

        referenceId: chain.contextSnapshotId ?? "ctx-demo",

        name: "Context snapshot",

      },

      {

        id: "n-graph",

        type: "GraphSnapshot",

        referenceId: chain.graphSnapshotId ?? "graph-demo",

        name: "Graph snapshot",

      },

      {

        id: "n-find",

        type: "FindingsSnapshot",

        referenceId: chain.findingsSnapshotId ?? "find-demo",

        name: "Findings snapshot",

      },

      {

        id: "n-manifest",

        type: "GoldenManifest",

        referenceId: manifest.manifestId,

        name: "Reviewed manifest",

      },

      {

        id: "n-bundle",

        type: "ArtifactBundle",

        referenceId: chain.artifactBundleId ?? "bundle-demo",

        name: "Artifact bundle",

      },

    ],

    edges: [

      { id: "e-run-ctx", type: "produced", fromNodeId: "n-run", toNodeId: "n-ctx" },

      { id: "e-ctx-graph", type: "next", fromNodeId: "n-ctx", toNodeId: "n-graph" },

      { id: "e-graph-find", type: "next", fromNodeId: "n-graph", toNodeId: "n-find" },

      { id: "e-find-manifest", type: "materialized", fromNodeId: "n-find", toNodeId: "n-manifest" },

      { id: "e-manifest-bundle", type: "packaged", fromNodeId: "n-manifest", toNodeId: "n-bundle" },

    ],

    timeline,

    traceabilityGaps: [],

  };

}

export function tryStaticDemoProvenanceGraph(runId: string): ArchitectureRunProvenanceGraph | null {
  if (!isDemoRunsListFallbackEnabled()) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return buildStaticDemoProvenanceGraphFromShowcase(effectiveRunId);
}
