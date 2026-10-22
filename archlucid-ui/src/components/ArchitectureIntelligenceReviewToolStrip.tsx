"use client";

import type { JSX } from "react";

import { ExternalPeerVocabularyRailFromModel } from "@/components/vocabulary/ExternalPeerVocabularyRailFromModel";
import {
  buildArchitectureIntelligenceReviewPairwiseRail,
  type ArchitectureIntelligenceReviewSurfaceId,
  type ArchitectureIntelligenceReviewVocabularyModel,
} from "@/lib/vocabulary/architecture-intelligence-review-vocabulary";

export type ArchitectureIntelligenceReviewToolStripProps = {
  readonly currentSurfaceId: ArchitectureIntelligenceReviewSurfaceId;
  readonly runId?: string | null;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ArchitectureIntelligenceReviewVocabularyModel;
};

/** TB-2358 — compact rail: review workspace vs Architecture Intelligence review tool. */
export function ArchitectureIntelligenceReviewToolStrip(
  props: ArchitectureIntelligenceReviewToolStripProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          reviewSideLink: props.model.reviewWorkspaceLink,
          externalPeerLink: props.model.architectureIntelligenceLink,
        }
      : buildArchitectureIntelligenceReviewPairwiseRail(props.runId);

  return (
    <ExternalPeerVocabularyRailFromModel
      testIdPrefix="architecture-intelligence-review-tool"
      reviewSurfaceId="review-workspace"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant ?? "compact"}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
