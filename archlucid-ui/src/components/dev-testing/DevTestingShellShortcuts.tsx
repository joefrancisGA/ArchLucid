"use client";

import { useEffect } from "react";

import { toggleDevQuickSwitchPanelVisibility } from "@/lib/dev-quick-switch-panel-visibility";
import { isDevTestingOverridesEnabled } from "@/lib/dev-testing-overrides";

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

/** Local-dev global hotkeys for the dev quick-switch drawer. */
export function DevTestingShellShortcuts(): null {
  useEffect(() => {
    if (!isDevTestingOverridesEnabled()) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      if (!event.altKey || !event.shiftKey || event.key.toLowerCase() !== "d") {
        return;
      }

      event.preventDefault();
      toggleDevQuickSwitchPanelVisibility();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
