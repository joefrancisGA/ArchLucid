import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { resolveResourceHubTabFromAskScope } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { InfraEvidenceAskCitation } from "@/lib/infra-evidence/infra-evidence-ask-types";
import type { InfraEvidenceAskCitationContext } from "@/lib/infra-evidence/infra-evidence-ask-citations";

function optionalTrimmed(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : undefined;
}

export function resolveInfraEvidenceCitationHubTab(
  citation: InfraEvidenceAskCitation,
  context: InfraEvidenceAskCitationContext = {},
): ResourceHubTab | undefined {
  const scopeTab = resolveResourceHubTabFromAskScope({
    hubTab: optionalTrimmed(context.hubTab),
    findingId: optionalTrimmed(context.findingId),
    instanceId: optionalTrimmed(context.instanceId),
    diffId: optionalTrimmed(context.diffId),
    correspondenceId: optionalTrimmed(context.correspondenceId),
    assessmentId: optionalTrimmed(context.assessmentId),
    auditEvidenceSnapshotId: optionalTrimmed(context.auditEvidenceSnapshotId),
    controlId: optionalTrimmed(context.controlId),
  });

  if (scopeTab != null) {
    return scopeTab;
  }

  switch (citation.kind) {
    case "ChangeId":
    case "DiffId":
    case "SnapshotId":
      return "drift";
    case "FindingId":
    case "RemediationInstanceId":
    case "PatternKey":
      return "remediation";
    case "DiagramCorrespondenceId":
      return "diagram";
    case "AuditLineageControlId":
      return "audit";
    case "CloudResourceId":
      return "overview";
    default:
      return undefined;
  }
}
