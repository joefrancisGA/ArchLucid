"use client";

import type { JSX } from "react";

import { ExternalPeerVocabularyRailFromModel } from "@/components/vocabulary/ExternalPeerVocabularyRailFromModel";
import {
  buildReviewPackageGovernanceFindingsPairwiseRail,
  type ReviewPackageGovernanceFindingsSurfaceId,
  type ReviewPackageGovernanceFindingsVocabularyModel,
} from "@/lib/vocabulary/review-package-governance-findings-vocabulary";

export type ReviewPackageGovernanceFindingsVocabularyRailProps = {
  /** Review scope when mounting on a review Findings tab or scoped governance queue. */
  readonly runId?: string | null;
  /** Surface hosting the strip — marks the current register and links to the peer. */
  readonly currentSurfaceId: ReviewPackageGovernanceFindingsSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildReviewPackageGovernanceFindingsVocabulary}. */
  readonly model?: ReviewPackageGovernanceFindingsVocabularyModel;
};

/**
 * TB-2386 — Compact vocabulary rail between review-package Findings tab and workspace
 * findings queue. Mount on both surfaces so operators do not conflate triage with disposition.
 */
export function ReviewPackageGovernanceFindingsVocabularyRail(
  props: ReviewPackageGovernanceFindingsVocabularyRailProps,
): JSX.Element {
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          reviewSideLink: props.model.reviewPackageFindingsLink,
          externalPeerLink: props.model.governanceFindingsLink,
        }
      : buildReviewPackageGovernanceFindingsPairwiseRail(props.runId);

  return (
    <ExternalPeerVocabularyRailFromModel
      testIdPrefix="review-package-governance-findings-vocabulary"
      reviewSurfaceId="review-package-findings"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
