import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/help",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

const workspaceModeMocks = vi.hoisted(() => ({
  isWorkingMode: false,
}));

vi.mock("@/components/WorkspaceModeProvider", () => ({
  useWorkspaceMode: () => ({ isWorkingMode: workspaceModeMocks.isWorkingMode }),
}));

import { KeyboardShortcutsTabContent, matchesShortcutQuery } from "@/components/KeyboardShortcutsHelpContent";
import { SHELL_COMMAND_SHORTCUTS } from "@/lib/shortcut-registry";

describe("KeyboardShortcutsTabContent", () => {
  it("documents the command palette without a disclosure the reader has to open", () => {
    render(<KeyboardShortcutsTabContent />);

    const paletteTable = screen.getByRole("table", { name: "Command palette" });

    expect(paletteTable).toBeInTheDocument();
    expect(paletteTable).toHaveTextContent("Ctrl");
    expect(paletteTable).toHaveTextContent("K");
  });

  it("renders the palette section before the navigation shortcuts", () => {
    render(<KeyboardShortcutsTabContent />);

    const captions = screen.getAllByRole("table").map((table) => table.getAttribute("aria-label"));

    expect(captions[0]).toBe("Command palette");
    expect(captions).toContain("Common");
  });

  it("lists desk work before navigation when Working mode is active (PC-11)", () => {
    workspaceModeMocks.isWorkingMode = true;

    render(<KeyboardShortcutsTabContent />);

    const captions = screen.getAllByRole("table").map((table) => table.getAttribute("aria-label"));
    const deskWorkIndex = captions.indexOf("Desk work (Working)");
    const commonIndex = captions.indexOf("Common");

    expect(deskWorkIndex).toBeGreaterThan(-1);
    expect(commonIndex).toBeGreaterThan(-1);
    expect(deskWorkIndex).toBeLessThan(commonIndex);

    workspaceModeMocks.isWorkingMode = false;
  });

  it("matches the palette row from a plain-language query", () => {
    const palette = SHELL_COMMAND_SHORTCUTS[0];

    expect(matchesShortcutQuery("palette", palette.description, palette.key)).toBe(true);
    expect(matchesShortcutQuery("ctrl", palette.description, palette.key)).toBe(true);
  });
});
