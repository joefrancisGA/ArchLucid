import {
  ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
  ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES,
  ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF,
  ALERTS_ACTION_OPEN_STANDARDS_AND_RULES,
  ALERTS_ACTION_START_ARCHITECTURE_REVIEW,
  ALERTS_ACTION_START_ARCHITECTURE_REVIEW_HREF,
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
import { governanceAlertsTabHref } from "@/lib/governance-route-paths";

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

export function buildAlertsInboxEmptyStateProps(
  variant: AlertsInboxEmptyVariant,
  canMutateAlertInbox: boolean,
): Pick<EnterpriseCompactEmptyStateProps, "title" | "description" | "actions"> {
  const governanceSecondary = {
    label: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW,
    href: ALERTS_ACTION_OPEN_GOVERNANCE_WORKFLOW_HREF,
    variant: "outline" as const,
  };

  if (variant === "filtered") {
    return {
      title: ALERTS_EMPTY_FILTERED_TITLE,
      description: ALERTS_EMPTY_FILTERED_BODY,
      actions: [
        { label: ALERTS_ACTION_OPEN_REVIEW_PACKAGES, href: ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF, variant: "primary" },
        governanceSecondary,
      ],
    };
  }

  if (variant === "no_rules") {
    return {
      title: ALERTS_EMPTY_NO_RULES_TITLE,
      description: ALERTS_EMPTY_NO_RULES_BODY,
      actions: [
        {
          label: ALERTS_ACTION_OPEN_STANDARDS_AND_RULES,
          href: governanceAlertsTabHref("rules"),
          variant: "primary",
        },
        governanceSecondary,
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
        governanceSecondary,
      ],
    };
  }

  const actions: EnterpriseCompactEmptyStateAction[] = [
    { label: ALERTS_ACTION_OPEN_REVIEW_PACKAGES, href: ALERTS_ACTION_OPEN_REVIEW_PACKAGES_HREF, variant: "primary" },
    governanceSecondary,
  ];

  if (canMutateAlertInbox) {
    actions.push({
      label: ALERTS_ACTION_OPEN_STANDARDS_AND_RULES,
      href: governanceAlertsTabHref("rules"),
      variant: "outline",
    });
  }

  return {
    title: ALERTS_EMPTY_HEALTHY_TITLE,
    description: ALERTS_EMPTY_HEALTHY_BODY,
    actions,
  };
}
