"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildGlossaryProceduralHelpPairwiseRail,
  type GlossaryProceduralHelpSurfaceId,
  type GlossaryProceduralHelpVocabularyModel,
} from "@/lib/vocabulary/glossary-procedural-help-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.glossaryLink,
          peerLink: props.model.helpHubLink,
        }
      : buildGlossaryProceduralHelpPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="glossary-procedural-help-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
