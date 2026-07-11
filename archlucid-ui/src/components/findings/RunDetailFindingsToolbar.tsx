"use client";

import { cn } from "@/lib/utils";
import { useMemo, useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  humanReviewStatusDisplay,
  severityBadgeLabel,
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

export type RunDetailFindingsSortKind = "severity-desc" | "severity-asc" | "title-asc";

export type RunDetailFindingsToolbarProps = {
  readonly findings: readonly QuickDecisionFinding[];
  readonly filter: RunDetailFindingsFilterKind;
  readonly onFilterChange: (filter: RunDetailFindingsFilterKind) => void;
  readonly ownerFilter: string;
  readonly onOwnerFilterChange: (value: string) => void;
  readonly domainFilter: string;
  readonly onDomainFilterChange: (value: string) => void;
  readonly searchQuery: string;
  readonly onSearchQueryChange: (value: string) => void;
  readonly sort: RunDetailFindingsSortKind;
  readonly onSortChange: (sort: RunDetailFindingsSortKind) => void;
};

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
): number {
  return filterFindingsForToolbar(findings, filter, "", "", "").length;
}

export function filterFindingsForToolbar(
  findings: readonly QuickDecisionFinding[],
  filter: RunDetailFindingsFilterKind,
  ownerFilter: string,
  domainFilter: string,
  searchQuery: string,
): QuickDecisionFinding[] {
  const ownerNeedle = ownerFilter.trim().toLowerCase();
  const domainNeedle = domainFilter.trim().toLowerCase();
  const searchNeedle = searchQuery.trim().toLowerCase();

  return findings.filter((finding) => {
    if (finding.isMuted) {
      return false;
    }

    if (filter === "critical" && finding.severityValue < 3) {
      return false;
    }

    if (filter === "high" && finding.severityValue !== 2) {
      return false;
    }

    if (filter === "medium" && finding.severityValue !== 1) {
      return false;
    }

    if (filter === "low" && finding.severityValue > 0) {
      return false;
    }

    const reviewStatus = humanReviewStatusDisplay(finding.humanReviewStatus);

    if (filter === "awaiting-decision" && reviewStatus?.label !== "Pending review") {
      return false;
    }

    if (filter === "resolved" && reviewStatus?.label !== "Approved" && reviewStatus?.label !== "Overridden") {
      return false;
    }

    if (filter === "unresolved" && (reviewStatus?.label === "Approved" || reviewStatus?.label === "Overridden")) {
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

    return true;
  });
}

export function sortFindingsForToolbar(
  findings: readonly QuickDecisionFinding[],
  sort: RunDetailFindingsSortKind,
): QuickDecisionFinding[] {
  const rows = [...findings];

  rows.sort((a, b) => {
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
  readonly open: number;
  readonly assigned: number;
  readonly resolved: number;
} {
  let open = 0;
  let assigned = 0;
  let resolved = 0;

  for (const finding of findings) {
    if (finding.isMuted) {
      continue;
    }

    const status = humanReviewStatusDisplay(finding.humanReviewStatus);
    const owner = (finding.assignedToUserId ?? "").trim();

    if (status?.label === "Approved" || status?.label === "Overridden") {
      resolved += 1;
    } else if (owner.length > 0) {
      assigned += 1;
    } else {
      open += 1;
    }
  }

  return { open, assigned, resolved };
}

export function RunDetailFindingsToolbar(props: RunDetailFindingsToolbarProps): React.JSX.Element {
  const severityCounts = useMemo(() => {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };

    for (const finding of props.findings) {
      if (finding.isMuted) {
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
  }, [props.findings]);

  const statusCounts = useMemo(
    () => deriveFindingsToolbarStatusCounts(props.findings),
    [props.findings],
  );

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
        <span className="tabular-nums">Open {statusCounts.open}</span>
        <span className="tabular-nums">Assigned {statusCounts.assigned}</span>
        <span className="tabular-nums">Resolved {statusCounts.resolved}</span>
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label="Finding severity and status filters">
        {FILTER_OPTIONS.map((option) => {
          const active = props.filter === option.id;
          const count = countFindingsForToolbarFilter(props.findings, option.id);

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
        })}
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
        <div>
          <Label htmlFor="findings-sort" className={OPERATOR_TYPOGRAPHY.helper}>
            Sort
          </Label>
          <select
            id="findings-sort"
            className="mt-1 h-9 w-full rounded-md border border-neutral-200 bg-white px-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            value={props.sort}
            onChange={(event) => {
              props.onSortChange(event.target.value as RunDetailFindingsSortKind);
            }}
          >
            <option value="severity-desc">Severity (high first)</option>
            <option value="severity-asc">Severity (low first)</option>
            <option value="title-asc">Title (A–Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export function useRunDetailFindingsToolbarState(): {
  readonly filter: RunDetailFindingsFilterKind;
  readonly setFilter: (filter: RunDetailFindingsFilterKind) => void;
  readonly ownerFilter: string;
  readonly setOwnerFilter: (value: string) => void;
  readonly domainFilter: string;
  readonly setDomainFilter: (value: string) => void;
  readonly searchQuery: string;
  readonly setSearchQuery: (value: string) => void;
  readonly sort: RunDetailFindingsSortKind;
  readonly setSort: (sort: RunDetailFindingsSortKind) => void;
} {
  const [filter, setFilter] = useState<RunDetailFindingsFilterKind>("all");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [domainFilter, setDomainFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<RunDetailFindingsSortKind>("severity-desc");

  return {
    filter,
    setFilter,
    ownerFilter,
    setOwnerFilter,
    domainFilter,
    setDomainFilter,
    searchQuery,
    setSearchQuery,
    sort,
    setSort,
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
