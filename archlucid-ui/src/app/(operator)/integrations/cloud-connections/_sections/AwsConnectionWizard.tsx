"use client";

import { cn } from "@/lib/utils";
import { useCallback, useMemo, useState } from "react";

import { WizardNavButtons } from "@/components/wizard/WizardNavButtons";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { configureAwsTier2Connection } from "@/lib/api/aws-cloud-connections-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AWS_CONNECTION_SAVE_FAILED_ERROR } from "@/lib/aws-cloud-connection-copy";
import { enterpriseMutationControlDisabledTitle } from "@/lib/enterprise-controls-context-copy";

import {
  fieldErrorMessage,
  hasAwsConnectionFieldErrors,
  validateAwsConnectionFields,
  type AwsConnectionFieldKey,
} from "./aws-connection-field-validation";
import {
  AWS_CONNECTION_DETAIL_WIZARD_STEPS,
  AWS_CONNECTION_WIZARD_IAM_STEP_LEAD,
  AWS_CONNECTION_WIZARD_IDS_STEP_LEAD,
  AWS_CONNECTION_WIZARD_SAVE_STEP_LEAD,
} from "./aws-connection-wizard-content";
import { useAwsConnectionData } from "./AwsConnectionDataContext";

type Props = {
  readonly onSaved?: () => void | Promise<void>;
};

