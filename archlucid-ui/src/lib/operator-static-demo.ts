import { canonicalizeDemoRunId } from "@/lib/demo-run-canonical";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { pipelineEventTypeFriendlyLabel } from "@/lib/pipeline-event-type-labels";
import { policyPackBuyerLabel } from "@/lib/policy-pack-buyer-label";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import {
  getShowcaseStaticDemoPayload,
  SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES,
  SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_MANIFEST_ID,
  SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
  SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
  SHOWCASE_STATIC_DEMO_RUN_ID,
  SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES,
} from "@/lib/showcase-static-demo";
import type { GoldenManifestComparison } from "@/types/comparison";
import type { AlertRecord } from "@/types/alerts";
import type {
  ArtifactDescriptor,
  ManifestSummary,
  PipelineTimelineItem,
  RunComparison,
  RunDetail,
  RunSummary,
} from "@/types/authority";
import type { ArchitectureRunProvenanceGraph } from "@/types/architecture-provenance";
import type { RunExplanationSummary } from "@/types/explanation";
import type { FindingInspectPayload } from "@/types/finding-inspect";
import type { EffectivePolicyPackSet, PolicyPack, PolicyPackContentDocument } from "@/types/policy-packs";
import type { GovernanceApprovalRequest, GovernancePromotionRecord } from "@/types/governance-workflow";
import type { GovernanceLineageResult } from "@/types/governance-dashboard";

const DEMO_RUN_IDS_FOR_STATIC_FALLBACK = new Set<string>([
  SHOWCASE_STATIC_DEMO_RUN_ID,
  "claims-intake-modernization-run",
  "claims-intake-run-v1",
  "claims-intake-run-v2",
]);

