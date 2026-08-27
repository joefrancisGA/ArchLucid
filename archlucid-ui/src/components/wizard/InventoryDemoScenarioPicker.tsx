"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY, OPERATOR_SELECTION } from "@/lib/design-tokens";

import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import {
  inventoryDemoScenarioPickerAriaLabel,
  listInventoryDemoScenarios,
  type InventoryDemoScenarioId,
} from "@/lib/arch-lucid-inventory-demo-scenarios";

export type InventoryDemoScenarioPickerProps = {
  platform: CloudInventoryPlatform;
  selectedScenarioId: InventoryDemoScenarioId;
  onSelectScenario: (scenarioId: InventoryDemoScenarioId) => void;
  testIdPrefix?: string;
};

export function InventoryDemoScenarioPicker(props: InventoryDemoScenarioPickerProps) {
  const { platform, selectedScenarioId, onSelectScenario, testIdPrefix = "inventory-demo" } = props;
  const scenarios = listInventoryDemoScenarios(platform);

  return (
    <div
      className="grid gap-2 sm:grid-cols-3"
      role="radiogroup"
      aria-label={inventoryDemoScenarioPickerAriaLabel(platform)}
      data-testid={`${testIdPrefix}-scenario-picker`}
    >
      {scenarios.map((scenario) => {
        const selected = selectedScenarioId === scenario.id;

        return (
          <button
            key={scenario.id}
            type="button"
            role="radio"
            aria-checked={selected}
            className={cn(
              "rounded-md border p-3 text-left transition-colors",
              selected
                ? OPERATOR_SELECTION.tile
                : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700",
            )}
            data-testid={`${testIdPrefix}-scenario-${scenario.id}`}
            onClick={() => {
              onSelectScenario(scenario.id);
            }}
          >
            <p className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {scenario.title}
            </p>
            <p className={cn("m-0 mt-1 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
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
