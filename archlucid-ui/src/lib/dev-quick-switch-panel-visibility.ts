"use client";

import { useCallback, useEffect, useState } from "react";

import {
  isDevTestingOverridesEnabled,
  persistDevQuickSwitchPanelHidden,
  readDevQuickSwitchPanelHiddenFromDocument,
  toggleDevQuickSwitchPanelHidden,
} from "@/lib/dev-testing-overrides";

export const DEV_QUICK_SWITCH_PANEL_VISIBILITY_EVENT = "archlucid-dev-quick-switch-panel-visibility";

export const DEV_QUICK_SWITCH_PANEL_TOGGLE_SHORTCUT = "Alt+Shift+D";

function dispatchDevQuickSwitchPanelVisibilityChanged(hidden: boolean): void {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent(DEV_QUICK_SWITCH_PANEL_VISIBILITY_EVENT, {
      detail: { hidden },
    }),
  );
}

export function toggleDevQuickSwitchPanelVisibility(): boolean {
  const hidden = toggleDevQuickSwitchPanelHidden();

  dispatchDevQuickSwitchPanelVisibilityChanged(hidden);

  return hidden;
}

export function setDevQuickSwitchPanelVisibility(hidden: boolean): void {
  persistDevQuickSwitchPanelHidden(hidden);
  dispatchDevQuickSwitchPanelVisibilityChanged(hidden);
}

/** Client hook for the home-page dev quick-switch panel visibility (local development only). */
export function useDevQuickSwitchPanelVisibility(): {
  readonly hidden: boolean;
  readonly toggle: () => void;
} {
  const [hidden, setHidden] = useState(true);

  useEffect(() => {
    if (!isDevTestingOverridesEnabled()) {
      return;
    }

    setHidden(readDevQuickSwitchPanelHiddenFromDocument());

    const onVisibilityChanged = (event: Event): void => {
      if (!(event instanceof CustomEvent) || typeof event.detail !== "object" || event.detail === null) {
        return;
      }

      const detail = event.detail as { hidden?: unknown };

      if (typeof detail.hidden === "boolean") {
        setHidden(detail.hidden);
      }
    };

    window.addEventListener(DEV_QUICK_SWITCH_PANEL_VISIBILITY_EVENT, onVisibilityChanged);

    return () => {
      window.removeEventListener(DEV_QUICK_SWITCH_PANEL_VISIBILITY_EVENT, onVisibilityChanged);
    };
  }, []);

  const toggle = useCallback(() => {
    setHidden(toggleDevQuickSwitchPanelVisibility());
  }, []);

  return { hidden, toggle };
}
