"use client";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { governanceFindingsArchitectureScopeHrefFromSearch } from "@/lib/governance/governance-findings-architecture-scope";

export type GovernanceFindingsArchitectureScopeChipsProps = {
  readonly pathname: string;
  readonly currentSearch: string;
  readonly scopedArchitectureId: string | null;
  readonly lastOpenArchitectureId: string | null;
};

export function GovernanceFindingsArchitectureScopeChips(
  props: GovernanceFindingsArchitectureScopeChipsProps,
): React.JSX.Element | null {
  const architectureId = props.scopedArchitectureId ?? props.lastOpenArchitectureId;

  if (architectureId === null || architectureId.trim().length === 0) {
    return null;
  }

  const thisArchitectureActive = props.scopedArchitectureId !== null;
  const allArchitecturesActive = props.scopedArchitectureId === null;

  return (
    <FilterChipGroup aria-label="Architecture scope" className="flex flex-wrap gap-2">
      <FilterChip
        href={governanceFindingsArchitectureScopeHrefFromSearch(
          props.currentSearch,
          architectureId,
          props.pathname,
        )}
        scroll={false}
        className={buyerFilterChipClass(thisArchitectureActive, false)}
        aria-current={thisArchitectureActive ? "page" : undefined}
        data-testid="governance-findings-architecture-scope-this"
      >
        This architecture
      </FilterChip>
      <FilterChip
        href={governanceFindingsArchitectureScopeHrefFromSearch(
          props.currentSearch,
          null,
          props.pathname,
        )}
        scroll={false}
        className={buyerFilterChipClass(allArchitecturesActive, false)}
        aria-current={allArchitecturesActive ? "page" : undefined}
        data-testid="governance-findings-architecture-scope-all"
      >
        All architectures
      </FilterChip>
    </FilterChipGroup>
  );
}
