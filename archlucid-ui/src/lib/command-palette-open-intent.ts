import { preloadCommandPaletteChunk } from "@/components/CommandPaletteLazy";
import {
  dispatchOpenCommandPalette,
  type OpenCommandPaletteEventDetail,
} from "@/lib/shortcut-registry";

let pendingOpenIntent: OpenCommandPaletteEventDetail | null = null;

/** Queue palette open before the deferred chunk mounts (LD-08). */
export function requestCommandPaletteOpen(initialQuery?: string): void {
  const trimmed = initialQuery?.trim() ?? "";
  const detail: OpenCommandPaletteEventDetail =
    trimmed.length > 0 ? { initialQuery: trimmed } : {};

  pendingOpenIntent = detail;
  dispatchOpenCommandPalette(trimmed.length > 0 ? trimmed : undefined);
  void preloadCommandPaletteChunk();
}

/** Apply a queued open when {@link CommandPalette} hydrates after the first Ctrl+K. */
export function consumePendingCommandPaletteOpen(): OpenCommandPaletteEventDetail | null {
  const intent = pendingOpenIntent;
  pendingOpenIntent = null;

  return intent;
}

/** Test-only reset for Vitest. */
export function resetPendingCommandPaletteOpenForTests(): void {
  pendingOpenIntent = null;
}
