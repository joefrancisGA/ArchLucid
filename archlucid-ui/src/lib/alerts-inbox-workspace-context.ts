import {
  ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE,
  ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
  ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
  ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES,
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF,
  ALERTS_ACTION_START_ARCHITECTURE_REVIEW,
  ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF,
  ALERTS_CONFIGURE_RULES_LINK_LABEL,
  ALERTS_EMPTY_FILTERED_BODY,
  ALERTS_EMPTY_FILTERED_TITLE,
  ALERTS_EMPTY_HEALTHY_BODY,
  ALERTS_EMPTY_HEALTHY_TITLE,
  ALERTS_EMPTY_NO_REVIEWS_BODY,
  ALERTS_EMPTY_NO_REVIEWS_TITLE,
  ALERTS_EMPTY_NO_RULES_BODY,
  ALERTS_EMPTY_NO_RULES_TITLE,
} from "@/lib/alerts-page-copy";
import type { EnterpriseCompactEmptyStateProps, EnterpriseCompactEmptyStateAction } from "@/components/EnterpriseCompactEmptyState";
import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";

export const ALERTS_INBOX_DEFAULT_PROJECT_ID = "default";

export type AlertsInboxWorkspaceContext = {
  readonly hasReviews: boolean;
  readonly hasAlertRules: boolean;
  readonly loading: boolean;
};

export type AlertsInboxEmptyVariant = "healthy_clear" | "no_reviews" | "no_rules" | "filtered";

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

export function buildAlertsInboxEmptyStateProps(
  variant: AlertsInboxEmptyVariant,
  _canMutateAlertInbox: boolean,
): Pick<EnterpriseCompactEmptyStateProps, "title" | "description" | "actions"> {
  const governanceSetupSecondary = {
    label: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE,
    href: ALERTS_ACTION_OPEN_GOVERNANCE_SETUP_GUIDE_HREF,
    variant: "outline" as const,
  };

  if (variant === "filtered") {
    return {
      title: ALERTS_EMPTY_FILTERED_TITLE,
      description: ALERTS_EMPTY_FILTERED_BODY,
      actions: [
        { label: ALERTS_ACTION_OPEN_REVIEW_PACKAGES, href: ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF, variant: "primary" },
        {
          label: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
          href: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
          variant: "outline",
        },
      ],
    };
  }

  if (variant === "no_rules") {
    return {
      title: ALERTS_EMPTY_NO_RULES_TITLE,
      description: ALERTS_EMPTY_NO_RULES_BODY,
      actions: [
        {
          label: ALERTS_CONFIGURE_RULES_LINK_LABEL,
          href: governanceAlertRulesTabHref("rules"),
          variant: "primary",
        },
        governanceSetupSecondary,
      ],
    };
  }

  if (variant === "no_reviews") {
    return {
      title: ALERTS_EMPTY_NO_REVIEWS_TITLE,
      description: ALERTS_EMPTY_NO_REVIEWS_BODY,
      actions: [
        {
          label: ALERTS_ACTION_START_ARCHITECTURE_REVIEW,
          href: ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF,
          variant: "primary",
        },
        governanceSetupSecondary,
      ],
    };
  }

  // healthy_clear: header link owns configure-rules; do not push a third CTA (TB-2103).
  const actions: EnterpriseCompactEmptyStateAction[] = [
    { label: ALERTS_ACTION_OPEN_REVIEW_PACKAGES, href: ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF, variant: "primary" },
    {
      label: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
      href: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
      variant: "outline",
    },
  ];

  return {
    title: ALERTS_EMPTY_HEALTHY_TITLE,
    description: ALERTS_EMPTY_HEALTHY_BODY,
    actions,
  };
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
