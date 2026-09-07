"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, type SetStateAction } from "react";

import {
  configureTier2Connection,
  validateTier2ConnectionHostedRun,
  type Tier2ConnectionResponse,
} from "@/lib/api/cloud-connections-api";
import {
  CLOUD_CONNECTION_SAVE_FAILURE_MESSAGE,
  CLOUD_CONNECTION_VALIDATION_ACCEPTED_MESSAGE,
} from "@/lib/admin-integration-mutation-outcome-copy";
import {
  isAzureHostedFederationConfigComplete,
  readAzureHostedFederationConfig,
} from "@/lib/azure-cloud-connection-federation-config";
import { cloudSecurityPreflightTopics, type CloudSecurityPreflightVerificationState } from "@/lib/cloud-security-preflight-topics";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { resolveApiErrorMessage } from "@/lib/resolve-api-error-message";
import { sanitizeHostedAzureValidationError } from "@/lib/sanitize-hosted-azure-validation-error";
import { showError, showSuccess } from "@/lib/toast";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";
import {
  parseTier2ConnectionWizardStepFromSearch,
  tier2ConnectionWizardStepHrefFromSearch,
} from "@/lib/integrations/tier2-connection-wizard-step-url";

import {
  hasTier2FieldValidationErrors,
  parseFirstTier2SubscriptionId,
  validateTier2ConnectionFields,
  type Tier2FieldValidationErrors,
} from "./tier2-connection-field-validation";
import {
  buildTier2AzureSetupScript,
  TIER2_CONNECTION_DETAIL_WIZARD_STEPS,
  TIER2_CONNECTION_WIZARD_STEPS,
  tier2AzureFederationIdentifiers,
} from "./tier2-connection-wizard-content";

export type Tier2ConnectionWizardProps = {
  onSaved: (connections: Tier2ConnectionResponse[]) => void | Promise<void>;
  /** When true, security preflight is shown on the provider detail page instead of step 0. */
  skipSecurityStep?: boolean;
  /** Hydrate wizard fields when editing an existing saved connection (TB-1769). */
  initialConnection?: Tier2ConnectionResponse | null;
  /** When set, shows a cancel control that returns to the connected summary without saving. */
  onCancelEdit?: () => void;
};

function readWorkspaceBindingLabel(): string {
  const scope = readOperatorScopeFromStorage();

  if (scope === null) {
    return "Current workspace";
  }

  const workspaceLabel = scope.workspaceLabel.trim();

  if (workspaceLabel.length > 0) {
    return workspaceLabel;
  }

  return scope.workspaceId;
}

function resolveWorkspaceBindingCallout(workspaceLabel: string, isDemoMode: boolean, isTrial: boolean): string | null {
  if (isDemoMode) {
    return `This connection will bind to the demo workspace (${workspaceLabel}). Use a trial or paid workspace for production Azure inventory.`;
  }

  if (isTrial) {
    return `This connection will bind to the trial workspace (${workspaceLabel}).`;
  }

  return null;
}

