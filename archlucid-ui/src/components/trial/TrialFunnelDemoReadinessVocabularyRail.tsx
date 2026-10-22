"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildTrialFunnelDemoReadinessPairwiseRail,
  type TrialFunnelDemoReadinessSurfaceId,
  type TrialFunnelDemoReadinessVocabularyModel,
} from "@/lib/vocabulary/trial-funnel-demo-readiness-vocabulary";

export type TrialFunnelDemoReadinessVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: TrialFunnelDemoReadinessSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildTrialFunnelDemoReadinessVocabulary}. */
  readonly model?: TrialFunnelDemoReadinessVocabularyModel;
};

/**
 * TB-2266 — Compact vocabulary rail between Trial funnel conversion metrics and Demo readiness preflight.
 * Mount on both Internal Operations admin pages.
 */
export function TrialFunnelDemoReadinessVocabularyRail(
  props: TrialFunnelDemoReadinessVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.trialFunnelLink,
          peerLink: props.model.demoReadinessLink,
        }
      : buildTrialFunnelDemoReadinessPairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="trial-funnel-demo-readiness-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
