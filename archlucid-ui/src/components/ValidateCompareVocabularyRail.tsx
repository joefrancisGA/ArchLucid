"use client";

import type { JSX } from "react";

import {
  buildValidateCompareVocabulary,
  resolveValidateComparePeerLink,
  type ValidateCompareSurfaceId,
  type ValidateCompareVocabularyModel,
} from "@/lib/vocabulary/validate-compare-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ValidateCompareVocabularyRailProps = {
  /** Surface hosting the strip — marks the current review job and links to the peer. */
  readonly currentSurfaceId: ValidateCompareSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildValidateCompareVocabulary}. */
  readonly model?: ValidateCompareVocabularyModel;
};

/**
 * TB-2240 — Compact vocabulary rail between Validate review and Compare two reviews.
 * Mount on both hubs so operators do not conflate single-package validation with pairwise diff.
 */
export function ValidateCompareVocabularyRail(
  props: ValidateCompareVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildValidateCompareVocabulary();
  const peer = resolveValidateComparePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "validate-replay" ? model.validateLink : model.compareLink;

  return (
    <VocabularyRail
      testIdPrefix="validate-compare-vocabulary"
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