/** When true, operator run/manifest pages use curated showcase data if the API fails (demo deploys only). */
export function isOperatorDemoStaticMode(): boolean {
  return (
    process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "true" || process.env.NEXT_PUBLIC_DEMO_STATIC_OPERATOR === "1"
  );
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

/**
 * Uses curated Claims Intake static payloads for well-known `/reviews/{runId}` URL tokens **without** requiring demo env
 * vars (OpenAI UI review 2026-05-01 — deploys forgot flags; detail routes must still render).
 */
export function isStaticDemoPayloadFallbackActiveForRun(runId: string): boolean {
  if (isStaticDemoPayloadFallbackEnabled()) {
    return true;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId.trim());

  return isDemoRunIdEligibleForStaticFallback(effectiveRunId);
}

/** Same as {@link isStaticDemoPayloadFallbackActiveForRun} for the known showcase manifest UUID. */
export function isStaticDemoPayloadFallbackActiveForManifest(manifestId: string): boolean {
  if (isStaticDemoPayloadFallbackEnabled()) {
    return true;
  }

  return manifestId.trim() === SHOWCASE_STATIC_DEMO_MANIFEST_ID;
}

export type StaticDemoRunsListFallbackOptions = {
  /**
   * When `listRunsByProjectPaged` throws or returns JSON that fails coercion, inject the curated sample row even if
   * demo env vars are unset (keeps reviews list + pickers aligned with review detail static fallback).
   */
  readonly afterAuthorityListFailure?: boolean;
  /**
   * When the authority API returns **zero** rows for the project (successful empty page), inject the curated Claims
   * Intake sample — same trust model as {@link afterAuthorityListFailure} for demo/staging hosts without seeded data.
   */
  readonly afterEmptyLiveList?: boolean;
};

function isRunsListCuratedShowcaseAllowed(options?: StaticDemoRunsListFallbackOptions): boolean {
  if (isStaticDemoPayloadFallbackEnabled()) {
    return true;
  }

  if (options?.afterAuthorityListFailure === true) {
    return true;
  }

  if (options?.afterEmptyLiveList === true) {
    return true;
  }

  return false;
}

/**
 * When the runs list API fails (or returns unusable JSON), serve one curated Claims Intake row so
 * primary nav + `/runs` screenshots stay credible in demo / static-operator deploys.
 */
export function tryStaticDemoRunSummariesPaged(
  projectId: string,
  options?: StaticDemoRunsListFallbackOptions,
): { items: RunSummary[]; totalCount: number } | null {
  if (!isRunsListCuratedShowcaseAllowed(options)) {
    return null;
  }

  const d = getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
  const chain = d.authorityChain;

  const item: RunSummary = {
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    projectId,
    description: d.run.description,
    createdUtc: d.run.createdUtc,
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
export function tryStaticDemoCompareRunSummaries(
  projectId: string,
  options?: StaticDemoRunsListFallbackOptions,
): { items: RunSummary[]; totalCount: number } | null {
  if (!isRunsListCuratedShowcaseAllowed(options)) {
    return null;
  }

  const d = getShowcaseStaticDemoPayload(SHOWCASE_STATIC_DEMO_RUN_ID);
  const chain = d.authorityChain;

  const row = (runId: string, description: string): RunSummary => ({
    runId,
    projectId,
    description,
    createdUtc: d.run.createdUtc,
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

function isShowcaseClaimsIntakeComparePair(leftRunId: string, rightRunId: string): boolean {
  const left = canonicalizeDemoRunId(leftRunId.trim());
  const right = canonicalizeDemoRunId(rightRunId.trim());

  return left === SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID && right === SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID;
}

function isStaticDemoComparePairActive(leftRunId: string, rightRunId: string): boolean {
  if (!isShowcaseClaimsIntakeComparePair(leftRunId, rightRunId)) {
    return false;
  }

  if (isStaticDemoPayloadFallbackEnabled()) {
    return true;
  }

  return (
    isStaticDemoPayloadFallbackActiveForRun(leftRunId) && isStaticDemoPayloadFallbackActiveForRun(rightRunId)
  );
}

/** Curated Claims Intake v1 vs v2 structured manifest delta when compare APIs are unavailable. */
export function tryStaticDemoGoldenManifestComparison(
  baseRunId: string,
  targetRunId: string,
): GoldenManifestComparison | null {
  if (!isStaticDemoComparePairActive(baseRunId, targetRunId)) {
    return null;
  }

  return {
    baseRunId: SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
    targetRunId: SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
    decisionChanges: [
      {
        decisionKey: "claims.intake.phi.minimization",
        displayLabel: "PHI minimization control posture",
        baseValue: "Sampling-only monitoring (baseline)",
        targetValue: "Sampling with automated exception routing (updated)",
        changeType: "Modified",
      },
      {
        decisionKey: "claims.intake.ocr.bypass",
        displayLabel: "Unstructured attachment OCR bypass",
        baseValue: "Manual review queue",
        targetValue: "Guard-railed bypass with audit hooks",
        changeType: "Modified",
      },
    ],
    requirementChanges: [
      {
        requirementName: "HIPAA minimum-necessary handling for claim attachments",
        changeType: "Modified",
      },
    ],
    securityChanges: [
      {
        controlName: "PHI field redaction at ingestion boundary",
        baseStatus: "Partial",
        targetStatus: "Implemented with monitoring",
      },
    ],
    topologyChanges: [
      {
        resource: "claims-intake-ocr-worker",
        changeType: "Added",
      },
    ],
    costChanges: [{ baseCost: 42000, targetCost: 48500 }],
    summaryHighlights: [
      "Updated review adds guard-railed OCR bypass monitoring — the monitored PHI minimization risk remains accepted with sampling.",
      "Two architecture decisions changed between baseline and updated finalized manifests; topology adds an OCR worker path.",
    ],
    totalDeltaCount: 7,
  };
}

/** Legacy flat compare payload paired with {@link tryStaticDemoGoldenManifestComparison}. */
export function tryStaticDemoRunComparison(leftRunId: string, rightRunId: string): RunComparison | null {
  if (!isStaticDemoComparePairActive(leftRunId, rightRunId)) {
    return null;
  }

  return {
    leftRunId: SHOWCASE_STATIC_DEMO_PRIOR_COMPARE_RUN_ID,
    rightRunId: SHOWCASE_STATIC_DEMO_LATER_COMPARE_RUN_ID,
    runLevelDiffs: [
      {
        section: "governance",
        key: "phi.minimization.disposition",
        diffKind: "Changed",
        beforeValue: "Accepted with manual sampling",
        afterValue: "Accepted with automated exception routing and monitoring",
        notes: "Non-blocking monitored risk tracked in both packages.",
      },
    ],
    manifestComparison: {
      leftManifestId: `${SHOWCASE_STATIC_DEMO_MANIFEST_ID}-v1`,
      rightManifestId: `${SHOWCASE_STATIC_DEMO_MANIFEST_ID}-v2`,
      leftManifestHash: "sha256:claims-intake-v1-demo",
      rightManifestHash: "sha256:claims-intake-v2-demo",
      addedCount: 1,
      removedCount: 0,
      changedCount: 2,
      diffs: [
        {
          section: "decisions",
          key: "claims.intake.phi.minimization",
          diffKind: "Changed",
          beforeValue: "Baseline monitoring",
          afterValue: "Updated monitoring with routing",
        },
      ],
    },
    runLevelDiffCount: 1,
    hasManifestComparison: true,
  };
}

export function buildStaticDemoRunDetailFromShowcase(urlRunId: string): RunDetail {
  const d = getShowcaseStaticDemoPayload(urlRunId);
  const manifest = d.manifest;
  const chain = d.authorityChain;

  const quickDecisionFindings = (() => {
    const findings: Array<Record<string, unknown>> = [
      {
        findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
        message: "PHI minimization risk",
        category: "Compliance",
        severity: 2,
        reasoningTrace:
          "Confirm OCR bypass monitoring and alerting for unstructured attachment paths. Schedule sponsor + privacy review of exception volume before the next release train.",
      },
    ];

    for (let i = 0; i < 8; i++) {
      const synopsis = SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES[i];
      const title =
        typeof synopsis === "string" && synopsis.trim().length > 0 ? synopsis.trim() : `Architecture decision ${i + 2}`;

      findings.push({
        findingId: `${SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID}-${i + 2}`,
        message: title,
        category: "Architecture",
        severity: 1,
        reasoningTrace: "See finding detail for the decision context and evidence pointers.",
      });
    }

    return findings;
  })();

  return {
    executionFlavorBuyerSummary:
      "Finalized signed review package with traceable evidence, governed outcomes, and audit-ready deliverables.",
    agentExecutionLlmCostEstimate: {
      estimatedCostUsd: null,
      tokenCounts: { prompt: 0, completion: 0 },
      model: "AgentExecution:Simulator",
    },
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
      structuralExecutionMode: 0,
    },
    contextSnapshot: { demo: true },
    graphSnapshot: { demo: true },
    findingsSnapshot: { demo: true },
    decisionTrace: { demo: true },
    goldenManifest: { demo: true },
    artifactBundle: { demo: true },
    results: [{ findings: quickDecisionFindings }],
  };
}

/**
 * Manifest-shaped JSON for client-side Markdown export when static demo run detail uses a `goldenManifest` placeholder.
 */
export function tryStaticDemoGoldenManifestJsonForExport(runId: string): Record<string, unknown> | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  const d = getShowcaseStaticDemoPayload(effectiveRunId);
  const manifest = d.manifest;

  return {
    manifestId: manifest.manifestId,
    runId: manifest.runId,
    createdUtc: manifest.createdUtc,
    manifestHash: manifest.manifestHash,
    ruleSetId: manifest.ruleSetId,
    ruleSetVersion: manifest.ruleSetVersion,
    metadata: {
      manifestVersion: `demo-${manifest.ruleSetVersion}`,
      changeDescription: manifest.operatorSummary,
    },
    assumptions: [],
    constraints: {
      mandatoryConstraints: [],
      preferences: [],
    },
    decisions: SHOWCASE_STATIC_DEMO_DECISION_SYNOPSES.map((rationale: string, index: number) => ({
      decisionId: `claims-intake-decision-${index + 1}`,
      title: `Architecture decision ${index + 1}`,
      category: "Architecture",
      rationale,
    })),
    topology: {
      selectedPatterns: [
        "Event-driven intake",
        "PHI classification at boundary",
        "Bounded queues with back-pressure",
      ],
      resources: ["Azure API Management", "Azure Service Bus", "Azure Cosmos DB"],
      services: [
        {
          serviceId: "svc-intake-api",
          serviceName: "Claims intake API",
          serviceType: 0,
          runtimePlatform: 0,
          purpose: "HTTP ingress and orchestration for intake workloads.",
        },
      ],
    },
    security: {
      controls: [],
      gaps: [...SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES],
    },
    warnings: [...SHOWCASE_STATIC_DEMO_WARNING_SYNOPSES],
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
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
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
      title: "Residual PHI minimization risk (monitored)",
      description:
        "Unstructured intake attachments can bypass minimization controls during peak load — monitor exceptions, reinforce " +
        "ingress classification, and keep privacy-office review on a weekly cadence for this modernization path.",
      whyThisMatters:
        "If PHI volume or retention slips outside the minimization boundary, breach impact, audit scope, and downstream " +
        "processing obligations expand materially — this risk observation is recorded with monitoring in the finalized package.",
      severity: "High",
      category: "Compliance",
      status: "Accepted with monitoring",
      impactedArea: "Intake PHI boundary, adapters, OCR exception paths, and downstream adjudication handoff",
    },
    decisionRuleId: "phi.minimization.intake",
    decisionRuleName: "PHI minimization at intake",
    evidence: [
      {
        artifactId: "intake-subgraph-v2",
        lineRange: "142-168",
        excerpt:
          "Claims intake subgraph retains qualifying attachment metadata used for downstream adjudication references.",
      },
      {
        artifactId: "ingress-classifier-spec",
        lineRange: "28-41",
        excerpt: "Ingress PHI classification rules applied before adapter handoff with exception logging.",
      },
      {
        artifactId: "ocr-bypass-monitor",
        lineRange: "12-19",
        excerpt: "OCR bypass path emits volume alerts when unstructured attachment rate exceeds threshold.",
      },
    ],
    reasoningSummary:
      "This monitored risk was recorded because PHI minimization at intake requires observable controls at ingress, adapter " +
      "boundaries, and OCR exception paths. Three evidence citations support the governance decision record.",
    recommendedActions: [
      "Validate ingress PHI classification rules against production traffic patterns.",
      "Monitor unstructured attachment exception volumes weekly and escalate threshold breaches.",
      "Confirm OCR bypass handling alerts fire before volume thresholds and review after go-live.",
    ],
    auditRowId: "audit-claims-intake-phi-001",
    runId: d.run.runId,
    manifestVersion: "Healthcare Claims Policy Pack v3.4.1",
    confidenceLevel: "Medium",
    evaluationConfidenceScore: 0.78,
  };
}

export function tryStaticDemoFindingInspect(runId: string, findingId: string): FindingInspectPayload | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);
  const fid = findingId.trim();

  // Accept exact match or slug-prefixed IDs (e.g. "phi-minimization-risk-<guid>") so that
  // real finding IDs with appended GUIDs still resolve to the curated demo payload.
  const isKnownFinding =
    fid === SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID ||
    fid.startsWith(`${SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID}-`);

  if (!isKnownFinding) {
    return null;
  }

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  const base = buildStaticDemoPrimaryFindingInspectPayload(effectiveRunId);

  // Align the returned findingId with the URL token so route-alignment checks in
  // loadFindingInspectForRoute and FindingInspectView both pass cleanly.
  return { ...base, findingId: fid };
}

export function tryStaticDemoManifestSummary(manifestId: string): ManifestSummary | null {
  if (!isStaticDemoPayloadFallbackActiveForManifest(manifestId)) {
    return null;
  }

  if (manifestId !== SHOWCASE_STATIC_DEMO_MANIFEST_ID) {
    return null;
  }

  return buildStaticDemoManifestSummaryFromShowcase(SHOWCASE_STATIC_DEMO_RUN_ID);
}

export function tryStaticDemoPipelineTimeline(runId: string): PipelineTimelineItem[] | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return buildStaticDemoPipelineTimelineFromShowcase(effectiveRunId);
}

