"use client";

import { cn } from "@/lib/utils";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { FormFieldLabelWithHelp } from "@/components/FormFieldLabelWithHelp";
import { Input } from "@/components/ui/input";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { configureGcpTier2Connection } from "@/lib/api/gcp-cloud-connections-api";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GCP_CONNECTION_POOL_PROVIDER_HINT,
  GCP_CONNECTION_POOL_PROVIDER_LABEL,
  GCP_CONNECTION_PROJECT_ID_HINT,
  GCP_CONNECTION_PROJECT_ID_LABEL,
  GCP_CONNECTION_SAVE_FAILED_ERROR,
  GCP_CONNECTION_SERVICE_ACCOUNT_HINT,
  GCP_CONNECTION_SERVICE_ACCOUNT_LABEL,
} from "@/lib/gcp-cloud-connection-copy";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";
import {
  gcpConnectionWizardStepHrefFromSearch,
  parseGcpConnectionWizardStepFromSearch,
} from "@/lib/integrations/gcp-connection-wizard-step-url";

import {
  fieldErrorMessage,
  hasGcpConnectionFieldErrors,
  validateGcpConnectionFields,
  type GcpConnectionFieldKey,
} from "./gcp-connection-field-validation";
import { useLocalizedProductCopy } from "@/hooks/use-localized-product-copy";
import {
  GCP_CONNECTION_DETAIL_WIZARD_STEPS,
  gcpConnectionWizardIdsStepLead,
  GCP_CONNECTION_WIZARD_POOL_PROVIDER_PLACEHOLDER,
  GCP_CONNECTION_WIZARD_SAVE_STEP_LEAD,
} from "./gcp-connection-wizard-content";
import { useGcpConnectionData } from "./GcpConnectionDataContext";

type Props = {
  readonly onSaved?: () => void | Promise<void>;
};

