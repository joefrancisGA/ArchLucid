"use client";

import type { JSX } from "react";

import {
  buildPolicyPacksStandardsVocabulary,
  resolvePolicyPacksStandardsPeerLink,
  type PolicyPacksStandardsSurfaceId,
  type PolicyPacksStandardsVocabularyModel,
} from "@/lib/vocabulary/policy-packs-standards-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildPolicyPacksStandardsVocabulary();
  const peer = resolvePolicyPacksStandardsPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "policy-packs" ? model.policyPacksLink : model.standardsLink;

  return (
    <VocabularyRail
      testIdPrefix="policy-packs-standards-vocabulary"
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
