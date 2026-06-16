"use client";

import { ChevronDown, FileSearch, FileText, GitBranch, GitGraph, LayoutDashboard, ListChecks, Settings2 } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useState, type ReactElement } from "react";

import { BeforeAfterDeltaPanel } from "@/components/BeforeAfterDeltaPanel";
import { useDeltaQuery } from "@/components/BeforeAfterDelta/useDeltaQuery";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";
import { OperateCapabilityNavGroupHint } from "@/components/OperateCapabilityHints";
import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { GovernanceReviewsAwaitingNavBadge } from "@/components/governance/GovernanceReviewsAwaitingNavBadge";
import { NAV_GROUPS, flattenNavLinks } from "@/lib/nav-config";
import type { NavLinkItem } from "@/lib/nav-config.types";
import { onboardingTourAnchorForHref } from "@/lib/onboarding-tour";
import { NAV_DISCLOSURE, SIDEBAR_QUICK_ACTIONS_LABEL, SIDEBAR_SHOW_ALL_FEATURES, V1_SIDEBAR_CUSTOMIZATION_VISIBLE } from "@/lib/nav-disclosure-copy";
import { effectiveNavDisclosureForPathname } from "@/lib/nav-disclosure-for-path";
import {
  countLinksHiddenByProgressiveDisclosure,
  countSidebarLinksRevealedByShowAllFeatures,
  filterNavLinksForOperatorShell,
  listNavGroupsVisibleInOperatorShell,
  type NavGroupWithVisibleLinks,
} from "@/lib/nav-shell-visibility";
import { isNavLinkActive } from "@/lib/nav-link-active";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer-golden-journey-nav";
import { OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS } from "@/lib/operator-first-hour-journey-nav";
import { buyerGoldenPathSecondaryRouteHint } from "@/lib/buyer-golden-path-secondary-hint";
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
import { isOperatorNavLinkAdvancedInDemo, shouldHideOperatorNavLinkInDemo } from "@/lib/route-readiness";
import { pathnameTouchesPlatformAdminSurface } from "@/lib/platform-admin-path";
import { resolveNavLinkPresentation, resolveQuickActionNavLinkPresentation } from "@/lib/operator-nav-labels";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
import { OperateGovernanceUnlockPrompt } from "@/components/usability/OperateGovernanceUnlockPrompt";
import {
  filterNavLinksByOperateUnlockPhase,
  readOperateNavUnlockPhase,
} from "@/lib/usability/operate-nav-progressive-unlock";
import { navLinkQuestionSubtitle } from "@/lib/usability/nav-link-question-subtitles";
import { cn } from "@/lib/utils";

const STORAGE_PREFIX = "archlucid_sidebar_group_";
const RECENT_ACTIVITY_OPEN_KEY = "archlucid_sidebar_recent_activity_open";
const SIDEBAR_NAV_EXPAND_ALL_KEY = "archlucid-nav-expanded";
const SIDEBAR_ADMIN_SECTION_OPEN_KEY = "archlucid-sidebar-admin-section-open";

/** Buyer-demo golden path — single source: {@link BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS}. */
const BUYER_JOURNEY_STEP_ICONS = [LayoutDashboard, FileText, GitGraph, GitBranch, FileSearch] as const;

const BUYER_POLISHED_QUICK_ACTION_LINKS = BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS.map((def, idx) => ({
  step: def.step,
  href: def.href,
  label: def.label,
  Icon: BUYER_JOURNEY_STEP_ICONS[idx]!,
}));

const OPERATOR_FIRST_HOUR_STEP_ICONS = [FileText, ListChecks, GitBranch, FileSearch] as const;

const OPERATOR_FIRST_HOUR_QUICK_ACTION_LINKS = OPERATOR_FIRST_HOUR_JOURNEY_STEP_DEFINITIONS.map((def, idx) => ({
  step: def.step,
  href: def.href,
  label: def.label,
  Icon: OPERATOR_FIRST_HOUR_STEP_ICONS[idx]!,
}));

