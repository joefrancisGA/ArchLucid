"use client";

import type { JSX, MouseEvent } from "react";

import { FOCUS_GLOBAL_SEARCH_EVENT } from "@/components/GlobalSearchBar";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";
import {
  buildCommandPaletteSidebarVocabulary,
  COMMAND_PALETTE_FIND_A_PAGE_HREF,
  resolveCommandPaletteSidebarPeerLink,
  type CommandPaletteSidebarSurfaceId,
  type CommandPaletteSidebarVocabularyModel,
} from "@/lib/vocabulary/command-palette-sidebar-vocabulary";

export type CommandPaletteSidebarVocabularyRailProps = {
  readonly currentSurfaceId: CommandPaletteSidebarSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: CommandPaletteSidebarVocabularyModel;
};

function focusFindAPageControl(event: MouseEvent<HTMLAnchorElement>): void {
  // Hash alone lands on a non-focusable wrapper; focus the Go to… input instead.
  event.preventDefault();
  window.dispatchEvent(new Event(FOCUS_GLOBAL_SEARCH_EVENT));
}

/** TB-2316 — Find a page (command palette) vs Sidebar navigation. */
export function CommandPaletteSidebarVocabularyRail(
  props: CommandPaletteSidebarVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildCommandPaletteSidebarVocabulary();
  const peer = resolveCommandPaletteSidebarPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "command-palette"
      ? model.commandPaletteLink
      : model.sidebarLink;
  const peerOnClick =
    peer.href === COMMAND_PALETTE_FIND_A_PAGE_HREF ? focusFindAPageControl : undefined;

  return (
    <VocabularyRail
      testIdPrefix="command-palette-sidebar-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link", onClick: peerOnClick }]}
    />
  );
}
