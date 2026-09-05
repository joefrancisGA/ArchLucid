"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactElement } from "react";

import { AlertsOutstandingNavBadge } from "@/components/alerts/AlertsOutstandingNavBadge";
import { GovernanceAssignedToMeFindingsNavBadge } from "@/components/governance/findings/GovernanceAssignedToMeFindingsNavBadge";
import { GovernanceReviewsAwaitingNavBadge } from "@/components/governance/GovernanceReviewsAwaitingNavBadge";
import { SidebarNavLink } from "@/components/sidebar-nav/SidebarNavLink";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { readCachedDeskContinuity } from "@/lib/desk-continuity-preference";
import {
  GOVERNANCE_ALERTS_PATH,
  GOVERNANCE_APPROVAL_QUEUE_PATH,
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
} from "@/lib/governance/governance-route-paths";
import { isNavLinkActive } from "@/lib/nav-link-active";
import {
  filterSidebarNavClusterLinks,
  presentSidebarNavLinkForCluster,
  isSidebarNavLinkAdvancedInDemo,
} from "@/lib/sidebar-nav-link-filters";
import {
  sidebarMoreLinksCollapseLabel,
  sidebarMoreLinksLabel,
  splitSidebarLinksDailyVsMore,
} from "@/lib/sidebar-nav-daily-links";
import { resolveWorkingInsightsNavHref } from "@/lib/resolve-working-insights-nav-href";
import { isWorkingWorkspaceMode } from "@/lib/workspace-mode/workspace-mode";
import {
  parseSidebarNavMoreGroupFromSearch,
  sidebarNavMoreDisclosureHrefFromSearch,
} from "@/lib/sidebar-nav/sidebar-nav-more-disclosure-url";
import type { SidebarCollapsibleNavGroupId } from "@/lib/sidebar-nav-group-expansion-storage";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

/** Work-queue count badges for sidebar links that surface outstanding operator follow-up. */
function sidebarNavLinkAfterLabel(href: string): ReactElement | null {
  if (href === GOVERNANCE_APPROVAL_QUEUE_PATH) {
    return <GovernanceReviewsAwaitingNavBadge />;
  }

  if (href === GOVERNANCE_ALERTS_PATH) {
    return <AlertsOutstandingNavBadge />;
  }

  if (href === GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH) {
    return <GovernanceAssignedToMeFindingsNavBadge />;
  }

  return null;
}

type SidebarNavClusterProps = {
  readonly row: NavGroupWithVisibleLinks;
  readonly pathname: string;
  readonly demoUi: boolean;
  readonly buyerPolishedShell: boolean;
  readonly isGovernanceModeEnabled: boolean;
  readonly hasCommittedArchitectureReview: boolean;
  readonly effectiveOperateUnlockPhase: OperateNavUnlockPhase;
  readonly isCollapsible: boolean;
  readonly isExpanded: boolean;
  readonly onToggleExpanded?: () => void;
  readonly onNavLinkNavigate?: () => void;
};

