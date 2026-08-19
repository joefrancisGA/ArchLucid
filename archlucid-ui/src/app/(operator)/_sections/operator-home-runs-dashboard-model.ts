import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { RunSummary } from "@/types/authority";

export const OPERATOR_HOME_RUNS_DASHBOARD_PAGE_SIZE = 5;

export type OperatorHomeRunsDashboardModel = {
  readonly projectId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly items: RunSummary[];
  readonly totalCount: number;
  readonly loadFailure: ApiLoadFailureState | null;
  readonly malformedMessage: string | null;
  readonly usedStaticRunsFallback: boolean;
  readonly buyerPolishedShell: boolean;
};
