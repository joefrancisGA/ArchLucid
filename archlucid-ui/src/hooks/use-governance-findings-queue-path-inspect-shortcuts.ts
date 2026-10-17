"use client";

import { useCallback, useEffect, useMemo } from "react";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";
import { COMMAND_PALETTE_GOVERNANCE_FINDINGS_PATH_INSPECT_EVENT } from "@/lib/governance/governance-findings-queue-command-palette-events";

export type UseGovernanceFindingsQueuePathInspectShortcutsOptions = {
  readonly enabled: boolean;
  readonly onFocusPathInspect: () => void;
};

export function focusGovernanceFindingsQueuePathInspectPanel(panel: HTMLElement | null): void {
  if (panel === null) {
    return;
  }

  panel.scrollIntoView({ behavior: "smooth", block: "start" });
  panel.focus();
}

export function useGovernanceFindingsQueuePathInspectShortcuts(
  options: UseGovernanceFindingsQueuePathInspectShortcutsOptions,
): void {
  const onFocusPathInspect = options.onFocusPathInspect;

  const map = useMemo((): KeyboardShortcutsMap => {
    if (!options.enabled) {
      return {};
    }

    return {
      "alt+i": {
        description: "Focus path inspect panel",
        handler: () => {
          onFocusPathInspect();
        },
      },
    };
  }, [onFocusPathInspect, options.enabled]);

  useKeyboardShortcuts(map);

  useEffect(() => {
    if (!options.enabled) {
      return;
    }

    const onInspect = () => {
      onFocusPathInspect();
    };

    window.addEventListener(COMMAND_PALETTE_GOVERNANCE_FINDINGS_PATH_INSPECT_EVENT, onInspect);

    return () => {
      window.removeEventListener(COMMAND_PALETTE_GOVERNANCE_FINDINGS_PATH_INSPECT_EVENT, onInspect);
    };
  }, [onFocusPathInspect, options.enabled]);
}
