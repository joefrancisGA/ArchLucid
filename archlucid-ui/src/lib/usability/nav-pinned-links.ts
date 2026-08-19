/**
 * Sidebar pinned links — persisted per browser.
 */

import { navHrefPathPart } from "@/lib/nav-href-path-part";

export const NAV_PINNED_LINKS_STORAGE_KEY = "archlucid.navPinnedLinks.v1";

export type NavPinnedLink = {
  readonly href: string;
  readonly label: string;
};

export function readNavPinnedLinks(): NavPinnedLink[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(NAV_PINNED_LINKS_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return [];
    }

    const parsed = JSON.parse(raw) as NavPinnedLink[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (row): row is NavPinnedLink =>
        typeof row?.href === "string"
        && row.href.length > 0
        && typeof row?.label === "string"
        && row.label.length > 0,
    ).slice(0, 6);
  }
  catch {
    return [];
  }
}

export function writeNavPinnedLinks(links: NavPinnedLink[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(NAV_PINNED_LINKS_STORAGE_KEY, JSON.stringify(links.slice(0, 6)));
  }
  catch {
    /* ignore */
  }
}

export function toggleNavPinnedLink(current: NavPinnedLink[], link: NavPinnedLink): NavPinnedLink[] {
  const path = navHrefPathPart(link.href);
  const exists = current.some((row) => navHrefPathPart(row.href) === path);

  if (exists) {
    return current.filter((row) => navHrefPathPart(row.href) !== path);
  }

  return [link, ...current].slice(0, 6);
}

export function isNavLinkPinned(pinned: NavPinnedLink[], href: string): boolean {
  const path = navHrefPathPart(href);

  return pinned.some((row) => navHrefPathPart(row.href) === path);
}
