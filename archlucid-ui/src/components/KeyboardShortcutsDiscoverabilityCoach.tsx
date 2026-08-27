"use client";

import { useCallback, useEffect, useState, type JSX } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  buildKeyboardShortcutsDiscoverability,
  dismissKeyboardShortcutsDiscoverability,
  isKeyboardShortcutsDiscoverabilityDismissed,
  type KeyboardShortcutsDiscoverabilityModel,
} from "@/lib/keyboard-shortcuts-discoverability";
import { cn } from "@/lib/utils";

export type KeyboardShortcutsDiscoverabilityCoachProps = {
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildKeyboardShortcutsDiscoverability}. */
  readonly model?: KeyboardShortcutsDiscoverabilityModel;
};

/**
 * TB-2268 — First-open coach teaching F1 / Shift+? Help and the Shortcuts tab.
 * Mount near shell help affordances; dismissible via localStorage.
 */
export function KeyboardShortcutsDiscoverabilityCoach(
  props: KeyboardShortcutsDiscoverabilityCoachProps,
): JSX.Element | null {
  const model = props.model ?? buildKeyboardShortcutsDiscoverability();
  const [ready, setReady] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setDismissed(isKeyboardShortcutsDiscoverabilityDismissed());
    setReady(true);
  }, []);

  const onDismiss = useCallback(() => {
    dismissKeyboardShortcutsDiscoverability();
    setDismissed(true);
  }, []);

  if (!ready || dismissed) {
    return null;
  }

  return (
    <aside
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/40",
        props.className,
      )}
      aria-labelledby="keyboard-shortcuts-discoverability-coach-heading"
      data-testid="keyboard-shortcuts-discoverability-coach"
    >
      <div className="flex items-start justify-between gap-2">
        <h2
          id="keyboard-shortcuts-discoverability-coach-heading"
          className={cn(
            "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
            OPERATOR_TYPOGRAPHY.helper,
          )}
        >
          {model.heading}
        </h2>
        <DismissControl
          className="shrink-0"
          label={model.dismissLabel}
          data-testid="keyboard-shortcuts-discoverability-coach-dismiss"
          onDismiss={onDismiss}
        />
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{model.lead}</p>
      <ul
        className={cn(
          "m-0 list-none space-y-1 p-0 text-al-text-primary",
          OPERATOR_TYPOGRAPHY.helper,
        )}
      >
        {model.hints.map((hint) => (
          <li
            key={hint.id}
            data-testid={`keyboard-shortcuts-discoverability-coach-hint-${hint.id}`}
          >
            <span className="font-medium">{hint.label}</span>
            {": "}
            {hint.body}
          </li>
        ))}
      </ul>
    </aside>
  );
}
