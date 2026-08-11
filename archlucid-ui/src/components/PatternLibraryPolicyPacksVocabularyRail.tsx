"use client";

import type { JSX } from "react";

import {
  buildPatternLibraryPolicyPacksVocabulary,
  resolvePatternLibraryPolicyPacksPeerLink,
  type PatternLibraryPolicyPacksSurfaceId,
  type PatternLibraryPolicyPacksVocabularyModel,
} from "@/lib/vocabulary/pattern-library-policy-packs-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type PatternLibraryPolicyPacksVocabularyRailProps = {
  readonly currentSurfaceId: PatternLibraryPolicyPacksSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PatternLibraryPolicyPacksVocabularyModel;
};

/** TB-2292 — Pattern library catalog vs enforceable Policy packs. */
export function PatternLibraryPolicyPacksVocabularyRail(
  props: PatternLibraryPolicyPacksVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildPatternLibraryPolicyPacksVocabulary();
  const peer = resolvePatternLibraryPolicyPacksPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "pattern-library"
      ? model.patternLibraryLink
      : model.policyPacksLink;

  return (
    <VocabularyRail
      testIdPrefix="pattern-library-policy-packs-vocabulary"
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
