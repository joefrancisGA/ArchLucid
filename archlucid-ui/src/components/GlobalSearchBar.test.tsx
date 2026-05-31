import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GlobalSearchBar } from "@/components/GlobalSearchBar";
import {
  COMMAND_PALETTE_DISPLAY_SHORTCUT,
  COMMAND_PALETTE_HINT_ARIA_LABEL,
  GLOBAL_SEARCH_ARIA_LABEL,
} from "@/lib/keyboard-shortcut-display";
import { OPEN_COMMAND_PALETTE_EVENT } from "@/lib/shortcut-registry";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/lib/proxy-fetch-registration-scope", () => ({
  mergeRegistrationScopeForProxy: (opts: RequestInit) => opts,
}));

describe("GlobalSearchBar", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ runs: [], findings: [], policyPacks: [] }),
      }),
    );
  });

  it("uses one primary search affordance with an embedded Ctrl+K hint", () => {
    render(<GlobalSearchBar />);

    expect(screen.getByRole("combobox", { name: GLOBAL_SEARCH_ARIA_LABEL })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search reviews, findings, and evidence…")).toBeInTheDocument();
    expect(screen.getByText(COMMAND_PALETTE_DISPLAY_SHORTCUT)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open command palette" })).toBeNull();
  });

  it("opens the command palette when the in-input shortcut hint is clicked", () => {
    const listener = vi.fn();

    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, listener);

    render(<GlobalSearchBar />);
    fireEvent.click(screen.getByTestId("global-search-command-palette-hint"));

    expect(listener).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("global-search-command-palette-hint")).toHaveAttribute(
      "aria-label",
      COMMAND_PALETTE_HINT_ARIA_LABEL,
    );

    window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, listener);
  });
});
