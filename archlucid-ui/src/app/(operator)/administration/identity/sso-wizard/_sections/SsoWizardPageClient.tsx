"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { useCallback, useEffect, useMemo, useState } from "react";

import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";

import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { IdentityProvidersSsoWizardVocabularyRail } from "@/components/IdentityProvidersSsoWizardVocabularyRail";
import { SsoWizardScimVocabularyRail } from "@/components/SsoWizardScimVocabularyRail";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { SsoWizardSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  formatSsoWizardActivateError,
  formatSsoWizardDiscoveryError,
  formatSsoWizardTestLoginError,
  formatSsoWizardUnexpectedError,
} from "@/lib/sso-wizard-error-present";
import {
  SSO_WIZARD_BACK_LINK_LABEL,
  SSO_WIZARD_CANCEL_UNSAVED_CONFIRM,
  SSO_WIZARD_CONFIGURATION_EFFECT_LINE_PREFIX,
  SSO_WIZARD_CONFIGURATION_EFFECT_LINE_SUFFIX,
  SSO_WIZARD_EXISTING_CONFIG_LOAD_ERROR,
  SSO_WIZARD_EXISTING_CONFIG_LOADING,
  SSO_WIZARD_IDENTITY_PROVIDERS_HREF,
  SSO_WIZARD_IDP_STEP_INSTRUCTION,
  SSO_WIZARD_PAGE_INTRO,
  SSO_WIZARD_PAGE_TITLE,
  SSO_WIZARD_PLATFORM_CONFIGURATION_CHANGE_LINK_HREF,
  SSO_WIZARD_PLATFORM_CONFIGURATION_CHANGE_LINK_LABEL,
  SSO_WIZARD_POST_SAVE_HELP_LINK_HREF,
  SSO_WIZARD_POST_SAVE_HELP_LINK_LABEL,
  SSO_WIZARD_POST_SAVE_NEXT_ACTION_LINK_HREF,
  SSO_WIZARD_POST_SAVE_NEXT_ACTION_LINK_LABEL,
  SSO_WIZARD_POST_SAVE_NEXT_ACTION_PREFIX,
  SSO_WIZARD_PROTOCOL_STEP_INSTRUCTION,
  SSO_WIZARD_RELATED_SURFACES_DISCLOSURE_TITLE,
} from "@/lib/sso-wizard-copy";
import {
  SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE,
  SSO_WIZARD_METADATA_RETRIEVED_SUCCESS_MESSAGE,
  SSO_WIZARD_TEST_LOGIN_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import { useTenantIdentityProviderConfigurationQuery } from "@/hooks/use-tenant-identity-provider-configuration-query";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SSO_WIZARD_CANONICAL_PATH } from "@/lib/sso-wizard-evidence-copy";
import { WIZARD_SESSION_IDS } from "@/lib/wizard-session-persistence";
import {
  resolveSsoWizardCompleteSetupEmphasizedStepId,
  resolveSsoWizardCompleteSetupSteps,
} from "@/lib/sso-wizard-complete-setup-checklist";

