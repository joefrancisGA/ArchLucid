import { listAlertsCursor } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { shouldMergeOperatorDemoAlertSample, tryStaticDemoAlertInboxRow } from "@/lib/operator/operator-static-demo";
import type { AlertRecord } from "@/types/alerts";

import type { AlertsInboxPageModel, AlertsInboxSearchParams } from "./alerts-inbox-page-model";

export const ALERTS_INBOX_PAGE_SIZE = 25;

/** Radix Select maps this to null API filter for “all statuses”. */
export const ALERTS_INBOX_ALL_STATUSES_VALUE = "__all__";

/** Server loader for the alerts inbox first paint (TB-564) — keyset/cursor page. */
export async function loadAlertsInboxPageModel(
  resolved: AlertsInboxSearchParams = {},
): Promise<AlertsInboxPageModel> {
  const status = (resolved.status ?? "Open").trim().length > 0 ? (resolved.status ?? "Open") : "Open";
  const cursor = (resolved.cursor ?? "").trim();
  const pageSize = ALERTS_INBOX_PAGE_SIZE;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  let items: AlertRecord[] = [];
  let nextCursor: string | null = null;
  let hasMore = false;
  let loadFailure: ApiLoadFailureState | null = null;
  let usedDemoSample = false;

  try {
    const statusFilter = status === ALERTS_INBOX_ALL_STATUSES_VALUE ? null : status;
    const data = await listAlertsCursor(statusFilter, pageSize, cursor);

    items = data.items;
    nextCursor = data.nextCursor;
    hasMore = data.hasMore;

    if (shouldMergeOperatorDemoAlertSample() && items.length === 0) {
      const demoRow = tryStaticDemoAlertInboxRow();

      if (statusFilter === null || statusFilter === "Open") {
        items = [demoRow];
        nextCursor = null;
        hasMore = false;
        usedDemoSample = true;
      }
    }
  } catch (error: unknown) {
    if (shouldMergeOperatorDemoAlertSample()) {
      const statusFilter = status === ALERTS_INBOX_ALL_STATUSES_VALUE ? null : status;
      const demoRow = tryStaticDemoAlertInboxRow();

      if (statusFilter === null || statusFilter === "Open") {
        items = [demoRow];
        nextCursor = null;
        hasMore = false;
        usedDemoSample = true;
      }
    } else {
      loadFailure = toApiLoadFailure(error);
    }
  }

  return {
    status,
    page: 1,
    pageSize,
    cursor,
    items,
    nextCursor,
    hasMore,
    loadFailure,
    buyerPolishedShell,
    usedDemoSample,
  };
}
