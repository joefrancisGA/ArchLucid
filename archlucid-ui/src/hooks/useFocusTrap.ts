"use client";

import type { RefObject } from "react";
import { useEffect } from "react";

/** Selectors matching tabbable-ish controls Radix/dialog patterns usually include. */
const FOCUSABLE_SELECTOR = [
  "a[href]:not([tabindex='-1'])",
  "button:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([type='hidden']):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1'])",
]
  .join(", ");

function isVisible(el: HTMLElement): boolean {
  if (el.closest("[hidden]")) {
    return false;
  }

  return el.getClientRects().length > 0;
}

function tabbables(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)].filter(isVisible);
}

/**
 * Keeps keyboard focus cycling inside {@link containerRef} while {@link active}.
 * Saves the previously focused element and restores it on deactivate.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
  useEffect(() => {
    if (!active) {
      return;
    }

    const root = containerRef.current;
    if (root === null) {
      return;
    }

    const previous =
      document.activeElement instanceof HTMLElement && !root.contains(document.activeElement)
        ? document.activeElement
        : null;

    const elements = tabbables(root);
    const first = elements[0];

    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Tab" || root === null) {
        return;
      }

      const list = tabbables(root);
      if (list.length === 0) {
        return;
      }

      const firstFocusable = list[0];
      const lastFocusable = list[list.length - 1];
      const current = document.activeElement;

      if (e.shiftKey) {
        if (current === firstFocusable || !root.contains(current)) {
          e.preventDefault();

          lastFocusable.focus();
        }

        return;
      }

      if (current === lastFocusable || !root.contains(current)) {
        e.preventDefault();

        firstFocusable.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);

      if (previous !== null && document.contains(previous)) {
        previous.focus();
      }
    };
  }, [active, containerRef]);
}