export function tryStaticDemoArtifacts(runIdForPayload: string, manifestId: string): ArtifactDescriptor[] | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(runIdForPayload)) {
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
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
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

      { id: "n-run", type: "ArchitectureRun", referenceId: rid, name: "Review started" },

      {

        id: "n-ctx",

        type: "ContextSnapshot",

        referenceId: chain.contextSnapshotId ?? "ctx-demo",

        name: "Source context reviewed",

      },

      {

        id: "n-policy",

        type: "PolicyPack",

        referenceId: "demo-healthcare-claims-pack",

        name: policyPackBuyerLabel("healthcare-claims-v3", "3.4.1"),

      },

      {

        id: "n-rule",

        type: "DecisionRule",

        referenceId: "phi.minimization.intake",

        name: "PHI minimization at intake",

      },

      {

        id: "n-graph",

        type: "GraphSnapshot",

        referenceId: chain.graphSnapshotId ?? "graph-demo",

        name: "Evidence trail assembled",

      },

      {

        id: "n-evidence",

        type: "EvidenceArtifact",

        referenceId: "intake-subgraph-v2",

        name: "Intake subgraph evidence",

      },

      {

        id: "n-find",

        type: "FindingsSnapshot",

        referenceId: chain.findingsSnapshotId ?? "find-demo",

        name: "Findings identified",

      },

      {
        id: "n-phi",
        type: "Finding",
        referenceId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
        name: "PHI minimization risk (monitored)",
      },

      {

        id: "n-control",

        type: "Control",

        referenceId: "ingress-classifier",

        name: "Ingress PHI classification control",

      },

      {

        id: "n-reviewer",

        type: "Reviewer",

        referenceId: "jordan-lee",

        name: "Jordan Lee — Architecture approver",

      },

      {

        id: "n-monitor",

        type: "Monitor",

        referenceId: "exception-volume-weekly",

        name: "Weekly exception-volume monitoring",

      },

      {

        id: "n-manifest",

        type: "GoldenManifest",

        referenceId: manifest.manifestId,

        name: "Signed decision record finalized",

      },

      {

        id: "n-audit",

        type: "AuditEvent",

        referenceId: "audit-claims-intake-001",

        name: "Governance approval recorded",

      },

      {

        id: "n-bundle",

        type: "ArtifactBundle",

        referenceId: chain.artifactBundleId ?? "bundle-demo",

        name: "Evidence package assembled",

      },

      {

        id: "n-owner",

        type: "RiskOwner",

        referenceId: "taylor-morgan",

        name: "Taylor Morgan — Residual risk owner",

      },

    ],

    edges: [

      { id: "e-run-ctx", type: "produced", fromNodeId: "n-run", toNodeId: "n-ctx" },

      { id: "e-ctx-policy", type: "evaluated against", fromNodeId: "n-ctx", toNodeId: "n-policy" },

      { id: "e-policy-rule", type: "defines", fromNodeId: "n-policy", toNodeId: "n-rule" },

      { id: "e-rule-graph", type: "applied in", fromNodeId: "n-rule", toNodeId: "n-graph" },

      { id: "e-graph-evidence", type: "cites", fromNodeId: "n-graph", toNodeId: "n-evidence" },

      { id: "e-evidence-find", type: "supports", fromNodeId: "n-evidence", toNodeId: "n-find" },

      { id: "e-find-phi", type: "raised", fromNodeId: "n-find", toNodeId: "n-phi" },

      { id: "e-phi-control", type: "mitigated by", fromNodeId: "n-phi", toNodeId: "n-control" },

      { id: "e-control-reviewer", type: "reviewed by", fromNodeId: "n-control", toNodeId: "n-reviewer" },

      { id: "e-phi-monitor", type: "monitored via", fromNodeId: "n-phi", toNodeId: "n-monitor" },

      { id: "e-monitor-owner", type: "owned by", fromNodeId: "n-monitor", toNodeId: "n-owner" },

      { id: "e-phi-manifest", type: "recorded in", fromNodeId: "n-phi", toNodeId: "n-manifest" },

      { id: "e-reviewer-audit", type: "recorded in", fromNodeId: "n-reviewer", toNodeId: "n-audit" },

      { id: "e-manifest-audit", type: "finalized in", fromNodeId: "n-manifest", toNodeId: "n-audit" },

      { id: "e-manifest-bundle", type: "packaged", fromNodeId: "n-manifest", toNodeId: "n-bundle" },

    ],

    timeline,

    traceabilityGaps: [],

  };

}

