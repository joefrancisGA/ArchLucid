"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import {
  RISK_REGISTER_FILTER_LABELS,
  RISK_REGISTER_QUICK_FILTERS,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { governanceFindingsRegisterFilterHrefFromSearch } from "@/lib/governance/governance-findings-register-filter-url";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type GovernanceFindingsRegisterFilterCompactProps = {
  readonly registerFilter: RiskRegisterFilter;
  readonly onRegisterFilterChange: (filter: RiskRegisterFilter) => void;
  readonly onClearAllFilters: () => void;
  readonly allCount?: number;
  readonly openCount?: number;
};

/** Buyer-polished register filter — All / Open without the full operator filter bar. */
export function GovernanceFindingsRegisterFilterCompact(
  props: GovernanceFindingsRegisterFilterCompactProps,
): React.JSX.Element {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const hasNonDefaultFilter = props.registerFilter !== "all";

  function renderFilterLabel(filter: RiskRegisterFilter, fallback: string, count?: number): string {
    if (count === undefined) {
      return fallback;
    }

    return `${fallback} (${count})`;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="governance-findings-register-filter-compact"
      aria-label="Findings register filter"
    >
      <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Show</span>
      <FilterChipGroup aria-label="Register filter" className="flex flex-wrap gap-2">
        <FilterChip
          href={governanceFindingsRegisterFilterHrefFromSearch(currentSearch, "all", pathname)}
          scroll={false}
          className={buyerFilterChipClass(props.registerFilter === "all", false)}
          aria-current={props.registerFilter === "all" ? "page" : undefined}
          data-testid="governance-findings-register-filter-compact-all"
          onClick={() => props.onRegisterFilterChange("all")}
        >
          {renderFilterLabel("all", RISK_REGISTER_FILTER_LABELS.all, props.allCount)}
        </FilterChip>
        {RISK_REGISTER_QUICK_FILTERS.map((filter) => (
          <FilterChip
            key={filter}
            href={governanceFindingsRegisterFilterHrefFromSearch(currentSearch, filter, pathname)}
            scroll={false}
            className={buyerFilterChipClass(props.registerFilter === filter, false)}
            aria-current={props.registerFilter === filter ? "page" : undefined}
            data-testid={`governance-findings-register-filter-compact-${filter}`}
            onClick={() => props.onRegisterFilterChange(filter)}
          >
            {renderFilterLabel(
              filter,
              RISK_REGISTER_FILTER_LABELS[filter],
              filter === "open" ? props.openCount : undefined,
            )}
          </FilterChip>
        ))}
      </FilterChipGroup>
      {hasNonDefaultFilter ? (
        <Button type="button" size="sm" variant="outline" onClick={props.onClearAllFilters}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
