import type { NavLinkItem } from "@/lib/nav-config";
import { FIRST_REVIEW_GUIDE_PATH } from "@/lib/first-review-guide-route";
import { navHrefPathPart } from "@/lib/nav-href-path-part";

/** In Working mode, Getting started stays reachable via Help but leaves the main nav strip. */
export function filterNavLinksByWorkspaceMode(
  links: ReadonlyArray<NavLinkItem>,
  hideGettingStartedFromMainNav: boolean,
): NavLinkItem[] {
  if (!hideGettingStartedFromMainNav) {
    return [...links];
  }

  return links.filter((link) => navHrefPathPart(link.href) !== FIRST_REVIEW_GUIDE_PATH);
}
