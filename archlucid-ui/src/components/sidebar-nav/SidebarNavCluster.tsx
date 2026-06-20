"use client";

import { ChevronDown } from "lucide-react";
import type { ReactElement } from "react";

import { GovernanceReviewsAwaitingNavBadge } from "@/components/governance/GovernanceReviewsAwaitingNavBadge";
import { OperateCapabilityNavGroupHint } from "@/components/OperateCapabilityHints";
import { SidebarNavLink, SIDEBAR_GOVERNANCE_PINNED_HREFS } from "@/components/sidebar-nav/SidebarNavLink";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import { countLinksHiddenByProgressiveDisclosure } from "@/lib/nav-shell-visibility";
import { isNavLinkActive } from "@/lib/nav-link-active";
import {
  filterSidebarNavClusterLinks,
  isSidebarNavLinkAdvancedInDemo,
  presentSidebarNavLink,
} from "@/lib/sidebar-nav-link-filters";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

type SidebarNavClusterProps = {
  readonly row: NavGroupWithVisibleLinks;
  readonly pathname: string;
  readonly demoUi: boolean;
  readonly buyerPolishedShell: boolean;
  readonly hasCommittedArchitectureReview: boolean;
  readonly effectiveOperateUnlockPhase: OperateNavUnlockPhase;
  readonly navExpanded: boolean;
  readonly navAdvanced: boolean;
  readonly callerAuthorityRank: number;
  readonly showProgressiveDisclosureChrome: boolean;
  readonly onRevealHiddenLinks: (groupId: string, groupSurface: string) => void;
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

  const hiddenByDisclosure = countLinksHiddenByProgressiveDisclosure(
    group,
    props.navExpanded,
    props.navAdvanced,
    props.callerAuthorityRank,
    props.hasCommittedArchitectureReview,
  );
  const groupHeadingLabel = group.id === "pilot" && props.buyerPolishedShell ? "Reviews" : group.label;
  const demoOrBuyer = props.demoUi || props.buyerPolishedShell;

  if (linksForRender.length === 0) {
    return <div key={group.id} hidden />;
  }

  return (
    <div key={group.id} data-testid={`sidebar-group-${group.id}`}>
      <div
        className="flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-sm font-semibold uppercase tracking-wide text-neutral-700 dark:text-neutral-200"
        title={group.caption}
        id={`sidebar-group-heading-${group.id}`}
        {...(group.id === "pilot" ? { "data-onboarding": "tour-nav-settings" } : {})}
      >
        <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span>{groupHeadingLabel}</span>
          {group.id === "operate-governance" ? (
            <span id="sidebar-governance-nav-hint-slot">
              <OperateCapabilityNavGroupHint />
            </span>
          ) : null}
        </span>
      </div>
      {group.id === "operate-governance" ? (
        <nav
          className="flex flex-col gap-0.5 border-l border-neutral-200 py-1 pl-2 dark:border-neutral-700"
          aria-label="Governance — pinned links"
        >
          {linksForRender
            .filter((link) => SIDEBAR_GOVERNANCE_PINNED_HREFS.has(link.href))
            .map((link) => {
              const presented = presentSidebarNavLink(link, props.buyerPolishedShell);

              return (
                <SidebarNavLink
                  key={`pinned-${presented.href}`}
                  presented={presented}
                  active={isNavLinkActive(props.pathname, presented.href)}
                  advancedDemo={isSidebarNavLinkAdvancedInDemo(presented.href, demoOrBuyer)}
                  buyerPolishedShell={props.buyerPolishedShell}
                />
              );
            })}
        </nav>
      ) : null}
      <nav
        id={`sidebar-group-${group.id}-content`}
        className="flex flex-col gap-0.5 border-l border-neutral-200 py-1 pl-2 dark:border-neutral-700"
        aria-label={group.label}
      >
        {linksForRender
          .filter(
            (link) =>
              group.id !== "operate-governance" || !SIDEBAR_GOVERNANCE_PINNED_HREFS.has(link.href),
          )
          .map((link) => {
            const presented = presentSidebarNavLink(link, props.buyerPolishedShell);

            return (
              <SidebarNavLink
                key={presented.href}
                presented={presented}
                active={isNavLinkActive(props.pathname, presented.href)}
                advancedDemo={isSidebarNavLinkAdvancedInDemo(presented.href, demoOrBuyer)}
                buyerPolishedShell={props.buyerPolishedShell}
                afterLabel={
                  presented.href === "/governance" ? <GovernanceReviewsAwaitingNavBadge /> : null
                }
              />
            );
          })}
      </nav>
      {props.showProgressiveDisclosureChrome && hiddenByDisclosure > 0 ? (
        <button
          type="button"
          className="auth-panel-focus sidebar-disclosure-trigger ml-2 mt-1 flex items-center gap-1 text-left text-xs font-medium text-neutral-700 hover:text-neutral-900 dark:text-neutral-200 dark:hover:text-neutral-50"
          aria-label={`Show ${hiddenByDisclosure} more destinations in ${group.label}`}
          onClick={() => {
            props.onRevealHiddenLinks(group.id, group.surface);
          }}
        >
          <ChevronDown className="h-3 w-3 shrink-0 opacity-80" aria-hidden />
          {`${hiddenByDisclosure} more`}
        </button>
      ) : null}
    </div>
  );
}
