/**
 * Tracks recently visited operator routes in localStorage for quick resume on Home.
 */

import { BUYER_TERMINOLOGY } from "@/lib/vocabulary/buyer-surface-vocabulary";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { isExecutiveDashboardPath } from "@/lib/executive-dashboard-route";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const OPERATOR_RECENT_VIEWS_STORAGE_KEY = "archlucid.operatorRecentViews.v1";

export type OperatorRecentViewKind = "review" | "finding" | "manifest" | "page";

export type OperatorRecentViewEntry = {
  href: string;
  label: string;
  kind: OperatorRecentViewKind;
  visitedAtUtc: string;
};

export type OperatorRecentViewsState = {
  schemaVersion: 1;
  entries: OperatorRecentViewEntry[];
};

const MAX_ENTRIES = 8;

export function createEmptyRecentViewsState(): OperatorRecentViewsState {
  return { schemaVersion: 1, entries: [] };
}

export function parseStoredRecentViews(raw: string | null): OperatorRecentViewsState {
  if (raw === null || raw.trim().length === 0) {
    return createEmptyRecentViewsState();
  }

  try {
    const parsed = JSON.parse(raw) as OperatorRecentViewsState;

    if (parsed?.schemaVersion !== 1 || !Array.isArray(parsed.entries)) {
      return createEmptyRecentViewsState();
    }

    const entries = parsed.entries
      .filter(
        (e): e is OperatorRecentViewEntry =>
          typeof e?.href === "string"
          && e.href.length > 0
          && typeof e?.label === "string"
          && typeof e?.visitedAtUtc === "string",
      )
      .slice(0, MAX_ENTRIES);

    return { schemaVersion: 1, entries };
  }
  catch {
    return createEmptyRecentViewsState();
  }
}

export function recordRecentView(
  state: OperatorRecentViewsState,
  entry: Omit<OperatorRecentViewEntry, "visitedAtUtc">,
): OperatorRecentViewsState {
  const nowUtc = new Date().toISOString();
  const withoutDup = state.entries.filter((e) => e.href !== entry.href);
  const next: OperatorRecentViewEntry = { ...entry, visitedAtUtc: nowUtc };

  return {
    schemaVersion: 1,
    entries: [next, ...withoutDup].slice(0, MAX_ENTRIES),
  };
}

export function recentViewLabelFromPathname(pathname: string): string | null {
  const path = pathname.split("?")[0] ?? "";

  if (path === "/" || path === "/architecture/first-review-guide") {
    return null;
  }

  const reviewMatch = /^\/architecture\/reviews\/([^/]+)$/u.exec(path);

  if (reviewMatch !== null) {
    return "Review";
  }

  const findingMatch = /^\/architecture\/reviews\/([^/]+)\/findings\/([^/]+)/u.exec(path);

  if (findingMatch !== null) {
    return "Finding detail";
  }

  const manifestMatch = /^\/signed-records\/([^/]+)/u.exec(path);

  if (manifestMatch !== null) {
    return "Architecture snapshot";
  }

  if (path === "/insights/evidence-graph") {
    return OPERATOR_NAV_LINK_LABELS.evidenceGraph;
  }

  if (path === "/governance/findings") {
    return OPERATOR_NAV_LINK_LABELS.findings;
  }

  if (path === "/audit") {
    return "Audit trail";
  }

  if (isExecutiveDashboardPath(path)) {
    return BUYER_TERMINOLOGY.portfolioOverview;
  }

  return path.replace(/^\//u, "").replace(/\//gu, " · ") || null;
}

export function recentViewKindFromPathname(pathname: string): OperatorRecentViewKind {
  const path = pathname.split("?")[0] ?? "";

  if (/^\/architecture\/reviews\/[^/]+\/findings\//u.test(path)) {
    return "finding";
  }

  if (/^\/architecture\/reviews\/[^/]+/u.test(path)) {
    return "review";
  }

  if (/^\/signed-records\//u.test(path)) {
    return "manifest";
  }

  return "page";
}
