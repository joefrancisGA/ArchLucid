"use client";

import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  GOVERNANCE_ASSIGNED_TO_ME_LAST_CHECKED_PREFIX,
  GOVERNANCE_ASSIGNED_TO_ME_REFRESHING_LABEL,
} from "@/lib/governance/governance-assigned-to-me-empty-state";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";

export type GovernanceFindingsAssignedToMeHeaderProps = {
  readonly assignedToMeCount: number;
  readonly assignedToMeWorkspaceLabel: string;
  readonly assignedToMeCheckedAt: Date | null;
  readonly assignedToMeRefreshing: boolean;
  readonly loading: boolean;
  readonly loadFailed: boolean;
  readonly onRefresh: () => void;
};

export function GovernanceFindingsAssignedToMeStatusBadge({
  assignedToMeCount,
  loading,
  loadFailed,
}: Pick<
  GovernanceFindingsAssignedToMeHeaderProps,
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
}: Pick<GovernanceFindingsAssignedToMeHeaderProps, "assignedToMeRefreshing" | "onRefresh">) {
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
  GovernanceFindingsAssignedToMeHeaderProps,
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
