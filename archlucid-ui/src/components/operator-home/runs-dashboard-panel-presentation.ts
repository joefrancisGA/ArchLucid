import { OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM } from "@/lib/operator/operator-home-metric-hrefs";
import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";

export const RUNS_DASHBOARD_PANEL_DEFAULT_PROJECT_ID = "default";

export const OPERATOR_HOME_DASHBOARD_TAB_PARAM = "tab";
export const OPERATOR_HOME_SHOW_ARCHIVED_PARAM = "archived";

const RUNS_DASHBOARD_TAB_IDS = new Set<RunsDashboardTabId>(["all", "approved", "attention", "outcomes"]);

export function homeGovernanceWarningsQueryEnabled(searchParams: URLSearchParams | null): boolean {
  if (searchParams === null) {
    return false;
  }

  const raw = searchParams.get(OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM);

  return raw === "1" || raw === "true";
}

export function homeGovernanceWarningsHrefFromSearch(currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  params.set(OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM, "1");
  const query = params.toString();

  return query.length === 0 ? "/" : `/?${query}`;
}

export function homeGovernanceWarningsClearHrefFromSearch(currentSearch: string): string {
  const params = new URLSearchParams(currentSearch);
  params.delete(OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM);
  const query = params.toString();

  return query.length === 0 ? "/" : `/?${query}`;
}

export function parseRunsDashboardTabFromSearch(raw: string | null | undefined): RunsDashboardTabId {
  if (raw === null || raw === undefined) {
    return "all";
  }

  const trimmed = raw.trim();

  if (!RUNS_DASHBOARD_TAB_IDS.has(trimmed as RunsDashboardTabId)) {
    return "all";
  }

  return trimmed as RunsDashboardTabId;
}

export function parseRunsDashboardShowArchivedFromSearch(raw: string | null | undefined): boolean {
  if (raw === null || raw === undefined) {
    return false;
  }

  const trimmed = raw.trim();

  return trimmed === "1" || trimmed === "true";
}

export function runsDashboardHomeHrefFromSearch(
  currentSearch: string,
  updates: {
    readonly tab?: RunsDashboardTabId;
    readonly showArchived?: boolean;
    readonly governanceWarningsOnly?: boolean;
  },
): string {
  const params = new URLSearchParams(currentSearch);

  if (updates.tab !== undefined) {

    if (updates.tab === "all") {
      params.delete(OPERATOR_HOME_DASHBOARD_TAB_PARAM);
    } else {
      params.set(OPERATOR_HOME_DASHBOARD_TAB_PARAM, updates.tab);
    }
  }

  if (updates.showArchived !== undefined) {

    if (updates.showArchived) {
      params.set(OPERATOR_HOME_SHOW_ARCHIVED_PARAM, "1");
    } else {
      params.delete(OPERATOR_HOME_SHOW_ARCHIVED_PARAM);
    }
  }

  if (updates.governanceWarningsOnly !== undefined) {

    if (updates.governanceWarningsOnly) {
      params.set(OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM, "1");
    } else {
      params.delete(OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM);
    }
  }

  const query = params.toString();

  return query.length === 0 ? "/" : `/?${query}`;
}

export function resolveRunsDashboardOpenAllReviewsHref(projectId: string): string {
  return `/architecture/reviews?projectId=${encodeURIComponent(projectId)}`;
}

const BUYER_STATUS_TAB_IDS: readonly RunsDashboardTabId[] = ["all", "approved", "attention", "outcomes"];
const OPERATOR_STATUS_TAB_IDS: readonly RunsDashboardTabId[] = ["all", "attention", "outcomes"];

export function resolveRunsDashboardStatusTabIds(
  buyerPolishedShell: boolean,
  statusTabCounts: Readonly<Record<RunsDashboardTabId, number>>,
): readonly RunsDashboardTabId[] {
  const rawStatusTabIds = buyerPolishedShell ? BUYER_STATUS_TAB_IDS : OPERATOR_STATUS_TAB_IDS;

  return buyerPolishedShell
    ? rawStatusTabIds.filter((id) => id === "all" || statusTabCounts[id] > 0)
    : rawStatusTabIds;
}

export function resolveRunsDashboardRecentListTab(
  tab: RunsDashboardTabId,
  buyerPolishedShell: boolean,
): boolean {
  return (
    tab === "all" ||
    tab === "approved" ||
    (buyerPolishedShell && (tab === "attention" || tab === "outcomes"))
  );
}
