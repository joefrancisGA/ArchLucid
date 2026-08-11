"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  formatSsoWizardActivateError,
  formatSsoWizardDiscoveryError,
  formatSsoWizardTestLoginError,
  formatSsoWizardUnexpectedError,
  sanitizeSsoWizardDiagnosticSummary,
} from "@/lib/sso-wizard-error-present";
import {
  SSO_WIZARD_ACTIVATE_INTRO,
  SSO_WIZARD_BACK_LINK_LABEL,
  SSO_WIZARD_CANCEL_UNSAVED_CONFIRM,
  SSO_WIZARD_CREDENTIALS_REFERENCE_LABEL,
  SSO_WIZARD_CREDENTIALS_REFERENCE_PLACEHOLDER,
  SSO_WIZARD_IDENTITY_PROVIDERS_HREF,
  SSO_WIZARD_IDP_STEP_HEADING,
  SSO_WIZARD_IDP_STEP_INSTRUCTION,
  SSO_WIZARD_PAGE_INTRO,
  SSO_WIZARD_PAGE_TITLE,
  SSO_WIZARD_PROTOCOL_STEP_HEADING,
  SSO_WIZARD_PROTOCOL_STEP_INSTRUCTION,
  SSO_WIZARD_STATUS_NOT_ACTIVE,
  SSO_WIZARD_TRUST_REASSURANCE,
} from "@/lib/sso-wizard-copy";
import {
  SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE,
  SSO_WIZARD_METADATA_RETRIEVED_SUCCESS_MESSAGE,
  SSO_WIZARD_TEST_LOGIN_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import { OPERATOR_LINK, OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SSO_WIZARD_CANONICAL_PATH } from "@/lib/sso-wizard-evidence-copy";
import { WIZARD_SESSION_IDS } from "@/lib/wizard-session-persistence";

import { SsoWizardFooter } from "./SsoWizardFooter";
import { SsoWizardIdpSelector } from "./SsoWizardIdpSelector";
import { SsoWizardProtocolHelpDisclosure } from "./SsoWizardProtocolHelpDisclosure";
import { SsoWizardProtocolSelector } from "./SsoWizardProtocolSelector";
import { SsoWizardStepper } from "./SsoWizardStepper";
import {
  applySsoWizardIdpPreset,
  ARCHLUCID_ROLES,
  createDefaultSsoWizardState,
  SSO_WIZARD_STEPS,
  ssoWizardHasUnsavedChanges,
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
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [state, setState] = useState<SsoWizardState>(() => createDefaultSsoWizardState());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const handleSessionRestore = useCallback((snapshot: { stepIndex: number; state: SsoWizardState }) => {
    setStep(snapshot.stepIndex);
    setState(snapshot.state);
  }, []);
  const wizardSession = useWizardSessionPersistence({
    wizardId: WIZARD_SESSION_IDS.adminSsoWizard,
    stepIndex: step,
    state,
    hasSaveableContent: (currentState, currentStep) => ssoWizardHasUnsavedChanges(currentState, currentStep),
    onRestore: handleSessionRestore,
  });

  const completedSteps = useMemo(() => {
    const done: number[] = [];

    if (state.idpPresetId !== null) {
      done.push(0);
    }

    if (state.protocol !== null) {
      done.push(1);
    }

    if (state.issuerUri.trim().length > 0) {
      done.push(2);
    }

    if (state.claimMapping.mappings.some((m) => m.idpValue.trim().length > 0)) {
      done.push(3);
    }

    if (state.testLoginSuccess) {
      done.push(4);
    }

    return done;
  }, [state]);

  const canProceedStep0 = state.idpPresetId !== null;
  const canProceedStep1 = state.protocol !== null;
  const canProceedStep2 = state.issuerUri.trim().length > 0;
  const canProceedStep3 =
    state.claimMapping.roleClaimName.trim().length > 0 &&
    state.claimMapping.mappings.some((m) => m.idpValue.trim().length > 0 && m.archLucidRole.trim().length > 0);
  const canProceedStep4 = state.testLoginSuccess;
  const canActivate = canProceedStep4 && state.protocol !== null;

  const canProceed =
    (step === 0 && canProceedStep0) ||
    (step === 1 && canProceedStep1) ||
    (step === 2 && canProceedStep2) ||
    (step === 3 && canProceedStep3) ||
    (step === 4 && canProceedStep4) ||
    step === 5;

  const runDiscover = useCallback(async () => {
    if (state.protocol === null) {
      setError("Choose OpenID Connect or SAML 2.0 first.");

      return;
    }

    setBusy(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const result = await postJson<DiscoverResponse>("/api/proxy/v1/admin/identity/discover", {
        protocol: state.protocol,
        metadataUrl: state.metadataUrl.trim(),
      });

      if (!result.ok) {
        setError(formatSsoWizardDiscoveryError(result.text));

        return;
      }

      const data = result.data;

      if (!data?.discoverySucceeded) {
        setError(formatSsoWizardDiscoveryError(data?.diagnosticSummary));

        return;
      }

      setState((prev) => ({
        ...prev,
        issuerUri: data.issuerUri?.trim() ?? prev.issuerUri,
        jwksUri: data.jwksUri ?? null,
        signingCertificateThumbprints: data.signingCertificateThumbprints ?? [],
        availableClaimNames: data.availableClaimNames ?? prev.availableClaimNames,
      }));

      setSuccessMessage(SSO_WIZARD_METADATA_RETRIEVED_SUCCESS_MESSAGE);
    } catch (error: unknown) {
      setError(formatSsoWizardUnexpectedError(error));
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
    setSuccessMessage(null);

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
        setError(formatSsoWizardTestLoginError(result.text));

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
        setError(formatSsoWizardTestLoginError(data?.diagnosticSummary));

        return;
      }

      setSuccessMessage(SSO_WIZARD_TEST_LOGIN_SUCCESS_MESSAGE);
    } catch (error: unknown) {
      setError(formatSsoWizardUnexpectedError(error));
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
    setSuccessMessage(null);

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
        setError(formatSsoWizardActivateError(result.text));

        return;
      }

      setSuccessMessage(SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE);
      wizardSession.clearSession();
      setStep(5);
    } catch (error: unknown) {
      setError(formatSsoWizardUnexpectedError(error));
    } finally {
      setBusy(false);
    }
  }, [state, wizardSession]);

  const handleCancel = useCallback(() => {
    if (ssoWizardHasUnsavedChanges(state, step)) {
      const confirmed = window.confirm(SSO_WIZARD_CANCEL_UNSAVED_CONFIRM);

      if (!confirmed) {
        return;
      }
    }

    router.push(SSO_WIZARD_IDENTITY_PROVIDERS_HREF);
  }, [router, state, step]);

  const handleContinue = useCallback(() => {
    if (!canProceed || busy) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setStep((current) => Math.min(SSO_WIZARD_STEPS.length - 1, current + 1));
  }, [busy, canProceed]);

  const handleBack = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
    setStep((current) => Math.max(0, current - 1));
  }, []);

  const currentStepMeta = SSO_WIZARD_STEPS[step];

  return (
    <div className="mx-auto w-full max-w-[62rem] space-y-6 px-1 sm:px-0" data-testid="sso-wizard-page">
      <header className="space-y-3">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
          <Link href={SSO_WIZARD_IDENTITY_PROVIDERS_HREF} className={OPERATOR_LINK.nav} data-testid="sso-wizard-back-link">
            ← {SSO_WIZARD_BACK_LINK_LABEL}
          </Link>
        </p>

        <OperatorPageHeader
          navHref={SSO_WIZARD_CANONICAL_PATH}
          title={SSO_WIZARD_PAGE_TITLE}
          subtitle={SSO_WIZARD_PAGE_INTRO}
          titleTestId="sso-wizard-page-title"
          actions={<PageContextualHelpButton />}
        />
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {SSO_WIZARD_STATUS_NOT_ACTIVE}
        </p>
      </header>

      {wizardSession.pendingRestore !== null ? (
        <WizardSessionResumePrompt
          onResume={wizardSession.acceptRestore}
          onDismiss={wizardSession.dismissRestore}
        />
      ) : null}

      <div className="flex justify-end">
        <WizardSessionSaveStatus
          saveState={wizardSession.saveState}
          lastSavedUtc={wizardSession.lastSavedUtc}
        />
      </div>

      <SsoWizardStepper currentStep={step} completedSteps={completedSteps} />

      {error !== null ? (
        <OperatorMutationInlineError message={error} testId="sso-wizard-mutation-inline-error" />
      ) : null}

      {successMessage !== null ? (
        <OperatorSuccessCallout message={successMessage} testId="sso-wizard-success-callout" />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
            {step === 0
              ? SSO_WIZARD_IDP_STEP_HEADING
              : step === 1
                ? SSO_WIZARD_PROTOCOL_STEP_HEADING
                : currentStepMeta?.label}
          </CardTitle>
          {step === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_IDP_STEP_INSTRUCTION}</p>
          ) : null}
          {step === 1 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_PROTOCOL_STEP_INSTRUCTION}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          {step === 0 ? (
            <SsoWizardIdpSelector
              value={state.idpPresetId}
              disabled={busy}
              onChange={(idpPresetId) => setState((prev) => applySsoWizardIdpPreset(prev, idpPresetId))}
            />
          ) : null}

          {step === 1 ? (
            <>
              <SsoWizardProtocolSelector
                value={state.protocol}
                disabled={busy}
                onChange={(protocol) => setState((prev) => ({ ...prev, protocol }))}
              />
              <SsoWizardProtocolHelpDisclosure />
            </>
          ) : null}

          {step === 2 ? (
            <div className="space-y-3">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Enter the metadata or discovery URL from your identity provider.
              </p>
              <div>
                <Label htmlFor="metadata-url">Metadata or discovery URL</Label>
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
                Fetch provider metadata
              </Button>
              {state.issuerUri ? (
                <div
                  className={cn(
                    "rounded-md border border-neutral-200 p-3 dark:border-neutral-700",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                >
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
                      <strong>Signing certificate thumbprints:</strong> {state.signingCertificateThumbprints.join(", ")}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <div>
                <Label htmlFor="role-claim">Identity provider group or role claim</Label>
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
              <table className={cn("w-full text-left", OPERATOR_TYPOGRAPHY.body)} data-testid="sso-role-mapping-table">
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-2">Identity provider value</th>
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
                          className={cn(
                            "w-full rounded-md border border-neutral-300 bg-white px-2 py-2 dark:border-neutral-600 dark:bg-neutral-900",
                            OPERATOR_TYPOGRAPHY.body,
                          )}
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
                <Label htmlFor="group-regex">Optional group claim pattern</Label>
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

          {step === 4 ? (
            <div className="space-y-3">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Run a test sign-in with sample claim values before activating SSO for users.
              </p>
              <div>
                <Label htmlFor="sample-claims">Sample identity provider claim values (comma or newline separated)</Label>
                <textarea
                  id="sample-claims"
                  className={cn(
                    "min-h-[5rem] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  value={state.sampleClaimValues}
                  onChange={(e) => setState((prev) => ({ ...prev, sampleClaimValues: e.target.value }))}
                  data-testid="sso-sample-claims"
                />
              </div>
              <Button type="button" variant="outline" disabled={busy} onClick={() => void runTestLogin()}>
                Test connection
              </Button>
              {state.testLoginSummary ? (
                <p
                  className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
                  data-testid="sso-test-login-summary"
                >
                  {sanitizeSsoWizardDiagnosticSummary(state.testLoginSummary)}
                  {state.mappedRoles.length > 0 ? ` Roles: ${state.mappedRoles.join(", ")}.` : ""}
                </p>
              ) : null}
            </div>
          ) : null}

          {step === 5 ? (
            <div className="space-y-3">
              <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_ACTIVATE_INTRO}</p>
              <div>
                <Label htmlFor="kv-secret">{SSO_WIZARD_CREDENTIALS_REFERENCE_LABEL}</Label>
                <Input
                  id="kv-secret"
                  value={state.keyVaultSecretName}
                  onChange={(e) => setState((prev) => ({ ...prev, keyVaultSecretName: e.target.value }))}
                  placeholder={SSO_WIZARD_CREDENTIALS_REFERENCE_PLACEHOLDER}
                />
              </div>
              <ul className={cn("m-0 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.body)}>
                <li>Protocol: {state.protocol === "oidc" ? "OpenID Connect" : state.protocol === "saml" ? "SAML 2.0" : "—"}</li>
                <li>Issuer: {state.issuerUri}</li>
                <li>Mapped roles (test): {state.mappedRoles.join(", ") || "—"}</li>
              </ul>
            </div>
          ) : null}

          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{SSO_WIZARD_TRUST_REASSURANCE}</p>

          <SsoWizardFooter
            isFirstStep={step === 0}
            isLastStep={step === SSO_WIZARD_STEPS.length - 1}
            canContinue={canProceed}
            canActivate={canActivate}
            busy={busy}
            onCancel={handleCancel}
            onBack={handleBack}
            onContinue={handleContinue}
            onActivate={() => {
              void runActivate().catch((activateError: unknown) => {
                setError(formatSsoWizardUnexpectedError(activateError));
              });
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
