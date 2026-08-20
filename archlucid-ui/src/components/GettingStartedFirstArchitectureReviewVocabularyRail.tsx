"use client";

import type { JSX } from "react";

import {
  buildGettingStartedFirstArchitectureReviewVocabulary,
  resolveGettingStartedFirstArchitectureReviewPeerLink,
  type GettingStartedFirstArchitectureReviewSurfaceId,
  type GettingStartedFirstArchitectureReviewVocabularyModel,
} from "@/lib/vocabulary/getting-started-first-architecture-review-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type GettingStartedFirstArchitectureReviewVocabularyRailProps = {
  readonly currentSurfaceId: GettingStartedFirstArchitectureReviewSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: GettingStartedFirstArchitectureReviewVocabularyModel;
};

/** TB-2312 — Getting started orientation vs first architecture review guided path. */
export function GettingStartedFirstArchitectureReviewVocabularyRail(
  props: GettingStartedFirstArchitectureReviewVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildGettingStartedFirstArchitectureReviewVocabulary();
  const peer = resolveGettingStartedFirstArchitectureReviewPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "getting-started"
      ? model.gettingStartedLink
      : model.firstArchitectureReviewLink;

  return (
    <VocabularyRail
      testIdPrefix="getting-started-first-architecture-review-vocabulary"
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
