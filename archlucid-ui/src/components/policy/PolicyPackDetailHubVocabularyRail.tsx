"use client";

import type { JSX } from "react";

import {
  buildPolicyPackDetailHubVocabulary,
  resolvePolicyPackDetailHubPeerLink,
  type PolicyPackDetailHubSurfaceId,
  type PolicyPackDetailHubVocabularyModel,
} from "@/lib/vocabulary/policy-pack-detail-hub-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildPolicyPackDetailHubVocabulary();
  const peer = resolvePolicyPackDetailHubPeerLink(props.currentSurfaceId, props.policyPackId);
  const currentLink =
    props.currentSurfaceId === "policy-packs" ? model.packsHubLink : model.packDetailLink;

  return (
    <VocabularyRail
      testIdPrefix="policy-pack-detail-hub-vocabulary"
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
