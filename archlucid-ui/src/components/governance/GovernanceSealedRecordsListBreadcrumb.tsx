import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { SIGNED_RECORDS_LIST_PAGE_TITLE } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-copy";

/** Governance trail for the Finalized review records register (inventory list). */
export function GovernanceSealedRecordsListBreadcrumb(): React.JSX.Element {
  return (
    <OperatorPageBreadcrumb
      data-testid="governance-sealed-records-list-breadcrumb"
      items={[
        { label: "Governance", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: SIGNED_RECORDS_LIST_PAGE_TITLE },
      ]}
    />
  );
}
