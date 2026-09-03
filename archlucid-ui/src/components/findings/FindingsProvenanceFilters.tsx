"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { cn } from "@/lib/utils";
import type { FindingGroundingFilter, FindingOriginFilter } from "@/lib/findings/finding-trust-triage";
import {
  findingsGroundingFilterHrefFromSearch,
  findingsOriginFilterHrefFromSearch,
} from "@/lib/findings/findings-provenance-url";
import {
  GROUNDING_FILTER_OPTIONS,
  ORIGIN_FILTER_OPTIONS,
} from "@/components/findings/run-detail-findings-toolbar-presentation";

export function FindingsProvenanceFilters(props: {
  readonly idPrefix: string;
  readonly originFilter: FindingOriginFilter;
  readonly groundingFilter: FindingGroundingFilter;
}): React.JSX.Element {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  return (
    <>
      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} id={`${props.idPrefix}-origin-label`}>
          Origin
        </p>
        <FilterChipGroup
          aria-labelledby={`${props.idPrefix}-origin-label`}
          className="flex flex-wrap gap-2"
          data-testid={`${props.idPrefix}-origin`}
        >
          {ORIGIN_FILTER_OPTIONS.map((option) => (
            <FilterChip
              key={option.id}
              href={findingsOriginFilterHrefFromSearch(currentSearch, pathname, option.id)}
              scroll={false}
              className={buyerFilterChipClass(props.originFilter === option.id, false)}
              aria-current={props.originFilter === option.id ? "page" : undefined}
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>
      <div className="space-y-2">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} id={`${props.idPrefix}-grounding-label`}>
          Grounding
        </p>
        <FilterChipGroup
          aria-labelledby={`${props.idPrefix}-grounding-label`}
          className="flex flex-wrap gap-2"
          data-testid={`${props.idPrefix}-grounding`}
        >
          {GROUNDING_FILTER_OPTIONS.map((option) => (
            <FilterChip
              key={option.id}
              href={findingsGroundingFilterHrefFromSearch(currentSearch, pathname, option.id)}
              scroll={false}
              className={buyerFilterChipClass(props.groundingFilter === option.id, false)}
              aria-current={props.groundingFilter === option.id ? "page" : undefined}
            >
              {option.label}
            </FilterChip>
          ))}
        </FilterChipGroup>
      </div>
    </>
  );
}
