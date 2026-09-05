"use client";

import { Button } from "@/components/ui/button";
import { OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS } from "@/lib/design-tokens";
import {
  COMMAND_PALETTE_ARIA_KEYSHORTCUTS,
  commandPaletteOpenAriaLabel,
} from "@/lib/keyboard-shortcut-display";
import { dispatchOpenCommandPalette } from "@/lib/shortcut-registry";
import { cn } from "@/lib/utils";

/** Visible command-palette entry next to header search (Ctrl+K). */
export function CommandPaletteTopBarTrigger(): React.JSX.Element {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("inline-flex shrink-0 items-center gap-1.5 px-2.5", OPERATOR_SHELL_TOOLBAR_CONTROL_CLASS)}
      aria-label={commandPaletteOpenAriaLabel("Open command palette")}
      aria-keyshortcuts={COMMAND_PALETTE_ARIA_KEYSHORTCUTS}
      data-testid="operator-shell-command-palette-trigger"
      onClick={() => {
        dispatchOpenCommandPalette();
      }}
    >
      <span className="hidden sm:inline">Command</span>
    </Button>
  );
}
