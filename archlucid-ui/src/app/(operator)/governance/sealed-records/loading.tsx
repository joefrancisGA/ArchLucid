import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GovernanceSealedRecordsListBreadcrumb } from "@/components/governance/GovernanceSealedRecordsListBreadcrumb";
import {
  GOVERNANCE_SIGNED_RECORDS_LIST_PRIMARY_CONTENT_ID,
  GOVERNANCE_SIGNED_RECORDS_LIST_SKIP_LINK_LABEL,
} from "@/lib/governance-signed-records-list-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { SIGNED_RECORDS_LIST_CLAIM_DISCIPLINE } from "@/lib/signed-records-list-evidence-copy";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

import { SignedRecordsListLoadingSkeleton } from "./_sections/SignedRecordsListLoadingSkeleton";
import { SIGNED_RECORDS_LIST_PAGE_TITLE } from "./_sections/signed-records-list-copy";
import { SIGNED_RECORDS_LIST_PAGE_SUBTITLE_BUYER } from "./_sections/signed-records-list-page-copy";

/** Structured navigation shell while the deferred list chunk loads — avoids anonymous pulse blocks. */
export default function SignedRecordsListLoading(): React.JSX.Element {
  return (
    <div className="space-y-4 p-4" data-testid="signed-records-list-route-loading">
      <a
        href={`#${GOVERNANCE_SIGNED_RECORDS_LIST_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_SIGNED_RECORDS_LIST_SKIP_LINK_LABEL}
      </a>
      <OperatorPageHeader
        navHref={SIGNED_RECORDS_LIST_PATH}
        title={SIGNED_RECORDS_LIST_PAGE_TITLE}
        subtitle={SIGNED_RECORDS_LIST_PAGE_SUBTITLE_BUYER}
        claimDiscipline={SIGNED_RECORDS_LIST_CLAIM_DISCIPLINE}
        claimDisciplineTestId="signed-records-list-claim-discipline"
        breadcrumb={<GovernanceSealedRecordsListBreadcrumb />}
      />
      <SignedRecordsListLoadingSkeleton />
    </div>
  );
}
