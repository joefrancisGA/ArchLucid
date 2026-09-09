"use client";

import { useMemo } from "react";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";
import { SETTINGS_WORKSPACE_SETTINGS_PATH } from "@/lib/settings-admin-route-paths";
import { dispatchCommandPaletteHandlerAction } from "@/lib/command-palette-handler-actions";
import { queryVisibleTenantCostSettingsSaveControl } from "@/lib/command-palette-work-action-dom";

function isWorkspaceSettingsPath(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.location.pathname === SETTINGS_WORKSPACE_SETTINGS_PATH;
}

function saveTenantCostSettingsFromShortcut(): void {
  const saveControl = queryVisibleTenantCostSettingsSaveControl();

  if (saveControl !== null) {
    saveControl.click();

    return;
  }

  dispatchCommandPaletteHandlerAction("action-save-tenant-cost-settings");
}

/** Workspace settings page shortcuts — Ctrl+S saves tenant cost settings when the form is dirty. */
export function useTenantSettingsShortcuts(options?: { readonly enabled?: boolean }): void {
  const enabled = options?.enabled !== false;

  const shortcuts = useMemo((): KeyboardShortcutsMap => {
    if (!enabled) {
      return {};
    }

    return {
      "ctrl+s": {
        handler: () => {
          if (!isWorkspaceSettingsPath()) {
            return;
          }

          saveTenantCostSettingsFromShortcut();
        },
        description: "Save tenant cost settings",
        allowInInput: true,
      },
    };
  }, [enabled]);

  useKeyboardShortcuts(shortcuts);
}
