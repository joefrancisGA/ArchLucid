import { isApiRequestError } from "@/lib/api-request-error";
import { getTenantPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import { countAuditEventsInWindow } from "@/lib/workspace-health-audit-count";

import { rollingBoundsForRoiSummary } from "./roi-summary-page-helpers";
import type { RoiSummaryPageState } from "./roi-summary-page-types";

/** Resolves ROI telemetry bundles (pilot report JSON + pre-commit block counts) for the rolling window and pilot-to-date slice. */
export async function fetchRoiSummaryPageState(): Promise<
  Exclude<RoiSummaryPageState, { status: "loading" }>
> {
  const b30 = rollingBoundsForRoiSummary(30);

  try {
    const pilotReport = await getTenantPilotValueReportJson(null, b30.toUtc);

    const [rollingReport, rollingBlocks, pilotBlocks] = await Promise.all([
      getTenantPilotValueReportJson(b30.fromUtc, b30.toUtc),
      countAuditEventsInWindow({
        eventType: "GovernancePreCommitBlocked",
        fromUtcIso: b30.fromUtc,
        toUtcIso: b30.toUtc,
      }),
      countAuditEventsInWindow({
        eventType: "GovernancePreCommitBlocked",
        fromUtcIso: pilotReport.fromUtc,
        toUtcIso: pilotReport.toUtc,
      }),
    ]);

    return {
      status: "ready",
      rolling30: { report: rollingReport, blocks: rollingBlocks },
      pilotToDate: { report: pilotReport, blocks: pilotBlocks },
    };
  } catch (e: unknown) {

    if (isApiRequestError(e)) {
      return {
        status: "error",
        message: e.message,
        problem: e.problem,
        correlationId: e.correlationId,
      };
    }

    return {
      status: "error",
      message: e instanceof Error ? e.message : "Could not load ROI summary.",
      problem: null,
      correlationId: null,
    };
  }
}
