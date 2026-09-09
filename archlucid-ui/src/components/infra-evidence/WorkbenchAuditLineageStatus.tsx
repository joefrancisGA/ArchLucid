import { InfraAuditLineageUnavailableBanner } from "@/components/infra-evidence/InfraAuditLineageUnavailableBanner";
import { InfraEvidenceAuditScopeBar } from "@/components/infra-evidence/InfraEvidenceAuditScopeBar";
import type { CloudResourceAuditLineageMatch, CloudResourceEvidenceHubResponse, ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  buildInfraEvidenceClearAuditScopeHref,
} from "@/lib/infra-evidence/infra-evidence-audit-scope-url";
import { resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import type { InfraEvidenceWorkbenchAuditScope } from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";

type WorkbenchAuditLineageStatusProps = {
  readonly auditScope: InfraEvidenceWorkbenchAuditScope | null;
  readonly hub: CloudResourceEvidenceHubResponse | null;
  readonly provenanceTestId: string;
  readonly unavailableTestId: string;
  readonly controlNumber?: string | null;
  readonly controlTitle?: string | null;
  readonly cloudResourceId?: string | null;
  readonly currentSearch?: string;
  readonly snapshotId?: string | null;
  readonly runId?: string | null;
  readonly activeTab?: ResourceHubTab;
  readonly hasStaleAuditUrlParams?: boolean;
  readonly auditControlOptions?: readonly CloudResourceAuditLineageMatch[];
  readonly onAuditControlChange?: (match: CloudResourceAuditLineageMatch) => void;
  readonly showCopyLink?: boolean;
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
    cloudResourceId,
    currentSearch = "",
    snapshotId,
    runId,
    activeTab,
    hasStaleAuditUrlParams = false,
    auditControlOptions,
    onAuditControlChange,
    showCopyLink = false,
  } = props;

  const trimmedCloudResourceId = cloudResourceId?.trim() ?? "";
  const clearAuditScopeHref = trimmedCloudResourceId.length > 0
    ? buildInfraEvidenceClearAuditScopeHref(trimmedCloudResourceId, currentSearch, activeTab)
    : null;
  const auditTabHref = trimmedCloudResourceId.length > 0
    ? resourceHubFilterHrefFromSearch(trimmedCloudResourceId, currentSearch, {
      tab: "audit",
      snapshotId: snapshotId ?? undefined,
      runId: runId ?? undefined,
    })
    : null;

  if (auditScope != null && trimmedCloudResourceId.length > 0) {
    return (
      <div className="mt-2">
        <InfraEvidenceAuditScopeBar
          cloudResourceId={trimmedCloudResourceId}
          auditScope={auditScope}
          currentSearch={currentSearch}
          activeTab={activeTab}
          snapshotId={snapshotId}
          runId={runId}
          controlNumber={controlNumber ?? hub?.auditLineageLink.controlNumber}
          controlTitle={controlTitle ?? hub?.auditLineageLink.controlTitle}
          auditControlOptions={auditControlOptions}
          onAuditControlChange={onAuditControlChange}
          testId={provenanceTestId}
          showCopyLink={showCopyLink}
        />
      </div>
    );
  }

  if (hub?.auditLineageLink.available === false || hasStaleAuditUrlParams) {
    return (
      <div className="mt-2">
        <InfraAuditLineageUnavailableBanner
          degradedReason={hub?.auditLineageLink.degradedReason}
          testId={unavailableTestId}
          auditTabHref={auditTabHref}
          clearAuditScopeHref={hasStaleAuditUrlParams ? clearAuditScopeHref : null}
        />
      </div>
    );
  }

  return null;
}
