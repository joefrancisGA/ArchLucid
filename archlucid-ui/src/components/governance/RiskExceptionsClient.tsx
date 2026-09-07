"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

import { GovernanceApprovalStatusBanner } from "@/components/governance/GovernanceApprovalStatusBanner";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { LayerHeader } from "@/components/LayerHeader";
import { RiskExceptionsBreadcrumb } from "@/app/(operator)/governance/exceptions/_sections/RiskExceptionsBreadcrumb";
import { RiskExceptionsBuyerChrome } from "@/app/(operator)/governance/exceptions/_sections/RiskExceptionsBuyerChrome";
import { RiskExceptionsLoadFailure } from "@/app/(operator)/governance/exceptions/_sections/RiskExceptionsLoadFailure";
import { RiskExceptionsLoadingSkeleton } from "@/app/(operator)/governance/exceptions/_sections/RiskExceptionsLoadingSkeleton";
import { riskExceptionsPageSubtitle } from "@/app/(operator)/governance/exceptions/risk-exceptions-page-copy";
import { GOVERNANCE_EXCEPTIONS_PATH } from "@/lib/governance/governance-route-paths";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { RiskExceptionsFindingsVocabularyRail } from "@/components/RiskExceptionsFindingsVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  BUYER_RISK_EXCEPTIONS_EMPTY_BODY,
  BUYER_RISK_EXCEPTIONS_EMPTY_TERTIARY_ACTION,
  BUYER_RISK_EXCEPTIONS_EMPTY_TITLE,
  BUYER_RISK_EXCEPTIONS_PAGE_TITLE,
  BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION,
} from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { RiskExceptionsTriageFirstExpiringStrip } from "@/components/governance/RiskExceptionsTriageFirstExpiringStrip";
import { RiskExceptionsPickReviewBeforeRenewStrip } from "@/components/governance/RiskExceptionsPickReviewBeforeRenewStrip";
import { RiskExceptionsNextReviewFooterClient } from "@/components/governance/RiskExceptionsNextReviewFooterClient";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { RiskExceptionsContinueLastViewedRow } from "@/components/governance/RiskExceptionsContinueLastViewedRow";
import {
  RISK_EXCEPTIONS_EMPTY_BODY,
  RISK_EXCEPTIONS_EMPTY_TITLE,
  RISK_EXCEPTIONS_EXPIRING_WARNING,
  RISK_EXCEPTIONS_PAGE_TITLE,
} from "@/lib/risk-exceptions-page";
import { RISK_EXCEPTIONS_CLAIM_DISCIPLINE } from "@/lib/risk-exceptions-evidence-copy";

import { RiskExceptionsRevokeConfirm } from "./RiskExceptionsRenewPanel";
import { RiskExceptionsTable } from "./RiskExceptionsTable";
import { useRiskExceptionsClient } from "./use-risk-exceptions-client";

