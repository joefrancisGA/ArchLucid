import { isApiRequestError } from "@/lib/api-request-error";
import { fetchTenantRoiSummaryPageBundle } from "@/lib/fetch-tenant-roi-summary-page-bundle";

import type { RoiSummaryPageState } from "./roi-summary-page-types";

/** Resolves ROI telemetry bundles (pilot report JSON + pre-commit block counts) for the rolling window and pilot-to-date slice. */
export async function fetchRoiSummaryPageState(): Promise<
  Exclude<RoiSummaryPageState, { status: "loading" }>
> {
  try {
    const bundle = await fetchTenantRoiSummaryPageBundle(30);

    return {
      status: "ready",
      rolling30: {
        report: bundle.rollingWindow,
        blocks: bundle.rollingWindowPreCommitBlocks,
      },
      pilotToDate: {
        report: bundle.pilotToDate,
        blocks: bundle.pilotToDatePreCommitBlocks,
      },
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
