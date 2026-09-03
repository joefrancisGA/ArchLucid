"use client";

import { useEffect } from "react";

import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import type { ReviewWorkbenchColumnId } from "@/components/reviews/ReviewWorkbenchLayout";

export type UseReviewWorkbenchShortcutsOptions = {
  readonly enabled: boolean;
  readonly onFocusColumn: (column: ReviewWorkbenchColumnId) => void;
  readonly onSaveDraft?: () => void;
};

const COLUMN_BY_KEY: Record<string, ReviewWorkbenchColumnId> = {
  "1": "architecture",
  "2": "findings",
  "3": "evidence",
};

/** Workbench verbs: Alt+1–3 focus columns; Ctrl+Shift+S save draft when provided. */
export function useReviewWorkbenchShortcuts(options: UseReviewWorkbenchShortcutsOptions): void {
  const shortcuts = options.enabled
    ? {
        "alt+1": {
          handler: () => options.onFocusColumn("architecture"),
          description: "Focus architecture column",
        },
        "alt+2": {
          handler: () => options.onFocusColumn("findings"),
          description: "Focus findings column",
        },
        "alt+3": {
          handler: () => options.onFocusColumn("evidence"),
          description: "Focus evidence column",
        },
        ...(options.onSaveDraft !== undefined
          ? {
              "ctrl+shift+s": {
                handler: options.onSaveDraft,
                description: "Save architecture draft",
                allowInInput: true,
              },
            }
          : {}),
      }
    : {};

  useKeyboardShortcuts(shortcuts);

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (!event.altKey) {
        return;
      }

      const column = COLUMN_BY_KEY[event.key];

      if (column === undefined) {
        return;
      }

      const target = event.target;

      if (
        target instanceof HTMLElement
        && target.closest("[data-review-workbench-layout]")
      ) {
        event.preventDefault();
        options.onFocusColumn(column);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [options.enabled, options.onFocusColumn]);
}
