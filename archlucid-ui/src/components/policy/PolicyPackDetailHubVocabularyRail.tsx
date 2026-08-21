"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildPolicyPackDetailHubPairwiseRail,
  buildPolicyPackDetailHubVocabulary,
  resolvePolicyPackDetailHubPeerLink,
  type PolicyPackDetailHubSurfaceId,
  type PolicyPackDetailHubVocabularyModel,
} from "@/lib/vocabulary/policy-pack-detail-hub-vocabulary";

export type PolicyPackDetailHubVocabularyRailProps = {
  /** Surface hosting the strip — marks packs hub vs pack detail and links to the peer. */
  readonly currentSurfaceId: PolicyPackDetailHubSurfaceId;
  /** When on the packs hub, deep-links pack detail peer to this pack when set. */
  readonly policyPackId?: string;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildPolicyPackDetailHubVocabulary}. */
  readonly model?: PolicyPackDetailHubVocabularyModel;
};

/**
 * TB-2283 — Compact vocabulary rail between Policy packs hub and Pack detail.
 * Mount on both surfaces so operators do not conflate the library with one pack.
 * Distinct from Policy packs ≠ Standards (TB-2239).
 */
export function PolicyPackDetailHubVocabularyRail(
  props: PolicyPackDetailHubVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.packsHubLink,
          peerLink: props.model.packDetailLink,
        }
      : buildPolicyPackDetailHubPairwiseRail();
  const peerLinkOverride = resolvePolicyPackDetailHubPeerLink(
    props.currentSurfaceId,
    props.policyPackId,
  );

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="policy-pack-detail-hub-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
      peerLinkOverride={peerLinkOverride}
    />
  );
}
