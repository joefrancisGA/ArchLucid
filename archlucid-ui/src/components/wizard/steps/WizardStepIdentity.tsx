"use client";

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
import type { WizardFormValues } from "@/lib/wizard-schema";

const ENVIRONMENT_OPTIONS = [
  { value: "staging", label: "Staging" },
  { value: "production", label: "Production" },
  { value: "development", label: "Development" },
  { value: "sandbox", label: "Sandbox" },
] as const;

/** Shared with Environment + Cloud selects so the wizard matches Input focus/border weight. */
const wizardSelectTriggerClassName =
  "w-full max-w-md border-neutral-200/90 bg-white text-left shadow-sm transition-colors hover:border-neutral-300 focus:ring-teal-600/35 dark:border-neutral-600 dark:bg-neutral-950/40 dark:hover:border-neutral-500";

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
        <div>
          <WizardFieldHint
            htmlFor="wizard-systemName"
            label="System name"
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
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {systemNameValue.trim().length} characters (minimum 2)
          </p>
        </div>

        <div>
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

        <div>
          <WizardFieldHint
            htmlFor="wizard-cloud-provider"
            label="Cloud target"
            hint="Choose None for brief/docs/diagram/IaC-only reviews. Choose Azure when the workload runs on Azure or you attach Azure extractor evidence. Aws and Gcp capture target-cloud intent for multi-cloud RFPs; attach Terraform or other IaC for best results until V1.1 deep analysis ships."
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
                  <SelectItem value="None">No cloud / evidence-only</SelectItem>
                  <SelectItem value="Azure">Microsoft Azure (accelerated V1 path)</SelectItem>
                  <SelectItem value="Aws">Amazon Web Services (intent capture — V1.1 deep analysis)</SelectItem>
                  <SelectItem value="Gcp">Google Cloud Platform (intent capture — V1.1 deep analysis)</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          <WizardFieldError
            id="err-wizard-cloud"
            message={cloudErr != null ? String(cloudErr) : undefined}
          />
          <p className="mt-1 text-xs text-neutral-500">
            Evidence-only is the default first-pilot path. Azure export accelerates topology and cost findings when InfoSec approves the script.
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
