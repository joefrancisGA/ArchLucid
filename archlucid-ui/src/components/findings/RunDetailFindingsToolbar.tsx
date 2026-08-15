"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState, useCallback } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { listOpenRootCauseClusters } from "@/lib/review-quality/compare-quality-delta";
import { formatFindingsVisibilitySummaryLine } from "@/lib/findings/finding-confidence-filter";
import { FindingJobViewToggleBar } from "@/components/findings/FindingJobViewToggleBar";
import { FindingsNaturalLanguageFilter } from "@/components/findings/FindingsNaturalLanguageFilter";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";
import {
  DEFAULT_FINDING_JOB_VIEW,
  filterReviewFindingsForJobView,
  isReviewFindingDispositionClosed,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";
import { writeFindingJobViewToUrl } from "@/lib/findings/review-findings-job-view-url";
import {
  compareFindingsByTrustThenSeverity,
  reviewFindingMatchesProvenanceFilter,
  type FindingGroundingFilter,
  type FindingOriginFilter,
} from "@/lib/findings/finding-trust-triage";
import {
  humanReviewStatusDisplay,
  severityBadgeLabel,
  severityKindFromNumericValue,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";

export type RunDetailFindingsFilterKind =
  | "all"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "unresolved"
  | "awaiting-decision"
  | "resolved";

export type RunDetailFindingsSortKind =
  | "trust-then-severity"
  | "severity-desc"
  | "severity-asc"
  | "title-asc";

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
  readonly domainFilter: string;
  readonly onDomainFilterChange: (value: string) => void;
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

const ORIGIN_FILTER_OPTIONS: readonly { id: FindingOriginFilter; label: string }[] = [
  { id: "all", label: "All origins" },
  { id: "Deterministic rule", label: "Deterministic rule" },
  { id: "Deterministic fallback", label: "Deterministic fallback" },
  { id: "AI-generated", label: "AI-generated" },
  { id: "Simulated", label: "Simulated" },
];

const GROUNDING_FILTER_OPTIONS: readonly { id: FindingGroundingFilter; label: string }[] = [
  { id: "all", label: "All grounding" },
  { id: "Evidence-backed", label: "Evidence-backed" },
  { id: "Estimated", label: "Estimated" },
  { id: "Ungrounded", label: "Ungrounded" },
  { id: "Degraded", label: "Degraded" },
  { id: "Not applicable", label: "Not applicable" },
];

function FindingsSortSelect(props: {
  readonly id: string;
  readonly sort: RunDetailFindingsSortKind;
  readonly onSortChange: (sort: RunDetailFindingsSortKind) => void;
}): React.JSX.Element {
  return (
    <div>
      <Label htmlFor={props.id} className={OPERATOR_TYPOGRAPHY.helper}>
        Sort
      </Label>
      <select
        id={props.id}
        className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
        value={props.sort}
        onChange={(event) => {
          props.onSortChange(event.target.value as RunDetailFindingsSortKind);
        }}
      >
        <option value="trust-then-severity">Trust then severity</option>
        <option value="severity-desc">Severity (high first)</option>
        <option value="severity-asc">Severity (low first)</option>
        <option value="title-asc">Title (AΓÇôZ)</option>
      </select>
    </div>
  );
}

function FindingsProvenanceFilters(props: {
  readonly idPrefix: string;
  readonly originFilter: FindingOriginFilter;
  readonly onOriginFilterChange: (filter: FindingOriginFilter) => void;
  readonly groundingFilter: FindingGroundingFilter;
  readonly onGroundingFilterChange: (filter: FindingGroundingFilter) => void;
}): React.JSX.Element {
  return (
    <>
      <div>
        <Label htmlFor={`${props.idPrefix}-origin`} className={OPERATOR_TYPOGRAPHY.helper}>
          Origin
        </Label>
        <select
          id={`${props.idPrefix}-origin`}
          className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          value={props.originFilter}
          onChange={(event) => {
            props.onOriginFilterChange(event.target.value as FindingOriginFilter);
          }}
          data-testid={`${props.idPrefix}-origin`}
        >
          {ORIGIN_FILTER_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`${props.idPrefix}-grounding`} className={OPERATOR_TYPOGRAPHY.helper}>
          Grounding
        </Label>
        <select
          id={`${props.idPrefix}-grounding`}
          className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
          value={props.groundingFilter}
          onChange={(event) => {
            props.onGroundingFilterChange(event.target.value as FindingGroundingFilter);
          }}
          data-testid={`${props.idPrefix}-grounding`}
        >
          {GROUNDING_FILTER_OPTIONS.map((option) => (
            <option key={option.id} value={option.id}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}

const FILTER_OPTIONS: readonly { id: RunDetailFindingsFilterKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
  { id: "unresolved", label: "Unresolved" },
  { id: "awaiting-decision", label: "Awaiting decision" },
  { id: "resolved", label: "Resolved" },
];

export function countFindingsForToolbarFilter(
  findings: readonly QuickDecisionFinding[],
  filter: RunDetailFindingsFilterKind,
  jobView: FindingJobView = DEFAULT_FINDING_JOB_VIEW,
): number {
  return filterFindingsForToolbar(findings, filter, "", "", "", jobView).length;
}

export function filterFindingsForToolbar(
  findings: readonly QuickDecisionFinding[],
  filter: RunDetailFindingsFilterKind,
  ownerFilter: string,
  domainFilter: string,
  searchQuery: string,
  jobView: FindingJobView = DEFAULT_FINDING_JOB_VIEW,
  originFilter: FindingOriginFilter = "all",
  groundingFilter: FindingGroundingFilter = "all",
): QuickDecisionFinding[] {
  const ownerNeedle = ownerFilter.trim().toLowerCase();
  const domainNeedle = domainFilter.trim().toLowerCase();
  const searchNeedle = searchQuery.trim().toLowerCase();
  const jobScopedFindings = filterReviewFindingsForJobView(findings, jobView);

  return jobScopedFindings.filter((finding) => {
    if (finding.isMuted) {
      return false;
    }

    if (filter === "critical" && (finding.severityValue < 3 || isReviewFindingDispositionClosed(finding))) {
      return false;
    }

    if (filter === "high" && (finding.severityValue !== 2 || isReviewFindingDispositionClosed(finding))) {
      return false;
    }

    if (filter === "medium" && (finding.severityValue !== 1 || isReviewFindingDispositionClosed(finding))) {
      return false;
    }

    if (filter === "low" && (finding.severityValue > 0 || isReviewFindingDispositionClosed(finding))) {
      return false;
    }

    const reviewStatus = humanReviewStatusDisplay(finding.humanReviewStatus);

    if (filter === "awaiting-decision" && (reviewStatus?.label !== "Pending review" || isReviewFindingDispositionClosed(finding))) {
      return false;
    }

    if (filter === "resolved" && !isReviewFindingDispositionClosed(finding)) {
      return false;
    }

    if (filter === "unresolved" && isReviewFindingDispositionClosed(finding)) {
      return false;
    }

    if (ownerNeedle.length > 0) {
      const owner = (finding.assignedToUserId ?? "").toLowerCase();

      if (!owner.includes(ownerNeedle)) {
        return false;
      }
    }

    if (domainNeedle.length > 0) {
      const domain = (finding.policyRuleId ?? finding.title).toLowerCase();

      if (!domain.includes(domainNeedle)) {
        return false;
      }
    }

    if (searchNeedle.length > 0) {
      const haystack = `${finding.title} ${finding.recommendation}`.toLowerCase();

      if (!haystack.includes(searchNeedle)) {
        return false;
      }
    }

    if (!reviewFindingMatchesProvenanceFilter(finding, originFilter, groundingFilter)) {
      return false;
    }

    return true;
  });
}

export function sortFindingsForToolbar(
  findings: readonly QuickDecisionFinding[],
  sort: RunDetailFindingsSortKind,
): QuickDecisionFinding[] {
  const rows = [...findings];

  rows.sort((a, b) => {
    if (sort === "trust-then-severity") {
      return compareFindingsByTrustThenSeverity(a, b);
    }

    if (sort === "severity-desc") {
      return b.severityValue - a.severityValue || a.findingOrder - b.findingOrder;
    }

    if (sort === "severity-asc") {
      return a.severityValue - b.severityValue || a.findingOrder - b.findingOrder;
    }

    return a.title.localeCompare(b.title);
  });

  return rows;
}

export function deriveFindingsToolbarStatusCounts(findings: readonly QuickDecisionFinding[]): {
  readonly unresolved: number;
  readonly awaitingDecision: number;
  readonly resolved: number;
} {
  let unresolved = 0;
  let awaitingDecision = 0;
  let resolved = 0;

  for (const finding of findings) {
    if (finding.isMuted) {
      continue;
    }

    const status = humanReviewStatusDisplay(finding.humanReviewStatus);

    if (isReviewFindingDispositionClosed(finding)) {
      resolved += 1;
    } else if (status?.label === "Pending review") {
      awaitingDecision += 1;
    } else {
      unresolved += 1;
    }
  }

  return { unresolved, awaitingDecision, resolved };
}

export function deriveFindingsToolbarSeverityCounts(findings: readonly QuickDecisionFinding[]): {
  readonly critical: number;
  readonly high: number;
  readonly medium: number;
  readonly low: number;
} {
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };

  for (const finding of findings) {
    if (finding.isMuted || isReviewFindingDispositionClosed(finding)) {
      continue;
    }

    if (finding.severityValue >= 3) {
      counts.critical += 1;
    } else if (finding.severityValue === 2) {
      counts.high += 1;
    } else if (finding.severityValue === 1) {
      counts.medium += 1;
    } else {
      counts.low += 1;
    }
  }

  return counts;
}

export function deriveOpenRootCauseClusterCount(findings: readonly QuickDecisionFinding[]): number {
  return listOpenRootCauseClusters(findings).length;
}

export function RunDetailFindingsToolbar(props: RunDetailFindingsToolbarProps): React.JSX.Element {
  const layout = props.layout ?? "full";
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
            <FindingsSortSelect id="findings-sort" sort={props.sort} onSortChange={props.onSortChange} />
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
          open={props.findings.length > FILTER_AUTO_EXPAND_THRESHOLD}
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
                onOriginFilterChange={props.onOriginFilterChange}
                groundingFilter={props.groundingFilter}
                onGroundingFilterChange={props.onGroundingFilterChange}
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
          onOriginFilterChange={props.onOriginFilterChange}
          groundingFilter={props.groundingFilter}
          onGroundingFilterChange={props.onGroundingFilterChange}
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
        <FindingsSortSelect id="findings-sort" sort={props.sort} onSortChange={props.onSortChange} />
      </div>
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

export function useRunDetailFindingsToolbarState(options?: {
  readonly initialJobView?: FindingJobView;
}): {
  readonly filter: RunDetailFindingsFilterKind;
  readonly setFilter: (filter: RunDetailFindingsFilterKind) => void;
  readonly jobView: FindingJobView;
  readonly setJobView: (jobView: FindingJobView) => void;
  readonly ownerFilter: string;
  readonly setOwnerFilter: (value: string) => void;
  readonly domainFilter: string;
  readonly setDomainFilter: (value: string) => void;
  readonly searchQuery: string;
  readonly setSearchQuery: (value: string) => void;
  readonly sort: RunDetailFindingsSortKind;
  readonly setSort: (sort: RunDetailFindingsSortKind) => void;
  readonly originFilter: FindingOriginFilter;
  readonly setOriginFilter: (filter: FindingOriginFilter) => void;
  readonly groundingFilter: FindingGroundingFilter;
  readonly setGroundingFilter: (filter: FindingGroundingFilter) => void;
} {
  const [filter, setFilter] = useState<RunDetailFindingsFilterKind>("all");
  const [jobView, setJobViewState] = useState<FindingJobView>(
    options?.initialJobView ?? DEFAULT_FINDING_JOB_VIEW,
  );
  const setJobView = useCallback((next: FindingJobView): void => {
    setJobViewState(next);
    writeFindingJobViewToUrl(next);
  }, []);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<RunDetailFindingsSortKind>("trust-then-severity");
  const [originFilter, setOriginFilter] = useState<FindingOriginFilter>("all");
  const [groundingFilter, setGroundingFilter] = useState<FindingGroundingFilter>("all");

  return {
    filter,
    setFilter,
    jobView,
    setJobView,
    ownerFilter,
    setOwnerFilter,
    domainFilter,
    setDomainFilter,
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
    originFilter,
    setOriginFilter,
    groundingFilter,
    setGroundingFilter,
  };
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
