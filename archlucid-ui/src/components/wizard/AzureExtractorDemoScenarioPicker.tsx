"use client";

import type { DemoReviewScenarioId } from "@/lib/arch-lucid-azure-extractor-demo-scenarios";
import {
  InventoryDemoScenarioPicker,
  type InventoryDemoScenarioPickerProps,
} from "@/components/wizard/InventoryDemoScenarioPicker";

export type AzureExtractorDemoScenarioPickerProps = Omit<InventoryDemoScenarioPickerProps, "platform"> & {
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
