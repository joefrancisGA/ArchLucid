"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactNode } from "react";
import type { FieldErrors } from "react-hook-form";
import { useFormContext } from "react-hook-form";

import { Separator } from "@/components/ui/separator";
import { RunWizardCostPreviewCard } from "@/components/wizard/RunWizardCostPreviewCard";
import { WizardPolicyPackCloudMismatchCallout } from "@/components/wizard/WizardPolicyPackCloudMismatchCallout";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL } from "@/lib/guided-intake-copy";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { ARCHITECTURE_HINTS_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";
import { modelExecutionProfileLabel } from "@/lib/model-execution-profile";
import { FOCUSED_PILOT_MODE_POLICY_REFERENCE } from "@/lib/focused-pilot-mode-policy-packs";
import { deriveWizardPolicyPackCloudMismatch } from "@/lib/wizard-payload";
import type { WizardFormValues } from "@/lib/wizard-schema";
import {
  WIZARD_STARTER_PRESET_FIELD_COPY,
  wizardFormFieldMatchesPreset,
} from "@/lib/wizard-presets";
import type { WizardBaselineConfidence } from "@/lib/wizard-baseline-confidence";
import {
  WIZARD_BASELINE_CONFIDENCE_OPTIONS,
  wizardBaselineConfidenceSourceNote,
} from "@/lib/wizard-baseline-confidence";

function wizardConfirmIdentityField(value: string, notStoredLabel: string): string {
  return value.trim().length > 0 ? value : notStoredLabel;
}

function wizardConfirmListEntry(value: string, storedEmptyLabel: string): string {
  return value.trim().length > 0 ? value.trim() : storedEmptyLabel;
}

function wizardConfirmStarterPresetScalarField(
  value: string,
  notStoredLabel: string,
  input: {
    readonly quickStartWizard: boolean;
    readonly starterPresetId?: string;
    readonly formValues: WizardFormValues;
    readonly field: keyof WizardFormValues;
    readonly dirty: boolean;
    readonly filledCopy?: string;
  },
): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return notStoredLabel;
  }

  if (
    input.quickStartWizard
    && input.starterPresetId !== undefined
    && !input.dirty
    && wizardFormFieldMatchesPreset(input.starterPresetId, input.field, input.formValues)
  ) {
    return input.filledCopy ?? `This field ${WIZARD_STARTER_PRESET_FIELD_COPY}`;
  }

  return trimmed;
}

function wizardConfirmStarterPresetListSummary(
  values: readonly string[] | null | undefined,
  notStoredLabel: string,
  storedEmptyLabel: string,
  input: {
    readonly quickStartWizard: boolean;
    readonly starterPresetId?: string;
    readonly formValues: WizardFormValues;
    readonly field: keyof WizardFormValues;
    readonly dirty: boolean;
  },
): string | null {
  if (values === null || values === undefined) {
    return notStoredLabel;
  }

  if (values.length === 0) {
    return storedEmptyLabel;
  }

  if (
    input.quickStartWizard
    && input.starterPresetId !== undefined
    && !input.dirty
    && wizardFormFieldMatchesPreset(input.starterPresetId, input.field, input.formValues)
  ) {
    return `These entries were filled from starter, not typed.`;
  }

  return null;
}

function wizardConfirmCloudProviderField(value: string, touched: boolean): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return "Cloud was not stored.";
  }

  if (trimmed === "None") {
    return touched ? "Evidence-only (no cloud target)" : "Cloud target was not chosen.";
  }

  if (trimmed === "Azure") {
    return "Microsoft Azure";
  }

  if (trimmed === "Aws") {
    return "Amazon Web Services";
  }

  if (trimmed === "Gcp") {
    return "Google Cloud Platform";
  }

  return "Cloud target was not stored.";
}

