"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useState } from "react";

import { SidebarAdministrationSection } from "@/components/sidebar-nav/SidebarAdministrationSection";
import { SidebarGovernanceDisclosureSection } from "@/components/sidebar-nav/SidebarGovernanceDisclosureSection";
import { SidebarNavCluster } from "@/components/sidebar-nav/SidebarNavCluster";
import { SidebarNavLayoutSettingsPanel } from "@/components/sidebar-nav/SidebarNavLayoutSettingsPanel";
import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { useSidebarAdministrationVisibility } from "@/hooks/useSidebarAdministrationVisibility";
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
import { operateNavUnlockPhaseForAdvancedFeatures } from "@/lib/usability/operate-advanced-features-disclosure";

const SidebarRecentActivityCard = dynamic(
  () => import("@/components/SidebarRecentActivityCard").then((module) => module.SidebarRecentActivityCard),
  { loading: () => null },
);

const SIDEBAR_NAV_EXPAND_ALL_KEY = "archlucid-nav-expanded";
/** Session-only: Review work "N more" expands collapsed pilot without enabling advanced Operate nav. */
const SIDEBAR_COLLAPSED_PILOT_EXPANDED_KEY = "archlucid-nav-collapsed-pilot-expanded";

/**
 * Grouped sidebar navigation (desktop). Progressive disclosure: essential links always;
 * extended/advanced via toggles and per-group "N more" controls.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [navAllFeaturesExpanded, setNavAllFeaturesExpanded] = useState(false);
  const [collapsedPilotExpanded, setCollapsedPilotExpanded] = useState(false);
  const { showExtended, showAdvanced, setShowExtended, setShowAdvanced, setOperatorAdvancedMode } =
    useNavProgressiveDisclosure();
  const { showAdministration, setShowAdministration } = useSidebarAdministrationVisibility();
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

  const applyCollapsedSidebarPilotFilter =
    mounted && !demoUi && !buyerPolishedShell && !navAllFeaturesExpanded && !collapsedPilotExpanded;
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
      setCollapsedPilotExpanded(window.localStorage.getItem(SIDEBAR_COLLAPSED_PILOT_EXPANDED_KEY) === "true");
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
      setCollapsedPilotExpanded(true);

      try {
        window.localStorage.setItem(SIDEBAR_COLLAPSED_PILOT_EXPANDED_KEY, "true");
      } catch {
        /* private mode */
      }
    }

    if (!showExtended) {
      setShowExtended(true);

      return;
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

  const adminNavRowsRaw =
    omitAdminClusters || !showAdministration
      ? ([] as NavGroupWithVisibleLinks[])
      : listNavGroupsVisibleInOperatorShell(
          NAV_GROUPS,
          true,
          false,
          callerAuthorityRank,
          false,
          "platform-admin",
          hasCommittedArchitectureReview,
          effectiveOperateUnlockPhase,
        );

  const adminNavRowsCandidate = omitAdminClusters
    ? ([] as NavGroupWithVisibleLinks[])
    : listNavGroupsVisibleInOperatorShell(
        NAV_GROUPS,
        true,
        false,
        callerAuthorityRank,
        false,
        "platform-admin",
        hasCommittedArchitectureReview,
        effectiveOperateUnlockPhase,
      );

  const reviewNavRows = reviewNavRowsRaw;

  const adminNavRows = adminNavRowsRaw;

  const governanceDisclosureVisible =
    showProgressiveDisclosureChrome &&
    !operatorAdvancedModeOn &&
    listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      true,
      true,
      callerAuthorityRank,
      false,
      "review-workflow",
      hasCommittedArchitectureReview,
      2,
    ).some((row) => row.group.id === "operate-governance" && row.visibleLinks.length > 0);

  return (
    <div className="flex h-full flex-col gap-1 pb-6 pr-1">
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

      {governanceDisclosureVisible ? (
        <SidebarGovernanceDisclosureSection onRevealGovernance={toggleOperatorAdvancedMode} />
      ) : null}

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

      {showProgressiveDisclosureChrome && adminNavRowsCandidate.length > 0 ? (
        <SidebarAdministrationSection
          showAdministration={showAdministration}
          onShowAdministrationChange={setShowAdministration}
          adminNavRows={showAdministration ? adminNavRows : adminNavRowsCandidate}
          pathname={pathname}
          demoUi={demoUi}
          buyerPolishedShell={buyerPolishedShell}
          hasCommittedArchitectureReview={hasCommittedArchitectureReview}
          effectiveOperateUnlockPhase={effectiveOperateUnlockPhase}
        />
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
