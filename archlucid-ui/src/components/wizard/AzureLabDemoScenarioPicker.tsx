"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_SELECTION, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  listAzureLabDemoScenarioSummaries,
  type AzureLabDemoScenarioId,
} from "@/lib/azure-lab-inventory-demo-scenarios";

export type AzureLabDemoScenarioPickerProps = {
  selectedScenarioId: AzureLabDemoScenarioId | null;
  onSelectScenario: (scenarioId: AzureLabDemoScenarioId) => void;
};

export function AzureLabDemoScenarioPicker(props: AzureLabDemoScenarioPickerProps) {
  const scenarios = listAzureLabDemoScenarioSummaries();

  return (
    <div
      className="grid grid-cols-1 gap-2"
      role="radiogroup"
      aria-label="Azure scale and edge demo scenarios"
      data-testid="extract-upload-lab-demo-scenario-picker"
    >
      {scenarios.map((scenario) => {
        const selected = props.selectedScenarioId === scenario.id;

        return (
          <button
            key={scenario.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              "min-w-0 rounded-md border p-3 text-left transition-colors",
              selected
                ? OPERATOR_SELECTION.tile
                : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700",
            )}
            data-testid={`extract-upload-lab-demo-scenario-${scenario.id}`}
            onClick={() => props.onSelectScenario(scenario.id)}
          >
            <p className={cn("m-0 min-w-0 break-words font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {scenario.title}
            </p>
            <p className={cn("m-0 mt-1 min-w-0 break-words leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {scenario.subtitle}
            </p>
            <p className={cn("m-0 mt-2 font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {scenario.resourceCount} synthetic resources
            </p>
          </button>
        );
      })}
    </div>
  );
}
