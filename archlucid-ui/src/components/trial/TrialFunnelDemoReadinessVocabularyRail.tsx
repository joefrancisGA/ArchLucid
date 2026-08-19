"use client";

import type { JSX } from "react";

import {
  buildTrialFunnelDemoReadinessVocabulary,
  resolveTrialFunnelDemoReadinessPeerLink,
  type TrialFunnelDemoReadinessSurfaceId,
  type TrialFunnelDemoReadinessVocabularyModel,
} from "@/lib/vocabulary/trial-funnel-demo-readiness-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildTrialFunnelDemoReadinessVocabulary();
  const peer = resolveTrialFunnelDemoReadinessPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "trial-funnel"
      ? model.trialFunnelLink
      : model.demoReadinessLink;

  return (
    <VocabularyRail
      testIdPrefix="trial-funnel-demo-readiness-vocabulary"
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
