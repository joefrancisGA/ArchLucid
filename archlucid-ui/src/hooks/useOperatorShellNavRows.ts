"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

import {
  useNavCallerAuthorityRank,
  useOperatorNavAuthority,
} from "@/components/operator/OperatorNavAuthorityProvider";
import { useOperatorShellAuditRunId } from "@/hooks/useOperatorShellAuditRunId";
import { useEffectiveNavCommittedArchitectureReview } from "@/hooks/use-effective-nav-committed-architecture-review";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { usePatternLibraryNavVisible } from "@/hooks/use-pattern-library-nav-visible";
import { useRoleNavDensityExpanded } from "@/hooks/use-role-nav-density-expanded";
import { NAV_GROUPS } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isDevEmployeeRoleOverrideActive } from "@/lib/dev-testing-overrides";
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
import { filterNavGroupsForWorkingProfessionalMode } from "@/lib/workspace-mode/working-mode-nav-filter";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";
import { isArchLucidVendorStaffPrincipal } from "@/lib/vendor-staff-principal";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { productLineSkipsReviewLifecycleNavShaping } from "@/lib/product-line/filter-nav-groups-for-product-line";

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
  const { isWorkingMode } = useWorkspaceMode();
  // CTO demo presenter pack expands Graph / Governance without role-density collapse (TB-2139).
  const devEmployeeOverride = isDevEmployeeRoleOverrideActive();
  const effectiveRoleNavDensityShowFullNav =
    roleNavDensityShowFullNav || ctoDemoNavExpandedEnv || isWorkingMode || devEmployeeOverride;
  const effectiveOperateUnlockPhase: OperateNavUnlockPhase = 0;
  const effectiveHasCommittedArchitectureReview = useEffectiveNavCommittedArchitectureReview();
  const hideGettingStartedFromMainNav = isWorkingMode;
  const showVendorInternalNav =
    isArchLucidVendorStaffPrincipal(currentPrincipal) || devEmployeeOverride;
  const omitAdminClusters = demoUi && !buyerPolishedShell && !devEmployeeOverride;
  const omitDuplicateReportingNav = isWorkingMode;
  const patternLibraryNavVisible = usePatternLibraryNavVisible();
  const { productLine, assignmentOverrides } = useProductLine();
  const skipReviewLifecycleNavShaping = productLineSkipsReviewLifecycleNavShaping(productLine);

  return useMemo(() => {
    const navListOptions = {
      showVendorInternalNav,
      productLine,
      productLineAssignmentOverrides: assignmentOverrides,
    };
    const committedForNav = skipReviewLifecycleNavShaping || effectiveHasCommittedArchitectureReview;

    const reviewNavRows = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      callerAuthorityRank,
      "review-workflow",
      committedForNav,
      hideGettingStartedFromMainNav,
      navListOptions,
    );

    const adminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters
        ? []
        : listNavGroupsVisibleInOperatorShell(
            NAV_GROUPS,
            callerAuthorityRank,
            "platform-admin",
            committedForNav,
            hideGettingStartedFromMainNav,
            navListOptions,
          );

    const systemAdminNavRows: NavGroupWithVisibleLinks[] =
      omitAdminClusters || !isShowSystemAdministrationNavEnabled() || !showVendorInternalNav
        ? []
        : listNavGroupsVisibleInOperatorShell(
            NAV_GROUPS,
            callerAuthorityRank,
            "system-admin",
            committedForNav,
            hideGettingStartedFromMainNav,
            navListOptions,
          );

    const scopedRows = applyPatternLibraryNavGate(
      scopeOperatorShellNavRows(
        [...reviewNavRows, ...adminNavRows, ...systemAdminNavRows],
        auditRunId,
      ),
      patternLibraryNavVisible,
    );
    const skipProgressiveNavDensity = isWorkingMode || skipReviewLifecycleNavShaping;
    const effectiveShowFullNav = skipProgressiveNavDensity || effectiveRoleNavDensityShowFullNav;
    const firstSessionRows = filterNavGroupsForFirstSessionPilotMode(
      scopedRows,
      effectiveHasCommittedArchitectureReview,
      effectiveShowFullNav,
    );
    const allRows = filterNavGroupsByRoleDensity(
      firstSessionRows,
      roleNavDensityPersona,
      effectiveShowFullNav,
    );
    const workingFilteredRows = omitDuplicateReportingNav
      ? filterNavGroupsForWorkingProfessionalMode(allRows)
      : allRows;
    const firstSessionHiddenCount = skipProgressiveNavDensity
      ? 0
      : countNavGroupsHiddenByFirstSessionPilotMode(
        scopedRows,
        effectiveHasCommittedArchitectureReview,
        effectiveRoleNavDensityShowFullNav,
      );
    const roleNavDensityHiddenGroupCount =
      firstSessionHiddenCount
      + (skipProgressiveNavDensity
        ? 0
        : countNavGroupsHiddenByRoleDensity(
          firstSessionRows,
          roleNavDensityPersona,
          effectiveRoleNavDensityShowFullNav,
        ));

    return {
      allRows: workingFilteredRows,
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
    assignmentOverrides,
    buyerPolishedShell,
    callerAuthorityRank,
    demoUi,
    effectiveHasCommittedArchitectureReview,
    effectiveOperateUnlockPhase,
    effectiveRoleNavDensityShowFullNav,
    omitAdminClusters,
    patternLibraryNavVisible,
    productLine,
    roleNavDensityPersona,
    hideGettingStartedFromMainNav,
    isWorkingMode,
    showVendorInternalNav,
    skipReviewLifecycleNavShaping,
    omitDuplicateReportingNav,
  ]);
}
