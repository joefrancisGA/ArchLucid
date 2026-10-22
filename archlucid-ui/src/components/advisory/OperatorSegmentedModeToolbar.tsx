"use client";

import { cn } from "@/lib/utils";
import type { KeyboardEvent, ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  isTabsKeyboardMove,
  resolveNextTabIndex,
} from "@/components/ui/tabs-keyboard";

export type OperatorSegmentedModeToolbarTab = {
  readonly id: string;
  readonly label: string;
  readonly testId?: string;
  readonly disabled?: boolean;
};

export type OperatorSegmentedModeToolbarVisualVariant = "default" | "emphasized";

export type OperatorSegmentedModeToolbarProps = {
  readonly tabs: readonly OperatorSegmentedModeToolbarTab[];
  readonly activeTabId: string;
  readonly onTabChange: (tabId: string) => void;
  readonly ariaLabel: string;
  readonly className?: string;
  /** Arrow/Home/End between segments. Stays aria-pressed — not a fake tablist (TB-1664). */
  readonly enableArrowKeyboard?: boolean;
  /**
   * `emphasized` uses primary fill for the active segment and outline for inactive —
   * for top-bar mode switches (Record / Practice) where subtle secondary styling is too easy to miss.
   */
  readonly visualVariant?: OperatorSegmentedModeToolbarVisualVariant;
};

/** In-panel mode toolbar (segmented buttons, not route tabs). */
export function OperatorSegmentedModeToolbar(props: OperatorSegmentedModeToolbarProps): ReactElement {
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (props.enableArrowKeyboard !== true) {
      return;
    }

    if (!isTabsKeyboardMove(event.key)) {
      return;
    }

    const currentIndex = props.tabs.findIndex((tab) => tab.id === props.activeTabId);
    const nextIndex = resolveNextTabIndex(
      currentIndex < 0 ? 0 : currentIndex,
      props.tabs.length,
      event.key,
      "horizontal",
    );

    if (nextIndex === null) {
      return;
    }

    const nextTab = props.tabs[nextIndex];

    if (nextTab === undefined) {
      return;
    }

    event.preventDefault();
    props.onTabChange(nextTab.id);
  };

  const visualVariant = props.visualVariant ?? "default";
  const emphasized = visualVariant === "emphasized";

  return (
    <div
      className={cn(
        "mb-5 flex flex-wrap gap-2",
        emphasized &&
          "rounded-md border border-neutral-300 bg-neutral-50/90 p-1 dark:border-neutral-600 dark:bg-neutral-900/50",
        props.className,
      )}
      role="group"
      aria-label={props.ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {props.tabs.map((tab) => {
        const isActive = props.activeTabId === tab.id;

        return (
          <Button
            key={tab.id}
            type="button"
            variant={emphasized ? (isActive ? "primary" : "outline") : "secondary"}
            size="sm"
            disabled={tab.disabled === true}
            onClick={() => props.onTabChange(tab.id)}
            className={cn(
              !emphasized &&
                isActive &&
                "border-2 border-neutral-700 bg-neutral-100 dark:border-neutral-300 dark:bg-neutral-800",
            )}
            aria-pressed={isActive}
            aria-current={emphasized && isActive ? "true" : undefined}
            data-testid={tab.testId}
          >
            {tab.label}
          </Button>
        );
      })}
    </div>
  );
}
