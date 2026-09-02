"use client";

import { memo, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { DismissibleActiveFilterChip } from "@/components/ui/dismissible-active-filter-chip";
import {
  governanceFindingsQueueActiveFilterChips,
} from "@/lib/governance/governance-findings-queue-active-filters";
import type { RiskRegisterFilter } from "@/lib/architecture/architecture-risk-register-page";
import type { FindingJobView } from "@/lib/findings/finding-job-view";
import type { FindingsNaturalLanguageFacets } from "@/lib/findings/findings-natural-language-filter";

export type GovernanceFindingsQueueActiveFilterChipsProps = {
  readonly registerFilter: RiskRegisterFilter;
  readonly jobView: FindingJobView;
  readonly nlFacets: FindingsNaturalLanguageFacets;
  readonly jobViewFilterActive: boolean;
  readonly findingsSearchQuery: string;
  readonly onDismissChip: (chipId: string) => void;
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
    searchQuery: props.findingsSearchQuery,
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
        <DismissibleActiveFilterChip
          key={chip.id}
          label={chip.label}
          onDismiss={() => props.onDismissChip(chip.id)}
          testId={`governance-findings-active-filter-chip-${chip.id}`}
          dismissLabel={`Remove ${chip.label}`}
        />
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
