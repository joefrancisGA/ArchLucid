"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SPECIALTY_REVIEW_CLOUD_CONTEXT_OPTIONS,
  type SpecialtyReviewCloudContext,
} from "@/lib/specialty-review-templates";

export type SpecialtyTemplateCloudContextPickerProps = {
  readonly cloudContext: SpecialtyReviewCloudContext;
  readonly onCloudChange: (cloud: SpecialtyReviewCloudContext) => void;
  readonly fieldsetId: string;
};

/** Cloud context selector for the SaaS readiness specialty template (keyboard-visible focus). */
export function SpecialtyTemplateCloudContextPicker(
  props: SpecialtyTemplateCloudContextPickerProps,
): React.ReactElement {
  return (
    <fieldset
      id={props.fieldsetId}
      className="m-0 space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-800 dark:bg-neutral-900/30"
      data-testid="specialty-template-cloud-context-picker"
    >
      <legend className={cn("text-xs font-semibold uppercase tracking-wide text-al-text-secondary")}>
        Cloud context for SaaS readiness
      </legend>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        Optional — choose a hyperscaler when you want cloud-specific evidence guidance prefilled in review setup.
      </p>
      <div className="flex flex-wrap gap-2">
        {SPECIALTY_REVIEW_CLOUD_CONTEXT_OPTIONS.map((option) => {
          const inputId = `${props.fieldsetId}-${option.id}`;
          const selected = props.cloudContext === option.id;

          return (
            <label
              key={option.id}
              htmlFor={inputId}
              className={cn(
                "inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm transition-colors",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--al-accent-border-focus)]",
                selected
                  ? "border-neutral-900 bg-neutral-50 font-semibold text-neutral-900 shadow-sm dark:border-neutral-200 dark:bg-neutral-900 dark:text-neutral-100"
                  : "border-neutral-200 bg-white font-medium text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600",
              )}
            >
              <input
                id={inputId}
                type="radio"
                name={`${props.fieldsetId}-cloud`}
                className="sr-only"
                checked={selected}
                onChange={() => props.onCloudChange(option.id)}
              />
              {selected ? <Check aria-hidden className="h-3.5 w-3.5 shrink-0" /> : null}
              {option.label}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
