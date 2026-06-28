import { apiPutNoContent } from "@/lib/api/http";

export type FindingRemediationAssignmentRequest = {
  runId: string;
  assignedToUserId?: string | null;
  remediationDueUtc?: string | null;
};

export async function upsertFindingRemediationAssignment(
  findingId: string,
  body: FindingRemediationAssignmentRequest,
): Promise<void> {
  await apiPutNoContent(`/v1/findings/${encodeURIComponent(findingId)}/remediation-assignment`, body);
}
