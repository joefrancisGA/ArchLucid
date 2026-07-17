"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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

const ENFORCEMENT_WARNING =
  "Requiring SSO may prevent users from signing in through other methods. Confirm that the configured identity provider and recovery access have been tested.";

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

  const refreshRecoveryAdmins = useCallback(async (normalizedDomain: string) => {
    try {
      const rows = await fetchTenantAuthDomainRecoveryAdmins(normalizedDomain);
      setRecoveryAdmins(rows);
    } catch {
      setRecoveryAdmins([]);
    }
  }, []);

  const refreshReadiness = useCallback(async (normalizedDomain: string) => {
    try {
      const row = await fetchTenantAuthDomainEnforcementReadiness(normalizedDomain);
      setReadiness(row);
    } catch {
      setReadiness(null);
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
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await proposeTenantAuthDomain(newDomain.trim());
      setDnsInstruction(response.dnsVerificationInstruction);
      setNewDomain("");
      setSelectedDomain(response.domain.normalizedDomain);
      setStatusMessage(`Domain ${response.domain.displayDomain} added. Verify DNS ownership before enforcement.`);
      await refreshDomains();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }

  async function runForSelected(action: (domain: string) => Promise<{ dnsVerificationInstruction?: string }>) {
    if (selectedDomain === null) {
      return;
    }

    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const response = await action(selectedDomain);

      if (response.dnsVerificationInstruction) {
        setDnsInstruction(response.dnsVerificationInstruction);
      }

      setStatusMessage("Saved.");
      await refreshDomains();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : String(error));
    }
  }

  return (
    <div className="w-full max-w-4xl space-y-6" data-testid="auth-domains-page">
      <div>
        <h1 className={cn("mt-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Sign-in domains</h1>
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Verify email domain ownership, test routing, and enable SSO enforcement for your organization.
        </p>
        <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Configure the identity provider under{" "}
          <Link href="/settings/identity-providers" className={OPERATOR_LINK.nav}>
            Identity providers
          </Link>{" "}
          before enabling enforcement.
        </p>
      </div>

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
            <Button type="button" variant="primary" onClick={() => void handleProposeDomain()} data-testid="auth-domains-add">
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
                  <div className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {row.verificationStatus} · {row.enforcementMode}
                    {row.isEnforcementActive ? " · enforcement active" : ""}
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
              <Button type="button" variant="secondary" onClick={() => void runForSelected(startTenantAuthDomainVerification)}>
                Start verification
              </Button>
              <Button type="button" variant="secondary" onClick={() => void runForSelected(checkTenantAuthDomainVerification)}>
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
                  onClick={async () => {
                    if (selectedDomain === null) {
                      return;
                    }

                    setErrorMessage(null);

                    try {
                      const preview = await testTenantAuthDomainRouting(selectedDomain, testEmail.trim());
                      setStatusMessage(
                        preview.ssoRequired
                          ? "Preview: SSO would be required for this email."
                          : "Preview: email code would remain available.",
                      );
                    } catch (error) {
                      setErrorMessage(error instanceof Error ? error.message : String(error));
                    }
                  }}
                >
                  Preview routing
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={async () => {
                    if (selectedDomain === null) {
                      return;
                    }

                    setErrorMessage(null);

                    try {
                      await markTenantAuthDomainRoutingTested(selectedDomain, testEmail.trim());
                      setStatusMessage("Routing test recorded.");
                      await refreshDomains();
                      await refreshReadiness(selectedDomain);
                      await refreshRecoveryAdmins(selectedDomain);
                    } catch (error) {
                      setErrorMessage(error instanceof Error ? error.message : String(error));
                    }
                  }}
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
                  variant="ghost"
                  onClick={() =>
                    void runForSelected((domain) =>
                      setTenantAuthDomainEnforcement(domain, "SsoOptional", false),
                    )
                  }
                >
                  SSO optional
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    void runForSelected((domain) =>
                      setTenantAuthDomainEnforcement(domain, "SsoRequiredForVerifiedDomain", false),
                    )
                  }
                >
                  Require SSO
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() =>
                    void runForSelected((domain) =>
                      setTenantAuthDomainEnforcement(domain, "SsoRequiredWithRecoveryException", true),
                    )
                  }
                >
                  Require SSO with recovery
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <p className={cn("m-0 text-amber-900", OPERATOR_TYPOGRAPHY.helper)} role="note">
                {ENFORCEMENT_WARNING}
              </p>
              <Button
                type="button"
                variant="primary"
                data-testid="auth-domains-enable-enforcement"
                disabled={!sessionAcknowledged || readiness?.canEnableEnforcement === false}
                onClick={async () => {
                  if (selectedDomain === null) {
                    return;
                  }

                  if (!window.confirm(ENFORCEMENT_WARNING)) {
                    return;
                  }

                  setErrorMessage(null);

                  try {
                    await enableTenantAuthDomainEnforcement(selectedDomain, true);
                    setStatusMessage("SSO enforcement enabled.");
                    await refreshDomains();
                    await refreshReadiness(selectedDomain);
                  } catch (error) {
                    setErrorMessage(error instanceof Error ? error.message : String(error));
                  }
                }}
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
                        variant="ghost"
                        className="ml-2"
                        onClick={async () => {
                          if (selectedDomain === null) {
                            return;
                          }

                          const result = await removeTenantAuthDomainRecoveryAdmin(
                            selectedDomain,
                            row.normalizedRecoveryAdminEmail,
                            false,
                          );

                          if (!result.removed && result.warningMessage) {
                            if (!window.confirm(result.warningMessage)) {
                              return;
                            }

                            await removeTenantAuthDomainRecoveryAdmin(
                              selectedDomain,
                              row.normalizedRecoveryAdminEmail,
                              true,
                            );
                          }

                          await refreshRecoveryAdmins(selectedDomain);
                          await refreshReadiness(selectedDomain);
                        }}
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
                    onClick={async () => {
                      if (selectedDomain === null) {
                        return;
                      }

                      setErrorMessage(null);

                      try {
                        await addTenantAuthDomainRecoveryAdmin(selectedDomain, recoveryEmail.trim());
                        setRecoveryEmail("");
                        await refreshRecoveryAdmins(selectedDomain);
                      } catch (error) {
                        setErrorMessage(error instanceof Error ? error.message : String(error));
                      }
                    }}
                  >
                    Add recovery admin
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
