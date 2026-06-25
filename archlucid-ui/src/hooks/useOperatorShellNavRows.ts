"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { useOperateNavUnlockPhase } from "@/hooks/useOperateNavUnlockPhase";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { isCtoDemoNavExpandedEnv } from "@/lib/cto-demo-presenter-pack";
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
  readonly showAutoUnlockHint: boolean;
  readonly dismissAutoUnlockHint: () => void;
  readonly navExpanded: boolean;
  readonly navAdvanced: boolean;
  readonly shellShowExtended: boolean;
  readonly shellShowAdvanced: boolean;
};

/** Shared sidebar / mobile drawer nav composition. */
export function useOperatorShellNavRows(): UseOperatorShellNavRowsResult {
  const pathname = usePathname();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const demoUi = isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const { showExtended, showAdvanced } = useNavProgressiveDisclosure();
  const { effectiveOperateUnlockPhase, unlockOperateFeatures, showAutoUnlockHint, dismissAutoUnlockHint } =
    useOperateNavUnlockPhase();
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
  const operatorAdvancedModeOn =
    (navExpanded && navAdvanced) || (shellShowExtended && shellShowAdvanced);
  const operateNavUnlockPhase = resolveOperateNavUnlockPhase(
    effectiveOperateUnlockPhase,
    operatorAdvancedModeOn,
    hasCommittedArchitectureReview,
  );
  const reviewNavExpanded = operateNavUnlockPhase >= 1 || navExpanded;
  const reviewNavAdvanced = operateNavUnlockPhase >= 1 || navAdvanced;
  const effectiveHasCommittedArchitectureReview = hasCommittedArchitectureReview || buyerPolishedShell;
  const navGateHasCommittedArchitectureReview =
    effectiveHasCommittedArchitectureReview || effectiveOperateUnlockPhase >= 1;
  const omitAdminClusters = demoUi && !buyerPolishedShell;

  return useMemo(() => {
    const reviewNavRows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      reviewNavExpanded,
      reviewNavAdvanced,
      callerAuthorityRank,
      false,
      "review-workflow",
      navGateHasCommittedArchitectureReview,
      operateNavUnlockPhase,
    );

    const adminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters
        ? []
        : listNavGroupsVisibleInOperatorShell(
            NAV_GROUPS,
            true,
            navAdvanced,
            callerAuthorityRank,
            false,
            "platform-admin",
            navGateHasCommittedArchitectureReview,
            operateNavUnlockPhase,
          );

    const systemAdminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters || !isShowSystemAdministrationNavEnabled()
        ? []
        : listNavGroupsVisibleInOperatorShell(
            NAV_GROUPS,
            true,
            navAdvanced,
            callerAuthorityRank,
            false,
            "system-admin",
            navGateHasCommittedArchitectureReview,
            operateNavUnlockPhase,
          );

    return {
      allRows: [...reviewNavRows, ...adminNavRows, ...systemAdminNavRows],
      buyerPolishedShell,
      demoUi,
      effectiveHasCommittedArchitectureReview,
      effectiveOperateUnlockPhase,
      unlockOperateFeatures,
      showAutoUnlockHint,
      dismissAutoUnlockHint,
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
    showAutoUnlockHint,
    dismissAutoUnlockHint,
  ]);
}
