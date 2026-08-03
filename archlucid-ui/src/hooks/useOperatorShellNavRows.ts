"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useOperatorShellAuditRunId } from "@/hooks/useOperatorShellAuditRunId";
import { usePatternLibraryNavVisible } from "@/hooks/use-pattern-library-nav-visible";
import { useOperateNavUnlockPhase } from "@/hooks/useOperateNavUnlockPhase";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
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
  // Tier / operate-unlock disclosure retired: always request full link sets; authority filters below.
  const showExtended = true;
  const showAdvanced = true;
  const { effectiveOperateUnlockPhase, unlockOperateFeatures, showAutoUnlockHint, dismissAutoUnlockHint } =
    useOperateNavUnlockPhase();
  const { navExpanded, navAdvanced, shellShowExtended, shellShowAdvanced } = resolveSidebarNavExpansionState({
    pathname: pathname ?? "/",
    showExtended,
    showAdvanced,
    navDisclosurePathOverride: true,
    buyerPolishedShell,
    demoUi,
    ctoDemoNavExpandedEnv: isCtoDemoNavExpandedEnv(),
    runtimeCtoDemoTourActive: false,
  });
  const operateNavUnlockPhase = resolveOperateNavUnlockPhase(
    effectiveOperateUnlockPhase,
    true,
    hasCommittedArchitectureReview,
  );
  const effectiveHasCommittedArchitectureReview = hasCommittedArchitectureReview || buyerPolishedShell;
  const omitAdminClusters = demoUi && !buyerPolishedShell;
  const patternLibraryNavVisible = usePatternLibraryNavVisible();

  return useMemo(() => {
    const reviewNavRows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      showExtended,
      showAdvanced,
      callerAuthorityRank,
      false,
      "review-workflow",
      true,
      operateNavUnlockPhase,
    );

    const adminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters
        ? []
        : listNavGroupsVisibleInOperatorShell(
            NAV_GROUPS,
            true,
            true,
            callerAuthorityRank,
            false,
            "platform-admin",
            true,
            operateNavUnlockPhase,
          );

    // Internal Operations is already behind the `isShowSystemAdministrationNavEnabled()` feature
    // flag — it is an employee-only surface. Always pass full disclosure flags; authority still applies.
    const hideInternalOperationsNav =
      buyerPolishedShell && !isOperatorExperienceFullShellEnv();

    const systemAdminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters || !isShowSystemAdministrationNavEnabled() || hideInternalOperationsNav
        ? []
        : listNavGroupsVisibleInOperatorShell(
            NAV_GROUPS,
            true,
            true,
            callerAuthorityRank,
            false,
            "system-admin",
            true,
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
    omitAdminClusters,
    operateNavUnlockPhase,
    patternLibraryNavVisible,
    shellShowAdvanced,
    shellShowExtended,
    showAdvanced,
    showExtended,
    unlockOperateFeatures,
    showAutoUnlockHint,
    dismissAutoUnlockHint,
  ]);
}
