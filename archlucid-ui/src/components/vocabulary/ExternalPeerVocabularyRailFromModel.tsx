"use client";

import type { JSX } from "react";

import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";
import type { VocabularyRailCompactLinkPlacement } from "@/components/vocabulary/vocabulary-rail-types";
import {
  resolveExternalPeerPairwisePeerLink,
  type ExternalPeerPairwiseVocabularyRailModel,
} from "@/lib/vocabulary/create-pairwise-vocabulary-rail";

export type ExternalPeerVocabularyRailFromModelProps<TSurfaceId extends string> = {
  readonly testIdPrefix: string;
  readonly reviewSurfaceId: TSurfaceId;
  readonly currentSurfaceId: TSurfaceId;
  readonly model: ExternalPeerPairwiseVocabularyRailModel<TSurfaceId>;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly compactLinkPlacement?: VocabularyRailCompactLinkPlacement;
};

/** TB-2365 — VocabularyRail wrapper for review-side + external-route pairwise models. */
export function ExternalPeerVocabularyRailFromModel<TSurfaceId extends string>(
  props: ExternalPeerVocabularyRailFromModelProps<TSurfaceId>,
): JSX.Element {
  const peerLink = resolveExternalPeerPairwisePeerLink(
    props.currentSurfaceId,
    props.reviewSurfaceId,
    props.model,
  );
  const currentLink =
    props.currentSurfaceId === props.reviewSurfaceId
      ? props.model.reviewSideLink
      : props.model.externalPeerLink;

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
      links={[{ ...peerLink, testIdSuffix: "peer-link" }]}
    />
  );
}
