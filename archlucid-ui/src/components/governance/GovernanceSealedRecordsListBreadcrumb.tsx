"use client";

import { OperatorPageBreadcrumb } from "@/components/operator/OperatorPageBreadcrumb";
import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

import { SIGNED_RECORDS_LIST_PAGE_TITLE } from "@/app/(operator)/governance/sealed-records/_sections/signed-records-list-copy";

/** Governance trail for the Finalized review records register (inventory list). */
export function GovernanceSealedRecordsListBreadcrumb(): React.JSX.Element {
  const { isWorkingMode } = useWorkspaceMode();

  if (isWorkingMode) {
    return (
      <OperatorPageBreadcrumb
        data-testid="governance-sealed-records-list-breadcrumb"
        items={[
          { label: ARCHITECTURE_DRAFTS_LIST_LABEL, href: ARCHITECTURES_LIST_PATH },
          { label: SIGNED_RECORDS_LIST_PAGE_TITLE },
        ]}
      />
    );
  }

  return (
    <OperatorPageBreadcrumb
      data-testid="governance-sealed-records-list-breadcrumb"
      items={[
        { label: "Approval", href: GOVERNANCE_APPROVAL_QUEUE_PATH },
        { label: SIGNED_RECORDS_LIST_PAGE_TITLE },
      ]}
    />
  );
}
