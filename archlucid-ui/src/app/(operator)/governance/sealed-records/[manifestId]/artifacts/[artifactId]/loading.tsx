import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SIGNED_RECORDS_LIST_PAGE_TITLE } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-copy";
import {
  SIGNED_RECORD_ARTIFACT_PAGE_TITLE,
} from "@/lib/signed-record-artifact-page-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

import { SignedRecordArtifactPageSkeleton } from "./_sections/SignedRecordArtifactPageSkeleton";

export default function SignedRecordArtifactLoading(): React.JSX.Element {
  return (
    <div
      className="w-full max-w-[1200px] space-y-4 px-1 py-2 sm:px-0"
      data-testid="signed-record-artifact-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        title={SIGNED_RECORD_ARTIFACT_PAGE_TITLE}
        headingLevel="h1"
        subtitle="Loading artifact preview…"
        breadcrumb={
          <OperatorPageBreadcrumb
            data-testid="governance-sealed-record-artifact-breadcrumb"
            items={[
              { label: "Governance", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
              { label: SIGNED_RECORDS_LIST_PAGE_TITLE, href: SIGNED_RECORDS_LIST_PATH },
              { label: SIGNED_RECORD_ARTIFACT_PAGE_TITLE },
            ]}
          />
        }
      />
      <SignedRecordArtifactPageSkeleton />
    </div>
  );
}
