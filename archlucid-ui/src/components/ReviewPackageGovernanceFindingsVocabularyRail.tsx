"use client";

import type { JSX } from "react";

import {
  buildReviewPackageGovernanceFindingsVocabulary,
  resolveReviewPackageGovernanceFindingsPeerLink,
  type ReviewPackageGovernanceFindingsSurfaceId,
  type ReviewPackageGovernanceFindingsVocabularyModel,
} from "@/lib/vocabulary/review-package-governance-findings-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

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
  const model = props.model ?? buildReviewPackageGovernanceFindingsVocabulary(props.runId);
  const peer = resolveReviewPackageGovernanceFindingsPeerLink(props.currentSurfaceId, model);
  const currentLink =
    props.currentSurfaceId === "review-package-findings"
      ? model.reviewPackageFindingsLink
      : model.governanceFindingsLink;

  return (
    <VocabularyRail
      testIdPrefix="review-package-governance-findings-vocabulary"
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
