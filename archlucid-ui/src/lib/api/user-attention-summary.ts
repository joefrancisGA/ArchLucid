import * as httpApi from "@/lib/api/http";

export type UserAttentionSummaryResponse = {
  assignedToMeFindingsCount: number;
  awaitingApprovalCount: number;
  alertsOpenCount: number;
  checkedAtUtc: string;
};

export async function fetchUserAttentionSummaryFromApi(): Promise<UserAttentionSummaryResponse> {
  return httpApi.apiGet<UserAttentionSummaryResponse>("/v1/user/attention-summary");
}
