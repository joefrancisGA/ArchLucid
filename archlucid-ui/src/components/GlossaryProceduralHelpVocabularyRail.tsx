"use client";

import type { JSX } from "react";

import {
  buildGlossaryProceduralHelpVocabulary,
  resolveGlossaryProceduralHelpPeerLink,
  type GlossaryProceduralHelpSurfaceId,
  type GlossaryProceduralHelpVocabularyModel,
} from "@/lib/vocabulary/glossary-procedural-help-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type GlossaryProceduralHelpVocabularyRailProps = {
  readonly currentSurfaceId: GlossaryProceduralHelpSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: GlossaryProceduralHelpVocabularyModel;
};

/** TB-2308 — Glossary term definitions vs procedural Help hub. */
export function GlossaryProceduralHelpVocabularyRail(
  props: GlossaryProceduralHelpVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildGlossaryProceduralHelpVocabulary();
  const peer = resolveGlossaryProceduralHelpPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "glossary" ? model.glossaryLink : model.helpHubLink;

  return (
    <VocabularyRail
      testIdPrefix="glossary-procedural-help-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
