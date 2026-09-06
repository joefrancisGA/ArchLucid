import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildAuditEvidenceLineageUiPath } from "@/lib/infra-evidence/infra-evidence-ask-citations";
import type { InfraEvidenceWorkbenchAuditScope } from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import { cn } from "@/lib/utils";

type WorkbenchAuditProvenanceProps = {
  readonly auditScope: InfraEvidenceWorkbenchAuditScope;
  readonly controlNumber?: string | null;
  readonly controlTitle?: string | null;
  readonly testId?: string;
};

function formatAuditControlLabel(
  auditScope: InfraEvidenceWorkbenchAuditScope,
  controlNumber?: string | null,
  controlTitle?: string | null,
): string {
  const labelParts = [controlNumber, controlTitle].filter((part) => part != null && part.trim().length > 0);

  if (labelParts.length > 0) {
    return labelParts.join(" · ");
  }

  return auditScope.controlId;
}

export function WorkbenchAuditProvenance(props: WorkbenchAuditProvenanceProps): React.JSX.Element {
  const { auditScope, controlNumber, controlTitle, testId = "infra-workbench-audit-provenance" } = props;
  const controlLabel = formatAuditControlLabel(auditScope, controlNumber, controlTitle);

  return (
    <p className={cn("m-0 text-sm text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)} data-testid={testId}>
      From audit lineage:{" "}
      <Link
        className="text-al-link hover:underline"
        href={buildAuditEvidenceLineageUiPath(
          auditScope.assessmentId,
          auditScope.auditEvidenceSnapshotId,
          auditScope.controlId,
        )}
        data-testid={`${testId}-link`}
      >
        {controlLabel}
      </Link>
    </p>
  );
}
