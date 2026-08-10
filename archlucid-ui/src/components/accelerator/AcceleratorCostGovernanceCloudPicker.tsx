"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";
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

const CLOUD_PICKER_GROUP_NAME = "accelerator-cost-governance-cloud";

/** Compact Azure / AWS / GCP selector for the grouped cost-governance accelerator pack row. */
export function AcceleratorCostGovernanceCloudPicker(
  props: AcceleratorCostGovernanceCloudPickerProps,
): React.JSX.Element {
  const pickerTestId = props.pickerTestId ?? "accelerator-cost-governance-cloud-picker";
  const optionPrefix = props.optionTestIdPrefix ?? "accelerator-cost-governance-cloud";

  return (
    <div className="mt-2" data-testid={pickerTestId}>
      <fieldset>
        <legend className="sr-only">{`${ACCELERATOR_COST_GOVERNANCE_CLOUD_PICKER_LABEL} for cost and orphan review`}</legend>
        <div className="flex flex-wrap items-center gap-2">
          <span className={cn("font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            {ACCELERATOR_COST_GOVERNANCE_CLOUD_PICKER_LABEL}
          </span>
          {ACCELERATOR_COST_GOVERNANCE_CLOUD_OPTIONS.map((option) => {
            const selected = props.selectedPackId === option.packId;
            const inputId = `${optionPrefix}-${option.packId}-input`;

            return (
              <label
                key={option.packId}
                htmlFor={inputId}
                data-testid={`${optionPrefix}-${option.packId}`}
                className={cn(
                  "inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md border px-3 text-sm transition-colors",
                  "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--al-accent-border-focus)]",
                  selected
                    ? "border-neutral-900 bg-neutral-50 font-semibold text-neutral-900 shadow-sm dark:border-neutral-200 dark:bg-neutral-900 dark:text-neutral-100"
                    : "border-neutral-200 bg-white font-medium text-neutral-700 hover:border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-300 dark:hover:border-neutral-600",
                )}
              >
                <input
                  id={inputId}
                  type="radio"
                  name={CLOUD_PICKER_GROUP_NAME}
                  className="sr-only"
                  value={option.packId}
                  checked={selected}
                  aria-label={option.cloudLabel}
                  onChange={() => {
                    props.onSelectedPackIdChange(option.packId);
                  }}
                />
                {selected ? <Check aria-hidden className="h-3.5 w-3.5 shrink-0" /> : null}
                {option.cloudLabel}
              </label>
            );
          })}
        </div>
      </fieldset>
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
