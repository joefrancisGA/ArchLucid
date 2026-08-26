import {
  ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE,
  ARCHITECTURE_RISK_REGISTER_PAGE_TITLE,
  computeArchitectureRiskRegisterSummary,
  matchesGovernanceFindingsRunScope,
  matchesRiskRegisterFilter,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";
import {
  BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD,
  BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import {
  comparePageHrefWithLifecycleAnchor,
  COMPARE_FINDING_LIFECYCLE_ANCHOR,
} from "@/lib/compare-finding-lifecycle";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_FILTER_NO_MATCH_COMPACT,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_LOAD_FAILED_COMPACT,
  GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT,
  GOVERNANCE_FINDINGS_LOAD_FAILED_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import { governanceFindingInspectHref } from "@/components/governance/findings/governance-findings-navigation";
import { resolveContinueLastGovernanceFinding } from "@/lib/resolve-continue-last-governance-finding";
import {
  governanceFindingsQueueActiveFilterChips,
  governanceFindingsQueueActiveFiltersSummary,
} from "@/lib/governance/governance-findings-queue-active-filters";
import { resolveGovernanceAssignedToMeOldestFinding } from "@/lib/governance/resolve-governance-assigned-to-me-oldest-finding";
import { buildSponsorStoryDispositionCountsFromRows } from "@/lib/sponsor-story-synopsis";
import {
  EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS,
  matchesFindingsNaturalLanguageFacets,
  type FindingsNaturalLanguageFacets,
} from "@/lib/findings/findings-natural-language-filter";
import {
  filterGovernanceRowsForJobView,
  type FindingJobView,
} from "@/lib/findings/finding-job-view";

import type { GovernanceFindingQueueRow } from "./governance-finding-queue-row";

export function filterGovernanceFindingsScopedRows(
  rows: readonly GovernanceFindingQueueRow[],
  scopedRunId: string | null,
): GovernanceFindingQueueRow[] {
  return rows.filter((row) => matchesGovernanceFindingsRunScope(row, scopedRunId));
}

export function filterGovernanceFindingsDisplayedRows(
  scopedRows: readonly GovernanceFindingQueueRow[],
  registerFilter: RiskRegisterFilter,
  nlFacets: FindingsNaturalLanguageFacets,
  effectiveJobView: FindingJobView | null,
): GovernanceFindingQueueRow[] {
  const facetFilteredRows = scopedRows.filter(
    (row) =>
      matchesRiskRegisterFilter(row, registerFilter) &&
      matchesFindingsNaturalLanguageFacets(
        {
          title: row.title,
          severity: row.severity,
          status: row.status,
          latestDisposition: row.latestDisposition,
        },
        nlFacets,
      ),
  );

  if (effectiveJobView === null) {
    return facetFilteredRows;
  }

  return filterGovernanceRowsForJobView(facetFilteredRows, effectiveJobView);
}

export function computeGovernanceFindingsRegisterSummary(
  scopedRows: readonly GovernanceFindingQueueRow[],
) {
  return computeArchitectureRiskRegisterSummary(scopedRows);
}

export function extractGovernanceFindingIds(
  displayedRows: readonly GovernanceFindingQueueRow[],
): string[] {
  return displayedRows
    .filter((row) => row.recordKind === "finding")
    .map((row) => row.findingId);
}

export type FirstFindingTriageTarget = {
  readonly findingId: string;
  readonly findingTitle: string;
  readonly href: string;
};

export function resolveFirstFindingTriageTarget(
  displayedRows: readonly GovernanceFindingQueueRow[],
  isAssignedToMe: boolean,
): FirstFindingTriageTarget | null {
  if (isAssignedToMe) {
    return null;
  }

  const row = displayedRows.find((candidate) => candidate.recordKind === "finding");

  if (row === undefined) {
    return null;
  }

  return {
    findingId: row.findingId,
    findingTitle: row.title,
    href: governanceFindingInspectHref(row.runId, row.findingId),
  };
}

export function resolveContinueLastFindingTarget(
  displayedRows: readonly GovernanceFindingQueueRow[],
  findingsQueueRunId?: string | null,
) {
  return resolveContinueLastGovernanceFinding(displayedRows, findingsQueueRunId);
}

export type AssignedToMeOldestFindingTarget = {
  readonly target: NonNullable<ReturnType<typeof resolveGovernanceAssignedToMeOldestFinding>>;
  readonly href: string;
};

export function resolveAssignedToMeOldestFindingTarget(
  rows: readonly GovernanceFindingQueueRow[],
  isAssignedToMe: boolean,
): AssignedToMeOldestFindingTarget | null {
  if (!isAssignedToMe) {
    return null;
  }

  const target = resolveGovernanceAssignedToMeOldestFinding(rows);

  if (target === null) {
    return null;
  }

  return {
    target,
    href: governanceFindingInspectHref(target.runId, target.findingId),
  };
}

export function deriveSponsorSynopsisPackageTitle(
  displayedRows: readonly GovernanceFindingQueueRow[],
  scopedRunId: string | null,
): string {
  return (
    displayedRows.find((row) => row.recordKind === "finding")?.runLabel ??
    (scopedRunId !== null && scopedRunId.length > 0 ? scopedRunId : "this workspace")
  );
}

export function deriveSponsorSynopsisCounts(
  displayedRows: readonly GovernanceFindingQueueRow[],
) {
  return buildSponsorStoryDispositionCountsFromRows(
    displayedRows.filter((row) => row.recordKind === "finding"),
  );
}

export function deriveGovernanceFindingsActiveFiltersSummary(
  registerFilter: RiskRegisterFilter,
  jobView: FindingJobView,
  nlFacets: FindingsNaturalLanguageFacets,
  jobViewFilterActive: boolean,
): string | null {
  return governanceFindingsQueueActiveFiltersSummary(
    governanceFindingsQueueActiveFilterChips({
      registerFilter,
      jobView,
      nlFacets,
      jobViewFilterActive,
    }),
  );
}

export function countAssignedToMeLoadedFindings(
  rows: readonly GovernanceFindingQueueRow[],
): number {
  return rows.filter((row) => row.recordKind === "finding").length;
}

export function hasAssignedToMeCountMismatch(options: {
  readonly isAssignedToMe: boolean;
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly assignedToMeCountData: number | undefined;
  readonly assignedToMeLoadedFindingCount: number;
}): boolean {
  return (
    options.isAssignedToMe &&
    !options.loading &&
    !options.loadFailed &&
    options.assignedToMeCountData !== undefined &&
    options.assignedToMeCountData !== options.assignedToMeLoadedFindingCount
  );
}

export { EMPTY_FINDINGS_NATURAL_LANGUAGE_FACETS };

export function resolveGovernanceFindingsPageTitle(
  isAssignedToMe: boolean,
  buyerPolishedShell: boolean,
): string {
  if (isAssignedToMe) {
    return "Assigned to me";
  }

  return buyerPolishedShell ? BUYER_GOVERNANCE_FINDINGS_PAGE_TITLE : ARCHITECTURE_RISK_REGISTER_PAGE_TITLE;
}

export function resolveGovernanceFindingsPageSubtitle(
  isAssignedToMe: boolean,
  buyerPolishedShell: boolean,
): string {
  if (isAssignedToMe) {
    return "Open findings assigned to you for remediation across reviews in this workspace.";
  }

  return buyerPolishedShell
    ? BUYER_GOVERNANCE_FINDINGS_PAGE_LEAD
    : ARCHITECTURE_RISK_REGISTER_PAGE_SUBTITLE;
}

export function resolveGovernanceFindingsNavHref(isAssignedToMe: boolean): string {
  return isAssignedToMe ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH : GOVERNANCE_FINDINGS_PATH;
}

export function resolveGovernanceFindingsLoadFailedPreset(isAssignedToMe: boolean) {
  return isAssignedToMe
    ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_LOAD_FAILED_COMPACT
    : GOVERNANCE_FINDINGS_LOAD_FAILED_COMPACT;
}

export function resolveGovernanceFindingsFilterNoMatchPreset(isAssignedToMe: boolean) {
  return isAssignedToMe
    ? GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_FILTER_NO_MATCH_COMPACT
    : GOVERNANCE_FINDINGS_FILTER_NO_MATCH_COMPACT;
}

export function resolveScopedFindingLifecycleCompareHref(
  scopedRunId: string | null,
  priorCommittedRunId: string | null | undefined,
): string | null {
  if (scopedRunId === null || scopedRunId.length === 0) {
    return null;
  }

  const laterOnlyHref = `${comparePageHrefAdaptive("", scopedRunId)}#${COMPARE_FINDING_LIFECYCLE_ANCHOR}`;
  const priorRunId = priorCommittedRunId?.trim() ?? "";

  if (priorRunId.length === 0) {
    return laterOnlyHref;
  }

  return comparePageHrefWithLifecycleAnchor(priorRunId, scopedRunId);
}

export function resolveGovernanceFindingsSponsorHandoffHref(
  scopedRunId: string | null,
): string | null {
  if (scopedRunId === null || scopedRunId.length === 0) {
    return null;
  }

  return `/architecture/reviews/${encodeURIComponent(scopedRunId)}?reviewTab=review-package`;
}
