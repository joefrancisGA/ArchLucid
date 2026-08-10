"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";

import {
  ACCELERATOR_COST_GOVERNANCE_CLOUD_OPTIONS,
  type AcceleratorCostGovernancePackId,
} from "@/lib/accelerator-chooser";
import { ACCELERATOR_COST_GOVERNANCE_CLOUD_PICKER_LABEL } from "@/lib/accelerator-chooser-start-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export type AcceleratorCostGovernanceCloudPickerProps = {
  readonly selectedPackId: AcceleratorCostGovernancePackId;
  readonly onSelectedPackIdChange: (packId: AcceleratorCostGovernancePackId) => void;
  readonly pickerTestId?: string;
  readonly optionTestIdPrefix?: string;
};

/** Compact Azure / AWS / GCP selector for the grouped cost-governance accelerator pack row. */
export function AcceleratorCostGovernanceCloudPicker(
  props: AcceleratorCostGovernanceCloudPickerProps,
): React.JSX.Element {
  const pickerTestId = props.pickerTestId ?? "accelerator-cost-governance-cloud-picker";
  const optionPrefix = props.optionTestIdPrefix ?? "accelerator-cost-governance-cloud";

  return (
    <div className="mt-2" data-testid={pickerTestId}>
      <div
        className="flex flex-wrap items-center gap-2"
        role="radiogroup"
        aria-label={`${ACCELERATOR_COST_GOVERNANCE_CLOUD_PICKER_LABEL} for cost and orphan review`}
      >
        <span className={cn("font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
          {ACCELERATOR_COST_GOVERNANCE_CLOUD_PICKER_LABEL}
        </span>
        {ACCELERATOR_COST_GOVERNANCE_CLOUD_OPTIONS.map((option) => {
          const selected = props.selectedPackId === option.packId;

          return (
            <button
              key={option.packId}
              type="button"
              role="radio"
              aria-checked={selected}
              data-testid={`${optionPrefix}-${option.packId}`}
              className={cn(
                "rounded-md border px-2.5 py-1 text-sm transition-colors",
                selected
                  ? "border-teal-700 bg-teal-50 text-teal-900 dark:border-teal-500 dark:bg-teal-950/40 dark:text-teal-100"
                  : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600",
              )}
              onClick={() => {
                props.onSelectedPackIdChange(option.packId);
              }}
            >
              {option.cloudLabel}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function useAcceleratorCostGovernancePackSelection(
  initialPackId: AcceleratorCostGovernancePackId = "azure-cost-governance",
): {
  readonly selectedPackId: AcceleratorCostGovernancePackId;
  readonly setSelectedPackId: (packId: AcceleratorCostGovernancePackId) => void;
} {
  const [selectedPackId, setSelectedPackId] = useState<AcceleratorCostGovernancePackId>(initialPackId);

  return { selectedPackId, setSelectedPackId };
}
