"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { FilterChip } from "@/components/ui/filter-chip";
import {
  RISK_REGISTER_FILTER_LABELS,
  RISK_REGISTER_QUICK_FILTERS,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { governanceFindingsRegisterFilterHrefFromSearch } from "@/lib/governance/governance-findings-queue-search";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type GovernanceFindingsRegisterFilterCompactProps = {
  readonly registerFilter: RiskRegisterFilter;
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
      <FilterChip
        href={governanceFindingsRegisterFilterHrefFromSearch(currentSearch, "all", pathname)}
        scroll={false}
        className={buyerFilterChipClass(props.registerFilter === "all", false)}
        aria-current={props.registerFilter === "all" ? "page" : undefined}
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
        >
          {renderFilterLabel(
            filter,
            RISK_REGISTER_FILTER_LABELS[filter],
            filter === "open" ? props.openCount : undefined,
          )}
        </FilterChip>
      ))}
      {hasNonDefaultFilter ? (
        <Button type="button" size="sm" variant="outline" onClick={props.onClearAllFilters}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
