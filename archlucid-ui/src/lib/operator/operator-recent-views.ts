/**
 * Tracks recently visited operator routes in localStorage for quick resume on Home.
 */

import {
  GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH,
  GOVERNANCE_AUDIT_PATH,
} from "@/lib/governance/governance-route-paths";
import { extractArchitectureIdentityIdFromPathname } from "@/lib/desk-continuity-preference";
import { BUYER_TERMINOLOGY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { isSponsorDashboardPath } from "@/lib/sponsor/sponsor-dashboard-route";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const OPERATOR_RECENT_VIEWS_STORAGE_KEY = "archlucid.operatorRecentViews.v2";

/** Legacy key — migrated on read (CA-38). */
const LEGACY_OPERATOR_RECENT_VIEWS_STORAGE_KEY = "archlucid.operatorRecentViews.v1";

export type OperatorRecentViewKind = "review" | "finding" | "manifest" | "page" | "architecture";

export type OperatorRecentViewEntry = {
  href: string;
  label: string;
  kind: OperatorRecentViewKind;
  visitedAtUtc: string;
  /** Durable architecture identity id — never a draft id (CA-38). */
  architectureId?: string;
  /** Parent architecture identity for review recents when known. */
  parentArchitectureId?: string;
};

export type OperatorRecentViewsState = {
  schemaVersion: 2;
  entries: OperatorRecentViewEntry[];
};

const MAX_ENTRIES = 8;

function architectureIdFromIdentityHref(href: string): string | null {
  const [path = "", search = ""] = href.split("?");

  return extractArchitectureIdentityIdFromPathname(path, search.length > 0 ? search : "");
}

function isDraftEditorIdentityHref(href: string): boolean {
  return href.includes("draft=");
}

export function createEmptyRecentViewsState(): OperatorRecentViewsState {
  return { schemaVersion: 2, entries: [] };
}

/** Clears persisted recent views when operator scope changes (global key is not tenant-scoped). */
export function clearOperatorRecentViewsStorage(): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);
    window.localStorage.removeItem(LEGACY_OPERATOR_RECENT_VIEWS_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}

function normalizeRecentViewEntry(entry: OperatorRecentViewEntry): OperatorRecentViewEntry | null {
  const href = entry.href.trim();
  const label = entry.label.trim();

  if (href.length === 0 || label.length === 0) {
    return null;
  }

  const architectureIdFromHref = architectureIdFromIdentityHref(href);

  if (isDraftEditorIdentityHref(href)) {
    return null;
  }

  if (architectureIdFromHref !== null) {
    const architectureId = entry.architectureId?.trim() ?? architectureIdFromHref;

    if (architectureId !== architectureIdFromHref) {
      return null;
    }

    return {
      ...entry,
      href,
      label,
      kind: "architecture",
      architectureId,
    };
  }

  if (entry.kind === "architecture") {
    return null;
  }

  return {
    ...entry,
    href,
    label,
  };
}

function migrateLegacyRecentViewsState(parsed: {
  schemaVersion?: number;
  entries?: unknown;
}): OperatorRecentViewsState {
  if (!Array.isArray(parsed.entries)) {
    return createEmptyRecentViewsState();
  }

  const entries = parsed.entries
    .filter(
      (entry): entry is OperatorRecentViewEntry =>
        typeof entry === "object"
        && entry !== null
        && typeof (entry as OperatorRecentViewEntry).href === "string"
        && typeof (entry as OperatorRecentViewEntry).label === "string"
        && typeof (entry as OperatorRecentViewEntry).visitedAtUtc === "string",
    )
    .map((entry) =>
      normalizeRecentViewEntry({
        ...entry,
        kind: (entry.kind ?? "page") as OperatorRecentViewKind,
      }),
    )
    .filter((entry): entry is OperatorRecentViewEntry => entry !== null)
    .slice(0, MAX_ENTRIES);

  return { schemaVersion: 2, entries };
}

