import { getTenantPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

import type { PilotValueReportPilotPageError } from "./pilot-value-report-pilot-page-view-model";
import { toPilotValueReportPilotPageError } from "./to-pilot-value-report-pilot-page-error";

export type PilotValueReportPageServerLoad = {
  readonly initialFromUtc: string;
  readonly initialToUtc: string;
  readonly data: PilotValueReportJson | null;
  readonly failure: PilotValueReportPilotPageError | null;
};

function defaultUtcWindowSlices(): { fromSlice: string; toSlice: string } {
  const from = new Date();

  from.setUTCDate(from.getUTCDate() - 30);

  const to = new Date();

  return {
    fromSlice: from.toISOString().slice(0, 16),
    toSlice: to.toISOString().slice(0, 16),
  };
}

export async function loadPilotValueReportPageData(): Promise<PilotValueReportPageServerLoad> {
  const { fromSlice, toSlice } = defaultUtcWindowSlices();
  const fromIso = new Date(fromSlice).toISOString();
  const toIso = new Date(toSlice).toISOString();

  try {
    const data = await getTenantPilotValueReportJson(fromIso, toIso);

    return {
      initialFromUtc: fromSlice,
      initialToUtc: toSlice,
      data,
      failure: null,
    };
  } catch (e: unknown) {
    return {
      initialFromUtc: fromSlice,
      initialToUtc: toSlice,
      data: null,
      failure: toPilotValueReportPilotPageError(e),
    };
  }
}
