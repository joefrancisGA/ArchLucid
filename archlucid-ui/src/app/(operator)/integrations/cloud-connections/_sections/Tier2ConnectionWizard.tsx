"use client";



import Link from "next/link";

import { useCallback, useEffect, useMemo, useState } from "react";



import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";

import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";

import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";

import { WizardStepper } from "@/components/wizard/WizardStepper";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import {

  configureTier2Connection,

  validateTier2ConnectionHostedRun,

  type Tier2ConnectionResponse,

} from "@/lib/api/cloud-connections-api";

import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";

import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { resolveApiErrorMessage } from "@/lib/resolve-api-error-message";

import { sanitizeHostedAzureValidationError } from "@/lib/sanitize-hosted-azure-validation-error";

import {

  AZURE_CONNECTION_POST_SAVE_VALIDATE_LEAD,

  AZURE_CONNECTION_SAVE_VALIDATE_LEAD,

  AZURE_CONNECTION_VALIDATION_ADMIN_REQUIRED,

  AZURE_CONNECTION_VALIDATION_BUTTON_LABEL,

  AZURE_CONNECTION_VALIDATION_PREREQUISITES,

} from "@/lib/azure-cloud-connection-copy";

import {

  CLOUD_CONNECTION_SAVE_FAILURE_MESSAGE,

  CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE,

  CLOUD_CONNECTION_VALIDATION_ACCEPTED_MESSAGE,

} from "@/lib/admin-integration-mutation-outcome-copy";

import {
  isAzureHostedFederationConfigComplete,
  readAzureHostedFederationConfig,
} from "@/lib/azure-cloud-connection-federation-config";

import { isNextPublicDemoMode } from "@/lib/demo-ui-env";

import { readFrictionlessTrialSessionEnabled } from "@/lib/frictionless-trial-session";

import {

  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,

  readOperatorScopeFromStorage,

} from "@/lib/operator/operator-scope-storage";

import { showError, showSuccess } from "@/lib/toast";

import { useOperateCapability } from "@/hooks/use-operate-capability";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";

import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";

import { cloudSecurityPreflightTopics, type CloudSecurityPreflightVerificationState } from "@/lib/cloud-security-preflight-topics";

import { cn } from "@/lib/utils";



import {

  hasTier2FieldValidationErrors,

  parseFirstTier2SubscriptionId,

  validateTier2ConnectionFields,

  type Tier2FieldValidationErrors,

} from "./tier2-connection-field-validation";

import {

  buildTier2AzureSetupScript,

  TIER2_AZURE_SETUP_SCRIPT_REPLACE_HINT,

  TIER2_CONNECTION_DETAIL_WIZARD_STEPS,

  TIER2_CONNECTION_WIZARD_STEPS,

  TIER2_WIZARD_HELP_HREFS,

  tier2AzureFederationIdentifiers,

} from "./tier2-connection-wizard-content";

import { CloudSecurityPreflightPanel } from "./CloudSecurityPreflightPanel";



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



