"use client";

import { Fragment, type ReactNode } from "react";

import { PackageActivityAuditTrailVocabularyRail } from "@/components/PackageActivityAuditTrailVocabularyRail";
import { PackageEvidenceEvidenceGraphVocabularyRail } from "@/components/PackageEvidenceEvidenceGraphVocabularyRail";
import { PackageGovernanceApprovalQueueVocabularyRail } from "@/components/PackageGovernanceApprovalQueueVocabularyRail";
import type { ReviewDetailTabId } from "@/lib/review-detail-workspace-tabs";
import type { ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";
import {
  WorkbenchLayoutBridge,
  WorkbenchSelectionCoordinator,
} from "@/components/reviews/WorkbenchSelectionCoordinator";
import { WorkbenchFindingSelectionSync } from "@/components/reviews/WorkbenchFindingSelectionSync";
import { ReviewWorkspaceTabStrip } from "@/components/reviews/ReviewWorkspaceTabStrip";

import type { ReviewDetailWorkspaceProps } from "@/components/reviews/ReviewDetailWorkspace";
import type { UseReviewDetailWorkspaceTabsResult } from "@/components/reviews/use-review-detail-workspace-tabs";

export type ReviewDetailWorkspaceTabShellProps = {
  readonly props: ReviewDetailWorkspaceProps;
  readonly tabs: UseReviewDetailWorkspaceTabsResult;
  readonly navigateTab: UseReviewDetailWorkspaceTabsResult["navigateTab"];
  readonly onEnterPresenter: () => void;
};

function panelWithInPipelineBanner(
  tabId: ReviewDetailTabId,
  panel: ReactNode,
  inPipelineBanner: ReactNode | null | undefined,
): ReactNode {
  if (tabId === "activity" || inPipelineBanner === null || inPipelineBanner === undefined) {
    return panel;
  }

  return (
    <div className="space-y-4">
      <Fragment key={`${tabId}-in-pipeline-banner`}>{inPipelineBanner}</Fragment>
      <Fragment key={`${tabId}-panel`}>{panel}</Fragment>
    </div>
  );
}

function panelWithVocabularyRail(tabId: ReviewDetailTabId, vocabularyRail: ReactNode, panel: ReactNode): ReactNode {
  return (
    <>
      <Fragment key={`${tabId}-vocabulary-rail`}>{vocabularyRail}</Fragment>
      <Fragment key={`${tabId}-panel`}>{panel}</Fragment>
    </>
  );
}

function panelHidden(activeTab: ReviewDetailTabId, tabId: ReviewDetailTabId): boolean {
  return activeTab !== tabId;
}

export function ReviewDetailWorkspaceTabShell({
  props,
  tabs,
  navigateTab,
}: ReviewDetailWorkspaceTabShellProps): React.JSX.Element {
  const {
    activeTab,
    lifecycle,
    resolved,
    isTabNewSinceLastVisit,
    workbenchVisible,
    workbenchFocusColumn,
    setWorkbenchEnabled,
    inPipelineBanner,
    counts,
  } = tabs;
  const activePanelLead = props.activePanelLead ?? null;

  return (
    <div className="min-w-0 space-y-4" data-testid="review-detail-workspace">
      {props.defensibilityStrip ?? null}
      <ReviewWorkspaceTabStrip
        lifecycle={lifecycle}
        activeTab={activeTab}
        resolvedTabs={resolved}
        tabCounts={{
          findings: counts.findings,
          evidence: counts.evidence,
          decisionsRemediation: counts.decisionsRemediation,
        }}
        isTabNewSinceLastVisit={isTabNewSinceLastVisit}
        onTabChange={navigateTab}
      />

      {props.tabSectionNav ?? null}

      {activePanelLead !== null ? (
        <div data-testid="review-detail-active-panel-lead">{activePanelLead}</div>
      ) : null}

      {workbenchVisible ? (
        <WorkbenchLayoutBridge
          architecture={panelWithInPipelineBanner(
            "architecture",
            props.panels.architecture,
            inPipelineBanner,
          )}
          findings={panelWithInPipelineBanner("findings", props.panels.findings, inPipelineBanner)}
          evidence={panelWithVocabularyRail(
            "evidence",
            <PackageEvidenceEvidenceGraphVocabularyRail
              runId={props.runId}
              currentSurfaceId="package-evidence"
            />,
            panelWithInPipelineBanner("evidence", props.panels.evidence, inPipelineBanner),
          )}
          focusColumn={workbenchFocusColumn}
          onFocusColumn={(column: ReviewWorkbenchColumnId) => navigateTab(column, { workbenchFocus: column })}
          onExitWorkbench={() => setWorkbenchEnabled(false)}
        />
      ) : null}
      <WorkbenchSelectionCoordinator enabled={workbenchVisible} />
      <WorkbenchFindingSelectionSync />

      <div
        className="min-w-0 overflow-visible"
        hidden={panelHidden(activeTab, "overview")}
        data-testid="review-detail-workspace-panel-overview"
      >
        {panelWithInPipelineBanner("overview", props.panels.overview, inPipelineBanner)}
      </div>
      <div
        className="min-w-0 overflow-visible"
        hidden={workbenchVisible || panelHidden(activeTab, "findings")}
        data-testid="review-detail-workspace-panel-findings"
      >
        {panelWithInPipelineBanner("findings", props.panels.findings, inPipelineBanner)}
      </div>
      <div
        className="min-w-0 overflow-visible"
        hidden={workbenchVisible || panelHidden(activeTab, "evidence")}
        data-testid="review-detail-workspace-panel-evidence"
      >
        {panelWithVocabularyRail(
          "evidence",
          <PackageEvidenceEvidenceGraphVocabularyRail
            runId={props.runId}
            currentSurfaceId="package-evidence"
          />,
          panelWithInPipelineBanner("evidence", props.panels.evidence, inPipelineBanner),
        )}
      </div>
      <div
        className="min-w-0 overflow-visible"
        hidden={panelHidden(activeTab, "policies")}
        data-testid="review-detail-workspace-panel-policies"
      >
        {panelWithVocabularyRail(
          "policies",
          <PackageGovernanceApprovalQueueVocabularyRail
            runId={props.runId}
            currentSurfaceId="package-governance"
          />,
          panelWithInPipelineBanner("policies", props.panels.policies, inPipelineBanner),
        )}
      </div>
      <div
        className="min-w-0 overflow-visible"
        hidden={panelHidden(activeTab, "decisions-remediation")}
        data-testid="review-detail-workspace-panel-decisions-remediation"
      >
        {panelWithInPipelineBanner(
          "decisions-remediation",
          props.panels.decisionsRemediation,
          inPipelineBanner,
        )}
      </div>
      <div
        className="min-w-0 overflow-visible"
        hidden={panelHidden(activeTab, "review-package")}
        data-testid="review-detail-workspace-panel-review-package"
      >
        {panelWithInPipelineBanner("review-package", props.panels.reviewPackage, inPipelineBanner)}
      </div>
      <div
        className="min-w-0 overflow-visible"
        hidden={workbenchVisible || panelHidden(activeTab, "architecture")}
        data-testid="review-detail-workspace-panel-architecture"
      >
        {panelWithInPipelineBanner("architecture", props.panels.architecture, inPipelineBanner)}
      </div>
      <div
        className="min-w-0 overflow-visible"
        hidden={panelHidden(activeTab, "activity")}
        data-testid="review-detail-workspace-panel-activity"
      >
        {panelWithVocabularyRail(
          "activity",
          <PackageActivityAuditTrailVocabularyRail
            runId={props.runId}
            currentSurfaceId="package-activity"
          />,
          props.panels.activity,
        )}
      </div>
    </div>
  );
}
