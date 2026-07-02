import { useMemo } from "react";

import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import {
  alertsInboxGettingStartedOperator,
  alertsInboxGettingStartedReader,
} from "@/lib/alerts-hub-empty-guidance";
import {
  alertsFilteredEmptyDescriptionOperator,
  alertsFilteredEmptyDescriptionReader,
} from "@/lib/enterprise-controls-context-copy";

/** Empty-state copy for filtered alerts inbox (TB-564). */
export function useAlertsInboxEmptyFilteredProps(
  buyerPolishedShell: boolean,
  canMutateAlertInbox: boolean,
): EnterpriseCompactEmptyStateProps {
  return useMemo((): EnterpriseCompactEmptyStateProps => {
    if (buyerPolishedShell) {
      return {
        testId: "alerts-inbox-empty-state",
        title: "No alerts in this sample",
        description:
          "The walkthrough focuses on the governed review package first. Live alert traffic may be empty for this tenant snapshot.",
        actions: [{ label: "Continue to reviews", href: "/reviews?projectId=default", variant: "primary" }],
      };
    }

    const gettingStarted = canMutateAlertInbox ? alertsInboxGettingStartedOperator : alertsInboxGettingStartedReader;
    const descriptionBase = canMutateAlertInbox
      ? alertsFilteredEmptyDescriptionOperator
      : alertsFilteredEmptyDescriptionReader;
    const description = `${descriptionBase} ${gettingStarted.steps.join(" ")}`;

    const actions = canMutateAlertInbox
      ? [
          { label: "Set up alert rules", href: "/alerts?tab=rules", variant: "primary" as const },
          { label: "Add routing (optional)", href: "/alerts?tab=routing", variant: "outline" as const },
          { label: "View reviews", href: "/reviews?projectId=default", variant: "outline" as const },
        ]
      : [
          { label: "Review alert rules", href: "/alerts?tab=rules", variant: "primary" as const },
          { label: "View reviews", href: "/reviews?projectId=default", variant: "outline" as const },
        ];

    return {
      testId: "alerts-inbox-empty-state",
      title: "No alerts match this filter",
      description,
      actions,
    };
  }, [buyerPolishedShell, canMutateAlertInbox]);
}
