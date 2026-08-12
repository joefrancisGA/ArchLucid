import { type HelpDocSearchHit, type HelpDocSearchRecord } from "@/lib/help/help-index";
import { HELP_DOC_SEARCH_RECORDS } from "@/lib/help/help-index.generated";
import { tryResolveInAppDocHref } from "@/lib/in-app-doc-href";

export const HELP_ON_HELP_SUBTITLE = "Search this guide or jump to a section." as const;

export const HELP_ON_HELP_SEARCH_PLACEHOLDER = "Search this guide…" as const;

export const HELP_ON_HELP_ON_THIS_PAGE_HEADING = "On this page" as const;

export const HELP_ON_HELP_BROWSE_OTHER_HEADING = "Browse other topics" as const;

/** Cap section rows so the drawer stays scannable (TB-1046). */
export const HELP_ON_HELP_MAX_SECTIONS = 12 as const;

function normalizePathname(pathname: string): string {
  const withoutQuery = (pathname ?? "").split("?")[0] ?? "";
  const withoutHash = withoutQuery.split("#")[0] ?? "";
  const trimmed = withoutHash.replace(/\/$/, "");

  return trimmed.length === 0 ? "/" : trimmed;
}

/** True when the Help drawer is opened from an in-app help route (TB-1046). */
export function isHelpOnHelpPath(pathname: string): boolean {
  const path = normalizePathname(pathname);

  return path === "/help" || path.startsWith("/help/");
}

/** True when a search-index record resolves to the current help page. */
export function helpDocRecordTargetsPath(record: HelpDocSearchRecord, pathname: string): boolean {
  const resolved = tryResolveInAppDocHref(record.docPath);

  if (resolved === null) {
    return false;
  }

  const recordPath = normalizePathname(resolved);

  return recordPath === normalizePathname(pathname);
}

/**
 * In-page section anchors for the current help article (skips overview / empty slug).
 */
export function listHelpOnHelpSectionAnchors(
  pathname: string,
  maxSections: number = HELP_ON_HELP_MAX_SECTIONS,
): HelpDocSearchRecord[] {
  if (!isHelpOnHelpPath(pathname)) {
    return [];
  }

  const safeMax = Math.max(1, Math.min(maxSections, 40));
  const seen = new Set<string>();
  const anchors: HelpDocSearchRecord[] = [];

  for (const record of HELP_DOC_SEARCH_RECORDS) {
    if (!helpDocRecordTargetsPath(record, pathname)) {
      continue;
    }

    if (record.sectionSlug.length === 0) {
      continue;
    }

    if (seen.has(record.sectionSlug)) {
      continue;
    }

    seen.add(record.sectionSlug);
    anchors.push(record);

    if (anchors.length >= safeMax) {
      break;
    }
  }

  return anchors;
}

/** Prefer hits from the open help page when searching from `/help/*` (TB-1046). */
export function prioritizeHelpSearchHitsForCurrentPage(
  hits: readonly HelpDocSearchHit[],
  pathname: string,
): HelpDocSearchHit[] {
  if (!isHelpOnHelpPath(pathname) || hits.length === 0) {
    return [...hits];
  }

  const currentPage: HelpDocSearchHit[] = [];
  const otherPages: HelpDocSearchHit[] = [];

  for (const hit of hits) {
    if (helpDocRecordTargetsPath(hit, pathname)) {
      currentPage.push(hit);
    } else {
      otherPages.push(hit);
    }
  }

  return [...currentPage, ...otherPages];
}
