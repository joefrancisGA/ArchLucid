import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF } from "@/lib/alerts-page-copy";
import { resolveAdvisoryRunProjectSlug } from "@/lib/advisory-schedule-form";
import {
  ALERTS_INBOX_FILTERED_EMPTY_COMPACT,
  ALERTS_INBOX_HEALTHY_EMPTY_COMPACT,
  ALERTS_INBOX_NO_REVIEWS_EMPTY_COMPACT,
  ALERTS_INBOX_NO_RULES_EMPTY_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";

export const ALERTS_INBOX_DEFAULT_PROJECT_ID = "default";

export type AlertsInboxWorkspaceContext = {
  readonly hasReviews: boolean;
  readonly hasAlertRules: boolean;
  readonly loading: boolean;
};

export type AlertsInboxEmptyVariant = "healthy_clear" | "no_reviews" | "no_rules" | "filtered";

const ALERTS_INBOX_EMPTY_PRESETS: Record<AlertsInboxEmptyVariant, EnterpriseCompactEmptyStateProps> = {
  filtered: ALERTS_INBOX_FILTERED_EMPTY_COMPACT,
  no_rules: ALERTS_INBOX_NO_RULES_EMPTY_COMPACT,
  no_reviews: ALERTS_INBOX_NO_REVIEWS_EMPTY_COMPACT,
  healthy_clear: ALERTS_INBOX_HEALTHY_EMPTY_COMPACT,
};

function withOpenReviewPackagesHref(
  preset: EnterpriseCompactEmptyStateProps,
  openReviewPackagesHref: string,
): Pick<EnterpriseCompactEmptyStateProps, "title" | "description" | "actions"> {
  const actions = preset.actions?.map((action) =>
    action.href === ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF
      ? { ...action, href: openReviewPackagesHref }
      : action,
  );

  return {
    title: preset.title,
    description: preset.description,
    actions,
  };
}

export function resolveAlertsInboxEmptyVariant(
  context: AlertsInboxWorkspaceContext,
  statusFilter: string,
  allStatusesValue: string,
): AlertsInboxEmptyVariant {
  if (statusFilter !== "Open" && statusFilter !== allStatusesValue) {
    return "filtered";
  }

  if (!context.hasAlertRules) {
    return "no_rules";
  }

  if (!context.hasReviews) {
    return "no_reviews";
  }

  return "healthy_clear";
}

/**
 * Header configure link stays up while workspace context loads, then hides only for
 * `no_rules` so the empty-state primary remains the single affordance (TB-2103).
 */
export function shouldShowAlertsHeaderConfigureRulesLink(
  context: AlertsInboxWorkspaceContext,
  statusFilter: string,
  allStatusesValue: string,
): boolean {
  if (context.loading) {
    return true;
  }

  return resolveAlertsInboxEmptyVariant(context, statusFilter, allStatusesValue) !== "no_rules";
}

/**
 * Reviews deep-link for inbox empty states — omit `projectId=default`; add scope only for a real slug (TB-1598).
 */
export function resolveAlertsOpenReviewPackagesHref(sessionProjectId: string | null | undefined): string {
  const projectSlug = resolveAdvisoryRunProjectSlug(sessionProjectId);

  if (projectSlug === ALERTS_INBOX_DEFAULT_PROJECT_ID) {
    return ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF;
  }

  return `${ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF}?projectId=${encodeURIComponent(projectSlug)}`;
}

export type BuildAlertsInboxEmptyStateOptions = {
  readonly openReviewPackagesHref?: string;
};

export function buildAlertsInboxEmptyStateProps(
  variant: AlertsInboxEmptyVariant,
  _canMutateAlertInbox: boolean,
  options: BuildAlertsInboxEmptyStateOptions = {},
): Pick<EnterpriseCompactEmptyStateProps, "title" | "description" | "actions"> {
  const openReviewPackagesHref = options.openReviewPackagesHref ?? ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF;
  const preset = ALERTS_INBOX_EMPTY_PRESETS[variant];

  return withOpenReviewPackagesHref(preset, openReviewPackagesHref);
}

/** Empty-state + header configure-rules affordance count for a resolved variant (TB-2103). */
export function countAlertsConfigureRulesAffordances(
  variant: AlertsInboxEmptyVariant,
  canMutateAlertInbox: boolean,
  showHeaderConfigureLink: boolean,
): number {
  const emptyHrefCount =
    buildAlertsInboxEmptyStateProps(variant, canMutateAlertInbox).actions?.filter(
      (action) => action.href === governanceAlertRulesTabHref("rules"),
    ).length ?? 0;

  return emptyHrefCount + (showHeaderConfigureLink ? 1 : 0);
}
