"use client";

import { useEffect } from "react";

import { toggleDevQuickSwitchPanelVisibility } from "@/lib/dev-quick-switch-panel-visibility";
import { keyEventMatchesCombo } from "@/hooks/useKeyboardShortcuts";
import {
  cycleDevShellExperienceOverride,
  isDevTestingOverridesEnabled,
  reloadAfterDevTestingOverrideChange,
} from "@/lib/dev-testing-overrides";

function isEditableKeyboardTarget(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    (target instanceof HTMLElement && target.isContentEditable)
  );
}

/** Local-dev global hotkeys: Ctrl+Shift+H toggles the quick-switch drawer; Alt+Shift+D cycles shell density. */
export function DevTestingShellShortcuts(): null {
  useEffect(() => {
    if (!isDevTestingOverridesEnabled()) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent): void => {
      if (isEditableKeyboardTarget(event.target)) {
        return;
      }

      if (keyEventMatchesCombo(event, "ctrl+shift+h")) {
        event.preventDefault();
        toggleDevQuickSwitchPanelVisibility();

        return;
      }

      if (!keyEventMatchesCombo(event, "alt+shift+d")) {
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
