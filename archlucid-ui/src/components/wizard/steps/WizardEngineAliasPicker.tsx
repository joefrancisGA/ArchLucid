"use client";

import type { ReactElement } from "react";
import { Controller, useFormContext } from "react-hook-form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WizardFieldHint } from "@/components/wizard/WizardFieldHint";
import { useModelEngineSelectionOptionsQuery } from "@/hooks/use-wizard-advanced-queries";
import type { WizardFormValues } from "@/lib/wizard-schema";

export function WizardEngineAliasPicker(): ReactElement | null {
  const { control } = useFormContext<WizardFormValues>();
  const { data: options } = useModelEngineSelectionOptionsQuery();

  if (options == null || options.options.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 bg-neutral-50/50 p-4 dark:border-neutral-700 dark:bg-neutral-900/30">
      <WizardFieldHint
        label="Engine alias"
        hint="Optional per-review engine within the workspace allowed set. No alias is stored on this review until you choose one. Alias ids are technical registry keys — evaluation state is shown beside each option."
      />
      <Controller
        name="modelAliasOverride"
        control={control}
        render={({ field }) => {
          const engineAliasNotChosen = field.value.trim().length === 0;

          return (
            <>
              <Select
                value={engineAliasNotChosen ? "__workspace_default__" : field.value}
                onValueChange={(value) => {
                  field.onChange(value === "__workspace_default__" ? "" : value);
                }}
              >
                <SelectTrigger id="wizard-model-alias-override" data-testid="wizard-model-alias-override">
                  <SelectValue placeholder="Engine alias was not chosen." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__workspace_default__">Engine alias was not chosen.</SelectItem>
                  {options.options.map((option) => (
                    <SelectItem key={option.aliasId} value={option.aliasId}>
                      {option.aliasId}
                      {option.taskEvaluations.some((evaluation) => evaluation.evaluationState === "NotEvaluated")
                        ? " · Not evaluated"
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {engineAliasNotChosen ? (
                <p className="text-sm text-neutral-600 dark:text-neutral-400" data-testid="wizard-engine-alias-not-chosen">
                  Engine alias was not chosen.
                </p>
              ) : null}
            </>
          );
        }}
      />
    </div>
  );
}
