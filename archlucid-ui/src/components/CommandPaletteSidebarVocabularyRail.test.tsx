import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CommandPaletteSidebarVocabularyRail } from "@/components/CommandPaletteSidebarVocabularyRail";
import { FOCUS_GLOBAL_SEARCH_EVENT } from "@/components/GlobalSearchBar";
import {
  COMMAND_PALETTE_SIDEBAR_COMMAND_PALETTE_LINK,
  COMMAND_PALETTE_SIDEBAR_COMPACT_LINE,
  COMMAND_PALETTE_SIDEBAR_HEADING,
  COMMAND_PALETTE_SIDEBAR_SIDEBAR_LINK,
  COMMAND_PALETTE_SIDEBAR_WHY_TWO,
} from "@/lib/vocabulary/command-palette-sidebar-vocabulary";

describe("CommandPaletteSidebarVocabularyRail (TB-2316)", () => {
  it("renders command-palette strip with peer link to sidebar", () => {
    render(<CommandPaletteSidebarVocabularyRail currentSurfaceId="command-palette" />);

    const strip = screen.getByTestId("command-palette-sidebar-vocabulary");
    expect(strip).toHaveAttribute("data-current-surface", "command-palette");
    expect(strip.textContent ?? "").toContain(COMMAND_PALETTE_SIDEBAR_COMPACT_LINE);

    const peer = screen.getByTestId("command-palette-sidebar-vocabulary-peer-link");
    expect(peer).toHaveTextContent(COMMAND_PALETTE_SIDEBAR_SIDEBAR_LINK.label);
    expect(peer).toHaveAttribute("href", COMMAND_PALETTE_SIDEBAR_SIDEBAR_LINK.href);
  });

  it("renders sidebar strip with peer link to Find a page", () => {
    render(<CommandPaletteSidebarVocabularyRail currentSurfaceId="sidebar" />);

    const peer = screen.getByTestId("command-palette-sidebar-vocabulary-peer-link");
    expect(peer).toHaveTextContent(COMMAND_PALETTE_SIDEBAR_COMMAND_PALETTE_LINK.label);
    expect(peer).toHaveAttribute("href", COMMAND_PALETTE_SIDEBAR_COMMAND_PALETTE_LINK.href);
  });

  it("focuses header search when the Find a page peer link is clicked", () => {
    const listener = vi.fn();
    window.addEventListener(FOCUS_GLOBAL_SEARCH_EVENT, listener);

    try {
      render(<CommandPaletteSidebarVocabularyRail currentSurfaceId="sidebar" />);
      fireEvent.click(screen.getByTestId("command-palette-sidebar-vocabulary-peer-link"));
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener(FOCUS_GLOBAL_SEARCH_EVENT, listener);
    }
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <CommandPaletteSidebarVocabularyRail
        currentSurfaceId="command-palette"
        variant="full"
      />,
    );

    expect(screen.getByText(COMMAND_PALETTE_SIDEBAR_HEADING)).toBeInTheDocument();
    expect(screen.getByText(COMMAND_PALETTE_SIDEBAR_WHY_TWO)).toBeInTheDocument();
  });
});
