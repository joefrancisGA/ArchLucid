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

/** Keep panel wrappers for e2e test ids; mount heavy client panels only when visible. */
function renderTabPanel(
  activeTab: ReviewDetailTabId,
  tabId: ReviewDetailTabId,
  panel: ReactNode,
  inPipelineBanner: ReactNode | null | undefined,
  options?: { readonly alsoHidden?: boolean },
): React.JSX.Element {
  const hidden = options?.alsoHidden === true || panelHidden(activeTab, tabId);
  const content = panelWithInPipelineBanner(tabId, panel, inPipelineBanner);

  return (
    <div
      className="min-w-0 overflow-visible"
      hidden={hidden}
      data-testid={`review-detail-workspace-panel-${tabId}`}
    >
      {!hidden ? (
        content
      ) : inPipelineBanner !== null && inPipelineBanner !== undefined && tabId !== "activity" ? (
        <div className="space-y-4">{inPipelineBanner}</div>
      ) : null}
    </div>
  );
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
      <WorkbenchFindingSelectionSync enabled={workbenchVisible || activeTab === "findings"} />

      {renderTabPanel(activeTab, "overview", props.panels.overview, inPipelineBanner)}
      {renderTabPanel(activeTab, "findings", props.panels.findings, inPipelineBanner, {
        alsoHidden: workbenchVisible,
      })}
      {renderTabPanel(
        activeTab,
        "evidence",
        panelWithVocabularyRail(
          "evidence",
          <PackageEvidenceEvidenceGraphVocabularyRail
            runId={props.runId}
            currentSurfaceId="package-evidence"
          />,
          props.panels.evidence,
        ),
        inPipelineBanner,
        { alsoHidden: workbenchVisible },
      )}
      {renderTabPanel(
        activeTab,
        "policies",
        panelWithVocabularyRail(
          "policies",
          <PackageGovernanceApprovalQueueVocabularyRail
            runId={props.runId}
            currentSurfaceId="package-governance"
          />,
          props.panels.policies,
        ),
        inPipelineBanner,
      )}
      {renderTabPanel(activeTab, "decisions-remediation", props.panels.decisionsRemediation, inPipelineBanner)}
      {renderTabPanel(activeTab, "review-package", props.panels.reviewPackage, inPipelineBanner)}
      {renderTabPanel(activeTab, "architecture", props.panels.architecture, inPipelineBanner, {
        alsoHidden: workbenchVisible,
      })}
      {renderTabPanel(
        activeTab,
        "activity",
        panelWithVocabularyRail(
          "activity",
          <PackageActivityAuditTrailVocabularyRail
            runId={props.runId}
            currentSurfaceId="package-activity"
          />,
          props.panels.activity,
        ),
        inPipelineBanner,
      )}
    </div>
  );
}
