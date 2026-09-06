import type { NavLinkItem, NavShellSurface } from "@/lib/nav-config.types";
import { resolveNavLinkTooltipTitle } from "@/lib/nav-link-tooltip";
import { isOperatorNavLinkAdvancedInDemo, shouldHideOperatorNavLinkInDemo } from "@/lib/route-readiness";
import { resolveNavLinkPresentation } from "@/lib/operator/operator-nav-labels";

/** Applies buyer-polished and governance-mode label overrides for a single nav link row. */
export function presentSidebarNavLink(
  link: NavLinkItem,
  buyerPolishedShell: boolean,
  isGovernanceModeEnabled = false,
  workingMode = false,
): NavLinkItem {
  const resolved = resolveNavLinkPresentation(link, buyerPolishedShell, isGovernanceModeEnabled, workingMode);

  return {
    ...link,
    label: resolved.label,
    title: resolveNavLinkTooltipTitle(resolved.label, resolved.title),
  };
}

export function presentSidebarNavLinkForCluster(
  link: NavLinkItem,
  buyerPolishedShell: boolean,
  _groupSurface: NavShellSurface,
  isGovernanceModeEnabled = false,
  workingMode = false,
): NavLinkItem {
  return presentSidebarNavLink(link, buyerPolishedShell, isGovernanceModeEnabled, workingMode);
}

export type SidebarNavClusterLinksInput = {
  readonly visibleLinks: readonly NavLinkItem[];
  readonly demoUi: boolean;
  readonly buyerPolishedShell: boolean;
  readonly hasCommittedArchitectureReview: boolean;
};

/** Demo and buyer-polished filters applied before rendering a nav cluster. */
export function filterSidebarNavClusterLinks(input: SidebarNavClusterLinksInput): NavLinkItem[] {
  void input.hasCommittedArchitectureReview;

  // Buyer-polished shell keeps advanced destinations reachable (collapsed groups); demo-only builds may thin nav.
  const applyDemoNavHide = input.demoUi && !input.buyerPolishedShell;
  const linksAfterDemoFilter = applyDemoNavHide
    ? input.visibleLinks.filter((link) => !shouldHideOperatorNavLinkInDemo(link.href, true))
    : [...input.visibleLinks];

  return linksAfterDemoFilter;
}

export function isSidebarNavLinkAdvancedInDemo(href: string, demoUi: boolean): boolean {
  return isOperatorNavLinkAdvancedInDemo(href, demoUi);
}
