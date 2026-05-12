import type { AuditEvent, CursorPagedResponse } from "@/lib/api";
import {
  getDemoSampleAuditTrailEvents,
  shouldInjectDemoAuditSample,
  shouldPreferCuratedAuditTrailForBuyerShell,
} from "@/lib/demo-audit-sample-events";
import { shouldMergeOperatorDemoAlertSample } from "@/lib/operator-static-demo";

import type { AuditFilterFields } from "./audit-page-helpers";

export type AuditSearchUiSlice = {
  readonly events: AuditEvent[];
  readonly hasMoreResults: boolean;
  readonly auditNextCursor: string | null;
};

/** Maps API paging + demo merge policy into the event list / cursor state shown in the audit UI. */
export function resolveAuditSearchPageForUi(
  page: CursorPagedResponse<AuditEvent>,
  filters: AuditFilterFields,
): AuditSearchUiSlice {
  const curatedBuyer =
    shouldMergeOperatorDemoAlertSample() && shouldPreferCuratedAuditTrailForBuyerShell(filters);
  const injectEmptyOnly =
    shouldMergeOperatorDemoAlertSample() && shouldInjectDemoAuditSample(filters) && page.items.length === 0;
  const useDemoRows = curatedBuyer || injectEmptyOnly;

  if (useDemoRows) {
    return {
      events: getDemoSampleAuditTrailEvents(),
      hasMoreResults: false,
      auditNextCursor: null,
    };
  }

  return {
    events: page.items,
    hasMoreResults: page.hasMore,
    auditNextCursor: page.nextCursor,
  };
}

/** When a search fails, operator demo shells may still show curated sample rows. */
export function shouldInjectAuditDemoOnSearchError(filters: AuditFilterFields): boolean {
  return shouldMergeOperatorDemoAlertSample() && shouldInjectDemoAuditSample(filters);
}
