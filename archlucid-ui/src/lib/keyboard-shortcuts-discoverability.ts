/**
 * TB-2268 — Keyboard shortcuts discoverability (first-open coach).
 *
 * Teaches operators that F1 and Shift+? open Help (including the Shortcuts tab)
 * from anywhere in the operator shell. Dismiss persists in localStorage so the
 * coach does not reappear on later sessions.
 */

export const KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_KEY =
  "archlucid_keyboard_shortcuts_discoverability_dismissed_v1" as const;

export type KeyboardShortcutsDiscoverabilityHintId = "help" | "palette" | "where";

export type KeyboardShortcutsDiscoverabilityHint = {
  readonly id: KeyboardShortcutsDiscoverabilityHintId;
  readonly label: string;
  readonly body: string;
};

export type KeyboardShortcutsDiscoverabilityModel = {
  readonly heading: string;
  readonly lead: string;
  readonly hints: readonly KeyboardShortcutsDiscoverabilityHint[];
  readonly dismissLabel: string;
};

export const KEYBOARD_SHORTCUTS_DISCOVERABILITY_HEADING =
  "Keyboard shortcuts are one keystroke away" as const;

export const KEYBOARD_SHORTCUTS_DISCOVERABILITY_LEAD =
  "Press F1 or Shift+? anytime to open Help. Use the Shortcuts tab to see navigation and page actions without leaving your current view." as const;

export const KEYBOARD_SHORTCUTS_DISCOVERABILITY_HINTS: readonly KeyboardShortcutsDiscoverabilityHint[] =
  [
    {
      id: "help",
      label: "Help",
      body: "F1 or Shift+? opens Help from anywhere in the workspace — same entry as the Help button in the top bar.",
    },
    {
      id: "palette",
      label: "Command palette",
      body: "Ctrl+K (Cmd+K on Mac) opens the command palette for jump-to navigation.",
    },
    {
      id: "where",
      label: "Where to look",
      body: "Inside Help, open the Shortcuts tab for the full list of Alt navigation and page-scoped actions.",
    },
  ] as const;

export const KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_LABEL = "Dismiss" as const;

/** Full first-open coach model (heading, lead, help/palette/where hints). */
export function buildKeyboardShortcutsDiscoverability(): KeyboardShortcutsDiscoverabilityModel {
  return {
    heading: KEYBOARD_SHORTCUTS_DISCOVERABILITY_HEADING,
    lead: KEYBOARD_SHORTCUTS_DISCOVERABILITY_LEAD,
    hints: KEYBOARD_SHORTCUTS_DISCOVERABILITY_HINTS,
    dismissLabel: KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_LABEL,
  };
}

/** True when the operator has already dismissed the first-open coach. */
export function isKeyboardShortcutsDiscoverabilityDismissed(): boolean {
  if (typeof window === "undefined") {
    return true;
  }

  try {
    return (
      window.localStorage.getItem(KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_KEY) === "1"
    );
  } catch {
    return true;
  }
}

/** Persist dismiss so the coach does not reappear on later visits. */
export function dismissKeyboardShortcutsDiscoverability(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(KEYBOARD_SHORTCUTS_DISCOVERABILITY_DISMISS_KEY, "1");
  } catch {
    /* private mode */
  }
}
