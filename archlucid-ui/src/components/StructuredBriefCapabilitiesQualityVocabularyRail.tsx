"use client";

import type { JSX } from "react";

import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";
import {
  buildStructuredBriefCapabilitiesQualityVocabulary,
  type StructuredBriefCapabilitiesQualitySurfaceId,
} from "@/lib/vocabulary/structured-brief-capabilities-quality-vocabulary";

export type StructuredBriefCapabilitiesQualityVocabularyRailProps = {
  readonly currentSurfaceId: StructuredBriefCapabilitiesQualitySurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
};

/** Phase A — capabilities vs quality attributes coaching on create/edit architecture. */
export function StructuredBriefCapabilitiesQualityVocabularyRail(
  props: StructuredBriefCapabilitiesQualityVocabularyRailProps,
): JSX.Element {
  const model = buildStructuredBriefCapabilitiesQualityVocabulary();

  return (
    <VocabularyRail
      testIdPrefix="structured-brief-capabilities-quality-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant ?? "full"}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      notes={[
        {
          testIdSuffix: "examples",
          text: "Examples: HTTPS ingress and managed database are capabilities; RTO 4h and p95 latency 200ms are quality attributes.",
        },
      ]}
      links={[
        {
          testIdSuffix: "help-link",
          href: model.helpHref,
          label: model.helpLabel,
        },
      ]}
    />
  );
}
