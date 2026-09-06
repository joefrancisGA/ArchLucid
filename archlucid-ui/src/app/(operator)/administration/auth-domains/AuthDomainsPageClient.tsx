"use client";

import Link from "next/link";
import { Fingerprint } from "lucide-react";
import { useMemo } from "react";

import { AuthDomainsSettingsBuyerChrome } from "@/app/(operator)/administration/auth-domains/AuthDomainsSettingsBuyerChrome";
import { AuthDomainsActionConfirmDialog } from "@/app/(operator)/administration/auth-domains/AuthDomainsActionConfirmDialog";
import { AuthDomainsDomainListPanel } from "@/app/(operator)/administration/auth-domains/AuthDomainsDomainListPanel";
import { AuthDomainsEnforcementPanel } from "@/app/(operator)/administration/auth-domains/AuthDomainsEnforcementPanel";
import { AuthDomainsVerificationPanel } from "@/app/(operator)/administration/auth-domains/AuthDomainsVerificationPanel";
import { useAuthDomainsPage } from "@/app/(operator)/administration/auth-domains/use-auth-domains-page";
import { AuthDomainsIdentityProvidersVocabularyRail } from "@/components/AuthDomainsIdentityProvidersVocabularyRail";
import { AuthDomainsSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusTag } from "@/components/ui/status-tag";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { AUTH_DOMAINS_ZERO_DOMAIN_ENFORCEMENT_CALLOUT } from "@/lib/auth-domains-confirm-copy";
import {
  AUTH_DOMAINS_AUTHENTICATION_HELP_CTA,
  AUTH_DOMAINS_JOURNEY_STEPS,
  AUTH_DOMAINS_PAGE_TITLE,
  authDomainsJourneyStepAriaLabel,
} from "@/lib/auth-domains-page-copy";
import {
  AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE,
} from "@/lib/auth-domains-settings-evidence-copy";
import {
  AUTH_DOMAINS_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  AUTH_DOMAINS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  AUTH_DOMAINS_SETTINGS_PRIMARY_CONTENT_ID,
  AUTH_DOMAINS_SETTINGS_SKIP_LINK_LABEL,
  AUTH_DOMAINS_SETTINGS_SKIP_TARGET_ID,
  AUTH_DOMAINS_SETTINGS_BUYER_START_HERE_HELPER,
  AUTH_DOMAINS_SETTINGS_PAGE_LEAD,
  AUTH_DOMAINS_SETTINGS_START_HERE_CARD_TITLE,
  authDomainsPageSubtitle,
} from "@/lib/auth-domains-settings-page-copy";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_AUTH_DOMAINS_PATH } from "@/lib/settings-admin-route-paths";
import { cn } from "@/lib/utils";
import {
  resolveContinueLastAuthDomain,
  writeAuthDomainLastViewedId,
} from "@/lib/resolve-continue-last-auth-domain";

