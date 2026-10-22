"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";
import { dispatchCommandPaletteHandlerAction } from "@/lib/command-palette-handler-actions";
import { queryVisibleArchitectureDraftSaveControl } from "@/lib/command-palette-work-action-dom";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";

export type UseArchitectureDeskShortcutsOptions = {
  readonly startReviewHref: string;
  readonly enabled?: boolean;
};

function isFocusOnArchitectureDesk(): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const active = document.activeElement;

  if (!(active instanceof HTMLElement)) {
    return document.querySelector('[data-testid="architecture-identity-desk"]') !== null;
  }

  return active.closest('[data-testid="architecture-identity-desk"]') !== null;
}

function clickDeskControl(testId: string): boolean {
  const control = document.querySelector<HTMLElement>(`[data-testid="${testId}"]`);

  if (control === null) {
    return false;
  }

  control.click();

  return true;
}

function clickFirstInFlightOpenLink(): boolean {
  const link = document.querySelector<HTMLAnchorElement>(
    '[data-testid^="architecture-identity-in-flight-open-"]',
  );

  if (link === null) {
    return false;
  }

  link.click();

  return true;
}

/** Working architecture desk keyboard actions (AO-43 / AD-10). */
export function useArchitectureDeskShortcuts(options: UseArchitectureDeskShortcutsOptions): void {
  const router = useRouter();
  const { mode } = useWorkspaceMode();
  const workingMode = isWorkingWorkspaceMode(mode);
  const enabled = options.enabled !== false && workingMode;

  const shortcuts = useMemo((): KeyboardShortcutsMap => {
    if (!enabled) {
      return {};
    }

    return {
      "alt+shift+r": {
        handler: () => {
          if (!isFocusOnArchitectureDesk()) {
            return;
          }

          router.push(options.startReviewHref);
        },
        description: "Start a review from this architecture desk",
      },
      "alt+shift+d": {
        handler: () => {
          if (!isFocusOnArchitectureDesk()) {
            return;
          }

          clickDeskControl("architecture-identity-open-current-draft");
        },
        description: "Continue the open draft on this architecture desk",
      },
      "alt+shift+i": {
        handler: () => {
          if (!isFocusOnArchitectureDesk()) {
            return;
          }

          if (clickFirstInFlightOpenLink()) {
            return;
          }

          clickDeskControl("architecture-identity-open-review");
        },
        description: "Resume the first in-flight review job on this desk",
      },
      "ctrl+shift+s": {
        handler: () => {
          if (!isFocusOnArchitectureDesk()) {
            return;
          }

          const saveControl = queryVisibleArchitectureDraftSaveControl();

          if (saveControl !== null) {
            saveControl.click();

            return;
          }

          dispatchCommandPaletteHandlerAction("action-save-draft");
        },
        description: "Save architecture draft changes from the desk",
        allowInInput: true,
      },
    };
  }, [enabled, options.startReviewHref, router]);

  useKeyboardShortcuts(shortcuts);
}
