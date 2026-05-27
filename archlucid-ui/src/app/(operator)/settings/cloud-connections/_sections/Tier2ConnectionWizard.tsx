"use client";

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
import { toDocsBlobUrl } from "@/lib/contextual-help-content";
import { showError, showSuccess } from "@/lib/toast";

import {
  hasTier2FieldValidationErrors,
  parseFirstTier2SubscriptionId,
  validateTier2ConnectionFields,
  type Tier2FieldValidationErrors,
} from "./tier2-connection-field-validation";
import {
  buildTier2AzureSetupScript,
  TIER2_CONNECTION_WIZARD_STEPS,
  TIER2_RBAC_CHECKLIST_ITEMS,
  TIER2_WIZARD_DOC_PATHS,
} from "./tier2-connection-wizard-content";

export type Tier2ConnectionWizardProps = {
  onSaved: (connections: Tier2ConnectionResponse[]) => void | Promise<void>;
};

function createInitialChecklistState(): Record<string, boolean> {
  return Object.fromEntries(TIER2_RBAC_CHECKLIST_ITEMS.map((item) => [item.id, false]));
}

function resolveApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiRequestError(error)) {
    const detail = error.problem?.detail?.trim();

    if (detail && detail.length > 0) {
      return detail;
    }
  }

  return fallback;
}

