import * as httpApi from "@/lib/api/http";
import { isRecord, nonNegativeFiniteOrDefault } from "./api-boundary-normalization";

export type UserAttentionSummaryResponse = {
  assignedToMeFindingsCount: number;
  awaitingApprovalCount: number;
  alertsOpenCount: number;
  checkedAtUtc: string;
};

export async function fetchUserAttentionSummaryFromApi(): Promise<UserAttentionSummaryResponse> {
  const raw = await httpApi.apiGet<unknown>("/v1/user/attention-summary");

  if (!isRecord(raw)) {
    throw new Error("User attention summary response was not recognized.");
  }

  return {
    assignedToMeFindingsCount: nonNegativeFiniteOrDefault(raw.assignedToMeFindingsCount),
    awaitingApprovalCount: nonNegativeFiniteOrDefault(raw.awaitingApprovalCount),
    alertsOpenCount: nonNegativeFiniteOrDefault(raw.alertsOpenCount),
    checkedAtUtc: typeof raw.checkedAtUtc === "string" ? raw.checkedAtUtc.trim() : "",
  };
}
