"use client";

import Link from "next/link";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { AlertsInboxPickReviewBeforeTriageStrip } from "@/components/alerts/AlertsInboxPickReviewBeforeTriageStrip";
import { AlertsInboxNextReviewFooterClient } from "@/components/alerts/AlertsInboxNextReviewFooterClient";
import { AlertsInboxAlertListSection } from "@/components/alerts/AlertsInboxAlertListSection";
import { AlertsInboxControls } from "@/components/alerts/AlertsInboxControls";
import { AlertsInboxDialogsDeferred } from "@/components/alerts/alerts-inbox-deferred-chunks";
import { AlertRulesAlertsInboxVocabularyRail } from "@/components/AlertRulesAlertsInboxVocabularyRail";
import { AlertsFindingsVocabularyRail } from "@/components/AlertsFindingsVocabularyRail";
import { AlertsInboxPageIntro } from "@/components/alerts/AlertsInboxPageIntro";
import { AlertsInboxSummaryRow } from "@/components/alerts/AlertsInboxSummaryRow";
import { useAlertsInboxController } from "@/components/alerts/use-alerts-inbox-controller";
import type { AlertsInboxPageModel } from "@/app/(operator)/governance/alerts/_sections/alerts-inbox-page-model";
import { GOVERNANCE_ALERTS_PATH } from "@/lib/governance/governance-route-paths";
import {
  resolveAlertsInboxTriageEmphasizedStepId,
  resolveAlertsInboxTriageSteps,
} from "@/lib/alerts-inbox-triage-checklist";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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

      {controller.scopedRunFilterActive ? (
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alerts-inbox-run-scope-banner"
        >
          {"Showing alerts for review "}
          <span className="font-mono text-al-text-primary">{controller.scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_LINK.inline} href={GOVERNANCE_ALERTS_PATH}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_LINK.inline}
            href={`/architecture/reviews/${encodeURIComponent(controller.scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      ) : (
        <AlertsInboxPickReviewBeforeTriageStrip
          selectedReviewId=""
          onSelectReview={controller.onPickReviewForTriage}
        />
      )}

      {controller.scopedRunFilterActive ? (
        <>
          <IntegrationConnectChecklist
            title="Triage checklist"
            steps={resolveAlertsInboxTriageSteps({
              reviewPicked: true,
              alertSelected: controller.selectedAlertIds.length > 0,
              triageActionComplete: controller.visibleAlerts.some((alert) => alert.status !== "Open"),
            })}
            emphasizedStepId={resolveAlertsInboxTriageEmphasizedStepId({
              reviewPicked: true,
              alertSelected: controller.selectedAlertIds.length > 0,
              triageActionComplete: controller.visibleAlerts.some((alert) => alert.status !== "Open"),
            })}
            testIdPrefix="alerts-inbox-triage"
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
        </>
      ) : null}

      {controller.scopedRunFilterActive ? (
        <AlertsInboxNextReviewFooterClient runId={controller.scopedRunId} />
      ) : null}
    </OperatorPageContainer>
  );
}