function wizardConfirmPolicyReferences(
  values: string[] | null | undefined,
  focusedPilotModeEnabled: boolean,
): string {
  const listOptions = {
    notStoredLabel: "Policy references were not stored.",
    storedEmptyLabel: "Policy references were stored empty.",
    storedEmptyEntryLabel: "Policy reference was stored empty.",
  };

  if (!focusedPilotModeEnabled) {
    return wizardConfirmCommaChipList(values, listOptions);
  }

  const typedList = wizardConfirmCommaChipList(values, listOptions);
  const tokenLine = `This create request sends ${FOCUSED_PILOT_MODE_POLICY_REFERENCE}.`;

  if (values === null || values === undefined) {
    return `${tokenLine} Policy references were not stored on the form.`;
  }

  if (values.length === 0) {
    return `${tokenLine} No additional policy references were typed on the form.`;
  }

  return `${tokenLine} Additional references: ${typedList}.`;
}

function wizardConfirmCommaChipList(
  values: string[] | null | undefined,
  options: {
    readonly notStoredLabel: string;
    readonly storedEmptyLabel: string;
    readonly storedEmptyEntryLabel: string;
  },
): string {
  if (values === null || values === undefined) {
    return options.notStoredLabel;
  }

  if (values.length === 0) {
    return options.storedEmptyLabel;
  }

  return values.map((value) => wizardConfirmListEntry(value, options.storedEmptyEntryLabel)).join(", ");
}

/**
 * React Hook Form types field-array dirty/touched flags as nested arrays or objects, never a top-level `true`.
 * Comparing those flags to `true` is a type error and is always false at runtime.
 */
function wizardConfirmFormFlagIsSet(flag: unknown): boolean {
  if (flag === true) {
    return true;
  }

  if (Array.isArray(flag)) {
    return flag.some((entry) => wizardConfirmFormFlagIsSet(entry));
  }

  if (flag !== null && typeof flag === "object") {
    return Object.values(flag).some((value) => wizardConfirmFormFlagIsSet(value));
  }

  return false;
}

function wizardConfirmNamedAttachmentSummary(
  entries: ReadonlyArray<{ readonly name: string }> | null | undefined,
  options: {
    readonly countNotStoredLabel: string;
    readonly unitLabel: string;
    readonly nameNotStoredLabel: string;
    readonly untouchedLabel?: string;
    readonly storedEmptyCountLabel?: string;
  },
  touched = true,
): string {
  if (entries === null || entries === undefined) {
    return options.countNotStoredLabel;
  }

  if (options.untouchedLabel !== undefined && !touched && entries.length === 0) {
    return options.untouchedLabel;
  }

  if (touched && entries.length === 0 && options.storedEmptyCountLabel !== undefined) {
    return options.storedEmptyCountLabel;
  }

  const withStoredContent = entries.filter(
    (entry) => entry.name.trim().length > 0 || Object.values(entry).some((value) => typeof value === "string" && value.trim().length > 0),
  );
  const unnamedCount = withStoredContent.filter((entry) => entry.name.trim().length === 0).length;
  const namedCount = withStoredContent.length - unnamedCount;
  const countLine =
    namedCount > 0
      ? `${namedCount} ${options.unitLabel}${namedCount === 1 ? "" : "s"}`
      : withStoredContent.length === 0
        ? `0 ${options.unitLabel}s`
        : `0 named ${options.unitLabel}s`;

  if (unnamedCount === 0) {
    return countLine;
  }

  return `${countLine} (${unnamedCount} ${options.nameNotStoredLabel})`;
}

