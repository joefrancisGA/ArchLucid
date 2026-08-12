"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import {
  useNavCallerAuthorityRank,
  useNavCommittedArchitectureReview,
  useOperatorNavAuthority,
} from "@/components/OperatorNavAuthorityProvider";
import { useOperatorShellAuditRunId } from "@/hooks/useOperatorShellAuditRunId";
import { usePatternLibraryNavVisible } from "@/hooks/use-pattern-library-nav-visible";
import { useRoleNavDensityExpanded } from "@/hooks/use-role-nav-density-expanded";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { isCtoDemoNavExpandedEnv } from "@/lib/cto-demo-presenter-pack";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { applyPatternLibraryNavGate } from "@/lib/apply-pattern-library-nav-gate";
import { scopeOperatorShellNavRows } from "@/lib/nav-audit-run-scope";
import {
  countNavGroupsHiddenByRoleDensity,
  filterNavGroupsByRoleDensity,
  resolveRoleNavDensityPersona,
} from "@/lib/role-shaped-nav-density";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { resolveSidebarNavExpansionState } from "@/lib/sidebar-nav-disclosure-state";
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
  readonly roleNavDensityHiddenGroupCount: number;
  readonly roleNavDensityShowFullNav: boolean;
  readonly toggleRoleNavDensityShowFullNav: () => void;
};

/** Shared sidebar / mobile drawer nav composition. */
export function useOperatorShellNavRows(): UseOperatorShellNavRowsResult {
  const pathname = usePathname();
  const auditRunId = useOperatorShellAuditRunId();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const { currentPrincipal } = useOperatorNavAuthority();
  const { showFullNav: roleNavDensityShowFullNav, toggleShowFullNav: toggleRoleNavDensityShowFullNav } =
    useRoleNavDensityExpanded();
  const roleNavDensityPersona = resolveRoleNavDensityPersona(currentPrincipal.roleClaimValues);
  const demoUi = isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const ctoDemoNavExpandedEnv = isCtoDemoNavExpandedEnv();
  // CTO demo presenter pack expands Graph / Governance without progressive disclosure — also bypass
  // role-density collapse so mock CI and demos keep operate-governance visible (TB-2139).
  const effectiveRoleNavDensityShowFullNav = roleNavDensityShowFullNav || ctoDemoNavExpandedEnv;
  // Tier / operate-unlock disclosure retired: always request full link sets; authority filters below.
  const showExtended = true;
  const showAdvanced = true;
  const effectiveOperateUnlockPhase: OperateNavUnlockPhase = 0;
  const { navExpanded, navAdvanced, shellShowExtended, shellShowAdvanced } = resolveSidebarNavExpansionState({
    pathname: pathname ?? "/",
    showExtended,
    showAdvanced,
    navDisclosurePathOverride: true,
    buyerPolishedShell,
    demoUi,
    ctoDemoNavExpandedEnv,
    runtimeCtoDemoTourActive: false,
  });
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
          );

    const scopedRows = applyPatternLibraryNavGate(
      scopeOperatorShellNavRows(
        [...reviewNavRows, ...adminNavRows, ...systemAdminNavRows],
        auditRunId,
      ),
      patternLibraryNavVisible,
    );
    const allRows = filterNavGroupsByRoleDensity(
      scopedRows,
      roleNavDensityPersona,
      effectiveRoleNavDensityShowFullNav,
    );
    const roleNavDensityHiddenGroupCount = countNavGroupsHiddenByRoleDensity(
      scopedRows,
      roleNavDensityPersona,
      effectiveRoleNavDensityShowFullNav,
    );

    return {
      allRows,
      buyerPolishedShell,
      demoUi,
      effectiveHasCommittedArchitectureReview,
      effectiveOperateUnlockPhase,
      unlockOperateFeatures: () => {},
      showAutoUnlockHint: false,
      dismissAutoUnlockHint: () => {},
      navExpanded,
      navAdvanced,
      shellShowExtended,
      shellShowAdvanced,
      roleNavDensityHiddenGroupCount,
      roleNavDensityShowFullNav: effectiveRoleNavDensityShowFullNav,
      toggleRoleNavDensityShowFullNav,
    };
  }, [
    auditRunId,
    buyerPolishedShell,
    callerAuthorityRank,
    demoUi,
    effectiveHasCommittedArchitectureReview,
    effectiveOperateUnlockPhase,
    effectiveRoleNavDensityShowFullNav,
    navAdvanced,
    navExpanded,
    omitAdminClusters,
    patternLibraryNavVisible,
    roleNavDensityPersona,
    shellShowAdvanced,
    shellShowExtended,
    showAdvanced,
    showExtended,
  ]);
}
