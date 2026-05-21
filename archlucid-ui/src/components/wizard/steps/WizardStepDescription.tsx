"use client";

import { useState } from "react";
import { Controller, useFormContext } from "react-hook-form";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WizardFieldError } from "@/components/wizard/WizardFieldError";
import { WizardFieldHint } from "@/components/wizard/WizardFieldHint";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import { draftArchitectureRequest } from "@/lib/api";
import { isApiRequestError } from "@/lib/api-request-error";
import type { ApiProblemDetails } from "@/lib/api-problem";
import { useWizardAiSuggestedFields } from "@/lib/wizard-ai-suggested-fields";
import type { WizardFormValues } from "@/lib/wizard-schema";

function mergeUniqueStrings(existing: readonly string[], incoming: readonly string[]): string[] {
  const seen = new Set(existing.map((value) => value.trim().toLowerCase()).filter((value) => value.length > 0));
  const merged = [...existing];

  for (const value of incoming) {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const key = trimmed.toLowerCase();

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    merged.push(trimmed);
  }

  return merged;
}

/**
 * Step 3: primary description + dynamic inline requirements.
 */
export function WizardStepDescription() {
  const { control, watch, setValue, formState, clearErrors, getValues } = useFormContext<WizardFormValues>();
  const { errors } = formState;
  const { markAiSuggested } = useWizardAiSuggestedFields();
  const descErr = errors.description?.message;
  const inlineReqErr = errors.inlineRequirements?.message;
  const description = watch("description") ?? "";
  const inlineRequirements = watch("inlineRequirements") ?? [];
  const [suggestBusy, setSuggestBusy] = useState(false);
  const [suggestError, setSuggestError] = useState<{
    message: string;
    problem: ApiProblemDetails | null;
    correlationId: string | null;
  } | null>(null);

  const updateInlineRequirement = (index: number, value: string) => {
    const next = [...inlineRequirements];
    next[index] = value;
    clearErrors("inlineRequirements");
    setValue("inlineRequirements", next, { shouldValidate: true, shouldDirty: true });
  };

  const appendInlineRequirement = () => {
    clearErrors("inlineRequirements");
    setValue("inlineRequirements", [...inlineRequirements, ""], { shouldValidate: true, shouldDirty: true });
  };

  const removeInlineRequirement = (index: number) => {
    clearErrors("inlineRequirements");
    setValue(
      "inlineRequirements",
      inlineRequirements.filter((_, idx) => idx !== index),
      { shouldValidate: true, shouldDirty: true },
    );
  };

  async function onSuggestFields(): Promise<void> {
    const freeTextDescription = description.trim();

    if (freeTextDescription.length < 20 || suggestBusy) {
      return;
    }

    setSuggestBusy(true);
    setSuggestError(null);

    try {
      const response = await draftArchitectureRequest({ freeTextDescription });
      const current = getValues();

      const nextConstraints = mergeUniqueStrings(current.constraints ?? [], response.suggestedConstraints ?? []);
      const nextCapabilities = mergeUniqueStrings(
        current.requiredCapabilities ?? [],
        response.suggestedCapabilities ?? [],
      );
      const nextAssumptions = mergeUniqueStrings(current.assumptions ?? [], response.suggestedAssumptions ?? []);
      const nextTopology = mergeUniqueStrings(current.topologyHints ?? [], response.topologyHints ?? []);
      const nextSecurity = mergeUniqueStrings(current.securityBaselineHints ?? [], response.securityBaselineHints ?? []);

      setValue("constraints", nextConstraints, { shouldValidate: true, shouldDirty: true });
      setValue("requiredCapabilities", nextCapabilities, { shouldValidate: true, shouldDirty: true });
      setValue("assumptions", nextAssumptions, { shouldValidate: true, shouldDirty: true });
      setValue("topologyHints", nextTopology, { shouldValidate: true, shouldDirty: true });
      setValue("securityBaselineHints", nextSecurity, { shouldValidate: true, shouldDirty: true });

      markAiSuggested("constraints", response.suggestedConstraints ?? []);
      markAiSuggested("requiredCapabilities", response.suggestedCapabilities ?? []);
      markAiSuggested("assumptions", response.suggestedAssumptions ?? []);
      markAiSuggested("topologyHints", response.topologyHints ?? []);
      markAiSuggested("securityBaselineHints", response.securityBaselineHints ?? []);
    } catch (e: unknown) {
      if (isApiRequestError(e)) {
        setSuggestError({
          message: e.message,
          problem: e.problem,
          correlationId: e.correlationId,
        });
      } else {
        setSuggestError({
          message: e instanceof Error ? e.message : "Could not suggest fields.",
          problem: null,
          correlationId: null,
        });
      }
    } finally {
      setSuggestBusy(false);
    }
  }

  return (
    <WizardStepPanel
      title="Description & requirements"
      description="The main narrative agents use, plus optional structured requirement lines."
    >
      <div className="space-y-6">
        <div>
          <WizardFieldHint
            htmlFor="wizard-description"
            label="Description"
            hint="Describe what the architecture must achieve. The AI agents use this as the primary input signal."
          />
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <Textarea
                id="wizard-description"
                rows={8}
                className="min-h-[140px]"
                {...field}
                onChange={(e) => {
                  clearErrors("description");
                  field.onChange(e);
                }}
                aria-invalid={descErr != null && String(descErr).length > 0}
                aria-describedby={
                  descErr != null && String(descErr).length > 0
                    ? "wizard-description-count err-wizard-description"
                    : "wizard-description-count"
                }
              />
            )}
          />
          <WizardFieldError
            id="err-wizard-description"
            message={descErr != null ? String(descErr) : undefined}
          />
          <p id="wizard-description-count" className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            {description.trim().length} / 4000 characters (minimum 10; suggest fields needs 20)
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={suggestBusy || description.trim().length < 20}
              onClick={() => void onSuggestFields()}
            >
              {suggestBusy ? "Suggesting…" : "Suggest fields"}
            </Button>
            <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
              Uses AI to pre-fill constraints, capabilities, assumptions, and hints on later steps. Review every suggestion.
            </p>
          </div>
          {suggestError !== null ? (
            <div className="mt-3">
              <OperatorApiProblem
                problem={suggestError.problem}
                fallbackMessage={suggestError.message}
                correlationId={suggestError.correlationId}
              />
            </div>
          ) : null}
        </div>

        <AdvancedOptionsAccordion className="mt-2">
          <div>
            <WizardFieldHint
              htmlFor="wizard-inline-req-0"
              label="Inline requirements"
              hint="Supplementary requirements beyond the description. One per line item."
            />
            <WizardFieldError
              id="err-wizard-inline-req"
              message={inlineReqErr != null ? String(inlineReqErr) : undefined}
            />
            <div className="space-y-3">
              {inlineRequirements.map((line, index) => (
                <div key={`inline-${index}`} className="flex gap-2">
                  <Textarea
                    id={index === 0 ? "wizard-inline-req-0" : undefined}
                    rows={3}
                    className="min-h-[72px] flex-1"
                    value={line}
                    onChange={(e) => updateInlineRequirement(index, e.target.value)}
                  />
                  <Button type="button" variant="outline" onClick={() => removeInlineRequirement(index)}>
                    Remove
                  </Button>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={appendInlineRequirement}>
                Add requirement
              </Button>
            </div>
          </div>
        </AdvancedOptionsAccordion>
      </div>
    </WizardStepPanel>
  );
}
