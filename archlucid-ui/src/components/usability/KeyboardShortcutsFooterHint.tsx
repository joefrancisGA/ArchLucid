"use client";

import { useCallback } from "react";

import { Button } from "@/components/ui/button";

/** Discoverable footer affordance for the shortcuts dialog (Shift+?). */
export function KeyboardShortcutsFooterHint() {
  const openShortcuts = useCallback(() => {
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "?", shiftKey: true, bubbles: true }));
  }, []);

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs text-neutral-600 dark:text-neutral-400"
      onClick={openShortcuts}
      data-testid="keyboard-shortcuts-footer-hint"
      aria-keyshortcuts="Shift+?"
    >
      ⌨ Shortcuts
    </Button>
  );
}
