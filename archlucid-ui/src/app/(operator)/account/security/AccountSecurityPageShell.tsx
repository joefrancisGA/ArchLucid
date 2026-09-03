"use client";

import Link from "next/link";

import { AccountSecurityAuthDomainsVocabularyRail } from "@/components/AccountSecurityAuthDomainsVocabularyRail";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { AccountSecuritySettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OPERATOR_LAYOUT } from "@/lib/design-tokens";
import {
  ACCOUNT_SECURITY_FIRST_VIEWPORT_TEST_ID,
  ACCOUNT_SECURITY_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  ACCOUNT_SECURITY_PAGE_TITLE,
  ACCOUNT_SECURITY_PRIMARY_CONTENT_ID,
  ACCOUNT_SECURITY_SKIP_LINK_LABEL,
  ACCOUNT_SECURITY_SKIP_TARGET_ID,
  accountSecurityPageSubtitle,
} from "@/lib/account-security-page-copy";
import { ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE } from "@/lib/account-security-settings-evidence-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";
import type { AccountSecurityPageController } from "./use-account-security-page";
import { AccountSecurityAddEmailForm } from "./AccountSecurityAddEmailForm";
import { AccountSecurityFeedbackCallout } from "./AccountSecurityFeedbackCallout";
import { AccountSecurityRemoveDialog } from "./AccountSecurityRemoveDialog";
import { AccountSecuritySignInMethodsList } from "./AccountSecuritySignInMethodsList";

type AccountSecurityPageShellProps = {
  readonly controller: AccountSecurityPageController;
};

export function AccountSecurityPageShell(props: AccountSecurityPageShellProps) {
  const controller = props.controller;
  const {
    buyerPolishedShell,
    loading,
    listLoaded,
    methods,
    blockedForAuth,
    showRecentAuthGateCallout,
    busy,
    listFeedback,
    authBlockedEmptyProps,
    gateProblem,
    addEmail,
    setAddEmail,
    emailTouched,
    setEmailTouched,
    emailValid,
    challengeId,
    verificationCode,
    setVerificationCode,
    codeValid,
    pendingProposal,
    proposalRemainingMs,
    proposalExpired,
    resendCooldownMs,
    addFeedback,
    methodToRemove,
    setMethodToRemove,
    accountSecuritySignInAgainHref,
    problemToFeedback,
    refreshMethods,
    resetAddFlow,
    handleRequestEmailChallenge,
    handleVerifyEmailChallenge,
    handleConfirmProposal,
    handleCancelProposal,
    handleConfirmRemove,
    setAddFeedback,
  } = controller;

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="account-security-page">
      <a
        href={`#${ACCOUNT_SECURITY_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {ACCOUNT_SECURITY_SKIP_LINK_LABEL}
      </a>

      <div
        id={ACCOUNT_SECURITY_PRIMARY_CONTENT_ID}
        data-testid={ACCOUNT_SECURITY_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          title={ACCOUNT_SECURITY_PAGE_TITLE}
          subtitle={accountSecurityPageSubtitle(buyerPolishedShell)}
          titleTestId="account-security-page-title"
          claimDiscipline={ACCOUNT_SECURITY_SETTINGS_CLAIM_DISCIPLINE}
          claimDisciplineTestId={ACCOUNT_SECURITY_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          actions={buyerPolishedShell ? null : <PageContextualHelpButton />}
        />

        <div
          id={ACCOUNT_SECURITY_SKIP_TARGET_ID}
          data-testid={ACCOUNT_SECURITY_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          {!buyerPolishedShell ? (
            <AccountSecurityAuthDomainsVocabularyRail currentSurfaceId="account-security" />
          ) : null}
          {showRecentAuthGateCallout && gateProblem !== null ? (
            <AccountSecurityFeedbackCallout
              feedback={problemToFeedback(gateProblem)}
              testId="account-security-auth-gate"
              actions={
                <Button type="button" size="sm" variant="primary" asChild>
                  <Link href={accountSecuritySignInAgainHref()}>Sign in again</Link>
                </Button>
              }
            />
          ) : null}

          <AccountSecuritySignInMethodsList
            loading={loading}
            listLoaded={listLoaded}
            methods={methods}
            blockedForAuth={blockedForAuth}
            showRecentAuthGateCallout={showRecentAuthGateCallout}
            busy={busy}
            listFeedback={listFeedback}
            authBlockedEmptyProps={authBlockedEmptyProps}
            onRefresh={() => {
              void refreshMethods();
            }}
            onRemoveMethod={setMethodToRemove}
          />

          {!blockedForAuth ? (
            <AccountSecurityAddEmailForm
              busy={busy}
              addEmail={addEmail}
              emailTouched={emailTouched}
              emailValid={emailValid}
              challengeId={challengeId}
              verificationCode={verificationCode}
              codeValid={codeValid}
              pendingProposal={pendingProposal}
              proposalRemainingMs={proposalRemainingMs}
              proposalExpired={proposalExpired}
              resendCooldownMs={resendCooldownMs}
              addFeedback={addFeedback}
              onAddEmailChange={setAddEmail}
              onEmailBlur={() => {
                setEmailTouched(true);
              }}
              onVerificationCodeChange={setVerificationCode}
              onRequestEmailChallenge={() => {
                void handleRequestEmailChallenge();
              }}
              onVerifyEmailChallenge={() => {
                void handleVerifyEmailChallenge();
              }}
              onConfirmProposal={() => {
                void handleConfirmProposal();
              }}
              onCancelProposal={() => {
                void handleCancelProposal();
              }}
              onResetAddFlow={resetAddFlow}
              onClearAddFeedback={() => {
                setAddFeedback(null);
              }}
            />
          ) : null}
        </div>

        <div data-testid="account-security-orientation-bottom">
          <AccountSecuritySettingsEvidenceOrientationStrip />
        </div>
      </div>

      <AccountSecurityRemoveDialog
        method={methodToRemove}
        busy={busy}
        onCancel={() => {
          setMethodToRemove(null);
        }}
        onConfirm={() => {
          void handleConfirmRemove();
        }}
      />
    </OperatorPageContainer>
  );
}
