"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_FORM_FIELD_STACK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { Controller, useFormContext } from "react-hook-form";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { WizardFieldError } from "@/components/wizard/WizardFieldError";
import { WizardFieldHint } from "@/components/wizard/WizardFieldHint";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import {
  CLOUD_NEUTRAL_PRIMARY_COPY,
  WIZARD_CLOUD_PROVIDER_OPTIONS,
} from "@/lib/cloud-neutral-primary-copy";
import { GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL } from "@/lib/guided-intake-copy";
import type { WizardFormValues } from "@/lib/wizard-schema";

const ENVIRONMENT_OPTIONS = [
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
  { value: "development", label: "Development" },
  { value: "sandbox", label: "Sandbox" },
] as const;

/** Shared with Environment + Cloud selects so the wizard matches Input focus/border weight. */
const wizardSelectTriggerClassName =
  "w-full max-w-md border-neutral-200/90 bg-white text-left shadow-sm transition-colors hover:border-neutral-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-600 dark:bg-neutral-950/40 dark:hover:border-neutral-500";

/**
 * Step 2: system name, environment, cloud target (None, Azure, Aws, or Gcp).
 */
export function WizardStepIdentity() {
  const { register, control, formState, clearErrors, watch } = useFormContext<WizardFormValues>();
  const { errors } = formState;
  const systemNameValue = watch("systemName") ?? "";
  const systemErr = errors.systemName?.message;
  const priorErr = errors.priorManifestVersion?.message;
  const environmentErr = errors.environment?.message;
  const cloudErr = errors.cloudProvider?.message;

  return (
    <WizardStepPanel title="System identity" description="Names and deployment targets for this architecture request.">
      <div className="space-y-6">
        <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
          <WizardFieldHint
            htmlFor="wizard-systemName"
            label={GUIDED_INTAKE_CREATION_SYSTEM_NAME_LABEL}
            hint="Short project slug, e.g. OrderService. Used as the ingestion project ID."
          />
          <Input
            id="wizard-systemName"
            autoComplete="off"
            aria-invalid={systemErr != null && String(systemErr).length > 0}
            aria-describedby={systemErr ? "err-wizard-systemName" : undefined}
            {...register("systemName", {
              onChange: () => {
                clearErrors("systemName");
              },
            })}
          />
          <WizardFieldError id="err-wizard-systemName" message={systemErr != null ? String(systemErr) : undefined} />
          <p className={cn("mt-1 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {systemNameValue.trim().length} characters (minimum 2)
          </p>
        </div>

        <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
          <WizardFieldHint
            htmlFor="wizard-environment"
            label="Environment"
            hint="Lifecycle stage for this request (sandbox through production). Agents use it to judge blast radius and rollout risk."
          />
          <Controller
            name="environment"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  clearErrors("environment");
                  field.onChange(v);
                }}
              >
                <SelectTrigger id="wizard-environment" className={wizardSelectTriggerClassName}>
                  <SelectValue placeholder="Select environment" />
                </SelectTrigger>
                <SelectContent>
                  {ENVIRONMENT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <WizardFieldError
            id="err-wizard-environment"
            message={environmentErr != null ? String(environmentErr) : undefined}
          />
        </div>

        <div className={OPERATOR_FORM_FIELD_STACK_CLASS}>
          <WizardFieldHint
            htmlFor="wizard-cloud-provider"
            label="Cloud target"
            hint="Choose the cloud target that matches your workload. AWS and GCP inventory ZIPs are available as accelerated evidence sources."
          />
          <Controller
            name="cloudProvider"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={(v) => {
                  clearErrors("cloudProvider");
                  field.onChange(v);
                }}
              >
                <SelectTrigger id="wizard-cloud-provider" className={wizardSelectTriggerClassName}>
                  <SelectValue placeholder="Select cloud target" />
                </SelectTrigger>
                <SelectContent className="border-neutral-200/90 dark:border-neutral-600">
                  <SelectItem value="None">{WIZARD_CLOUD_PROVIDER_OPTIONS.none}</SelectItem>
                  <SelectItem value="Aws">{WIZARD_CLOUD_PROVIDER_OPTIONS.aws}</SelectItem>
                  <SelectItem value="Gcp">{WIZARD_CLOUD_PROVIDER_OPTIONS.gcp}</SelectItem>
                  <SelectItem value="Azure">{WIZARD_CLOUD_PROVIDER_OPTIONS.azure}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <WizardFieldError
            id="err-wizard-cloud"
            message={cloudErr != null ? String(cloudErr) : undefined}
          />
          <p className={cn("mt-1 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            {CLOUD_NEUTRAL_PRIMARY_COPY.wizardCloudTargetHint}
          </p>
        </div>

        <Separator />

        <AdvancedOptionsAccordion>
          <div>
            <WizardFieldHint
              htmlFor="wizard-priorManifest"
              label="Prior review record version (optional)"
              hint="Leave blank for greenfield. Enter a version string to use as baseline for incremental changes."
            />
            <Input
              id="wizard-priorManifest"
              autoComplete="off"
              aria-invalid={priorErr != null && String(priorErr).length > 0}
              aria-describedby={priorErr ? "err-wizard-priorManifest" : undefined}
              {...register("priorManifestVersion", {
                onChange: () => {
                  clearErrors("priorManifestVersion");
                },
              })}
            />
            <WizardFieldError id="err-wizard-priorManifest" message={priorErr != null ? String(priorErr) : undefined} />
          </div>
        </AdvancedOptionsAccordion>
      </div>
    </WizardStepPanel>
  );
}
