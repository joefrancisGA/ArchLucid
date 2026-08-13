/**
 * TB-2316 — Find a page (command palette) ≠ Sidebar navigation vocabulary rail.
 *
 * Why two surfaces exist:
 * - Find a page (Ctrl+K / header find-a-page) jumps to a page, review, finding,
 *   policy pack, or help topic by typing — not browsing the left nav tree.
 * - Sidebar navigation is the persistent left-nav chrome for browsing grouped
 *   routes in the operator shell.
 *
 * They stay separate because keyboard find-a-page is not the same task as
 * browsing the sidebar. Distinct from search-surface-disambiguation (Find a
 * page ≠ Search review evidence) and Ask ≠ Search evidence vocabulary.
 */

import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { GLOBAL_FIND_PAGE_SEARCH } from "@/lib/search-surface-disambiguation";

/**
 * Command palette / header find-a-page has no dedicated route.
 * Hash targets {@link GlobalSearchBar} `id` for same-page focus/scroll.
 */
export const COMMAND_PALETTE_FIND_A_PAGE_HREF = "#find-a-page" as const;

/** Stable sidebar-related destination when linking from the Find a page surface. */
export const SIDEBAR_NAVIGATION_PEER_PATH = REVIEWS_LIST_PATH;

export type CommandPaletteSidebarSurfaceId = "command-palette" | "sidebar";

export type CommandPaletteSidebarLink = {
  readonly id: CommandPaletteSidebarSurfaceId;
  readonly label: string;
  readonly href: string;
  readonly whenToUse: string;
};

export type CommandPaletteSidebarVocabularyModel = {
  readonly heading: string;
  readonly whyTwo: string;
  readonly compactLine: string;
  readonly commandPaletteLink: CommandPaletteSidebarLink;
  readonly sidebarLink: CommandPaletteSidebarLink;
};

export const COMMAND_PALETTE_SIDEBAR_HEADING =
  "Find a page and Sidebar navigation serve different purposes" as const;

export const COMMAND_PALETTE_SIDEBAR_WHY_TWO =
  "Find a page jumps to a page, review, finding, policy pack, or help topic by typing (Ctrl+K). Sidebar navigation browses grouped routes in the left nav. Typing to jump is not the same task as browsing the sidebar tree." as const;

export const COMMAND_PALETTE_SIDEBAR_COMPACT_LINE =
  "Find a page jumps by typing; Sidebar browses the left nav." as const;

export const COMMAND_PALETTE_SIDEBAR_COMMAND_PALETTE_LINK: CommandPaletteSidebarLink = {
  id: "command-palette",
  label: GLOBAL_FIND_PAGE_SEARCH.ariaLabel,
  href: COMMAND_PALETTE_FIND_A_PAGE_HREF,
  whenToUse: "Type to jump to a page, review, finding, policy pack, or help topic.",
};

export const COMMAND_PALETTE_SIDEBAR_SIDEBAR_LINK: CommandPaletteSidebarLink = {
  id: "sidebar",
  label: "Sidebar navigation",
  href: SIDEBAR_NAVIGATION_PEER_PATH,
  whenToUse: "Browse grouped operator routes in the persistent left navigation.",
};

/** Full vocabulary model (heading, why-two copy, and deep links). */
export function buildCommandPaletteSidebarVocabulary(): CommandPaletteSidebarVocabularyModel {
  return {
    heading: COMMAND_PALETTE_SIDEBAR_HEADING,
    whyTwo: COMMAND_PALETTE_SIDEBAR_WHY_TWO,
    compactLine: COMMAND_PALETTE_SIDEBAR_COMPACT_LINE,
    commandPaletteLink: COMMAND_PALETTE_SIDEBAR_COMMAND_PALETTE_LINK,
    sidebarLink: COMMAND_PALETTE_SIDEBAR_SIDEBAR_LINK,
  };
}

/** Peer deep-link for the surface you are not currently on. */
export function resolveCommandPaletteSidebarPeerLink(
  currentSurfaceId: CommandPaletteSidebarSurfaceId,
): CommandPaletteSidebarLink {
  if (currentSurfaceId === "command-palette") {
    return COMMAND_PALETTE_SIDEBAR_SIDEBAR_LINK;
  }

  return COMMAND_PALETTE_SIDEBAR_COMMAND_PALETTE_LINK;
}
