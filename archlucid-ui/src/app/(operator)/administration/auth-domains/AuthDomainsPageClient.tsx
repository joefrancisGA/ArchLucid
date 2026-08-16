"use client";

import Link from "next/link";
import { Fingerprint } from "lucide-react";

import { AuthDomainsActionConfirmDialog } from "@/app/(operator)/administration/auth-domains/AuthDomainsActionConfirmDialog";
import { useAuthDomainsPage } from "@/app/(operator)/administration/auth-domains/use-auth-domains-page";
import { AuthDomainsIdentityProvidersVocabularyRail } from "@/components/AuthDomainsIdentityProvidersVocabularyRail";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { AuthDomainsSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { BooleanStatusChip } from "@/components/ui/boolean-status-chip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  checkTenantAuthDomainVerification,
  startTenantAuthDomainVerification,
} from "@/lib/admin-auth-domains-api";
import { AUTH_DOMAINS_ENFORCEMENT_WARNING, AUTH_DOMAINS_ZERO_DOMAIN_ENFORCEMENT_CALLOUT } from "@/lib/auth-domains-confirm-copy";
import {
  authDomainEnforcementModeKind,
  authDomainVerificationStatusKind,
  labelForAuthDomainEnforcementMode,
  labelForAuthDomainVerificationStatus,
} from "@/lib/auth-domains-enum-labels";
import {
  AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_ITEMS,
  AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_TITLE,
  AUTH_DOMAINS_ADD_DOMAIN_READINESS,
  AUTH_DOMAINS_AUTHENTICATION_HELP_CTA,
  AUTH_DOMAINS_DOMAIN_FORMAT_ERROR,
  AUTH_DOMAINS_DOMAIN_LABEL,
  AUTH_DOMAINS_EMPTY_DESCRIPTION,
  AUTH_DOMAINS_EMPTY_TITLE,
  AUTH_DOMAINS_JOURNEY_SECTION_IDS,
  AUTH_DOMAINS_JOURNEY_STEPS,
  AUTH_DOMAINS_PAGE_SUBTITLE,
  AUTH_DOMAINS_PAGE_TITLE,
  authDomainsJourneyStepAriaLabel,
} from "@/lib/auth-domains-page-copy";
import { DESIGN_TOKENS, OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_AUTH_DOMAINS_PATH } from "@/lib/settings-admin-route-paths";
import { cn } from "@/lib/utils";