function ErrorList({ errors }: { errors: FieldErrors<WizardFormValues> }) {
  const messages: string[] = [];

  const walk = (prefix: string, err: unknown): void => {
    if (!err || typeof err !== "object") {
      return;
    }

    if ("message" in err && typeof (err as { message?: string }).message === "string") {
      const msg = (err as { message: string }).message;

      if (msg) {
        messages.push(prefix ? `${prefix}: ${msg}` : msg);
      }

      return;
    }

    for (const [key, val] of Object.entries(err)) {
      if (key === "ref" || key === "type" || key === "types") {
        continue;
      }

      walk(prefix ? `${prefix}.${key}` : key, val);
    }
  };

  walk("", errors);

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      className={cn("rounded-md border border-rose-600/40 bg-al-surface-raised px-3 py-2 text-al-text-primary dark:border-rose-700/50 p-3", OPERATOR_TYPOGRAPHY.body)}
    >
      <p className="m-0 font-semibold">Fix validation errors before creating the architecture review:</p>
      <ul className="mt-2 mb-0 list-disc pl-5">
        {messages.map((m) => (
          <li key={m}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

function ReadOnlyBlock(props: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className={cn("font-semibold text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.title}</h3>
      <div className={cn("mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>{props.children}</div>
    </section>
  );
}

/**
 * Step 6: read-only summary and validation error surface before API submit (handled by parent nav).
 */
export function WizardStepReview(props: {
  readonly focusedPilotModeEnabled?: boolean;
  readonly quickStartWizard?: boolean;
  readonly starterPresetId?: string;
  readonly baselineReviewCycleHours?: string;
  readonly baselineConfidence?: WizardBaselineConfidence;
}) {
  const { watch, formState } = useFormContext<WizardFormValues>();
  const v = watch();
  const focusedPilotModeEnabled = props.focusedPilotModeEnabled ?? true;
  const quickStartWizard = props.quickStartWizard === true;
  const starterPresetContext = {
    quickStartWizard,
    starterPresetId: props.starterPresetId,
    formValues: v,
  };
  const policyPackCloudMismatch = deriveWizardPolicyPackCloudMismatch(
    {
      ...v,
      policyReferences: v.policyReferences ?? [],
    },
    {
      focusedPilotModeEnabled,
    },
  );

  return (
    <WizardStepPanel
      title="Review & submit"
      description={`Confirm values below. Use Back to edit earlier steps. ${BUYER_START_ARCHITECTURE_REVIEW_CTA} sends POST /v1/architecture/request.`}
    >
      <div className="space-y-4">
        <ErrorList errors={formState.errors} />

        {policyPackCloudMismatch !== null ? (
          <WizardPolicyPackCloudMismatchCallout detail={policyPackCloudMismatch} />
        ) : null}

        <RunWizardCostPreviewCard />

        {props.baselineReviewCycleHours !== undefined || props.baselineConfidence !== undefined ? (
          <ReadOnlyBlock title="Review cycle baseline">
            <dl className="m-0 grid gap-1 sm:grid-cols-[12rem_1fr]">
              <dt className="text-neutral-500">Review cycle hours</dt>
              <dd className="m-0">
                {props.baselineReviewCycleHours?.trim().length
                  ? props.baselineReviewCycleHours.trim()
                  : "Review cycle hours were not stored."}
              </dd>
              <dt className="text-neutral-500">Estimate confidence</dt>
              <dd className="m-0">
                {props.baselineConfidence !== undefined
                  ? wizardBaselineConfidenceSourceNote(props.baselineConfidence)
                  : "Confidence was not stored."}
              </dd>
            </dl>
            <p className={cn("m-0 mt-2 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
              Confidence options:{" "}
              {WIZARD_BASELINE_CONFIDENCE_OPTIONS.map((option) => option.label).join(" · ")}
            </p>
          </ReadOnlyBlock>
        ) : null}

        <ReadOnlyBlock title="Identity">
          <dl className="m-0 grid gap-1 sm:grid-cols-[8rem_1fr]">
            <dt className="text-neutral-500">System</dt>
            <dd className="m-0">
              {(() => {
                const systemName = v.systemName?.trim() ?? "";

                if (systemName.length === 0) {
                  return wizardConfirmIdentityField(systemName, "System name was not stored.");
                }

                if (
                  quickStartWizard
                  && props.starterPresetId !== undefined
                  && !formState.dirtyFields.systemName
                  && wizardFormFieldMatchesPreset(props.starterPresetId, "systemName", v)
                ) {
                  return "System name was filled from starter, not typed.";
                }

                return systemName;
              })()}
            </dd>
            <dt className="text-neutral-500">Environment</dt>
            <dd className="m-0">
              {wizardConfirmStarterPresetScalarField(v.environment, "Environment was not stored.", {
                ...starterPresetContext,
                field: "environment",
                dirty: formState.dirtyFields.environment === true,
                filledCopy: `Environment ${WIZARD_STARTER_PRESET_FIELD_COPY}`,
              })}
            </dd>
            <dt className="text-neutral-500">Cloud</dt>
            <dd className="m-0">
              {wizardConfirmCloudProviderField(v.cloudProvider, formState.touchedFields.cloudProvider === true)}
            </dd>
            <dt className="text-neutral-500">Prior manifest</dt>
            <dd className="m-0">
              {v.priorManifestVersion === null || v.priorManifestVersion === undefined
                ? "Prior manifest was not stored."
                : formState.touchedFields.priorManifestVersion === true
                  ? v.priorManifestVersion.trim() || "Prior manifest was stored empty."
                  : "Prior manifest was not entered."}
            </dd>
          </dl>
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Description">
          <p className="m-0 whitespace-pre-wrap">
            {wizardConfirmStarterPresetScalarField(v.description, "Description was not stored.", {
              ...starterPresetContext,
              field: "description",
              dirty: formState.dirtyFields.description === true,
              filledCopy: `Description ${WIZARD_STARTER_PRESET_FIELD_COPY}`,
            })}
          </p>
          {v.inlineRequirements === null || v.inlineRequirements === undefined ? (
            <p className={cn("mt-2 m-0", OPERATOR_TYPOGRAPHY.helper)}>Inline requirements were not stored.</p>
          ) : v.inlineRequirements.some((s) => s.trim()) ? (
            <div className="mt-2">
              <p className={cn("m-0 font-medium text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Inline requirements</p>
              <ul className="mt-1 list-disc pl-5">
                {v.inlineRequirements.map((line, index) => (
                  <li key={`inline-requirement-${index}`}>
                    {wizardConfirmListEntry(line, "Requirement was stored empty.")}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className={cn("mt-2 m-0", OPERATOR_TYPOGRAPHY.helper)}>Inline requirements were stored empty.</p>
          )}
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Constraints & capabilities">
          <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Constraints</p>
          {(() => {
            const presetSummary = wizardConfirmStarterPresetListSummary(
              v.constraints,
              "Constraints were not stored.",
              "Constraints were stored empty.",
              {
                ...starterPresetContext,
                field: "constraints",
                dirty: wizardConfirmFormFlagIsSet(formState.dirtyFields.constraints),
              },
            );

            if (presetSummary !== null) {
              return <p className="m-0">{presetSummary}</p>;
            }

            return v.constraints === null || v.constraints === undefined ? (
              <p className="m-0">Constraints were not stored.</p>
            ) : v.constraints.length === 0 ? (
              <p className="m-0">Constraints were stored empty.</p>
            ) : (
              <ul className="mt-1 list-disc pl-5">
                {v.constraints.map((c, index) => (
                  <li key={`constraint-${index}`}>
                    {wizardConfirmListEntry(c, "Constraint was stored empty.")}
                  </li>
                ))}
              </ul>
            );
          })()}
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>
            {GUIDED_INTAKE_STRUCTURED_BRIEF_REQUIRED_CAPABILITIES_LABEL}
          </p>
          {(() => {
            const presetSummary = wizardConfirmStarterPresetListSummary(
              v.requiredCapabilities,
              "Required capabilities were not stored.",
              "Required capabilities were stored empty.",
              {
                ...starterPresetContext,
                field: "requiredCapabilities",
                dirty: wizardConfirmFormFlagIsSet(formState.dirtyFields.requiredCapabilities),
              },
            );

            if (presetSummary !== null) {
              return <p className="m-0">{presetSummary}</p>;
            }

            return v.requiredCapabilities === null || v.requiredCapabilities === undefined ? (
              <p className="m-0">Required capabilities were not stored.</p>
            ) : v.requiredCapabilities.length === 0 ? (
              <p className="m-0">Required capabilities were stored empty.</p>
            ) : (
              <ul className="mt-1 list-disc pl-5">
                {v.requiredCapabilities.map((c, index) => (
                  <li key={`required-capability-${index}`}>
                    {wizardConfirmListEntry(c, "Required capability was stored empty.")}
                  </li>
                ))}
              </ul>
            );
          })()}
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Assumptions</p>
          {v.assumptions === null || v.assumptions === undefined ? (
            <p className="m-0">Assumptions were not stored.</p>
          ) : v.assumptions.length === 0 ? (
            <p className="m-0">Assumptions were stored empty.</p>
          ) : (
            <ul className="mt-1 list-disc pl-5">
              {v.assumptions.map((c, index) => (
                <li key={`assumption-${index}`}>
                  {wizardConfirmListEntry(c, "Assumption was stored empty.")}
                </li>
              ))}
            </ul>
          )}
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Advanced">
          <p className={cn("m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Execution profile</p>
          <p className="m-0">
            {formState.touchedFields.modelExecutionProfileOverride === true
              ? v.modelExecutionProfileOverride === "WorkspaceDefault"
                ? "Workspace default was selected on the form. The create request does not send an execution profile."
                : `${modelExecutionProfileLabel(v.modelExecutionProfileOverride)} will be sent on the create request.`
              : "Execution profile was not chosen."}
          </p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Policy references</p>
          <p className="m-0">
            {wizardConfirmPolicyReferences(v.policyReferences, focusedPilotModeEnabled)}
          </p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>{ARCHITECTURE_HINTS_BUYER_LABEL}</p>
          <p className="m-0">
            {wizardConfirmCommaChipList(v.topologyHints, {
              notStoredLabel: "Architecture hints were not stored.",
              storedEmptyLabel: "Architecture hints were stored empty.",
              storedEmptyEntryLabel: "Architecture hint was stored empty.",
            })}
          </p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Security baseline hints</p>
          <p className="m-0">
            {wizardConfirmCommaChipList(v.securityBaselineHints, {
              notStoredLabel: "Security baseline hints were not stored.",
              storedEmptyLabel: "Security baseline hints were stored empty.",
              storedEmptyEntryLabel: "Security baseline hint was stored empty.",
            })}
          </p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Documents</p>
          <p className="m-0">
            {wizardConfirmNamedAttachmentSummary(
              v.documents,
              {
                countNotStoredLabel: "Document count was not stored.",
                unitLabel: "attached document",
                nameNotStoredLabel: "document name was not stored",
                untouchedLabel: "Documents were not added when untouched.",
                storedEmptyCountLabel: "Documents were stored empty.",
              },
              wizardConfirmFormFlagIsSet(formState.touchedFields.documents),
            )}
          </p>
          <p className={cn("mt-2 m-0 text-neutral-500", OPERATOR_TYPOGRAPHY.helper)}>Infrastructure declarations</p>
          <p className="m-0">
            {wizardConfirmNamedAttachmentSummary(
              v.infrastructureDeclarations,
              {
                countNotStoredLabel: "Infrastructure declaration count was not stored.",
                unitLabel: "declaration",
                nameNotStoredLabel: "declaration name was not stored",
                untouchedLabel: "Infrastructure declarations were not added.",
                storedEmptyCountLabel: "Infrastructure declarations were stored empty.",
              },
              wizardConfirmFormFlagIsSet(formState.touchedFields.infrastructureDeclarations),
            )}
          </p>
        </ReadOnlyBlock>

        <Separator />

        <ReadOnlyBlock title="Request id">
          <code className={OPERATOR_TYPOGRAPHY.helper}>
            {wizardConfirmIdentityField(v.requestId, "Request id was not stored.")}
          </code>
        </ReadOnlyBlock>
      </div>
    </WizardStepPanel>
  );
}
