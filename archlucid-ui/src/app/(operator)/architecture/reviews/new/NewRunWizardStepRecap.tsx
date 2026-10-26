"use client";

import { useFormContext, useWatch } from "react-hook-form";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { WizardFormValues } from "@/lib/wizard-schema";

type NewRunWizardStepRecapProps = {
  readonly stepIndex: number;
};

const DESCRIPTION_PREVIEW_CHARS = 180;
const CONSTRAINTS_PREVIEW_CHARS = 120;

function truncate(value: string, limit: number): string {
  return value.length > limit ? `${value.slice(0, limit - 3)}…` : value;
}

/**
 * Carries the answers already given into later steps, so the operator can confirm the request
 * without paging back. Reads the form through context rather than props to keep the wizard shell
 * free of watch subscriptions.
 */
export function NewRunWizardStepRecap(props: NewRunWizardStepRecapProps): React.JSX.Element {
  const { control } = useFormContext<WizardFormValues>();
  const systemName = useWatch({ control, name: "systemName" })?.trim() ?? "";
  const environment = useWatch({ control, name: "environment" })?.trim() ?? "";
  const cloud = useWatch({ control, name: "cloudProvider" })?.trim() ?? "";
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

  return (
    <div
      className={cn(
        "rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="new-run-wizard-step-recap"
    >
      <strong className="font-semibold">Request so far:</strong>{" "}
      {systemName.length > 0 ? (
        <span>
          <span className="text-neutral-600 dark:text-neutral-400">System</span> {systemName}
          {identityStepReached ? (
            <>
              {" "}
              · <span className="text-neutral-600 dark:text-neutral-400">Env</span> {environment}
            </>
          ) : (
            <>
              {" "}
              · <span className="text-neutral-600 dark:text-neutral-400">Env</span>{" "}
              <span className="text-neutral-600 dark:text-neutral-400">Environment was not stored.</span>
            </>
          )}
          {cloud.length > 0 ? (
            <>
              {" "}
              · <span className="text-neutral-600 dark:text-neutral-400">Cloud</span> {cloud}
            </>
          ) : (
            <>
              {" "}
              · <span className="text-neutral-600 dark:text-neutral-400">Cloud</span>{" "}
              <span className="text-neutral-600 dark:text-neutral-400">Cloud was not stored.</span>
            </>
          )}
        </span>
      ) : (
        <span className="text-neutral-600 dark:text-neutral-400">Add identity on this step.</span>
      )}
      {props.stepIndex >= 3 ? (
        description.length > 0 ? (
          <span className="mt-1 block text-neutral-700 dark:text-neutral-300">
            <span className="text-neutral-600 dark:text-neutral-400">Brief:</span>{" "}
            {truncate(description, DESCRIPTION_PREVIEW_CHARS)}
          </span>
        ) : (
          <span className="mt-1 block text-neutral-600 dark:text-neutral-400">Brief was not stored.</span>
        )
      ) : null}
      {props.stepIndex >= 4 ? (
        constraints.length > 0 ? (
          <span className="mt-1 block text-neutral-700 dark:text-neutral-300">
            <span className="text-neutral-600 dark:text-neutral-400">Constraints noted:</span>{" "}
            {truncate(constraints, CONSTRAINTS_PREVIEW_CHARS)}
          </span>
        ) : (
          <span className="mt-1 block text-neutral-600 dark:text-neutral-400">Constraints were not stored.</span>
        )
      ) : null}
    </div>
  );
}
