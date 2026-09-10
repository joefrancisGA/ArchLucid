import { formatCloudResourceExplorerWorkQueueLabel } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import type { CloudResourceExplorerWorkQueue } from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";

export type InfraEvidenceAskScopeSummaryInput = {
  readonly cloudResourceId?: string;
  readonly snapshotId?: string;
  readonly diffId?: string;
  readonly findingId?: string;
  readonly instanceId?: string;
  readonly correspondenceId?: string;
  readonly assessmentId?: string;
  readonly auditEvidenceSnapshotId?: string;
  readonly controlId?: string;
  readonly workQueue?: CloudResourceExplorerWorkQueue;
};

export function formatInfraEvidenceAskScopeStack(input: InfraEvidenceAskScopeSummaryInput): string | null {
  const segments: string[] = [];

  if (input.cloudResourceId != null && input.cloudResourceId.trim().length > 0) {
    segments.push(`resource ${input.cloudResourceId.trim()}`);
  }

  if (input.snapshotId != null && input.snapshotId.trim().length > 0) {
    segments.push(`snapshot ${input.snapshotId.trim()}`);
  }

  if (input.diffId != null && input.diffId.trim().length > 0) {
    segments.push(`drift diff ${input.diffId.trim()}`);
  }

  if (input.findingId != null && input.findingId.trim().length > 0) {
    segments.push(`finding ${input.findingId.trim()}`);
  }

  if (input.instanceId != null && input.instanceId.trim().length > 0) {
    segments.push(`remediation instance ${input.instanceId.trim()}`);
  }

  if (input.correspondenceId != null && input.correspondenceId.trim().length > 0) {
    segments.push(`diagram correspondence ${input.correspondenceId.trim()}`);
  }

  if (
    input.assessmentId != null
    && input.assessmentId.trim().length > 0
    && input.auditEvidenceSnapshotId != null
    && input.auditEvidenceSnapshotId.trim().length > 0
    && input.controlId != null
    && input.controlId.trim().length > 0
  ) {
    segments.push(`audit control ${input.controlId.trim()}`);
  }

  if (input.workQueue != null && input.workQueue !== "all") {
    segments.push(`explorer ${formatCloudResourceExplorerWorkQueueLabel(input.workQueue)}`);
  }

  if (segments.length === 0) {
    return null;
  }

  return segments.join(" → ");
}
