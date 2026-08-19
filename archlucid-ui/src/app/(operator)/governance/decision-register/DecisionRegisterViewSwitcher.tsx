"use client";

import { cn } from "@/lib/utils";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import {
  DECISION_REGISTER_VIEW_CARDS_LABEL,
  DECISION_REGISTER_VIEW_SWITCHER_GROUP_LABEL,
  DECISION_REGISTER_VIEW_TIMELINE_LABEL,
} from "./decision-register-copy";

export type DecisionRegisterViewMode = "cards" | "timeline";

type DecisionRegisterViewSwitcherProps = {
  readonly viewMode: DecisionRegisterViewMode;
  readonly onViewModeChange: (mode: DecisionRegisterViewMode) => void;
};

export function DecisionRegisterViewSwitcher(props: DecisionRegisterViewSwitcherProps): React.JSX.Element {
  const tabs: ReadonlyArray<{ readonly id: DecisionRegisterViewMode; readonly label: string }> = [
    { id: "cards", label: DECISION_REGISTER_VIEW_CARDS_LABEL },
    { id: "timeline", label: DECISION_REGISTER_VIEW_TIMELINE_LABEL },
  ];

  return (
    <div
      className="inline-flex rounded-md border border-neutral-200 bg-neutral-50 p-0.5 dark:border-neutral-700 dark:bg-neutral-900"
      data-testid="decision-register-view-switcher"
      role="group"
      aria-label={DECISION_REGISTER_VIEW_SWITCHER_GROUP_LABEL}
    >
      {tabs.map((tab) => {
        const active = props.viewMode === tab.id;

        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={active}
            data-testid={`decision-register-view-${tab.id}`}
            className={cn(
              "rounded px-3 py-1.5 transition-colors",
              OPERATOR_TYPOGRAPHY.body,
              "font-medium",
              active
                ? "bg-white text-al-text-primary shadow-sm dark:bg-neutral-950"
                : "bg-transparent text-al-text-secondary hover:text-al-text-primary",
            )}
            onClick={() => {
              props.onViewModeChange(tab.id);
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
