import type { ApiProblemDetails } from "@/lib/api-problem";

export type ValueReportActionError = {
  correlationId: string | null;
  message: string;
  problem: ApiProblemDetails | null;
};
