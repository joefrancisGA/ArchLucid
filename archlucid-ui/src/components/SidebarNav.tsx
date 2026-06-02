"use client";

import { ChevronDown, FileSearch, FileText, GitBranch, GitGraph, LayoutDashboard, Settings2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { OperateCapabilityNavGroupHint } from "@/components/OperateCapabilityHints";
import { useNavCallerAuthorityRank, useNavCommittedArchitectureReview } from "@/components/OperatorNavAuthorityProvider";
import { useNavProgressiveDisclosure } from "@/hooks/useNavProgressiveDisclosure";
import { DESIGN_TOKENS } from "@/lib/design-tokens";
import { fetchCorePilotCommitContext } from "@/lib/core-pilot-commit-context";
import { NAV_GROUPS, flattenNavLinks } from "@/lib/nav-config";
import type { NavLinkItem } from "@/lib/nav-config.types";
import { onboardingTourAnchorForHref } from "@/lib/onboarding-tour";
import { NAV_DISCLOSURE } from "@/lib/nav-disclosure-copy";
import { effectiveNavDisclosureForPathname } from "@/lib/nav-disclosure-for-path";
import {
  OPERATOR_SHELL_PRESET_DEFAULT_ID,
  OPERATOR_SHELL_PRESET_ORDER,
  OPERATOR_SHELL_PRESET_STORAGE_KEY,
  isOperatorShellPresetId,
  operatorShellPresetAllowsHref,
  type OperatorShellPresetId,
} from "@/lib/operator-nav-preset";
import {
  countLinksHiddenByProgressiveDisclosure,
  countSidebarLinksRevealedByShowAllFeatures,
  filterNavLinksForOperatorShell,
  listNavGroupsVisibleInOperatorShell,
  type NavGroupWithVisibleLinks,
} from "@/lib/nav-shell-visibility";
import { isNavLinkActive } from "@/lib/nav-link-active";
import { BUYER_GOLDEN_JOURNEY_STEP_DEFINITIONS } from "@/lib/buyer-golden-journey-nav";
import { buyerGoldenPathSecondaryRouteHint } from "@/lib/buyer-golden-path-secondary-hint";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { isOperatorNavLinkAdvancedInDemo, shouldHideOperatorNavLinkInDemo } from "@/lib/route-readiness";
import { pathnameTouchesPlatformAdminSurface } from "@/lib/platform-admin-path";
import { registryKeyToAriaKeyShortcuts } from "@/lib/shortcut-registry";
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

const OPERATOR_SHELL_PRESET_LABELS: Record<OperatorShellPresetId, string> = {

  full: "Full navigator",

  pilot_operator: "Pilot operator",

  governance_reviewer: "Governance reviewer",

  analytics_investigator: "Analytics investigator",

};

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
  const [shellPresetId, setShellPresetId] = useState<OperatorShellPresetId>(OPERATOR_SHELL_PRESET_DEFAULT_ID);
  /**
   * The preset that was active before "Show all features" upgraded it to "full".
   * Restored when the user clicks "Fewer sidebar links" so collapsing actually removes links.
   */
  const [preExpandPresetId, setPreExpandPresetId] = useState<OperatorShellPresetId>(OPERATOR_SHELL_PRESET_DEFAULT_ID);
  const demoUi = isStaticDemoPayloadFallbackEnabled();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const showProgressiveDisclosureChrome = !demoUi && !buyerPolishedShell;
  const { showExtended: shellShowExtended, showAdvanced: shellShowAdvanced } = navDisclosurePathOverride
    ? { showExtended, showAdvanced }
    : effectiveNavDisclosureForPathname(pathname, showExtended, showAdvanced);
  const navExtended = buyerPolishedShell ? false : demoUi ? true : shellShowExtended;
  const navAdvanced = buyerPolishedShell ? false : demoUi ? true : shellShowAdvanced;
  const effectiveShellPresetId: OperatorShellPresetId = buyerPolishedShell || demoUi ? "full" : shellPresetId;

  const applyCollapsedSidebarPilotFilter = mounted && !demoUi && !buyerPolishedShell && !navAllFeaturesExpanded;
  const extraLinksBehindCollapsedPilot = applyCollapsedSidebarPilotFilter
    ? countSidebarLinksRevealedByShowAllFeatures(
        NAV_GROUPS,
        navExtended,
        navAdvanced,
        callerAuthorityRank,
        hasCommittedArchitectureReview,
        effectiveShellPresetId,
      )
    : 0;

  useLayoutEffect(() => {
    try {
      const rawPreset = window.localStorage.getItem(OPERATOR_SHELL_PRESET_STORAGE_KEY);

      if (rawPreset !== null && isOperatorShellPresetId(rawPreset)) {


        setShellPresetId(rawPreset);
      }


      setNavAllFeaturesExpanded(window.localStorage.getItem(SIDEBAR_NAV_EXPAND_ALL_KEY) === "true");


      setAdminSectionOpen(window.localStorage.getItem(SIDEBAR_ADMIN_SECTION_OPEN_KEY) === "1");
    } catch {
      /* private mode — keep collapsed default */
    }
  }, []);

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
    if (demoUi || buyerPolishedShell) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        if (typeof window === "undefined") {
          return;
        }

        const raw = window.localStorage.getItem(OPERATOR_SHELL_PRESET_STORAGE_KEY);

        if (raw !== null && isOperatorShellPresetId(raw)) {
          return;
        }

        const ctx = await fetchCorePilotCommitContext();

        if (cancelled) {
          return;
        }

        const rawAfter = window.localStorage.getItem(OPERATOR_SHELL_PRESET_STORAGE_KEY);

        if (rawAfter !== null && isOperatorShellPresetId(rawAfter)) {
          return;
        }

        if (!ctx.hasCommittedManifest) {
          setShellPresetId("pilot_operator");

          try {
            window.localStorage.setItem(OPERATOR_SHELL_PRESET_STORAGE_KEY, "pilot_operator");
          } catch {
            /* private mode */
          }
        }
      } catch {
        /* ignore: preset stays full until the user chooses Navigation settings */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [buyerPolishedShell, demoUi]);

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

      setPreExpandPresetId(shellPresetId);

      if (effectiveShellPresetId !== "full") {
        persistShellPreset("full");
      }

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

      if (!operatorShellPresetAllowsHref(effectiveShellPresetId, "/governance")) {
        persistShellPreset("full");
      }
    }
  }

  function persistShellPreset(next: OperatorShellPresetId): void {
    setShellPresetId(next);


    try {
      window.localStorage.setItem(OPERATOR_SHELL_PRESET_STORAGE_KEY, next);
    } catch {
      /* private mode */
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

  function filterClustersByPreset(clusters: NavGroupWithVisibleLinks[]): NavGroupWithVisibleLinks[] {
    if (demoUi || effectiveShellPresetId === "full") {


      return clusters;
    }

    return clusters
      .map((row) => ({
        ...row,
        visibleLinks: row.visibleLinks.filter((l) => operatorShellPresetAllowsHref(effectiveShellPresetId, l.href)),
      }))
      .filter((row) => row.visibleLinks.length > 0);
  }

  const omitAdminClusters =
    demoUi ||
    buyerPolishedShell ||
    shellPresetId === "pilot_operator" ||
    shellPresetId === "analytics_investigator";


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
      navExtended,
      navAdvanced,
      callerAuthorityRank,
      false,
      hasCommittedArchitectureReview,
    );

    if (demoUi || buyerPolishedShell) {
      filtered = filtered.filter((l) => !shouldHideOperatorNavLinkInDemo(l.href, true));
    }

    if (!demoUi && mounted) {
      filtered = filtered.filter((l) => operatorShellPresetAllowsHref(effectiveShellPresetId, l.href));
    }

    return filtered;
  }, [
    buyerPolishedShell,
    callerAuthorityRank,
    demoUi,
    effectiveShellPresetId,
    hasCommittedArchitectureReview,
    mounted,
    navAdvanced,
    navExtended,
  ]);

  const reviewNavRowsRaw = listNavGroupsVisibleInOperatorShell(
    NAV_GROUPS,
    navExtended,
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
        navExtended,
        navAdvanced,
        callerAuthorityRank,
        false,
        "platform-admin",
        hasCommittedArchitectureReview,
      );


  const reviewNavRows = filterClustersByPreset(reviewNavRowsRaw);


  const adminNavRows = filterClustersByPreset(adminNavRowsRaw);
  function renderNavCluster({ group, visibleLinks }: NavGroupWithVisibleLinks): ReactElement {
        const linksAfterDemoFilter =
          demoUi || buyerPolishedShell
            ? visibleLinks.filter((l) => !shouldHideOperatorNavLinkInDemo(l.href, true))
            : visibleLinks;

        const linksForRender = linksAfterDemoFilter;

        const isOpen = !mounted || openByGroup[group.id] !== false;
        const hiddenByDisclosure = countLinksHiddenByProgressiveDisclosure(
          group,
          navExtended,
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
                    const active = isNavLinkActive(pathname, link.href);
                    const Icon = link.icon;
                    const advancedDemo = isOperatorNavLinkAdvancedInDemo(link.href, demoUi || buyerPolishedShell);

                    return (
                      <Link
                        key={`pinned-${link.href}`}
                        href={link.href}
                        data-onboarding={onboardingTourAnchorForHref(link.href)}
                        className={cn(
                          "shell-nav-link flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                          active
                            ? DESIGN_TOKENS.interactive.navActive
                            : "text-neutral-900 dark:text-neutral-100",
                        )}
                        title={
                          advancedDemo
                            ? `${link.title} (Advanced — optional)`
                            : link.title
                        }
                        aria-current={active ? "page" : undefined}
                        aria-keyshortcuts={
                          link.keyShortcut ? registryKeyToAriaKeyShortcuts(link.keyShortcut) : undefined
                        }
                      >
                        {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
                        {link.label}
                      </Link>
                    );
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
                  const active = isNavLinkActive(pathname, link.href);
                  const Icon = link.icon;
                  const advancedDemo = isOperatorNavLinkAdvancedInDemo(link.href, demoUi || buyerPolishedShell);

                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      data-onboarding={onboardingTourAnchorForHref(link.href)}
                      className={cn(
                        "shell-nav-link flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                        active
                          ? DESIGN_TOKENS.interactive.navActive
                          : "text-neutral-900 dark:text-neutral-100",
                        buyerPolishedShell && link.href === "/reviews/new"
                          ? "font-normal text-neutral-600 dark:text-neutral-300"
                          : null,
                      )}
                      title={
                        advancedDemo
                          ? `${link.title} (Advanced — optional)`
                          : link.title
                      }
                      aria-current={active ? "page" : undefined}
                      aria-keyshortcuts={
                        link.keyShortcut ? registryKeyToAriaKeyShortcuts(link.keyShortcut) : undefined
                      }
                    >
                      {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
                      {link.label}
                    </Link>
                  );
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
      <SidebarRecentActivityCard />

      {mounted && (buyerPolishedShell || quickActionLinks.length > 0) ? (
        <div
          className="px-2 py-2"
          data-testid="sidebar-quick-actions"
          aria-label={buyerPolishedShell ? "Review journey" : "Quick actions"}
        >
          <p className="m-0 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200">
            {buyerPolishedShell ? "Review journey" : "Quick actions"}
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
              : quickActionLinks.map((link) => {
                  const active = isNavLinkActive(pathname, link.href);
                  const Icon = link.icon;
                  const advancedDemo = isOperatorNavLinkAdvancedInDemo(link.href, demoUi || buyerPolishedShell);

                  return (
                    <Link
                      key={`quick-${link.href}`}
                      href={link.href}
                      data-onboarding={onboardingTourAnchorForHref(link.href)}
                      className={cn(
                        "shell-nav-link flex items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800",
                        active
                          ? DESIGN_TOKENS.interactive.navActive
                          : "text-neutral-900 dark:text-neutral-100",
                      )}
                      title={
                        advancedDemo
                          ? `${link.title} (Advanced — optional)`
                          : link.title
                      }
                      aria-current={active ? "page" : undefined}
                      aria-keyshortcuts={
                        link.keyShortcut ? registryKeyToAriaKeyShortcuts(link.keyShortcut) : undefined
                      }
                    >
                      {Icon ? <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden /> : null}
                      {link.label}
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

      {showProgressiveDisclosureChrome ? (
        <div className="mt-2 px-2" data-testid="sidebar-collapsed-toggle-wrap">
          <button
            type="button"
            data-testid="sidebar-show-all-features-toggle"
            className="sidebar-disclosure-trigger w-full rounded-md border border-neutral-200 bg-white px-2 py-2 text-left text-xs font-medium text-neutral-900 hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800"
            aria-expanded={navAllFeaturesExpanded}
            aria-label={
              navAllFeaturesExpanded
                ? "Fewer sidebar links"
                : extraLinksBehindCollapsedPilot > 0
                  ? `Show all features, ${extraLinksBehindCollapsedPilot} more links hidden`
                  : "Show all features"
            }
            title="Unlock advanced analysis and governance tools."
            onClick={() => {
              const next = !navAllFeaturesExpanded;
              setNavAllFeaturesExpanded(next);

              if (next) {
                // Expanding: one-click full sidebar — tiers, preset, and first-run path suppression.
                setNavDisclosurePathOverride(true);
                setPreExpandPresetId(shellPresetId);
                setShowExtended(true);
                setShowAdvanced(true);

                if (effectiveShellPresetId !== "full") {
                  persistShellPreset("full");
                }
              } else {
                // Collapsing: restore the preset that was active before expansion so
                // "Fewer sidebar links" actually removes links rather than doing nothing.
                setNavDisclosurePathOverride(false);
                setShowExtended(false);
                setShowAdvanced(false);

                if (shellPresetId === "full") {
                  persistShellPreset(preExpandPresetId);
                }
              }

              try {
                window.localStorage.setItem(SIDEBAR_NAV_EXPAND_ALL_KEY, next ? "true" : "false");
              } catch {
                /* private mode */
              }
            }}
          >
            {navAllFeaturesExpanded ? (
              "Fewer sidebar links"
            ) : (
              <>
                Show all features
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

      {showProgressiveDisclosureChrome ? (
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
        {mounted && shellPresetId !== "full" && !buyerPolishedShell && !navAllFeaturesExpanded ? (
          <p
            className="m-0 mt-2 px-0.5 text-[10px] leading-snug text-neutral-700 dark:text-neutral-200"
            data-testid="sidebar-nav-preset-hint"
          >
            Navigation preset ({OPERATOR_SHELL_PRESET_LABELS[shellPresetId]}) hides some links.{" "}
            <strong className="font-semibold text-neutral-900 dark:text-neutral-50">Show all features</strong> switches to
            Full navigator; or open{" "}
            <strong className="font-semibold text-neutral-900 dark:text-neutral-50">Sidebar layout</strong>
            {" → "}
            <strong className="font-semibold text-neutral-900 dark:text-neutral-50">Preset</strong> to choose a different
            preset.
          </p>
        ) : null}

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
            const next = !showAdvanced;
            setShowAdvanced(next);

            // When revealing governance links, ensure the current preset doesn't block them.
            // The pilot_operator preset only allows /reviews, /graph, /dashboard, etc. —
            // not /governance, /audit, or /alerts — so governance links would be silently
            // filtered out even with showAdvanced = true unless the preset allows them.
            if (next && !operatorShellPresetAllowsHref(effectiveShellPresetId, "/governance")) {
              persistShellPreset("full");
            }
          }}
        >
          {shellShowAdvanced
            ? NAV_DISCLOSURE.advancedOperationsSidebar.hide
            : NAV_DISCLOSURE.advancedOperationsSidebar.show}
        </Button>
        ) : null}
      </div>
      ) : null}

      {showProgressiveDisclosureChrome ? (
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
            <fieldset className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-600">
              <legend className="px-1 text-xs font-semibold text-neutral-800 dark:text-neutral-100">
                Navigation preset (UI only)
              </legend>
              <p className="m-0 text-xs text-neutral-600 dark:text-neutral-300">
                Presets prune visible routes for common personas — server policies still gate HTTP access.
              </p>
              <div className="flex flex-col gap-2">
                {OPERATOR_SHELL_PRESET_ORDER.map((id) => (
                  <label key={id} className="flex cursor-pointer gap-2 text-xs text-neutral-800 dark:text-neutral-100">
                    <input
                      type="radio"
                      className="mt-0.5 h-4 w-4 shrink-0"
                      name="operator-shell-preset"
                      checked={shellPresetId === id}
                      onChange={() => {
                        persistShellPreset(id);
                      }}
                    />
                    <span>
                      <span className="font-semibold">{OPERATOR_SHELL_PRESET_LABELS[id]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
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
