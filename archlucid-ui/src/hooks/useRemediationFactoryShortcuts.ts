"use client";

import { useEffect, useMemo } from "react";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";
import {
  COMMAND_PALETTE_REMEDIATION_FACTORY_EXPLAIN_EVENT,
  COMMAND_PALETTE_REMEDIATION_FACTORY_INSPECT_EVENT,
  COMMAND_PALETTE_REMEDIATION_FACTORY_NEXT_EVENT,
  COMMAND_PALETTE_REMEDIATION_FACTORY_PREV_EVENT,
} from "@/lib/remediation-factory/remediation-factory-command-palette-events";

export const REMEDIATION_FACTORY_ROW_ATTR = "data-remediation-factory-row-id";

export type UseRemediationFactoryShortcutsOptions = {
  readonly getNavigationAnchorRowId: () => string | null;
  readonly onSelectRowId: (rowId: string) => void;
  readonly onFocusInspect: () => void;
  readonly onExplainScore: () => void;
  readonly explainEnabled: boolean;
};

function getFocusedRemediationRow(): HTMLElement | null {
  const active = document.activeElement;

  if (!(active instanceof HTMLElement)) {
    return null;
  }

  return active.closest<HTMLElement>(`[${REMEDIATION_FACTORY_ROW_ATTR}]`);
}

/** Move row focus/selection using DOM focus when present, otherwise the navigation anchor row id. */
export function focusAdjacentRemediationFactoryRow(
  delta: number,
  navigationAnchorRowId?: string | null,
): string | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[${REMEDIATION_FACTORY_ROW_ATTR}]`));

  if (nodes.length === 0) {
    return null;
  }

  const focused = getFocusedRemediationRow();
  let idx = focused !== null ? nodes.indexOf(focused) : -1;

  if (idx < 0 && navigationAnchorRowId != null && navigationAnchorRowId.length > 0) {
    idx = nodes.findIndex(
      (node) => node.getAttribute(REMEDIATION_FACTORY_ROW_ATTR) === navigationAnchorRowId,
    );
  }

  if (idx < 0) {
    const fallbackIdx = delta > 0 ? 0 : nodes.length - 1;
    nodes[fallbackIdx]?.focus();

    return nodes[fallbackIdx]?.getAttribute(REMEDIATION_FACTORY_ROW_ATTR) ?? null;
  }

  let nextIdx = idx + delta;

  if (nextIdx < 0) {
    nextIdx = nodes.length - 1;
  } else if (nextIdx >= nodes.length) {
    nextIdx = 0;
  }

  const next = nodes[nextIdx];

  next?.focus();

  return next?.getAttribute(REMEDIATION_FACTORY_ROW_ATTR) ?? null;
}

export function useRemediationFactoryShortcuts(options: UseRemediationFactoryShortcutsOptions): void {
  const map = useMemo((): KeyboardShortcutsMap => {
    const navigation: KeyboardShortcutsMap = {
      "alt+j": {
        description: "Select next remediation factory row",
        handler: () => {
          const rowId = focusAdjacentRemediationFactoryRow(1, options.getNavigationAnchorRowId());

          if (rowId !== null) {
            options.onSelectRowId(rowId);
          }
        },
      },
      "alt+k": {
        description: "Select previous remediation factory row",
        handler: () => {
          const rowId = focusAdjacentRemediationFactoryRow(-1, options.getNavigationAnchorRowId());

          if (rowId !== null) {
            options.onSelectRowId(rowId);
          }
        },
      },
      "alt+i": {
        description: "Focus path inspect panel",
        handler: () => {
          options.onFocusInspect();
        },
      },
    };

    if (options.explainEnabled) {
      navigation["alt+e"] = {
        description: "Explain selected finding score",
        handler: () => {
          options.onExplainScore();
        },
      };
    }

    return navigation;
  }, [options]);

  useKeyboardShortcuts(map);

  useEffect(() => {
    const onNext = () => {
      const rowId = focusAdjacentRemediationFactoryRow(1, options.getNavigationAnchorRowId());

      if (rowId !== null) {
        options.onSelectRowId(rowId);
      }
    };

    const onPrev = () => {
      const rowId = focusAdjacentRemediationFactoryRow(-1, options.getNavigationAnchorRowId());

      if (rowId !== null) {
        options.onSelectRowId(rowId);
      }
    };

    const onInspect = () => {
      options.onFocusInspect();
    };

    const onExplain = () => {
      options.onExplainScore();
    };

    window.addEventListener(COMMAND_PALETTE_REMEDIATION_FACTORY_NEXT_EVENT, onNext);
    window.addEventListener(COMMAND_PALETTE_REMEDIATION_FACTORY_PREV_EVENT, onPrev);
    window.addEventListener(COMMAND_PALETTE_REMEDIATION_FACTORY_INSPECT_EVENT, onInspect);
    window.addEventListener(COMMAND_PALETTE_REMEDIATION_FACTORY_EXPLAIN_EVENT, onExplain);

    return () => {
      window.removeEventListener(COMMAND_PALETTE_REMEDIATION_FACTORY_NEXT_EVENT, onNext);
      window.removeEventListener(COMMAND_PALETTE_REMEDIATION_FACTORY_PREV_EVENT, onPrev);
      window.removeEventListener(COMMAND_PALETTE_REMEDIATION_FACTORY_INSPECT_EVENT, onInspect);
      window.removeEventListener(COMMAND_PALETTE_REMEDIATION_FACTORY_EXPLAIN_EVENT, onExplain);
    };
  }, [options]);
}
