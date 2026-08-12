"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { AuthDomainsIdentityProvidersVocabularyRail } from "@/components/AuthDomainsIdentityProvidersVocabularyRail";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { EvidenceOrientationClaimAndSourcesStrip } from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
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
import {
  AuthDomainsActionConfirmDialog,
  type AuthDomainsPendingConfirm,
} from "@/app/(operator)/administration/auth-domains/AuthDomainsActionConfirmDialog";
import {
  authDomainEnforcementModeKind,
  authDomainVerificationStatusKind,
  labelForAuthDomainEnforcementMode,
  labelForAuthDomainVerificationStatus,
  successMessageForAuthDomainEnforcementModeChange,
} from "@/lib/auth-domains-enum-labels";
import { AUTH_DOMAINS_ENFORCEMENT_WARNING, AUTH_DOMAINS_ZERO_DOMAIN_ENFORCEMENT_CALLOUT } from "@/lib/auth-domains-confirm-copy";
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
  AUTH_DOMAINS_LIST_LOAD_ERROR_SUMMARY,
  AUTH_DOMAINS_LIST_LOAD_RECOVERY,
  AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
  AUTH_DOMAINS_MUTATION_RECOVERY,
  AUTH_DOMAINS_PAGE_SUBTITLE,
  AUTH_DOMAINS_PAGE_TITLE,
  AUTH_DOMAINS_SOURCES_DISCLOSURE_TITLE,
  authDomainsAdminAuthorityPresentation,
  authDomainsJourneyStepAriaLabel,
  authDomainsTenantScopeLine,
  authDomainsTenantSignInPosture,
  isPlausibleAuthDomainInput,
  resolveAuthDomainsCurrentWorkspaceLabel,
  resolveAuthDomainsJourneyStep,
  successMessageForAuthDomainAction,
  type AuthDomainsJourneyStepId,
} from "@/lib/auth-domains-page-copy";
import {
  AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE,
  AUTH_DOMAINS_SETTINGS_SOURCES,
  AUTH_DOMAINS_SETTINGS_SOURCES_INTRO,
} from "@/lib/auth-domains-settings-evidence-copy";
import { DESIGN_TOKENS, OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  addTenantAuthDomainRecoveryAdmin,
  checkTenantAuthDomainVerification,
  enableTenantAuthDomainEnforcement,
  fetchTenantAuthDomainEnforcementReadiness,
  fetchTenantAuthDomainRecoveryAdmins,
  fetchTenantAuthDomains,
  markTenantAuthDomainRoutingTested,
  proposeTenantAuthDomain,
  removeTenantAuthDomainRecoveryAdmin,
  setTenantAuthDomainEnforcement,
  startTenantAuthDomainVerification,
  testTenantAuthDomainRouting,
  type TenantAuthDomainEnforcementReadiness,
  type TenantAuthDomainRecord,
  type TenantAuthDomainRecoveryAdminRecord,
} from "@/lib/admin-auth-domains-api";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { SETTINGS_ROOT_PATH } from "@/lib/settings-admin-route-paths";
import { cn } from "@/lib/utils";

type RefreshOptions = {
  readonly surfaceError?: boolean;
};

type EnforcementModeRequest = {
  readonly enforcementMode: string;
  readonly allowEmailOtpRecovery: boolean;
};

type AuthDomainsInlineError = {
  readonly summary: string;
  readonly recovery: typeof AUTH_DOMAINS_MUTATION_RECOVERY;
};