import { SsoWizardExistingConfigSummary } from "./SsoWizardExistingConfigSummary";
import { SsoWizardFooter } from "./SsoWizardFooter";
import { SsoWizardStepContent } from "./SsoWizardStepContent";
import { SsoWizardStepper } from "./SsoWizardStepper";
import {
  createDefaultSsoWizardState,
  ssoWizardHasUnsavedChanges,
  type SsoWizardState,
} from "./sso-wizard-state";
import {
  buildSsoWizardExistingConfigSummary,
  hydrateSsoWizardStateFromTenantRecord,
  type SsoWizardExistingConfigSummary as SsoWizardExistingConfigSummaryModel,
} from "./sso-wizard-tenant-config";
import { useSsoWizardStepState } from "./useSsoWizardStepState";

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
  const [state, setState] = useState<SsoWizardState>(() => createDefaultSsoWizardState());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pendingCancelConfirm, setPendingCancelConfirm] = useState(false);
  const [existingConfigSummary, setExistingConfigSummary] = useState<SsoWizardExistingConfigSummaryModel | null>(
    null,
  );
  const clearNavigationMessages = useCallback(() => {
    setError(null);
    setSuccessMessage(null);
  }, []);
  const {
    step,
    setStep,
    completedSteps,
    canProceed,
    canActivate,
    isLastStep,
    primaryDisabledReason,
    stepHeading,
    handleContinue,
    handleBack,
    handleStepSelect,
  } = useSsoWizardStepState({
    state,
    busy,
    onBeforeStepChange: clearNavigationMessages,
  });
  const setupChecklistInput = useMemo(
    () => ({
      idpAndProtocolComplete: completedSteps.includes(0) && completedSteps.includes(1),
      providerConfigured: completedSteps.includes(2) && completedSteps.includes(3),
      verifiedAndReady: completedSteps.includes(4) || canActivate,
    }),
    [canActivate, completedSteps],
  );
  const setupChecklistSteps = resolveSsoWizardCompleteSetupSteps(setupChecklistInput);
  const setupChecklistEmphasizedStepId =
    resolveSsoWizardCompleteSetupEmphasizedStepId(setupChecklistInput);
  const existingConfigQuery = useTenantIdentityProviderConfigurationQuery();
  const existingConfigLoading = existingConfigQuery.isPending;
  const existingConfigLoadError =
    existingConfigQuery.isError
      ? (existingConfigQuery.error instanceof Error
          ? existingConfigQuery.error.message
          : SSO_WIZARD_EXISTING_CONFIG_LOAD_ERROR)
      : null;
  const [configurationSaved, setConfigurationSaved] = useState(false);
  const handleSessionRestore = useCallback((snapshot: { stepIndex: number; state: SsoWizardState }) => {
    setStep(snapshot.stepIndex);
    setState(snapshot.state);
  }, [setStep]);
  const wizardSession = useWizardSessionPersistence({
    wizardId: WIZARD_SESSION_IDS.adminSsoWizard,
    stepIndex: step,
    state,
    hasSaveableContent: (currentState, currentStep) => ssoWizardHasUnsavedChanges(currentState, currentStep),
    onRestore: handleSessionRestore,
  });

  useEffect(() => {
    if (existingConfigQuery.data === undefined) {
      return;
    }

    const record = existingConfigQuery.data;

    if (record === null) {
      setExistingConfigSummary(null);

      return;
    }

    setExistingConfigSummary(buildSsoWizardExistingConfigSummary(record));
    setState((current) => (ssoWizardHasUnsavedChanges(current, 0) ? current : hydrateSsoWizardStateFromTenantRecord(record)));
  }, [existingConfigQuery.data]);

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
      setConfigurationSaved(true);
      wizardSession.clearSession();
      setStep(5);
    } catch (error: unknown) {
      setError(formatSsoWizardUnexpectedError(error));
    } finally {
      setBusy(false);
    }
  }, [state, wizardSession]);

  const leaveWizard = useCallback(() => {
    router.push(SSO_WIZARD_IDENTITY_PROVIDERS_HREF);
  }, [router]);

  const handleCancel = useCallback(() => {
    if (ssoWizardHasUnsavedChanges(state, step)) {
      setPendingCancelConfirm(true);

      return;
    }

    leaveWizard();
  }, [leaveWizard, state, step]);

  return (
    <OperatorPageContainer variant="settings" className={cn(OPERATOR_LAYOUT.sectionStack, "px-1 sm:px-0")} data-testid="sso-wizard-page">
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
        <SsoWizardSettingsEvidenceOrientationStrip />
        <p className={cn("m-0 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {SSO_WIZARD_CONFIGURATION_EFFECT_LINE_PREFIX}{" "}
          <Link
            href={SSO_WIZARD_PLATFORM_CONFIGURATION_CHANGE_LINK_HREF}
            className={OPERATOR_LINK.inline}
            data-testid="sso-wizard-platform-change-link"
          >
            {SSO_WIZARD_PLATFORM_CONFIGURATION_CHANGE_LINK_LABEL}
          </Link>
          {SSO_WIZARD_CONFIGURATION_EFFECT_LINE_SUFFIX}
        </p>
      </header>

      {existingConfigLoading ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {SSO_WIZARD_EXISTING_CONFIG_LOADING}
        </p>
      ) : null}

      {existingConfigLoadError !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">
          {existingConfigLoadError}
        </p>
      ) : null}

      {existingConfigSummary !== null ? (
        <SsoWizardExistingConfigSummary summary={existingConfigSummary} />
      ) : null}

      {wizardSession.pendingRestore !== null ? (
        <WizardSessionResumePrompt
          onResume={wizardSession.acceptRestore}
          onDismiss={wizardSession.dismissRestore}
        />
      ) : null}

      {wizardSession.saveState !== "idle" ? (
        <div className="flex justify-end">
          <WizardSessionSaveStatus saveState={wizardSession.saveState} />
        </div>
      ) : null}

      <SsoWizardStepper
        currentStep={step}
        completedSteps={completedSteps}
        onStepSelect={handleStepSelect}
      />

      {!configurationSaved ? (
        <IntegrationConnectChecklist
          title="Complete setup checklist"
          steps={setupChecklistSteps}
          emphasizedStepId={setupChecklistEmphasizedStepId}
          testIdPrefix="sso-wizard-complete-setup"
        />
      ) : null}

      {error !== null ? (
        <OperatorMutationInlineError message={error} testId="sso-wizard-mutation-inline-error" />
      ) : null}

      {successMessage !== null ? (
        <OperatorSuccessCallout message={successMessage} testId="sso-wizard-success-callout" />
      ) : null}

      {configurationSaved ? (
        <div
          className={cn(
            "rounded-md border border-neutral-200 px-3 py-3 dark:border-neutral-800",
            OPERATOR_TYPOGRAPHY.body,
          )}
          data-testid="sso-wizard-post-save-next-action"
        >
          <p className="m-0 text-al-text-primary">
            {SSO_WIZARD_POST_SAVE_NEXT_ACTION_PREFIX}{" "}
            <Link href={SSO_WIZARD_POST_SAVE_NEXT_ACTION_LINK_HREF} className={OPERATOR_LINK.inline}>
              {SSO_WIZARD_POST_SAVE_NEXT_ACTION_LINK_LABEL}
            </Link>
            .{" "}
            <Link href={SSO_WIZARD_POST_SAVE_HELP_LINK_HREF} className={OPERATOR_LINK.inline}>
              {SSO_WIZARD_POST_SAVE_HELP_LINK_LABEL}
            </Link>
            .
          </p>
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle
            as="h2"
            id="sso-wizard-step-heading"
            tabIndex={-1}
            className={OPERATOR_TYPOGRAPHY.cardTitle}
          >
            {stepHeading}
          </CardTitle>
          {step === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_IDP_STEP_INSTRUCTION}</p>
          ) : null}
          {step === 1 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{SSO_WIZARD_PROTOCOL_STEP_INSTRUCTION}</p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-5">
          <SsoWizardStepContent
            step={step}
            state={state}
            busy={busy}
            existingConfigSummary={existingConfigSummary}
            onStateChange={setState}
            onRunDiscover={() => {
              void runDiscover();
            }}
            onRunTestLogin={() => {
              void runTestLogin();
            }}
          />

          <SsoWizardFooter
            isFirstStep={step === 0}
            isLastStep={isLastStep}
            canContinue={canProceed}
            canActivate={canActivate}
            busy={busy}
            primaryDisabledReason={primaryDisabledReason}
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

      <details
        className="rounded-lg border border-neutral-200 dark:border-neutral-800"
        data-testid="sso-wizard-related-surfaces-disclosure"
      >
        <summary className={cn("cursor-pointer px-4 py-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {SSO_WIZARD_RELATED_SURFACES_DISCLOSURE_TITLE}
        </summary>
        <div className="space-y-3 border-t border-neutral-200 px-4 py-3 dark:border-neutral-800">
          <IdentityProvidersSsoWizardVocabularyRail currentSurfaceId="sso-wizard" />
          <SsoWizardScimVocabularyRail currentSurfaceId="sso-wizard" />
        </div>
      </details>

      <ConfirmationDialog
        open={pendingCancelConfirm}
        onOpenChange={(open) => {
          if (!open) {
            setPendingCancelConfirm(false);
          }
        }}
        title="Leave SSO setup?"
        description={SSO_WIZARD_CANCEL_UNSAVED_CONFIRM}
        confirmLabel="Leave without saving"
        variant="destructive"
        onConfirm={() => {
          setPendingCancelConfirm(false);
          leaveWizard();
        }}
      />
    </OperatorPageContainer>
  );
}
