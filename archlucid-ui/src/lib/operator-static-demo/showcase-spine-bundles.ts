import { canonicalizeDemoRunId, isShowcaseCreatedStaticDemoRunId } from "@/lib/demo-run-canonical";
import { policyPackBuyerLabel } from "@/lib/policy/policy-pack-buyer-label";
import { SHOWCASE_HOME_AHA_MOMENT } from "@/lib/showcase-home-aha-moment";
import { CUSTOMER_INTAKE_RULE_SET_VERSION } from "@/lib/samples/customer-intake-modernization/definition";
import { resolveSampleScenarioByManifestId, resolveSampleScenarioByRunId } from "@/lib/samples/registry";
import { sampleScenarioPolicyPackLabel } from "@/lib/samples/policy-pack-presentation";
import type {
  RunDetailCriticalPageBundle,
  RunDetailWorkspaceContextBundle,
} from "@/lib/fetch-run-detail-page-bundle-client";
import {
  getShowcaseDecisionSynopsesForRunId,
  getShowcaseStaticDemoPayload,
  getShowcaseWarningSynopsesForRunId,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_SPINE_COUNTS,
} from "@/lib/showcase-static-demo";
import type { RunSummary } from "@/types/authority";
import type {
  ArtifactDescriptor,
  ManifestSummary,
  PipelineTimelineItem,
  RunDetail,
  RunDetailAgentResult,
} from "@/types/authority";
import type { RunExplanationSummary } from "@/types/explanation";
import type { FindingInspectPayload } from "@/types/finding-inspect";

import {
  getShowcaseCreatedStaticDemoPayload,
  SHOWCASE_CREATED_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_CREATED_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_CREATED_STATIC_DEMO_RUN_ID,
  SHOWCASE_CREATED_STATIC_DEMO_WARNING_SYNOPSES,
} from "@/lib/showcase-created-static-demo";

import {
  isDemoRunIdEligibleForStaticFallback,
  isShowcaseSpineStaticPayloadActiveForManifest,
  isShowcaseSpineStaticPayloadActiveForRun,
} from "./eligibility";


import {
  buildStaticDemoRunDetailFromCreatedShowcase,
  buildStaticDemoRunDetailFromShowcase,
  tryStaticDemoManifestSummary,
} from './showcase-spine-run-detail';

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

export function buildStaticDemoArtifactsFromCreatedShowcase(urlRunId: string): ArtifactDescriptor[] {
  const d = getShowcaseCreatedStaticDemoPayload(urlRunId);
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

export function tryStaticDemoPipelineTimeline(runId: string): PipelineTimelineItem[] | null {
  if (!isShowcaseSpineStaticPayloadActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  if (isShowcaseCreatedStaticDemoRunId(effectiveRunId)) {
    const d = getShowcaseCreatedStaticDemoPayload(effectiveRunId);

    return d.pipelineTimeline.map((row) => ({
      eventId: row.eventId,
      occurredUtc: row.occurredUtc,
      eventType: row.eventType,
      actorUserName: row.actorUserName,
      correlationId: row.correlationId ?? undefined,
    }));
  }

  return buildStaticDemoPipelineTimelineFromShowcase(effectiveRunId);
}

export function tryStaticDemoArtifacts(runIdForPayload: string, manifestId: string): ArtifactDescriptor[] | null {
  const effectiveRunId = canonicalizeDemoRunId(runIdForPayload);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  if (manifestId === SHOWCASE_CREATED_STATIC_DEMO_MANIFEST_ID) {
    return buildStaticDemoArtifactsFromCreatedShowcase(effectiveRunId);
  }

  const scenarioByManifest = resolveSampleScenarioByManifestId(manifestId);

  if (scenarioByManifest !== null) {
    return buildStaticDemoArtifactsFromShowcase(scenarioByManifest.runId);
  }

  return null;
}

/** Static fallback for aggregate explanation when the explain API is unavailable (demo static operator mode). */

export function tryStaticDemoExplanationSummary(runId: string): RunExplanationSummary | null {
  if (!isShowcaseSpineStaticPayloadActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  if (isShowcaseCreatedStaticDemoRunId(effectiveRunId)) {
    return getShowcaseCreatedStaticDemoPayload(effectiveRunId).runExplanation;
  }

  return getShowcaseStaticDemoPayload(effectiveRunId).runExplanation;
}

function buildShowcaseSpineRunSummaryForProject(runId: string, projectId: string): RunSummary | null {
  const effectiveRunId = canonicalizeDemoRunId(runId.trim());

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  const d = getShowcaseStaticDemoPayload(effectiveRunId);
  const chain = d.authorityChain;

  return {
    runId: effectiveRunId,
    projectId,
    description: d.run.description,
    createdUtc: d.run.createdUtc,
    hasContextSnapshot: !!chain.contextSnapshotId,
    hasGraphSnapshot: !!chain.graphSnapshotId,
    hasFindingsSnapshot: !!chain.findingsSnapshotId,
    hasGoldenManifest: true,
    hasGovernanceWarnings: true,
    findingCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.findingCount,
    warningCount: SHOWCASE_STATIC_DEMO_SPINE_COUNTS.warningCount,
    packageOrigin: "Reviewed",
  };
}

/** Bundled critical-page payload for showcase spine runs — avoids run-scoped authority HTTP. */

export function tryStaticRunDetailCriticalPageBundle(runId: string): RunDetailCriticalPageBundle | null {
  const effectiveRunId = canonicalizeDemoRunId(runId.trim());

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  const detail = isShowcaseCreatedStaticDemoRunId(effectiveRunId)
    ? buildStaticDemoRunDetailFromCreatedShowcase(effectiveRunId)
    : buildStaticDemoRunDetailFromShowcase(effectiveRunId);

  const manifestId = detail.run.goldenManifestId?.trim() ?? "";
  const manifestSummary =
    manifestId.length > 0 ? tryStaticDemoManifestSummary(manifestId) : null;
  const artifacts =
    manifestId.length > 0 ? tryStaticDemoArtifacts(runId, manifestId) ?? [] : [];
  const progressSummary = buildShowcaseSpineRunSummaryForProject(runId, detail.run.projectId);

  return {
    buyerSummary: detail,
    progressSummary,
    manifestSummary,
    artifacts,
  };
}

/** Empty workspace context for showcase spine runs — defers compare/next-review to static list helpers. */

export function tryStaticRunDetailWorkspaceContextBundle(runId: string): RunDetailWorkspaceContextBundle | null {
  const effectiveRunId = canonicalizeDemoRunId(runId.trim());

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return {
    recentProjectRuns: [],
    priorCommittedRunComparison: null,
    priorCommittedRunId: null,
    priorCommittedRunCreatedUtc: null,
  };
}
