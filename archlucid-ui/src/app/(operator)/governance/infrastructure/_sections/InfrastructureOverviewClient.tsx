"use client";

import Link from "next/link";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { LayerHeader } from "@/components/LayerHeader";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE,
  INFRASTRUCTURE_WORKBENCH_ROWS,
} from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

/** Infrastructure overview hub — lists workbench destinations until IE-UX-01..05 replace stubs. */
export function InfrastructureOverviewClient() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-6">
      <LayerHeader pageKey="infrastructure-overview" />
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Azure inventory evidence workbenches for snapshots, diagrams, resource hubs, grounded Ask, and remediation
        instances. All seven destinations are available from this hub.
      </p>
      <EnterpriseTable ariaLabel="Infrastructure evidence workbenches">
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>Workbench</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Batch</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {INFRASTRUCTURE_WORKBENCH_ROWS.map((row) => (
            <EnterpriseTableRow key={row.href}>
              <EnterpriseTableCell>
                <Link className="font-medium text-al-link hover:underline" href={row.href}>
                  {row.label}
                </Link>
              </EnterpriseTableCell>
              <EnterpriseTableCell>{row.status}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.shippedInBatch}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.summary}</EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}

export { GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_TITLE };
