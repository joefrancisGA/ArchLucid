"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { AccountSecurityAuthDomainsVocabularyRail } from "@/components/AccountSecurityAuthDomainsVocabularyRail";
import { AuthDomainsIdentityProvidersVocabularyRail } from "@/components/AuthDomainsIdentityProvidersVocabularyRail";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  AuthDomainsActionConfirmDialog,
  type AuthDomainsPendingConfirm,
} from "@/app/(operator)/administration/auth-domains/AuthDomainsActionConfirmDialog";
import {
  authDomainEnforcementModeKind,
  authDomainVerificationStatusKind,
  isRestrictiveAuthDomainEnforcementMode,
  labelForAuthDomainEnforcementMode,
  labelForAuthDomainVerificationStatus,
  successMessageForAuthDomainEnforcementModeChange,
} from "@/lib/auth-domains-enum-labels";
import { AUTH_DOMAINS_ENFORCEMENT_WARNING } from "@/lib/auth-domains-confirm-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
import { cn } from "@/lib/utils";

type RefreshOptions = {
  readonly surfaceError?: boolean;
};

type EnforcementModeRequest = {
  readonly enforcementMode: string;
  readonly allowEmailOtpRecovery: boolean;
};

export function AuthDomainsPageClient() {
  const [domains, setDomains] = useState<TenantAuthDomainRecord[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [recoveryAdmins, setRecoveryAdmins] = useState<TenantAuthDomainRecoveryAdminRecord[]>([]);
  const [readiness, setReadiness] = useState<TenantAuthDomainEnforcementReadiness | null>(null);
  const [sessionAcknowledged, setSessionAcknowledged] = useState(false);
  const [newDomain, setNewDomain] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [dnsInstruction, setDnsInstruction] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pendingConfirm, setPendingConfirm] = useState<AuthDomainsPendingConfirm | null>(null);

  const refreshDomains = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const rows = await fetchTenantAuthDomains();
      setDomains(rows);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
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
        const message = error instanceof Error ? error.message : String(error);
        setErrorMessage(message);
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
        const message = error instanceof Error ? error.message : String(error);
        setErrorMessage(message);
        throw error;
      }
    }
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

  const selected = domains.find((row) => row.normalizedDomain === selectedDomain) ?? null;

  async function handleProposeDomain() {
    if (busy || !newDomain.trim()) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const response = await proposeTenantAuthDomain(newDomain.trim());
      setDnsInstruction(response.dnsVerificationInstruction);
      setNewDomain("");
      setSelectedDomain(response.domain.normalizedDomain);
      setStatusMessage(`Domain ${response.domain.displayDomain} added. Verify DNS ownership before enforcement.`);
      await refreshDomains();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function runForSelected(action: (domain: string) => Promise<{ dnsVerificationInstruction?: string }>) {
    if (selectedDomain === null || busy) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const response = await action(selectedDomain);

      if (response.dnsVerificationInstruction) {
        setDnsInstruction(response.dnsVerificationInstruction);
      }

      setStatusMessage("Saved.");
      await refreshDomains();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handlePreviewRouting() {
    if (selectedDomain === null || busy) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      const preview = await testTenantAuthDomainRouting(selectedDomain, testEmail.trim());
      setStatusMessage(
        preview.ssoRequired
          ? "Preview: SSO would be required for this email."
          : "Preview: email code would remain available.",
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleMarkRoutingTested() {
    if (selectedDomain === null || busy) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await markTenantAuthDomainRoutingTested(selectedDomain, testEmail.trim());
      setStatusMessage("Routing test recorded.");
      await refreshDomains();
      await refreshReadiness(selectedDomain, { surfaceError: true });
      await refreshRecoveryAdmins(selectedDomain, { surfaceError: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
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

    if (isRestrictiveAuthDomainEnforcementMode(request.enforcementMode)) {
      setPendingConfirm({
        kind: "set-enforcement-mode",
        displayDomain: selected.displayDomain,
        enforcementMode: request.enforcementMode,
        allowEmailOtpRecovery: request.allowEmailOtpRecovery,
      });

      return;
    }

    void executeSetEnforcementMode(request);
  }

  async function executeSetEnforcementMode(request: EnforcementModeRequest) {
    if (selectedDomain === null || busy || selected === null) {
      return;
    }

    setErrorMessage(null);
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function executeEnableEnforcement() {
    if (selectedDomain === null || busy) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await enableTenantAuthDomainEnforcement(selectedDomain, true);
      setStatusMessage("SSO enforcement enabled.");
      await refreshDomains();
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
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

    setErrorMessage(null);
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleRemoveRecoveryAdmin(row: TenantAuthDomainRecoveryAdminRecord) {
    if (selectedDomain === null || busy) {
      return;
    }

    setErrorMessage(null);
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
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  async function handleAddRecoveryAdmin() {
    if (selectedDomain === null || busy || !recoveryEmail.trim()) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    setBusy(true);

    try {
      await addTenantAuthDomainRecoveryAdmin(selectedDomain, recoveryEmail.trim());
      setRecoveryEmail("");
      await refreshRecoveryAdmins(selectedDomain, { surfaceError: true });
      await refreshReadiness(selectedDomain, { surfaceError: true });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-4xl space-y-6" data-testid="auth-domains-page">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Sign-in domains</h1>
          <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Verify email domain ownership, test routing, and enable SSO enforcement for your organization.
          </p>
          <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Configure the identity provider under{" "}
            <Link href="/administration/identity-providers" className={OPERATOR_LINK.nav}>
              Identity providers
            </Link>{" "}
            before enabling enforcement.
          </p>
        </div>
        <PageContextualHelpButton />
      </div>
      <AccountSecurityAuthDomainsVocabularyRail currentSurfaceId="auth-domains" />
      <AuthDomainsIdentityProvidersVocabularyRail currentSurfaceId="auth-domains" />
      {statusMessage !== null ? (
        <p className={cn("m-0 rounded-md border border-emerald-700/30 bg-emerald-50 px-3 py-2 text-emerald-900", OPERATOR_TYPOGRAPHY.body)} role="status">
          {statusMessage}
        </p>
      ) : null}

      {errorMessage !== null ? (
        <p className={cn("m-0 rounded-md border border-red-700/30 bg-red-50 px-3 py-2 text-red-900", OPERATOR_TYPOGRAPHY.body)} role="alert">
          {errorMessage}
        </p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Add domain</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Entering a domain does not claim it. Add the DNS TXT record shown after you start verification.
          </p>
          <div className="flex flex-wrap gap-3">
            <Input
              value={newDomain}
              onChange={(event) => setNewDomain(event.target.value)}
              placeholder="example.com"
              aria-label="Domain name"
              data-testid="auth-domains-new-domain"
            />
            <Button
              type="button"
              variant="primary"
              onClick={() => void handleProposeDomain()}
              disabled={busy || !newDomain.trim()}
              data-testid="auth-domains-add"
            >
              Add domain
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="auth-domains-list-card">
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Domains</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>Loading domains…</p> : null}
          {!loading && domains.length === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No domains configured yet.</p>
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
        </CardContent>
      </Card>

      {selected !== null ? (
        <Card data-testid="auth-domains-detail-card">
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>{selected.displayDomain}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {dnsInstruction !== null ? (
              <p className={cn("m-0 rounded-md bg-al-surface-raised px-3 py-2", OPERATOR_TYPOGRAPHY.helper)} data-testid="auth-domains-dns-instruction">
                {dnsInstruction}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                data-testid="auth-domains-start-verification"
                onClick={() => void runForSelected(startTenantAuthDomainVerification)}
              >
                Start verification
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                data-testid="auth-domains-check-dns"
                onClick={() => void runForSelected(checkTenantAuthDomainVerification)}
              >
                Check DNS verification
              </Button>
            </div>

            <div className="space-y-2">
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

            <div className="space-y-2" data-testid="auth-domains-enforcement-checklist">
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>Pre-enforcement checklist</p>
              <ul className="space-y-1">
                {(readiness?.checklist ?? []).map((item) => (
                  <li key={item.key} className={OPERATOR_TYPOGRAPHY.body}>
                    {item.complete ? "✓" : "○"} {item.label}
                    {item.required ? "" : " (recommended)"}
                    {item.detail ? ` — ${item.detail}` : ""}
                  </li>
                ))}
                <li className={OPERATOR_TYPOGRAPHY.body}>
                  {sessionAcknowledged ? "✓" : "○"} Current session acknowledged
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
                <p className={cn("m-0 text-amber-900", OPERATOR_TYPOGRAPHY.helper)} role="note">
                  {readiness.blockReason}
                </p>
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
              <p className={cn("m-0 text-amber-900", OPERATOR_TYPOGRAPHY.helper)} role="note">
                {AUTH_DOMAINS_ENFORCEMENT_WARNING}
              </p>
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

      <AuthDomainsActionConfirmDialog
        pending={pendingConfirm}
        busy={busy}
        onCancel={() => setPendingConfirm(null)}
        onConfirm={() => void handleConfirmPendingAction()}
      />
    </div>
  );
}
