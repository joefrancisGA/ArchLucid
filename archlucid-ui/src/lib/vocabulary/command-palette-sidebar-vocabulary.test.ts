import { describe, expect, it } from "vitest";

import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";
import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";
import {
  COMMAND_PALETTE_FIND_A_PAGE_HREF,
  COMMAND_PALETTE_SIDEBAR_COMMAND_PALETTE_LINK,
  COMMAND_PALETTE_SIDEBAR_COMPACT_LINE,
  COMMAND_PALETTE_SIDEBAR_HEADING,
  COMMAND_PALETTE_SIDEBAR_SIDEBAR_LINK,
  COMMAND_PALETTE_SIDEBAR_WHY_TWO,
  SIDEBAR_NAVIGATION_PEER_PATH,
  buildCommandPaletteSidebarVocabulary,
  resolveCommandPaletteSidebarPeerLink,
} from "@/lib/vocabulary/command-palette-sidebar-vocabulary";

describe("command-palette-sidebar-vocabulary (TB-2316)", () => {
  it("explains Find a page vs Sidebar navigation", () => {
    const model = buildCommandPaletteSidebarVocabulary();

    expect(model.heading).toBe(COMMAND_PALETTE_SIDEBAR_HEADING);
    expect(model.whyTwo).toBe(COMMAND_PALETTE_SIDEBAR_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("typing");
    expect(model.whyTwo.toLowerCase()).toContain("sidebar");
    expect(model.compactLine).toBe(COMMAND_PALETTE_SIDEBAR_COMPACT_LINE);

    expect(model.commandPaletteLink).toEqual(COMMAND_PALETTE_SIDEBAR_COMMAND_PALETTE_LINK);
    expect(model.commandPaletteLink.label).toBe(GLOBAL_FIND_PAGE_SEARCH.ariaLabel);
    expect(model.commandPaletteLink.href).toBe(COMMAND_PALETTE_FIND_A_PAGE_HREF);
    expect(model.sidebarLink).toEqual(COMMAND_PALETTE_SIDEBAR_SIDEBAR_LINK);
    expect(model.sidebarLink.href).toBe(SIDEBAR_NAVIGATION_PEER_PATH);
    expect(model.sidebarLink.href).toBe(REVIEWS_LIST_PATH);
  });

  it("resolves the peer surface from command palette and sidebar", () => {
    expect(resolveCommandPaletteSidebarPeerLink("command-palette")).toEqual(
      COMMAND_PALETTE_SIDEBAR_SIDEBAR_LINK,
    );

    expect(resolveCommandPaletteSidebarPeerLink("sidebar")).toEqual(
      COMMAND_PALETTE_SIDEBAR_COMMAND_PALETTE_LINK,
    );
  });
});
