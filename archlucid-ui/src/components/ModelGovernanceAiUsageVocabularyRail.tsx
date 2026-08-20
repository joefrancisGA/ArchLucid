"use client";

import type { JSX } from "react";

import {
  buildModelGovernanceAiUsageVocabulary,
  resolveModelGovernanceAiUsagePeerLink,
  type ModelGovernanceAiUsageSurfaceId,
  type ModelGovernanceAiUsageVocabularyModel,
} from "@/lib/vocabulary/model-governance-ai-usage-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
 * TB-2286 — Compact vocabulary rail between model governance and AI usage.
 * Mount on both hubs so operators do not conflate execution profiles with cost estimates.
 * Distinct from AI usage ≠ Billing (TB-2253).
 */
export function ModelGovernanceAiUsageVocabularyRail(
  props: ModelGovernanceAiUsageVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildModelGovernanceAiUsageVocabulary();
  const peer = resolveModelGovernanceAiUsagePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "model-governance"
      ? model.modelGovernanceLink
      : model.aiUsageLink;

  return (
    <VocabularyRail
      testIdPrefix="model-governance-ai-usage-vocabulary"
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