export function GcpConnectionWizard(props: Props): React.ReactElement {
  const { productLine } = useLocalizedProductCopy();
  const { canMutate, refreshConnections, setFormError, setActionMessage } = useGcpConnectionData();
  const router = useRouter();
  const pathname = usePathname() ?? "/integrations/cloud-connections/gcp";
  const searchParams = useSearchParams();
  const urlStep = parseGcpConnectionWizardStepFromSearch(searchParams.get("gcpStep"));
  const [step, setStepState] = useState(urlStep ?? 0);
  const [projectId, setProjectId] = useState("");
  const [workloadIdentityPoolProvider, setWorkloadIdentityPoolProvider] = useState("");
  const [serviceAccountEmail, setServiceAccountEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [touched, setTouched] = useState<Record<GcpConnectionFieldKey, boolean>>({
    projectId: false,
    workloadIdentityPoolProvider: false,
    serviceAccountEmail: false,
  });

  const fieldErrors = useMemo(
    () => validateGcpConnectionFields(projectId, workloadIdentityPoolProvider, serviceAccountEmail),
    [projectId, serviceAccountEmail, workloadIdentityPoolProvider],
  );

  const fieldsValid = !hasGcpConnectionFieldErrors(fieldErrors);

  const setStep = useCallback(
    (next: number | ((current: number) => number)) => {
      setStepState((current) => {
        const resolved = typeof next === "function" ? next(current) : next;

        router.replace(gcpConnectionWizardStepHrefFromSearch(searchParams.toString(), resolved, pathname), {
          scroll: false,
        });

        return resolved;
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    if (urlStep !== null) {
      setStepState(urlStep);
    }
  }, [urlStep]);

  const completedSteps = useMemo(() => {
    const done: number[] = [];

    if (step > 0) {
      done.push(0);
    }

    if (saveSucceeded) {
      done.push(1);
    }

    return done;
  }, [saveSucceeded, step]);

  const markTouched = useCallback((field: GcpConnectionFieldKey) => {
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  const touchAllFields = useCallback(() => {
    setTouched({
      projectId: true,
      workloadIdentityPoolProvider: true,
      serviceAccountEmail: true,
    });
  }, []);

  const handleNext = useCallback(() => {
    if (step === 0 && !fieldsValid) {
      touchAllFields();

      return;
    }

    setStep((current) => Math.min(current + 1, GCP_CONNECTION_DETAIL_WIZARD_STEPS.length - 1));
  }, [fieldsValid, setStep, step, touchAllFields]);

  const handleBack = useCallback(() => {
    setStep((current) => Math.max(current - 1, 0));
  }, [setStep]);

  const handleSave = useCallback(async () => {
    if (!canMutate || !fieldsValid) {
      touchAllFields();

      return;
    }

    setFormError(null);
    setActionMessage(null);
    setIsSaving(true);

    try {
      await configureGcpTier2Connection({
        projectId: projectId.trim(),
        workloadIdentityPoolProvider: workloadIdentityPoolProvider.trim(),
        serviceAccountEmail: serviceAccountEmail.trim(),
      });
      await refreshConnections();
      setSaveSucceeded(true);
      setActionMessage("GCP connection saved.");
      await props.onSaved?.();
    } catch (err) {
      console.error(err);
      setFormError(GCP_CONNECTION_SAVE_FAILED_ERROR);
    } finally {
      setIsSaving(false);
    }
  }, [
    canMutate,
    fieldsValid,
    projectId,
    props,
    refreshConnections,
    serviceAccountEmail,
    setActionMessage,
    setFormError,
    touchAllFields,
    workloadIdentityPoolProvider,
  ]);

  return (
    <div className={OPERATOR_LAYOUT.sectionStack} data-testid="gcp-connection-wizard">
      <WizardStepper
        steps={GCP_CONNECTION_DETAIL_WIZARD_STEPS}
        currentStep={step}
        completedSteps={completedSteps}
      />

      {step === 0 ? (
        <section
          className="space-y-4"
          aria-labelledby="gcp-wizard-ids-heading"
          data-testid="gcp-connection-wizard-step-ids"
        >
          <div>
            <h3 id="gcp-wizard-ids-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
              Enter connection identifiers
            </h3>
            <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{gcpConnectionWizardIdsStepLead(productLine)}</p>
          </div>

          <div className="grid max-w-xl gap-4">
            <div className="space-y-2">
              <FormFieldLabelWithHelp
                htmlFor="gcpWizardProjectId"
                label={GCP_CONNECTION_PROJECT_ID_LABEL}
                hint={GCP_CONNECTION_PROJECT_ID_HINT}
              />
              <Input
                id="gcpWizardProjectId"
                data-testid="gcp-project-id"
                value={projectId}
                onChange={(event) => setProjectId(event.target.value)}
                onBlur={() => markTouched("projectId")}
                placeholder="my-gcp-project"
                autoComplete="off"
                aria-invalid={fieldErrorMessage(fieldErrors, touched, "projectId") !== null}
              />
              {fieldErrorMessage(fieldErrors, touched, "projectId") !== null ? (
                <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-red-600 dark:text-red-400")} role="alert">
                  {fieldErrorMessage(fieldErrors, touched, "projectId")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <FormFieldLabelWithHelp
                htmlFor="gcpWizardPoolProvider"
                label={GCP_CONNECTION_POOL_PROVIDER_LABEL}
                hint={GCP_CONNECTION_POOL_PROVIDER_HINT}
              />
              <Input
                id="gcpWizardPoolProvider"
                data-testid="gcp-pool-provider"
                value={workloadIdentityPoolProvider}
                onChange={(event) => setWorkloadIdentityPoolProvider(event.target.value)}
                onBlur={() => markTouched("workloadIdentityPoolProvider")}
                placeholder={GCP_CONNECTION_WIZARD_POOL_PROVIDER_PLACEHOLDER}
                autoComplete="off"
                aria-invalid={fieldErrorMessage(fieldErrors, touched, "workloadIdentityPoolProvider") !== null}
              />
              {fieldErrorMessage(fieldErrors, touched, "workloadIdentityPoolProvider") !== null ? (
                <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-red-600 dark:text-red-400")} role="alert">
                  {fieldErrorMessage(fieldErrors, touched, "workloadIdentityPoolProvider")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <FormFieldLabelWithHelp
                htmlFor="gcpWizardServiceAccountEmail"
                label={GCP_CONNECTION_SERVICE_ACCOUNT_LABEL}
                hint={GCP_CONNECTION_SERVICE_ACCOUNT_HINT}
              />
              <Input
                id="gcpWizardServiceAccountEmail"
                data-testid="gcp-service-account-email"
                value={serviceAccountEmail}
                onChange={(event) => setServiceAccountEmail(event.target.value)}
                onBlur={() => markTouched("serviceAccountEmail")}
                placeholder="archlucid-readonly@my-gcp-project.iam.gserviceaccount.com"
                autoComplete="off"
                aria-invalid={fieldErrorMessage(fieldErrors, touched, "serviceAccountEmail") !== null}
              />
              {fieldErrorMessage(fieldErrors, touched, "serviceAccountEmail") !== null ? (
                <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-red-600 dark:text-red-400")} role="alert">
                  {fieldErrorMessage(fieldErrors, touched, "serviceAccountEmail")}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section
          className="space-y-4"
          aria-labelledby="gcp-wizard-save-heading"
          data-testid="gcp-connection-wizard-step-save"
        >
          <div>
            <h3 id="gcp-wizard-save-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
              Review and save
            </h3>
            <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{GCP_CONNECTION_WIZARD_SAVE_STEP_LEAD}</p>
          </div>

          <dl
            className={cn(
              "grid max-w-xl grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border p-4",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            <dt className="text-muted-foreground">Project ID</dt>
            <dd data-testid="gcp-wizard-summary-project">{projectId.trim() || " — "}</dd>
            <dt className="text-muted-foreground">Pool provider</dt>
            <dd className="break-all" data-testid="gcp-wizard-summary-pool">
              {workloadIdentityPoolProvider.trim() || " — "}
            </dd>
            <dt className="text-muted-foreground">Service account</dt>
            <dd className="break-all" data-testid="gcp-wizard-summary-service-account">
              {serviceAccountEmail.trim() || " — "}
            </dd>
          </dl>

          {saveSucceeded ? (
            <OperatorSuccessCallout message="GCP connection saved." testId="gcp-connection-wizard-save-success" />
          ) : null}

          {!canMutate ? (
            <p
              id="gcp-connection-wizard-mutation-disabled-hint"
              className={OPERATOR_TYPOGRAPHY.helper}
            >
              {enterpriseMutationControlDisabledTitle}
            </p>
          ) : null}
        </section>
      ) : null}

      <WizardNavButtons
        isFirstStep={step === 0}
        isLastInputStep={step === GCP_CONNECTION_DETAIL_WIZARD_STEPS.length - 1}
        canProceed
        canSubmit={!saveSucceeded && fieldsValid && canMutate}
        submitting={isSaving}
        onBack={step > 0 ? handleBack : undefined}
        onNext={step < GCP_CONNECTION_DETAIL_WIZARD_STEPS.length - 1 ? handleNext : undefined}
        onSubmit={step === GCP_CONNECTION_DETAIL_WIZARD_STEPS.length - 1 && !saveSucceeded ? () => void handleSave() : undefined}
        submitLabel="Save GCP connection"
        submittingLabel="Saving…"
        submitAriaDescribedBy={!canMutate ? "gcp-connection-wizard-mutation-disabled-hint" : undefined}
      />
    </div>
  );
}
