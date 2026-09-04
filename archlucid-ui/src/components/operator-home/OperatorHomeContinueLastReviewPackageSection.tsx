"use client";

import { useMemo } from "react";

import { ReviewPackageContinueLastRow } from "@/components/reviews/ReviewPackageContinueLastRow";
import { resolveContinueLastReviewPackageTarget } from "@/lib/resolve-continue-last-review-package";
import type { RunSummary } from "@/types/authority";

export type OperatorHomeContinueLastReviewPackageSectionProps = {
  readonly runs: readonly RunSummary[];
};

/** Working Home resume row for the last-open review package (CD-11). */
export function OperatorHomeContinueLastReviewPackageSection(
  props: OperatorHomeContinueLastReviewPackageSectionProps,
): React.JSX.Element | null {
  const target = useMemo(
    () => resolveContinueLastReviewPackageTarget(props.runs),
    [props.runs],
  );

  if (target === null) {
    return null;
  }

  return <ReviewPackageContinueLastRow target={target} />;
}
