"use client";

import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatGovernanceAssignedToMeIdentityAttestation,
  GOVERNANCE_ASSIGNED_TO_ME_LAST_CHECKED_PREFIX,
  GOVERNANCE_ASSIGNED_TO_ME_REFRESHING_LABEL,
} from "@/lib/governance/governance-assigned-to-me-empty-state";
import type { GovernanceAssignedToMeFetchBasis } from "@/lib/governance/governance-assigned-to-me-fetch-basis";
import { resolveGovernanceAssignedToMeQueueStatusPresentation } from "@/lib/governance/governance-assigned-to-me-queue-status";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { shouldShowGovernanceAssignedToMeWorkspaceLabel } from "@/lib/product-line/securenow-governance-assigned-to-me-copy";
import { cn } from "@/lib/utils";
import { PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";

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
  readonly assignedToMeFetchBasis: GovernanceAssignedToMeFetchBasis | null;
  readonly principalDisplayName: string;
  readonly principalRoleLabel: string | null;
};

export function GovernanceFindingsAssignedToMeStatusBadge({
  assignedToMeCount,
  assignedToMeFetchBasis,
  loading,
  loadFailed,
}: Pick<
  GovernanceFindingsAssignedToMeChromeProps,
  "assignedToMeCount" | "assignedToMeFetchBasis" | "loading" | "loadFailed"
>) {
  if (loading || loadFailed) {
    return null;
  }

  const presentation = resolveGovernanceAssignedToMeQueueStatusPresentation(
    assignedToMeCount,
    assignedToMeFetchBasis,
  );

  return (
    <span aria-live="polite" aria-atomic="true">
      <StatusTag
        kind={presentation.kind}
        label={presentation.label}
        data-testid="governance-assigned-to-me-queue-status"
      />
    </span>
  );
}

export function GovernanceFindingsAssignedToMeHeaderActions({
  assignedToMeRefreshing,
  onRefresh,
}: Pick<GovernanceFindingsAssignedToMeChromeProps, "assignedToMeRefreshing" | "onRefresh">) {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="governance-assigned-to-me-header-actions">
      <PageContextualHelpButton
        triggerText={buyerPolishedShell ? PAGE_HELP_SHORT_TRIGGER_TEXT : undefined}
      />
      <RefreshButton
        variant="outline"
        busy={assignedToMeRefreshing}
        onClick={() => {
          onRefresh();
        }}
      />
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)} data-testid="governance-assigned-to-me-refresh-hint">
        Press Refresh to reconcile the queue
      </span>
    </div>
  );
}

export function GovernanceFindingsAssignedToMeHeaderMetadata({
  assignedToMeWorkspaceLabel,
  assignedToMeCheckedAt,
  assignedToMeRefreshing,
  principalDisplayName,
  principalRoleLabel,
}: Pick<
  GovernanceFindingsAssignedToMeChromeProps,
  | "assignedToMeWorkspaceLabel"
  | "assignedToMeCheckedAt"
  | "assignedToMeRefreshing"
  | "principalDisplayName"
  | "principalRoleLabel"
>) {
  const { productLine } = useProductLine();
  const showWorkspaceLabel = shouldShowGovernanceAssignedToMeWorkspaceLabel(productLine);
  const showSecureNowPrincipalScope = productLine === "security";
  const assignedToMeFreshnessLabel = assignedToMeRefreshing
    ? GOVERNANCE_ASSIGNED_TO_ME_REFRESHING_LABEL
    : operatorFreshnessMetadataWithClockLabel({
        prefix: GOVERNANCE_ASSIGNED_TO_ME_LAST_CHECKED_PREFIX,
        lastRefreshedAt: assignedToMeCheckedAt,
        refreshingLabel: null,
      });
  const principalLabel = formatGovernanceAssignedToMeIdentityAttestation(
    principalDisplayName,
    principalRoleLabel,
  );

  return (
    <>
      {showSecureNowPrincipalScope ? (
        <span className="text-al-text-secondary" data-testid="governance-assigned-to-me-principal-scope">
          Tenant:{" "}
          <span className="font-medium text-al-text-primary">{assignedToMeWorkspaceLabel}</span>
          {" · "}
          Principal: <span className="font-medium text-al-text-primary">{principalLabel}</span>
        </span>
      ) : null}
      {showWorkspaceLabel ? (
        <span className="text-al-text-secondary" data-testid="governance-assigned-to-me-workspace">
          Workspace:{" "}
          <span className="font-medium text-al-text-primary">{assignedToMeWorkspaceLabel}</span>
        </span>
      ) : null}
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
      className={cn(
        "m-0 rounded-md border border-amber-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary",
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="governance-assigned-to-me-count-reconciliation"
      role="alert"
    >
      Count mismatch: header reports {assignedToMeCountData} assigned finding
      {assignedToMeCountData === 1 ? "" : "s"}, but this page loaded {assignedToMeLoadedFindingCount}. Refresh to
      reconcile before triaging.
    </p>
  );
}
