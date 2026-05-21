"use client";

import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";

import {
  ARCHLUCID_ROLES,
  createDefaultSsoWizardState,
  SSO_WIZARD_STEPS,
  type SsoWizardProtocol,
  type SsoWizardState,
} from "./sso-wizard-state";

type DiscoverResponse = {
  protocol: string;
  issuerUri?: string | null;
  jwksUri?: string | null;
  signingCertificateThumbprints?: string[];
  availableClaimNames?: string[];
  discoverySucceeded?: boolean;
  diagnosticSummary?: string | null;
};

type TestLoginResponse = {
  success?: boolean;
  mappedRoles?: string[];
  accessToken?: string | null;
  expiresInSeconds?: number;
  diagnosticSummary?: string | null;
};

type ActivateResponse = {
  tenantId?: string;
  isActive?: boolean;
  updatedUtc?: string;
};

async function postJson<T>(path: string, body: unknown): Promise<{ ok: boolean; status: number; data?: T; text?: string }> {
  const opts = mergeRegistrationScopeForProxy({
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify(body),
  });

  const res = await fetch(path, opts);
  const text = await res.text();

  if (!res.ok) {
    return { ok: false, status: res.status, text };
  }

  return { ok: true, status: res.status, data: text ? (JSON.parse(text) as T) : undefined };
}