export function tryStaticDemoProvenanceGraph(runId: string): ArchitectureRunProvenanceGraph | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return buildStaticDemoProvenanceGraphFromShowcase(effectiveRunId);
}

export type PolicyPacksStaticFallbackOptions = {
  /**
   * When the Policy Packs API fails (network error, auth, empty deployment), serve the curated
   * Healthcare Claims pack even if demo env vars are unset — same logic as
   * {@link StaticDemoRunsListFallbackOptions.afterAuthorityListFailure} for run lists.
   */
  readonly afterAuthorityFailure?: boolean;
  /** When list/effective APIs succeed but return empty packs, merge curated Healthcare Claims sample layers. */
  readonly afterEmptyLiveResponse?: boolean;
};

function isPolicyPacksStaticFallbackActive(options?: PolicyPacksStaticFallbackOptions): boolean {
  // Buyer-polished shell uses the same env flags as static demo today; keep explicit so empty API responses still
  // merge curated Healthcare Claims sample layers if flags or option wiring ever diverge.
  if (isBuyerPolishedOperatorShellEnv()) {
    return true;
  }

  if (isStaticDemoPayloadFallbackEnabled()) {
    return true;
  }

  if (options?.afterAuthorityFailure === true) {
    return true;
  }

  if (options?.afterEmptyLiveResponse === true) {
    return true;
  }

  return false;
}