export function AuthDomainsPageClient() {
  const [domains, setDomains] = useState<TenantAuthDomainRecord[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [recoveryAdmins, setRecoveryAdmins] = useState<TenantAuthDomainRecoveryAdminRecord[]>([]);
  const [readiness, setReadiness] = useState<TenantAuthDomainEnforcementReadiness | null>(null);
  const [sessionAcknowledged, setSessionAcknowledged] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [newDomainTouched, setNewDomainTouched] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [dnsInstruction, setDnsInstruction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<AuthDomainsInlineError | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<AuthDomainsPendingConfirm | null>(null);
  const [currentWorkspaceLabel, setCurrentWorkspaceLabel] = useState<string | null>(null);
  const newDomainInputRef = useRef<HTMLInputElement>(null);
  const pendingJourneyScrollRef = useRef<AuthDomainsJourneyStepId | null>(null);
  const { callerAuthorityRank } = useOperatorNavAuthority();

  const tenantScopeLine = authDomainsTenantScopeLine(currentWorkspaceLabel);
  const hasAdminAuthority = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const adminAuthorityPresentation = authDomainsAdminAuthorityPresentation(hasAdminAuthority);
  const signInPosture = authDomainsTenantSignInPosture(domains);
  const newDomainValid = isPlausibleAuthDomainInput(newDomain);
  const showNewDomainFormatError = newDomainTouched && newDomain.trim().length > 0 && !newDomainValid;

  const refreshDomains = useCallback(async () => {
    setLoading(true);
    setErrorState(null);

    try {
      const rows = await fetchTenantAuthDomains();
      setDomains(rows);
    } catch {
      setErrorState({
        summary: AUTH_DOMAINS_LIST_LOAD_ERROR_SUMMARY,
        recovery: AUTH_DOMAINS_LIST_LOAD_RECOVERY,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshRecoveryAdmins = useCallback(async (normalizedDomain: string, options?: RefreshOptions) => {
    try {
      const rows = await fetchTenantAuthDomainRecoveryAdmins(normalizedDomain);
      setRecoveryAdmins(rows);
    } catch (error) {
      setRecoveryAdmins([]);

      if (options?.surfaceError) {
        setErrorState({
          summary: AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
          recovery: AUTH_DOMAINS_MUTATION_RECOVERY,
        });
        throw error;
      }
    }
  }, []);

  const refreshReadiness = useCallback(async (normalizedDomain: string, options?: RefreshOptions) => {
    try {
      const row = await fetchTenantAuthDomainEnforcementReadiness(normalizedDomain);
      setReadiness(row);
    } catch (error) {
      setReadiness(null);

      if (options?.surfaceError) {
        setErrorState({
          summary: AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
          recovery: AUTH_DOMAINS_MUTATION_RECOVERY,
        });
        throw error;
      }
    }
  }, []);

  // Scope is browser-persisted, so it is absent during the server render. Reading it after mount
  // keeps the first client paint byte-identical to the server markup instead of tripping hydration.
  useEffect(() => {
    setCurrentWorkspaceLabel(resolveAuthDomainsCurrentWorkspaceLabel(readOperatorScopeFromStorage()));
  }, []);

  useEffect(() => {
    void refreshDomains();
  }, [refreshDomains]);

  useEffect(() => {
    if (selectedDomain === null) {
      setRecoveryAdmins([]);
      setReadiness(null);
      return;
    }

    void refreshRecoveryAdmins(selectedDomain);
    void refreshReadiness(selectedDomain);
  }, [refreshReadiness, refreshRecoveryAdmins, selectedDomain]);

  useEffect(() => {
    if (pendingJourneyScrollRef.current === null || selectedDomain === null) {
      return;
    }

    const stepId = pendingJourneyScrollRef.current;
    pendingJourneyScrollRef.current = null;

    requestAnimationFrame(() => {
      focusJourneySection(stepId);
    });
  }, [selectedDomain]);

  const selected = domains.find((row) => row.normalizedDomain === selectedDomain) ?? null;
  const currentJourneyStep = resolveAuthDomainsJourneyStep({
    domainCount: domains.length,
    selectedDomain: selected,
    domains,
  });

  function setMutationError(): void {
    setErrorState({
      summary: AUTH_DOMAINS_MUTATION_ERROR_SUMMARY,
      recovery: AUTH_DOMAINS_MUTATION_RECOVERY,
    });
  }

  async function handleProposeDomain() {
    setNewDomainTouched(true);

    if (busy || !newDomainValid) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const response = await proposeTenantAuthDomain(newDomain.trim());
      setDnsInstruction(response.dnsVerificationInstruction);
      setNewDomain("");
      setNewDomainTouched(false);
      setSelectedDomain(response.domain.normalizedDomain);
      setStatusMessage(`Domain ${response.domain.displayDomain} added. Verify DNS ownership before enforcement.`);
      await refreshDomains();
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function runForSelected(
    action: (domain: string) => Promise<{ dnsVerificationInstruction?: string }>,
    successLabel: string,
  ) {
    if (selectedDomain === null || busy || selected === null) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const response = await action(selectedDomain);

      if (response.dnsVerificationInstruction) {
        setDnsInstruction(response.dnsVerificationInstruction);
      }

      setStatusMessage(successMessageForAuthDomainAction(successLabel, selected.displayDomain));
      await refreshDomains();
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function handlePreviewRouting() {
    if (selectedDomain === null || busy || selected === null) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const preview = await testTenantAuthDomainRouting(selectedDomain, testEmail.trim());
      setStatusMessage(
        preview.ssoRequired
          ? `Preview for ${selected.displayDomain}: SSO would be required for this email.`
          : `Preview for ${selected.displayDomain}: email code would remain available.`,
      );
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkRoutingTested() {
    if (selectedDomain === null || busy || selected === null) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await markTenantAuthDomainRoutingTested(selectedDomain, testEmail.trim());
      setStatusMessage(successMessageForAuthDomainAction("Routing test recorded", selected.displayDomain));
      await refreshDomains();
      await refreshReadiness(selectedDomain, { surfaceError: true });
      await refreshRecoveryAdmins(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  function requestEnableEnforcement() {
    if (selectedDomain === null || busy) {
      return;
    }

    setPendingConfirm({ kind: "enable-enforcement" });
  }

  function requestSetEnforcementMode(request: EnforcementModeRequest) {
    if (selectedDomain === null || busy || selected === null) {
      return;
    }

    setPendingConfirm({
      kind: "set-enforcement-mode",
      displayDomain: selected.displayDomain,
      enforcementMode: request.enforcementMode,
      allowEmailOtpRecovery: request.allowEmailOtpRecovery,
    });
  }

  async function executeSetEnforcementMode(request: EnforcementModeRequest) {
    if (selectedDomain === null || busy || selected === null) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await setTenantAuthDomainEnforcement(
        selectedDomain,
        request.enforcementMode,
        request.allowEmailOtpRecovery,
      );
      setStatusMessage(
        successMessageForAuthDomainEnforcementModeChange(selected.displayDomain, request.enforcementMode),
      );
      await refreshDomains();
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function executeEnableEnforcement() {
    if (selectedDomain === null || busy || selected === null) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await enableTenantAuthDomainEnforcement(selectedDomain, true);
      setStatusMessage(successMessageForAuthDomainAction("SSO enforcement enabled", selected.displayDomain));
      await refreshDomains();
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function handleConfirmPendingAction() {
    if (pendingConfirm === null || busy) {
      return;
    }

    if (pendingConfirm.kind === "enable-enforcement") {
      setPendingConfirm(null);
      await executeEnableEnforcement();

      return;
    }

    if (pendingConfirm.kind === "set-enforcement-mode") {
      const request: EnforcementModeRequest = {
        enforcementMode: pendingConfirm.enforcementMode,
        allowEmailOtpRecovery: pendingConfirm.allowEmailOtpRecovery,
      };

      setPendingConfirm(null);
      await executeSetEnforcementMode(request);

      return;
    }

    if (selectedDomain === null) {
      setPendingConfirm(null);
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await removeTenantAuthDomainRecoveryAdmin(
        selectedDomain,
        pendingConfirm.normalizedRecoveryAdminEmail,
        true,
      );
      setPendingConfirm(null);
      await refreshRecoveryAdmins(selectedDomain, { surfaceError: true });
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveRecoveryAdmin(row: TenantAuthDomainRecoveryAdminRecord) {
    if (selectedDomain === null || busy) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const result = await removeTenantAuthDomainRecoveryAdmin(
        selectedDomain,
        row.normalizedRecoveryAdminEmail,
        false,
      );

      if (!result.removed && result.warningMessage) {
        setPendingConfirm({
          kind: "recovery-remove",
          normalizedRecoveryAdminEmail: row.normalizedRecoveryAdminEmail,
          displayRecoveryAdminEmail: row.displayRecoveryAdminEmail,
          warningMessage: result.warningMessage,
        });
        return;
      }

      await refreshRecoveryAdmins(selectedDomain, { surfaceError: true });
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  async function handleAddRecoveryAdmin() {
    if (selectedDomain === null || busy || !recoveryEmail.trim()) {
      return;
    }

    setErrorState(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await addTenantAuthDomainRecoveryAdmin(selectedDomain, recoveryEmail.trim());
      setRecoveryEmail("");
      await refreshRecoveryAdmins(selectedDomain, { surfaceError: true });
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch {
      setMutationError();
    } finally {
      setBusy(false);
    }
  }

  function focusJourneySection(stepId: AuthDomainsJourneyStepId): void {
    const target = document.getElementById(AUTH_DOMAINS_JOURNEY_SECTION_IDS[stepId]);

    if (target === null) {
      return;
    }

    target.scrollIntoView({ behavior: "smooth", block: "start" });

    if (typeof target.focus === "function") {
      target.focus({ preventScroll: true });
    }
  }

  function scrollToJourneySection(stepId: AuthDomainsJourneyStepId): void {
    const target = document.getElementById(AUTH_DOMAINS_JOURNEY_SECTION_IDS[stepId]);

    if (target !== null) {
      focusJourneySection(stepId);

      return;
    }

    if (stepId !== "add" && domains.length > 0 && selectedDomain === null) {
      pendingJourneyScrollRef.current = stepId;
      setSelectedDomain(domains[0]?.normalizedDomain ?? null);

      return;
    }

    if (stepId === "add") {
      newDomainInputRef.current?.focus();

      return;
    }

    document.getElementById("auth-domains-journey-target-domains")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <OperatorPageContainer variant="settings" className={OPERATOR_LAYOUT.sectionStack} data-testid="auth-domains-page">
      <OperatorPageHeader
        title={AUTH_DOMAINS_PAGE_TITLE}
        subtitle={AUTH_DOMAINS_PAGE_SUBTITLE}
        titleTestId="auth-domains-page-title"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="auth-domains-page-breadcrumb"
            items={[
              { label: "Administration", href: SETTINGS_ROOT_PATH },
              { label: AUTH_DOMAINS_PAGE_TITLE },
            ]}
          />
        }
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
        <CardContent className="space-y-6">
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
                  disabled={busy || !newDomainValid}
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
                disabled={busy}
                data-testid="auth-domains-start-verification"
                onClick={() => void runForSelected(startTenantAuthDomainVerification, "DNS verification started")}
              >
                Start verification
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
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
                  disabled={busy}
                  data-testid="auth-domains-preview-routing"
                  onClick={() => void handlePreviewRouting()}
                >
                  Preview routing
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={busy}
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
                  disabled={busy}
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
                  disabled={busy}
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
                  disabled={busy}
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
                  disabled={busy}
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
                disabled={busy || !sessionAcknowledged || readiness?.canEnableEnforcement === false}
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
                        disabled={busy}
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
                    disabled={busy || !recoveryEmail.trim()}
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

      <details className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800" data-testid="auth-domains-sources-disclosure">
        <summary className={cn("cursor-pointer font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {AUTH_DOMAINS_SOURCES_DISCLOSURE_TITLE}
        </summary>
        <div className="mt-4">
          <EvidenceOrientationClaimAndSourcesStrip
            slug="auth-domains-settings"
            claim={AUTH_DOMAINS_SETTINGS_CLAIM_DISCIPLINE}
            sourcesIntro={AUTH_DOMAINS_SETTINGS_SOURCES_INTRO}
            sources={AUTH_DOMAINS_SETTINGS_SOURCES}
          />
        </div>
      </details>

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
