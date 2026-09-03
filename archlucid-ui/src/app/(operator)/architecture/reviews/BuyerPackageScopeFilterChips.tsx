"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { BUYER_PIPELINE_IN_PROGRESS_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";

import { buyerPackageScopeHrefFromSearch } from "./buyer-package-scope-url";
import type { BuyerPackageScopeFilter } from "./runs-list-types";

export type BuyerPackageScopeFilterChipsProps = {
  readonly scope: BuyerPackageScopeFilter;
  readonly buyerPipelineLabels: boolean;
};

export function BuyerPackageScopeFilterChips(props: BuyerPackageScopeFilterChipsProps): React.JSX.Element {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const inFlightLabel = props.buyerPipelineLabels ? BUYER_PIPELINE_IN_PROGRESS_LABEL : "In flight";
  const options: readonly { readonly id: BuyerPackageScopeFilter; readonly label: string }[] = [
    { id: "all", label: "All" },
    { id: "finalized", label: "Finalized packages" },
    { id: "in_flight", label: inFlightLabel },
  ];

  return (
    <FilterChipGroup aria-label="Package scope" className="flex flex-wrap gap-2">
      {options.map((option) => (
        <FilterChip
          key={option.id}
          href={buyerPackageScopeHrefFromSearch(currentSearch, option.id, pathname)}
          scroll={false}
          className={buyerFilterChipClass(props.scope === option.id, false)}
          aria-current={props.scope === option.id ? "page" : undefined}
          aria-label={`Show: ${option.label}`}
        >
          {option.label}
        </FilterChip>
      ))}
    </FilterChipGroup>
  );
}
