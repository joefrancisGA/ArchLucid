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
};

/** Buyer-polished register filter — All / Open without the full operator filter bar. */
export function GovernanceFindingsRegisterFilterCompact(
  props: GovernanceFindingsRegisterFilterCompactProps,
): React.JSX.Element {
  const hasNonDefaultFilter = props.registerFilter !== "all";

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
        onClick={() => props.onRegisterFilterChange("all")}
      >
        {RISK_REGISTER_FILTER_LABELS.all}
      </Button>
      {RISK_REGISTER_QUICK_FILTERS.map((filter) => (
        <Button
          key={filter}
          type="button"
          size="sm"
          variant={props.registerFilter === filter ? "default" : "outline"}
          onClick={() => props.onRegisterFilterChange(filter)}
        >
          {RISK_REGISTER_FILTER_LABELS[filter]}
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
