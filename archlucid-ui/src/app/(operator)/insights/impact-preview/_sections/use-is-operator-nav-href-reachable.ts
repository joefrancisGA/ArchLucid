"use client";

import { useMemo } from "react";

import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { usePatternLibraryNavVisible } from "@/hooks/use-pattern-library-nav-visible";
import { visibleOperatorShellHrefSet } from "@/lib/nav-shell-visibility";
import { applyPatternLibraryHrefSetGate } from "@/lib/apply-pattern-library-nav-gate";

/** True when the href is exposed in the current operator shell navigation. */
export function useIsOperatorNavHrefReachable(href: string): boolean {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { showExtended, showAdvanced } = useNavProgressiveDisclosure();
  const patternLibraryNavVisible = usePatternLibraryNavVisible();

  return useMemo(
    () =>
      applyPatternLibraryHrefSetGate(
        visibleOperatorShellHrefSet(
          showExtended,
          showAdvanced,
          callerAuthorityRank,
          hasCommittedArchitectureReview,
        ),
        patternLibraryNavVisible,
      ).has(href),
    [
      callerAuthorityRank,
      hasCommittedArchitectureReview,
      href,
      patternLibraryNavVisible,
      showAdvanced,
      showExtended,
    ],
  );
}
