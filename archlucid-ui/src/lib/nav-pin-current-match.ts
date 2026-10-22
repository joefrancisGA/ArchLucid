import type { NavLinkItem } from "@/lib/nav-config.types";
import { isNavLinkActive } from "@/lib/nav-link-active";

/** Resolves the configured nav row that matches the current pathname for pin-current actions. */
export function findNavLinkMatchingPathname(
  links: readonly NavLinkItem[],
  pathname: string,
): NavLinkItem | undefined {
  return links.find((link) => isNavLinkActive(pathname, link.href));
}
