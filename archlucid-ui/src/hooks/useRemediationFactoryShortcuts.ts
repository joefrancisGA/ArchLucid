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

export function focusAdjacentRemediationFactoryRow(delta: number): string | null {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>(`[${REMEDIATION_FACTORY_ROW_ATTR}]`));

  if (nodes.length === 0) {
    return null;
  }

  const current = getFocusedRemediationRow();
  const idx = current !== null ? nodes.indexOf(current) : -1;
  const startIdx = idx < 0 ? (delta > 0 ? 0 : nodes.length - 1) : idx + delta;
  const wrapped =
    startIdx < 0 ? nodes.length - 1 : startIdx >= nodes.length ? 0 : startIdx;
  const next = nodes[wrapped];

  next?.focus();

  return next?.getAttribute(REMEDIATION_FACTORY_ROW_ATTR);
}

export function useRemediationFactoryShortcuts(options: UseRemediationFactoryShortcutsOptions): void {
  const map = useMemo((): KeyboardShortcutsMap => {
    const navigation: KeyboardShortcutsMap = {
      "alt+j": {
        description: "Select next remediation factory row",
        handler: () => {
          const rowId = focusAdjacentRemediationFactoryRow(1);

          if (rowId !== null) {
            options.onSelectRowId(rowId);
          }
        },
      },
      "alt+k": {
        description: "Select previous remediation factory row",
        handler: () => {
          const rowId = focusAdjacentRemediationFactoryRow(-1);

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
      const rowId = focusAdjacentRemediationFactoryRow(1);

      if (rowId !== null) {
        options.onSelectRowId(rowId);
      }
    };

    const onPrev = () => {
      const rowId = focusAdjacentRemediationFactoryRow(-1);

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
