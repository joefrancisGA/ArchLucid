"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildPolicyPacksStandardsPairwiseRail,
  type PolicyPacksStandardsSurfaceId,
  type PolicyPacksStandardsVocabularyModel,
} from "@/lib/vocabulary/policy-packs-standards-vocabulary";

export type PolicyPacksStandardsVocabularyRailProps = {
  /** Surface hosting the strip — marks the current governance job and links to the peer. */
  readonly currentSurfaceId: PolicyPacksStandardsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildPolicyPacksStandardsVocabulary}. */
  readonly model?: PolicyPacksStandardsVocabularyModel;
};

/**
 * TB-2239 — Compact vocabulary rail between Policy packs and Standards and rules.
 * Mount on both hubs so operators do not conflate pack assignment with effective standards.
 */
export function PolicyPacksStandardsVocabularyRail(
  props: PolicyPacksStandardsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.policyPacksLink,
          peerLink: props.model.standardsLink,
        }
      : buildPolicyPacksStandardsPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="policy-packs-standards-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
