"use client";

import { useSearchParams } from "next/navigation";
import { useFormContext, useFormState, useWatch } from "react-hook-form";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveWizardPresetIdFromDeeplink } from "@/lib/wizard-preset-deeplink";
import {
  resolveWizardPresetLabel,
  resolveWizardRecapPresetMatchingFields,
  wizardFormFieldMatchesPreset,
  WIZARD_STARTER_PRESET_FIELD_COPY,
} from "@/lib/wizard-presets";
import { cn } from "@/lib/utils";
import type { WizardFormValues } from "@/lib/wizard-schema";

type NewRunWizardStepRecapProps = {
  readonly stepIndex: number;
  readonly quickStartWizard?: boolean;
  readonly starterPresetId?: string | null;
};

const DESCRIPTION_PREVIEW_CHARS = 180;
const CONSTRAINTS_PREVIEW_CHARS = 120;

function truncate(value: string, limit: number): { readonly preview: string; readonly clipped: boolean } {
  if (value.length <= limit) {
    return { preview: value, clipped: false };
  }

  return { preview: `${value.slice(0, limit - 3)}…`, clipped: true };
}

function formatCloudProviderLabel(cloud: string, touched: boolean): string {
  const trimmed = cloud.trim();

  if (trimmed.length === 0) {
    return "Cloud was not stored yet.";
  }

  if (trimmed === "None") {
    return touched ? "Evidence-only (no cloud target)" : "Cloud target was not chosen.";
  }

  return trimmed;
}

function recapStarterScalarLabel(
  value: string,
  notStoredLabel: string,
  input: {
    readonly quickStartWizard: boolean;
    readonly starterPresetId: string | null;
    readonly formValues: WizardFormValues;
    readonly field: keyof WizardFormValues;
    readonly dirty: boolean;
  },
): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return notStoredLabel;
  }

  if (
    input.quickStartWizard
    && input.starterPresetId !== null
    && !input.dirty
    && wizardFormFieldMatchesPreset(input.starterPresetId, input.field, input.formValues)
  ) {
    if (input.field === "systemName") {
      return "System name was filled from starter, not typed.";
    }

    if (input.field === "environment") {
      return "Environment was filled from starter, not typed.";
    }

    return `This field ${WIZARD_STARTER_PRESET_FIELD_COPY}`;
  }

  return trimmed;
}

/**
 * Carries the answers already given into later steps, so the operator can confirm the request
 * without paging back. Reads the form through context rather than props to keep the wizard shell
 * free of watch subscriptions.
 */
