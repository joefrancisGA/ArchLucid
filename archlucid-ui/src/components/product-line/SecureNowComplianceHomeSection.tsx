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
import { StatusTag } from "@/components/ui/status-tag";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BADGE,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  SECURENOW_COMPLIANCE_HOME_ROWS,
  SECURENOW_COMPLIANCE_HOME_SECTION_HEADING,
  SECURENOW_COMPLIANCE_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-compliance-home-copy";
import { cn } from "@/lib/utils";

/** SecureNow home — compliance posture destinations including ARC-AMPE policy packs. */
export function SecureNowComplianceHomeSection(): React.JSX.Element {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  return (
    <section
      aria-labelledby="securenow-compliance-home-heading"
      data-testid="securenow-compliance-home-section"
    >
      <h2
        id="securenow-compliance-home-heading"
        className={cn("m-0", buyerPolishedShell ? OPERATOR_TYPOGRAPHY.cardTitle : OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {SECURENOW_COMPLIANCE_HOME_SECTION_HEADING}
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {SECURENOW_COMPLIANCE_HOME_SECTION_LEAD}
      </p>
      <EnterpriseTable
        ariaLabel="SecureNow compliance posture destinations"
        className={buyerPolishedShell ? "mt-3" : "mt-4"}
      >
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>Destination</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
            {buyerPolishedShell ? <EnterpriseTableHeaderCell>Open</EnterpriseTableHeaderCell> : null}
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {SECURENOW_COMPLIANCE_HOME_ROWS.map((row) => (
            <EnterpriseTableRow key={row.href}>
              <EnterpriseTableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className={cn("font-medium", OPERATOR_LINK.inline)}
                    href={row.href}
                    data-testid={`securenow-compliance-home-link-${row.href}`}
                  >
                    {row.label}
                  </Link>
                  {buyerPolishedShell && row.recommendedFirst === true ? (
                    <StatusTag kind="neutral" label={GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BADGE} />
                  ) : null}
                </div>
              </EnterpriseTableCell>
              <EnterpriseTableCell>{row.summary}</EnterpriseTableCell>
              {buyerPolishedShell ? (
                <EnterpriseTableCell>
                  <Link className={OPERATOR_LINK.inline} href={row.href}>
                    Open
                  </Link>
                </EnterpriseTableCell>
              ) : null}
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </section>
  );
}