export function useTier2ConnectionWizard({
  onSaved,
  skipSecurityStep = false,
  initialConnection = null,
}: Pick<Tier2ConnectionWizardProps, "onSaved" | "skipSecurityStep" | "initialConnection">) {
  const router = useRouter();
  const pathname = usePathname() ?? "/integrations/cloud-connections/azure";
  const searchParams = useSearchParams();
  const urlStepIndex = parseTier2ConnectionWizardStepFromSearch(searchParams.get("step"));
  const wizardSteps = skipSecurityStep ? TIER2_CONNECTION_DETAIL_WIZARD_STEPS : TIER2_CONNECTION_WIZARD_STEPS;
  const securityStepOffset = skipSecurityStep ? 1 : 0;
  const canMutate = useOperateCapability();
  const canRunValidation = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const { productLine } = useProductLine();
  const { data: trialPayload } = useTenantTrialStatusQuery();
  const isEditing = initialConnection !== null;
  const [step, setStepState] = useState(() => {
    if (urlStepIndex !== null) {
      return Math.min(urlStepIndex, wizardSteps.length - 1);
    }

    return isEditing && skipSecurityStep ? 1 : 0;
  });
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [subscriptionIds, setSubscriptionIds] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Tier2FieldValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [savedConnection, setSavedConnection] = useState<Tier2ConnectionResponse | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationSucceeded, setValidationSucceeded] = useState(false);
  const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
  const [workspaceBindingLabel, setWorkspaceBindingLabel] = useState(() => readWorkspaceBindingLabel());
  const [verifiedTopics, setVerifiedTopics] = useState<CloudSecurityPreflightVerificationState>({});
  const federationConfig = useMemo(() => readAzureHostedFederationConfig(), []);

  const syncStepToUrl = useCallback(
    (nextStep: number) => {
      router.replace(tier2ConnectionWizardStepHrefFromSearch(searchParams.toString(), nextStep, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setStep = useCallback(
    (value: SetStateAction<number>) => {
      setStepState((current) => {
        const resolved = typeof value === "function" ? value(current) : value;
        syncStepToUrl(resolved);

        return resolved;
      });
    },
    [syncStepToUrl],
  );

  useEffect(() => {
    const nextStep = parseTier2ConnectionWizardStepFromSearch(searchParams.get("step"));

    if (nextStep === null) {
      return;
    }

    setStepState(Math.min(nextStep, wizardSteps.length - 1));
  }, [searchParams, wizardSteps.length]);

  const federationConfigComplete = useMemo(
    () => isAzureHostedFederationConfigComplete(federationConfig),
    [federationConfig],
  );
  const federationIdentifiers = useMemo(
    () => tier2AzureFederationIdentifiers(federationConfig, productLine),
    [federationConfig, productLine],
  );

  useEffect(() => {
    if (initialConnection === null) {
      return;
    }

    setTenantId(initialConnection.tenantId);
    setClientId(initialConnection.clientId);
    setSubscriptionIds(initialConnection.subscriptionIds);
    setSavedConnection(null);
    setValidationMessage(null);
    setValidationSucceeded(false);
    setSaveErrorMessage(null);
    setVerifiedTopics({});
  }, [initialConnection]);

  useEffect(() => {
    const syncWorkspaceLabel = () => {
      setWorkspaceBindingLabel(readWorkspaceBindingLabel());
    };

    syncWorkspaceLabel();
    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, syncWorkspaceLabel);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, syncWorkspaceLabel);
    };
  }, []);

  const setupScript = useMemo(() => {
    if (!federationConfigComplete) {
      return null;
    }

    return buildTier2AzureSetupScript({
      archlucidTenantId: federationConfig.tenantId,
      archlucidManagedIdentityObjectId: federationConfig.managedIdentityObjectId,
    });
  }, [federationConfig, federationConfigComplete]);

  const fieldValidation = useMemo(
    () => validateTier2ConnectionFields(tenantId, clientId, subscriptionIds),
    [clientId, subscriptionIds, tenantId],
  );

  const fieldsValid = !hasTier2FieldValidationErrors(fieldValidation);

  const displayFieldErrors = useMemo((): Tier2FieldValidationErrors => {
    if (hasTier2FieldValidationErrors(fieldErrors)) {
      return fieldErrors;
    }

    return {
      tenantId: tenantId.trim().length > 0 ? fieldValidation.tenantId : undefined,
      clientId: clientId.trim().length > 0 ? fieldValidation.clientId : undefined,
      subscriptionIds: subscriptionIds.trim().length > 0 ? fieldValidation.subscriptionIds : undefined,
    };
  }, [clientId, fieldErrors, fieldValidation, subscriptionIds, tenantId]);

  const completedSteps = useMemo(() => {
    const done: number[] = [];

    if (!skipSecurityStep && step > 0) {
      done.push(0);
    }

    if (step > 0 - securityStepOffset) {
      done.push(1 - securityStepOffset);
    }

    if (step > 1 - securityStepOffset && fieldsValid) {
      done.push(2 - securityStepOffset);
    }

    if (savedConnection !== null) {
      done.push(3 - securityStepOffset);
    }

    return done;
  }, [fieldsValid, savedConnection, securityStepOffset, skipSecurityStep, step]);

  const logicalStep = step + securityStepOffset;

  const canProceed = useMemo(() => {
    if (logicalStep === 2) {
      return fieldsValid;
    }

    return true;
  }, [fieldsValid, logicalStep]);

  const workspaceBindingCallout = resolveWorkspaceBindingCallout(
    workspaceBindingLabel,
    isNextPublicDemoMode(),
    readFrictionlessTrialSessionEnabled()
      || trialPayload?.status === "Active"
      || trialPayload?.status === "ReadOnly"
      || trialPayload?.status === "ExportOnly",
  );

  const validateFields = useCallback((): boolean => {
    const errors = validateTier2ConnectionFields(tenantId, clientId, subscriptionIds);
    setFieldErrors(errors);

    return !hasTier2FieldValidationErrors(errors);
  }, [clientId, subscriptionIds, tenantId]);

  const handleNext = useCallback(() => {
    if (logicalStep === 2 && !validateFields()) {
      return;
    }

    setStep((current) => Math.min(current + 1, wizardSteps.length - 1));
  }, [logicalStep, validateFields, wizardSteps.length]);

  const handleBack = useCallback(() => {
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  const handleSave = useCallback(async () => {
    if (!canMutate) {
      return;
    }

    if (!validateFields()) {
      setStep(2 - securityStepOffset);

      return;
    }

    setIsSaving(true);
    setValidationMessage(null);
    setValidationSucceeded(false);
    setSaveErrorMessage(null);

    try {
      const saved = await configureTier2Connection({
        tenantId: tenantId.trim(),
        clientId: clientId.trim(),
        subscriptionIds: subscriptionIds.trim(),
      });

      setSavedConnection(saved);
      await onSaved([saved]);
    } catch (error) {
      console.error(error);
      setSaveErrorMessage(resolveApiErrorMessage(error, CLOUD_CONNECTION_SAVE_FAILURE_MESSAGE));
    } finally {
      setIsSaving(false);
    }
  }, [canMutate, clientId, onSaved, securityStepOffset, subscriptionIds, tenantId, validateFields]);

  const markVerifiableTopicsVerified = useCallback(() => {
    const verifiedUtc = new Date().toISOString();
    const nextState = Object.fromEntries(
      cloudSecurityPreflightTopics("azure", productLine)
        .filter((topic) => topic.verifiableAfterConnection === true)
        .map((topic) => [topic.id, { verifiedUtc }]),
    ) as CloudSecurityPreflightVerificationState;

    setVerifiedTopics(nextState);
  }, [productLine]);

  const handleValidateHostedRun = useCallback(async () => {
    if (!canRunValidation) {
      return;
    }

    const firstSubscriptionId = parseFirstTier2SubscriptionId(subscriptionIds);

    if (firstSubscriptionId === null) {
      setValidationMessage("Enter at least one subscription ID before validating.");
      setValidationSucceeded(false);

      return;
    }

    setIsValidating(true);
    setValidationMessage(null);
    setValidationSucceeded(false);

    try {
      const result = await validateTier2ConnectionHostedRun({ subscriptionId: firstSubscriptionId });
      setValidationSucceeded(true);
      markVerifiableTopicsVerified();
      setValidationMessage(
        `${CLOUD_CONNECTION_VALIDATION_ACCEPTED_MESSAGE} Package ${result.packageId} with ${result.resourceCount} resources.`,
      );
    } catch (error) {
      console.error(error);
      setValidationSucceeded(false);
      setValidationMessage(sanitizeHostedAzureValidationError(error).message);
    } finally {
      setIsValidating(false);
    }
  }, [canRunValidation, markVerifiableTopicsVerified, subscriptionIds]);

  const handleCopyScript = useCallback(async () => {
    if (setupScript === null) {
      return;
    }

    try {
      await navigator.clipboard.writeText(setupScript);
      showSuccess("Setup script copied.");
    } catch {
      showError("Cloud connections", "Could not write to clipboard — copy manually.");
    }
  }, [setupScript]);

  const handleCopyIdentifier = useCallback(async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      showSuccess(`${label} copied.`);
    } catch {
      showError("Cloud connections", `Could not copy ${label.toLowerCase()} — copy manually.`);
    }
  }, []);

  const clearFieldError = useCallback((field: keyof Tier2FieldValidationErrors) => {
    setFieldErrors((current) => {
      const next = { ...current };
      delete next[field];

      return next;
    });
  }, []);

  const canSubmit = canMutate && (isEditing ? fieldsValid : savedConnection === null);

  return {
    wizardSteps,
    skipSecurityStep,
    securityStepOffset,
    step,
    logicalStep,
    completedSteps,
    canProceed,
    canSubmit,
    canMutate,
    canRunValidation,
    isEditing,
    isSaving,
    tenantId,
    setTenantId,
    clientId,
    setClientId,
    subscriptionIds,
    setSubscriptionIds,
    fieldErrors,
    displayFieldErrors,
    clearFieldError,
    savedConnection,
    validationMessage,
    validationSucceeded,
    saveErrorMessage,
    workspaceBindingLabel,
    workspaceBindingCallout,
    verifiedTopics,
    federationIdentifiers,
    setupScript,
    productLine,
    handleNext,
    handleBack,
    handleSave,
    handleValidateHostedRun,
    handleCopyScript,
    handleCopyIdentifier,
    isValidating,
  };
}

export type Tier2ConnectionWizardViewModel = ReturnType<typeof useTier2ConnectionWizard>;
