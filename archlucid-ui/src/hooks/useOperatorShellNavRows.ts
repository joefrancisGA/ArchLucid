"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useOperatorShellAuditRunId } from "@/hooks/useOperatorShellAuditRunId";
import { usePatternLibraryNavVisible } from "@/hooks/use-pattern-library-nav-visible";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { useOperateNavUnlockPhase } from "@/hooks/useOperateNavUnlockPhase";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { isCtoDemoNavExpandedEnv } from "@/lib/cto-demo-presenter-pack";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { applyPatternLibraryNavGate } from "@/lib/apply-pattern-library-nav-gate";
import { scopeOperatorShellNavRows } from "@/lib/nav-audit-run-scope";
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
  const auditRunId = useOperatorShellAuditRunId();
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
  // Advanced-tier routes stay behind explicit sidebar disclosure even after Operate unlock phase 2.
  const reviewNavAdvanced = navAdvanced;
  const effectiveHasCommittedArchitectureReview = hasCommittedArchitectureReview || buyerPolishedShell;
  const navGateHasCommittedArchitectureReview =
    hasCommittedArchitectureReview || effectiveOperateUnlockPhase >= 1;
  const omitAdminClusters = demoUi && !buyerPolishedShell;
  const patternLibraryNavVisible = usePatternLibraryNavVisible();

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

    // Internal Operations is already behind the `isShowSystemAdministrationNavEnabled()` feature
    // flag — it is an employee-only surface, so tier-based progressive disclosure does not apply.
    // Always pass true for both showExtended and showAdvanced so every link is visible to anyone
    // who can see the section.
    const systemAdminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters || !isShowSystemAdministrationNavEnabled() || buyerPolishedShell
        ? []
        : listNavGroupsVisibleInOperatorShell(
            NAV_GROUPS,
            true,
            true,
            callerAuthorityRank,
            false,
            "system-admin",
            navGateHasCommittedArchitectureReview,
            operateNavUnlockPhase,
          );

    return {
      allRows: applyPatternLibraryNavGate(
        scopeOperatorShellNavRows(
          [...reviewNavRows, ...adminNavRows, ...systemAdminNavRows],
          auditRunId,
        ),
        patternLibraryNavVisible,
      ),
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
    auditRunId,
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
    patternLibraryNavVisible,
    reviewNavAdvanced,
    reviewNavExpanded,
    shellShowAdvanced,
    shellShowExtended,
    unlockOperateFeatures,
    showAutoUnlockHint,
    dismissAutoUnlockHint,
  ]);
}
