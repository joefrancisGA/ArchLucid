"use client";

import type { JSX } from "react";

import {
  buildCommandPaletteSidebarVocabulary,
  resolveCommandPaletteSidebarPeerLink,
  type CommandPaletteSidebarSurfaceId,
  type CommandPaletteSidebarVocabularyModel,
} from "@/lib/vocabulary/command-palette-sidebar-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type CommandPaletteSidebarVocabularyRailProps = {
  readonly currentSurfaceId: CommandPaletteSidebarSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: CommandPaletteSidebarVocabularyModel;
};

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
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
