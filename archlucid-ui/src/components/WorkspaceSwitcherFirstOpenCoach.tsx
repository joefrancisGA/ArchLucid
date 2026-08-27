"use client";

import { useCallback, useEffect, useState, type JSX } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildWorkspaceSwitcherTeaching,
  dismissWorkspaceSwitcherTeaching,
  isWorkspaceSwitcherTeachingDismissed,
  type WorkspaceSwitcherTeachingModel,
} from "@/lib/workspace-switcher-teaching";
import { cn } from "@/lib/utils";

export type WorkspaceSwitcherFirstOpenCoachProps = {
  /** When false, the coach stays hidden (popover closed). */
  readonly open: boolean;
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildWorkspaceSwitcherTeaching}. */
  readonly model?: WorkspaceSwitcherTeachingModel;
};

/**
 * TB-2234 — First-open hierarchy coach inside the scope switcher popover.
 * Dismissible via localStorage; distinct from WorkspaceScopeEmptyTeaching.
 */
export function WorkspaceSwitcherFirstOpenCoach(
  props: WorkspaceSwitcherFirstOpenCoachProps,
): JSX.Element | null {
  const model = props.model ?? buildWorkspaceSwitcherTeaching();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDismissed(isWorkspaceSwitcherTeachingDismissed());
    setReady(true);
  }, []);

  const onDismiss = useCallback(() => {
    dismissWorkspaceSwitcherTeaching();
    setDismissed(true);
  }, []);

  if (!props.open || !ready || dismissed) {
    return null;
  }

  return (
    <aside
      className={cn(
        "space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
        props.className,
      )}
      aria-labelledby="workspace-switcher-first-open-coach-heading"
      data-testid="workspace-switcher-first-open-coach"
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          id="workspace-switcher-first-open-coach-heading"
          className={cn(
            "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {model.heading}
        </h3>
        <DismissControl
          className="shrink-0"
          label={model.dismissLabel}
          data-testid="workspace-switcher-first-open-coach-dismiss"
          onDismiss={onDismiss}
        />
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{model.lead}</p>
      <ol
        className={cn(
          "m-0 list-decimal space-y-1 pl-5 text-al-text-primary",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        {model.steps.map((step) => (
          <li key={step.id} data-testid={`workspace-switcher-first-open-coach-step-${step.id}`}>
            <span className="font-medium">{step.label}</span>
            {": "}
            {step.body}
          </li>
        ))}
      </ol>
    </aside>
  );
}
