import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";

import type { SampleScenarioDefinition } from "@/lib/samples/types";
import { DEV_SCOPE_PROJECT_ID } from "@/lib/scope";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";

export type IntakeShowcaseDecisionItem = {
  readonly controlArea: string;
  readonly text: string;
};

export type BuildIntakeShowcaseStaticPayloadArgs = {
  readonly scenario: SampleScenarioDefinition;
  readonly urlRunId: string;
  readonly generatedUtc?: string;
  readonly demoStatusMessage: string;
  readonly operatorSummary: string;
  readonly decisionItems: readonly IntakeShowcaseDecisionItem[];
  readonly warningSynopses: readonly string[];
  readonly runExplanationSummary: string;
  readonly keyDrivers: readonly string[];
  readonly riskImplications: readonly string[];
  readonly costImplications: readonly string[];
  readonly complianceImplications: readonly string[];
  readonly detailedNarrative: string;
  readonly themeSummaries: readonly string[];
  readonly overallAssessment: string;
  readonly riskPosture: string;
  readonly complianceGapCount: number;
  readonly graphSnapshotLabel: string;
  readonly contextSnapshotLabel: string;
  readonly primaryFindingConfidenceLevel: "High" | "Medium" | "Low";
  readonly primaryFindingEvaluationScore: number;
  readonly primaryFindingEvidenceRefCount: number;
  readonly sponsorBriefingArtifactName: string;
  readonly contextDiagramArtifactName: string;
};

const DEFAULT_GENERATED_UTC = "2026-04-23T09:15:00.000Z";

/**
 * Shared intake-modernization topology for Claims and generic customer-intake showcase payloads (TB-980).
 */
