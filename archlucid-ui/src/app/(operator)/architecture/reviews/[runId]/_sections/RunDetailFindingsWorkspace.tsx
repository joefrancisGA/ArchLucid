"use client";

import { useState } from "react";
import type { ReactElement } from "react";

import { FindingsItsmExportToolbar } from "@/components/FindingsItsmExportToolbar";
import { QuickDecisionSummary } from "@/components/QuickDecisionSummary";
import {
  RunDetailFindingsToolbar,
  filterFindingsForToolbar,
  sortFindingsForToolbar,
  useRunDetailFindingsToolbarState,
} from "@/components/findings/RunDetailFindingsToolbar";
import { applyFindingsConfidenceVisibility } from "@/lib/finding-confidence-filter";
import { reviewFindingsGovernanceQueuePresentation } from "@/lib/metric-count-presentation";
import { CanonicalObjectSecondaryViewStrip } from "@/components/usability/CanonicalObjectSecondaryViewStrip";
import { SelfDescribingMetricCount } from "@/components/usability/SelfDescribingMetricCount";
import { buildCanonicalObjectSecondaryView } from "@/lib/canonical-object-home-registry";
import {
  buildWorkspaceCardRenderedFindings,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";

export type RunDetailFindingsWorkspaceProps = {
  readonly runId: string;
  readonly findings: readonly QuickDecisionFinding[];
  readonly buyerPolishedShell?: boolean;
  readonly headlineFindingCount?: number | null;
  readonly headlineWarningCount?: number | null;
  readonly usingExplanationFallback?: boolean;
  readonly manifestRuleSetId?: string | null;
  readonly manifestRuleSetVersion?: string | null;
  readonly providerNeutralWorkItems?: boolean;
  readonly architectureWorkItemContext?: {
    readonly architectureName: string;
    readonly architectureOverview: string;
    readonly ownerLabel: string | null;
  } | null;
  readonly packageCommitted?: boolean;
};

/** Findings list with workspace toolbar filters for the review detail page. */
export function RunDetailFindingsWorkspace(props: RunDetailFindingsWorkspaceProps): ReactElement {
  const toolbar = useRunDetailFindingsToolbarState();
  const [showLowConfidence, setShowLowConfidence] = useState(false);
  const [showAdvisory, setShowAdvisory] = useState(false);
  const toolbarScopedFindings = filterFindingsForToolbar(
    props.findings,
    toolbar.filter,
    toolbar.ownerFilter,
    toolbar.domainFilter,
    toolbar.searchQuery,
  );
  const { visibleFindings: confidenceVisibleScoped, hiddenByConfidenceCount } = applyFindingsConfidenceVisibility(
    toolbarScopedFindings,
    showLowConfidence,
  );
  const listFindings = sortFindingsForToolbar(confidenceVisibleScoped, toolbar.sort);
  const { visibleFindings: confidenceGatedForCounts } = applyFindingsConfidenceVisibility(
    filterFindingsForToolbar(
      props.findings,
      "all",
      toolbar.ownerFilter,
      toolbar.domainFilter,
      toolbar.searchQuery,
    ),
    showLowConfidence,
  );
  const exportFindings = buildWorkspaceCardRenderedFindings(listFindings, {
    showAdvisory,
    showMuted: false,
  });
  const firstListedFinding = listFindings[0];
  const findingsSecondaryViewPresentation =
    firstListedFinding !== undefined
      ? buildCanonicalObjectSecondaryView("finding", "reviewPackageFindingsTab", {
          runId: props.runId,
          findingId: firstListedFinding.findingId,
        })
      : null;

  return (
    <div data-testid="run-detail-findings-workspace">
      {findingsSecondaryViewPresentation !== null ? (
        <CanonicalObjectSecondaryViewStrip
          presentation={findingsSecondaryViewPresentation}
          testId="review-findings-secondary-view-strip"
          className="mb-3"
        />
      ) : null}
      {props.headlineFindingCount !== null && props.headlineFindingCount !== undefined ? (
        <div className="mb-3" data-testid="run-detail-findings-metric-count">
          <SelfDescribingMetricCount
            presentation={reviewFindingsGovernanceQueuePresentation(
              props.runId,
              props.headlineFindingCount,
            )}
            testId="run-detail-findings-governance-metric"
          />
        </div>
      ) : null}
      <RunDetailFindingsToolbar
        findings={confidenceGatedForCounts}
        renderedFindingCount={listFindings.length}
        toolbarFilteredCount={toolbarScopedFindings.length}
        hiddenByConfidenceCount={hiddenByConfidenceCount}
        filter={toolbar.filter}
        onFilterChange={toolbar.setFilter}
        ownerFilter={toolbar.ownerFilter}
        onOwnerFilterChange={toolbar.setOwnerFilter}
        domainFilter={toolbar.domainFilter}
        onDomainFilterChange={toolbar.setDomainFilter}
        searchQuery={toolbar.searchQuery}
        onSearchQueryChange={toolbar.setSearchQuery}
        sort={toolbar.sort}
        onSortChange={toolbar.setSort}
        exportSlot={
          <FindingsItsmExportToolbar
            runId={props.runId}
            findings={exportFindings}
            totalFindingCount={listFindings.length}
            compact
          />
        }
      />
      <QuickDecisionSummary
        runId={props.runId}
        findings={listFindings}
        buyerPolishedShell={props.buyerPolishedShell}
        headlineFindingCount={props.headlineFindingCount}
        headlineWarningCount={props.headlineWarningCount}
        usingExplanationFallback={props.usingExplanationFallback}
        manifestRuleSetId={props.manifestRuleSetId}
        manifestRuleSetVersion={props.manifestRuleSetVersion}
        workspaceCardMode
        defaultExpandLowSeverity={false}
        providerNeutralWorkItems={props.providerNeutralWorkItems}
        architectureWorkItemContext={props.architectureWorkItemContext}
        packageCommitted={props.packageCommitted}
        confidenceVisibility={{
          showLowConfidence,
          onShowLowConfidenceChange: setShowLowConfidence,
          hiddenByConfidenceCount,
          managedExternally: true,
        }}
        advisoryVisibility={{
          showAdvisory,
          onShowAdvisoryChange: setShowAdvisory,
          managedExternally: true,
        }}
      />
    </div>
  );
}
