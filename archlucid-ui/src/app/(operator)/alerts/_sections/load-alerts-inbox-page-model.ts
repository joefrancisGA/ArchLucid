import { listAlertsPaged } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { shouldMergeOperatorDemoAlertSample, tryStaticDemoAlertInboxRow } from "@/lib/operator-static-demo";
import type { AlertRecord } from "@/types/alerts";

import type { AlertsInboxPageModel, AlertsInboxSearchParams } from "./alerts-inbox-page-model";

export const ALERTS_INBOX_PAGE_SIZE = 25;

/** Radix Select maps this to null API filter for “all statuses”. */
export const ALERTS_INBOX_ALL_STATUSES_VALUE = "__all__";

/** Server loader for the alerts inbox first paint (TB-564). */
export async function loadAlertsInboxPageModel(
  resolved: AlertsInboxSearchParams = {},
): Promise<AlertsInboxPageModel> {
  const status = (resolved.status ?? "Open").trim().length > 0 ? (resolved.status ?? "Open") : "Open";
  const page = Math.max(1, Number.parseInt(resolved.page ?? "1", 10) || 1);
  const pageSize = ALERTS_INBOX_PAGE_SIZE;
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  let items: AlertRecord[] = [];
  let totalCount = 0;
  let loadFailure: ApiLoadFailureState | null = null;
  let usedDemoSample = false;

  try {
    const statusFilter = status === ALERTS_INBOX_ALL_STATUSES_VALUE ? null : status;
    const data = await listAlertsPaged(statusFilter, page, pageSize);

    items = data.items;
    totalCount = data.totalCount;

    if (shouldMergeOperatorDemoAlertSample() && items.length === 0) {
      const demoRow = tryStaticDemoAlertInboxRow();

      if (statusFilter === null || statusFilter === "Open") {
        items = [demoRow];
        totalCount = 1;
        usedDemoSample = true;
      }
    }
  } catch (error: unknown) {
    if (shouldMergeOperatorDemoAlertSample()) {
      const statusFilter = status === ALERTS_INBOX_ALL_STATUSES_VALUE ? null : status;
      const demoRow = tryStaticDemoAlertInboxRow();

      if (statusFilter === null || statusFilter === "Open") {
        items = [demoRow];
        totalCount = 1;
        usedDemoSample = true;
      }
    } else {
      loadFailure = toApiLoadFailure(error);
    }
  }

  return {
    status,
    page,
    pageSize,
    items,
    totalCount,
    loadFailure,
    buyerPolishedShell,
    usedDemoSample,
  };
}
