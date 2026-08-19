import type { ReactNode } from "react";

import type { OperatorNavAuthorityContextValue } from "@/components/operator/OperatorNavAuthorityProvider";
import {
  operatorNavOutsideProviderPrincipal,
  type CurrentPrincipal,
} from "@/lib/current-principal";
import { AUTHORITY_RANK, requiredAuthorityFromRank } from "@/lib/nav-authority";

export type OperatorNavAuthorityVitestMockOptions = {
  readonly callerAuthorityRank?: number;
  readonly hasCommittedArchitectureReview?: boolean;
  readonly isAuthorityLoading?: boolean;
  readonly currentPrincipal?: CurrentPrincipal;
};

function buildPrincipal(
  callerAuthorityRank: number,
  hasCommittedArchitectureReview: boolean,
  currentPrincipal?: CurrentPrincipal,
): CurrentPrincipal {
  if (currentPrincipal !== undefined) {
    return currentPrincipal;
  }

  return {
    ...operatorNavOutsideProviderPrincipal,
    authorityRank: callerAuthorityRank,
    maxAuthority: requiredAuthorityFromRank(callerAuthorityRank),
    hasCommittedArchitectureReview,
  };
}

/** Complete Vitest mock for `@/components/operator/OperatorNavAuthorityProvider` (all hook exports). */
export function createOperatorNavAuthorityVitestMock(
  options: OperatorNavAuthorityVitestMockOptions = {},
): Record<string, unknown> {
  const callerAuthorityRank =
    options.callerAuthorityRank ?? operatorNavOutsideProviderPrincipal.authorityRank;
  const hasCommittedArchitectureReview =
    options.hasCommittedArchitectureReview ??
    operatorNavOutsideProviderPrincipal.hasCommittedArchitectureReview;
  const currentPrincipal = buildPrincipal(
    callerAuthorityRank,
    hasCommittedArchitectureReview,
    options.currentPrincipal,
  );
  const isAuthorityLoading = options.isAuthorityLoading ?? false;

  const authorityValue: OperatorNavAuthorityContextValue = {
    currentPrincipal,
    callerAuthorityRank,
    isAuthorityLoading,
  };

  return {
    useOperatorNavAuthority: () => authorityValue,
    useNavCallerAuthorityRank: () => {
      if (isAuthorityLoading) {
        return AUTHORITY_RANK.ReadAuthority;
      }

      return callerAuthorityRank;
    },
    useNavCommittedArchitectureReview: () => hasCommittedArchitectureReview,
    OperatorNavAuthorityProvider: ({ children }: { children: ReactNode }) => children,
  };
}