export function buildIntakeShowcaseStaticPayload(args: BuildIntakeShowcaseStaticPayloadArgs): DemoCommitPagePreviewResponse {
  const runId = args.urlRunId.trim().length > 0 ? args.urlRunId.trim() : args.scenario.runId;
  const generatedUtc = args.generatedUtc ?? DEFAULT_GENERATED_UTC;

  return {
    generatedUtc,
    isDemoData: true,
    demoStatusMessage: args.demoStatusMessage,
    run: {
      runId,
      projectId: DEV_SCOPE_PROJECT_ID,
      description: args.scenario.buyerReviewPackageTitle,
      createdUtc: "2026-01-10T09:15:22.000Z",
    },
    manifest: {
      manifestId: args.scenario.manifestId,
      runId,
      createdUtc: "2026-01-14T22:08:41.000Z",
      manifestHash: "sha256-demo-7f91c4aab3…",
      ruleSetId: args.scenario.ruleSetId,
      ruleSetVersion: "3.4.1",
      decisionCount: args.scenario.spineCounts.decisionCount,
      warningCount: args.scenario.spineCounts.warningCount,
      unresolvedIssueCount: 0,
      status: "Committed",
      operatorSummary: args.operatorSummary,
    },
    authorityChain: {
      contextSnapshotId: "ctx-snapshot-01",
      graphSnapshotId: "graph-snapshot-01",
      findingsSnapshotId: "find-snapshot-01",
      goldenManifestId: args.scenario.manifestId,
      decisionTraceId: `trace-${args.scenario.slug}-01`,
      artifactBundleId: `bundle-${args.scenario.slug}-demo-01`,
    },
    artifacts: [
      {
        artifactId: "b2d4e6f8-a1c3-5e79-abcd-ef9876543210",
        artifactType: "MarkdownReport",
        name: args.sponsorBriefingArtifactName,
        format: "text/markdown",
        createdUtc: "2026-01-14T22:10:05.000Z",
        contentHash: "sha256-demo-art-md",
      },
      {
        artifactId: "e6f8394c-d8fa-9255-ef01-c45678901234",
        artifactType: "CostSummary",
        name: "Cost posture summary.json",
        format: "application/json",
        createdUtc: "2026-01-14T22:10:07.000Z",
        contentHash: "sha256-demo-art-cost",
      },
      {
        artifactId: "c3e5f709-b2d4-6f81-bcde-f12345678901",
        artifactType: "JsonBundle",
        name: "Architecture decision record bundle.json",
        format: "application/json",
        createdUtc: "2026-01-14T22:10:12.000Z",
        contentHash: "sha256-demo-art-json",
      },
      {
        artifactId: "d4f6181b-c5e7-7932-cdef-a23456789012",
        artifactType: "Diagram",
        name: args.contextDiagramArtifactName,
        format: "text/plain",
        createdUtc: "2026-01-14T22:10:20.000Z",
        contentHash: "sha256-demo-art-diagram",
      },
    ],
    pipelineTimeline: [
      {
        eventId: "evt-pipeline-request-created",
        occurredUtc: "2026-01-10T09:15:22.000Z",
        eventType: "RunStarted",
        actorUserName: "Jordan Lee",
        correlationId: `corr-${args.scenario.slug}-demo-request`,
      },
      {
        eventId: "evt-pipeline-context",
        occurredUtc: "2026-01-13T16:22:41.000Z",
        eventType: "context.snapshot.created",
        actorUserName: "ArchLucid system",
        correlationId: `corr-${args.scenario.slug}-demo-ctx`,
      },
      {
        eventId: "evt-pipeline-graph",
        occurredUtc: "2026-01-18T14:09:07.000Z",
        eventType: "graph.snapshot.created",
        actorUserName: "ArchLucid system",
        correlationId: `corr-${args.scenario.slug}-demo-graph`,
      },
      {
        eventId: "evt-pipeline-findings",
        occurredUtc: "2026-01-24T11:41:53.000Z",
        eventType: "findings.snapshot.created",
        actorUserName: "ArchLucid system",
        correlationId: `corr-${args.scenario.slug}-demo-findings`,
      },
      {
        eventId: "evt-pipeline-manifest-finalized",
        occurredUtc: "2026-01-31T21:52:06.000Z",
        eventType: "finalize.run",
        actorUserName: "Taylor Morgan",
        correlationId: `corr-${args.scenario.slug}-demo-manifest`,
      },
      {
        eventId: "evt-pipeline-governance-approved",
        occurredUtc: "2026-02-02T17:30:00.000Z",
        eventType: "com.archlucid.governance.approval.recorded",
        actorUserName: "Jordan Lee",
        correlationId: `corr-${args.scenario.slug}-demo-governance`,
      },
      {
        eventId: "evt-pipeline-bundle",
        occurredUtc: "2026-02-03T09:07:44.000Z",
        eventType: "artifact.bundle.created",
        actorUserName: "ArchLucid system",
        correlationId: `corr-${args.scenario.slug}-demo-bundle`,
      },
    ],
    runExplanation: {
      explanation: {
        rawText: "",
        structured: null,
        confidence: null,
        provenance: null,
        summary: args.runExplanationSummary,
        keyDrivers: [...args.keyDrivers],
        riskImplications: [...args.riskImplications],
        costImplications: [...args.costImplications],
        complianceImplications: [...args.complianceImplications],
        detailedNarrative: args.detailedNarrative,
      },
      themeSummaries: [...args.themeSummaries],
      overallAssessment: args.overallAssessment,
      riskPosture: args.riskPosture,
      findingCount: args.scenario.spineCounts.findingCount,
      decisionCount: args.scenario.spineCounts.decisionCount,
      unresolvedIssueCount: 0,
      complianceGapCount: args.complianceGapCount,
      faithfulnessSupportRatio: null,
      deterministicFallbackUsed: false,
      faithfulnessWarning: null,
      findingTraceConfidences: [
        {
          findingId: args.scenario.primaryFindingId,
          findingTitle: args.scenario.primaryFindingTitle,
          confidenceLevel: args.primaryFindingConfidenceLevel,
          evaluationConfidenceScore: args.primaryFindingEvaluationScore,
          evidenceRefCount: args.primaryFindingEvidenceRefCount,
          traceConfidenceLabel: args.primaryFindingConfidenceLevel,
          traceCompletenessRatio: 0.95,
        },
      ],
      citations: [
        { kind: "Manifest", id: args.scenario.manifestId, label: SIGNED_MANIFEST_LABEL, runId },
        {
          kind: "GraphSnapshot",
          id: "graph-snapshot-01",
          label: args.graphSnapshotLabel,
          runId,
        },
        {
          kind: "ContextSnapshot",
          id: "ctx-snapshot-01",
          label: args.contextSnapshotLabel,
          runId,
        },
      ],
    },
  };
}
