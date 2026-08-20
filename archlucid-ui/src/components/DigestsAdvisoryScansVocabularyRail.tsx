"use client";

import type { JSX } from "react";

import {
  buildDigestsAdvisoryScansVocabulary,
  resolveDigestsAdvisoryScansPeerLink,
  type DigestsAdvisoryScansSurfaceId,
  type DigestsAdvisoryScansVocabularyModel,
} from "@/lib/vocabulary/digests-advisory-scans-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type DigestsAdvisoryScansVocabularyRailProps = {
  readonly currentSurfaceId: DigestsAdvisoryScansSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: DigestsAdvisoryScansVocabularyModel;
};

/** TB-2314 — Digests content cadence vs Advisory scans hub. */
export function DigestsAdvisoryScansVocabularyRail(
  props: DigestsAdvisoryScansVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildDigestsAdvisoryScansVocabulary();
  const peer = resolveDigestsAdvisoryScansPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "digests" ? model.digestsLink : model.advisoryScansLink;

  return (
    <VocabularyRail
      testIdPrefix="digests-advisory-scans-vocabulary"
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
