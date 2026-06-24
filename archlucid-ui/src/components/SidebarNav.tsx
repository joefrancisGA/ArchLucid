"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import { SidebarRecentActivityCard } from "@/components/SidebarRecentActivityCard";
import { SidebarNavCluster } from "@/components/sidebar-nav/SidebarNavCluster";
import { OperateFeaturesUnlockPanel } from "@/components/usability/OperateFeaturesUnlockPanel";
import { OperateUnlockAutoHint } from "@/components/usability/OperateUnlockAutoHint";
import { SidebarNavLayoutSettingsPanel } from "@/components/sidebar-nav/SidebarNavLayoutSettingsPanel";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { useOperatorShellNavRows } from "@/hooks/useOperatorShellNavRows";
import { useSidebarNavGroupExpansion } from "@/hooks/useSidebarNavGroupExpansion";
import { V1_SIDEBAR_CUSTOMIZATION_VISIBLE } from "@/lib/nav-disclosure-copy";
import {
  ARCHLUCID_CTO_DEMO_PANIC_CHANGED_EVENT,
  isOperatorDemoStaticMode,
  readOperatorDemoPanicOffline,
} from "@/lib/operator-static-demo";
import { isPublicDemoModeEnv } from "@/lib/public-demo-mode";
import { findSidebarNavGroupIdsForActivePath } from "@/lib/sidebar-nav-active-group-expansion";
import {
  isSidebarCollapsibleNavGroupId,
  sidebarNavGroupIsExpanded,
  type SidebarCollapsibleNavGroupId,
} from "@/lib/sidebar-nav-group-expansion-storage";

const FIRST_RUN_WORKFLOW_ROUTE_PREFIXES = ["/ask", "/compare"] as const;

/**
 * Grouped sidebar navigation (desktop). Review work defaults open; deeper groups collapse by default
 * unless the user has saved expansion preferences or the active route lives inside a group.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { showExtended, showAdvanced, setShowExtended, setShowAdvanced } = useNavProgressiveDisclosure();
  const { expansion, toggleGroupExpanded, setGroupExpanded } = useSidebarNavGroupExpansion();
  const {
    allRows,
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
  } = useOperatorShellNavRows();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const demoUiEnv = isOperatorDemoStaticMode() || isPublicDemoModeEnv();
  const [runtimeDemoUi, setRuntimeDemoUi] = useState(demoUiEnv);
  const resolvedDemoUi = runtimeDemoUi;
  const showSidebarCustomizationChrome =
    !resolvedDemoUi && !buyerPolishedShell && V1_SIDEBAR_CUSTOMIZATION_VISIBLE;

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
  }, [mounted, pathname, setGroupExpanded]);

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
        );
      })}

      <OperateFeaturesUnlockPanel phase={effectiveOperateUnlockPhase} onUnlock={unlockOperateFeatures} />

      <OperateUnlockAutoHint visible={showAutoUnlockHint} onDismiss={dismissAutoUnlockHint} />

      <SidebarNavLayoutSettingsPanel
        showSidebarCustomizationChrome={showSidebarCustomizationChrome}
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
        navAllFeaturesExpanded={navExpanded && navAdvanced}
        shellShowAdvanced={shellShowAdvanced}
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

