import { createItsmOutboundIssueWithJobPolling } from "@/lib/api/itsm-outbound-create";
import type { BackgroundJobInfo } from "@/lib/api/background-jobs-api";
import type { components } from "@/lib/openapi-schemas";

export type CreateItsmOutboundIssueResponse = components["schemas"]["CreateItsmOutboundIssueResponse"];

export async function createItsmOutboundIssue(
  findingId: string,
  provider: "Jira" | "ServiceNow" | "Azure Boards",
  onJobPending?: (job: BackgroundJobInfo) => void,
): Promise<CreateItsmOutboundIssueResponse> {
  return createItsmOutboundIssueWithJobPolling(findingId, provider, onJobPending);
}
