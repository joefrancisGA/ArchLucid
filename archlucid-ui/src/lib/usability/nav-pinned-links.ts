/**
 * Sidebar pinned links — persisted per browser.
 */

import { navHrefPathPart } from "@/lib/nav-href-path-part";
import { canonicalSafeReturnPath } from "@/lib/navigation/safe-return-path";

export const NAV_PINNED_LINKS_STORAGE_KEY = "archlucid.navPinnedLinks.v1";

export type NavPinnedLink = {
  readonly href: string;
  readonly label: string;
};

/** Reject malformed or externally edited browser storage before links reach Next navigation. */
function isSafeNavPinnedLink(value: unknown): value is NavPinnedLink {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const row = value as Record<string, unknown>;

  return (
    typeof row.href === "string"
    && canonicalSafeReturnPath(row.href) === row.href
    && typeof row.label === "string"
    && row.label.trim().length > 0
  );
}

export function readNavPinnedLinks(): NavPinnedLink[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(NAV_PINNED_LINKS_STORAGE_KEY);

    if (raw === null || raw.trim().length === 0) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isSafeNavPinnedLink).slice(0, 6);
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
    window.localStorage.setItem(NAV_PINNED_LINKS_STORAGE_KEY, JSON.stringify(links.filter(isSafeNavPinnedLink).slice(0, 6)));
  }
  catch {
    /* ignore */
  }
}

export function toggleNavPinnedLink(current: NavPinnedLink[], link: NavPinnedLink): NavPinnedLink[] {
  const safeCurrent = current.filter(isSafeNavPinnedLink).slice(0, 6);

  // The hook publishes the next state before writing it to storage, so protect
  // this in-memory path too. Empty labels are valid only for unpin actions.
  if (typeof link.href !== "string" || canonicalSafeReturnPath(link.href) !== link.href) {
    return safeCurrent;
  }

  const path = navHrefPathPart(link.href);
  const exists = safeCurrent.some((row) => navHrefPathPart(row.href) === path);

  if (exists) {
    return safeCurrent.filter((row) => navHrefPathPart(row.href) !== path);
  }

  return isSafeNavPinnedLink(link) ? [link, ...safeCurrent].slice(0, 6) : safeCurrent;
}

export function isNavLinkPinned(pinned: NavPinnedLink[], href: string): boolean {
  const path = navHrefPathPart(href);

  return pinned.some((row) => navHrefPathPart(row.href) === path);
}
