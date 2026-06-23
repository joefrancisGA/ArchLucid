"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import { GovernanceModeToggle } from "@/components/GovernanceModeToggle";
import { SidebarRecentActivityCard } from "@/components/SidebarRecentActivityCard";
import { SidebarNavCluster } from "@/components/sidebar-nav/SidebarNavCluster";
import { OperateFeaturesUnlockPanel } from "@/components/usability/OperateFeaturesUnlockPanel";
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
import {
  isSidebarCollapsibleNavGroupId,
  sidebarNavGroupIsExpanded,
  type SidebarCollapsibleNavGroupId,
} from "@/lib/sidebar-nav-group-expansion-storage";

const FIRST_RUN_WORKFLOW_ROUTE_PREFIXES = ["/ask", "/compare"] as const;

/**
 * Grouped sidebar navigation (desktop). Review work stays open; deeper groups collapse by default
 * unless the user has saved expansion preferences.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const { showExtended, showAdvanced, setShowExtended, setShowAdvanced } = useNavProgressiveDisclosure();
  const { expansion, toggleGroupExpanded, setGroupExpanded } = useSidebarNavGroupExpansion();
  const { allRows, buyerPolishedShell, demoUi, effectiveHasCommittedArchitectureReview, effectiveOperateUnlockPhase, unlockOperateFeatures } =
    useOperatorShellNavRows();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const demoUiEnv = isOperatorDemoStaticMode() || isPublicDemoModeEnv();
  const [runtimeDemoUi, setRuntimeDemoUi] = useState(demoUiEnv);
  const resolvedDemoUi = runtimeDemoUi;
  const showSidebarCustomizationChrome =
    !resolvedDemoUi && !buyerPolishedShell && V1_SIDEBAR_CUSTOMIZATION_VISIBLE;
  const navExpanded = true;
  const navAdvanced = true;

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

    if (!onFirstRunWorkflowRoute) {
      return;
    }

    setGroupExpanded("operate-governance", false);
    setGroupExpanded("operator-admin", false);
  }, [mounted, pathname, setGroupExpanded]);

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

      <div className="mt-2 border-t border-neutral-200 px-2 pt-2 dark:border-neutral-700">
        <GovernanceModeToggle />
      </div>

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
