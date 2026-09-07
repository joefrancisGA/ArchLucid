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
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_OVERVIEW_START_HERE_BADGE,
} from "@/lib/governance/governance-infrastructure-copy";
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { cn } from "@/lib/utils";

export type SecureNowHomeDestinationSectionProps = {
  readonly heading: string;
  readonly lead: string;
  readonly rows: readonly SecureNowHomeDestinationRow[];
  readonly sectionTestId: string;
  readonly headingId: string;
  readonly tableAriaLabel: string;
  readonly linkTestIdPrefix: string;
};

/** SecureNow home — grouped destination table for Compliance, Infrastructure, or Security. */
export function SecureNowHomeDestinationSection({
  heading,
  lead,
  rows,
  sectionTestId,
  headingId,
  tableAriaLabel,
  linkTestIdPrefix,
}: SecureNowHomeDestinationSectionProps): React.JSX.Element {
  const buyerPolishedShell = useProductionEvalChrome();

  return (
    <section aria-labelledby={headingId} data-testid={sectionTestId}>
      <h2
        id={headingId}
        className={cn("m-0", buyerPolishedShell ? OPERATOR_TYPOGRAPHY.cardTitle : OPERATOR_TYPOGRAPHY.sectionTitle)}
      >
        {heading}
      </h2>
      <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {lead}
      </p>
      <EnterpriseTable
        ariaLabel={tableAriaLabel}
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
          {rows.map((row) => (
            <EnterpriseTableRow key={row.href}>
              <EnterpriseTableCell>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    className={cn("font-medium", OPERATOR_LINK.inline)}
                    href={row.href}
                    data-testid={`${linkTestIdPrefix}-${row.href}`}
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
