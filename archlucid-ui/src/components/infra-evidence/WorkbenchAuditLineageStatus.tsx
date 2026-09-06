import { InfraAuditLineageUnavailableBanner } from "@/components/infra-evidence/InfraAuditLineageUnavailableBanner";
import { WorkbenchAuditProvenance } from "@/components/infra-evidence/WorkbenchAuditProvenance";
import type { CloudResourceEvidenceHubResponse } from "@/lib/infra-evidence/infra-evidence-hub-types";
import type { InfraEvidenceWorkbenchAuditScope } from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";

type WorkbenchAuditLineageStatusProps = {
  readonly auditScope: InfraEvidenceWorkbenchAuditScope | null;
  readonly hub: CloudResourceEvidenceHubResponse | null;
  readonly provenanceTestId: string;
  readonly unavailableTestId: string;
  readonly controlNumber?: string | null;
  readonly controlTitle?: string | null;
};

export function WorkbenchAuditLineageStatus(
  props: WorkbenchAuditLineageStatusProps,
): React.JSX.Element | null {
  const {
    auditScope,
    hub,
    provenanceTestId,
    unavailableTestId,
    controlNumber,
    controlTitle,
  } = props;

  if (auditScope != null) {
    return (
      <div className="mt-2">
        <WorkbenchAuditProvenance
          auditScope={auditScope}
          controlNumber={controlNumber ?? hub?.auditLineageLink.controlNumber}
          controlTitle={controlTitle ?? hub?.auditLineageLink.controlTitle}
          testId={provenanceTestId}
        />
      </div>
    );
  }

  if (hub?.auditLineageLink.available === false) {
    return (
      <div className="mt-2">
        <InfraAuditLineageUnavailableBanner
          degradedReason={hub.auditLineageLink.degradedReason}
          testId={unavailableTestId}
        />
      </div>
    );
  }

  return null;
}
