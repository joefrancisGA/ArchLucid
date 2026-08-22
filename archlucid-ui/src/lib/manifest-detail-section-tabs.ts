import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import {
  BUYER_MANIFEST_SECTION_DECISION,
  BUYER_MANIFEST_SECTION_DILIGENCE,
  BUYER_MANIFEST_SECTION_DOWNLOADS,
  BUYER_MANIFEST_SECTION_EVIDENCE,
} from "@/lib/buyer/buyer-polish-copy";

/** Query-string key for Finalized review record detail tabs (`?tab=`). */
export const MANIFEST_DETAIL_TAB_PARAM = "tab" as const;

export const MANIFEST_DETAIL_TAB_IDS = ["decision", "evidence", "downloads", "diligence"] as const;

export type ManifestDetailSectionTabId = (typeof MANIFEST_DETAIL_TAB_IDS)[number];

export const MANIFEST_DETAIL_DEFAULT_TAB: ManifestDetailSectionTabId = "decision";

export const MANIFEST_DETAIL_TAB_LABELS: Record<ManifestDetailSectionTabId, string> = {
  decision: BUYER_MANIFEST_SECTION_DECISION,
  evidence: BUYER_MANIFEST_SECTION_EVIDENCE,
  downloads: BUYER_MANIFEST_SECTION_DOWNLOADS,
  diligence: BUYER_MANIFEST_SECTION_DILIGENCE,
};

export const MANIFEST_DETAIL_TABLIST_ARIA_LABEL = "Finalized review record sections";

/**
 * Legacy in-page anchors from the stacked layout. Deep links keep these hashes; the detail
 * page maps them onto the tab that now owns that section.
 */
export const MANIFEST_DETAIL_SECTION_HASH_TAB: Readonly<Record<string, ManifestDetailSectionTabId>> = {
  "manifest-decision-group": "decision",
  "manifest-overview": "decision",
  "manifest-decisions": "decision",
  "manifest-monitored-risk": "decision",
  "manifest-deliverables": "evidence",
  "manifest-bundle-zip": "downloads",
  "manifest-ask": "diligence",
};

export function isManifestDetailSectionTabId(
  value: string | null | undefined,
): value is ManifestDetailSectionTabId {
  if (value === null || value === undefined || value.trim().length === 0) {
    return false;
  }

  return (MANIFEST_DETAIL_TAB_IDS as readonly string[]).includes(value);
}

export function resolveManifestDetailSectionTab(
  paramValue: string | null | undefined,
): ManifestDetailSectionTabId {
  if (isManifestDetailSectionTabId(paramValue)) {
    return paramValue;
  }

  return MANIFEST_DETAIL_DEFAULT_TAB;
}

/** Maps `#manifest-decisions` (with or without `#`) onto a tab, or `null` when unknown. */
export function resolveManifestDetailSectionTabFromHash(
  hash: string | null | undefined,
): ManifestDetailSectionTabId | null {
  if (hash === null || hash === undefined) {
    return null;
  }

  const normalized = hash.replace(/^#/, "").trim();

  if (normalized.length === 0) {
    return null;
  }

  return MANIFEST_DETAIL_SECTION_HASH_TAB[normalized] ?? null;
}

export function buildManifestDetailSectionTabHref(
  manifestId: string,
  tab: ManifestDetailSectionTabId,
  options?: { readonly hash?: string | null },
): string {
  const params = new URLSearchParams({ [MANIFEST_DETAIL_TAB_PARAM]: tab });
  const base = `${signedRecordDetailPath(manifestId)}?${params.toString()}`;
  const hash = options?.hash?.trim() ?? "";

  if (hash.length === 0) {
    return base;
  }

  const normalizedHash = hash.startsWith("#") ? hash : `#${hash}`;

  return `${base}${normalizedHash}`;
}

/** Updates `tab` in the address bar without a Next.js soft navigation. */
export function writeManifestDetailSectionTabToUrl(
  tab: ManifestDetailSectionTabId,
  options?: { readonly hash?: string | null },
): void {
  if (typeof window === "undefined") {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.set(MANIFEST_DETAIL_TAB_PARAM, tab);

  if (options?.hash === null) {
    url.hash = "";
  } else if (options?.hash !== undefined) {
    const normalized = options.hash.replace(/^#/, "").trim();
    url.hash = normalized.length > 0 ? `#${normalized}` : "";
  }

  window.history.replaceState(null, "", url.toString());
}

/** Prefers a mapped hash, then `?tab=`, then Decision. */
export function readManifestDetailSectionTabFromWindowLocation(): ManifestDetailSectionTabId {
  if (typeof window === "undefined") {
    return MANIFEST_DETAIL_DEFAULT_TAB;
  }

  const fromHash = resolveManifestDetailSectionTabFromHash(window.location.hash.slice(1));

  if (fromHash !== null) {
    return fromHash;
  }

  return resolveManifestDetailSectionTab(
    new URLSearchParams(window.location.search).get(MANIFEST_DETAIL_TAB_PARAM),
  );
}
