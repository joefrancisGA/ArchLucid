import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CommandPaletteTopBarTrigger } from "@/components/CommandPaletteTopBarTrigger";
import { COMMAND_PALETTE_ARIA_KEYSHORTCUTS } from "@/lib/keyboard-shortcut-display";
import { dispatchOpenCommandPalette } from "@/lib/shortcut-registry";

vi.mock("@/lib/shortcut-registry", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/shortcut-registry")>();

  return {
    ...actual,
    dispatchOpenCommandPalette: vi.fn(),
  };
});

describe("CommandPaletteTopBarTrigger", () => {
  it("renders a visible Ctrl+K command trigger", () => {
    render(<CommandPaletteTopBarTrigger />);

    const trigger = screen.getByTestId("operator-shell-command-palette-trigger");

    expect(trigger).toHaveAttribute("aria-label", "Open command palette");
    expect(trigger).toHaveAttribute("aria-keyshortcuts", COMMAND_PALETTE_ARIA_KEYSHORTCUTS);
    expect(trigger).toHaveTextContent("Command");
  });

  it("opens the command palette on click", () => {
    render(<CommandPaletteTopBarTrigger />);

    fireEvent.click(screen.getByTestId("operator-shell-command-palette-trigger"));

    expect(dispatchOpenCommandPalette).toHaveBeenCalledTimes(1);
  });
});
