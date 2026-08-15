"use client";

import { useMemo } from "react";

import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { useEffectiveNavCommittedArchitectureReview } from "@/hooks/use-effective-nav-committed-architecture-review";
import { usePatternLibraryNavVisible } from "@/hooks/use-pattern-library-nav-visible";
import { visibleOperatorShellHrefSet } from "@/lib/nav-shell-visibility";
import { applyPatternLibraryHrefSetGate } from "@/lib/apply-pattern-library-nav-gate";

/** True when the href is exposed in the current operator shell navigation. */
export function useIsOperatorNavHrefReachable(href: string): boolean {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const effectiveHasCommittedArchitectureReview = useEffectiveNavCommittedArchitectureReview();
  const patternLibraryNavVisible = usePatternLibraryNavVisible();

  return useMemo(
    () =>
      applyPatternLibraryHrefSetGate(
        visibleOperatorShellHrefSet(callerAuthorityRank, effectiveHasCommittedArchitectureReview),
        patternLibraryNavVisible,
      ).has(href),
    [callerAuthorityRank, effectiveHasCommittedArchitectureReview, href, patternLibraryNavVisible],
  );
}