export function SidebarNavCluster(props: SidebarNavClusterProps): ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const { mode } = useWorkspaceMode();
  const workingMode = isWorkingWorkspaceMode(mode);
  const sidebarMoreGroupParam = searchParams.get("sidebarMoreGroup");
  const { group, visibleLinks } = props.row;
  const linksForRender = filterSidebarNavClusterLinks({
    visibleLinks,
    demoUi: props.demoUi,
    buyerPolishedShell: props.buyerPolishedShell,
    hasCommittedArchitectureReview: props.hasCommittedArchitectureReview,
  });
  const groupHeadingLabel = group.label;
  const demoOrBuyer = props.demoUi || props.buyerPolishedShell;
  const contentId = `sidebar-group-${group.id}-content`;
  const headingId = `sidebar-group-heading-${group.id}`;
  const { daily, more } = splitSidebarLinksDailyVsMore(group.id, linksForRender, props.pathname ?? "/");
  const [moreOpen, setMoreOpenState] = useState(
    () => parseSidebarNavMoreGroupFromSearch(sidebarMoreGroupParam) === group.id,
  );

  useEffect(() => {
    setMoreOpenState(parseSidebarNavMoreGroupFromSearch(sidebarMoreGroupParam) === group.id);
  }, [group.id, sidebarMoreGroupParam]);

  useEffect(() => {
    if (more.length === 0) {
      setMoreOpenState(false);
    }
  }, [more.length, props.pathname]);

  useEffect(() => {
    const urlSaysOpen = parseSidebarNavMoreGroupFromSearch(sidebarMoreGroupParam) === group.id;

    if (moreOpen === urlSaysOpen) {
      return;
    }

    router.replace(
      sidebarNavMoreDisclosureHrefFromSearch(searchParams.toString(), moreOpen ? group.id : null, pathname),
      { scroll: false },
    );
  }, [group.id, moreOpen, pathname, router, searchParams, sidebarMoreGroupParam]);

  if (linksForRender.length === 0) {
    return <div key={group.id} hidden />;
  }

  const headingClassName = cn(
    OPERATOR_NAV_GROUP_LABEL,
    "flex w-full min-w-0 items-center gap-1 rounded-md px-2 py-1.5 text-left",
  );

  const collapsibleToggleClassName = cn(
    OPERATOR_NAV_GROUP_LABEL,
    "sidebar-disclosure-trigger inline-flex min-w-0 max-w-full items-center gap-2 rounded-md p-0 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/80",
  );

  const collapsibleChevron = props.isExpanded ? (
    <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
  ) : (
    <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
  );

  const headingLabel = <span className="min-w-0 truncate">{groupHeadingLabel}</span>;

  const headingInner = props.isCollapsible ? (
    <>
      {collapsibleChevron}
      {headingLabel}
    </>
  ) : (
    headingLabel
  );

  function renderLink(link: (typeof linksForRender)[number]): ReactElement {
    const presented = presentSidebarNavLinkForCluster(
      link,
      props.buyerPolishedShell,
      group.surface,
      props.isGovernanceModeEnabled,
    );
    const resolvedHref = workingMode
      ? resolveWorkingInsightsNavHref({
          href: presented.href,
          pathname,
          lastOpenReviewId: readCachedDeskContinuity().lastOpenReviewId,
        })
      : presented.href;
    const presentedWithHref =
      resolvedHref === presented.href ? presented : { ...presented, href: resolvedHref };

    return (
      <SidebarNavLink
        key={presentedWithHref.href}
        presented={presentedWithHref}
        active={isNavLinkActive(props.pathname, presentedWithHref.href)}
        advancedDemo={isSidebarNavLinkAdvancedInDemo(presentedWithHref.href, demoOrBuyer)}
        buyerPolishedShell={props.buyerPolishedShell}
        navGroupId={group.id}
        unlockPhase={props.effectiveOperateUnlockPhase}
        onNavigate={props.onNavLinkNavigate}
        afterLabel={sidebarNavLinkAfterLabel(presentedWithHref.href)}
      />
    );
  }

  return (
    <div key={group.id} data-testid={`sidebar-group-${group.id}`} className="mt-1 first:mt-0">
      {props.isCollapsible ? (
        <div className={headingClassName}>
          <button
            type="button"
            className={collapsibleToggleClassName}
            id={headingId}
            data-testid={`sidebar-group-toggle-${group.id}`}
            aria-expanded={props.isExpanded}
            aria-controls={contentId}
            onClick={() => {
              props.onToggleExpanded?.();
            }}
          >
            {headingInner}
          </button>
        </div>
      ) : (
        <div
          className={headingClassName}
          id={headingId}
          {...(group.id === "pilot" ? { "data-onboarding": "tour-nav-settings" } : {})}
        >
          {headingInner}
        </div>
      )}

      {props.isExpanded ? (
        <div
          id={contentId}
          role="group"
          className="flex flex-col gap-0.5 border-l border-neutral-200 py-1 pl-1.5 dark:border-neutral-700"
          aria-labelledby={headingId}
        >
          {daily.map((link) => renderLink(link))}

          {more.length > 0 ? (
            <div className="mt-0.5">
              <button
                type="button"
                className={cn(
                  "sidebar-disclosure-trigger flex w-full items-center gap-1 rounded-md px-2 py-1 text-left text-al-text-primary hover:bg-neutral-50 dark:text-neutral-100 dark:hover:bg-neutral-800/80",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
                data-testid={`sidebar-group-more-${group.id}`}
                aria-expanded={moreOpen}
                onClick={() => {
                  setMoreOpenState((current) => !current);
                }}
              >
                {moreOpen ? (
                  <ChevronDown className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                ) : (
                  <ChevronRight className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
                )}
                <span>{sidebarMoreLinksLabel(group.id, more.length, moreOpen)}</span>
              </button>
              {moreOpen ? <div className="flex flex-col gap-0.5">{more.map((link) => renderLink(link))}</div> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function sidebarClusterToggleId(groupId: SidebarCollapsibleNavGroupId): string {
  return `sidebar-group-toggle-${groupId}`;
}
