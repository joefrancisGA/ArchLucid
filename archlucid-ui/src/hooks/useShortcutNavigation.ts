"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { askReviewQuestionsHref } from "@/lib/ask-review-questions-route";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import { SHORTCUTS, resolveShortcutDescription } from "@/lib/shortcut-registry";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { buildCompareTwoReviewsHref, readReviewRunIdFromPathname } from "@/lib/compare-two-reviews-route";
import { useWorkingStartHref } from "@/hooks/use-working-start-href";

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
  const pathname = usePathname();
  const onHelpRequested = options.onHelpRequested;
  const { mode } = useWorkspaceMode();
  const workingMode = isWorkingWorkspaceMode(mode);
  const workingStartHref = useWorkingStartHref();

  const map: KeyboardShortcutsMap = useMemo(() => {
    const next: KeyboardShortcutsMap = {};
    const reviewRunId = readReviewRunIdFromPathname(pathname ?? "");

    for (const entry of SHORTCUTS) {
      if (entry.route !== undefined && entry.route !== "") {
        let route =
          workingMode && entry.key === "alt+n" ? workingStartHref : entry.route;

        if (workingMode && entry.key === "alt+c" && reviewRunId !== null) {
          route = buildCompareTwoReviewsHref({ baseRunId: reviewRunId });
        }

        if (workingMode && entry.key === "alt+a" && reviewRunId !== null) {
          route = askReviewQuestionsHref({ runId: reviewRunId });
        }

        if (workingMode && entry.key === "alt+y" && reviewRunId !== null) {
          route = evidenceGraphHref({ runId: reviewRunId });
        }

        next[entry.key] = {
          handler: () => {
            router.push(route);
          },
          description: resolveShortcutDescription(entry, workingMode, reviewRunId !== null),
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
  }, [onHelpRequested, pathname, router, workingMode, workingStartHref]);

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
