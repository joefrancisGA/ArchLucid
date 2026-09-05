export const KEYBOARD_SHORTCUTS_SECTION_PARAM = "shortcutsSection";

export const KEYBOARD_SHORTCUTS_SECTION_IDS = [
  "more",
  "alerts",
  "findings",
  "review",
  "help",
] as const;

export type KeyboardShortcutsSectionId = (typeof KEYBOARD_SHORTCUTS_SECTION_IDS)[number];

export function parseKeyboardShortcutsSectionFromSearch(
  raw: string | null | undefined,
): KeyboardShortcutsSectionId | null {
  if (raw === null || raw === undefined) {
    return null;
  }

  const trimmed = raw.trim().toLowerCase();

  if (trimmed.length === 0) {
    return null;
  }

  return KEYBOARD_SHORTCUTS_SECTION_IDS.find((id) => id === trimmed) ?? null;
}

export function keyboardShortcutsSectionHrefFromSearch(
  currentSearch: string,
  sectionId: KeyboardShortcutsSectionId | null,
  pathname: string,
): string {
  const params = new URLSearchParams(currentSearch);

  if (sectionId === null) {
    params.delete(KEYBOARD_SHORTCUTS_SECTION_PARAM);
  } else {
    params.set(KEYBOARD_SHORTCUTS_SECTION_PARAM, sectionId);
  }

  const nextQuery = params.toString();

  return nextQuery.length === 0 ? pathname : `${pathname}?${nextQuery}`;
}
