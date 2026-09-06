import type { GovernanceFindingQueueRow } from "@/app/(operator)/governance/findings/governance-finding-queue-row";
import { reviewsHubInventoryFilterHref } from "@/app/(operator)/architecture/reviews/_sections/reviews-hub-inventory-filters";
import { OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF } from "@/lib/operator/operator-home-metric-hrefs";
import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";
import {
  matchesGovernanceFindingsRunScope,
  matchesRiskRegisterFilter,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";

export type MetricCountScopeKind =
  | "workspace"
  | "this-review"
  | "findings-tab"
  | "governance-filter"
  | "reviews-inventory";

export type ReviewsInventoryFilterScope = "Active" | "finalized";

export type MetricCountScopeDimension = {
  readonly kind: MetricCountScopeKind;
  readonly filter?: RiskRegisterFilter;
  readonly reviewsFilter?: ReviewsInventoryFilterScope;
};

export type MetricCountPresentation = {
  readonly count: number;
  readonly noun: string;
  readonly dimensions: readonly MetricCountScopeDimension[];
  readonly href: string;
};

const SCOPE_LABELS: Record<MetricCountScopeKind, string> = {
  workspace: "this workspace",
  "this-review": "this review",
  "findings-tab": "findings tab",
  "governance-filter": "findings queue",
  "reviews-inventory": "reviews list",
};

const REVIEWS_INVENTORY_SCOPE_LABELS: Record<ReviewsInventoryFilterScope, string> = {
  Active: "active",
  finalized: "finalized",
};

const FILTER_SCOPE_LABELS: Partial<Record<RiskRegisterFilter, string>> = {
  open: "open",
  stale: "stale",
  "expiring-soon": "expiring soon",
  "high-severity": "high severity",
  "critical-error": "critical and error",
  "needs-decision": "needs decision",
  "remediated-recent": "remediated (30 days)",
  all: "all rows",
};

export function formatMetricCountScopeLabel(dimensions: readonly MetricCountScopeDimension[]): string {
  const parts = dimensions.map((dimension) => {
    if (dimension.kind === "governance-filter" && dimension.filter !== undefined) {
      return FILTER_SCOPE_LABELS[dimension.filter] ?? dimension.filter;
    }

    if (dimension.kind === "reviews-inventory" && dimension.reviewsFilter !== undefined) {
      return REVIEWS_INVENTORY_SCOPE_LABELS[dimension.reviewsFilter] ?? dimension.reviewsFilter;
    }

    return SCOPE_LABELS[dimension.kind];
  });

  return parts.join(" · ");
}

export function formatMetricCountHeadline(presentation: MetricCountPresentation): string {
  const scope = formatMetricCountScopeLabel(presentation.dimensions);

  if (scope.length === 0) {
    return `${presentation.count} ${presentation.noun}`;
  }

  return `${presentation.count} ${presentation.noun} · ${scope}`;
}

export function buildGovernanceFindingsQueueHref(input?: {
  readonly runId?: string | null;
  readonly filter?: RiskRegisterFilter;
}): string {
  const params = new URLSearchParams();

  if (input?.runId !== null && input?.runId !== undefined && input.runId.trim().length > 0) {
    params.set("runId", input.runId.trim());
  }

  if (input?.filter !== undefined && input.filter !== "all") {
    params.set("filter", input.filter);
  }

  const query = params.toString();

  return query.length > 0 ? `/governance/findings?${query}` : "/governance/findings";
}

export function buildReviewDetailFindingsTabHref(runId: string): string {
  const trimmedRunId = runId.trim();
  const params = new URLSearchParams({ reviewTab: "findings" });

  return `/architecture/reviews/${encodeURIComponent(trimmedRunId)}?${params.toString()}`;
}

export function buildArchitectureClarificationsTabHref(runId: string): string {
  return buildReviewWorkspaceTabHref(runId.trim(), "decisions-remediation");
}

export function architectureOpenClarificationsPresentation(
  runId: string,
  count: number,
): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "open clarification" : "open clarifications",
    dimensions: [{ kind: "this-review" }],
    href: buildArchitectureClarificationsTabHref(runId),
  };
}

