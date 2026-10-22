import { GovernanceSealedRecordDetailBreadcrumb } from "@/components/governance/GovernanceSealedRecordDetailBreadcrumb";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { BUYER_SIGNED_DECISION_RECORD_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";
import { SIGNED_RECORD_CLAIM_DISCIPLINE } from "@/lib/signed-record-evidence-copy";
import {
  SEALED_RECORD_DETAIL_PAGE_SUBTITLE_BUYER,
  SEALED_RECORD_DETAIL_PRIMARY_CONTENT_ID,
  SEALED_RECORD_DETAIL_SKIP_LINK_LABEL,
} from "@/lib/sealed-record-detail-page-copy";

import { ManifestDetailLoadingSkeleton } from "./_sections/ManifestDetailLoadingSkeleton";

/**
 * Short-lived navigation state only — structured page chrome (not a generic skeleton) so screenshots and
 * slow connections never look like an anonymous loading shell. Uses {@code div}, not {@code main}, so we never
 * expose two top-level {@code main} landmarks while the route segment is swapping.
 */
export default function ManifestDetailLoading(): React.JSX.Element {
  const buyerPolishedLayout = isBuyerPolishedOperatorShellEnv();

  if (!buyerPolishedLayout) {
    return (
      <OperatorPageContainer
        variant="dashboard"
        className="space-y-4 px-1 py-6 sm:px-0"
        data-testid="manifest-detail-loading-shell"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <OperatorPageHeader
          title="Finalized architecture review"
          headingLevel="h1"
          subtitle="Loading review record…"
        />
      </OperatorPageContainer>
    );
  }

  return (
    <div className="space-y-4 px-1 py-6 sm:px-0" data-testid="manifest-detail-loading-shell">
      <a
        href={`#${SEALED_RECORD_DETAIL_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {SEALED_RECORD_DETAIL_SKIP_LINK_LABEL}
      </a>
      <OperatorPageContainer variant="workflow" className="space-y-4">
        <OperatorPageHeader
          navHref={SIGNED_RECORDS_LIST_PATH}
          title={BUYER_SIGNED_DECISION_RECORD_LABEL}
          headingLevel="h1"
          subtitle={SEALED_RECORD_DETAIL_PAGE_SUBTITLE_BUYER}
          claimDiscipline={SIGNED_RECORD_CLAIM_DISCIPLINE}
          claimDisciplineTestId="sealed-record-detail-claim-discipline"
          breadcrumb={<GovernanceSealedRecordDetailBreadcrumb />}
        />
        <ManifestDetailLoadingSkeleton />
      </OperatorPageContainer>
    </div>
  );
}
