"use client";

import { usePathname, useSearchParams } from "next/navigation";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { reviewFindingsToolbarSortHrefFromSearch } from "@/lib/findings/review-findings-toolbar-sort-url";

import type { RunDetailFindingsSortKind } from "@/components/findings/run-detail-findings-toolbar-presentation";

const SORT_OPTIONS: ReadonlyArray<{ id: RunDetailFindingsSortKind; label: string }> = [
  { id: "trust-then-severity", label: "Trust then severity" },
  { id: "severity-desc", label: "Severity (high first)" },
  { id: "severity-asc", label: "Severity (low first)" },
  { id: "title-asc", label: "Title (A–Z)" },
];

export function FindingsSortChips(props: {
  readonly sort: RunDetailFindingsSortKind;
}): React.JSX.Element {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();

  return (
    <div>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} id="findings-sort-label">
        Sort
      </p>
      <FilterChipGroup
        aria-labelledby="findings-sort-label"
        className="mt-1 flex flex-wrap gap-2"
        data-testid="findings-sort-chips"
      >
        {SORT_OPTIONS.map((option) => (
          <FilterChip
            key={option.id}
            href={reviewFindingsToolbarSortHrefFromSearch(currentSearch, pathname, option.id)}
            scroll={false}
            className={buyerFilterChipClass(props.sort === option.id, false)}
            aria-current={props.sort === option.id ? "page" : undefined}
            data-testid={`findings-sort-${option.id}`}
          >
            {option.label}
          </FilterChip>
        ))}
      </FilterChipGroup>
    </div>
  );
}
