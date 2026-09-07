import type { CloudResourceAuditLineageMatch, CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";
import type { InfraEvidenceWorkbenchAuditScope } from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";

export function buildInfraEvidenceAuditControlOptions(
  hub: CloudResourceEvidenceHubResponse | null,
): CloudResourceAuditLineageMatch[] {
  if (hub?.auditLineageLink.available !== true) {
    return [];
  }

  const seenControlIds = new Set<string>();
  const options: CloudResourceAuditLineageMatch[] = [];

  for (const match of hub.auditLineageLink.matches) {
    if (seenControlIds.has(match.controlId)) {
      continue;
    }

    seenControlIds.add(match.controlId);
    options.push(match);
  }

  if (
    hub.auditLineageLink.assessmentId != null
    && hub.auditLineageLink.auditEvidenceSnapshotId != null
    && hub.auditLineageLink.controlId != null
    && !seenControlIds.has(hub.auditLineageLink.controlId)
  ) {
    options.unshift({
      assessmentId: hub.auditLineageLink.assessmentId,
      auditEvidenceSnapshotId: hub.auditLineageLink.auditEvidenceSnapshotId,
      controlId: hub.auditLineageLink.controlId,
      controlNumber: hub.auditLineageLink.controlNumber ?? "",
      controlTitle: hub.auditLineageLink.controlTitle ?? "",
      snapshotCreatedUtc: "",
    });
  }

  return options;
}

export function buildInfraEvidenceAuditControlScopePatch(
  match: CloudResourceAuditLineageMatch,
): InfraEvidenceWorkbenchAuditScope {
  return {
    assessmentId: match.assessmentId,
    auditEvidenceSnapshotId: match.auditEvidenceSnapshotId,
    controlId: match.controlId,
  };
}
