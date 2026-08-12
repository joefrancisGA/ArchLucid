/**
 * Operator-shell shortcut labels shown in UI chrome.
 *
 * **Display** always uses Windows-style `Ctrl` text — we do not render the ⌘ symbol.
 * **Behavior** for the command palette still accepts `metaKey` on macOS (see `CommandPalette.tsx`).
 */

import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";

/** Visible chip / tooltip text for the command palette trigger. */
export const COMMAND_PALETTE_DISPLAY_SHORTCUT = "Ctrl+K";

/** Accessible name for the operator shell help trigger (top bar). */
export const OPERATOR_HELP_ARIA_LABEL = "Help (F1)";

/** Tooltip for the operator shell help trigger. */
export const OPERATOR_HELP_TOOLTIP = "Help (F1)";

/** WAI-ARIA `aria-keyshortcuts` for help — F1 and Shift+/. */
export const OPERATOR_HELP_ARIA_KEYSHORTCUTS = "F1 Shift+?";

/** Accessible name for the global find-a-page input in the operator header (TB-2196). */
export const GLOBAL_SEARCH_ARIA_LABEL = GLOBAL_FIND_PAGE_SEARCH.ariaLabel;

/** Placeholder for the operator header global find-a-page input (TB-2196). */
export const GLOBAL_SEARCH_PLACEHOLDER = GLOBAL_FIND_PAGE_SEARCH.placeholder;

/**
 * WAI-ARIA `aria-keyshortcuts` for the command palette — both Control and Meta so macOS Cmd+K is exposed.
 * @see https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts
 */
export const COMMAND_PALETTE_ARIA_KEYSHORTCUTS = "Control+K Meta+K";

/**
 * True on Apple platforms, where the palette's primary modifier is Cmd.
 *
 * Also decides whether Ctrl+K may open the palette from inside a text field: on macOS, Ctrl+K is the
 * field-level "kill to end of line" binding, so {@link CommandPalette} leaves it to the field there.
 */
export function isApplePlatformShortcutModifier(): boolean {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad|iPod/.test(navigator.userAgent);
}

/** Visible shortcut label for tooltips — Cmd+K on Apple platforms, Ctrl+K elsewhere. */
export function resolveCommandPaletteDisplayShortcut(): string {
  if (isApplePlatformShortcutModifier()) {
    return "Cmd+K";
  }

  return COMMAND_PALETTE_DISPLAY_SHORTCUT;
}

/** Native tooltip for the header global search input (helper + palette shortcut). */
export function globalSearchInputTitle(): string {
  return `${GLOBAL_FIND_PAGE_SEARCH.helper} — ${resolveCommandPaletteDisplayShortcut()}`;
}

/** Tooltip line suffix for palette triggers. */
export function commandPaletteTooltipLine(primaryLabel: string): string {
  return `${primaryLabel} — ${COMMAND_PALETTE_DISPLAY_SHORTCUT}.`;
}

/** Accessible name for the palette button — omits the combo so OS tooltips do not substitute ⌘. */
export function commandPaletteOpenAriaLabel(fallback: string): string {
  return fallback;
}