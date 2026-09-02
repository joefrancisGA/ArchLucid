"use client";

import { Button } from "@/components/ui/button";
import {
  RISK_REGISTER_FILTER_LABELS,
  RISK_REGISTER_QUICK_FILTERS,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";
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
      <Button
        type="button"
        size="sm"
        variant={props.registerFilter === "all" ? "default" : "outline"}
        aria-pressed={props.registerFilter === "all"}
        onClick={() => props.onRegisterFilterChange("all")}
      >
        {renderFilterLabel("all", RISK_REGISTER_FILTER_LABELS.all, props.allCount)}
      </Button>
      {RISK_REGISTER_QUICK_FILTERS.map((filter) => (
        <Button
          key={filter}
          type="button"
          size="sm"
          variant={props.registerFilter === filter ? "default" : "outline"}
          aria-current={props.registerFilter === filter ? "true" : undefined}
          onClick={() => props.onRegisterFilterChange(filter)}
        >
          {renderFilterLabel(
            filter,
            RISK_REGISTER_FILTER_LABELS[filter],
            filter === "open" ? props.openCount : undefined,
          )}
        </Button>
      ))}
      {hasNonDefaultFilter ? (
        <Button type="button" size="sm" variant="outline" onClick={props.onClearAllFilters}>
          Clear filters
        </Button>
      ) : null}
    </div>
  );
}
