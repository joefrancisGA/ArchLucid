/**
 * Operator-shell shortcut labels shown in UI chrome.
 *
 * **Display** always uses Windows-style `Ctrl` text — we do not render the ⌘ symbol.
 * **Behavior** for the command palette still accepts `metaKey` on macOS (see `CommandPalette.tsx`).
 */

/** Visible chip / tooltip text for the command palette trigger. */
export const COMMAND_PALETTE_DISPLAY_SHORTCUT = "Ctrl+K";

/**
 * WAI-ARIA `aria-keyshortcuts` value for the palette (Control+K), separate from visible copy.
 * @see https://www.w3.org/TR/wai-aria-1.2/#aria-keyshortcuts
 */
export const COMMAND_PALETTE_ARIA_KEYSHORTCUTS = "Control+K";

/** Tooltip line suffix for palette triggers. */
export function commandPaletteTooltipLine(primaryLabel: string): string {
  return `${primaryLabel} — ${COMMAND_PALETTE_DISPLAY_SHORTCUT}.`;
}

/** Accessible name for the palette button — omits the combo so OS tooltips do not substitute ⌘. */
export function commandPaletteOpenAriaLabel(fallback: string): string {
  return fallback;
}
