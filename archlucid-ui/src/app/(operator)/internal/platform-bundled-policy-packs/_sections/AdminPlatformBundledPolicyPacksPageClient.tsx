"use client";

import { PlatformBundledPolicyPacksEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { RefreshButton } from "@/components/ui/refresh-button";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH } from "@/lib/internal-ops-route-paths";
import {
  PLATFORM_BUNDLED_POLICY_PACKS_PAGE_SUBTITLE,
  PLATFORM_BUNDLED_POLICY_PACKS_PAGE_TITLE,
} from "@/lib/platform-bundled-policy-packs-page-copy";
import { cn } from "@/lib/utils";

import { PlatformBundledPolicyPackActivationConfirmDialog } from "./PlatformBundledPolicyPackActivationConfirmDialog";
import { PlatformBundledPolicyPacksTableShell } from "./PlatformBundledPolicyPacksTableShell";
import { usePlatformBundledPolicyPacksState } from "./use-platform-bundled-policy-packs-state";

export function AdminPlatformBundledPolicyPacksPageClient() {
  const model = usePlatformBundledPolicyPacksState();

  if (model.isAuthorityLoading) {
    return <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>;
  }

  if (!model.isAdmin) {
    return (
      <p className={cn("text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
        This page requires tenant administrator access (AdminAuthority).
      </p>
    );
  }

  return (
    <OperatorPageContainer
      variant="dashboard"
      className={OPERATOR_LAYOUT.sectionStack}
      data-testid="admin-platform-bundled-policy-packs-page"
    >
      <OperatorPageHeader
        navHref={INTERNAL_PLATFORM_BUNDLED_POLICY_PACKS_PATH}
        title={PLATFORM_BUNDLED_POLICY_PACKS_PAGE_TITLE}
        headingLevel="h1"
        subtitle={PLATFORM_BUNDLED_POLICY_PACKS_PAGE_SUBTITLE}
        actions={
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="platform-bundled-policy-packs-header-actions"
          >
            <RefreshButton
              busy={model.loading}
              data-testid="platform-bundled-policy-packs-refresh-button"
              onClick={() => {
                void model.load();
              }}
            />
            <PageContextualHelpButton />
          </div>
        }
      />

      <PlatformBundledPolicyPacksEvidenceOrientationStrip />

      {model.loadError !== null ? (
        <OperatorSectionLoadFailure
          message={model.loadError}
          retryLabel="Reload registry"
          retrying={model.loading}
          testId="platform-bundled-policy-packs-load-failure"
          onRetry={() => {
            void model.load();
          }}
        />
      ) : null}

      {model.toggleMessage !== null ? (
        <p
          className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          role="status"
          data-testid="platform-bundled-policy-packs-toggle-status"
        >
          {model.toggleMessage}
        </p>
      ) : null}

      <PlatformBundledPolicyPacksTableShell
        rows={model.rows}
        loading={model.loading}
        updatingFile={model.updatingFile}
        nameFilter={model.nameFilter}
        setNameFilter={model.setNameFilter}
        categoryFilter={model.categoryFilter}
        setCategoryFilter={model.setCategoryFilter}
        filteredRows={model.filteredRows}
        hasActiveFilters={model.hasActiveFilters}
        openActivationConfirm={model.openActivationConfirm}
      />

      {model.pendingActivation !== null ? (
        <PlatformBundledPolicyPackActivationConfirmDialog
          open={model.pendingActivation !== null}
          busy={model.updatingFile !== null}
          displayName={model.pendingActivation.row.displayName}
          mode={model.pendingActivation.nextActive ? "activate" : "deactivate"}
          acknowledgment={model.deactivateAcknowledgment}
          onAcknowledgmentChange={model.setDeactivateAcknowledgment}
          onCancel={model.cancelPendingActivation}
          onConfirm={() => {
            void model.confirmPendingActivation();
          }}
        />
      ) : null}
    </OperatorPageContainer>
  );
}
