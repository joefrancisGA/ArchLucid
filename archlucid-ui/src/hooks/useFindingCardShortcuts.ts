"use client";

import { useMemo } from "react";

import type { FindingDispositionKind } from "@/lib/api/governance-stickiness-api";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "./useKeyboardShortcuts";

/** Disposition kinds bound to Alt+1 / Alt+2 / Alt+3 on finding cards. */
export type FindingCardShortcutDisposition = Extract<
  FindingDispositionKind,
  "Accepted" | "Remediated" | "RejectedAsNotApplicable"
>;

export const FINDING_CARD_SHORTCUT_DISPOSITIONS = {
  alt1: "Accepted",
  alt2: "Remediated",
  alt3: "RejectedAsNotApplicable",
} as const satisfies Record<"alt1" | "alt2" | "alt3", FindingCardShortcutDisposition>;

export type UseFindingCardShortcutsOptions = {
  /** Invoked with API disposition kinds: Accepted, Remediated, RejectedAsNotApplicable. */
  onAction: (findingId: string, disposition: FindingCardShortcutDisposition) => void;
  /**
   * When false, Alt+1/2/3 are not registered (read-tier principals still use J/K to move between cards).
   * Pass **`useOperateCapability()`** so shortcuts match the same Execute+ floor as disposition confirms.
   */
  mutationsEnabled?: boolean;
  /** Called when Alt+J/K moves focus to a different finding card (workbench selection sync). */
  onFindingFocus?: (findingId: string) => void;
};

function getFindingCardFromActiveElement(): HTMLElement | null {
  const active = document.activeElement;

  if (!(active instanceof HTMLElement)) {
    return null;
  }

  // Prefer the card/row root so Alt+1 works when focus landed on a control inside the finding.
  return active.closest<HTMLElement>("[data-finding-id]");
}

export function getFocusedFindingId(): string | null {
  const card = getFindingCardFromActiveElement();

  if (card === null) {
    return null;
  }

  const id = card.getAttribute("data-finding-id");

  if (id === null || id === "") {
    return null;
  }

  return id;
}

export type FocusAdjacentFindingCardOptions = {
  readonly onFindingFocus?: (findingId: string) => void;
  /** Palette work actions may start from the first card when nothing is focused (LI-07). */
  readonly startFromFirstWhenUnfocused?: boolean;
};

/** Move keyboard focus to the next/previous `[data-finding-id]` card (palette + shortcut bridge). */
export function focusAdjacentFindingCard(delta: number, options?: FocusAdjacentFindingCardOptions): void {
  const onFindingFocus = options?.onFindingFocus;
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-finding-id]"));

  if (nodes.length === 0) {
    return;
  }

  const current = getFindingCardFromActiveElement();
  const idx = current !== null ? nodes.indexOf(current) : -1;

  if (idx < 0) {
    if (options?.startFromFirstWhenUnfocused !== true) {
      return;
    }

    const first = nodes[0];
    first?.focus();
    const firstId = first?.getAttribute("data-finding-id") ?? "";

    if (firstId.length > 0) {
      onFindingFocus?.(firstId);
    }

    return;
  }

  let nextIdx = idx + delta;

  if (nextIdx < 0) {
    nextIdx = 0;
  } else if (nextIdx >= nodes.length) {
    nextIdx = 0;
  }

  const next = nodes[nextIdx];

  next?.focus();

  const nextId = next?.getAttribute("data-finding-id") ?? "";

  if (nextId.length > 0) {
    onFindingFocus?.(nextId);
  }
}

/** Dispatch Alt+1/2/3 at the window so palette actions reuse the same shortcut handlers (WD-05). */
export function dispatchFocusedFindingDispositionShortcut(
  disposition: FindingCardShortcutDisposition,
): boolean {
  if (getFocusedFindingId() === null) {
    return false;
  }

  const key =
    disposition === FINDING_CARD_SHORTCUT_DISPOSITIONS.alt1
      ? "1"
      : disposition === FINDING_CARD_SHORTCUT_DISPOSITIONS.alt2
        ? "2"
        : "3";

  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key,
      altKey: true,
      bubbles: true,
    }),
  );

  return true;
}

/**
 * Findings queues: Alt+1/2/3 act on the focused (or containing) finding card/row; Alt+J/K move focus.
 * Skips when focus is not inside a `[data-finding-id]` element (or when `useKeyboardShortcuts` blocks inputs).
 */
export function useFindingCardShortcuts(options: UseFindingCardShortcutsOptions): void {
  const onAction = options.onAction;
  const mutationsEnabled = options.mutationsEnabled !== false;
  const onFindingFocus = options.onFindingFocus;

  const map = useMemo((): KeyboardShortcutsMap => {
    const navigation: KeyboardShortcutsMap = {
      "alt+j": {
        description: "Focus next finding card",
        handler: () => {
          focusAdjacentFindingCard(1, { onFindingFocus });
        },
      },
      "alt+k": {
        description: "Focus previous finding card",
        handler: () => {
          focusAdjacentFindingCard(-1, { onFindingFocus });
        },
      },
    };

    if (!mutationsEnabled) {
      return navigation;
    }

    return {
      "alt+1": {
        description: "Accept focused finding",
        handler: () => {
          const id = getFocusedFindingId();

          if (id !== null) {
            onAction(id, FINDING_CARD_SHORTCUT_DISPOSITIONS.alt1);
          }
        },
      },
      "alt+2": {
        description: "Mark focused finding remediated",
        handler: () => {
          const id = getFocusedFindingId();

          if (id !== null) {
            onAction(id, FINDING_CARD_SHORTCUT_DISPOSITIONS.alt2);
          }
        },
      },
      "alt+3": {
        description: "Reject focused finding as not applicable",
        handler: () => {
          const id = getFocusedFindingId();

          if (id !== null) {
            onAction(id, FINDING_CARD_SHORTCUT_DISPOSITIONS.alt3);
          }
        },
      },
      ...navigation,
    };
  }, [onAction, mutationsEnabled, onFindingFocus]);

  useKeyboardShortcuts(map);
}