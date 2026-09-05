import {
  BUYER_OPERATOR_HOME_PAGE_SUBTITLE,
  OPERATOR_HOME_COMMAND_CENTER_TAGLINE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import type { OperatorHomeWorkspaceMetricsSnapshot } from "@/lib/operator/operator-home-workspace-metrics";

export const OPERATOR_HOME_PAGE_TITLE = OPERATOR_NAV_LINK_LABELS.home;

export const OPERATOR_HOME_PAGE_SUBTITLE = OPERATOR_HOME_COMMAND_CENTER_TAGLINE;

export { BUYER_OPERATOR_HOME_PAGE_SUBTITLE };

export const OPERATOR_HOME_PAGE_SUBTITLE_OPERATOR = OPERATOR_HOME_PAGE_SUBTITLE;

export const OPERATOR_HOME_WORKING_PAGE_SUBTITLE =
  "Resume drafts, triage findings, and continue reviews already in progress.";

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
    parts.push(
      `${metrics.governanceWarnings} governance approval warning${metrics.governanceWarnings === 1 ? "" : "s"}`,
    );
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
  workspaceLabel?: string | null,
): string | undefined {
  const workspaceSuffix =
    workspaceLabel !== null && workspaceLabel !== undefined && workspaceLabel.trim().length > 0
      ? `Summarizing ${workspaceLabel.trim()}.`
      : undefined;

  if (buyerPolishedShell) {
    return workspaceSuffix;
  }

  if (workingMode) {
    const pressureLine = metrics !== undefined ? formatOperatorHomePressureSubtitle(metrics) : null;
    const base = pressureLine !== null
      ? `${OPERATOR_HOME_WORKING_PAGE_SUBTITLE} · ${pressureLine}`
      : OPERATOR_HOME_WORKING_PAGE_SUBTITLE;

    return workspaceSuffix !== undefined ? `${base} ${workspaceSuffix}` : base;
  }

  const pressureLine = metrics !== undefined ? formatOperatorHomePressureSubtitle(metrics) : null;

  if (pressureLine !== null) {
    return workspaceSuffix !== undefined ? `${pressureLine} ${workspaceSuffix}` : pressureLine;
  }

  if (workspaceSuffix !== undefined) {
    return `${OPERATOR_HOME_PAGE_SUBTITLE_OPERATOR} ${workspaceSuffix}`;
  }

  return OPERATOR_HOME_PAGE_SUBTITLE_OPERATOR;
}

export const OPERATOR_HOME_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const OPERATOR_HOME_ACTION_REFRESH = "Refresh" as const;

export const OPERATOR_HOME_ACTION_REFRESHING = "Refreshing…" as const;

export const OPERATOR_HOME_SCOPE_DETAILS_TRIGGER = `About ${OPERATOR_NAV_LINK_LABELS.home}` as const;

export const OPERATOR_HOME_SCOPE_OVERVIEW = OPERATOR_HOME_COMMAND_CENTER_TAGLINE;
