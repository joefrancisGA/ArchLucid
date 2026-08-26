import { OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM } from "@/lib/operator/operator-home-metric-hrefs";
import type { RunsDashboardTabId } from "@/components/operator-home/runs-dashboard-load-phase";

export const RUNS_DASHBOARD_PANEL_DEFAULT_PROJECT_ID = "default";

export function homeGovernanceWarningsQueryEnabled(searchParams: URLSearchParams | null): boolean {
  if (searchParams === null) {
    return false;
  }

  const raw = searchParams.get(OPERATOR_HOME_GOVERNANCE_WARNINGS_PARAM);

  return raw === "1" || raw === "true";
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
