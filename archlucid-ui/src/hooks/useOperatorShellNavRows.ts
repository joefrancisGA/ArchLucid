"use client";

import { useMemo } from "react";

import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { useOperateNavUnlockPhase } from "@/hooks/useOperateNavUnlockPhase";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { filterNavGroupsForGovernanceMode } from "@/lib/governance-mode-nav-filter";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

type UseOperatorShellNavRowsResult = {
  readonly allRows: NavGroupWithVisibleLinks[];
  readonly buyerPolishedShell: boolean;
  readonly demoUi: boolean;
  readonly effectiveHasCommittedArchitectureReview: boolean;
  readonly effectiveOperateUnlockPhase: OperateNavUnlockPhase;
  readonly unlockOperateFeatures: () => void;
};

/** Shared sidebar / mobile drawer nav composition with governance-mode filtering. */
export function useOperatorShellNavRows(): UseOperatorShellNavRowsResult {
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { isGovernanceModeEnabled } = useGovernanceMode();
  const demoUi = isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { effectiveOperateUnlockPhase, unlockOperateFeatures } = useOperateNavUnlockPhase();
  const navExpanded = true;
  const navAdvanced = true;
  const effectiveHasCommittedArchitectureReview = hasCommittedArchitectureReview || buyerPolishedShell;
  const navGateHasCommittedArchitectureReview =
    effectiveHasCommittedArchitectureReview || effectiveOperateUnlockPhase >= 1;
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
        navGateHasCommittedArchitectureReview,
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
              navGateHasCommittedArchitectureReview,
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
      unlockOperateFeatures,
    };
  }, [
    buyerPolishedShell,
    callerAuthorityRank,
    demoUi,
    effectiveHasCommittedArchitectureReview,
    effectiveOperateUnlockPhase,
    isGovernanceModeEnabled,
    navAdvanced,
    navExpanded,
    navGateHasCommittedArchitectureReview,
    omitAdminClusters,
    unlockOperateFeatures,
  ]);
}