export function AwsConnectionWizard(props: Props): React.ReactElement {
  const { canMutate, refreshConnections, setFormError, setActionMessage } = useAwsConnectionData();
  const [step, setStep] = useState(0);
  const [accountId, setAccountId] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [roleArn, setRoleArn] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSucceeded, setSaveSucceeded] = useState(false);
  const [touched, setTouched] = useState<Record<AwsConnectionFieldKey, boolean>>({
    accountId: false,
    region: false,
    roleArn: false,
  });

  const fieldErrors = useMemo(
    () => validateAwsConnectionFields(accountId, region, roleArn),
    [accountId, region, roleArn],
  );

  const fieldsValid = !hasAwsConnectionFieldErrors(fieldErrors);

  const completedSteps = useMemo(() => {
    const done: number[] = [];

    if (step > 0) {
      done.push(0);
    }

    if (step > 1 && fieldsValid) {
      done.push(1);
    }

    if (saveSucceeded) {
      done.push(2);
    }

    return done;
  }, [fieldsValid, saveSucceeded, step]);

  const markTouched = useCallback((field: AwsConnectionFieldKey) => {
    setTouched((current) => ({ ...current, [field]: true }));
  }, []);

  const touchAllFields = useCallback(() => {
    setTouched({ accountId: true, region: true, roleArn: true });
  }, []);

  const handleNext = useCallback(() => {
    if (step === 1 && !fieldsValid) {
      touchAllFields();

      return;
    }

    setStep((current) => Math.min(current + 1, AWS_CONNECTION_DETAIL_WIZARD_STEPS.length - 1));
  }, [fieldsValid, step, touchAllFields]);

  const handleBack = useCallback(() => {
    setStep((current) => Math.max(current - 1, 0));
  }, []);

  const handleSave = useCallback(async () => {
    if (!canMutate || !fieldsValid) {
      touchAllFields();

      return;
    }

    setFormError(null, "connection");
    setActionMessage(null, "connection");
    setIsSaving(true);

    try {
      await configureAwsTier2Connection({
        accountId: accountId.trim(),
        region: region.trim(),
        roleArn: roleArn.trim(),
      });
      await refreshConnections();
      setSaveSucceeded(true);
      setActionMessage("AWS connection saved.", "connection");
      await props.onSaved?.();
    } catch (err) {
      console.error(err);
      setFormError(AWS_CONNECTION_SAVE_FAILED_ERROR, "connection");
    } finally {
      setIsSaving(false);
    }
  }, [
    accountId,
    canMutate,
    fieldsValid,
    props,
    refreshConnections,
    region,
    roleArn,
    setActionMessage,
    setFormError,
    touchAllFields,
  ]);

  return (
    <div className="space-y-6" data-testid="aws-connection-wizard">
      <WizardStepper
        steps={AWS_CONNECTION_DETAIL_WIZARD_STEPS}
        currentStep={step}
        completedSteps={completedSteps}
      />

      {step === 0 ? (
        <section className="space-y-3" aria-labelledby="aws-wizard-iam-heading" data-testid="aws-connection-wizard-step-iam">
          <h3 id="aws-wizard-iam-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
            Configure the read-only IAM role
          </h3>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{AWS_CONNECTION_WIZARD_IAM_STEP_LEAD}</p>
        </section>
      ) : null}

      {step === 1 ? (
        <section className="space-y-4" aria-labelledby="aws-wizard-ids-heading" data-testid="aws-connection-wizard-step-ids">
          <div>
            <h3 id="aws-wizard-ids-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
              Enter connection identifiers
            </h3>
            <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{AWS_CONNECTION_WIZARD_IDS_STEP_LEAD}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="awsWizardAccountId">AWS account ID</Label>
              <Input
                id="awsWizardAccountId"
                data-testid="aws-account-id"
                value={accountId}
                onChange={(event) => setAccountId(event.target.value)}
                onBlur={() => markTouched("accountId")}
                placeholder="123456789012"
                autoComplete="off"
                aria-invalid={fieldErrorMessage(fieldErrors, touched, "accountId") !== null}
              />
              {fieldErrorMessage(fieldErrors, touched, "accountId") !== null ? (
                <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-red-600 dark:text-red-400")} role="alert">
                  {fieldErrorMessage(fieldErrors, touched, "accountId")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="awsWizardRegion">Primary region</Label>
              <Input
                id="awsWizardRegion"
                data-testid="aws-region"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                onBlur={() => markTouched("region")}
                placeholder="us-east-1"
                autoComplete="off"
                aria-invalid={fieldErrorMessage(fieldErrors, touched, "region") !== null}
              />
              {fieldErrorMessage(fieldErrors, touched, "region") !== null ? (
                <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-red-600 dark:text-red-400")} role="alert">
                  {fieldErrorMessage(fieldErrors, touched, "region")}
                </p>
              ) : null}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="awsWizardRoleArn">Read-only IAM role ARN</Label>
              <Input
                id="awsWizardRoleArn"
                data-testid="aws-role-arn"
                value={roleArn}
                onChange={(event) => setRoleArn(event.target.value)}
                onBlur={() => markTouched("roleArn")}
                placeholder="arn:aws:iam::123456789012:role/ArchLucidReadOnly"
                autoComplete="off"
                aria-invalid={fieldErrorMessage(fieldErrors, touched, "roleArn") !== null}
              />
              {fieldErrorMessage(fieldErrors, touched, "roleArn") !== null ? (
                <p className={cn(OPERATOR_TYPOGRAPHY.helper, "text-red-600 dark:text-red-400")} role="alert">
                  {fieldErrorMessage(fieldErrors, touched, "roleArn")}
                </p>
              ) : null}
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4" aria-labelledby="aws-wizard-save-heading" data-testid="aws-connection-wizard-step-save">
          <div>
            <h3 id="aws-wizard-save-heading" className={OPERATOR_TYPOGRAPHY.cardTitle}>
              Review and save
            </h3>
            <p className={cn("mt-1", OPERATOR_TYPOGRAPHY.helper)}>{AWS_CONNECTION_WIZARD_SAVE_STEP_LEAD}</p>
          </div>

          <dl
            className={cn(
              "grid max-w-xl grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-md border p-4",
              OPERATOR_TYPOGRAPHY.body,
            )}
          >
            <dt className="text-muted-foreground">Account ID</dt>
            <dd data-testid="aws-wizard-summary-account">{accountId.trim() || "—"}</dd>
            <dt className="text-muted-foreground">Region</dt>
            <dd data-testid="aws-wizard-summary-region">{region.trim() || "—"}</dd>
            <dt className="text-muted-foreground">Role ARN</dt>
            <dd className="break-all" data-testid="aws-wizard-summary-role">
              {roleArn.trim() || "—"}
            </dd>
          </dl>

          {saveSucceeded ? (
            <OperatorSuccessCallout message="AWS connection saved." testId="aws-connection-wizard-save-success" />
          ) : null}

          {!canMutate ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>
              Elevated workspace permissions required to save a cloud connection.
            </p>
          ) : null}
        </section>
      ) : null}

      <WizardNavButtons
        isFirstStep={step === 0}
        isLastInputStep={step === AWS_CONNECTION_DETAIL_WIZARD_STEPS.length - 1}
        canProceed
        canSubmit={!saveSucceeded && fieldsValid && canMutate}
        submitting={isSaving}
        onBack={step > 0 ? handleBack : undefined}
        onNext={step < AWS_CONNECTION_DETAIL_WIZARD_STEPS.length - 1 ? handleNext : undefined}
        onSubmit={step === AWS_CONNECTION_DETAIL_WIZARD_STEPS.length - 1 && !saveSucceeded ? () => void handleSave() : undefined}
        submitLabel="Save AWS connection"
        submittingLabel="Saving…"
      />
    </div>
  );
}
