import { useMemo } from "react";

import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { ALERTS_INBOX_ALL_STATUSES_VALUE } from "@/app/(operator)/governance/alerts/_sections/load-alerts-inbox-page-model";
import {
  buildAlertsInboxEmptyStateProps,
  resolveAlertsInboxEmptyVariant,
  type AlertsInboxWorkspaceContext,
} from "@/lib/alerts-inbox-workspace-context";

/** Empty-state copy for filtered alerts inbox (TB-564). */
export function useAlertsInboxEmptyFilteredProps(
  buyerPolishedShell: boolean,
  canMutateAlertInbox: boolean,
  workspaceContext: AlertsInboxWorkspaceContext,
  statusFilter: string,
): EnterpriseCompactEmptyStateProps {
  return useMemo((): EnterpriseCompactEmptyStateProps => {
    const variant = resolveAlertsInboxEmptyVariant(workspaceContext, statusFilter, ALERTS_INBOX_ALL_STATUSES_VALUE);
    const { title, description, actions } = buildAlertsInboxEmptyStateProps(variant, canMutateAlertInbox);

    if (buyerPolishedShell) {
      return {
        testId: "alerts-inbox-empty-state",
        title,
        description,
        actions: actions?.slice(0, 1),
      };
    }

    return {
      testId: "alerts-inbox-empty-state",
      title,
      description,
      actions,
    };
  }, [buyerPolishedShell, canMutateAlertInbox, workspaceContext, statusFilter]);
}
