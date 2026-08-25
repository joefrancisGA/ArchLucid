"use client";

import { useCallback, useEffect, useState } from "react";

import { DismissControl } from "@/components/usability/DismissControl";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "archlucid_global_search_shortcut_coach_dismissed_v1";

/** One-time reminder that `/` focuses global search and Ctrl+K opens the command palette. */
export function GlobalSearchShortcutCoach(): React.JSX.Element | null {
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
        OPERATOR_TYPOGRAPHY.helper,
      )}
      data-testid="global-search-shortcut-coach"
      role="note"
    >
      <p className="m-0 min-w-0 flex-1 text-neutral-800 dark:text-neutral-200">
        Quick find: press <kbd className="rounded border px-1">/</kbd> to focus search or{" "}
        <kbd className="rounded border px-1">Ctrl+K</kbd> for jump menus, recent pages, and review actions.
      </p>
      <DismissControl className="h-7" onDismiss={onDismiss} />
    </div>
  );
}
