"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildModelGovernanceAiUsagePairwiseRail,
  type ModelGovernanceAiUsageSurfaceId,
  type ModelGovernanceAiUsageVocabularyModel,
} from "@/lib/vocabulary/model-governance-ai-usage-vocabulary";

export type ModelGovernanceAiUsageVocabularyRailProps = {
  /** Surface hosting the strip — marks the current admin job and links to the peer. */
  readonly currentSurfaceId: ModelGovernanceAiUsageSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildModelGovernanceAiUsageVocabulary}. */
  readonly model?: ModelGovernanceAiUsageVocabularyModel;
};

/**
 * TB-2286 — Compact vocabulary rail between model policy and AI usage.
 * Mount on both hubs so operators do not conflate execution profiles with cost estimates.
 * Distinct from AI usage ≠ Billing (TB-2253).
 */
export function ModelGovernanceAiUsageVocabularyRail(
  props: ModelGovernanceAiUsageVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.modelGovernanceLink,
          peerLink: props.model.aiUsageLink,
        }
      : buildModelGovernanceAiUsagePairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="model-governance-ai-usage-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
