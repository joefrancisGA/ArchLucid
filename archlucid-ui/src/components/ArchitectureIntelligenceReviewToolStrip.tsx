"use client";

import type { JSX } from "react";

import {
  buildArchitectureIntelligenceReviewVocabulary,
  resolveArchitectureIntelligenceReviewPeerLink,
  type ArchitectureIntelligenceReviewSurfaceId,
  type ArchitectureIntelligenceReviewVocabularyModel,
} from "@/lib/vocabulary/architecture-intelligence-review-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildArchitectureIntelligenceReviewVocabulary(props.runId);
  const peer = resolveArchitectureIntelligenceReviewPeerLink(props.currentSurfaceId, model);
  const currentLink =
    props.currentSurfaceId === "review-workspace"
      ? model.reviewWorkspaceLink
      : model.architectureIntelligenceLink;

  return (
    <VocabularyRail
      testIdPrefix="architecture-intelligence-review-tool"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant ?? "compact"}
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
