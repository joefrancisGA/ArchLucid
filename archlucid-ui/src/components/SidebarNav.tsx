"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import { SidebarNavCluster } from "@/components/sidebar-nav/SidebarNavCluster";
import { SidebarNavLayoutSettingsPanel } from "@/components/sidebar-nav/SidebarNavLayoutSettingsPanel";
import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { NAV_GROUPS } from "@/lib/nav-config";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import {
  countSidebarLinksRevealedByShowAllFeatures,
  listNavGroupsVisibleInOperatorShell,
} from "@/lib/nav-shell-visibility";
import { SIDEBAR_SHOW_ALL_FEATURES, V1_SIDEBAR_CUSTOMIZATION_VISIBLE } from "@/lib/nav-disclosure-copy";
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
import { resolveSidebarNavExpansionState } from "@/lib/sidebar-nav-disclosure-state";
import { OperatorAdvancedModeToggle } from "@/components/OperatorAdvancedModeToggle";
import { operateNavUnlockPhaseForAdvancedFeatures } from "@/lib/usability/operate-advanced-features-disclosure";

const SidebarRecentActivityCard = dynamic(
  () => import("@/components/SidebarRecentActivityCard").then((module) => module.SidebarRecentActivityCard),
  { loading: () => null },
);

const SIDEBAR_NAV_EXPAND_ALL_KEY = "archlucid-nav-expanded";