function presentNavLink(link: NavLinkItem, buyerPolishedShell: boolean): NavLinkItem {
  const resolved = resolveNavLinkPresentation(link, buyerPolishedShell);

  return {
    ...link,
    label: resolved.label,
    title: resolved.title,
  };
}

function presentQuickActionLink(link: NavLinkItem): NavLinkItem {
  const resolved = resolveQuickActionNavLinkPresentation(link);

  return {
    ...link,
    label: resolved.label,
    title: resolved.title,
  };
}

/** Hrefs pinned above the Governance body when they exist on `operate-governance` links in `nav-config` (may be empty). */
const GOVERNANCE_PINNED_HREFS = new Set<string>([]);

/** Alerts & governance is collapsed by default until the user explicitly opens it (localStorage "1"). */
function readGroupOpenFromStorage(groupId: string, raw: string | null): boolean {
  if (groupId === "operate-governance") {
    return raw === "1";
  }

  return raw !== "0";
}

/**
 * Collapsible "Recent activity" card at the top of the sidebar. Wraps the new
 * `BeforeAfterDeltaPanel` `sidebar` variant so the median delta on findings + time
 * is one glance away from any operator route. Open state persists in localStorage —
 * collapsed by default the very first time so the card does not push nav links down
 * for a brand-new operator with zero context.
 *
 * Hidden entirely until at least one finalized run exists (same rule as the compact
 * sidebar delta panel) so first-run tenants do not see an empty collapsible.
 */
