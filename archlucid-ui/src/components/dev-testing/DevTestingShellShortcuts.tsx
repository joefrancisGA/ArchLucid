"use client";

import { useEffect } from "react";

import {
  cycleDevShellExperienceOverride,
  isDevTestingOverridesEnabled,
  reloadAfterDevTestingOverrideChange,
} from "@/lib/dev-testing-overrides";
import { toggleDevQuickSwitchPanelVisibility } from "@/lib/dev-quick-switch-panel-visibility";

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

/** Local-dev global hotkeys for shell overrides and the home quick-switch panel. */
export function DevTestingShellShortcuts(): null {
  useEffect(() => {
    if (!isDevTestingOverridesEnabled()) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "h") {
        event.preventDefault();
        toggleDevQuickSwitchPanelVisibility();

        return;
      }

      if (!event.altKey || !event.shiftKey || event.key.toLowerCase() !== "d") {
        return;
      }

      event.preventDefault();
      cycleDevShellExperienceOverride();
      reloadAfterDevTestingOverrideChange();
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return null;
}