/**
 * Grouped sidebar navigation (desktop). Progressive disclosure: essential links always;
 * extended/advanced via toggles and per-group "N more" controls.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [navAllFeaturesExpanded, setNavAllFeaturesExpanded] = useState(false);
  const { showExtended, showAdvanced, setShowExtended, setShowAdvanced, setOperatorAdvancedMode } =
    useNavProgressiveDisclosure();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** When true, pathname-first-run nav suppression no longer hides extended/advanced links the user asked to reveal. */
  const [navDisclosurePathOverride, setNavDisclosurePathOverride] = useState(false);
  const demoUiEnv = isOperatorDemoStaticMode() || isPublicDemoModeEnv();
  const ctoDemoNavExpandedEnv =
    process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED === "true" ||
    process.env.NEXT_PUBLIC_CTO_DEMO_NAV_EXPANDED === "1";
  const [runtimeDemoUi, setRuntimeDemoUi] = useState(demoUiEnv);
  const [runtimeCtoDemoTourActive, setRuntimeCtoDemoTourActive] = useState(false);
  const demoUi = runtimeDemoUi;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showProgressiveDisclosureChrome = !demoUi && !buyerPolishedShell;
  const showSidebarCustomizationChrome = showProgressiveDisclosureChrome && V1_SIDEBAR_CUSTOMIZATION_VISIBLE;
  const { navExpanded, navAdvanced, shellShowAdvanced } = resolveSidebarNavExpansionState({
    pathname,
    showExtended,
    showAdvanced,
    navDisclosurePathOverride,
    buyerPolishedShell,
    demoUi,
    ctoDemoNavExpandedEnv,
    runtimeCtoDemoTourActive,
  });

  const applyCollapsedSidebarPilotFilter = mounted && !demoUi && !buyerPolishedShell && !navAllFeaturesExpanded;
  const extraLinksBehindCollapsedPilot = applyCollapsedSidebarPilotFilter
    ? countSidebarLinksRevealedByShowAllFeatures(
        NAV_GROUPS,
        navExpanded,
        navAdvanced,
        callerAuthorityRank,
        hasCommittedArchitectureReview,
      )
    : 0;

  useLayoutEffect(() => {
    try {
      setNavAllFeaturesExpanded(window.localStorage.getItem(SIDEBAR_NAV_EXPAND_ALL_KEY) === "true");
    } catch {
      /* private mode — keep collapsed default */
    }

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

  useEffect(() => {
    setNavDisclosurePathOverride(false);
  }, [pathname]);

  // Reload with persisted "Show all features" must restore full progressive disclosure, not only the pilot filter.
  useEffect(() => {
    if (demoUi || buyerPolishedShell || !mounted) {
      return;
    }

    if (!navAllFeaturesExpanded) {
      return;
    }

    if (!showExtended) {
      setShowExtended(true);
    }

    if (!showAdvanced) {
      setShowAdvanced(true);
    }
  }, [
    buyerPolishedShell,
    demoUi,
    mounted,
    navAllFeaturesExpanded,
    showAdvanced,
    showExtended,
    setShowAdvanced,
    setShowExtended,
  ]);

  const operatorAdvancedModeOn = showExtended && showAdvanced;

  function toggleOperatorAdvancedMode(): void {
    const next = !operatorAdvancedModeOn;

    setNavDisclosurePathOverride(next);
    setOperatorAdvancedMode(next);
    setNavAllFeaturesExpanded(next);

    try {
      window.localStorage.setItem(SIDEBAR_NAV_EXPAND_ALL_KEY, next ? "true" : "false");
    } catch {
      /* private mode */
    }
  }

  function revealHiddenLinksInGroup(groupId: string, groupSurface: string): void {
    if (groupId === "operate-governance") {
      if (!operatorAdvancedModeOn) {
        toggleOperatorAdvancedMode();
      }

      return;
    }

    setNavDisclosurePathOverride(true);

    // Extended-tier Review work links (e.g. Risk register, Scorecard) stay hidden while the
    // collapsed-pilot sidebar filter is active even after showExtended — expand that filter too.
    if (applyCollapsedSidebarPilotFilter && groupSurface === "review-workflow") {
      setNavAllFeaturesExpanded(true);

      try {
        window.localStorage.setItem(SIDEBAR_NAV_EXPAND_ALL_KEY, "true");
      } catch {
        /* private mode */
      }
    }

    if (!showExtended) {
      setShowExtended(true);

      return;
    }

    if (!showAdvanced) {
      setShowAdvanced(true);
    }
  }

  const omitAdminClusters = demoUi || buyerPolishedShell;
  const effectiveOperateUnlockPhase = mounted
    ? operateNavUnlockPhaseForAdvancedFeatures(operatorAdvancedModeOn)
    : 1;

  const reviewNavRowsRaw = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    navExpanded,
    navAdvanced,
    callerAuthorityRank,
    applyCollapsedSidebarPilotFilter,
    "review-workflow",
    hasCommittedArchitectureReview,
    effectiveOperateUnlockPhase,
  );

  const adminNavRowsRaw = omitAdminClusters
    ? ([] as NavGroupWithVisibleLinks[])
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


  const reviewNavRows = reviewNavRowsRaw;

  const adminNavRows = adminNavRowsRaw;
  const adminLinkCount = adminNavRows.reduce((sum, row) => sum + row.visibleLinks.length, 0);

  return (
    <div className="flex h-full flex-col gap-1 pb-6 pr-1">
      {showProgressiveDisclosureChrome && !showSidebarCustomizationChrome ? (
        <div className="px-2 pt-1" data-testid="sidebar-advanced-mode-wrap">
          <OperatorAdvancedModeToggle
            advancedModeOn={operatorAdvancedModeOn}
            onToggle={toggleOperatorAdvancedMode}
            testId="sidebar-operator-advanced-mode-toggle"
          />
        </div>
      ) : null}
      <SidebarRecentActivityCard />

      {reviewNavRows.map((row) => (
        <SidebarNavCluster
          key={row.group.id}
          row={row}
          pathname={pathname}
          demoUi={demoUi}
          buyerPolishedShell={buyerPolishedShell}
          hasCommittedArchitectureReview={hasCommittedArchitectureReview}
          effectiveOperateUnlockPhase={effectiveOperateUnlockPhase}
          navExpanded={navExpanded}
          navAdvanced={navAdvanced}
          callerAuthorityRank={callerAuthorityRank}
          showProgressiveDisclosureChrome={showProgressiveDisclosureChrome}
          onRevealHiddenLinks={revealHiddenLinksInGroup}
        />
      ))}

      {showSidebarCustomizationChrome ? (
        <div className="mt-2 px-2" data-testid="sidebar-collapsed-toggle-wrap">
          <button
            type="button"
            data-testid="nav-advanced-unlock"
            className="sidebar-disclosure-trigger w-full rounded-md border border-neutral-200 bg-white px-2 py-2 text-left text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800"
            aria-expanded={navAllFeaturesExpanded}
            aria-label={
              navAllFeaturesExpanded
                ? SIDEBAR_SHOW_ALL_FEATURES.hide
                : extraLinksBehindCollapsedPilot > 0
                  ? `${SIDEBAR_SHOW_ALL_FEATURES.show}, ${extraLinksBehindCollapsedPilot} more links hidden`
                  : SIDEBAR_SHOW_ALL_FEATURES.show
            }
            title={SIDEBAR_SHOW_ALL_FEATURES.title}
            onClick={() => {
              const next = !navAllFeaturesExpanded;
              setNavAllFeaturesExpanded(next);

              if (next) {
                // Expanding: one-click full sidebar — tiers and first-run path suppression.
                setNavDisclosurePathOverride(true);
                setOperatorAdvancedMode(true);
              } else {
                setNavDisclosurePathOverride(false);
                setOperatorAdvancedMode(false);
              }

              try {
                window.localStorage.setItem(SIDEBAR_NAV_EXPAND_ALL_KEY, next ? "true" : "false");
              } catch {
                /* private mode */
              }
            }}
          >
            {navAllFeaturesExpanded ? (
              SIDEBAR_SHOW_ALL_FEATURES.hide
            ) : (
              <>
                {SIDEBAR_SHOW_ALL_FEATURES.show}
                {extraLinksBehindCollapsedPilot > 0 ? (
                  <>
                    {" "}
                    <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                      {extraLinksBehindCollapsedPilot} more
                    </span>
                  </>
                ) : null}
              </>
            )}
          </button>
        </div>
      ) : null}

      {showProgressiveDisclosureChrome && adminNavRows.length > 0 ? (
        <div
          className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-700"
          data-testid="sidebar-administration-section"
        >
          <div
            className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200"
            id="sidebar-admin-section-heading"
          >
            <span>Administration</span>
            {adminLinkCount > 0 ? (
              <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                {adminLinkCount}
              </span>
            ) : null}
          </div>
          <div id="sidebar-administration-content" className="pt-1">
            <p className="m-0 px-2 pb-1 text-[10px] leading-snug text-neutral-700 dark:text-neutral-200">
              Tenant cost, support bundles, system health — separate from architecture review navigation.
            </p>
            {adminNavRows.map((row) => (
              <SidebarNavCluster
                key={row.group.id}
                row={row}
                pathname={pathname}
                demoUi={demoUi}
                buyerPolishedShell={buyerPolishedShell}
                hasCommittedArchitectureReview={hasCommittedArchitectureReview}
                effectiveOperateUnlockPhase={effectiveOperateUnlockPhase}
                navExpanded={navExpanded}
                navAdvanced={navAdvanced}
                callerAuthorityRank={callerAuthorityRank}
                showProgressiveDisclosureChrome={showProgressiveDisclosureChrome}
                onRevealHiddenLinks={revealHiddenLinksInGroup}
              />
            ))}
          </div>
        </div>
      ) : null}

      <SidebarNavLayoutSettingsPanel
        showSidebarCustomizationChrome={showSidebarCustomizationChrome}
        settingsOpen={settingsOpen}
        onSettingsOpenChange={setSettingsOpen}
        navAllFeaturesExpanded={navAllFeaturesExpanded}
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
