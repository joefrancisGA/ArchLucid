"use client";

import { useEffect } from "react";

import { preloadCommandPaletteChunk } from "@/components/CommandPaletteLazy";
import { palettePressUsesPaletteModifier } from "@/components/CommandPalette";
import { requestCommandPaletteOpen } from "@/lib/command-palette-open-intent";

/** Open the command palette on first Ctrl+K / ⌘K and warm its chunk (LD-08). */
export function useCommandPaletteChunkPreload(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key?.toLowerCase() !== "k") {
        return;
      }

      if (!palettePressUsesPaletteModifier(event, event.target)) {
        return;
      }

      event.preventDefault();
      requestCommandPaletteOpen();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export { preloadCommandPaletteChunk };
