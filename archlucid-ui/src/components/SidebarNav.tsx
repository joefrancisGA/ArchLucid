"use client";

import { usePathname } from "next/navigation";
import { Fragment, useEffect, useLayoutEffect, useState } from "react";

import { SidebarRecentActivityCard } from "@/components/SidebarRecentActivityCard";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { SidebarNavCluster } from "@/components/sidebar-nav/SidebarNavCluster";
import { RoleNavDensityExpandControl } from "@/components/sidebar-nav/RoleNavDensityExpandControl";
import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { useOperatorShellNavRows } from "@/hooks/useOperatorShellNavRows";
import { useSidebarNavGroupExpansion } from "@/hooks/useSidebarNavGroupExpansion";
import {
  ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT,
  isOperatorDemoStaticMode,
  readOperatorDemoPanicOffline,
} from "@/lib/operator/operator-static-demo";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import { findSidebarNavGroupIdsForActivePath } from "@/lib/sidebar-nav-active-group-expansion";
import { applyBuyerDemoSecondaryNavCollapse } from "@/lib/sidebar-nav-buyer-demo-collapse";
import {
  isSidebarCollapsibleNavGroupId,
  sidebarNavGroupIsExpanded,
  type SidebarCollapsibleNavGroupId,
} from "@/lib/sidebar-nav-group-expansion-storage";

const FIRST_RUN_WORKFLOW_ROUTE_PREFIXES = ["/insights/ask-review-questions", "/insights/compare-two-reviews"] as const;

/**
 * Grouped sidebar navigation (desktop). Architecture defaults open; deeper groups collapse by default
 * unless the user has saved expansion preferences or the active route lives inside a group.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { isGovernanceModeEnabled } = useGovernanceMode();
  const { expansion, toggleGroupExpanded, setGroupExpanded } = useSidebarNavGroupExpansion();
  const {
    allRows,
    buyerPolishedShell,
    demoUi,
    effectiveHasCommittedArchitectureReview,
    effectiveOperateUnlockPhase,
    roleNavDensityHiddenGroupCount,
    roleNavDensityShowFullNav,
    toggleRoleNavDensityShowFullNav,
  } = useOperatorShellNavRows();
  const demoUiEnv = isOperatorDemoStaticMode() || isPublicDemoModeEnv();
  const [runtimeDemoUi, setRuntimeDemoUi] = useState(demoUiEnv);
  const resolvedDemoUi = runtimeDemoUi;

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function refreshRuntimeDemoState(): void {
      setRuntimeDemoUi(demoUiEnv || readOperatorDemoPanicOffline());
    }

    refreshRuntimeDemoState();
    window.addEventListener(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, refreshRuntimeDemoState);
    window.addEventListener("storage", refreshRuntimeDemoState);

    return () => {
      window.removeEventListener(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, refreshRuntimeDemoState);
      window.removeEventListener("storage", refreshRuntimeDemoState);
    };
  }, [demoUiEnv]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const route = pathname ?? "";
    const onFirstRunWorkflowRoute = FIRST_RUN_WORKFLOW_ROUTE_PREFIXES.some((prefix) => route.startsWith(prefix));

    if (onFirstRunWorkflowRoute) {
      setGroupExpanded("operate-governance", false);
      setGroupExpanded("operator-admin", false);
    }

    // Buyer/demo Overview: keep Integrations + Administration collapsed unless the route is inside them.
    applyBuyerDemoSecondaryNavCollapse({
      pathname: route,
      buyerPolishedShell,
      demoUi: resolvedDemoUi,
      setGroupExpanded,
    });
  }, [mounted, pathname, setGroupExpanded, buyerPolishedShell, resolvedDemoUi]);

  useEffect(() => {
    if (!mounted) {
      return;
    }

    const activeGroupIds = findSidebarNavGroupIdsForActivePath(allRows, pathname ?? "/");

    for (const groupId of activeGroupIds) {
      setGroupExpanded(groupId, true);
    }
  }, [allRows, mounted, pathname, setGroupExpanded]);

  return (
    <div className="flex min-h-0 flex-col gap-0 pb-2">
      <div className="flex items-center justify-end px-2 pt-1">
        <FieldHelpTooltip
          label="Sidebar navigation"
          hint="Groups match the sections in the address bar — Architecture for reviews, Approval for governance, Insights for analysis, and Administration for workspace settings."
          side="right"
          className="shrink-0"
        />
      </div>
      <SidebarRecentActivityCard />

      {allRows.map((row) => {
        const collapsible = isSidebarCollapsibleNavGroupId(row.group.id);
        const isExpanded = mounted
          ? sidebarNavGroupIsExpanded(row.group.id, expansion)
          : row.group.id === "pilot";

        return (
          <Fragment key={row.group.id}>
            <SidebarNavCluster
              row={row}
              pathname={pathname}
              demoUi={demoUi}
              buyerPolishedShell={buyerPolishedShell}
              isGovernanceModeEnabled={isGovernanceModeEnabled}
              hasCommittedArchitectureReview={effectiveHasCommittedArchitectureReview}
              effectiveOperateUnlockPhase={effectiveOperateUnlockPhase}
              isCollapsible={collapsible}
              isExpanded={isExpanded}
              onToggleExpanded={
                collapsible
                  ? () => {
                      toggleGroupExpanded(row.group.id as SidebarCollapsibleNavGroupId);
                    }
                  : undefined
              }
            />
          </Fragment>
        );
      })}

      <RoleNavDensityExpandControl
        hiddenGroupCount={roleNavDensityHiddenGroupCount}
        showFullNav={roleNavDensityShowFullNav}
        onToggle={toggleRoleNavDensityShowFullNav}
      />
    </div>
  );
}

