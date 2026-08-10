import { useMemo } from "react";

import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { ALERTS_INBOX_ALL_STATUSES_VALUE } from "@/app/(operator)/governance/alerts/_sections/load-alerts-inbox-page-model";
import {
  buildAlertsInboxEmptyStateProps,
  resolveAlertsInboxEmptyVariant,
  resolveAlertsOpenReviewPackagesHref,
  type AlertsInboxWorkspaceContext,
} from "@/lib/alerts-inbox-workspace-context";

/** Empty-state copy for filtered alerts inbox (TB-564). */
export function useAlertsInboxEmptyFilteredProps(
  buyerPolishedShell: boolean,
  canMutateAlertInbox: boolean,
  workspaceContext: AlertsInboxWorkspaceContext,
  statusFilter: string,
): EnterpriseCompactEmptyStateProps {
  const scope = useOperatorScopeQueryKey();

  return useMemo((): EnterpriseCompactEmptyStateProps => {
    const variant = resolveAlertsInboxEmptyVariant(workspaceContext, statusFilter, ALERTS_INBOX_ALL_STATUSES_VALUE);
    const openReviewPackagesHref = resolveAlertsOpenReviewPackagesHref(scope.projectId);
    const { title, description, actions } = buildAlertsInboxEmptyStateProps(variant, canMutateAlertInbox, {
      openReviewPackagesHref,
    });

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
  }, [buyerPolishedShell, canMutateAlertInbox, scope.projectId, workspaceContext, statusFilter]);
}
