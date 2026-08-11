"use client";

import type { JSX } from "react";

import {
  buildPilotGuideGettingStartedFirstReviewVocabulary,
  resolvePilotGuideGettingStartedFirstReviewLink,
  resolvePilotGuideGettingStartedFirstReviewPeerLinks,
  type PilotGuideGettingStartedFirstReviewSurfaceId,
  type PilotGuideGettingStartedFirstReviewVocabularyModel,
} from "@/lib/vocabulary/pilot-guide-getting-started-first-review-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type PilotGuideGettingStartedFirstReviewVocabularyRailProps = {
  readonly currentSurfaceId: PilotGuideGettingStartedFirstReviewSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: PilotGuideGettingStartedFirstReviewVocabularyModel;
};

/**
 * TB-2322 — Triad vocabulary rail for Pilot guide, Getting started, and first architecture review.
 * Mount on all three help specialty hosts.
 */
export function PilotGuideGettingStartedFirstReviewVocabularyRail(
  props: PilotGuideGettingStartedFirstReviewVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildPilotGuideGettingStartedFirstReviewVocabulary();
  const peers = resolvePilotGuideGettingStartedFirstReviewPeerLinks(props.currentSurfaceId);
  const currentLink = resolvePilotGuideGettingStartedFirstReviewLink(props.currentSurfaceId);

  return (
    <VocabularyRail
      testIdPrefix="pilot-guide-getting-started-first-review-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyThree}
      currentLabel={currentLink?.label ?? null}
      links={peers.map((peer) => ({
        href: peer.href,
        label: peer.label,
        testIdSuffix: `peer-${peer.id}`,
      }))}
    />
  );
}
