"use client";

import { cn } from "@/lib/utils";
import { useMemo, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatFindingsVisibilitySummaryLine } from "@/lib/findings/finding-confidence-filter";
import {
  parseFindingsFilterPanelOpenFromSearch,
  runDetailFindingsFilterDisclosureHrefFromSearch,
} from "@/lib/findings/run-detail-findings-filter-disclosure-url";
import { FindingJobViewToggleBar } from "@/components/findings/FindingJobViewToggleBar";
import { FindingsNaturalLanguageFilter } from "@/components/findings/FindingsNaturalLanguageFilter";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";
import type { FindingJobView } from "@/lib/findings/finding-job-view";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";
import {
  severityBadgeLabel,
  severityKindFromNumericValue,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import {
  countFindingsForToolbarFilter,
  deriveFindingsToolbarSeverityCounts,
  deriveFindingsToolbarStatusCounts,
  deriveOpenRootCauseClusterCount,
  FILTER_OPTIONS,
  type RunDetailFindingsFilterKind,
  type RunDetailFindingsSortKind,
} from "@/components/findings/run-detail-findings-toolbar-presentation";

import { FindingsProvenanceFilters } from "./FindingsProvenanceFilters";
import { FindingsSortChips } from "./FindingsSortChips";

export type {
  RunDetailFindingsFilterKind,
  RunDetailFindingsSortKind,
} from "@/components/findings/run-detail-findings-toolbar-presentation";
export {
  countFindingsForToolbarFilter,
  deriveFindingsToolbarSeverityCounts,
  deriveFindingsToolbarStatusCounts,
  deriveOpenRootCauseClusterCount,
  filterFindingsForToolbar,
  sortFindingsForToolbar,
} from "@/components/findings/run-detail-findings-toolbar-presentation";
export { useRunDetailFindingsToolbarState } from "./use-run-detail-findings-toolbar-state";

export type RunDetailFindingsToolbarLayout = "full" | "compact";

const FILTER_AUTO_EXPAND_THRESHOLD = 5;

export type RunDetailFindingsToolbarProps = {
  readonly findings: readonly QuickDecisionFinding[];
  readonly renderedFindingCount?: number;
  readonly toolbarFilteredCount?: number;
  readonly hiddenByConfidenceCount?: number;
  readonly excludedSummaryLine?: string | null;
  readonly filter: RunDetailFindingsFilterKind;
  readonly onFilterChange: (filter: RunDetailFindingsFilterKind) => void;
  readonly jobView: FindingJobView;
  readonly onJobViewChange: (jobView: FindingJobView) => void;
  readonly ownerFilter: string;
  readonly onOwnerFilterChange: (value: string) => void;
  readonly onClearOwnerFilter?: () => void;
  readonly domainFilter: string;
  readonly onDomainFilterChange: (value: string) => void;
  readonly onClearDomainFilter?: () => void;
  readonly searchQuery: string;
  readonly onSearchQueryChange: (value: string) => void;
  readonly sort: RunDetailFindingsSortKind;
  readonly onSortChange: (sort: RunDetailFindingsSortKind) => void;
  readonly originFilter: FindingOriginFilter;
  readonly onOriginFilterChange: (filter: FindingOriginFilter) => void;
  readonly groundingFilter: FindingGroundingFilter;
  readonly onGroundingFilterChange: (filter: FindingGroundingFilter) => void;
  readonly exportSlot?: React.ReactNode;
  readonly layout?: RunDetailFindingsToolbarLayout;
  readonly packageCommitted?: boolean;
  readonly onNaturalLanguageFilterApply?: (facets: FindingsNaturalLanguageFacets) => void;
};

export function RunDetailFindingsToolbar(props: RunDetailFindingsToolbarProps): React.JSX.Element {
  const layout = props.layout ?? "full";
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const findingsFilterPanelOpenParam = searchParams.get("findingsFilterPanelOpen");
  const urlFilterPanelOpen = parseFindingsFilterPanelOpenFromSearch(findingsFilterPanelOpenParam);
  const filterPanelOpen = urlFilterPanelOpen ?? props.findings.length > FILTER_AUTO_EXPAND_THRESHOLD;

  const setFilterPanelOpen = useCallback(
    (open: boolean) => {
      router.replace(runDetailFindingsFilterDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );
  const severityCounts = useMemo(
    () => deriveFindingsToolbarSeverityCounts(props.findings),
    [props.findings],
  );

  const statusCounts = useMemo(
    () => deriveFindingsToolbarStatusCounts(props.findings),
    [props.findings],
  );
  const rootCauseClusterCount = useMemo(
    () => deriveOpenRootCauseClusterCount(props.findings),
    [props.findings],
  );
  const visibilitySummaryLine = formatFindingsVisibilitySummaryLine(
    props.renderedFindingCount ?? props.findings.length,
    props.toolbarFilteredCount ?? props.findings.length,
    props.hiddenByConfidenceCount ?? 0,
  );
  const jobViewToggle = (
    <FindingJobViewToggleBar
      jobView={props.jobView}
      onJobViewChange={props.onJobViewChange}
      reviewFindings={props.findings}
    />
  );

  const filterChips = FILTER_OPTIONS.map((option) => {
    const active = props.filter === option.id;
    const count = countFindingsForToolbarFilter(props.findings, option.id, props.jobView);

    return (
      <button
        key={option.id}
        type="button"
        className={cn(
          "rounded-md px-2 py-1 text-sm",
          active
            ? "bg-neutral-900 font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900"
            : "bg-white text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-100 dark:bg-neutral-950 dark:text-neutral-200 dark:ring-neutral-700",
        )}
        aria-pressed={active}
        onClick={() => {
          props.onFilterChange(option.id);
        }}
      >
        {option.label} ({count})
      </button>
    );
  });

  if (layout === "compact") {
    const suppressZeroStatusChips = props.packageCommitted === false;
    const severityRollup = (
      [
        { key: "critical" as const, count: severityCounts.critical, severityValue: 3 },
        { key: "high" as const, count: severityCounts.high, severityValue: 2 },
        { key: "medium" as const, count: severityCounts.medium, severityValue: 1 },
        { key: "low" as const, count: severityCounts.low, severityValue: 0 },
      ] as const
    ).filter((entry) => entry.count > 0);

    return (
      <div
        className="mb-4 space-y-3 rounded-md border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
        data-testid="run-detail-findings-toolbar"
      >
        <div className="flex flex-wrap items-center gap-2" data-testid="run-detail-findings-severity-rollup">
          {severityRollup.map((entry) => {
            const label = severityBadgeLabel(entry.severityValue);

            return (
              <SeverityTag
                key={entry.key}
                severity={label}
                kind={severityKindFromNumericValue(entry.severityValue)}
                label={`${label} ${entry.count}`}
              />
            );
          })}
          {(!suppressZeroStatusChips || statusCounts.unresolved > 0) && statusCounts.unresolved > 0 ? (
            <StatusTag kind="needs-attention" label={`Unresolved ${statusCounts.unresolved}`} />
          ) : null}
          {(!suppressZeroStatusChips || statusCounts.awaitingDecision > 0) && statusCounts.awaitingDecision > 0 ? (
            <StatusTag kind="neutral" label={`Awaiting decision ${statusCounts.awaitingDecision}`} />
          ) : null}
          {(!suppressZeroStatusChips || statusCounts.resolved > 0) && statusCounts.resolved > 0 ? (
            <StatusTag kind="approved" label={`Resolved ${statusCounts.resolved}`} />
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[12rem] flex-1">
            <Label htmlFor="findings-search" className={OPERATOR_TYPOGRAPHY.helper}>
              Search findings
            </Label>
            <Input
              id="findings-search"
              value={props.searchQuery}
              onChange={(event) => {
                props.onSearchQueryChange(event.target.value);
              }}
              placeholder="Search title or recommendation"
              className="mt-1 h-9"
            />
          </div>
          <div className="min-w-[12rem]">
            <FindingsSortChips sort={props.sort} />
          </div>
        </div>

        {props.excludedSummaryLine !== null && props.excludedSummaryLine !== undefined ? (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="run-detail-findings-excluded-summary"
          >
            {props.excludedSummaryLine}
          </p>
        ) : null}
        {visibilitySummaryLine !== null ? (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="run-detail-findings-visibility-summary"
          >
            {visibilitySummaryLine}
          </p>
        ) : null}
        {rootCauseClusterCount > 0 ? (
          <p
            className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="run-detail-findings-root-cause-clusters"
          >
            {rootCauseClusterCount} root-cause cluster{rootCauseClusterCount === 1 ? "" : "s"} group related findings
            before triage.
          </p>
        ) : null}

        {jobViewToggle}

        <details
          className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
          data-workspace-disclosure
          open={filterPanelOpen}
          onToggle={(event) => {
            setFilterPanelOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className={cn("cursor-pointer font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            Filter findings
          </summary>
          <div className="mt-3 space-y-3">
            <div className="flex flex-wrap gap-1" role="group" aria-label="Finding severity and status filters">
              {filterChips}
            </div>
      {props.onNaturalLanguageFilterApply !== undefined ? (
        <div data-testid="findings-nl-filter-toolbar">
          <FindingsNaturalLanguageFilter onApply={props.onNaturalLanguageFilterApply} />
        </div>
      ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <FindingsProvenanceFilters
                idPrefix="findings-compact"
                originFilter={props.originFilter}
                groundingFilter={props.groundingFilter}
              />
              <div>
                <Label htmlFor="findings-owner-filter" className={OPERATOR_TYPOGRAPHY.helper}>
                  Owner filter
                </Label>
                <Input
                  id="findings-owner-filter"
                  value={props.ownerFilter}
                  onChange={(event) => {
                    props.onOwnerFilterChange(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape" && props.ownerFilter.trim().length > 0) {
                      event.preventDefault();
                      props.onClearOwnerFilter?.();
                    }
                  }}
                  placeholder="Owner"
                  className="mt-1 h-9"
                />
              </div>
              <div>
                <Label htmlFor="findings-domain-filter" className={OPERATOR_TYPOGRAPHY.helper}>
                  Domain or category
                </Label>
                <Input
                  id="findings-domain-filter"
                  value={props.domainFilter}
                  onChange={(event) => {
                    props.onDomainFilterChange(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape" && props.domainFilter.trim().length > 0) {
                      event.preventDefault();
                      props.onClearDomainFilter?.();
                    }
                  }}
                  placeholder="Policy or category"
                  className="mt-1 h-9"
                />
              </div>
            </div>
          </div>
        </details>

        {props.exportSlot !== null && props.exportSlot !== undefined ? (
          <div className="border-t border-neutral-200 pt-3 dark:border-neutral-700">{props.exportSlot}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div
      className="mb-4 space-y-3 rounded-md border border-neutral-200 bg-neutral-50/70 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
      data-testid="run-detail-findings-toolbar"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Severity:
        </span>
        <span className="tabular-nums">Critical {severityCounts.critical}</span>
        <span className="tabular-nums">High {severityCounts.high}</span>
        <span className="tabular-nums">Medium {severityCounts.medium}</span>
        <span className="tabular-nums">Low {severityCounts.low}</span>
        <span className="mx-1 text-neutral-300 dark:text-neutral-700">|</span>
        <span className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Status:
        </span>
        <span className="tabular-nums">Unresolved {statusCounts.unresolved}</span>
        <span className="tabular-nums">Awaiting decision {statusCounts.awaitingDecision}</span>
        <span className="tabular-nums">Resolved {statusCounts.resolved}</span>
      </div>
      {visibilitySummaryLine !== null ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-findings-visibility-summary"
        >
          {visibilitySummaryLine}
        </p>
      ) : null}
      {rootCauseClusterCount > 0 ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="run-detail-findings-root-cause-clusters"
        >
          {rootCauseClusterCount} root-cause cluster{rootCauseClusterCount === 1 ? "" : "s"} group related findings
          before triage.
        </p>
      ) : null}
      {jobViewToggle}
      <details
        className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
        data-workspace-disclosure
        open={filterPanelOpen}
        onToggle={(event) => {
          setFilterPanelOpen((event.currentTarget as HTMLDetailsElement).open);
        }}
      >
        <summary className={cn("cursor-pointer font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          Filter findings
        </summary>
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-1" role="group" aria-label="Finding severity and status filters">
            {filterChips}
          </div>
          {props.onNaturalLanguageFilterApply !== undefined ? (
            <div data-testid="findings-nl-filter-toolbar">
              <FindingsNaturalLanguageFilter onApply={props.onNaturalLanguageFilterApply} />
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FindingsProvenanceFilters
              idPrefix="findings"
              originFilter={props.originFilter}
              groundingFilter={props.groundingFilter}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <Label htmlFor="findings-owner-filter" className={OPERATOR_TYPOGRAPHY.helper}>
                Owner filter
              </Label>
              <Input
                id="findings-owner-filter"
                value={props.ownerFilter}
                onChange={(event) => {
                  props.onOwnerFilterChange(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && props.ownerFilter.trim().length > 0) {
                    event.preventDefault();
                    props.onClearOwnerFilter?.();
                  }
                }}
                placeholder="Owner"
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label htmlFor="findings-domain-filter" className={OPERATOR_TYPOGRAPHY.helper}>
                Domain or category
              </Label>
              <Input
                id="findings-domain-filter"
                value={props.domainFilter}
                onChange={(event) => {
                  props.onDomainFilterChange(event.target.value);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Escape" && props.domainFilter.trim().length > 0) {
                    event.preventDefault();
                    props.onClearDomainFilter?.();
                  }
                }}
                placeholder="Policy or category"
                className="mt-1 h-9"
              />
            </div>
            <div>
              <Label htmlFor="findings-search" className={OPERATOR_TYPOGRAPHY.helper}>
                Search findings
              </Label>
              <Input
                id="findings-search"
                value={props.searchQuery}
                onChange={(event) => {
                  props.onSearchQueryChange(event.target.value);
                }}
                placeholder="Search title or recommendation"
                className="mt-1 h-9"
              />
            </div>
            <FindingsSortChips sort={props.sort} />
          </div>
        </div>
      </details>
      {props.exportSlot !== null && props.exportSlot !== undefined ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
          <span className={cn("font-medium text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Export
          </span>
          {props.exportSlot}
        </div>
      ) : null}
    </div>
  );
}

export function defaultWorkspaceExpandedForFinding(finding: QuickDecisionFinding): boolean {
  return finding.severityValue >= 2;
}

export function workspaceFindingAreaLabel(finding: QuickDecisionFinding): string {
  const policyRule = finding.policyRuleId?.trim() ?? "";

  if (policyRule.length > 0) {
    return policyRule;
  }

  return severityBadgeLabel(finding.severityValue);
}