export function parseStoredRecentViews(raw: string | null): OperatorRecentViewsState {
  if (raw === null || raw.trim().length === 0) {
    return createEmptyRecentViewsState();
  }

  try {
    const parsed = JSON.parse(raw) as OperatorRecentViewsState;

    if (parsed?.schemaVersion === 2 && Array.isArray(parsed.entries)) {
      return migrateLegacyRecentViewsState(parsed);
    }

    if (parsed?.schemaVersion === 1 && Array.isArray(parsed.entries)) {
      return migrateLegacyRecentViewsState(parsed);
    }

    return createEmptyRecentViewsState();
  }
  catch {
    return createEmptyRecentViewsState();
  }
}

export function readStoredRecentViewsState(): OperatorRecentViewsState {
  if (typeof window === "undefined") {
    return createEmptyRecentViewsState();
  }

  try {
    const currentRaw = window.localStorage.getItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY);

    if (currentRaw !== null) {
      return parseStoredRecentViews(currentRaw);
    }

    const legacyRaw = window.localStorage.getItem(LEGACY_OPERATOR_RECENT_VIEWS_STORAGE_KEY);

    return parseStoredRecentViews(legacyRaw);
  } catch {
    return createEmptyRecentViewsState();
  }
}

export function recordRecentView(
  state: OperatorRecentViewsState,
  entry: Omit<OperatorRecentViewEntry, "visitedAtUtc">,
): OperatorRecentViewsState {
  const normalized = normalizeRecentViewEntry({
    ...entry,
    visitedAtUtc: new Date().toISOString(),
  });

  if (normalized === null) {
    return state;
  }

  const nowUtc = new Date().toISOString();
  const withoutDup = state.entries.filter((existing) => existing.href !== normalized.href);
  const next: OperatorRecentViewEntry = { ...normalized, visitedAtUtc: nowUtc };

  return {
    schemaVersion: 2,
    entries: [next, ...withoutDup].slice(0, MAX_ENTRIES),
  };
}

export function recentViewLabelFromPathname(pathname: string, search = ""): string | null {
  const path = pathname.split("?")[0] ?? "";

  if (path === "/" || path === "/architecture/first-review-guide") {
    return null;
  }

  if (extractArchitectureIdentityIdFromPathname(path, search) !== null) {
    return "Architecture";
  }

  const reviewMatch = /^\/architecture\/reviews\/([^/]+)$/u.exec(path);

  if (reviewMatch !== null) {
    return "Review";
  }

  const findingMatch = /^\/architecture\/reviews\/([^/]+)\/findings\/([^/]+)/u.exec(path);

  if (findingMatch !== null) {
    return "Finding detail";
  }

  const manifestMatch = /^\/(?:governance\/)?(?:signed|sealed)-records\/([^/]+)/u.exec(path);

  if (manifestMatch !== null) {
    return "Architecture snapshot";
  }

  if (path === "/insights/evidence-graph") {
    return OPERATOR_NAV_LINK_LABELS.evidenceGraph;
  }

  if (path === GOVERNANCE_ASSIGNED_TO_ME_FINDINGS_PATH) {
    return OPERATOR_NAV_LINK_LABELS.assignedToMeFindings;
  }

  if (path === "/governance/findings") {
    return OPERATOR_NAV_LINK_LABELS.findings;
  }

  if (path === GOVERNANCE_AUDIT_PATH || path === "/audit") {
    return "Audit trail";
  }

  if (isSponsorDashboardPath(path)) {
    return BUYER_TERMINOLOGY.portfolioOverview;
  }

  return path.replace(/^\//u, "").replace(/\//gu, " · ") || null;
}

export function recentViewKindFromPathname(pathname: string, search = ""): OperatorRecentViewKind {
  const path = pathname.split("?")[0] ?? "";

  if (extractArchitectureIdentityIdFromPathname(path, search) !== null) {
    return "architecture";
  }

  if (/^\/architecture\/reviews\/[^/]+\/findings\//u.test(path)) {
    return "finding";
  }

  if (/^\/architecture\/reviews\/[^/]+/u.test(path)) {
    return "review";
  }

  if (/^\/(?:governance\/)?(?:signed|sealed)-records\//u.test(path)) {
    return "manifest";
  }

  return "page";
}

export function persistRecentViewsState(state: OperatorRecentViewsState): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(OPERATOR_RECENT_VIEWS_STORAGE_KEY, JSON.stringify(state));
    window.localStorage.removeItem(LEGACY_OPERATOR_RECENT_VIEWS_STORAGE_KEY);
  } catch {
    /* private mode */
  }
}
