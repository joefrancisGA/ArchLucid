import type { NavLinkItem, NavShellSurface } from "@/lib/nav-config.types";
import { isOperatorNavLinkAdvancedInDemo, shouldHideOperatorNavLinkInDemo } from "@/lib/route-readiness";
import { filterNavLinksByOperateUnlockPhase, type OperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";
import { resolveNavLinkPresentation } from "@/lib/operator-nav-labels";

/** Applies buyer-polished and governance-mode label overrides for a single nav link row. */
export function presentSidebarNavLink(
  link: NavLinkItem,
  buyerPolishedShell: boolean,
  isGovernanceModeEnabled = false,
): NavLinkItem {
  const resolved = resolveNavLinkPresentation(link, buyerPolishedShell, isGovernanceModeEnabled);

  return {
    ...link,
    label: resolved.label,
    title: resolved.title,
  };
}

/** Internal Operations rows stay icon + label in the sidebar (no helper subtext or verbose tooltips). */
export function presentSidebarNavLinkForCluster(
  link: NavLinkItem,
  buyerPolishedShell: boolean,
  groupSurface: NavShellSurface,
  isGovernanceModeEnabled = false,
): NavLinkItem {
  const presented = presentSidebarNavLink(link, buyerPolishedShell, isGovernanceModeEnabled);

  if (groupSurface !== "system-admin") {
    return presented;
  }

  return {
    ...presented,
    title: presented.label,
  };
}

export type SidebarNavClusterLinksInput = {
  readonly visibleLinks: readonly NavLinkItem[];
  readonly demoUi: boolean;
  readonly buyerPolishedShell: boolean;
  readonly hasCommittedArchitectureReview: boolean;
  readonly effectiveOperateUnlockPhase: OperateNavUnlockPhase;
};

/** Demo, buyer-polished, and operate-unlock filters applied before rendering a nav cluster. */
export function filterSidebarNavClusterLinks(input: SidebarNavClusterLinksInput): NavLinkItem[] {
  // Buyer-polished shell keeps advanced destinations reachable (collapsed groups); demo-only builds may thin nav.
  const applyDemoNavHide = input.demoUi && !input.buyerPolishedShell;
  const linksAfterDemoFilter = applyDemoNavHide
    ? input.visibleLinks.filter((link) => !shouldHideOperatorNavLinkInDemo(link.href, true))
    : [...input.visibleLinks];

  if (input.effectiveOperateUnlockPhase === 0) {
    return linksAfterDemoFilter;
  }

  return filterNavLinksByOperateUnlockPhase(
    linksAfterDemoFilter,
    input.hasCommittedArchitectureReview,
    input.effectiveOperateUnlockPhase,
  );
}

export function isSidebarNavLinkAdvancedInDemo(href: string, demoUi: boolean): boolean {
  return isOperatorNavLinkAdvancedInDemo(href, demoUi);
}
