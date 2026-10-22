"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { Button } from "@/components/ui/button";
import { OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import type { WorkspaceScopeEmptyTeachingCopy } from "@/lib/workspace-scope-empty-teaching";

export type WorkspaceScopeEmptyTeachingProps = WorkspaceScopeEmptyTeachingCopy & {
  /** Opens the top-bar scope switcher when omitted uses click on the known trigger. */
  readonly onSwitchScope?: () => void;
};

const SCOPE_SWITCHER_TRIGGER_TEST_ID = "operator-scope-switcher-trigger";

/**
 * Compact teaching strip for hub lists that are empty under a specific workspace/project
 * selection (TB-2195). CTA focuses the top-bar scope switcher when present.
 */
export function WorkspaceScopeEmptyTeaching(props: WorkspaceScopeEmptyTeachingProps): ReactElement {
  const { title, body, ctaLabel, onSwitchScope } = props;

  return (
    <div
      role="status"
      aria-label={title}
      data-testid="workspace-scope-empty-teaching"
      className={cn(
        "rounded-md border border-dashed border-neutral-200 px-3 py-3 dark:border-neutral-700",
        OPERATOR_LAYOUT.sectionStack,
      )}
    >
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}>{title}</p>
      <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>{body}</p>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-neutral-300 dark:border-neutral-600"
          data-testid="workspace-scope-empty-teaching-cta"
          onClick={() => {
            if (onSwitchScope !== undefined) {
              onSwitchScope();

              return;
            }

            openOperatorScopeSwitcherTrigger();
          }}
        >
          {ctaLabel}
        </Button>
      </div>
    </div>
  );
}

function openOperatorScopeSwitcherTrigger(): void {
  if (typeof document === "undefined") {
    return;
  }

  const trigger = document.querySelector(`[data-testid="${SCOPE_SWITCHER_TRIGGER_TEST_ID}"]`);

  if (trigger instanceof HTMLElement) {
    trigger.click();
  }
}
