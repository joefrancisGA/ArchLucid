"use client";

import type { ReactElement } from "react";

import { FindingsItsmExportToolbar } from "@/components/FindingsItsmExportToolbar";
import { QuickDecisionSummary } from "@/components/QuickDecisionSummary";
import {
  RunDetailFindingsToolbar,
  filterFindingsForToolbar,
  sortFindingsForToolbar,
  useRunDetailFindingsToolbarState,
} from "@/components/findings/RunDetailFindingsToolbar";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

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
};

/** Findings list with workspace toolbar filters for the review detail page. */
export function RunDetailFindingsWorkspace(props: RunDetailFindingsWorkspaceProps): ReactElement {
  const toolbar = useRunDetailFindingsToolbarState();
  const filtered = sortFindingsForToolbar(
    filterFindingsForToolbar(
      props.findings,
      toolbar.filter,
      toolbar.ownerFilter,
      toolbar.domainFilter,
      toolbar.searchQuery,
    ),
    toolbar.sort,
  );

  return (
    <div data-testid="run-detail-findings-workspace">
      <RunDetailFindingsToolbar
        findings={props.findings}
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
          <FindingsItsmExportToolbar runId={props.runId} findings={props.findings} compact />
        }
      />
      <QuickDecisionSummary
        runId={props.runId}
        findings={filtered}
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
      />
    </div>
  );
}
