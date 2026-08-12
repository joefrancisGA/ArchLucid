import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPalette, palettePressUsesPaletteModifier } from "@/components/CommandPalette";
import {
  COMMAND_PALETTE_ARIA_KEYSHORTCUTS,
  COMMAND_PALETTE_DISPLAY_SHORTCUT,
} from "@/lib/keyboard-shortcut-display";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => null,
}));

vi.mock("@/hooks/useNavProgressiveDisclosure", () => ({
  useNavProgressiveDisclosure: () => ({ showExtended: true, showAdvanced: true }),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async () => {
  const { createOperatorNavAuthorityVitestMock } = await import(
    "@/testing/operator-nav-authority-vitest-mock"
  );

  return createOperatorNavAuthorityVitestMock({
    callerAuthorityRank: 3,
    hasCommittedArchitectureReview: false,
  });
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/lib/operator/operator-static-demo", () => ({
  isStaticDemoPayloadFallbackEnabled: () => false,
}));

describe("CommandPalette", () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    } as unknown as typeof ResizeObserver;
  });

  beforeEach(() => {
    mockPush.mockClear();
  });

  it("shows Ctrl+K on the trigger and never the macOS command symbol", () => {
    render(<CommandPalette showTrigger />);

    expect(screen.getByText(COMMAND_PALETTE_DISPLAY_SHORTCUT)).toBeInTheDocument();
    expect(screen.queryByText(/⌘/)).toBeNull();
  });

  it("exposes Control+K via aria-keyshortcuts without embedding the combo in aria-label", () => {
    render(<CommandPalette showTrigger />);

    const trigger = screen.getByRole("button", { name: "Open command palette" });

    expect(trigger).toHaveAttribute("aria-keyshortcuts", COMMAND_PALETTE_ARIA_KEYSHORTCUTS);
    expect(trigger.getAttribute("aria-label")).not.toMatch(/Ctrl|⌘/);
  });

  it("opens the dialog when the trigger is clicked", () => {
    render(<CommandPalette showTrigger />);

    fireEvent.click(screen.getByRole("button", { name: "Open command palette" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("does not render a visible trigger by default", () => {
    render(<CommandPalette />);

    expect(screen.queryByRole("button", { name: "Open command palette" })).toBeNull();
  });

  it("toggles the dialog on Ctrl+K", () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: "k", ctrlKey: true, bubbles: true });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("toggles the dialog on metaKey+K for macOS parity", () => {
    render(<CommandPalette />);

    fireEvent.keyDown(window, { key: "k", metaKey: true, bubbles: true });

    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("opens while a text field has focus, so the header search box is not a dead end", () => {
    render(<CommandPalette />);

    const searchBox = document.createElement("input");
    document.body.append(searchBox);
    searchBox.focus();

    fireEvent.keyDown(searchBox, { key: "k", ctrlKey: true, bubbles: true });

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    searchBox.remove();
  });
});

describe("palettePressUsesPaletteModifier", () => {
  function withUserAgent(userAgent: string, assert: () => void): void {
    const original = Object.getOwnPropertyDescriptor(navigator, "userAgent");
    Object.defineProperty(navigator, "userAgent", { value: userAgent, configurable: true });

    try {
      assert();
    } finally {
      if (original !== undefined) {
        Object.defineProperty(navigator, "userAgent", original);
      }
    }
  }

  it("ignores an unmodified K so typing never opens the palette", () => {
    expect(palettePressUsesPaletteModifier({ ctrlKey: false, metaKey: false }, null)).toBe(false);
  });

  it("accepts either modifier outside a text field", () => {
    expect(palettePressUsesPaletteModifier({ ctrlKey: true, metaKey: false }, null)).toBe(true);
    expect(palettePressUsesPaletteModifier({ ctrlKey: false, metaKey: true }, null)).toBe(true);
  });

  it("accepts Ctrl+K inside a text field on non-Apple platforms", () => {
    withUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64)", () => {
      expect(palettePressUsesPaletteModifier({ ctrlKey: true, metaKey: false }, document.createElement("input"))).toBe(
        true,
      );
    });
  });

  it("leaves Ctrl+K to the field on Apple platforms, where it is kill-to-end-of-line", () => {
    withUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)", () => {
      const field = document.createElement("textarea");

      expect(palettePressUsesPaletteModifier({ ctrlKey: true, metaKey: false }, field)).toBe(false);
      expect(palettePressUsesPaletteModifier({ ctrlKey: false, metaKey: true }, field)).toBe(true);
    });
  });
});
