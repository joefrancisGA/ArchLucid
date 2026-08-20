"use client";

import type { JSX } from "react";

import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";
import type { VocabularyRailCompactLinkPlacement } from "@/components/vocabulary/vocabulary-rail-types";
import {
  resolvePairwiseVocabularyPeerLink,
  type PairwiseVocabularyRailModel,
} from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type PairwiseVocabularyRailFromModelProps<TSurfaceId extends string> = {
  readonly testIdPrefix: string;
  readonly currentSurfaceId: TSurfaceId;
  readonly model: PairwiseVocabularyRailModel<TSurfaceId>;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly compactLinkPlacement?: VocabularyRailCompactLinkPlacement;
};

function resolveCurrentPairwiseLink<TSurfaceId extends string>(
  currentSurfaceId: TSurfaceId,
  model: PairwiseVocabularyRailModel<TSurfaceId>,
) {
  if (currentSurfaceId === model.currentLink.id) {
    return model.currentLink;
  }

  if (currentSurfaceId === model.peerLink.id) {
    return model.peerLink;
  }

  return model.currentLink;
}

/** TB-2365 — generic VocabularyRail wrapper using resolvePairwiseVocabularyPeerLink. */
export function PairwiseVocabularyRailFromModel<TSurfaceId extends string>(
  props: PairwiseVocabularyRailFromModelProps<TSurfaceId>,
): JSX.Element {
  const currentLink = resolveCurrentPairwiseLink(props.currentSurfaceId, props.model);
  const peerLink = resolvePairwiseVocabularyPeerLink(props.currentSurfaceId, props.model);

  return (
    <VocabularyRail
      testIdPrefix={props.testIdPrefix}
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={props.model.compactLine}
      compactLinkPlacement={props.compactLinkPlacement}
      heading={props.model.heading}
      whyTwo={props.model.whyTwo}
      currentLabel={currentLink.label}
      links={[
        {
          href: peerLink.href,
          label: peerLink.label,
          testIdSuffix: "peer-link",
        },
      ]}
    />
  );
}
