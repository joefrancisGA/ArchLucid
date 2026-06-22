"use client";

import { useMemo } from "react";

import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { filterNavGroupsForGovernanceMode } from "@/lib/governance-mode-nav-filter";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";

type UseOperatorShellNavRowsResult = {
  readonly allRows: NavGroupWithVisibleLinks[];
  readonly buyerPolishedShell: boolean;
  readonly demoUi: boolean;
  readonly effectiveHasCommittedArchitectureReview: boolean;
  readonly effectiveOperateUnlockPhase: 2;
};

/** Shared sidebar / mobile drawer nav composition with governance-mode filtering. */
export function useOperatorShellNavRows(): UseOperatorShellNavRowsResult {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { isGovernanceModeEnabled } = useGovernanceMode();
  const demoUi = isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const navExpanded = true;
  const navAdvanced = true;
  const effectiveOperateUnlockPhase = 2 as const;
  const effectiveHasCommittedArchitectureReview = hasCommittedArchitectureReview || buyerPolishedShell;
  const omitAdminClusters = demoUi && !buyerPolishedShell;

  return useMemo(() => {
    const reviewNavRows = filterNavGroupsForGovernanceMode(
      listNavGroupsVisibleInOperatorShell(
        NAV_GROUPS,
        navExpanded,
        navAdvanced,
        callerAuthorityRank,
        false,
        "review-workflow",
        effectiveHasCommittedArchitectureReview,
        effectiveOperateUnlockPhase,
      ),
      isGovernanceModeEnabled,
    );

    const adminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters
        ? []
        : filterNavGroupsForGovernanceMode(
            listNavGroupsVisibleInOperatorShell(
              NAV_GROUPS,
              navExpanded,
              navAdvanced,
              callerAuthorityRank,
              false,
              "platform-admin",
              effectiveHasCommittedArchitectureReview,
              effectiveOperateUnlockPhase,
            ),
            isGovernanceModeEnabled,
          );

    return {
      allRows: [...reviewNavRows, ...adminNavRows],
      buyerPolishedShell,
      demoUi,
      effectiveHasCommittedArchitectureReview,
      effectiveOperateUnlockPhase,
    };
  }, [
    callerAuthorityRank,
    effectiveHasCommittedArchitectureReview,
    isGovernanceModeEnabled,
    omitAdminClusters,
  ]);
}
