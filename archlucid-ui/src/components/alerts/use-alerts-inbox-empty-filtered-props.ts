import { useMemo } from "react";

import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import {
  ALERTS_EMPTY_STATE_BODY,
  ALERTS_EMPTY_STATE_PRIMARY_ACTION,
  ALERTS_EMPTY_STATE_PRIMARY_HREF,
  ALERTS_EMPTY_STATE_TITLE,
} from "@/lib/alerts-page-copy";
import { governanceAlertsTabHref } from "@/lib/governance-route-paths";

/** Empty-state copy for filtered alerts inbox (TB-564). */
export function useAlertsInboxEmptyFilteredProps(
  buyerPolishedShell: boolean,
  canMutateAlertInbox: boolean,
): EnterpriseCompactEmptyStateProps {
  return useMemo((): EnterpriseCompactEmptyStateProps => {
    const secondaryAction =
      !buyerPolishedShell && canMutateAlertInbox
        ? [{ label: "Set up alert rules", href: governanceAlertsTabHref("rules"), variant: "outline" as const }]
        : [];

    const actions: EnterpriseCompactEmptyStateProps["actions"] = [
      { label: ALERTS_EMPTY_STATE_PRIMARY_ACTION, href: ALERTS_EMPTY_STATE_PRIMARY_HREF, variant: "primary" },
      ...secondaryAction,
    ];

    return {
      testId: "alerts-inbox-empty-state",
      title: ALERTS_EMPTY_STATE_TITLE,
      description: ALERTS_EMPTY_STATE_BODY,
      actions,
    };
  }, [buyerPolishedShell, canMutateAlertInbox]);
}
