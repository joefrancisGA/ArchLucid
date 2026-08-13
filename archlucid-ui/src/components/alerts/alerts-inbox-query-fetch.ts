import {
  getAlertsInboxSummary,
  listAlertRules,
  listAlertsCursor,
} from "@/lib/api";
import { listRunsByProjectPaged } from "@/lib/api/architecture-runs";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import type { AlertsInboxSummaryCounts } from "@/lib/alerts-inbox-summary";
import {
  ALERTS_INBOX_DEFAULT_PROJECT_ID,
  type AlertsInboxWorkspaceContext,
} from "@/lib/alerts-inbox-workspace-context";
import { shouldMergeOperatorDemoAlertSample, tryStaticDemoAlertInboxRow } from "@/lib/operator/operator-static-demo";
import {
  ALERTS_INBOX_PAGE_SIZE,
} from "@/app/(operator)/governance/alerts/_sections/load-alerts-inbox-page-model";
import type { AlertRecord } from "@/types/alerts";

export type AlertsInboxPageQueryResult = {
  readonly items: AlertRecord[];
  readonly nextCursor: string | null;
  readonly hasMore: boolean;
  readonly loadFailure: ApiLoadFailureState | null;
};

export async function fetchAlertsInboxPage(
  statusFilter: string | null,
  cursor: string | null,
): Promise<AlertsInboxPageQueryResult> {
  try {
    const data = await listAlertsCursor(statusFilter, ALERTS_INBOX_PAGE_SIZE, cursor);
    let items = data.items;
    let nextCursor = data.nextCursor;
    let hasMore = data.hasMore;

    if (shouldMergeOperatorDemoAlertSample() && items.length === 0) {
      const demoRow = tryStaticDemoAlertInboxRow();

      if (statusFilter === null || statusFilter === "Open") {
        items = [demoRow];
        nextCursor = null;
        hasMore = false;
      }
    }

    return { items, nextCursor, hasMore, loadFailure: null };
  } catch (error) {
    if (shouldMergeOperatorDemoAlertSample()) {
      const demoRow = tryStaticDemoAlertInboxRow();

      if (statusFilter === null || statusFilter === "Open") {
        return { items: [demoRow], nextCursor: null, hasMore: false, loadFailure: null };
      }

      return { items: [], nextCursor: null, hasMore: false, loadFailure: null };
    }

    return { items: [], nextCursor: null, hasMore: false, loadFailure: toApiLoadFailure(error) };
  }
}

export async function fetchAlertsInboxSummary(): Promise<AlertsInboxSummaryCounts> {
  try {
    const summary = await getAlertsInboxSummary();

    return {
      open: summary.openCount,
      acknowledged: summary.acknowledgedCount,
      resolved: summary.resolvedCount,
      blocking: summary.blockingCount,
      lastEvaluatedUtc: summary.lastEvaluatedUtc?.trim() ? summary.lastEvaluatedUtc : null,
    };
  } catch {
    return {
      open: 0,
      acknowledged: 0,
      resolved: 0,
      blocking: 0,
      lastEvaluatedUtc: null,
    };
  }
}

export async function fetchAlertsInboxWorkspaceContext(): Promise<AlertsInboxWorkspaceContext> {
  try {
    const [rules, runs] = await Promise.all([
      listAlertRules(),
      listRunsByProjectPaged(ALERTS_INBOX_DEFAULT_PROJECT_ID, 1, 1),
    ]);

    return {
      hasReviews: runs.totalCount > 0,
      hasAlertRules: rules.length > 0,
      loading: false,
    };
  } catch {
    return {
      hasReviews: false,
      hasAlertRules: false,
      loading: false,
    };
  }
}
