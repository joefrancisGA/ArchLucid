"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import { SidebarNavCluster } from "@/components/sidebar-nav/SidebarNavCluster";
import { SidebarNavLayoutSettingsPanel } from "@/components/sidebar-nav/SidebarNavLayoutSettingsPanel";
import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { useSidebarNavGroupExpansion } from "@/hooks/useSidebarNavGroupExpansion";
import { NAV_GROUPS } from "@/lib/nav-config";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { V1_SIDEBAR_CUSTOMIZATION_VISIBLE } from "@/lib/nav-disclosure-copy";
import {
  ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT,
  readBuyerCtoDemoTourActive,
} from "@/lib/buyer-cto-demo-tour";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import {
  ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT,
  isOperatorDemoStaticMode,
  readOperatorDemoPanicOffline,
} from "@/lib/operator-static-demo";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import {
  isSidebarCollapsibleNavGroupId,
  sidebarNavGroupIsExpanded,
  type SidebarCollapsibleNavGroupId,
} from "@/lib/sidebar-nav-group-expansion-storage";

const SidebarRecentActivityCard = dynamic(
  () => import("@/components/SidebarRecentActivityCard").then((module) => module.SidebarRecentActivityCard),
  { loading: () => null },
);

/**
 * Grouped sidebar navigation (desktop). Review work stays open; deeper groups collapse by default
 * unless the user has saved expansion preferences.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { showExtended, showAdvanced, setShowExtended, setShowAdvanced } = useNavProgressiveDisclosure();
  const { expansion, toggleGroupExpanded } = useSidebarNavGroupExpansion();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const demoUiEnv = isOperatorDemoStaticMode() || isPublicDemoModeEnv();
  const [runtimeDemoUi, setRuntimeDemoUi] = useState(demoUiEnv);
  const [runtimeCtoDemoTourActive, setRuntimeCtoDemoTourActive] = useState(false);
  const demoUi = runtimeDemoUi;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showSidebarCustomizationChrome =
    !demoUi && !buyerPolishedShell && V1_SIDEBAR_CUSTOMIZATION_VISIBLE;

  useLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function refreshRuntimeDemoState(): void {
      setRuntimeDemoUi(demoUiEnv || readOperatorDemoPanicOffline());
      setRuntimeCtoDemoTourActive(readBuyerCtoDemoTourActive());
    }

    refreshRuntimeDemoState();
    window.addEventListener(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, refreshRuntimeDemoState);
    window.addEventListener(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT, refreshRuntimeDemoState);
    window.addEventListener("storage", refreshRuntimeDemoState);

    return () => {
      window.removeEventListener(ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT, refreshRuntimeDemoState);
      window.removeEventListener(ARCHLUCID_BUYER_CTO_DEMO_TOUR_START_EVENT, refreshRuntimeDemoState);
      window.removeEventListener("storage", refreshRuntimeDemoState);
    };
  }, [demoUiEnv]);

  const omitAdminClusters = demoUi && !buyerPolishedShell;
  const navExpanded = true;
  const navAdvanced = true;
  const effectiveOperateUnlockPhase = 2 as const;

  const reviewNavRows = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    navExpanded,
    navAdvanced,
    callerAuthorityRank,
    false,
    "review-workflow",
    hasCommittedArchitectureReview,
    effectiveOperateUnlockPhase,
  );

  const adminNavRows: NavGroupWithVisibleLinks[] =
    omitAdminClusters
      ? []
      : listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          navExpanded,
          navAdvanced,
          callerAuthorityRank,
          false,
          "platform-admin",
          hasCommittedArchitectureReview,
          effectiveOperateUnlockPhase,
        );

  const allRows = [...reviewNavRows, ...adminNavRows];

  return (
    <div className="flex min-h-0 flex-col gap-0 pb-2">
      <SidebarRecentActivityCard />

      {allRows.map((row) => {
        const collapsible = isSidebarCollapsibleNavGroupId(row.group.id);
        const isExpanded = mounted
          ? sidebarNavGroupIsExpanded(row.group.id, expansion)
          : row.group.id === "pilot";

        return (
          <SidebarNavCluster
            key={row.group.id}
            row={row}
            pathname={pathname}
            demoUi={demoUi}
            buyerPolishedShell={buyerPolishedShell}
            hasCommittedArchitectureReview={hasCommittedArchitectureReview}
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
        );
      })}

      <SidebarNavLayoutSettingsPanel
        showSidebarCustomizationChrome={showSidebarCustomizationChrome}
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
        navAllFeaturesExpanded={navExpanded && navAdvanced}
        shellShowAdvanced={navAdvanced}
        showExtended={showExtended}
        showAdvanced={showAdvanced}
        onToggleShowAdvanced={() => {
          setShowAdvanced(!showAdvanced);
        }}
        onShowExtendedChange={setShowExtended}
        onShowAdvancedChange={setShowAdvanced}
      />
    </div>
  );
}
