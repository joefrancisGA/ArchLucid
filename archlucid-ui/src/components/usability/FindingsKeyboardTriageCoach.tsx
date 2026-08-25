"use client";

import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_findings_keyboard_triage_coach_dismissed_v1";

/** One-time coach for findings keyboard triage on the governance findings queue. */
export function FindingsKeyboardTriageCoach(): React.JSX.Element | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      setVisible(window.localStorage.getItem(STORAGE_KEY) !== "1");
    } catch {
      setVisible(true);
    }
  }, []);

  const onDismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }

    setVisible(false);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-3 flex flex-wrap items-start justify-between gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="findings-keyboard-triage-coach"
      role="note"
    >
      <p className="m-0 min-w-0 flex-1 text-neutral-800 dark:text-neutral-200">
        Keyboard triage: focus a finding card, then use <kbd className="rounded border px-1">Alt+J</kbd> /{" "}
        <kbd className="rounded border px-1">Alt+K</kbd> to move. At Execute+ rank,{" "}
        <kbd className="rounded border px-1">Alt+1</kbd> accept, <kbd className="rounded border px-1">Alt+2</kbd> remediate,{" "}
        <kbd className="rounded border px-1">Alt+3</kbd> reject. Press <kbd className="rounded border px-1">Shift+?</kbd> for the full list.
      </p>
      <DismissControl className="h-7" onDismiss={onDismiss} />
    </div>
  );
}
