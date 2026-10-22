"use client";

import { useEffect } from "react";

import { CommandPalette } from "@/components/CommandPaletteLazy";
import { useCommandPaletteChunkPreload } from "@/hooks/use-command-palette-chunk-preload";

/**
 * Mounts the command palette outside deferred top-bar chrome so Ctrl+K opens on first keydown (LD-08).
 * The visible header trigger dispatches {@link OPEN_COMMAND_PALETTE_EVENT}; this host owns the dialog.
 */
export function AppShellSyncCommandPaletteHost(): React.JSX.Element {
  useCommandPaletteChunkPreload();

  useEffect(() => {
    void import("@/components/CommandPalette").then(() => undefined);
  }, []);

  return <CommandPalette showTrigger={false} />;
}