function SidebarRecentActivityCard() {
  const { status, data } = useDeltaQuery({ count: 5 });
  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const raw = window.localStorage.getItem(RECENT_ACTIVITY_OPEN_KEY);

      setOpen(raw === "1");
    } catch {
      setOpen(false);
    }
  }, []);

  function persist(next: boolean): void {
    setOpen(next);

    try {
      window.localStorage.setItem(RECENT_ACTIVITY_OPEN_KEY, next ? "1" : "0");
    } catch {
      /* private mode */
    }
  }

  const hasDeltaData =
    status === "ready" && data !== null && data.returnedCount > 0;

  if (!hasDeltaData) {
    return null;
  }

  return (
    <Collapsible open={open} onOpenChange={persist}>
      <CollapsibleTrigger
        className="sidebar-disclosure-trigger flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
        type="button"
        aria-expanded={open}
        aria-controls="sidebar-recent-activity-content"
      >
        <span>Recent activity</span>
        <ChevronDown
          className={cn("mt-0.5 h-4 w-4 shrink-0 transition-transform", open ? "rotate-0" : "-rotate-90")}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent id="sidebar-recent-activity-content">
        <div data-testid="sidebar-recent-activity-card" className="px-2 py-2">
          <BeforeAfterDeltaPanel variant="sidebar" />
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

/**
 * Collapsible grouped sidebar navigation (desktop). Group open state persists in localStorage.
 * Progressive disclosure: essential links always; extended/advanced via toggles.
 */
export function SidebarNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [navAllFeaturesExpanded, setNavAllFeaturesExpanded] = useState(false);
  const [openByGroup, setOpenByGroup] = useState<Record<string, boolean>>({});
  const { showExtended, showAdvanced, setShowExtended, setShowAdvanced } = useNavProgressiveDisclosure();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const [settingsOpen, setSettingsOpen] = useState(false);
  /** When true, pathname-first-run nav suppression no longer hides extended/advanced links the user asked to reveal. */
  const [navDisclosurePathOverride, setNavDisclosurePathOverride] = useState(false);
  const [adminSectionOpen, setAdminSectionOpen] = useState(false);
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
  const { showExtended: shellShowExtended, showAdvanced: shellShowAdvanced } = navDisclosurePathOverride
    ? { showExtended, showAdvanced }
    : effectiveNavDisclosureForPathname(pathname, showExtended, showAdvanced);
  const ctoDemoNavExpanded = buyerPolishedShell && (ctoDemoNavExpandedEnv || runtimeCtoDemoTourActive);
  const navExpanded = ctoDemoNavExpanded ? true : buyerPolishedShell ? false : demoUi ? true : shellShowExtended;
  const navAdvanced = ctoDemoNavExpanded ? true : buyerPolishedShell ? false : demoUi ? true : shellShowAdvanced;

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

      setAdminSectionOpen(window.localStorage.getItem(SIDEBAR_ADMIN_SECTION_OPEN_KEY) === "1");
    } catch {
      /* private mode — keep collapsed default */
    }
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
    if (demoUi) {
      return;
    }

    if (pathnameTouchesPlatformAdminSurface(pathname)) {
      setAdminSectionOpen(true);
    }
  }, [demoUi, pathname]);

  useEffect(() => {
    const next: Record<string, boolean> = {};

    for (const group of NAV_GROUPS) {
      try {
        if (typeof window !== "undefined") {
          const raw = window.localStorage.getItem(STORAGE_PREFIX + group.id);
          next[group.id] = readGroupOpenFromStorage(group.id, raw);
        } else {
          next[group.id] = group.id !== "operate-governance";
        }
      } catch {
        next[group.id] = group.id !== "operate-governance";
      }
    }

    setOpenByGroup(next);
    setMounted(true);
  }, []);

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

  function setGroupOpen(groupId: string, value: boolean): void {
    setOpenByGroup((prev) => ({ ...prev, [groupId]: value }));

    try {
      window.localStorage.setItem(STORAGE_PREFIX + groupId, value ? "1" : "0");
    } catch {
      /* private mode */
    }
  }

  function revealHiddenLinksInGroup(groupId: string, groupSurface: string): void {
    setNavDisclosurePathOverride(true);
    setGroupOpen(groupId, true);

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

  function persistAdminSectionOpen(next: boolean): void {
    setAdminSectionOpen(next);

    try {
      window.localStorage.setItem(SIDEBAR_ADMIN_SECTION_OPEN_KEY, next ? "1" : "0");
    } catch {
      /* private mode */
    }
  }

  const omitAdminClusters = demoUi || buyerPolishedShell;

  const quickActionLinks = useMemo(() => {
    if (buyerPolishedShell) {
      return [] as NavLinkItem[];
    }

    const hrefs = ["/reviews/new", "/alerts", "/audit"] as const;
    const flat = flattenNavLinks();
    const candidates: NavLinkItem[] = hrefs
      .map((h) => flat.find((l) => (l.href.split("?", 1)[0] ?? "").trim() === h))
      .filter((l): l is NavLinkItem => l != null);

    let filtered = filterNavLinksForOperatorShell(
      candidates,
      navExpanded,
      navAdvanced,
      callerAuthorityRank,
      false,
      hasCommittedArchitectureReview,
    );

    if (demoUi || buyerPolishedShell) {
      filtered = filtered.filter((l) => !shouldHideOperatorNavLinkInDemo(l.href, true));
    }

    return filtered;
  }, [
    buyerPolishedShell,
    callerAuthorityRank,
    demoUi,
    hasCommittedArchitectureReview,
    navAdvanced,
    navExpanded,
  ]);

  const reviewNavRowsRaw = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    navExpanded,
    navAdvanced,
    callerAuthorityRank,
    applyCollapsedSidebarPilotFilter,
    "review-workflow",
    hasCommittedArchitectureReview,
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
      );


  const reviewNavRows = reviewNavRowsRaw;

  const adminNavRows = adminNavRowsRaw;
  const operateUnlockPhase = mounted ? readOperateNavUnlockPhase() : 2;
  // Full progressive disclosure ("Show all features") opts into governance cluster links without a separate unlock click.
  const effectiveOperateUnlockPhase = navExpanded && navAdvanced ? 2 : operateUnlockPhase;

  function renderNavLinkLabel(presented: NavLinkItem): ReactElement {
    const subtitle = navLinkQuestionSubtitle(presented.href);

    if (subtitle === null) {
      return <>{presented.label}</>;
    }

    return (
      <span className="flex min-w-0 flex-col">
        <span>{presented.label}</span>
        <span
          aria-hidden="true"
          className="text-[10px] font-normal leading-tight text-neutral-500 dark:text-neutral-400"
        >
          {subtitle}
        </span>
      </span>
    );
  }

  function renderCollapsibleNavLink(
    presented: NavLinkItem,
    options: {
      active: boolean;
      advancedDemo: boolean;
      buyerPolishedShell: boolean;
      afterLabel?: ReactElement | null;
      keyPrefix?: string;
    },
  ): ReactElement {
    const Icon = presented.icon;
    const onboardingAnchor = onboardingTourAnchorForHref(presented.href);

    return (
      <Link
        key={`${options.keyPrefix ?? ""}${presented.href}`}
        href={presented.href}
        {...(onboardingAnchor !== undefined ? { "data-onboarding": onboardingAnchor } : {})}
        className={cn(
          "shell-nav-link flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
          options.active
            ? DESIGN_TOKENS.interactive.navActive
            : "text-neutral-900 dark:text-neutral-100",
          options.buyerPolishedShell && presented.href === "/reviews/new"
            ? "font-normal text-neutral-600 dark:text-neutral-300"
            : null,
        )}
        title={
          options.advancedDemo
            ? `${presented.title} (Advanced — optional)`
            : presented.title
        }
        aria-current={options.active ? "page" : undefined}
        aria-keyshortcuts={
          presented.keyShortcut ? registryKeyToAriaKeyShortcuts(presented.keyShortcut) : undefined
        }
      >
        {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
        {renderNavLinkLabel(presented)}
        {options.afterLabel}
      </Link>
    );
  }

  function renderNavCluster({ group, visibleLinks }: NavGroupWithVisibleLinks): ReactElement {
        const linksAfterDemoFilter =
          demoUi || buyerPolishedShell
            ? visibleLinks.filter((l) => !shouldHideOperatorNavLinkInDemo(l.href, true))
            : visibleLinks;

        const linksForRender = filterNavLinksByOperateUnlockPhase(
          linksAfterDemoFilter,
          hasCommittedArchitectureReview,
          effectiveOperateUnlockPhase,
        );

        const isOpen = !mounted || openByGroup[group.id] !== false;
        const hiddenByDisclosure = countLinksHiddenByProgressiveDisclosure(
          group,
          navExpanded,
          navAdvanced,
          callerAuthorityRank,
          hasCommittedArchitectureReview,
        );

        return (
          <Collapsible
            key={group.id}
            open={isOpen}
            onOpenChange={(next) => {
              setGroupOpen(group.id, next);
            }}
          >
            <CollapsibleTrigger
              className="sidebar-disclosure-trigger flex w-full items-start justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold uppercase tracking-wide text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              title={group.caption}
              type="button"
              aria-expanded={isOpen}
              aria-controls={`sidebar-group-${group.id}-content`}
              aria-labelledby={`sidebar-group-trigger-title-${group.id}`}
              aria-describedby={group.id === "operate-governance" ? "sidebar-governance-nav-hint-slot" : undefined}
              {...(group.id === "pilot" ? { "data-onboarding": "tour-nav-settings" } : {})}
            >
              <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
                <span id={`sidebar-group-trigger-title-${group.id}`}>
                  {group.id === "pilot" && buyerPolishedShell ? "Reviews" : group.label}
                </span>
                {group.id === "operate-governance" ? (
                  <span id="sidebar-governance-nav-hint-slot">
                    <OperateCapabilityNavGroupHint />
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className={cn("mt-0.5 h-4 w-4 shrink-0 transition-transform", isOpen ? "rotate-0" : "-rotate-90")}
                aria-hidden
              />
            </CollapsibleTrigger>
            {group.id === "operate-governance" ? (
              <nav
                className="flex flex-col gap-0.5 border-l border-neutral-200 py-1 pl-2 dark:border-neutral-700"
                aria-label="Governance — pinned links"
              >
                {linksForRender
                  .filter((link) => GOVERNANCE_PINNED_HREFS.has(link.href))
                  .map((link) => {
                    const presented = presentNavLink(link, buyerPolishedShell);
                    const active = isNavLinkActive(pathname, presented.href);
                    const advancedDemo = isOperatorNavLinkAdvancedInDemo(presented.href, demoUi || buyerPolishedShell);

                    return renderCollapsibleNavLink(presented, {
                      active,
                      advancedDemo,
                      buyerPolishedShell,
                      keyPrefix: "pinned-",
                    });
                  })}
              </nav>
            ) : null}
            <CollapsibleContent id={`sidebar-group-${group.id}-content`}>
              <nav
                className="flex flex-col gap-0.5 border-l border-neutral-200 py-1 pl-2 dark:border-neutral-700"
                aria-label={group.label}
              >
                {linksForRender
                  .filter(
                    (link) =>
                      group.id !== "operate-governance" || !GOVERNANCE_PINNED_HREFS.has(link.href),
                  )
                  .map((link) => {
                  const presented = presentNavLink(link, buyerPolishedShell);
                  const active = isNavLinkActive(pathname, presented.href);
                  const advancedDemo = isOperatorNavLinkAdvancedInDemo(presented.href, demoUi || buyerPolishedShell);

                  return renderCollapsibleNavLink(presented, {
                    active,
                    advancedDemo,
                    buyerPolishedShell,
                    afterLabel:
                      presented.href === "/governance" ? <GovernanceReviewsAwaitingNavBadge /> : null,
                  });
                })}
              </nav>
            </CollapsibleContent>
            {showProgressiveDisclosureChrome && hiddenByDisclosure > 0 ? (
              <button
                type="button"
                className="auth-panel-focus sidebar-disclosure-trigger ml-2 mt-1 flex items-center gap-1 text-left text-xs font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-neutral-50"
                aria-label={`Show ${hiddenByDisclosure} more destinations in ${group.label}`}
                onClick={() => {
                  revealHiddenLinksInGroup(group.id, group.surface);
                }}
              >
                <ChevronDown className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                {group.id === "operate-analysis"
                  ? `${hiddenByDisclosure} more`
                  : group.id === "operate-governance"
                    ? `${hiddenByDisclosure} more`
                    : group.id === "operator-admin"
                      ? `${hiddenByDisclosure} more`
                      : group.id === "pilot"
                        ? `${hiddenByDisclosure} more`
                        : `${hiddenByDisclosure} more`}
              </button>
            ) : null}
          </Collapsible>
        );
  }

  const adminLinkCount = adminNavRows.reduce((sum, row) => sum + row.visibleLinks.length, 0);
  const buyerSecondaryRouteHint =
    buyerPolishedShell && pathname !== null ? buyerGoldenPathSecondaryRouteHint(pathname) : null;

  return (
    <div className="flex h-full flex-col gap-1 pb-6 pr-1">
      <OperateGovernanceUnlockPrompt />
      <SidebarRecentActivityCard />

      {mounted && (buyerPolishedShell || quickActionLinks.length > 0 || !buyerPolishedShell) ? (
        <div
          className="px-2 py-2"
          data-testid="sidebar-quick-actions"
          aria-label={buyerPolishedShell ? "Review journey" : "First-hour path"}
        >
          <p className="m-0 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
            {buyerPolishedShell ? "Review journey" : "First-hour path"}
          </p>
          <nav
            className="flex flex-col gap-0.5 border-l-2 border-neutral-200 py-1 pl-2 dark:border-neutral-800"
            aria-label="Quick action destinations"
          >
            {buyerPolishedShell
              ? BUYER_POLISHED_QUICK_ACTION_LINKS.map((row) => {
                  const active = isNavLinkActive(pathname, row.href);
                  const Icon = row.Icon;
                  const advancedDemo = isOperatorNavLinkAdvancedInDemo(row.href, demoUi || buyerPolishedShell);
                  const stepLabel = `${row.step}. ${row.label}`;

                  return (
                    <Link
                      key={row.href}
                      href={row.href}
                      className={cn(
                        "shell-nav-link flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                        active
                          ? DESIGN_TOKENS.interactive.navActive
                          : "text-neutral-900 dark:text-neutral-100",
                      )}
                      title={advancedDemo ? `${stepLabel} (Advanced — optional)` : stepLabel}
                      aria-current={active ? "page" : undefined}
                    >
                      <span
                        className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100"
                        aria-hidden
                      >
                        {row.step}
                      </span>
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      {row.label}
                    </Link>
                  );
                })
              : OPERATOR_FIRST_HOUR_QUICK_ACTION_LINKS.map((row) => {
                  const active = isNavLinkActive(pathname, row.href);
                  const Icon = row.Icon;
                  const stepLabel = `${row.step}. ${row.label}`;

                  return (
                    <Link
                      key={`first-hour-step-${row.step}`}
                      href={row.href}
                      className={cn(
                        "shell-nav-link flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                        active
                          ? DESIGN_TOKENS.interactive.navActive
                          : "text-neutral-900 dark:text-neutral-100",
                      )}
                      title={stepLabel}
                      aria-current={active ? "page" : undefined}
                    >
                      <span
                        className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-200 text-[10px] font-bold text-neutral-800 dark:bg-neutral-700 dark:text-neutral-100"
                        aria-hidden
                      >
                        {row.step}
                      </span>
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                      {row.label}
                    </Link>
                  );
                })}
          </nav>
          {buyerSecondaryRouteHint !== null ? (
            <p
              className="m-0 mt-2 text-[11px] leading-snug text-neutral-600 dark:text-neutral-400"
              data-testid="sidebar-secondary-route-hint"
            >
              {buyerSecondaryRouteHint}
            </p>
          ) : null}
        </div>
      ) : null}

      {buyerPolishedShell ? (
        <nav
          className="px-2 pb-1 pt-2"
          aria-label="Support"
          data-testid="sidebar-buyer-help-link"
        >
          <Link
            href="/help"
            className={cn(
              "shell-nav-link flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
              isNavLinkActive(pathname, "/help")
                ? DESIGN_TOKENS.interactive.navActive
                : "text-neutral-900 dark:text-neutral-100",
            )}
            aria-current={isNavLinkActive(pathname, "/help") ? "page" : undefined}
          >
            Help
          </Link>
        </nav>
      ) : reviewNavRows.map((row) => renderNavCluster(row))}

      {showSidebarCustomizationChrome ? (
        <div className="mt-2 px-2" data-testid="sidebar-collapsed-toggle-wrap">
          <button
            type="button"
            data-testid="sidebar-show-all-features-toggle"
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
                setShowExtended(true);
                setShowAdvanced(true);
              } else {
                setNavDisclosurePathOverride(false);
                setShowExtended(false);
                setShowAdvanced(false);
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
          <Collapsible open={adminSectionOpen} onOpenChange={persistAdminSectionOpen}>
            <CollapsibleTrigger
              className="sidebar-disclosure-trigger flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700 hover:bg-neutral-100 dark:text-neutral-200 dark:hover:bg-neutral-800"
              type="button"
              aria-expanded={adminSectionOpen}
              aria-controls="sidebar-administration-content"
              aria-labelledby="sidebar-admin-section-heading"
            >
              <span id="sidebar-admin-section-heading">Administration</span>
              <span className="flex items-center gap-1">
                {adminLinkCount > 0 ? (
                  <span className="rounded bg-neutral-200 px-1.5 py-0.5 text-[10px] font-semibold text-neutral-700 dark:bg-neutral-700 dark:text-neutral-200">
                    {adminLinkCount}
                  </span>
                ) : null}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 transition-transform",
                    adminSectionOpen ? "rotate-0" : "-rotate-90",
                  )}
                  aria-hidden
                />
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent id="sidebar-administration-content" className="pt-1">
              <p className="m-0 px-2 pb-1 text-[10px] leading-snug text-neutral-700 dark:text-neutral-200">
                Tenant cost, support bundles, system health — separate from architecture review navigation.
              </p>
              {adminNavRows.map((row) => renderNavCluster(row))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      ) : null}

      {showSidebarCustomizationChrome ? (
      <div className="mt-2 border-t border-neutral-200 pt-3 dark:border-neutral-700">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="sidebar-disclosure-trigger w-full justify-start gap-2 text-xs text-neutral-800 dark:text-neutral-200"
          data-onboarding="tour-nav-settings"
          aria-haspopup="dialog"
          aria-expanded={settingsOpen}
          onClick={() => {
            setSettingsOpen(true);
          }}
        >
          <Settings2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          Sidebar layout
        </Button>

        {!navAllFeaturesExpanded ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="sidebar-disclosure-trigger mt-2 w-full justify-start px-3 py-2 text-left text-xs font-medium text-neutral-900 shadow-none hover:bg-neutral-50 dark:border-neutral-700 dark:text-neutral-100 dark:hover:bg-neutral-800"
          data-testid="sidebar-show-advanced-operations-toggle"
          aria-pressed={shellShowAdvanced}
          aria-label={
            shellShowAdvanced
              ? NAV_DISCLOSURE.advancedOperationsSidebar.hide
              : `${NAV_DISCLOSURE.advancedOperationsSidebar.show}. ${NAV_DISCLOSURE.advancedOperationsSidebar.assistiveCollapsed}`
          }
          onClick={() => {
            setShowAdvanced(!showAdvanced);
          }}
        >
          {shellShowAdvanced
            ? NAV_DISCLOSURE.advancedOperationsSidebar.hide
            : NAV_DISCLOSURE.advancedOperationsSidebar.show}
        </Button>
        ) : null}
      </div>
      ) : null}

      {showSidebarCustomizationChrome ? (
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-md" data-testid="sidebar-layout-settings-dialog">
          <DialogHeader>
            <DialogTitle>Sidebar layout</DialogTitle>
            <DialogDescription>
              Control which sidebar links appear by progressive disclosure tier. The same destination list also
              respects optional minimum API access-level hints (Read / Operator / Admin) when the shell can resolve your
              principal via <code className="text-xs">GET /api/auth/me</code>; the command palette (Ctrl+K) uses the
              same tier + access-level composition (see <code className="text-xs">nav-shell-visibility.ts</code>).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="nav-extended">{NAV_DISCLOSURE.extended.show}</Label>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  <strong>Advanced Analysis:</strong> compare, replay, graph, architecture advisory, pilot feedback,
                  recommendation tuning.{" "}
                  <strong>Admin:</strong> tenant cost, baseline and tenant settings.{" "}
                  <strong>Enterprise Controls:</strong> policy packs, governance dashboard, governance resolution.
                </p>
              </div>
              <input
                id="nav-extended"
                data-testid="sidebar-layout-nav-extended"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600 dark:border-neutral-600"
                aria-label={NAV_DISCLOSURE.extended.show}
                title={NAV_DISCLOSURE.extended.title}
                checked={showExtended}
                onChange={(e) => {
                  setShowExtended(e.target.checked);
                }}
              />
            </div>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-0.5">
                <Label htmlFor="nav-advanced">{NAV_DISCLOSURE.advanced.show}</Label>
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  <strong>Enterprise Controls:</strong> audit log, Alerts hub, governance workflow, schedules, and deeper
                  trust surfaces — independent from analysis & investigation links.
                </p>
              </div>
              <input
                id="nav-advanced"
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-neutral-300 text-teal-700 focus:ring-teal-600 dark:border-neutral-600"
                title={NAV_DISCLOSURE.advanced.title}
                checked={showAdvanced}
                onChange={(e) => {
                  setShowAdvanced(e.target.checked);
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
      ) : null}
    </div>
  );
}
