"use client";

import type { DemoReviewScenarioId } from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import {
  InventoryDemoScenarioPicker,
  type InventoryDemoScenarioPickerProps,
} from "@/components/wizard/InventoryDemoScenarioPicker";

/**
 * Azure-narrowed picker props.
 *
 * The overridden keys must be omitted, not just re-declared: `A & B` intersects same-named members
 * rather than replacing them, so keeping the base `onSelectScenario` would demand a handler that
 * accepts every platform's scenario id *and* the Azure-only one — which no `useState` setter can be.
 */
export type AzureExtractorDemoScenarioPickerProps = Omit<
  InventoryDemoScenarioPickerProps,
  "platform" | "selectedScenarioId" | "onSelectScenario"
> & {
  selectedScenarioId: DemoReviewScenarioId;
  onSelectScenario: (scenarioId: DemoReviewScenarioId) => void;
};

/** @deprecated Prefer {@link InventoryDemoScenarioPicker} with an explicit `platform`. */
export function AzureExtractorDemoScenarioPicker(props: AzureExtractorDemoScenarioPickerProps) {
  const { selectedScenarioId, onSelectScenario, testIdPrefix } = props;

  return (
    <InventoryDemoScenarioPicker
      platform="azure"
      selectedScenarioId={selectedScenarioId}
      onSelectScenario={(scenarioId) => {
        onSelectScenario(scenarioId as DemoReviewScenarioId);
      }}
      testIdPrefix={testIdPrefix}
    />
  );
}
