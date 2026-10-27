import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { RunDetailPageModel } from "./run-detail-page-model";
import type { RunDetailPresentation } from "./run-detail-page-presentation";
import type { RunDetailTabbedWorkspaceResolved } from "./resolve-run-detail-tabbed-workspace";

const captured = vi.hoisted(() => ({
  openClarificationGapCount: undefined as number | null | undefined,
}));

vi.mock("./run-detail-page-view-deferred-chunks-review-package", () => ({
  RunDetailReviewPackageDoThisNextResolvedDeferred: (props: {
    openClarificationGapCount?: number | null;
  }) => {
    captured.openClarificationGapCount = props.openClarificationGapCount;
    return null;
  },
}));

vi.mock("@/components/reviews/RunDetailPresenterElicitationBridge", () => ({
  RunDetailPresenterElicitationBridge: (props: { activePanelLead?: React.ReactNode }) => (
    <>{props.activePanelLead}</>
  ),
}));

vi.mock("./RunDetailTabbedWorkspaceDeferredImports", () => ({
  RunDetailExplanationSkeleton: () => null,
  RunDetailTabbedSectionNavDeferred: () => null,
}));

import { RunDetailTabbedWorkspaceShell } from "./RunDetailTabbedWorkspaceShell";

function minimalShellProps(): {
  model: RunDetailPageModel;
  presentation: RunDetailPresentation;
  resolved: RunDetailTabbedWorkspaceResolved;
} {
  const model = {
    resolvedDetail: {
      run: { runId: "run-1", architectureRequestId: "ar-1" },
      findingsSnapshot: null,
      contextSnapshot: null,
      graphSnapshot: null,
      degradedFindingCoverage: false,
    },
    manifestId: null,
    buyerPolishedArtifactTable: false,
    showProgressTracker: false,
    runCompleted: false,
    manifestSummary: null,
    manifestSummaryForUi: null,
    progressForPipelineUi: { runId: "run-1" },
    runDetailNavSections: [],
    pipelineDiagnosticContext: null,
  } as unknown as RunDetailPageModel;

  const presentation = {
    blockingApprovalCount: 0,
    commitBlockedReason: null,
    finalizeReadinessEnabled: false,
    finalizeReadinessBlocks: [],
    quickDecisionFindings: [],
    requestAssumptionTexts: [],
    reviewStatusSummary: { nextAction: null },
    architectureEditHref: null,
    findingCoverageSummary: null,
    withheldFindings: [],
    catalogAdvisoryEngineFailureCount: 0,
    evidenceCoverageSummary: { linkedCount: 0, totalCount: 0 },
    evidenceInventoryItems: [],
  } as unknown as RunDetailPresentation;

  const resolved = {
    defensibilityStripEl: null,
    lifecycle: {},
    inPipelineBannerEl: null,
    tabActivityAt: {},
    tabCounts: {},
    panels: {},
  } as unknown as RunDetailTabbedWorkspaceResolved;

  return { model, presentation, resolved };
}

describe("RunDetailTabbedWorkspaceShell", () => {
  it("passes null openClarificationGapCount so zero is not treated as loaded", () => {
    captured.openClarificationGapCount = undefined;
    const { model, presentation, resolved } = minimalShellProps();

    render(
      <RunDetailTabbedWorkspaceShell model={model} presentation={presentation} resolved={resolved} />,
    );

    expect(captured.openClarificationGapCount).toBeNull();
  });
});
