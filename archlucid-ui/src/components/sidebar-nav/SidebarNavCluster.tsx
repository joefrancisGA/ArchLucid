"use client";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";

import { GovernanceReviewsAwaitingNavBadge } from "@/components/governance/GovernanceReviewsAwaitingNavBadge";
import { OperateCapabilityNavGroupHint } from "@/components/OperateCapabilityHints";
import { SidebarNavLink } from "@/components/sidebar-nav/SidebarNavLink";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { isNavLinkActive } from "@/lib/nav-link-active";
import {
  filterSidebarNavClusterLinks,
  isSidebarNavLinkAdvancedInDemo,
  presentSidebarNavLink,
} from "@/lib/sidebar-nav-link-filters";
import type { SidebarCollapsibleNavGroupId } from "@/lib/sidebar-nav-group-expansion-storage";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";
import { cn } from "@/lib/utils";

type SidebarNavClusterProps = {
  readonly row: NavGroupWithVisibleLinks;
  readonly pathname: string;
  readonly demoUi: boolean;
  readonly buyerPolishedShell: boolean;
  readonly hasCommittedArchitectureReview: boolean;
  readonly effectiveOperateUnlockPhase: OperateNavUnlockPhase;
  readonly isCollapsible: boolean;
  readonly isExpanded: boolean;
  readonly onToggleExpanded?: () => void;
  readonly onNavLinkNavigate?: () => void;
};

export function SidebarNavCluster(props: SidebarNavClusterProps): ReactElement {
  const { group, visibleLinks } = props.row;
  const linksForRender = filterSidebarNavClusterLinks({
    visibleLinks,
    demoUi: props.demoUi,
    buyerPolishedShell: props.buyerPolishedShell,
    hasCommittedArchitectureReview: props.hasCommittedArchitectureReview,
    effectiveOperateUnlockPhase: props.effectiveOperateUnlockPhase,
  });

  const groupHeadingLabel = group.label;
  const demoOrBuyer = props.demoUi || props.buyerPolishedShell;
  const contentId = `sidebar-group-${group.id}-content`;
  const headingId = `sidebar-group-heading-${group.id}`;

  if (linksForRender.length === 0) {
    return <div key={group.id} hidden />;
  }

  const headingClassName = cn(
    "flex w-full min-w-0 items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200",
    props.isCollapsible && "hover:bg-neutral-50 dark:hover:bg-neutral-800/80",
  );

  const headingInner = (
    <>
      {props.isCollapsible ? (
        props.isExpanded ? (
          <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        ) : (
          <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        )
      ) : null}
      <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
        <span>{groupHeadingLabel}</span>
      </span>
    </>
  );

  return (
    <div key={group.id} data-testid={`sidebar-group-${group.id}`} className="mt-1 first:mt-0">
      {props.isCollapsible ? (
        <button
          type="button"
          className={cn(headingClassName, "sidebar-disclosure-trigger")}
          id={headingId}
          data-testid={`sidebar-group-toggle-${group.id}`}
          aria-expanded={props.isExpanded}
          aria-controls={contentId}
          title={group.caption}
          onClick={() => {
            props.onToggleExpanded?.();
          }}
        >
          {headingInner}
        </button>
      ) : (
        <div
          className={headingClassName}
          title={group.caption}
          id={headingId}
          {...(group.id === "pilot" ? { "data-onboarding": "tour-nav-settings" } : {})}
        >
          {headingInner}
        </div>
      )}

      {group.id === "operate-governance" && props.isExpanded ? (
        <div id="sidebar-governance-nav-hint-slot" className="px-2 pb-1">
          <OperateCapabilityNavGroupHint />
        </div>
      ) : null}

      {props.isExpanded ? (
        <nav
          id={contentId}
          className="flex flex-col gap-0.5 border-l border-neutral-200 py-1 pl-2 dark:border-neutral-700"
          aria-labelledby={headingId}
          aria-label={group.label}
        >
          {linksForRender.map((link) => {
            const presented = presentSidebarNavLink(link, props.buyerPolishedShell);

            return (
              <SidebarNavLink
                key={presented.href}
                presented={presented}
                active={isNavLinkActive(props.pathname, presented.href)}
                advancedDemo={isSidebarNavLinkAdvancedInDemo(presented.href, demoOrBuyer)}
                buyerPolishedShell={props.buyerPolishedShell}
                onNavigate={props.onNavLinkNavigate}
                afterLabel={
                  presented.href === "/governance" ? <GovernanceReviewsAwaitingNavBadge /> : null
                }
              />
            );
          })}
        </nav>
      ) : null}
    </div>
  );
}

export function sidebarClusterToggleId(groupId: SidebarCollapsibleNavGroupId): string {
  return `sidebar-group-toggle-${groupId}`;
}