export function AuthDomainsPageClient() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const {
    domains,
    selectedDomain,
    setSelectedDomain,
    recoveryAdmins,
    readiness,
    sessionAcknowledged,
    setSessionAcknowledged,
    newDomain,
    setNewDomain,
    setNewDomainTouched,
    testEmail,
    setTestEmail,
    recoveryEmail,
    setRecoveryEmail,
    dnsInstruction,
    setDnsInstruction,
    statusMessage,
    errorState,
    loading,
    busy,
    pendingConfirm,
    setPendingConfirm,
    currentWorkspaceLabel,
    newDomainInputRef,
    tenantScopeLine,
    adminAuthorityPresentation,
    adminAuthorityDisabledReason,
    mutationsBlocked,
    signInPosture,
    newDomainValid,
    showNewDomainFormatError,
    selected,
    currentJourneyStep,
    handleProposeDomain,
    runForSelected,
    handlePreviewRouting,
    handleMarkRoutingTested,
    requestEnableEnforcement,
    requestSetEnforcementMode,
    handleConfirmPendingAction,
    handleRemoveRecoveryAdmin,
    handleAddRecoveryAdmin,
    scrollToJourneySection,
  } = useAuthDomainsPage();

  const continueLastDomain = useMemo(() => resolveContinueLastAuthDomain(domains), [domains]);

  function openDomain(normalizedDomain: string): void {
    writeAuthDomainLastViewedId(normalizedDomain);
    setSelectedDomain(normalizedDomain);
    window.setTimeout(() => {
      document
        .querySelector(`[data-auth-domain="${CSS.escape(normalizedDomain)}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      document.querySelector<HTMLButtonElement>('[data-testid="auth-domains-check-dns"]')?.focus();
    }, 0);
  }

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="auth-domains-page">
      <a
        href={`#${AUTH_DOMAINS_SETTINGS_SKIP_TARGET_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {AUTH_DOMAINS_SETTINGS_SKIP_LINK_LABEL}
      </a>

      <div
        id={AUTH_DOMAINS_SETTINGS_PRIMARY_CONTENT_ID}
        data-testid={AUTH_DOMAINS_SETTINGS_PRIMARY_CONTENT_ID}
        className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}
      >
        <OperatorPageHeader
          navHref={SETTINGS_AUTH_DOMAINS_PATH}
          icon={Fingerprint}
          title={AUTH_DOMAINS_PAGE_TITLE}
          subtitle={authDomainsPageSubtitle(buyerPolishedShell)}
          titleTestId="auth-domains-page-title"
          claimDiscipline={AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE}
          claimDisciplineTestId={AUTH_DOMAINS_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID}
          metadata={
            <>
              <span data-testid="auth-domains-tenant-scope">{tenantScopeLine}</span>
              <StatusTag
                kind={adminAuthorityPresentation.kind}
                label={adminAuthorityPresentation.label}
                data-testid="auth-domains-admin-authority-tag"
              />
            </>
          }
          actions={
            buyerPolishedShell ? null : (
              <div className="flex flex-wrap items-center gap-2">
                <Button type="button" size="sm" variant="outline" asChild>
                  <Link
                    href={inAppHelpHref("authentication-sign-in")}
                    data-testid="auth-domains-authentication-help"
                  >
                    {AUTH_DOMAINS_AUTHENTICATION_HELP_CTA}
                  </Link>
                </Button>
                <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
              </div>
            )
          }
        />

        <WhyDisabledCtaHint
          reason={adminAuthorityDisabledReason}
          testId="auth-domains-admin-authority-disabled-hint"
        />

        <div
          id={AUTH_DOMAINS_SETTINGS_SKIP_TARGET_ID}
          data-testid={AUTH_DOMAINS_SETTINGS_FIRST_VIEWPORT_TEST_ID}
          className={cn(
            "scroll-mt-24 border-b border-neutral-200 pb-6 dark:border-neutral-800",
            OPERATOR_LAYOUT.sectionStack,
          )}
        >
          {buyerPolishedShell ? (
            <div className="space-y-4" data-testid="auth-domains-buyer-first-viewport-intro">
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
                data-testid="auth-domains-settings-intro"
              >
                {AUTH_DOMAINS_SETTINGS_PAGE_LEAD}
              </p>
              <section
                className="space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
                data-testid="auth-domains-settings-start-here-panel"
                aria-labelledby="auth-domains-settings-start-here-heading"
              >
                <h2
                  id="auth-domains-settings-start-here-heading"
                  className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.sectionTitle)}
                >
                  {AUTH_DOMAINS_SETTINGS_START_HERE_CARD_TITLE}
                </h2>
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="auth-domains-settings-buyer-start-here-helper"
                >
                  {AUTH_DOMAINS_SETTINGS_BUYER_START_HERE_HELPER}
                </p>
              </section>
            </div>
          ) : null}

          {!loading && errorState === null ? (
            <>
              <div
                className="flex flex-wrap items-start gap-2"
                data-testid="auth-domains-sign-in-posture"
              >
                <StatusTag
                  kind={signInPosture.kind}
                  label={signInPosture.label}
                  data-testid="auth-domains-sign-in-posture-tag"
                />
                <p className={cn("m-0 flex-1 min-w-[12rem] text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {signInPosture.detail}
                </p>
              </div>

              {domains.length === 0 ? (
                <div
                  className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="auth-domains-zero-domain-enforcement-callout"
                >
                  {AUTH_DOMAINS_ZERO_DOMAIN_ENFORCEMENT_CALLOUT}
                </div>
              ) : null}
            </>
          ) : null}

          <nav aria-label="Sign-in domain workflow" data-testid="auth-domains-journey-strip">
            <ol className="m-0 flex flex-wrap gap-2 p-0 list-none">
              {AUTH_DOMAINS_JOURNEY_STEPS.map((step, index) => {
                const isCurrent = step.id === currentJourneyStep;

                return (
                  <li key={step.id}>
                    <button
                      type="button"
                      className={cn(
                        OPERATOR_LINK.stepPill,
                        isCurrent ? OPERATOR_LINK.stepPillCurrent : undefined,
                        "inline-flex items-center gap-1",
                      )}
                      data-testid={`auth-domains-journey-step-${step.id}`}
                      aria-current={isCurrent ? "step" : undefined}
                      aria-label={authDomainsJourneyStepAriaLabel(index, step.label)}
                      onClick={() => scrollToJourneySection(step.id)}
                    >
                      <span aria-hidden="true">{index + 1}.</span>
                      {step.label}
                    </button>
                  </li>
                );
              })}
            </ol>
          </nav>

          {buyerPolishedShell ? null : (
            <AuthDomainsIdentityProvidersVocabularyRail currentSurfaceId="auth-domains" variant="compact" />
          )}

          {statusMessage !== null ? (
            <p
              className={cn(DESIGN_TOKENS.callout.success, OPERATOR_TYPOGRAPHY.body)}
              role="status"
              data-testid="auth-domains-status-message"
            >
              {statusMessage}
            </p>
          ) : null}

          {errorState !== null ? (
            <OperatorMutationInlineError
              message={errorState.summary}
              recoveryPresentation={errorState.recovery}
              testId="auth-domains-inline-error"
            />
          ) : null}

          <AuthDomainsDomainListPanel
            loading={loading}
            domains={domains}
            selectedDomain={selectedDomain ?? ""}
            setSelectedDomain={setSelectedDomain}
            setDnsInstruction={setDnsInstruction}
            newDomain={newDomain}
            setNewDomain={setNewDomain}
            setNewDomainTouched={setNewDomainTouched}
            newDomainInputRef={newDomainInputRef}
            showNewDomainFormatError={showNewDomainFormatError}
            mutationsBlocked={mutationsBlocked}
            newDomainValid={newDomainValid}
            handleProposeDomain={handleProposeDomain}
            continueLastDomain={continueLastDomain}
            onOpenDomain={openDomain}
            hideDomainMutations={buyerPolishedShell}
          />

          {selected !== null ? (
            <Card data-testid="auth-domains-detail-card">
              <CardHeader>
                <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{selected.displayDomain}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AuthDomainsVerificationPanel
                  selected={selected}
                  dnsInstruction={dnsInstruction}
                  mutationsBlocked={mutationsBlocked}
                  testEmail={testEmail}
                  setTestEmail={setTestEmail}
                  runForSelected={runForSelected}
                  handlePreviewRouting={handlePreviewRouting}
                  handleMarkRoutingTested={handleMarkRoutingTested}
                />
                <AuthDomainsEnforcementPanel
                  selected={selected}
                  readiness={readiness}
                  sessionAcknowledged={sessionAcknowledged}
                  setSessionAcknowledged={setSessionAcknowledged}
                  mutationsBlocked={mutationsBlocked}
                  recoveryAdmins={recoveryAdmins}
                  recoveryEmail={recoveryEmail}
                  setRecoveryEmail={setRecoveryEmail}
                  requestSetEnforcementMode={requestSetEnforcementMode}
                  requestEnableEnforcement={requestEnableEnforcement}
                  handleRemoveRecoveryAdmin={handleRemoveRecoveryAdmin}
                  handleAddRecoveryAdmin={handleAddRecoveryAdmin}
                />
              </CardContent>
            </Card>
          ) : null}
        </div>

        {buyerPolishedShell ? (
          <AuthDomainsSettingsBuyerChrome />
        ) : (
          <div data-testid="auth-domains-orientation-bottom">
            <AuthDomainsSettingsEvidenceOrientationStrip />
          </div>
        )}
      </div>

      <AuthDomainsActionConfirmDialog
        pending={pendingConfirm}
        currentWorkspaceLabel={currentWorkspaceLabel}
        busy={busy}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleConfirmPendingAction()}
      />
    </OperatorPageContainer>
  );
}
