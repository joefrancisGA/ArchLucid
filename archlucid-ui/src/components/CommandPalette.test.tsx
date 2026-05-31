import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "@/components/CommandPalette";
import { COMMAND_PALETTE_DISPLAY_SHORTCUT } from "@/lib/keyboard-shortcut-display";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => "/",
}));

vi.mock("@/hooks/useNavProgressiveDisclosure", () => ({
  useNavProgressiveDisclosure: () => ({ showExtended: true, showAdvanced: true }),
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: () => 3,
  useNavCommittedArchitectureReview: () => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/lib/operator-static-demo", () => ({
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

    expect(trigger).toHaveAttribute("aria-keyshortcuts", "Control+K");
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
});
