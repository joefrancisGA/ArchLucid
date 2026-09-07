"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { askReviewQuestionsHref } from "@/lib/ask-review-questions-route";
import { evidenceGraphHref } from "@/lib/evidence-graph-route";
import { SHORTCUTS, resolveShortcutDescription } from "@/lib/shortcut-registry";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { buildCompareTwoReviewsHref, readReviewRunIdFromPathname } from "@/lib/compare-two-reviews-route";
import { readCachedDeskContinuity } from "@/lib/desk-continuity-preference";
import { resolveOpenPackageRunId } from "@/lib/resolve-open-package-run-id";
import { useWorkingStartHref } from "@/hooks/use-working-start-href";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isPathAllowedForProductLine } from "@/lib/product-line/product-line-path-access";

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
  const { productLine, assignmentOverrides } = useProductLine();

  const map: KeyboardShortcutsMap = useMemo(() => {
    const next: KeyboardShortcutsMap = {};
    const openPackageRunId = workingMode
      ? resolveOpenPackageRunId({
          pathname,
          lastOpenReviewId: readCachedDeskContinuity().lastOpenReviewId,
        })
      : readReviewRunIdFromPathname(pathname ?? "");

    for (const entry of SHORTCUTS) {
      if (entry.route !== undefined && entry.route !== "") {
        if (!isPathAllowedForProductLine(entry.route, productLine, { assignmentOverrides })) {
          continue;
        }

        let route =
          workingMode && entry.key === "alt+n" ? workingStartHref : entry.route;

        if (workingMode && entry.key === "alt+c" && openPackageRunId !== null) {
          route = buildCompareTwoReviewsHref({ baseRunId: openPackageRunId });
        }

        if (workingMode && entry.key === "alt+a" && openPackageRunId !== null) {
          route = askReviewQuestionsHref({ runId: openPackageRunId });
        }

        if (workingMode && entry.key === "alt+y" && openPackageRunId !== null) {
          route = evidenceGraphHref({ runId: openPackageRunId });
        }

        next[entry.key] = {
          handler: () => {
            router.push(route);
          },
          description: resolveShortcutDescription(entry, workingMode, openPackageRunId !== null),
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
  }, [assignmentOverrides, onHelpRequested, pathname, productLine, router, workingMode, workingStartHref]);

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
