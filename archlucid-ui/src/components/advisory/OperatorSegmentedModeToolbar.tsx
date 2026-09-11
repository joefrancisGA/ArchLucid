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
};

export type OperatorSegmentedModeToolbarProps = {
  readonly tabs: readonly OperatorSegmentedModeToolbarTab[];
  readonly activeTabId: string;
  readonly onTabChange: (tabId: string) => void;
  readonly ariaLabel: string;
  readonly className?: string;
  /** Arrow/Home/End between segments. Stays aria-pressed — not a fake tablist (TB-1664). */
  readonly enableArrowKeyboard?: boolean;
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

  return (
    <div
      className={cn("mb-5 flex flex-wrap gap-2", props.className)}
      role="group"
      aria-label={props.ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {props.tabs.map((tab) => (
        <Button
          key={tab.id}
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => props.onTabChange(tab.id)}
          className={cn(
            props.activeTabId === tab.id &&
              "border-2 border-neutral-700 bg-neutral-100 dark:border-neutral-300 dark:bg-neutral-800",
          )}
          aria-pressed={props.activeTabId === tab.id}
          data-testid={tab.testId}
        >
          {tab.label}
        </Button>
      ))}
    </div>
  );
}