export function Tier2ConnectionWizard({

  onSaved,

  skipSecurityStep = false,

  initialConnection = null,

  onCancelEdit,

}: Tier2ConnectionWizardProps) {

  const wizardSteps = skipSecurityStep ? TIER2_CONNECTION_DETAIL_WIZARD_STEPS : TIER2_CONNECTION_WIZARD_STEPS;

  const securityStepOffset = skipSecurityStep ? 1 : 0;

  const canMutate = useOperateCapability();

  const canRunValidation = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;

  const { data: trialPayload } = useTenantTrialStatusQuery();

  const isEditing = initialConnection !== null;

  const [step, setStep] = useState(() => (isEditing && skipSecurityStep ? 1 : 0));

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

  const federationConfigComplete = useMemo(
    () => isAzureHostedFederationConfigComplete(federationConfig),
    [federationConfig],
  );

  const federationIdentifiers = useMemo(() => tier2AzureFederationIdentifiers(federationConfig), [federationConfig]);



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



  const completedSteps = useMemo(() => {

    const done: number[] = [];



    if (!skipSecurityStep && step > 0) {

      done.push(0);

    }



    if (step > 0 - securityStepOffset) {

      done.push(1 - securityStepOffset);

    }



    if (

      step > 1 - securityStepOffset

      && !hasTier2FieldValidationErrors(validateTier2ConnectionFields(tenantId, clientId, subscriptionIds))

    ) {

      done.push(2 - securityStepOffset);

    }



    if (savedConnection !== null) {

      done.push(3 - securityStepOffset);

    }



    return done;

  }, [clientId, savedConnection, securityStepOffset, skipSecurityStep, step, subscriptionIds, tenantId]);



  const canProceed = true;

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



  const logicalStep = step + securityStepOffset;



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
      cloudSecurityPreflightTopics("azure")
        .filter((topic) => topic.verifiableAfterConnection === true)
        .map((topic) => [topic.id, { verifiedUtc }]),
    ) as CloudSecurityPreflightVerificationState;



    setVerifiedTopics(nextState);

  }, []);



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



  return (

    <div className={OPERATOR_LAYOUT.sectionStack} data-testid="tier2-connection-wizard">

      <WizardStepper steps={wizardSteps} currentStep={step} completedSteps={completedSteps} />



      {!skipSecurityStep && step === 0 ? (

        <section className="space-y-4" aria-labelledby="tier2-wizard-security-heading">

          <CloudSecurityPreflightPanel

            topics={cloudSecurityPreflightTopics("azure")}

            providerLabel="Azure"

            verifiedTopics={verifiedTopics}

          />

        </section>

      ) : null}



      {logicalStep === 1 ? (

        <section className="space-y-4" aria-labelledby="tier2-wizard-script-heading">

          <div>

            <h3 id="tier2-wizard-script-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>

              Provision the service principal

            </h3>

            <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>

              Run this Azure CLI script or deploy{" "}

              <Link

                href={TIER2_WIZARD_HELP_HREFS.connectAzureSecurely}

                className="text-teal-700 underline dark:text-teal-400"

              >

                Terraform / Bicep onboarding templates

              </Link>{" "}

              in your tenant. {TIER2_AZURE_SETUP_SCRIPT_REPLACE_HINT} See the{" "}

              <Link href={TIER2_WIZARD_HELP_HREFS.azurePermissions} className="text-teal-700 underline dark:text-teal-400">

                Azure permissions guide

              </Link>{" "}

              for required roles and scopes.

            </p>

          </div>



          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/80">

            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>ArchLucid federation identifiers</p>

            <dl

              className={cn("mt-3 space-y-3", OPERATOR_TYPOGRAPHY.body)}

              data-testid="tier2-federation-identifiers"

            >

              {federationIdentifiers.map((identifier) => (

                <div key={identifier.id} className="flex flex-wrap items-center justify-between gap-2">

                  <div className="min-w-0">

                    <dt className="text-muted-foreground">{identifier.label}</dt>

                    <dd className="break-all font-mono text-sm">

                      {identifier.value.length > 0 ? identifier.value : "Unavailable in this environment"}

                    </dd>

                  </div>

                  <Button

                    type="button"

                    variant="outline"

                    size="sm"

                    data-testid={`tier2-copy-${identifier.id}`}

                    disabled={identifier.value.trim().length === 0}

                    onClick={() => void handleCopyIdentifier(identifier.value, identifier.label)}

                  >

                    Copy

                  </Button>

                </div>

              ))}

            </dl>

          </div>



          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/80">

            <div className="flex flex-wrap items-center justify-between gap-2">

              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Azure CLI setup script</p>

              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="tier2-setup-script-copy"
                disabled={setupScript === null}
                onClick={() => void handleCopyScript()}
              >
                Copy to clipboard
              </Button>
            </div>

            {setupScript === null ? (
              <p className={cn("mt-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Federation identifiers are unavailable in this environment. Contact your ArchLucid administrator or use
                the infrastructure templates instead of the CLI script.
              </p>
            ) : (
              <pre
                tabIndex={0}
                role="region"
                aria-label="Azure CLI setup script"
                className={cn(
                  "mt-3 max-h-[min(40vh,320px)] overflow-auto rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900",
                  OPERATOR_TYPOGRAPHY.micro,
                  "leading-relaxed",
                )}
              >
                <code>{setupScript}</code>
              </pre>
            )}

          </div>

        </section>

      ) : null}



      {logicalStep === 2 ? (

        <section className="space-y-4" aria-labelledby="tier2-wizard-ids-heading">

          <div>

            <h3 id="tier2-wizard-ids-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>

              Enter connection identifiers

            </h3>

            <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>

              Paste the Azure AD tenant ID, application (client) ID, and comma-separated subscription IDs from your

              provisioning output. ArchLucid stores identifiers only — never client secrets.

            </p>

          </div>



          <div className="space-y-4 max-w-xl">

            <div className="space-y-2">

              <Label htmlFor="tier2TenantId">Azure Tenant ID</Label>

              <Input

                id="tier2TenantId"

                data-testid="tier2-tenant-id"

                value={tenantId}

                onChange={(event) => {

                  setTenantId(event.target.value);

                  setFieldErrors((current) => ({ ...current, tenantId: undefined }));

                }}

                placeholder="e.g. 00000000-0000-0000-0000-000000000000"

                aria-invalid={fieldErrors.tenantId ? true : undefined}

              />



              {fieldErrors.tenantId ? (

                <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">

                  {fieldErrors.tenantId}

                </p>

              ) : null}

            </div>



            <div className="space-y-2">

              <Label htmlFor="tier2ClientId">Client ID (Application ID)</Label>

              <Input

                id="tier2ClientId"

                data-testid="tier2-client-id"

                value={clientId}

                onChange={(event) => {

                  setClientId(event.target.value);

                  setFieldErrors((current) => ({ ...current, clientId: undefined }));

                }}

                placeholder="e.g. 00000000-0000-0000-0000-000000000000"

                aria-invalid={fieldErrors.clientId ? true : undefined}

              />



              {fieldErrors.clientId ? (

                <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">

                  {fieldErrors.clientId}

                </p>

              ) : null}

            </div>



            <div className="space-y-2">

              <Label htmlFor="tier2SubscriptionIds">Subscription IDs</Label>

              <Textarea

                id="tier2SubscriptionIds"

                data-testid="tier2-subscription-ids"

                value={subscriptionIds}

                onChange={(event) => {

                  setSubscriptionIds(event.target.value);

                  setFieldErrors((current) => ({ ...current, subscriptionIds: undefined }));

                }}

                placeholder="Comma-separated subscription GUIDs"

                aria-invalid={fieldErrors.subscriptionIds ? true : undefined}

              />



              {fieldErrors.subscriptionIds ? (

                <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")} role="alert">

                  {fieldErrors.subscriptionIds}

                </p>

              ) : null}

            </div>

          </div>

        </section>

      ) : null}



      {logicalStep === 3 ? (

        <section className="space-y-4" aria-labelledby="tier2-wizard-save-heading">

          <div>

            <h3 id="tier2-wizard-save-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>

              Save and validate

            </h3>

            <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{AZURE_CONNECTION_SAVE_VALIDATE_LEAD}</p>

          </div>



          {workspaceBindingCallout !== null ? (

            <p

              className={cn(DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.helper)}

              data-testid="tier2-workspace-binding-callout"

            >

              {workspaceBindingCallout}

            </p>

          ) : null}



          <dl className={cn("grid max-w-xl grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border p-4", OPERATOR_TYPOGRAPHY.body)}>

            <dt className="text-muted-foreground">Workspace</dt>

            <dd data-testid="tier2-summary-workspace">{workspaceBindingLabel}</dd>

            <dt className="text-muted-foreground">Tenant ID</dt>

            <dd data-testid="tier2-summary-tenant">{tenantId.trim() || "—"}</dd>

            <dt className="text-muted-foreground">Client ID</dt>

            <dd data-testid="tier2-summary-client">{clientId.trim() || "—"}</dd>

            <dt className="text-muted-foreground">Subscriptions</dt>

            <dd data-testid="tier2-summary-subscriptions">{subscriptionIds.trim() || "—"}</dd>

          </dl>



          {savedConnection !== null ? (

            <div

              className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 space-y-3 p-4"

              aria-busy={isValidating}

              aria-live="polite"

            >

              <OperatorSuccessCallout

                message={CLOUD_CONNECTION_SAVE_SUCCESS_MESSAGE}

                testId="tier2-connection-save-success-callout"

              />

              <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-al-text-secondary")}>

                {AZURE_CONNECTION_POST_SAVE_VALIDATE_LEAD}

              </p>

              <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="tier2-validation-prerequisites">

                {AZURE_CONNECTION_VALIDATION_PREREQUISITES}

              </p>

              <Button

                type="button"

                variant="outline"

                data-testid="tier2-validate-hosted-run"

                disabled={isValidating || !canRunValidation}

                aria-describedby={!canRunValidation ? "tier2-validation-admin-required-hint" : undefined}

                onClick={() => void handleValidateHostedRun()}

              >

                {isValidating ? "Validating…" : AZURE_CONNECTION_VALIDATION_BUTTON_LABEL}

              </Button>



              {!canRunValidation ? (

                <p id="tier2-validation-admin-required-hint" className={OPERATOR_TYPOGRAPHY.helper}>{AZURE_CONNECTION_VALIDATION_ADMIN_REQUIRED}</p>

              ) : null}



              {validationMessage ? (

                <p

                  className={

                    validationSucceeded

                      ? cn(OPERATOR_TYPOGRAPHY.body, "text-teal-800 dark:text-teal-200")

                      : cn(OPERATOR_TYPOGRAPHY.body, "text-red-600 dark:text-red-400")

                  }

                  role="status"

                  data-testid="tier2-validation-message"

                >

                  {validationMessage}

                </p>

              ) : null}

              {validationSucceeded ? (
                <CloudSecurityPreflightPanel
                  topics={cloudSecurityPreflightTopics("azure")}
                  providerLabel="Azure"
                  verifiedTopics={verifiedTopics}
                />
              ) : null}

            </div>

          ) : null}



          <p className={OPERATOR_TYPOGRAPHY.helper}>

            Access boundaries:{" "}

            <Link

              href={TIER2_WIZARD_HELP_HREFS.securityTrust}

              className="text-teal-700 underline dark:text-teal-400"

            >

              customer trust and access

            </Link>

            .

          </p>



          {!canMutate ? (

            <p className={OPERATOR_TYPOGRAPHY.helper}>

              Elevated workspace permissions required to save a cloud connection.

            </p>

          ) : null}

        </section>

      ) : null}



      {saveErrorMessage !== null ? (

        <OperatorMutationInlineError

          message={saveErrorMessage}

          testId="tier2-connection-save-inline-error"

        />

      ) : null}



      <WizardNavButtons

        isFirstStep={step === 0}

        isLastInputStep={step === wizardSteps.length - 1}

        canProceed={canProceed}

        canSubmit={

          canMutate

          && (isEditing

            ? !hasTier2FieldValidationErrors(validateTier2ConnectionFields(tenantId, clientId, subscriptionIds))

            : savedConnection === null)

        }

        submitting={isSaving}

        onBack={step > 0 ? handleBack : undefined}

        onNext={step < wizardSteps.length - 1 ? handleNext : undefined}

        onSubmit={step === wizardSteps.length - 1 ? () => void handleSave() : undefined}

        submitLabel={isEditing ? "Update connection" : "Save connection"}

        submittingLabel="Saving…"

      />



      {onCancelEdit !== undefined ? (

        <Button type="button" variant="outline" data-testid="tier2-cancel-edit" onClick={onCancelEdit}>

          Cancel update

        </Button>

      ) : null}

    </div>

  );

}


