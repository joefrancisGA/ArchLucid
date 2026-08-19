"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactElement } from "react";

import { SidebarNavLink } from "@/components/sidebar-nav/SidebarNavLink";
import { SIDEBAR_ADMINISTRATION } from "@/lib/nav-disclosure-copy";
import { isNavLinkActive } from "@/lib/nav-link-active";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";
import {
  filterSidebarNavClusterLinks,
  isSidebarNavLinkAdvancedInDemo,
  presentSidebarNavLink,
} from "@/lib/sidebar-nav-link-filters";
import type { OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

type SidebarAdministrationSectionProps = {
  readonly showAdministration: boolean;
  readonly onShowAdministrationChange: (value: boolean) => void;
  readonly adminNavRows: readonly NavGroupWithVisibleLinks[];
  readonly pathname: string;
  readonly demoUi: boolean;
  readonly buyerPolishedShell: boolean;
  readonly hasCommittedArchitectureReview: boolean;
  readonly effectiveOperateUnlockPhase: OperateNavUnlockPhase;
  readonly onNavLinkNavigate?: () => void;
};

export function SidebarAdministrationSection(props: SidebarAdministrationSectionProps): ReactElement | null {
  if (props.adminNavRows.length === 0) {
    return null;
  }

  const demoOrBuyer = props.demoUi || props.buyerPolishedShell;
  const ariaLabel = props.showAdministration
    ? SIDEBAR_ADMINISTRATION.ariaExpanded
    : SIDEBAR_ADMINISTRATION.ariaCollapsed;

  return (
    <div
      className="mt-2 border-t border-neutral-200 pt-2 dark:border-neutral-700"
      data-testid={
        props.showAdministration ? "sidebar-administration-section" : "sidebar-administration-collapsed"
      }
    >
      <button
        type="button"
        className={cn("sidebar-disclosure-trigger flex w-full min-w-0 items-center gap-2 rounded-md px-2 py-1.5 text-left font-semibold uppercase tracking-wide text-neutral-700 hover:bg-neutral-50 dark:text-neutral-200 dark:hover:bg-neutral-800/80", OPERATOR_TYPOGRAPHY.helper)}
        id="sidebar-admin-section-heading"
        data-testid="sidebar-administration-toggle"
        aria-expanded={props.showAdministration}
        aria-controls="sidebar-administration-content"
        aria-label={`${ariaLabel}. ${SIDEBAR_ADMINISTRATION.title}`}
        onClick={() => {
          props.onShowAdministrationChange(!props.showAdministration);
        }}
      >
        {props.showAdministration ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
        )}
        <span className="min-w-0 truncate">Administration</span>
      </button>
      {props.showAdministration ? (
        <div id="sidebar-administration-content" className="pt-1">
          <nav
            className="flex flex-col gap-0.5 border-l border-neutral-200 py-1 pl-1.5 dark:border-neutral-700"
            aria-label="Administration"
          >
            {props.adminNavRows.flatMap((row) => {
              const linksForRender = filterSidebarNavClusterLinks({
                visibleLinks: row.visibleLinks,
                demoUi: props.demoUi,
                buyerPolishedShell: props.buyerPolishedShell,
                hasCommittedArchitectureReview: props.hasCommittedArchitectureReview,
              });

              return linksForRender.map((link) => {
                const presented = presentSidebarNavLink(link, props.buyerPolishedShell);

                return (
                  <SidebarNavLink
                    key={presented.href}
                    presented={presented}
                    active={isNavLinkActive(props.pathname, presented.href)}
                    advancedDemo={isSidebarNavLinkAdvancedInDemo(presented.href, demoOrBuyer)}
                    buyerPolishedShell={props.buyerPolishedShell}
                    navGroupId={row.group.id}
                    unlockPhase={props.effectiveOperateUnlockPhase}
                    onNavigate={props.onNavLinkNavigate}
                  />
                );
              });
            })}
          </nav>
        </div>
      ) : null}
    </div>
  );
}
