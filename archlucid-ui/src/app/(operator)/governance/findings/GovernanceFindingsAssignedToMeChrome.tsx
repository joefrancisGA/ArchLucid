"use client";

import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_ASSIGNED_TO_ME_LAST_CHECKED_PREFIX,
  GOVERNANCE_ASSIGNED_TO_ME_REFRESHING_LABEL,
} from "@/lib/governance/governance-assigned-to-me-empty-state";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { cn } from "@/lib/utils";

export type GovernanceFindingsAssignedToMeChromeProps = {
  readonly assignedToMeCount: number;
  readonly assignedToMeWorkspaceLabel: string;
  readonly assignedToMeCheckedAt: Date | null;
  readonly assignedToMeRefreshing: boolean;
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly onRefresh: () => void;
  readonly assignedToMeCountMismatch: boolean;
  readonly assignedToMeCountData: number | undefined;
  readonly assignedToMeLoadedFindingCount: number;
};

export function GovernanceFindingsAssignedToMeStatusBadge({
  assignedToMeCount,
  loading,
  loadFailed,
}: Pick<
  GovernanceFindingsAssignedToMeChromeProps,
  "assignedToMeCount" | "loading" | "loadFailed"
>) {
  if (loading || loadFailed) {
    return null;
  }

  return (
    <span aria-live="polite" aria-atomic="true">
      <StatusTag
        kind={assignedToMeCount > 0 ? "needs-attention" : "ready"}
        label={
          assignedToMeCount === 1
            ? "1 open finding assigned"
            : `${assignedToMeCount} open findings assigned`
        }
        data-testid="governance-assigned-to-me-queue-status"
      />
    </span>
  );
}

export function GovernanceFindingsAssignedToMeHeaderActions({
  assignedToMeRefreshing,
  onRefresh,
}: Pick<GovernanceFindingsAssignedToMeChromeProps, "assignedToMeRefreshing" | "onRefresh">) {
  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="governance-assigned-to-me-header-actions">
      <PageContextualHelpButton />
      <RefreshButton
        variant="outline"
        busy={assignedToMeRefreshing}
        onClick={() => {
          onRefresh();
        }}
      />
    </div>
  );
}

export function GovernanceFindingsAssignedToMeHeaderMetadata({
  assignedToMeWorkspaceLabel,
  assignedToMeCheckedAt,
  assignedToMeRefreshing,
}: Pick<
  GovernanceFindingsAssignedToMeChromeProps,
  "assignedToMeWorkspaceLabel" | "assignedToMeCheckedAt" | "assignedToMeRefreshing"
>) {
  const assignedToMeFreshnessLabel = assignedToMeRefreshing
    ? GOVERNANCE_ASSIGNED_TO_ME_REFRESHING_LABEL
    : operatorFreshnessMetadataWithClockLabel({
        prefix: GOVERNANCE_ASSIGNED_TO_ME_LAST_CHECKED_PREFIX,
        lastRefreshedAt: assignedToMeCheckedAt,
        refreshingLabel: null,
      });

  return (
    <>
      <span className="text-al-text-secondary" data-testid="governance-assigned-to-me-workspace">
        Workspace:{" "}
        <span className="font-medium text-al-text-primary">{assignedToMeWorkspaceLabel}</span>
      </span>
      <OperatorPageFreshnessMetadata
        testId="governance-assigned-to-me-last-checked"
        lastRefreshedAt={assignedToMeRefreshing ? null : assignedToMeCheckedAt}
      >
        {assignedToMeFreshnessLabel}
      </OperatorPageFreshnessMetadata>
    </>
  );
}

export function GovernanceFindingsAssignedToMeCountMismatchBanner({
  assignedToMeCountData,
  assignedToMeLoadedFindingCount,
}: Pick<
  GovernanceFindingsAssignedToMeChromeProps,
  "assignedToMeCountData" | "assignedToMeLoadedFindingCount"
>) {
  return (
    <p
      className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="governance-assigned-to-me-count-reconciliation"
      role="status"
    >
      Header count ({assignedToMeCountData}) differs from loaded rows ({assignedToMeLoadedFindingCount}).
      Refresh to reconcile.
    </p>
  );
}
