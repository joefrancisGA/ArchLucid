"use client";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { AlertsInboxAlertListSection } from "@/components/alerts/AlertsInboxAlertListSection";
import { AlertsInboxControls } from "@/components/alerts/AlertsInboxControls";
import { AlertsInboxDialogsDeferred } from "@/components/alerts/alerts-inbox-deferred-chunks";
import { AlertRulesAlertsInboxVocabularyRail } from "@/components/AlertRulesAlertsInboxVocabularyRail";
import { AlertsFindingsVocabularyRail } from "@/components/AlertsFindingsVocabularyRail";
import { AlertsInboxPageIntro } from "@/components/alerts/AlertsInboxPageIntro";
import { AlertsInboxSummaryRow } from "@/components/alerts/AlertsInboxSummaryRow";
import { useAlertsInboxController } from "@/components/alerts/use-alerts-inbox-controller";
import type { AlertsInboxPageModel } from "@/app/(operator)/governance/alerts/_sections/alerts-inbox-page-model";

export type AlertsInboxInteractiveClientProps = {
  /** Server-loaded inbox snapshot for first paint (TB-564). */
  initialModel?: AlertsInboxPageModel | null;
};

export function AlertsInboxInteractiveClient({ initialModel = null }: AlertsInboxInteractiveClientProps = {}) {
  const controller = useAlertsInboxController(initialModel);

  return (
    <OperatorPageContainer variant="dashboard">
      <AlertsInboxPageIntro
        canMutateAlertInbox={controller.canMutateAlertInbox}
        buyerPolishedShell={controller.buyerPolishedShell}
        failure={controller.failure}
        onRetry={() => {
          void controller.load();
        }}
      />

      {!controller.buyerPolishedShell ? (
        <>
          <AlertRulesAlertsInboxVocabularyRail currentSurfaceId="alerts-inbox" />
          <AlertsFindingsVocabularyRail currentSurfaceId="alerts-inbox" />
        </>
      ) : null}

      <AlertsInboxSummaryRow
        summary={controller.summaryCounts}
        loading={controller.summaryLoading}
        hasAlertRules={controller.workspaceContext.hasAlertRules}
        workspaceContextLoading={controller.workspaceContext.loading}
      />

      <AlertsInboxControls
        status={controller.status}
        page={controller.page}
        loading={controller.loading}
        buyerPolishedShell={controller.buyerPolishedShell}
        canMutateAlertInbox={controller.canMutateAlertInbox}
        visibleAlertCount={controller.visibleAlerts.length}
        selectedAlertCount={controller.selectedAlertIds.length}
        batchAckBusy={controller.batchAckBusy}
        allVisibleSelected={controller.allVisibleSelected}
        pageMixSummary={controller.pageMixSummary}
        hasLoadFailure={controller.failure !== null}
        lastRefreshedUtc={controller.lastRefreshedUtc}
        hasAlertRules={controller.workspaceContext.hasAlertRules}
        workspaceContextLoading={controller.workspaceContext.loading}
        onStatusChange={controller.changeStatusFilter}
        onRefresh={() => {
          void controller.load();
        }}
        onAcknowledgeSelected={() => {
          void controller.onAcknowledgeSelected();
        }}
        onToggleSelectAllVisible={controller.toggleSelectAllVisible}
      />

      <AlertsInboxAlertListSection controller={controller} emptyFilteredProps={controller.emptyFilteredProps} />

      <AlertsInboxDialogsDeferred
        triage={{
          pendingAction: controller.pendingAction,
          actionComment: controller.actionComment,
          actionBusy: controller.actionBusy,
          canMutateAlertInbox: controller.canMutateAlertInbox,
          onActionCommentChange: controller.setActionComment,
          onClose: controller.clearPendingAction,
          onConfirm: () => {
            void controller.onConfirmActionDialog();
          },
        }}
        actionLoop={{
          actionLoopAlertId: controller.actionLoopAlertId,
          actionLoopFindingHref: controller.actionLoopFindingHref,
          actionLoopData: controller.actionLoopData,
          actionLoopLoading: controller.actionLoopLoading,
          actionLoopError: controller.actionLoopError,
          onClose: controller.closeActionLoopDialog,
        }}
      />
    </OperatorPageContainer>
  );
}

