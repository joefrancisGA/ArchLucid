"use client";

import type { JSX } from "react";

import {
  buildReplayCostPreExecuteCostVocabulary,
  resolveReplayCostPreExecuteCostPeerLink,
  type ReplayCostPreExecuteCostSurfaceId,
  type ReplayCostPreExecuteCostVocabularyModel,
} from "@/lib/vocabulary/replay-cost-pre-execute-cost-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ReplayCostPreExecuteCostVocabularyRailProps = {
  /** Surface hosting the strip — marks the current cost job and links to the peer. */
  readonly currentSurfaceId: ReplayCostPreExecuteCostSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildReplayCostPreExecuteCostVocabulary}. */
  readonly model?: ReplayCostPreExecuteCostVocabularyModel;
};

/**
 * TB-2284 — Compact vocabulary rail between comparison replay cost and pre-execute cost.
 * Mount on both surfaces so operators do not conflate the two estimate jobs.
 * Distinct from TB-2233 pre-execute teaching itself.
 */
export function ReplayCostPreExecuteCostVocabularyRail(
  props: ReplayCostPreExecuteCostVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildReplayCostPreExecuteCostVocabulary();
  const peer = resolveReplayCostPreExecuteCostPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "replay-cost" ? model.replayCostLink : model.preExecuteCostLink;

  return (
    <VocabularyRail
      testIdPrefix="replay-cost-pre-execute-cost-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
      notes={[{ testIdSuffix: "honesty", text: model.estimatesHonesty }]}
    />
  );
}
