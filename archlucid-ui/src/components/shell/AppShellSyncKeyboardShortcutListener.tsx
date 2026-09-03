"use client";

import { useShortcutNavigation } from "@/hooks/useShortcutNavigation";

/** Thin sync shortcut listener — navigation chords without the deferred help-dialog bundle (PT-09). */
export function AppShellSyncKeyboardShortcutListener(props: {
  readonly onHelpRequested?: () => void;
}): null {
  useShortcutNavigation({ onHelpRequested: props.onHelpRequested });

  return null;
}
