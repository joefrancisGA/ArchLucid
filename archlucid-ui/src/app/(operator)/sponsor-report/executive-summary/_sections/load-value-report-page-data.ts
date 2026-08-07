import { getTenantPilotValueReportJson } from "@/lib/pilot-value-report-fetch";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

export type ValueReportPageServerLoad = {
  readonly initialFromUtc: string;
  readonly initialToUtc: string;
  readonly preview: PilotValueReportJson | null;
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

export async function loadValueReportPageData(): Promise<ValueReportPageServerLoad> {
  const { fromSlice, toSlice } = defaultUtcWindowSlices();
  const fromIso = new Date(fromSlice).toISOString();
  const toIso = new Date(toSlice).toISOString();

  try {
    const preview = await getTenantPilotValueReportJson(fromIso, toIso);

    return {
      initialFromUtc: fromSlice,
      initialToUtc: toSlice,
      preview,
    };
  } catch {
    return {
      initialFromUtc: fromSlice,
      initialToUtc: toSlice,
      preview: null,
    };
  }
}
