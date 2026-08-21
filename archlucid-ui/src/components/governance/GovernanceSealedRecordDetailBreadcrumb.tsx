import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { SIGNED_RECORDS_LIST_PAGE_TITLE } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-copy";
import { BUYER_SIGNED_DECISION_RECORD_LABEL } from "@/lib/buyer/buyer-polish-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { SIGNED_RECORDS_LIST_PATH } from "@/lib/signed-records-paths";

/** Governance trail for Finalized review record detail (MMX). */
export function GovernanceSealedRecordDetailBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="governance-sealed-record-detail-breadcrumb"
      items={[
        { label: "Governance", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: SIGNED_RECORDS_LIST_PAGE_TITLE, href: SIGNED_RECORDS_LIST_PATH },
        { label: BUYER_SIGNED_DECISION_RECORD_LABEL },
      ]}
    />
  );
}
