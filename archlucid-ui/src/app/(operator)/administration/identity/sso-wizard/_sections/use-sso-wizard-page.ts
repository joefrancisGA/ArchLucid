"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import {
  formatSsoWizardActivateError,
  formatSsoWizardDiscoveryError,
  formatSsoWizardTestLoginError,
  formatSsoWizardUnexpectedError,
} from "@/lib/sso-wizard-error-present";
import { SSO_WIZARD_EXISTING_CONFIG_LOAD_ERROR } from "@/lib/sso-wizard-copy";
import {
  SSO_WIZARD_ACTIVATE_SUCCESS_MESSAGE,
  SSO_WIZARD_METADATA_RETRIEVED_SUCCESS_MESSAGE,
  SSO_WIZARD_TEST_LOGIN_SUCCESS_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import { useTenantIdentityProviderConfigurationQuery } from "@/hooks/use-tenant-identity-provider-configuration-query";
import { SSO_WIZARD_IDENTITY_PROVIDERS_HREF } from "@/lib/sso-wizard-copy";
import { WIZARD_SESSION_IDS } from "@/lib/wizard-session-persistence";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import {
  resolveSsoWizardCompleteSetupEmphasizedStepId,
  resolveSsoWizardCompleteSetupSteps,
} from "@/lib/sso-wizard-complete-setup-checklist";

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
import { useSsoWizardStepState, type UseSsoWizardStepStateResult } from "./useSsoWizardStepState";

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

export type UseSsoWizardPageResult = {
  readonly state: SsoWizardState;
  readonly setState: React.Dispatch<React.SetStateAction<SsoWizardState>>;
  readonly busy: boolean;
  readonly error: string | null;
  readonly successMessage: string | null;
  readonly pendingCancelConfirm: boolean;
  readonly setPendingCancelConfirm: React.Dispatch<React.SetStateAction<boolean>>;
  readonly existingConfigSummary: SsoWizardExistingConfigSummaryModel | null;
  readonly existingConfigLoading: boolean;
  readonly existingConfigLoadError: string | null;
  readonly configurationSaved: boolean;
  readonly step: number;
  readonly completedSteps: number[];
  readonly canProceed: boolean;
  readonly canActivate: boolean;
  readonly isLastStep: boolean;
  readonly primaryDisabledReason: UseSsoWizardStepStateResult["primaryDisabledReason"];
  readonly stepHeading: UseSsoWizardStepStateResult["stepHeading"];
  readonly handleContinue: () => void;
  readonly handleBack: () => void;
  readonly handleStepSelect: (stepIndex: number) => void;
  readonly setupChecklistSteps: ReturnType<typeof resolveSsoWizardCompleteSetupSteps>;
  readonly setupChecklistEmphasizedStepId: ReturnType<typeof resolveSsoWizardCompleteSetupEmphasizedStepId>;
  readonly wizardSession: ReturnType<typeof useWizardSessionPersistence<SsoWizardState>>;
  readonly runDiscover: () => Promise<void>;
  readonly runTestLogin: () => Promise<void>;
  readonly runActivate: () => Promise<void>;
  readonly handleCancel: () => void;
  readonly leaveWizard: () => void;
  readonly setError: React.Dispatch<React.SetStateAction<string | null>>;
};

export function useSsoWizardPage(): UseSsoWizardPageResult {
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
  }, [state, wizardSession, setStep]);

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

  return {
    state,
    setState,
    busy,
    error,
    successMessage,
    pendingCancelConfirm,
    setPendingCancelConfirm,
    existingConfigSummary,
    existingConfigLoading,
    existingConfigLoadError,
    configurationSaved,
    step,
    completedSteps,
    canProceed,
    canActivate,
    isLastStep,
    primaryDisabledReason,
    stepHeading,
    handleContinue,
    handleBack,
    handleStepSelect,
    setupChecklistSteps,
    setupChecklistEmphasizedStepId,
    wizardSession,
    runDiscover,
    runTestLogin,
    runActivate,
    handleCancel,
    leaveWizard,
    setError,
  };
}
