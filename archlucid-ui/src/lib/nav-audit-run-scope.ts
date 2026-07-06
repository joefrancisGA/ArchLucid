import { auditTrailNavHref, isAuditNavPath } from "@/lib/audit-nav-paths";
import type { NavLinkItem } from "@/lib/nav-config.types";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";

/** Rewrites audit nav hrefs to include `runId` when a review context is known (TB-649). */
export function applyAuditNavRunScope(
  links: ReadonlyArray<NavLinkItem>,
  runId: string | null,
): NavLinkItem[] {
  if (runId === null || runId.trim().length === 0) {
    return [...links];
  }

  return links.map((link) => {
    const path = link.href.split("?")[0] ?? "";

    if (!isAuditNavPath(path)) {
      return link;
    }

    return {
      ...link,
      href: auditTrailNavHref(runId),
    };
  });
}

export function scopeOperatorShellNavRows(
  rows: ReadonlyArray<NavGroupWithVisibleLinks>,
  runId: string | null,
): NavGroupWithVisibleLinks[] {
  return rows.map((row) => ({
    group: row.group,
    visibleLinks: applyAuditNavRunScope(row.visibleLinks, runId),
  }));
}

export function scopeOperatorShellHrefSet(hrefs: ReadonlySet<string>, runId: string | null): Set<string> {
  const scoped = new Set<string>();

  for (const href of hrefs) {
    const path = href.split("?")[0] ?? "";

    if (isAuditNavPath(path)) {
      scoped.add(auditTrailNavHref(runId));
    } else {
      scoped.add(href);
    }
  }

  return scoped;
}