export function tryStaticDemoPolicyPacksList(options?: PolicyPacksStaticFallbackOptions): PolicyPack[] | null {
  if (!isPolicyPacksStaticFallbackActive(options)) {
    return null;
  }

  return [
    {
      policyPackId: "demo-healthcare-claims-pack",
      tenantId: "demo-tenant",
      workspaceId: "demo-workspace",
      projectId: "default",
      name: policyPackBuyerLabel("healthcare-claims-v3", "3.4.1"),
      description: "Healthcare Claims pack aligned with the Claims Intake review package.",
      packType: "BuiltIn",
      status: "Active",
      createdUtc: "2026-01-10T12:00:00.000Z",
      currentVersion: "3.4.1",
    },
  ];
}

export function tryStaticDemoEffectivePolicyPacks(
  projectId: string,
  options?: PolicyPacksStaticFallbackOptions,
): EffectivePolicyPackSet | null {
  if (!isPolicyPacksStaticFallbackActive(options)) {
    return null;
  }

  const pid = projectId.trim().length > 0 ? projectId.trim() : "default";

  return {
    tenantId: "demo-tenant",
    workspaceId: "demo-workspace",
    projectId: pid,
    packs: [
      {
        policyPackId: "demo-healthcare-claims-pack",
        name: policyPackBuyerLabel("healthcare-claims-v3", "3.4.1"),
        version: "3.4.1",
        packType: "BuiltIn",
        contentJson: JSON.stringify({
          complianceRuleIds: [],
          complianceRuleKeys: ["phi.minimization.intake"],
          alertRuleIds: [],
          compositeAlertRuleIds: [],
          advisoryDefaults: {},
          metadata: { vertical: "healthcare", ruleSetId: "healthcare-claims-v3" },
        }),
      },
    ],
  };
}

