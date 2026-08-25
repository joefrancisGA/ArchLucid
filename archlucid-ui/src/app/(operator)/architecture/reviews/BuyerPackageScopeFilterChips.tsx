"use client";

import { FilterChip } from "@/components/ui/filter-chip";
import { BUYER_PIPELINE_IN_PROGRESS_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";

import type { BuyerPackageScopeFilter } from "./runs-list-types";

export type BuyerPackageScopeFilterChipsProps = {
  readonly scope: BuyerPackageScopeFilter;
  readonly buyerPipelineLabels: boolean;
  readonly onScopeChange: (scope: BuyerPackageScopeFilter) => void;
};

export function BuyerPackageScopeFilterChips(props: BuyerPackageScopeFilterChipsProps): React.JSX.Element {
  const inFlightLabel = props.buyerPipelineLabels ? BUYER_PIPELINE_IN_PROGRESS_LABEL : "In flight";
  const options: readonly { readonly id: BuyerPackageScopeFilter; readonly label: string }[] = [
    { id: "all", label: "All" },
    { id: "finalized", label: "Finalized packages" },
    { id: "in_flight", label: inFlightLabel },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <FilterChip
          key={option.id}
          className={buyerFilterChipClass(props.scope === option.id, false)}
          aria-pressed={props.scope === option.id}
          aria-label={`Show: ${option.label}`}
          onClick={() => {
            props.onScopeChange(option.id);
          }}
        >
          {option.label}
        </FilterChip>
      ))}
    </div>
  );
}
