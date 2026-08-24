"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import {
  useNavCallerAuthorityRank,
  useOperatorNavAuthority,
} from "@/components/operator/OperatorNavAuthorityProvider";
import { useOperatorShellAuditRunId } from "@/hooks/useOperatorShellAuditRunId";
import { useEffectiveNavCommittedArchitectureReview } from "@/hooks/use-effective-nav-committed-architecture-review";
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
  countNavGroupsHiddenByFirstSessionPilotMode,
  countNavGroupsHiddenByRoleDensity,
  filterNavGroupsByRoleDensity,
  filterNavGroupsForFirstSessionPilotMode,
  resolveRoleNavDensityPersona,
} from "@/lib/role-shaped-nav-density";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

type UseOperatorShellNavRowsResult = {
  readonly allRows: NavGroupWithVisibleLinks[];
  readonly buyerPolishedShell: boolean;
  readonly demoUi: boolean;
  readonly effectiveHasCommittedArchitectureReview: boolean;
  readonly effectiveOperateUnlockPhase: OperateNavUnlockPhase;
  readonly roleNavDensityHiddenGroupCount: number;
  readonly roleNavDensityShowFullNav: boolean;
  readonly toggleRoleNavDensityShowFullNav: () => void;
};

/** Shared sidebar / mobile drawer nav composition. */
export function useOperatorShellNavRows(): UseOperatorShellNavRowsResult {
  const auditRunId = useOperatorShellAuditRunId();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const { currentPrincipal } = useOperatorNavAuthority();
  const { showFullNav: roleNavDensityShowFullNav, toggleShowFullNav: toggleRoleNavDensityShowFullNav } =
    useRoleNavDensityExpanded();
  const roleNavDensityPersona = resolveRoleNavDensityPersona(currentPrincipal.roleClaimValues);
  const demoUi = isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const ctoDemoNavExpandedEnv = isCtoDemoNavExpandedEnv();
  // CTO demo presenter pack expands Graph / Governance without role-density collapse (TB-2139).
  const effectiveRoleNavDensityShowFullNav = roleNavDensityShowFullNav || ctoDemoNavExpandedEnv;
  const effectiveOperateUnlockPhase: OperateNavUnlockPhase = 0;
  const effectiveHasCommittedArchitectureReview = useEffectiveNavCommittedArchitectureReview();
  const omitAdminClusters = demoUi && !buyerPolishedShell;
  const patternLibraryNavVisible = usePatternLibraryNavVisible();

  return useMemo(() => {
    const reviewNavRows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      callerAuthorityRank,
      "review-workflow",
      effectiveHasCommittedArchitectureReview,
    );

    const adminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters
        ? []
        : listNavGroupsVisibleInOperatorShell(
            NAV_GROUPS,
            callerAuthorityRank,
            "platform-admin",
            effectiveHasCommittedArchitectureReview,
          );

    // Internal Operations is already behind the `isShowSystemAdministrationNavEnabled()` feature
    // flag — it is an employee-only surface.
    const hideInternalOperationsNav =
      buyerPolishedShell && !isOperatorExperienceFullShellEnv();

    const systemAdminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters || !isShowSystemAdministrationNavEnabled() || hideInternalOperationsNav
        ? []
        : listNavGroupsVisibleInOperatorShell(
            NAV_GROUPS,
            callerAuthorityRank,
            "system-admin",
            effectiveHasCommittedArchitectureReview,
          );

    const scopedRows = applyPatternLibraryNavGate(
      scopeOperatorShellNavRows(
        [...reviewNavRows, ...adminNavRows, ...systemAdminNavRows],
        auditRunId,
      ),
      patternLibraryNavVisible,
    );
    const firstSessionRows = filterNavGroupsForFirstSessionPilotMode(
      scopedRows,
      effectiveHasCommittedArchitectureReview,
      effectiveRoleNavDensityShowFullNav,
    );
    const allRows = filterNavGroupsByRoleDensity(
      firstSessionRows,
      roleNavDensityPersona,
      effectiveRoleNavDensityShowFullNav,
    );
    const firstSessionHiddenCount = countNavGroupsHiddenByFirstSessionPilotMode(
      scopedRows,
      effectiveHasCommittedArchitectureReview,
      effectiveRoleNavDensityShowFullNav,
    );
    const roleNavDensityHiddenGroupCount =
      firstSessionHiddenCount
      + countNavGroupsHiddenByRoleDensity(
        firstSessionRows,
        roleNavDensityPersona,
        effectiveRoleNavDensityShowFullNav,
      );

    return {
      allRows,
      buyerPolishedShell,
      demoUi,
      effectiveHasCommittedArchitectureReview,
      effectiveOperateUnlockPhase,
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
    omitAdminClusters,
    patternLibraryNavVisible,
    roleNavDensityPersona,
  ]);
}
