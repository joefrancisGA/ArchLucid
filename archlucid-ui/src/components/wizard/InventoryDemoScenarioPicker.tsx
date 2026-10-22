"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY, OPERATOR_SELECTION } from "@/lib/design-tokens";

import type { CloudInventoryPlatform } from "@/lib/cloud-inventory-platform";
import {
  inventoryDemoScenarioPickerAriaLabel,
  listInventoryDemoScenarios,
  type InventoryDemoScenarioId,
} from "@/lib/arch-lucid-inventory-demo-scenarios";

export type InventoryDemoScenarioPickerLayout = "grid" | "stack";

export type InventoryDemoScenarioPickerProps = {
  platform: CloudInventoryPlatform;
  selectedScenarioId: InventoryDemoScenarioId;
  onSelectScenario: (scenarioId: InventoryDemoScenarioId) => void;
  /** Use `stack` inside narrow setup asides (~17.5rem); default `grid` for full-width surfaces. */
  layout?: InventoryDemoScenarioPickerLayout;
  testIdPrefix?: string;
};

export function InventoryDemoScenarioPicker(props: InventoryDemoScenarioPickerProps) {
  const {
    platform,
    selectedScenarioId,
    onSelectScenario,
    layout = "grid",
    testIdPrefix = "inventory-demo",
  } = props;
  const scenarios = listInventoryDemoScenarios(platform);
  const layoutClassName = layout === "stack" ? "grid grid-cols-1 gap-2" : "grid gap-2 sm:grid-cols-3";

  return (
    <div
      className={layoutClassName}
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
              "min-w-0 rounded-md border p-3 text-left transition-colors",
              selected
                ? OPERATOR_SELECTION.tile
                : "border-neutral-200 bg-white hover:border-neutral-300 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:border-neutral-700",
            )}
            data-testid={`${testIdPrefix}-scenario-${scenario.id}`}
            onClick={() => {
              onSelectScenario(scenario.id);
            }}
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
