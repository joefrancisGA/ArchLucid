"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import { SHORTCUTS, WORKING_MODE_NEW_REVIEW_ROUTE } from "@/lib/shortcut-registry";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "./useKeyboardShortcuts";

export type UseShortcutNavigationOptions = {
  /** Invoked when the user presses Shift+? (help). Defaults to no-op until the shell wires an overlay. */
  onHelpRequested?: () => void;
};

/**
 * Binds registry shortcuts to `router.push` and optional help callback.
 * Safe to call from a client boundary (e.g. a small provider under the root layout in a follow-up).
 */
export function useShortcutNavigation(options: UseShortcutNavigationOptions = {}): {
  shortcuts: typeof SHORTCUTS;
} {
  const router = useRouter();
  const onHelpRequested = options.onHelpRequested;
  const { mode } = useWorkspaceMode();
  const workingMode = isWorkingWorkspaceMode(mode);

  const map: KeyboardShortcutsMap = useMemo(() => {
    const next: KeyboardShortcutsMap = {};

    for (const entry of SHORTCUTS) {
      if (entry.route !== undefined && entry.route !== "") {
        const route =
          workingMode && entry.key === "alt+n" ? WORKING_MODE_NEW_REVIEW_ROUTE : entry.route;
        next[entry.key] = {
          handler: () => {
            router.push(route);
          },
          description: entry.description,
        };
      } else if (isHelpShortcutKey(entry.key)) {
        next[entry.key] = {
          handler: () => {
            (onHelpRequested ?? noop)();
          },
          description: entry.description,
        };
      }
    }

    return next;
  }, [router, onHelpRequested, workingMode]);

  useKeyboardShortcuts(map);

  return { shortcuts: SHORTCUTS };
}

function isHelpShortcutKey(key: string): boolean {
  const normalized = key.toLowerCase().trim();

  return normalized === "shift+?" || normalized === "f1";
}

function noop(): void {
  /* default help: no overlay until Prompt 2 */
}
