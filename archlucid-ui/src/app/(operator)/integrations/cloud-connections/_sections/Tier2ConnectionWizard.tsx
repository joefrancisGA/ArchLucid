"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

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
import { isApiRequestError } from "@/lib/api-request-error";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { showError, showSuccess } from "@/lib/toast";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";

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
  TIER2_WIZARD_HELP_HREFS,
} from "./tier2-connection-wizard-content";
import {
  CloudSecurityPreflightPanel,
} from "./CloudSecurityPreflightPanel";
import { cloudSecurityPreflightTopics } from "@/lib/cloud-security-preflight-topics";

export type Tier2ConnectionWizardProps = {
  onSaved: (connections: Tier2ConnectionResponse[]) => void | Promise<void>;
  /** When true, security preflight is shown on the provider detail page instead of step 0. */
  skipSecurityStep?: boolean;
};

function resolveApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiRequestError(error)) {
    const detail = error.problem?.detail?.trim();

    if (detail && detail.length > 0) {
      return detail;
    }
  }

  return fallback;
}

export function Tier2ConnectionWizard({ onSaved, skipSecurityStep = false }: Tier2ConnectionWizardProps) {
  const wizardSteps = skipSecurityStep ? TIER2_CONNECTION_DETAIL_WIZARD_STEPS : TIER2_CONNECTION_WIZARD_STEPS;
  const securityStepOffset = skipSecurityStep ? 1 : 0;
  const canMutate = useOperateCapability();
  // The hosted validation-run endpoint (/v1/admin/azure-extractor/hosted/run) is AdminAuthority-gated, stricter than
  // the ExecuteAuthority "save connection" step — checked separately so non-Admin Execute-tier callers don't hit a
  // dead-end 403 on a live-looking button.
  const canRunValidation = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const [step, setStep] = useState(0);
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [subscriptionIds, setSubscriptionIds] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Tier2FieldValidationErrors>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [savedConnection, setSavedConnection] = useState<Tier2ConnectionResponse | null>(null);
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [validationSucceeded, setValidationSucceeded] = useState(false);

  const setupScript = useMemo(() => buildTier2AzureSetupScript(), []);

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

    try {
      const saved = await configureTier2Connection({
        tenantId: tenantId.trim(),
        clientId: clientId.trim(),
        subscriptionIds: subscriptionIds.trim(),
      });

      setSavedConnection(saved);
      await onSaved([saved]);
      showSuccess("Your Azure cloud evidence connection has been saved.");
    } catch (error) {
      console.error(error);
      showError(resolveApiErrorMessage(error, "Failed to save connection."));
    } finally {
      setIsSaving(false);
    }
  }, [canMutate, clientId, onSaved, securityStepOffset, subscriptionIds, tenantId, validateFields]);

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
      setValidationMessage(
        `Validation pull accepted — package ${result.packageId} with ${result.resourceCount} resources.`,
      );
      showSuccess("Hosted extractor validation run accepted.");
    } catch (error) {
      console.error(error);
      setValidationSucceeded(false);
      setValidationMessage(resolveApiErrorMessage(error, "Hosted extractor validation failed."));
    } finally {
      setIsValidating(false);
    }
  }, [canRunValidation, subscriptionIds]);

  const handleCopyScript = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(setupScript);
      showSuccess("Setup script copied.");
    } catch {
      showError("Cloud connections", "Could not write to clipboard — copy manually.");
    }
  }, [setupScript]);

  return (
    <div className="space-y-6" data-testid="tier2-connection-wizard">
      <WizardStepper
        steps={wizardSteps}
        currentStep={step}
        completedSteps={completedSteps}
      />

      {!skipSecurityStep && step === 0 ? (
        <section className="space-y-4" aria-labelledby="tier2-wizard-security-heading">
          <CloudSecurityPreflightPanel topics={cloudSecurityPreflightTopics("azure")} providerLabel="Azure" />
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
              in your tenant. Replace subscription and ArchLucid identity placeholders before applying federated
              credentials.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>Azure CLI setup script</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="tier2-setup-script-copy"
                onClick={() => void handleCopyScript()}
              >
                Copy to clipboard
              </Button>
            </div>
            <pre className={cn("mt-3 max-h-[min(40vh,320px)] overflow-auto rounded-md border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-900", OPERATOR_TYPOGRAPHY.micro, "leading-relaxed")}>
              <code>{setupScript}</code>
            </pre>
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
            <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>
              Persist the connection for hosted Tier 2 pull jobs, then optionally trigger an on-demand validation run
              against the first subscription ID.
            </p>
          </div>

          <dl className={cn("grid max-w-xl grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border p-4", OPERATOR_TYPOGRAPHY.body)}>
            <dt className="text-muted-foreground">Tenant ID</dt>
            <dd data-testid="tier2-summary-tenant">{tenantId.trim() || "—"}</dd>
            <dt className="text-muted-foreground">Client ID</dt>
            <dd data-testid="tier2-summary-client">{clientId.trim() || "—"}</dd>
            <dt className="text-muted-foreground">Subscriptions</dt>
            <dd data-testid="tier2-summary-subscriptions">{subscriptionIds.trim() || "—"}</dd>
          </dl>

          {savedConnection !== null ? (
            <div className="rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 space-y-3 p-4">
              <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-teal-900 dark:text-teal-100")}>
                Connection saved. Run a hosted validation pull to confirm federated credentials and Reader access.
              </p>
              <Button
                type="button"
                variant="outline"
                data-testid="tier2-validate-hosted-run"
                disabled={isValidating || !canRunValidation}
                title={canRunValidation ? undefined : enterpriseMutationControlDisabledTitle}
                onClick={() => void handleValidateHostedRun()}
              >
                {isValidating ? "Validating…" : "Run validation pull"}
              </Button>

              {!canRunValidation ? (
                <p className={OPERATOR_TYPOGRAPHY.helper}>
                  Administrator role required to run a hosted validation pull.
                </p>
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

      <WizardNavButtons
        isFirstStep={step === 0}
        isLastInputStep={step === wizardSteps.length - 1}
        canProceed={canProceed}
        canSubmit={savedConnection === null && canMutate}
        submitting={isSaving}
        onBack={step > 0 ? handleBack : undefined}
        onNext={step < wizardSteps.length - 1 ? handleNext : undefined}
        onSubmit={step === wizardSteps.length - 1 ? () => void handleSave() : undefined}
        submitLabel="Save connection"
        submittingLabel="Saving…"
      />
    </div>
  );
}
