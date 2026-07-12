"use client";

import { useMemo } from "react";

import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { visibleOperatorShellHrefSet } from "@/lib/nav-shell-visibility";

/** True when the href is exposed in the current operator shell navigation. */
export function useIsOperatorNavHrefReachable(href: string): boolean {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { showExtended, showAdvanced } = useNavProgressiveDisclosure();

  return useMemo(
    () =>
      visibleOperatorShellHrefSet(
        showExtended,
        showAdvanced,
        callerAuthorityRank,
        hasCommittedArchitectureReview,
      ).has(href),
    [callerAuthorityRank, hasCommittedArchitectureReview, href, showAdvanced, showExtended],
  );
}