export function reviewFindingsCountPresentation(runId: string, count: number): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "finding" : "findings",
    dimensions: [{ kind: "this-review" }, { kind: "findings-tab" }],
    href: buildReviewDetailFindingsTabHref(runId),
  };
}

export function architectureAssessmentFindingsPresentation(
  runId: string,
  count: number,
): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "assessment finding" : "assessment findings",
    dimensions: [{ kind: "this-review" }, { kind: "findings-tab" }],
    href: buildReviewWorkspaceTabHref(runId, "findings"),
  };
}

export function reviewFindingsGovernanceQueuePresentation(
  runId: string,
  count: number,
): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "finding" : "findings",
    dimensions: [{ kind: "this-review" }, { kind: "governance-filter", filter: "all" }],
    href: buildGovernanceFindingsQueueHref({ runId, filter: "all" }),
  };
}

export function workspaceOpenFindingsPresentation(count: number): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "open finding" : "open findings",
    dimensions: [{ kind: "workspace" }, { kind: "governance-filter", filter: "open" }],
    href: buildGovernanceFindingsQueueHref({ filter: "open" }),
  };
}

export function operatorHomeActiveReviewsPresentation(count: number): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "active review" : "active reviews",
    dimensions: [{ kind: "reviews-inventory", reviewsFilter: "Active" }],
    href: reviewsHubInventoryFilterHref("Active"),
  };
}

export function operatorHomeFinalizedPackagesPresentation(count: number): MetricCountPresentation {
  return {
    count,
    noun: count === 1 ? "finalized package" : "finalized packages",
    dimensions: [{ kind: "reviews-inventory", reviewsFilter: "finalized" }],
    href: reviewsHubInventoryFilterHref("finalized"),
  };
}

export function operatorHomeGovernanceWarningsPresentation(
  count: number,
  noun: string,
): MetricCountPresentation {
  return {
    count,
    noun,
    dimensions: [{ kind: "workspace" }, { kind: "reviews-inventory", reviewsFilter: "Active" }],
    href: OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF,
  };
}

export function governanceRegisterMetricPresentation(input: {
  readonly count: number;
  readonly noun: string;
  readonly filter: RiskRegisterFilter;
  readonly runId?: string | null;
}): MetricCountPresentation {
  const scopedRunId = input.runId?.trim() ?? "";

  return {
    count: input.count,
    noun: input.noun,
    dimensions:
      scopedRunId.length > 0
        ? [{ kind: "this-review" }, { kind: "governance-filter", filter: input.filter }]
        : [{ kind: "workspace" }, { kind: "governance-filter", filter: input.filter }],
    href: buildGovernanceFindingsQueueHref({
      runId: scopedRunId.length > 0 ? scopedRunId : null,
      filter: input.filter,
    }),
  };
}

export function countGovernanceFindingRowsForReview(
  rows: readonly GovernanceFindingQueueRow[],
  runId: string,
): number {
  return rows.filter(
    (row) => row.recordKind === "finding" && matchesGovernanceFindingsRunScope(row, runId),
  ).length;
}

export function countGovernanceRowsMatchingFilter(
  rows: readonly GovernanceFindingQueueRow[],
  filter: RiskRegisterFilter,
  runId?: string | null,
): number {
  return rows.filter(
    (row) =>
      matchesGovernanceFindingsRunScope(row, runId) && matchesRiskRegisterFilter(row, filter),
  ).length;
}

/** Golden-path parity: review explanation finding count vs governance finding rows for the same review. */
export function assertReviewFindingsGovernanceParity(input: {
  readonly reviewFindingCount: number;
  readonly rows: readonly GovernanceFindingQueueRow[];
  readonly runId: string;
}): { readonly matches: boolean; readonly governanceFindingCount: number } {
  const governanceFindingCount = countGovernanceFindingRowsForReview(input.rows, input.runId);

  return {
    matches: governanceFindingCount === input.reviewFindingCount,
    governanceFindingCount,
  };
}