export function NewRunWizardStepRecap(props: NewRunWizardStepRecapProps): React.JSX.Element {
  const searchParams = useSearchParams();
  const presetIdFromUrl = resolveWizardPresetIdFromDeeplink(searchParams.get("preset"));
  const starterPresetId = props.starterPresetId ?? presetIdFromUrl;
  const presetLabel = resolveWizardPresetLabel(starterPresetId);
  const quickStartWizard = props.quickStartWizard === true;
  const { control, getValues } = useFormContext<WizardFormValues>();
  const formState = useFormState({ control });
  const systemName = useWatch({ control, name: "systemName" })?.trim() ?? "";
  const environment = useWatch({ control, name: "environment" })?.trim() ?? "";
  const cloudRaw = useWatch({ control, name: "cloudProvider" }) ?? "";
  const description = useWatch({ control, name: "description" })?.trim() ?? "";
  const constraintsList = useWatch({ control, name: "constraints" });
  const formValues = getValues();

  const matchingPresetFields =
    quickStartWizard && starterPresetId !== null
      ? resolveWizardRecapPresetMatchingFields({
          presetId: starterPresetId,
          formValues,
          dirtyFields: formState.dirtyFields,
        })
      : [];

  const constraintsEntries = Array.isArray(constraintsList) ? constraintsList.map((c) => String(c)) : [];
  const constraintsNonEmpty = constraintsEntries
    .map((c) => c.trim())
    .filter((c) => c.length > 0)
    .join(", ");
  const hasBlankConstraintEntry =
    constraintsEntries.length > 0 && constraintsEntries.some((c) => c.trim().length === 0);

  const identityStepReached = props.stepIndex >= 1;
  const hasConstraintsArray = constraintsEntries.length > 0;
  const briefPreview = truncate(description, DESCRIPTION_PREVIEW_CHARS);
  const constraintsPreview = truncate(constraintsNonEmpty, CONSTRAINTS_PREVIEW_CHARS);

  const systemDisplay = recapStarterScalarLabel(systemName, "System name was not stored yet.", {
    quickStartWizard,
    starterPresetId,
    formValues,
    field: "systemName",
    dirty: formState.dirtyFields.systemName === true,
  });

  const environmentDisplay = identityStepReached
    ? recapStarterScalarLabel(environment, "Environment was not stored yet.", {
        quickStartWizard,
        starterPresetId,
        formValues,
        field: "environment",
        dirty: formState.dirtyFields.environment === true,
      })
    : "Environment was not stored yet.";

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="new-run-wizard-step-recap"
    >
      <strong className="font-semibold">Request so far:</strong>{" "}
      {props.stepIndex >= 1 ? (
        <span className="mt-1 block text-neutral-600 dark:text-neutral-400">
          <span className="text-neutral-600 dark:text-neutral-400">Starter preset:</span> {presetLabel}
          {matchingPresetFields.length > 0 ? (
            <span className="text-neutral-600 dark:text-neutral-400">
              {" "}
              (fields still matching the preset {WIZARD_STARTER_PRESET_FIELD_COPY})
            </span>
          ) : null}
        </span>
      ) : null}
      {systemName.length > 0 || formState.touchedFields.systemName === true ? (
        <span>
          <span className="text-neutral-600 dark:text-neutral-400">System</span> {systemDisplay}
          {identityStepReached ? (
            <>
              {" "}
              · <span className="text-neutral-600 dark:text-neutral-400">Env</span> {environmentDisplay}
            </>
          ) : (
            <>
              {" "}
              · <span className="text-neutral-600 dark:text-neutral-400">Env</span>{" "}
              <span className="text-neutral-600 dark:text-neutral-400">Environment was not stored yet.</span>
            </>
          )}
          {identityStepReached ? (
            <>
              {" "}
              · <span className="text-neutral-600 dark:text-neutral-400">Cloud</span>{" "}
              {formatCloudProviderLabel(String(cloudRaw), formState.touchedFields.cloudProvider === true)}
            </>
          ) : (
            <>
              {" "}
              · <span className="text-neutral-600 dark:text-neutral-400">Cloud</span>{" "}
              <span className="text-neutral-600 dark:text-neutral-400">Cloud was not stored yet.</span>
            </>
          )}
        </span>
      ) : (
        <span className="text-neutral-600 dark:text-neutral-400">System name was not stored yet.</span>
      )}
      {props.stepIndex >= 3 ? (
        <span className="mt-1 block text-neutral-700 dark:text-neutral-300">
          <span className="text-neutral-600 dark:text-neutral-400">Brief:</span>{" "}
          {description.length > 0 ? (
            <>
              {briefPreview.preview}
              {briefPreview.clipped ? (
                <span className="text-neutral-600 dark:text-neutral-400">
                  {" "}
                  Brief clipped — return to the Brief step for full text.
                </span>
              ) : null}
            </>
          ) : (
            <span className="text-neutral-600 dark:text-neutral-400">Brief was not stored yet.</span>
          )}
        </span>
      ) : null}
      {props.stepIndex >= 4 ? (
        <span className="mt-1 block text-neutral-700 dark:text-neutral-300">
          <span className="text-neutral-600 dark:text-neutral-400">Constraints noted:</span>{" "}
          {constraintsNonEmpty.length > 0 ? (
            <>
              {constraintsPreview.preview}
              {hasBlankConstraintEntry ? (
                <span className="text-neutral-600 dark:text-neutral-400">
                  {" "}
                  (one constraint entry was stored empty)
                </span>
              ) : null}
            </>
          ) : hasBlankConstraintEntry ? (
            <span className="text-neutral-600 dark:text-neutral-400">A constraint entry was stored empty.</span>
          ) : hasConstraintsArray ? (
            <span className="text-neutral-600 dark:text-neutral-400">Constraints were stored empty.</span>
          ) : (
            <span className="text-neutral-600 dark:text-neutral-400">Constraints were not stored yet.</span>
          )}
        </span>
      ) : null}
    </div>
  );
}
