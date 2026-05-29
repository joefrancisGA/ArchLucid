import { describe, expect, it } from "vitest";

import {
  COMMAND_PALETTE_ARIA_KEYSHORTCUTS,
  COMMAND_PALETTE_DISPLAY_SHORTCUT,
  commandPaletteOpenAriaLabel,
  commandPaletteTooltipLine,
} from "@/lib/keyboard-shortcut-display";

describe("keyboard-shortcut-display", () => {
  it("uses Ctrl text for visible palette shortcut labels", () => {
    expect(COMMAND_PALETTE_DISPLAY_SHORTCUT).toBe("Ctrl+K");
    expect(COMMAND_PALETTE_DISPLAY_SHORTCUT).not.toContain("⌘");
  });

  it("uses Control+K for aria-keyshortcuts", () => {
    expect(COMMAND_PALETTE_ARIA_KEYSHORTCUTS).toBe("Control+K");
  });

  it("builds tooltip lines with Ctrl+K only", () => {
    expect(commandPaletteTooltipLine("Search pages")).toBe("Search pages — Ctrl+K.");
    expect(commandPaletteTooltipLine("Search review packages")).not.toContain("⌘");
  });

  it("keeps aria labels free of embedded shortcut glyphs", () => {
    expect(commandPaletteOpenAriaLabel("Open command palette")).toBe("Open command palette");
    expect(commandPaletteOpenAriaLabel("Open command palette")).not.toMatch(/Ctrl|⌘/);
  });
});