/** TB-226 — cross-finding risk exception (waiver) register with renew/revoke. */
export default function RiskExceptionsClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const {
    scopedRunId,
    scopedRunFilterActive,
    canMutate,
    mutationDisabledHintId,
    mutationDisabledReason,
    records,
    scopedRecords,
    loadError,
    busyId,
    renewingId,
    setRenewingId,
    renewExpiresAtUtc,
    setRenewExpiresAtUtc,
    renewRationale,
    setRenewRationale,
    pendingRevoke,
    setPendingRevoke,
    loading,
    retryingLoad,
    handleRetryLoad,
    expiringSoonCount,
    triageFirstExpiringTarget,
    continueLastException,
    riskExceptionsRenewChecklistSteps,
    riskExceptionsRenewChecklistEmphasizedStepId,
    onPickReviewForRenew,
    submitRenew,
    submitRevoke,
    onTriageExtend,
    onContinueLastOpen,
    onStartRenew,
  } = useRiskExceptionsClient();

  const pageTitle = buyerPolishedShell ? BUYER_RISK_EXCEPTIONS_PAGE_TITLE : RISK_EXCEPTIONS_PAGE_TITLE;
  const pageSubtitle = riskExceptionsPageSubtitle(buyerPolishedShell);

  return (
    <OperatorPageContainer variant="dashboard">
      {buyerPolishedShell ? (
        <GovernanceApprovalStatusBanner className="mb-3" />
      ) : (
        <LayerHeader pageKey="exceptions" density="compact" className="mb-3" />
      )}

      <OperatorPageHeader
        navHref={GOVERNANCE_EXCEPTIONS_PATH}
        title={pageTitle}
        subtitle={pageSubtitle}
        claimDiscipline={RISK_EXCEPTIONS_CLAIM_DISCIPLINE}
        claimDisciplineTestId="risk-exceptions-claim-discipline"
        breadcrumb={buyerPolishedShell ? <RiskExceptionsBreadcrumb /> : undefined}
        actions={<PageContextualHelpButton />}
      />
      <RiskExceptionsBuyerChrome />
      {buyerPolishedShell ? null : (
        <RiskExceptionsFindingsVocabularyRail currentSurfaceId="risk-exceptions" />
      )}
      <div className={cn("mt-4", OPERATOR_LAYOUT.sectionStack)}>
        {loading ? <RiskExceptionsLoadingSkeleton /> : null}

        {loadError && buyerPolishedShell ? (
          <RiskExceptionsLoadFailure
            message={loadError}
            retrying={retryingLoad}
            onRetry={handleRetryLoad}
          />
        ) : null}

        {loadError && !buyerPolishedShell ? (
          <OperatorSectionLoadFailure
            message={loadError}
            retrying={retryingLoad}
            testId="risk-exceptions-load-failure"
            onRetry={handleRetryLoad}
          />
        ) : null}

        {!loading && !loadError && expiringSoonCount > 0 ? (
          <div
            className={cn(
              "rounded-md border border-l-4 border-neutral-200 border-l-[var(--al-status-warn-fg)] bg-[var(--al-status-warn-bg)] px-4 py-3 text-neutral-800 dark:border-neutral-700 dark:text-neutral-200",
              OPERATOR_TYPOGRAPHY.body,
            )}
            data-testid="risk-exceptions-expiring-warning"
            role="status"
          >
            {expiringSoonCount} risk exception{expiringSoonCount === 1 ? "" : "s"} {RISK_EXCEPTIONS_EXPIRING_WARNING}
          </div>
        ) : null}

        {!loading && !loadError && records.length === 0 ? (
          <EnterpriseCompactEmptyState
            testId="risk-exceptions-empty-state"
            title={buyerPolishedShell ? BUYER_RISK_EXCEPTIONS_EMPTY_TITLE : RISK_EXCEPTIONS_EMPTY_TITLE}
            description={buyerPolishedShell ? BUYER_RISK_EXCEPTIONS_EMPTY_BODY : RISK_EXCEPTIONS_EMPTY_BODY}
            actions={[
              { label: "Open findings", href: "/governance/findings", variant: "primary" },
              {
                label: buyerPolishedShell ? BUYER_RISK_REGISTER_EMPTY_SECONDARY_ACTION : "Open approval",
                href: "/governance/approval-queue",
                variant: "outline",
              },
            ]}
            footer={
              <Link className={OPERATOR_LINK.optional} href="/architecture/reviews/new">
                {buyerPolishedShell ? BUYER_RISK_EXCEPTIONS_EMPTY_TERTIARY_ACTION : CREATE_ARCHITECTURE_LABEL}
              </Link>
            }
          />
        ) : !loading && !loadError ? (
          <>
            {scopedRunFilterActive ? (
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="risk-exceptions-run-scope-banner"
              >
                {"Showing exceptions for review "}
                <span className="font-mono text-al-text-primary">{scopedRunId}</span>
                {" · "}
                <Link className={OPERATOR_LINK.inline} href={GOVERNANCE_EXCEPTIONS_PATH}>
                  Clear review scope
                </Link>
                {" · "}
                <Link
                  className={OPERATOR_LINK.inline}
                  href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
                >
                  Open review
                </Link>
              </p>
            ) : (
              <RiskExceptionsPickReviewBeforeRenewStrip
                selectedReviewId=""
                onSelectReview={onPickReviewForRenew}
              />
            )}
            {scopedRunFilterActive ? (
              <IntegrationConnectChecklist
                title="Renew checklist"
                steps={riskExceptionsRenewChecklistSteps}
                emphasizedStepId={riskExceptionsRenewChecklistEmphasizedStepId}
                testIdPrefix="risk-exceptions-renew"
              />
            ) : null}
            {scopedRunFilterActive ? (
              <>
            {continueLastException !== null ? (
              <RiskExceptionsContinueLastViewedRow
                target={continueLastException}
                onOpen={onContinueLastOpen}
              />
            ) : null}
            {triageFirstExpiringTarget !== null ? (
              <RiskExceptionsTriageFirstExpiringStrip
                target={triageFirstExpiringTarget}
                onExtend={onTriageExtend}
              />
            ) : null}
            <WhyDisabledCtaHint
              id={mutationDisabledHintId}
              reason={mutationDisabledReason}
              testId={mutationDisabledHintId}
            />
            <RiskExceptionsTable
              scopedRecords={scopedRecords}
              renewingId={renewingId}
              busyId={busyId}
              canMutate={canMutate}
              mutationDisabledHintId={mutationDisabledHintId}
              mutationDisabledReason={mutationDisabledReason}
              renewExpiresAtUtc={renewExpiresAtUtc}
              onRenewExpiresAtUtcChange={setRenewExpiresAtUtc}
              renewRationale={renewRationale}
              onRenewRationaleChange={setRenewRationale}
              onSubmitRenew={(record) => void submitRenew(record)}
              onCancelRenew={() => setRenewingId(null)}
              onStartRenew={onStartRenew}
              onRequestRevoke={setPendingRevoke}
            />
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {scopedRunFilterActive ? <RiskExceptionsNextReviewFooterClient runId={scopedRunId} /> : null}

      <RiskExceptionsRevokeConfirm
        pendingRevoke={pendingRevoke}
        busyId={busyId}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRevoke(null);
          }
        }}
        onConfirm={(record) => {
          void submitRevoke(record).finally(() => {
            setPendingRevoke(null);
          });
        }}
      />
    </OperatorPageContainer>
  );
}
