"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";

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
};

/** In-panel mode toolbar (segmented buttons, not route tabs). */
export function OperatorSegmentedModeToolbar(props: OperatorSegmentedModeToolbarProps): ReactElement {
  return (
    <div
      className={cn("mb-5 flex flex-wrap gap-2", props.className)}
      role="group"
      aria-label={props.ariaLabel}
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