export function SsoWizardPageClient() {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<SsoWizardState>(() => createDefaultSsoWizardState());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completedSteps = useMemo(() => {
    const done: number[] = [];

    if (state.protocol !== null) {
      done.push(0);
    }

    if (state.issuerUri.trim().length > 0) {
      done.push(1);
    }

    if (state.claimMapping.mappings.some((m) => m.idpValue.trim().length > 0)) {
      done.push(2);
    }

    if (state.testLoginSuccess) {
      done.push(3);
    }

    return done;
  }, [state]);

  const canProceedStep0 = state.protocol !== null;
  const canProceedStep1 = state.issuerUri.trim().length > 0;
  const canProceedStep2 =
    state.claimMapping.roleClaimName.trim().length > 0 &&
    state.claimMapping.mappings.some((m) => m.idpValue.trim().length > 0 && m.archLucidRole.trim().length > 0);
  const canProceedStep3 = state.testLoginSuccess;
  const canActivate = canProceedStep3 && state.protocol !== null;

  const canProceed =
    (step === 0 && canProceedStep0) ||
    (step === 1 && canProceedStep1) ||
    (step === 2 && canProceedStep2) ||
    (step === 3 && canProceedStep3) ||
    step === 4;

  const runDiscover = useCallback(async () => {
    if (state.protocol === null) {
      setError("Choose OIDC or SAML 2.0 first.");

      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await postJson<DiscoverResponse>("/api/proxy/v1/admin/identity/discover", {
        protocol: state.protocol,
        metadataUrl: state.metadataUrl.trim(),
      });

      if (!result.ok) {
        setError(result.text ?? `Discovery failed (HTTP ${result.status}).`);

        return;
      }

      const data = result.data;

      if (!data?.discoverySucceeded) {
        setError(data?.diagnosticSummary ?? "Discovery did not succeed.");

        return;
      }

      setState((prev) => ({
        ...prev,
        issuerUri: data.issuerUri?.trim() ?? prev.issuerUri,
        jwksUri: data.jwksUri ?? null,
        signingCertificateThumbprints: data.signingCertificateThumbprints ?? [],
        availableClaimNames: data.availableClaimNames ?? prev.availableClaimNames,
      }));

      showSuccess("Metadata discovered — confirm issuer and signing material.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [state.metadataUrl, state.protocol]);

  const runTestLogin = useCallback(async () => {
    if (state.protocol === null) {
      return;
    }

    setBusy(true);
    setError(null);

    const sampleValues = state.sampleClaimValues
      .split(/[\n,;]+/)
      .map((v) => v.trim())
      .filter((v) => v.length > 0);

    try {
      const result = await postJson<TestLoginResponse>("/api/proxy/v1/admin/identity/test-login", {
        protocol: state.protocol,
        issuerUri: state.issuerUri.trim(),
        claimMapping: {
          roleClaimName: state.claimMapping.roleClaimName,
          mappings: state.claimMapping.mappings.filter((m) => m.idpValue.trim().length > 0),
          customGroupClaimRegex: state.claimMapping.customGroupClaimRegex?.trim() || null,
        },
        sampleClaimValues: sampleValues,
      });

      if (!result.ok) {
        setState((prev) => ({ ...prev, testLoginSuccess: false, testLoginSummary: null, mappedRoles: [] }));
        setError(result.text ?? `Test login failed (HTTP ${result.status}).`);

        return;
      }

      const data = result.data;
      const success = Boolean(data?.success);

      setState((prev) => ({
        ...prev,
        testLoginSuccess: success,
        testLoginSummary: data?.diagnosticSummary ?? null,
        mappedRoles: data?.mappedRoles ?? [],
      }));

      if (!success) {
        setError(data?.diagnosticSummary ?? "Test login did not map any roles.");

        return;
      }

      showSuccess("Sandbox test login succeeded.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [state]);

  const runActivate = useCallback(async () => {
    if (state.protocol === null || !state.testLoginSuccess) {
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await postJson<ActivateResponse>("/api/proxy/v1/admin/identity/activate", {
        protocol: state.protocol,
        issuerUri: state.issuerUri.trim(),
        metadataXml: null,
        claimMapping: {
          roleClaimName: state.claimMapping.roleClaimName,
          mappings: state.claimMapping.mappings.filter((m) => m.idpValue.trim().length > 0),
          customGroupClaimRegex: state.claimMapping.customGroupClaimRegex?.trim() || null,
        },
        keyVaultSecretName: state.keyVaultSecretName.trim() || null,
      });

      if (!result.ok) {
        setError(result.text ?? `Activation failed (HTTP ${result.status}).`);

        return;
      }

      showSuccess("Tenant SSO configuration activated.");
      setStep(4);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [state]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="m-0 text-sm">
          <Link href="/settings/identity-providers" className="text-teal-700 underline-offset-2 hover:underline">
            ← Identity providers
          </Link>
        </p>
        <h1 className="mt-2 text-xl font-semibold text-neutral-900 dark:text-neutral-50">SSO configuration wizard</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Guided setup for OIDC or SAML 2.0. Saves a tenant-scoped row in{" "}
          <code className="text-xs">dbo.TenantIdentityProviderConfigurations</code> — host{" "}
          <code className="text-xs">ArchLucidAuth</code> startup wiring is unchanged.
        </p>
      </div>

      <WizardStepper steps={[...SSO_WIZARD_STEPS]} currentStep={step} completedSteps={completedSteps} />

      {error ? <OperatorApiProblem problem={null} fallbackMessage={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{SSO_WIZARD_STEPS[step]?.label}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 0 ? (
            <div className="flex flex-wrap gap-3">
              {(["oidc", "saml"] as SsoWizardProtocol[]).map((p) => (
                <Button
                  key={p}
                  type="button"
                  variant={state.protocol === p ? "primary" : "outline"}
                  onClick={() => setState((prev) => ({ ...prev, protocol: p }))}
                  data-testid={`sso-protocol-${p}`}
                >
                  {p === "oidc" ? "OpenID Connect (OIDC)" : "SAML 2.0"}
                </Button>
              ))}
            </div>
          ) : null}

          {step === 1 ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="metadata-url">Discovery / metadata URL</Label>
                <Input
                  id="metadata-url"
                  value={state.metadataUrl}
                  onChange={(e) => setState((prev) => ({ ...prev, metadataUrl: e.target.value }))}
                  placeholder={
                    state.protocol === "saml"
                      ? "https://idp.example.com/metadata/saml"
                      : "https://login.example.com"
                  }
                  data-testid="sso-metadata-url"
                />
              </div>
              <Button type="button" variant="outline" disabled={busy || !state.metadataUrl.trim()} onClick={() => void runDiscover()}>
                Fetch metadata
              </Button>
              {state.issuerUri ? (
                <div className="rounded-md border border-neutral-200 p-3 text-sm dark:border-neutral-700">
                  <p className="m-0">
                    <strong>Issuer:</strong> {state.issuerUri}
                  </p>
                  {state.jwksUri ? (
                    <p className="mt-2 m-0">
                      <strong>JWKS URI:</strong> {state.jwksUri}
                    </p>
                  ) : null}
                  {state.signingCertificateThumbprints.length > 0 ? (
                    <p className="mt-2 m-0">
                      <strong>Signing cert thumbprints:</strong> {state.signingCertificateThumbprints.join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="role-claim">IdP role / group claim name</Label>
                <Input
                  id="role-claim"
                  list="sso-claim-names"
                  value={state.claimMapping.roleClaimName}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      claimMapping: { ...prev.claimMapping, roleClaimName: e.target.value },
                    }))
                  }
                  data-testid="sso-role-claim"
                />
                <datalist id="sso-claim-names">
                  {state.availableClaimNames.map((name) => (
                    <option key={name} value={name} />
                  ))}
                </datalist>
              </div>
              <table className="w-full text-left text-sm" data-testid="sso-role-mapping-table">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-700">
                    <th className="py-2 pr-2">IdP value</th>
                    <th className="py-2">ArchLucid role</th>
                  </tr>
                </thead>
                <tbody>
                  {state.claimMapping.mappings.map((row, index) => (
                    <tr key={`${row.archLucidRole}-${index}`} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-2">
                        <Input
                          value={row.idpValue}
                          onChange={(e) => {
                            const value = e.target.value;

                            setState((prev) => {
                              const mappings = [...prev.claimMapping.mappings];
                              mappings[index] = { ...mappings[index], idpValue: value };

                              return { ...prev, claimMapping: { ...prev.claimMapping, mappings } };
                            });
                          }}
                          placeholder="e.g. al-admin-group"
                        />
                      </td>
                      <td className="py-2">
                        <select
                          className="w-full rounded-md border border-neutral-300 bg-white px-2 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
                          value={row.archLucidRole}
                          onChange={(e) => {
                            const value = e.target.value;

                            setState((prev) => {
                              const mappings = [...prev.claimMapping.mappings];
                              mappings[index] = { ...mappings[index], archLucidRole: value };

                              return { ...prev, claimMapping: { ...prev.claimMapping, mappings } };
                            });
                          }}
                        >
                          {ARCHLUCID_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div>
                <Label htmlFor="group-regex">Optional custom group claim regex</Label>
                <Input
                  id="group-regex"
                  value={state.claimMapping.customGroupClaimRegex ?? ""}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      claimMapping: { ...prev.claimMapping, customGroupClaimRegex: e.target.value },
                    }))
                  }
                  placeholder="^AL-(Admin|Operator)-.*$"
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="sample-claims">Sample IdP claim values (comma or newline separated)</Label>
                <textarea
                  id="sample-claims"
                  className="min-h-[5rem] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-600 dark:bg-neutral-900"
                  value={state.sampleClaimValues}
                  onChange={(e) => setState((prev) => ({ ...prev, sampleClaimValues: e.target.value }))}
                  data-testid="sso-sample-claims"
                />
              </div>
              <Button type="button" variant="outline" disabled={busy} onClick={() => void runTestLogin()}>
                Run sandbox test login
              </Button>
              {state.testLoginSummary ? (
                <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300" data-testid="sso-test-login-summary">
                  {state.testLoginSummary}
                  {state.mappedRoles.length > 0 ? ` Roles: ${state.mappedRoles.join(", ")}.` : ""}
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3">
              <p className="m-0 text-sm text-neutral-700 dark:text-neutral-300">
                Review and activate. Activation writes the tenant row and emits{" "}
                <code className="text-xs">Identity.SsoConfigurationActivated</code> audit event. Host configuration
                keys in SECURITY.md remain authoritative for runtime auth.
              </p>
              <div>
                <Label htmlFor="kv-secret">Key Vault secret name (optional reference)</Label>
                <Input
                  id="kv-secret"
                  value={state.keyVaultSecretName}
                  onChange={(e) => setState((prev) => ({ ...prev, keyVaultSecretName: e.target.value }))}
                  placeholder="archlucid-sso-signing-cert"
                />
              </div>
              <ul className="m-0 list-disc space-y-1 pl-5 text-sm">
                <li>Protocol: {state.protocol}</li>
                <li>Issuer: {state.issuerUri}</li>
                <li>Mapped roles (test): {state.mappedRoles.join(", ") || "—"}</li>
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <WizardNavButtons
        isFirstStep={step === 0}
        isLastInputStep={step === SSO_WIZARD_STEPS.length - 1}
        canProceed={canProceed}
        canSubmit={canActivate}
        submitting={busy}
        onBack={() => {
          setError(null);
          setStep((s) => Math.max(0, s - 1));
        }}
        onNext={() => {
          setError(null);
          setStep((s) => Math.min(SSO_WIZARD_STEPS.length - 1, s + 1));
        }}
        onSubmit={() => {
          void runActivate().catch((e: unknown) => {
            showError(e instanceof Error ? e.message : String(e));
          });
        }}
        submitLabel="Activate SSO configuration"
        submittingLabel="Activating…"
      />
    </div>
  );
}
