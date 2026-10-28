"use client";

import { useSearchParams } from "next/navigation";
import { useFormContext, useWatch } from "react-hook-form";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveWizardPresetIdFromDeeplink } from "@/lib/wizard-preset-deeplink";
import { resolveWizardPresetLabel, WIZARD_STARTER_PRESET_FIELD_COPY } from "@/lib/wizard-presets";
import { cn } from "@/lib/utils";
import type { WizardFormValues } from "@/lib/wizard-schema";

type NewRunWizardStepRecapProps = {
  readonly stepIndex: number;
};

const DESCRIPTION_PREVIEW_CHARS = 180;
const CONSTRAINTS_PREVIEW_CHARS = 120;

function truncate(value: string, limit: number): { readonly preview: string; readonly clipped: boolean } {
  if (value.length <= limit) {
    return { preview: value, clipped: false };
  }

  return { preview: `${value.slice(0, limit - 3)}…`, clipped: true };
}

function formatCloudProviderLabel(cloud: string): string {
  const trimmed = cloud.trim();

  if (trimmed.length === 0) {
    return "Cloud was not stored yet.";
  }

  if (trimmed === "None") {
    return "Evidence-only (no cloud target)";
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
  const presetId = resolveWizardPresetIdFromDeeplink(searchParams.get("preset"));
  const presetLabel = resolveWizardPresetLabel(presetId);
  const { control } = useFormContext<WizardFormValues>();
  const systemName = useWatch({ control, name: "systemName" })?.trim() ?? "";
  const environment = useWatch({ control, name: "environment" })?.trim() ?? "";
  const cloudRaw = useWatch({ control, name: "cloudProvider" }) ?? "";
  const description = useWatch({ control, name: "description" })?.trim() ?? "";
  const constraintsList = useWatch({ control, name: "constraints" });
  const constraints =
    Array.isArray(constraintsList) && constraintsList.length > 0
      ? constraintsList
          .map((c) => String(c).trim())
          .filter((c) => c.length > 0)
          .join(", ")
      : "";

  const identityStepReached = props.stepIndex >= 1;
  const hasConstraintsArray =
    Array.isArray(constraintsList) && constraintsList.length > 0;
  const briefPreview = truncate(description, DESCRIPTION_PREVIEW_CHARS);
  const constraintsPreview = truncate(constraints, CONSTRAINTS_PREVIEW_CHARS);

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
          {presetId !== null ? (
            <span className="text-neutral-600 dark:text-neutral-400">
              {" "}
              (fields still matching the preset {WIZARD_STARTER_PRESET_FIELD_COPY})
            </span>
          ) : null}
        </span>
      ) : null}
      {systemName.length > 0 ? (
        <span>
          <span className="text-neutral-600 dark:text-neutral-400">System</span> {systemName}
          {identityStepReached ? (
            <>
              {" "}
              · <span className="text-neutral-600 dark:text-neutral-400">Env</span>{" "}
              {environment.length > 0 ? (
                environment
              ) : (
                <span className="text-neutral-600 dark:text-neutral-400">Environment was not stored yet.</span>
              )}
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
              {formatCloudProviderLabel(String(cloudRaw))}
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
          {constraints.length > 0 ? (
            constraintsPreview.preview
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
