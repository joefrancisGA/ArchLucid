"use client";

import type { ReactNode } from "react";

import {
  DECISION_REGISTER_VIEW_CARDS_PANEL_LABEL,
  DECISION_REGISTER_VIEW_TIMELINE_PANEL_LABEL,
} from "./decision-register-copy";
import type { DecisionRegisterViewMode } from "./DecisionRegisterViewSwitcher";

type DecisionRegisterViewEmptyShellProps = {
  readonly viewMode: DecisionRegisterViewMode;
  readonly children: ReactNode;
};

/**
 * Empty / filter-empty chrome that still differs by Cards vs Timeline so the
 * view switcher remounts visible layout even when there are no decisions yet.
 */
export function DecisionRegisterViewEmptyShell(
  props: DecisionRegisterViewEmptyShellProps,
): React.JSX.Element {
  if (props.viewMode === "timeline") {
    return (
      <div
        aria-label={DECISION_REGISTER_VIEW_TIMELINE_PANEL_LABEL}
        data-testid="decision-register-timeline-panel"
      >
        <div className="flex gap-3">
          <div className="flex w-4 shrink-0 flex-col items-center pt-1" aria-hidden="true">
            <span className="h-2.5 w-2.5 rounded-full border-2 border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-950" />
            <span className="mt-1 min-h-16 w-px flex-1 bg-neutral-200 dark:bg-neutral-700" />
          </div>
          <div className="min-w-0 flex-1">{props.children}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="grid gap-4"
      aria-label={DECISION_REGISTER_VIEW_CARDS_PANEL_LABEL}
      data-testid="decision-register-cards"
    >
      {props.children}
    </div>
  );
}
