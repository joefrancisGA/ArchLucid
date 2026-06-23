"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { useOperateNavUnlockPhase } from "@/hooks/useOperateNavUnlockPhase";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isArchLucidInternalOperatorShellEnv } from "@/lib/internal-operator-env";
import { isCtoDemoNavExpandedEnv } from "@/lib/cto-demo-presenter-pack";
import { filterNavGroupsForGovernanceMode } from "@/lib/governance-mode-nav-filter";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { resolveSidebarNavExpansionState } from "@/lib/sidebar-nav-disclosure-state";
import { resolveOperateNavUnlockPhase } from "@/lib/usability/operate-advanced-features-disclosure";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

type UseOperatorShellNavRowsResult = {
  readonly allRows: NavGroupWithVisibleLinks[];
  readonly buyerPolishedShell: boolean;
  readonly demoUi: boolean;
  readonly effectiveHasCommittedArchitectureReview: boolean;
  readonly effectiveOperateUnlockPhase: OperateNavUnlockPhase;
  readonly unlockOperateFeatures: () => void;
  readonly navExpanded: boolean;
  readonly navAdvanced: boolean;
  readonly shellShowExtended: boolean;
  readonly shellShowAdvanced: boolean;
};

/** Shared sidebar / mobile drawer nav composition with governance-mode filtering. */
export function useOperatorShellNavRows(): UseOperatorShellNavRowsResult {
  const pathname = usePathname();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { isGovernanceModeEnabled } = useGovernanceMode();
  const demoUi = isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { showExtended, showAdvanced } = useNavProgressiveDisclosure();
  const { effectiveOperateUnlockPhase, unlockOperateFeatures } = useOperateNavUnlockPhase();
  const { navExpanded, navAdvanced, shellShowExtended, shellShowAdvanced } = resolveSidebarNavExpansionState({
    pathname: pathname ?? "/",
    showExtended,
    showAdvanced,
    navDisclosurePathOverride: false,
    buyerPolishedShell,
    demoUi,
    ctoDemoNavExpandedEnv: isCtoDemoNavExpandedEnv(),
    runtimeCtoDemoTourActive: false,
  });
  const operatorAdvancedModeOn = showExtended && showAdvanced;
  const operateNavUnlockPhase = resolveOperateNavUnlockPhase(effectiveOperateUnlockPhase, operatorAdvancedModeOn);
  const reviewNavExpanded = operateNavUnlockPhase >= 1 || navExpanded;
  const reviewNavAdvanced = operateNavUnlockPhase >= 1 || navAdvanced;
  const effectiveHasCommittedArchitectureReview = hasCommittedArchitectureReview || buyerPolishedShell;
  const navGateHasCommittedArchitectureReview =
    effectiveHasCommittedArchitectureReview || effectiveOperateUnlockPhase >= 1;
  const omitAdminClusters = demoUi && !buyerPolishedShell;

  return useMemo(() => {
    const reviewNavRows = filterNavGroupsForGovernanceMode(
      listNavGroupsVisibleInOperatorShell(
        NAV_GROUPS,
        reviewNavExpanded,
        reviewNavAdvanced,
        callerAuthorityRank,
        false,
        "review-workflow",
        navGateHasCommittedArchitectureReview,
        operateNavUnlockPhase,
      ),
      isGovernanceModeEnabled,
    );

    const adminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters
        ? []
        : filterNavGroupsForGovernanceMode(
            listNavGroupsVisibleInOperatorShell(
              NAV_GROUPS,
              // Tenant settings links are extended-tier; keep Settings reachable during Core Pilot.
              true,
              navAdvanced,
              callerAuthorityRank,
              false,
              "platform-admin",
              navGateHasCommittedArchitectureReview,
              operateNavUnlockPhase,
            ),
            isGovernanceModeEnabled,
          );

    const systemAdminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters || !isArchLucidInternalOperatorShellEnv()
        ? []
        : filterNavGroupsForGovernanceMode(
            listNavGroupsVisibleInOperatorShell(
              NAV_GROUPS,
              true,
              navAdvanced,
              callerAuthorityRank,
              false,
              "system-admin",
              navGateHasCommittedArchitectureReview,
              operateNavUnlockPhase,
            ),
            isGovernanceModeEnabled,
          );

    return {
      allRows: [...reviewNavRows, ...adminNavRows, ...systemAdminNavRows],
      buyerPolishedShell,
      demoUi,
      effectiveHasCommittedArchitectureReview,
      effectiveOperateUnlockPhase,
      unlockOperateFeatures,
      navExpanded,
      navAdvanced,
      shellShowExtended,
      shellShowAdvanced,
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
    operateNavUnlockPhase,
    reviewNavAdvanced,
    reviewNavExpanded,
    shellShowAdvanced,
    shellShowExtended,
    unlockOperateFeatures,
  ]);
}
