import type { ApiProblemDetails } from "@/lib/api-problem";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

export type RoiSummaryLoadBundle = {
  report: PilotValueReportJson;
  blocks: { count: number; exact: boolean };
};

export type RoiSummaryPageState =
  | { status: "loading" }
  | { status: "ready"; rolling30: RoiSummaryLoadBundle; pilotToDate: RoiSummaryLoadBundle }
  | { status: "error"; message: string; problem: ApiProblemDetails | null; correlationId: string | null };
