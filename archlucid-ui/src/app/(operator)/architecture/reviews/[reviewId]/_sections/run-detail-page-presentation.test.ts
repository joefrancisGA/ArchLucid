import { describe, expect, it } from "vitest";

import { buildRunDetailPresentation } from "./run-detail-page-presentation";
import type { RunDetailPageModel } from "./run-detail-page-model";

type ModelOverrides = {
  readonly manifestId?: string | null;
  readonly buyerPolishedArtifactTable?: boolean;
  readonly hasCommitBlockingFailures?: boolean;
  readonly failedEngineLabels?: readonly string[];
  readonly operatorGovernanceDecision?: string | null;
  readonly findings?: readonly Record<string, unknown>[];
  readonly artifacts?: readonly unknown[];
  readonly trustEvidenceCard?: unknown;
};

function model(overrides: ModelOverrides = {}): RunDetailPageModel {
  const run = {
    runId: "run-1",
    createdUtc: "2026-08-01T12:00:00Z",
    completedUtc: "2026-08-01T12:30:00Z",
    description: "Claims intake modernization",
    operatorGovernanceDecision: overrides.operatorGovernanceDecision ?? null,
  };

  return {
    routeRunId: "run-1",
    resolvedDetail: {
      run,
      results:
        overrides.findings !== undefined
          ? [{ findings: [...overrides.findings] }]
          : [],
      findingCoverageSummary:
        overrides.hasCommitBlockingFailures === true
          ? {
              hasCommitBlockingFailures: true,
              failedEngineLabels: overrides.failedEngineLabels ?? [],
            }
          : null,
      trustEvidenceCard: overrides.trustEvidenceCard ?? null,
    },
    runDetailTraceId: null,
    buyerPolishedArtifactTable: overrides.buyerPolishedArtifactTable ?? false,
    usedStaticDemoRun: false,
    manifestId: overrides.manifestId ?? null,
    headline: "Claims intake modernization",
    createdLabel: "Aug 1, 2026",
    goldenManifestJsonForExport: null,
    progressForPipelineUi: { runId: "run-1", description: "Claims intake modernization" },
    showProgressTracker: false,
    manifestSummary: null,
    manifestSummaryForUi: null,
    manifestSummaryFailure: null,
    manifestSummaryMalformed: null,
    artifacts: overrides.artifacts ?? [],
    artifactsFailure: null,
    artifactsMalformed: null,
    explanationSummary: null,
    explanationFailure: null,
    runDetailNavSections: [],
    findingCountDisplay: 0,
    warningCountDisplay: 0,
    showPilotScorecardPackageCta: false,
    governanceGateLabel: null,
    adrGeneratorInput: { runId: "run-1" },
  } as unknown as RunDetailPageModel;
}

describe("buildRunDetailPresentation", () => {
  it("names the failed engines when finding coverage blocks commit for operators", async () => {
    const presentation = await buildRunDetailPresentation(
      model({ hasCommitBlockingFailures: true, failedEngineLabels: ["Security", "Cost"] }),
      false,
    );

    expect(presentation.commitBlockedReason).toBe(
      "Finding coverage is commit-blocking. Failed engines: Security, Cost.",
    );
  });

  it("keeps the engine list out of the sponsor-facing block reason", async () => {
    const presentation = await buildRunDetailPresentation(
      model({
        hasCommitBlockingFailures: true,
        failedEngineLabels: ["Security"],
        buyerPolishedArtifactTable: true,
      }),
      true,
    );

    expect(presentation.commitBlockedReason).toBe(
      "Some checks must finish before this review can be finalized.",
    );
  });

  it("treats a review with no manifest as the architecture-created home when arriving from creation", async () => {
    const fromCreation = await buildRunDetailPresentation(model(), true);
    const direct = await buildRunDetailPresentation(model(), false);

    expect(fromCreation.showArchitectureCreatedHome).toBe(true);
    expect(fromCreation.architectureCreatedHomeModel).not.toBeNull();
    expect(direct.showArchitectureCreatedHome).toBe(false);
    expect(direct.architectureCreatedHomeModel).toBeNull();
  });

  it("offers a rerun correction href only while the review has no finalized manifest", async () => {
    const inProgress = await buildRunDetailPresentation(model(), false);
    const finalized = await buildRunDetailPresentation(model({ manifestId: "manifest-1" }), false);

    expect(inProgress.architectureEditHref).toBe(
      "/architecture/reviews/new?path=guided-intake&rerun=run-1",
    );
    expect(finalized.architectureEditHref).toBeNull();
  });

  it("demotes the governance CTA card when governance is already the primary action", async () => {
    const finalized = await buildRunDetailPresentation(model({ manifestId: "manifest-1" }), false);

    expect(finalized.showGovernanceCta).toBe(true);
    expect(finalized.showGovernanceCtaCard).toBe(false);
  });

  it("carries the deferred section context through unchanged", async () => {
    const presentation = await buildRunDetailPresentation(model({ manifestId: "manifest-1" }), false);

    expect(presentation.deferredContext.routeRunId).toBe("run-1");
    expect(presentation.deferredContext.manifestId).toBe("manifest-1");
    expect(presentation.buyerFinalizedPackage).toBe(false);
  });

  it("does not count disposition-closed findings toward pending decision badges", async () => {
    const presentation = await buildRunDetailPresentation(
      model({
        manifestId: "manifest-1",
        findings: [
          {
            findingId: "f-accepted-pending",
            message: "Accepted via disposition",
            severity: 2,
            humanReviewStatus: 1,
            latestDisposition: "Accepted",
          },
        ],
      }),
      false,
    );

    expect(presentation.pendingDecisionCount).toBe(0);
  });

  it("does not count disposition-closed findings toward low extraction confidence gate", async () => {
    const presentation = await buildRunDetailPresentation(
      model({
        manifestId: "manifest-1",
        findings: [
          {
            findingId: "f-low-conf-accepted",
            message: "Low confidence accepted",
            severity: 2,
            confidenceLevel: "Low",
            humanReviewStatus: 1,
            latestDisposition: "Accepted",
          },
        ],
      }),
      false,
    );

    expect(presentation.lowExtractionConfidenceCount).toBe(0);
  });

  it("does not surface disposition-closed findings in material severity strip", async () => {
    const presentation = await buildRunDetailPresentation(
      model({
        manifestId: "manifest-1",
        findings: [
          {
            findingId: "f-critical-accepted",
            message: "Critical accepted",
            severity: 3,
            latestDisposition: "Accepted",
          },
        ],
      }),
      false,
    );

    expect(presentation.materialSeverityLine).toBeNull();
  });

  it("does not surface disposition-closed findings in highest severity summary", async () => {
    const presentation = await buildRunDetailPresentation(
      model({
        manifestId: "manifest-1",
        findings: [
          {
            findingId: "f-critical-accepted",
            message: "Critical accepted",
            severity: 3,
            latestDisposition: "Accepted",
          },
        ],
      }),
      false,
    );

    expect(presentation.overallPosture).toBe("Not assessed");
    expect(presentation.reviewStatusSummary.highestUnresolvedSeverity).toBeNull();
  });
});
