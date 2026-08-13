"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { AzureExtractorDemoScenarioId } from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import { AZURE_EXTRACTOR_DEMO_SCENARIOS } from "@/lib/arch-lucid-azure-extractor-demo-scenarios";

export type AzureExtractorDemoScenarioPickerProps = {
  selectedScenarioId: AzureExtractorDemoScenarioId;
  onSelectScenario: (scenarioId: AzureExtractorDemoScenarioId) => void;
  testIdPrefix?: string;
};

export function AzureExtractorDemoScenarioPicker(props: AzureExtractorDemoScenarioPickerProps) {
  const { selectedScenarioId, onSelectScenario, testIdPrefix = "azure-extractor-demo" } = props;

  return (
    <div
      className="grid gap-2 sm:grid-cols-3"
      role="radiogroup"
      aria-label="Azure extractor demo scenarios"
      data-testid={`${testIdPrefix}-scenario-picker`}
    >
      {AZURE_EXTRACTOR_DEMO_SCENARIOS.map((scenario) => {
        const selected = selectedScenarioId === scenario.id;
        const resourceCount = scenario.buildResources().length;

        return (
          <button
            key={scenario.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              "rounded-md border p-3 text-left transition-colors",
              selected
                ? "border-teal-700 bg-neutral-50 ring-1 ring-teal-700 dark:border-teal-500 dark:bg-neutral-900/60 dark:ring-teal-500"
                : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700",
            )}
            data-testid={`${testIdPrefix}-scenario-${scenario.id}`}
            onClick={() => {
              onSelectScenario(scenario.id);
            }}
          >
            <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>{scenario.title}</p>
            <p className={cn("m-0 mt-1 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {scenario.subtitle}
            </p>
            <p className={cn("m-0 mt-2 font-medium text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {resourceCount} synthetic resources
            </p>
          </button>
        );
      })}
    </div>
  );
}