export function tryStaticDemoEffectivePolicyContent(
  options?: PolicyPacksStaticFallbackOptions,
): PolicyPackContentDocument | null {
  if (!isPolicyPacksStaticFallbackActive(options)) {
    return null;
  }

  return {
    complianceRuleIds: [],
    complianceRuleKeys: ["phi.minimization.intake", "claims.intake.boundary"],
    alertRuleIds: [],
    compositeAlertRuleIds: [],
    advisoryDefaults: {},
    metadata: { vertical: "healthcare" },
  };
}

export function mergePolicyPacksStateWithStaticDemo(
  packs: PolicyPack[],
  effective: EffectivePolicyPackSet | null,
  content: PolicyPackContentDocument | null,
  projectId: string,
  options?: PolicyPacksStaticFallbackOptions,
): { packs: PolicyPack[]; effective: EffectivePolicyPackSet | null; content: PolicyPackContentDocument | null } {
  if (!isPolicyPacksStaticFallbackActive(options)) {
    return { packs, effective, content };
  }

  let nextPacks = packs;

  if (nextPacks.length === 0) {
    const seeded = tryStaticDemoPolicyPacksList(options);

    if (seeded !== null) {
      nextPacks = seeded;
    }
  }

  let nextEffective = effective;

  if (nextEffective === null || nextEffective.packs.length === 0) {
    const seededEff = tryStaticDemoEffectivePolicyPacks(projectId, options);

    if (seededEff !== null) {
      nextEffective = seededEff;
    }
  }

  let nextContent = content;

  if (nextContent === null || (nextContent.complianceRuleKeys?.length ?? 0) === 0) {
    const seededDoc = tryStaticDemoEffectivePolicyContent(options);

    if (seededDoc !== null) {
      nextContent = seededDoc;
    }
  }

  return { packs: nextPacks, effective: nextEffective, content: nextContent };
}

export function staticDemoPolicyPacksFallbackBundle(
  projectId: string,
  options?: PolicyPacksStaticFallbackOptions,
): {
  packs: PolicyPack[];
  effective: EffectivePolicyPackSet;
  content: PolicyPackContentDocument;
} | null {
  if (!isPolicyPacksStaticFallbackActive(options)) {
    return null;
  }

  const list = tryStaticDemoPolicyPacksList(options);
  const eff = tryStaticDemoEffectivePolicyPacks(projectId, options);
  const doc = tryStaticDemoEffectivePolicyContent(options);

  if (list === null || eff === null || doc === null) {
    return null;
  }

  return { packs: list, effective: eff, content: doc };
}

