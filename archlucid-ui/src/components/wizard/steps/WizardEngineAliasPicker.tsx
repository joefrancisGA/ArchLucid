"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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
        hint="Optional per-review engine within the workspace allowed set. Defaults to the workspace standard engine."
      />
      <Controller
        name="modelAliasOverride"
        control={control}
        render={({ field }) => (
          <Select value={field.value.length > 0 ? field.value : "__workspace_default__"} onValueChange={(value) => {
            field.onChange(value === "__workspace_default__" ? "" : value);
          }}>
            <SelectTrigger id="wizard-model-alias-override" data-testid="wizard-model-alias-override">
              <SelectValue placeholder="Workspace default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__workspace_default__">Workspace default</SelectItem>
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
        )}
      />
    </div>
  );
}
