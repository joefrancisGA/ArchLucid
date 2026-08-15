"use client";

import { memo, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  governanceFindingsQueueActiveFilterChips,
} from "@/lib/governance/governance-findings-queue-active-filters";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";
import type { FindingJobView } from "@/lib/findings/finding-job-view";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";
import { cn } from "@/lib/utils";

export type GovernanceFindingsQueueActiveFilterChipsProps = {
  readonly registerFilter: RiskRegisterFilter;
  readonly jobView: FindingJobView;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly jobViewFilterActive: boolean;
  readonly onClearAll: () => void;
};

function GovernanceFindingsQueueActiveFilterChipsComponent(
  props: GovernanceFindingsQueueActiveFilterChipsProps,
): ReactElement | null {
  const chips = governanceFindingsQueueActiveFilterChips({
    registerFilter: props.registerFilter,
    jobView: props.jobView,
    nlFacets: props.nlFacets,
    jobViewFilterActive: props.jobViewFilterActive,
  });

  if (chips.length === 0) {
    return null;
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="governance-findings-active-filter-chips"
      aria-label="Active filters"
    >
      {chips.map((chip) => (
        <span
          key={chip.id}
          className={cn(
            "inline-flex items-center rounded border border-neutral-200 bg-white px-2 py-0.5 text-al-text-secondary dark:border-neutral-700 dark:bg-neutral-900",
            OPERATOR_TYPOGRAPHY.helper,
          )}
          data-testid={`governance-findings-active-filter-chip-${chip.id}`}
        >
          {chip.label}
        </span>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={props.onClearAll}>
        Clear all filters
      </Button>
    </div>
  );
}

export const GovernanceFindingsQueueActiveFilterChips = memo(
  GovernanceFindingsQueueActiveFilterChipsComponent,
);