export function tryStaticDemoAlertInboxRow(): AlertRecord {
  return {
    alertId: "demo-alert-phi-intake",
    ruleId: "architecture-risk-phi-intake",
    title: "PHI minimization risk — intake path",
    category: "Privacy / regulated data",
    severity: "High",
    status: "Open",
    triggerValue: "Elevated handling risk on unstructured attachments",
    description:
      "Correlates with the PHI minimization storyline in the Claims Intake sample review — monitor exception volume weekly.",
    createdUtc: "2026-01-14T22:01:00.000Z",
    lastUpdatedUtc: null,
    runId: SHOWCASE_STATIC_DEMO_RUN_ID,
    primaryFindingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
    comparedToRunId: null,
    recommendationId: null,
  };
}

/** Merge PHI sample alert into an empty inbox only in demo / buyer-polished builds — not for arbitrary local dev. */
export function shouldMergeOperatorDemoAlertSample(): boolean {
  return isBuyerPolishedOperatorShellEnv() || isStaticDemoPayloadFallbackEnabled();
}

export function tryStaticDemoGovernanceApprovalRequests(runId: string): GovernanceApprovalRequest[] | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return [
    {
      approvalRequestId: "claims-intake-approval-001",
      runId: effectiveRunId,
      manifestVersion: "3.4.1",
      sourceEnvironment: "dev",
      targetEnvironment: "test",
      status: "Approved",
      requestedBy: "Taylor Morgan",
      reviewedBy: "Jordan Lee",
      requestComment: "Request governed use of the finalized intake manifest after privacy review.",
      reviewComment: "Approved — maintain weekly monitoring on unstructured attachment volume.",
      requestedUtc: "2026-01-14T21:00:00.000Z",
      reviewedUtc: "2026-01-14T22:05:00.000Z",
    },
  ];
}

export function tryStaticDemoGovernancePromotions(runId: string): GovernancePromotionRecord[] | null {
  if (!isStaticDemoPayloadFallbackActiveForRun(runId)) {
    return null;
  }

  const effectiveRunId = canonicalizeDemoRunId(runId);

  if (!isDemoRunIdEligibleForStaticFallback(effectiveRunId)) {
    return null;
  }

  return [
    {
      promotionRecordId: "demo-promotion-claims-intake-001",
      runId: effectiveRunId,
      manifestVersion: "3.4.1",
      sourceEnvironment: "dev",
      targetEnvironment: "test",
      promotedBy: "Taylor Morgan",
      approvalRequestId: "claims-intake-approval-001",
      notes: "Sample governed-use record aligned with the Claims Intake showcase.",
      promotedUtc: "2026-01-14T22:06:00.000Z",
    },
  ];
}

/** Curated approval lineage for the Claims Intake showcase when the lineage API is unavailable. */
export function tryStaticDemoGovernanceApprovalLineage(approvalRequestId: string): GovernanceLineageResult | null {
  if (!isBuyerPolishedOperatorShellEnv() && !isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  const id = approvalRequestId.trim();

  if (id !== "claims-intake-approval-001") {
    return null;
  }

  const runId = SHOWCASE_STATIC_DEMO_RUN_ID;
  const approvals = tryStaticDemoGovernanceApprovalRequests(runId);
  const promotions = tryStaticDemoGovernancePromotions(runId);

  if (approvals === null || approvals.length === 0) {
    return null;
  }

  return {
    approvalRequest: approvals[0]!,
    run: {
      runId,
      status: "Finalized",
      createdUtc: "2026-01-12T10:00:00.000Z",
      completedUtc: "2026-01-14T22:00:00.000Z",
      currentManifestVersion: "3.4.1",
    },
    manifest: {
      manifestVersion: "3.4.1",
      decisionCount: 12,
      unresolvedIssueCount: 0,
      complianceGapCount: 0,
    },
    topFindings: [
      {
        findingId: SHOWCASE_STATIC_DEMO_PRIMARY_FINDING_ID,
        title: "Residual PHI minimization risk (monitored)",
        engineType: "Policy",
        severity: "High",
        traceCompletenessRatio: 0.92,
      },
    ],
    riskPosture: "Approved with monitoring",
    promotions: promotions ?? [],
  };
}
