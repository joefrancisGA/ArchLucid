import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { GovernanceSealedRecordsListBreadcrumb } from "@/components/governance/GovernanceSealedRecordsListBreadcrumb";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

import {
  SIGNED_RECORDS_LIST_LOADING_STATUS,
  SIGNED_RECORDS_LIST_PAGE_SUBTITLE,
  SIGNED_RECORDS_LIST_PAGE_TITLE,
} from "./_sections/signed-records-list-copy";

/** Structured navigation shell while the deferred list chunk loads — avoids anonymous pulse blocks. */
export default function SignedRecordsListLoading() {
  return (
    <div
      className="w-full max-w-[1440px] space-y-4"
      data-testid="signed-records-list-loading-shell"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <OperatorPageHeader
        navHref={SIGNED_RECORDS_LIST_PATH}
        title={SIGNED_RECORDS_LIST_PAGE_TITLE}
        subtitle={SIGNED_RECORDS_LIST_PAGE_SUBTITLE}
        breadcrumb={<GovernanceSealedRecordsListBreadcrumb />}
      />
      <p className="m-0 text-al-text-secondary">{SIGNED_RECORDS_LIST_LOADING_STATUS}</p>
    </div>
  );
}
