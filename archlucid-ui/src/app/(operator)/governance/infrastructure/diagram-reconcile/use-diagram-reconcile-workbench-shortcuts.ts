"use client";

import { useMemo } from "react";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";

export type DiagramReconcileWorkbenchShortcutHandlers = {
  readonly ingestDiagram: () => void;
  readonly reconcileDiagram: () => void;
  readonly selectNextRow: () => void;
  readonly selectPreviousRow: () => void;
};

export function useDiagramReconcileWorkbenchShortcuts(
  handlers: DiagramReconcileWorkbenchShortcutHandlers,
  options?: { readonly enabled?: boolean },
): void {
  const enabled = options?.enabled !== false;

  const shortcuts = useMemo((): KeyboardShortcutsMap => {
    if (!enabled) {
      return {};
    }

    return {
      "ctrl+enter": {
        handler: handlers.ingestDiagram,
        description: "Ingest diagram on sealed review record",
        allowInInput: true,
      },
      "ctrl+shift+r": {
        handler: handlers.reconcileDiagram,
        description: "Reconcile diagram against inventory snapshot",
      },
      j: {
        handler: handlers.selectNextRow,
        description: "Select next correspondence row",
      },
      k: {
        handler: handlers.selectPreviousRow,
        description: "Select previous correspondence row",
      },
    };
  }, [enabled, handlers]);

  useKeyboardShortcuts(shortcuts);
}
