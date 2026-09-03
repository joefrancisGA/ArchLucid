"use client";

import { useEffect, useMemo } from "react";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";
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

export function useReviewWorkbenchShortcuts(options: UseReviewWorkbenchShortcutsOptions): void {
  const shortcuts = useMemo((): KeyboardShortcutsMap => {
    if (!options.enabled || options.onSaveDraft === undefined) {
      return {};
    }

    return {
      "ctrl+shift+s": {
        handler: options.onSaveDraft,
        description: "Save architecture draft",
        allowInInput: true,
      },
    };
  }, [options.enabled, options.onSaveDraft]);

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
