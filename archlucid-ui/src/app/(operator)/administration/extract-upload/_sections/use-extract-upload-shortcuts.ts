"use client";

import { useMemo } from "react";

import { useKeyboardShortcuts, type KeyboardShortcutsMap } from "@/hooks/useKeyboardShortcuts";
import { dispatchCommandPaletteHandlerAction } from "@/lib/command-palette-handler-actions";
import {
  queryVisibleExtractUploadCopyQuickStartControl,
  queryVisibleExtractUploadFocusControl,
} from "@/lib/command-palette-work-action-dom";
import { isExtractUploadSettingsRoutePath } from "@/lib/extract-upload-settings-route";

function isExtractUploadPath(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return isExtractUploadSettingsRoutePath(window.location.pathname);
}

function focusExtractUploadSurface(): void {
  const focusControl = queryVisibleExtractUploadFocusControl();

  if (focusControl !== null) {
    focusControl.focus();
    focusControl.click();

    return;
  }

  dispatchCommandPaletteHandlerAction("action-extract-upload-focus");
}

function copyExtractUploadQuickStart(): void {
  const copyControl = queryVisibleExtractUploadCopyQuickStartControl();

  if (copyControl !== null) {
    copyControl.click();

    return;
  }

  dispatchCommandPaletteHandlerAction("action-extract-upload-copy-quick-start");
}

/** Extract & upload page shortcuts — focus upload and copy quick-start command. */
export function useExtractUploadShortcuts(options?: { readonly enabled?: boolean }): void {
  const enabled = options?.enabled !== false;

  const shortcuts = useMemo((): KeyboardShortcutsMap => {
    if (!enabled) {
      return {};
    }

    return {
      "ctrl+u": {
        handler: () => {
          if (!isExtractUploadPath()) {
            return;
          }

          focusExtractUploadSurface();
        },
        description: "Focus inventory upload surface",
        allowInInput: true,
      },
      "ctrl+shift+c": {
        handler: () => {
          if (!isExtractUploadPath()) {
            return;
          }

          copyExtractUploadQuickStart();
        },
        description: "Copy quick-start packager command",
        allowInInput: true,
      },
    };
  }, [enabled]);

  useKeyboardShortcuts(shortcuts);
}
