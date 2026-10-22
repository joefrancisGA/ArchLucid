"use client";

import { FilterChip } from "@/components/ui/filter-chip";
import { FilterChipGroup } from "@/components/ui/filter-chip-group";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { decisionRegisterViewModeHrefFromSearch } from "@/lib/governance/decision-register-view-url";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";

import {
  DECISION_REGISTER_VIEW_CARDS_LABEL,
  DECISION_REGISTER_VIEW_SWITCHER_GROUP_LABEL,
  DECISION_REGISTER_VIEW_TIMELINE_LABEL,
} from "./decision-register-copy";

export type DecisionRegisterViewMode = "cards" | "timeline";

type DecisionRegisterViewSwitcherProps = {
  readonly viewMode: DecisionRegisterViewMode;
  readonly currentSearch: string;
};

export function DecisionRegisterViewSwitcher(props: DecisionRegisterViewSwitcherProps): React.JSX.Element {
  const tabs: ReadonlyArray<{ readonly id: DecisionRegisterViewMode; readonly label: string }> = [
    { id: "cards", label: DECISION_REGISTER_VIEW_CARDS_LABEL },
    { id: "timeline", label: DECISION_REGISTER_VIEW_TIMELINE_LABEL },
  ];

  return (
    <FilterChipGroup
      aria-label={DECISION_REGISTER_VIEW_SWITCHER_GROUP_LABEL}
      className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="decision-register-view-switcher"
    >
      {tabs.map((tab) => (
        <FilterChip
          key={tab.id}
          href={decisionRegisterViewModeHrefFromSearch(
            props.currentSearch,
            tab.id,
            GOVERNANCE_DECISION_REGISTER_PATH,
          )}
          scroll={false}
          className={buyerFilterChipClass(props.viewMode === tab.id, false)}
          aria-current={props.viewMode === tab.id ? "page" : undefined}
          data-testid={`decision-register-view-${tab.id}`}
        >
          {tab.label}
        </FilterChip>
      ))}
    </FilterChipGroup>
  );
}
