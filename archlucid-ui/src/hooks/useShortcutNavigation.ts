"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";

import { SHORTCUTS, resolveRegistryShortcutRoute, resolveShortcutDescription } from "@/lib/shortcut-registry";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import { buildCompareTwoReviewsHref, readReviewRunIdFromPathname } from "@/lib/compare-two-reviews-route";
import { readCachedDeskContinuity, readCachedLastOpenArchitectureId } from "@/lib/desk-continuity-preference";
import { resolveOpenPackageRunId } from "@/lib/resolve-open-package-run-id";
import { resolveWorkingAltRHref } from "@/lib/resolve-working-alt-r-href";
import {
  resolveWorkingDeskToolHref,
  type WorkingDeskTool,
} from "@/lib/resolve-working-desk-tool-href";
import { useWorkingCreateStartHref } from "@/hooks/use-working-start-href";
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
  const workingCreateStartHref = useWorkingCreateStartHref();
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
        const registryRoute = resolveRegistryShortcutRoute(entry, productLine);

        if (!isPathAllowedForProductLine(registryRoute, productLine, { assignmentOverrides })) {
          continue;
        }

        next[entry.key] = {
          handler: () => {
            let route = registryRoute;
            if (workingMode && entry.key === "alt+n") {
              route = workingCreateStartHref;
            } else if (workingMode && entry.key === "alt+r") {
              route = resolveWorkingAltRHref({ lastOpenArchitectureId: readCachedLastOpenArchitectureId() }).href;
            } else if (workingMode) {
              const deskTool = workingDeskToolFromShortcutKey(entry.key);
              if (deskTool !== null) {
                route = resolveWorkingDeskToolHref({
                  tool: deskTool,
                  lastOpenArchitectureId: readCachedLastOpenArchitectureId(),
                  pathname,
                  lastOpenReviewId: readCachedDeskContinuity().lastOpenReviewId,
                  productLine,
                });
              }
            } else if (entry.key === "alt+c" && openPackageRunId !== null) {
              route = buildCompareTwoReviewsHref({ baseRunId: openPackageRunId });
            }

            router.push(route);
          },
          description: resolveShortcutDescription(entry, workingMode, openPackageRunId !== null, productLine),
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
  }, [assignmentOverrides, onHelpRequested, pathname, productLine, router, workingMode, workingCreateStartHref]);

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

function workingDeskToolFromShortcutKey(key: string): WorkingDeskTool | null {
  switch (key.toLowerCase().trim()) {
    case "alt+c":
      return "compare";
    case "alt+a":
      return "ask";
    case "alt+y":
      return "graph";
    case "alt+g":
      return "findings";
    default:
      return null;
  }
}
