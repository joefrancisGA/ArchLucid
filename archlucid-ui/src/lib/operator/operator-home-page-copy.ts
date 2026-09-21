import {
  BUYER_OPERATOR_HOME_PAGE_SUBTITLE,
  OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { formatOperatorHomeGovernanceApprovalWarningCount } from "@/lib/operator/operator-home-governance-approval-warning-copy";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";

export const OPERATOR_HOME_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.home;

export const OPERATOR_HOME_PAGE_SUBTITLE = OPERATOR_HOME_COMMAND_CENTER_TAGLINE;

export { BUYER_OPERATOR_HOME_PAGE_SUBTITLE };

export const OPERATOR_HOME_PAGE_SUBTITLE_OPERATOR = OPERATOR_HOME_PAGE_SUBTITLE;

/** Empty working Home — start language only; resume copy implies existing drafts or reviews. */
export const OPERATOR_HOME_WORKING_EMPTY_PAGE_SUBTITLE =
  "Start architecture drafts, add evidence, and begin your first review from this workspace.";

/** Working Home when at least one review is still in progress. */
export const OPERATOR_HOME_WORKING_PAGE_SUBTITLE =
  "Resume architecture drafts, triage findings, and continue reviews already in progress.";

/** Working Home when reviews exist but none are still in progress. */
export const OPERATOR_HOME_WORKING_COMPLETED_PAGE_SUBTITLE =
  "Open completed reviews, triage findings, and start new architecture work.";

function resolveOperatorHomeWorkingPageSubtitle(
  metrics?: OperatorHomeWorkspaceMetricsSnapshot,
): string {
  if (metrics === undefined || !metrics.hasReviews) {
    return OPERATOR_HOME_WORKING_EMPTY_PAGE_SUBTITLE;
  }

  if (metrics.reviewPackagesActive > 0) {
    return OPERATOR_HOME_WORKING_PAGE_SUBTITLE;
  }

  return OPERATOR_HOME_WORKING_COMPLETED_PAGE_SUBTITLE;
}

function formatOperatorHomePressureSubtitle(metrics: OperatorHomeWorkspaceMetricsSnapshot): string | null {
  if (!metrics.hasReviews) {
    return null;
  }

  const parts: string[] = [];

  if (metrics.reviewPackagesActive > 0) {
    parts.push(
      `${metrics.reviewPackagesActive} active review${metrics.reviewPackagesActive === 1 ? "" : "s"}`,
    );
  }

  if (metrics.openFindings > 0) {
    parts.push(`${metrics.openFindings} open finding${metrics.openFindings === 1 ? "" : "s"}`);
  }

  if (metrics.governanceWarnings > 0) {
    parts.push(formatOperatorHomeGovernanceApprovalWarningCount(metrics.governanceWarnings));
  }

  if (parts.length === 0) {
    return null;
  }

  return parts.join(" · ");
}

export function operatorHomePageSubtitle(
  buyerPolishedShell: boolean,
  workingMode = false,
  metrics?: OperatorHomeWorkspaceMetricsSnapshot,
): string | undefined {
  if (buyerPolishedShell) {
    return undefined;
  }

  if (workingMode) {
    const workingSubtitle = resolveOperatorHomeWorkingPageSubtitle(metrics);
    const pressureLine = metrics !== undefined ? formatOperatorHomePressureSubtitle(metrics) : null;

    if (pressureLine !== null) {
      return `${workingSubtitle} · ${pressureLine}`;
    }

    return workingSubtitle;
  }

  const pressureLine = metrics !== undefined ? formatOperatorHomePressureSubtitle(metrics) : null;

  if (pressureLine !== null) {
    return pressureLine;
  }

  return OPERATOR_HOME_PAGE_SUBTITLE_OPERATOR;
}

export const OPERATOR_HOME_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const OPERATOR_HOME_ACTION_REFRESH = "Refresh" as const;

export const OPERATOR_HOME_ACTION_REFRESHING = "Refreshing…" as const;

export const OPERATOR_HOME_SCOPE_DETAILS_TRIGGER = `About ${OPERATOR_NAV_LINK_LABELS.home}` as const;

export const OPERATOR_HOME_SCOPE_OVERVIEW = OPERATOR_HOME_COMMAND_CENTER_TAGLINE;
