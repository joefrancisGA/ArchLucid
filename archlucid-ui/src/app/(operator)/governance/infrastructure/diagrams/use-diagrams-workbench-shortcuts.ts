"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";
import { isInfrastructureDiagramsRoutePath } from "@/lib/product-line/securenow-infrastructure-diagrams-route";

export type DiagramsWorkbenchShortcutFocusHandlers = {
  readonly focusSubscriptionPicker: () => void;
  readonly focusSnapshotPicker: () => void;
  readonly focusDiagramTypePicker: () => void;
};

/** Diagrams workbench page shortcuts — Alt+1/2/3 focus the picker row. */
export function useDiagramsWorkbenchShortcuts(
  handlers: DiagramsWorkbenchShortcutFocusHandlers,
  options?: { readonly enabled?: boolean },
): void {
  const pathname = usePathname();
  const enabled = options?.enabled !== false;

  const shortcuts = useMemo((): KeyboardShortcutsMap => {
    if (!enabled) {
      return {};
    }

    return {
      "alt+1": {
        handler: () => {
          if (!isInfrastructureDiagramsRoutePath(pathname)) {
            return;
          }

          handlers.focusSubscriptionPicker();
        },
        description: "Focus subscription picker",
        allowInInput: true,
      },
      "alt+2": {
        handler: () => {
          if (!isInfrastructureDiagramsRoutePath(pathname)) {
            return;
          }

          handlers.focusSnapshotPicker();
        },
        description: "Focus snapshot picker",
        allowInInput: true,
      },
      "alt+3": {
        handler: () => {
          if (!isInfrastructureDiagramsRoutePath(pathname)) {
            return;
          }

          handlers.focusDiagramTypePicker();
        },
        description: "Focus diagram type picker",
        allowInInput: true,
      },
    };
  }, [enabled, handlers, pathname]);

  useKeyboardShortcuts(shortcuts);
}