export function AuthDomainsPageClient() {
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

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="auth-domains-page">
      <OperatorPageHeader
        navHref={SETTINGS_AUTH_DOMAINS_PATH}
        icon={Fingerprint}
        title={AUTH_DOMAINS_PAGE_TITLE}
        subtitle={AUTH_DOMAINS_PAGE_SUBTITLE}
        titleTestId="auth-domains-page-title"
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
        }
      />

      <AuthDomainsSettingsEvidenceOrientationStrip />

      <WhyDisabledCtaHint
        reason={adminAuthorityDisabledReason}
        testId="auth-domains-admin-authority-disabled-hint"
      />

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

      <AuthDomainsIdentityProvidersVocabularyRail currentSurfaceId="auth-domains" variant="compact" />

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

      <Card data-testid="auth-domains-main-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Sign-in domains</CardTitle>
        </CardHeader>
        <CardContent className={OPERATOR_LAYOUT.sectionStack}>
          <section
            id={AUTH_DOMAINS_JOURNEY_SECTION_IDS.add}
            tabIndex={-1}
            className="space-y-3 outline-none"
            data-testid="auth-domains-add-panel"
          >
            <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Add domain</h2>
            <div
              className={cn(DESIGN_TOKENS.callout.info, OPERATOR_TYPOGRAPHY.helper, "space-y-2")}
              data-testid="auth-domains-add-prerequisites"
            >
              <p className="m-0 font-medium text-al-text-primary">{AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_TITLE}</p>
              <ul className="m-0 list-disc space-y-1 pl-5">
                {AUTH_DOMAINS_ADD_DOMAIN_PREREQUISITES_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Entering a domain does not claim it. Add the DNS TXT record shown after you start verification.
            </p>
            <div className="space-y-2">
              <Label htmlFor="auth-domains-new-domain" className={OPERATOR_FORM_FIELD_LABEL_CLASS}>
                {AUTH_DOMAINS_DOMAIN_LABEL}
              </Label>
              <div className="flex flex-wrap items-start gap-3">
                <div className="min-w-[12rem] flex-1 space-y-1">
                  <Input
                    ref={newDomainInputRef}
                    id="auth-domains-new-domain"
                    value={newDomain}
                    onChange={(event) => {
                      setNewDomain(event.target.value);
                      setNewDomainTouched(true);
                    }}
                    onBlur={() => setNewDomainTouched(true)}
                    placeholder="example.com"
                    aria-invalid={showNewDomainFormatError}
                    aria-describedby={
                      showNewDomainFormatError
                        ? "auth-domains-new-domain-error auth-domains-add-readiness"
                        : "auth-domains-add-readiness"
                    }
                    data-testid="auth-domains-new-domain"
                  />
                  {showNewDomainFormatError ? (
                    <p
                      id="auth-domains-new-domain-error"
                      className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.helper)}
                      role="alert"
                    >
                      {AUTH_DOMAINS_DOMAIN_FORMAT_ERROR}
                    </p>
                  ) : null}
                  <p
                    id="auth-domains-add-readiness"
                    className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="auth-domains-add-readiness"
                  >
                    {AUTH_DOMAINS_ADD_DOMAIN_READINESS}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => void handleProposeDomain()}
                  disabled={mutationsBlocked || !newDomainValid}
                  data-testid="auth-domains-add"
                >
                  Add domain
                </Button>
              </div>
            </div>
          </section>

          <section
            id="auth-domains-journey-target-domains"
            tabIndex={-1}
            className="space-y-3 outline-none"
            data-testid="auth-domains-list-section"
          >
            <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Domains</h2>
            {loading ? <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Loading domains…</p> : null}
            {!loading && domains.length === 0 ? (
              <EnterpriseCompactEmptyState
                title={AUTH_DOMAINS_EMPTY_TITLE}
                description={AUTH_DOMAINS_EMPTY_DESCRIPTION}
                testId="auth-domains-empty-state"
              />
            ) : null}
            <ul className="space-y-2">
              {domains.map((row) => (
                <li key={row.normalizedDomain}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-md border px-3 py-2 text-left",
                      selectedDomain === row.normalizedDomain ? "border-teal-700 bg-al-surface-raised" : "border-neutral-200",
                    )}
                    onClick={() => {
                      setSelectedDomain(row.normalizedDomain);
                      setDnsInstruction(null);
                    }}
                    data-testid={`auth-domain-row-${row.normalizedDomain}`}
                  >
                    <div className="font-medium text-al-text-primary">{row.displayDomain}</div>
                    <div
                      className="flex flex-wrap items-center gap-2 pt-1"
                      data-testid={`auth-domain-status-${row.normalizedDomain}`}
                    >
                      <StatusTag
                        kind={authDomainVerificationStatusKind(row.verificationStatus)}
                        label={labelForAuthDomainVerificationStatus(row.verificationStatus)}
                        data-verification-status={row.verificationStatus}
                      />
                      <StatusTag
                        kind={authDomainEnforcementModeKind(row.enforcementMode)}
                        label={labelForAuthDomainEnforcementMode(row.enforcementMode)}
                        data-enforcement-mode={row.enforcementMode}
                      />
                      {row.isEnforcementActive ? (
                        <StatusTag kind="ready" label="Enforcement active" data-testid="auth-domain-enforcement-active" />
                      ) : null}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </CardContent>
      </Card>

      {selected !== null ? (
        <Card data-testid="auth-domains-detail-card">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{selected.displayDomain}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dnsInstruction !== null ? (
              <p
                className={cn(DESIGN_TOKENS.callout.info, OPERATOR_TYPOGRAPHY.helper)}
                data-testid="auth-domains-dns-instruction"
              >
                {dnsInstruction}
              </p>
            ) : null}

            <div
              id={AUTH_DOMAINS_JOURNEY_SECTION_IDS["verify-dns"]}
              tabIndex={-1}
              className="flex flex-wrap gap-2 outline-none"
            >
              <Button
                type="button"
                variant="secondary"
                disabled={mutationsBlocked}
                data-testid="auth-domains-start-verification"
                onClick={() => void runForSelected(startTenantAuthDomainVerification, "DNS verification started")}
              >
                Start verification
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={mutationsBlocked}
                data-testid="auth-domains-check-dns"
                onClick={() => void runForSelected(checkTenantAuthDomainVerification, "DNS verification checked")}
              >
                Check DNS verification
              </Button>
            </div>

            <div
              id={AUTH_DOMAINS_JOURNEY_SECTION_IDS["test-routing"]}
              tabIndex={-1}
              className="space-y-2 outline-none"
            >
              <label className={OPERATOR_TYPOGRAPHY.label} htmlFor="auth-domains-test-email">
                Routing test email
              </label>
              <Input
                id="auth-domains-test-email"
                value={testEmail}
                onChange={(event) => setTestEmail(event.target.value)}
                placeholder={`user@${selected.displayDomain}`}
                data-testid="auth-domains-test-email"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  disabled={mutationsBlocked}
                  data-testid="auth-domains-preview-routing"
                  onClick={() => void handlePreviewRouting()}
                >
                  Preview routing
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={mutationsBlocked}
                  data-testid="auth-domains-mark-routing-tested"
                  onClick={() => void handleMarkRoutingTested()}
                >
                  Mark routing tested
                </Button>
              </div>
            </div>

            <div
              id={AUTH_DOMAINS_JOURNEY_SECTION_IDS.enforce}
              tabIndex={-1}
              className="space-y-2 outline-none"
              data-testid="auth-domains-enforcement-checklist"
            >
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>Pre-enforcement checklist</p>
              <ul className="space-y-2">
                {(readiness?.checklist ?? []).map((item) => (
                  <li key={item.key} className="flex flex-wrap items-center gap-2">
                    <StatusTag
                      kind={item.complete ? "ready" : item.required ? "needs-attention" : "neutral"}
                      label={item.complete ? "Complete" : "Incomplete"}
                      data-testid={`auth-domains-checklist-${item.key}`}
                    />
                    <span className={OPERATOR_TYPOGRAPHY.body}>
                      {item.label}
                      {item.required ? "" : " (recommended)"}
                      {item.detail ? ` — ${item.detail}` : ""}
                    </span>
                  </li>
                ))}
                <li className="flex flex-wrap items-center gap-2">
                  <BooleanStatusChip
                    value={sessionAcknowledged}
                    trueLabel="Acknowledged"
                    falseLabel="Not acknowledged"
                    data-testid="auth-domains-session-ack-status"
                  />
                  <span className={OPERATOR_TYPOGRAPHY.body}>Current session acknowledged</span>
                </li>
              </ul>
              <label className={cn("flex items-center gap-2", OPERATOR_TYPOGRAPHY.body)}>
                <input
                  type="checkbox"
                  checked={sessionAcknowledged}
                  onChange={(event) => setSessionAcknowledged(event.target.checked)}
                  disabled={mutationsBlocked}
                  data-testid="auth-domains-session-ack"
                />
                I confirm I am signed in with authority to enable SSO enforcement for this organization.
              </label>
              {readiness?.blockReason ? (
                <div
                  className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="auth-domains-block-reason"
                >
                  {readiness.blockReason}
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>Enforcement mode</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={mutationsBlocked}
                  data-testid="auth-domains-enforcement-optional"
                  onClick={() =>
                    requestSetEnforcementMode({
                      enforcementMode: "SsoOptional",
                      allowEmailOtpRecovery: false,
                    })
                  }
                >
                  SSO optional
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={mutationsBlocked}
                  data-testid="auth-domains-enforcement-required"
                  onClick={() =>
                    requestSetEnforcementMode({
                      enforcementMode: "SsoRequiredForVerifiedDomain",
                      allowEmailOtpRecovery: false,
                    })
                  }
                >
                  Require SSO
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={mutationsBlocked}
                  data-testid="auth-domains-enforcement-recovery"
                  onClick={() =>
                    requestSetEnforcementMode({
                      enforcementMode: "SsoRequiredWithRecoveryException",
                      allowEmailOtpRecovery: true,
                    })
                  }
                >
                  Require SSO with recovery
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div
                className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}
                data-testid="auth-domains-enforcement-warning"
              >
                {AUTH_DOMAINS_ENFORCEMENT_WARNING}
              </div>
              <Button
                type="button"
                variant="primary"
                data-testid="auth-domains-enable-enforcement"
                disabled={mutationsBlocked || !sessionAcknowledged || readiness?.canEnableEnforcement === false}
                onClick={() => requestEnableEnforcement()}
              >
                Enable enforcement
              </Button>
            </div>

            {selected.enforcementMode === "SsoRequiredWithRecoveryException" ? (
              <div className="space-y-2">
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>Recovery administrators</p>
                <ul className="space-y-1">
                  {recoveryAdmins.map((row) => (
                    <li key={row.normalizedRecoveryAdminEmail} className={OPERATOR_TYPOGRAPHY.body}>
                      {row.displayRecoveryAdminEmail}
                      {row.authenticationVerifiedUtc ? " · verified" : " · not verified"}
                      <Button
                        type="button"
                        variant="outline"
                        className="ml-2"
                        disabled={mutationsBlocked}
                        data-testid={`auth-domains-remove-recovery-${row.normalizedRecoveryAdminEmail}`}
                        onClick={() => void handleRemoveRecoveryAdmin(row)}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
                <div className="flex flex-wrap gap-2">
                  <Input
                    value={recoveryEmail}
                    onChange={(event) => setRecoveryEmail(event.target.value)}
                    placeholder={`breakglass@${selected.displayDomain}`}
                    aria-label="Recovery administrator email"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={mutationsBlocked || !recoveryEmail.trim()}
                    data-testid="auth-domains-add-recovery-admin"
                    onClick={() => void handleAddRecoveryAdmin()}
                  >
                    Add recovery admin
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

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
