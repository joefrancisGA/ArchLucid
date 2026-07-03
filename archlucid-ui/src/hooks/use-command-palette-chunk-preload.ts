"use client";

import { useEffect } from "react";

import { preloadCommandPaletteChunk } from "@/components/CommandPaletteLazy";

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tag = target.tagName;

  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
    return true;
  }

  if (target.isContentEditable) {
    return true;
  }

  return false;
}

/** Warm the command palette chunk on first Ctrl+K / ⌘K so the shortcut opens without a dead first press (TB-560). */
export function useCommandPaletteChunkPreload(): void {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "k") {
        return;
      }

      if (isEditableTarget(event.target)) {
        return;
      }

      void preloadCommandPaletteChunk();
    }

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