export function Tier2ConnectionWizard({ onSaved }: Tier2ConnectionWizardProps) {
  const [step, setStep] = useState(0);
  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => createInitialChecklistState());
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
  const allChecklistChecked = TIER2_RBAC_CHECKLIST_ITEMS.every((item) => checklist[item.id] === true);

  const completedSteps = useMemo(() => {
    const done: number[] = [];

    if (allChecklistChecked) {
      done.push(0);
    }

    if (step > 0) {
      done.push(1);
    }

    if (step > 1 && !hasTier2FieldValidationErrors(validateTier2ConnectionFields(tenantId, clientId, subscriptionIds))) {
      done.push(2);
    }

    if (savedConnection !== null) {
      done.push(3);
    }

    return done;
  }, [allChecklistChecked, clientId, savedConnection, step, subscriptionIds, tenantId]);

  const canProceedStep0 = allChecklistChecked;

  const canProceed = step === 0 ? canProceedStep0 : true;

  const validateFields = useCallback((): boolean => {
    const errors = validateTier2ConnectionFields(tenantId, clientId, subscriptionIds);
    setFieldErrors(errors);

    return !hasTier2FieldValidationErrors(errors);
  }, [clientId, subscriptionIds, tenantId]);

  const handleNext = useCallback(() => {
    if (step === 2 && !validateFields()) {
      return;
    }

    setStep((current) => Math.min(current + 1, TIER2_CONNECTION_WIZARD_STEPS.length - 1));
  }, [step, validateFields]);

  const handleBack = useCallback(() => {
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  const handleSave = useCallback(async () => {
    if (!validateFields()) {
      setStep(2);

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
      showSuccess("Your Tier 2 continuous Azure ingestion setup has been saved.");
    } catch (error) {
      console.error(error);
      showError(resolveApiErrorMessage(error, "Failed to save connection."));
    } finally {
      setIsSaving(false);
    }
  }, [clientId, onSaved, subscriptionIds, tenantId, validateFields]);

  const handleValidateHostedRun = useCallback(async () => {
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
  }, [subscriptionIds]);

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
        steps={TIER2_CONNECTION_WIZARD_STEPS}
        currentStep={step}
        completedSteps={completedSteps}
      />

      {step === 0 ? (
        <section className="space-y-4" aria-labelledby="tier2-wizard-security-heading">
          <div>
            <h3 id="tier2-wizard-security-heading" className="text-sm font-medium">
              Security review checklist
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Confirm read-only scope and federation posture before provisioning credentials in your Azure tenant.
              Cross-check{" "}
              <Link
                href={toDocsBlobUrl(TIER2_WIZARD_DOC_PATHS.hostedEnterpriseChecklist)}
                className="text-teal-700 underline dark:text-teal-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                hosted Enterprise onboarding
              </Link>
              ,{" "}
              <Link
                href={toDocsBlobUrl(TIER2_WIZARD_DOC_PATHS.procurementFaq)}
                className="text-teal-700 underline dark:text-teal-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                procurement FAQ
              </Link>
              , and{" "}
              <Link
                href={toDocsBlobUrl(TIER2_WIZARD_DOC_PATHS.trustCenter)}
                className="text-teal-700 underline dark:text-teal-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                trust center
              </Link>
              .
            </p>
          </div>

          <ul className="space-y-3">
            {TIER2_RBAC_CHECKLIST_ITEMS.map((item) => (
              <li key={item.id} className="flex items-start gap-3 text-sm">
                <input
                  id={`tier2-check-${item.id}`}
                  type="checkbox"
                  className="mt-1 h-4 w-4 shrink-0"
                  checked={checklist[item.id] === true}
                  onChange={(event) => {
                    setChecklist((current) => ({
                      ...current,
                      [item.id]: event.target.checked,
                    }));
                  }}
                />
                <label htmlFor={`tier2-check-${item.id}`} className="leading-snug text-neutral-800 dark:text-neutral-200">
                  {item.label}
                </label>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-4" aria-labelledby="tier2-wizard-script-heading">
          <div>
            <h3 id="tier2-wizard-script-heading" className="text-sm font-medium">
              Provision the service principal
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Run this Azure CLI script or deploy{" "}
              <Link
                href={toDocsBlobUrl(TIER2_WIZARD_DOC_PATHS.azureExtractor)}
                className="text-teal-700 underline dark:text-teal-400"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terraform / Bicep onboarding templates
              </Link>{" "}
              in your tenant. Replace subscription and ArchLucid identity placeholders before applying federated
              credentials.
            </p>
          </div>

          <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-950/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="m-0 text-sm font-medium text-neutral-800 dark:text-neutral-200">Azure CLI setup script</p>
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
            <pre className="mt-3 max-h-[min(40vh,320px)] overflow-auto rounded-md border border-neutral-200 bg-white p-3 text-[11px] leading-relaxed dark:border-neutral-700 dark:bg-neutral-900">
              <code>{setupScript}</code>
            </pre>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4" aria-labelledby="tier2-wizard-ids-heading">
          <div>
            <h3 id="tier2-wizard-ids-heading" className="text-sm font-medium">
              Enter connection identifiers
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
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
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
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
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
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
                <p className="text-sm text-red-600 dark:text-red-400" role="alert">
                  {fieldErrors.subscriptionIds}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="space-y-4" aria-labelledby="tier2-wizard-save-heading">
          <div>
            <h3 id="tier2-wizard-save-heading" className="text-sm font-medium">
              Save and validate
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Persist the connection for hosted Tier 2 pull jobs, then optionally trigger an on-demand validation run
              against the first subscription ID.
            </p>
          </div>

          <dl className="grid max-w-xl grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border p-4 text-sm">
            <dt className="text-muted-foreground">Tenant ID</dt>
            <dd data-testid="tier2-summary-tenant">{tenantId.trim() || "—"}</dd>
            <dt className="text-muted-foreground">Client ID</dt>
            <dd data-testid="tier2-summary-client">{clientId.trim() || "—"}</dd>
            <dt className="text-muted-foreground">Subscriptions</dt>
            <dd data-testid="tier2-summary-subscriptions">{subscriptionIds.trim() || "—"}</dd>
          </dl>

          {savedConnection !== null ? (
            <div className="space-y-3 rounded-md border border-teal-200 bg-teal-50 p-4 dark:border-teal-900 dark:bg-teal-950/40">
              <p className="text-sm text-teal-900 dark:text-teal-100">
                Connection saved. Run a hosted validation pull to confirm federated credentials and Reader access.
              </p>
              <Button
                type="button"
                variant="outline"
                data-testid="tier2-validate-hosted-run"
                disabled={isValidating}
                onClick={() => void handleValidateHostedRun()}
              >
                {isValidating ? "Validating…" : "Run validation pull"}
              </Button>

              {validationMessage ? (
                <p
                  className={
                    validationSucceeded
                      ? "text-sm text-teal-800 dark:text-teal-200"
                      : "text-sm text-red-600 dark:text-red-400"
                  }
                  role="status"
                  data-testid="tier2-validation-message"
                >
                  {validationMessage}
                </p>
              ) : null}
            </div>
          ) : null}

          <p className="text-xs text-muted-foreground">
            Access boundaries:{" "}
            <Link
              href={toDocsBlobUrl(TIER2_WIZARD_DOC_PATHS.customerTrustAndAccess)}
              className="text-teal-700 underline dark:text-teal-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              customer trust and access
            </Link>
            .
          </p>
        </section>
      ) : null}

      <WizardNavButtons
        isFirstStep={step === 0}
        isLastInputStep={step === TIER2_CONNECTION_WIZARD_STEPS.length - 1}
        canProceed={canProceed}
        canSubmit={savedConnection === null}
        submitting={isSaving}
        onBack={step > 0 ? handleBack : undefined}
        onNext={step < TIER2_CONNECTION_WIZARD_STEPS.length - 1 ? handleNext : undefined}
        onSubmit={step === TIER2_CONNECTION_WIZARD_STEPS.length - 1 ? () => void handleSave() : undefined}
        submitLabel="Save connection"
        submittingLabel="Saving…"
      />
    </div>
  );
}
