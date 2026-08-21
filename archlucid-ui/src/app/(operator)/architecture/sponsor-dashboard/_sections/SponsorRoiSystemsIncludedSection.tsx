import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { RoiSystemRowMathTooltip } from "@/components/roi/RoiSystemRowMathTooltip";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import { presentSponsorEstimatedSavings } from "@/lib/sponsor-estimated-savings-display";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveSponsorSystemRowScopeLabel } from "@/lib/roi-sponsor-scope-labels";

type SponsorRoiSystemsIncludedSectionProps = {
  readonly summary: SponsorRoiSummary;
};

export function SponsorRoiSystemsIncludedSection(
  props: SponsorRoiSystemsIncludedSectionProps,
): ReactElement | null {
  const { summary } = props;

  if (summary.systems.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="exec-roi-systems-included-heading"
      className="space-y-3"
      data-testid="exec-roi-systems-included-section"
    >
      <div className="space-y-1">
        <h3
          id="exec-roi-systems-included-heading"
          className={cn(OPERATOR_TYPOGRAPHY.cardTitle, "text-al-text-primary")}
        >
          <span className="inline-flex items-baseline gap-1.5">
            Systems included
            <RoiSystemRowMathTooltip />
          </span>
        </h3>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {resolveSponsorSystemRowScopeLabel(summary)}
        </p>
      </div>

      <EnterpriseTable ariaLabel="Per-system estimated savings">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>System</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>
              <span className="inline-flex items-baseline gap-1.5">
                Estimated savings
                <RoiSystemRowMathTooltip />
              </span>
            </EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {summary.systems.map((system) => {
            const savingsDisplay =
              system.estimatedUsdSavings === null || system.estimatedUsdSavings === undefined
                ? " — "
                : presentSponsorEstimatedSavings(system.estimatedUsdSavings, {
                    loading: false,
                    summary,
                  }).display;

            return (
              <EnterpriseTableRow key={`${system.systemName}-${system.runId}`}>
                <EnterpriseTableCell>{system.systemName}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <Link
                    href={`/architecture/reviews/${encodeURIComponent(system.runId)}`}
                    className={OPERATOR_BODY_INLINE_LINK_CLASS}
                  >
                    {system.runId}
                  </Link>
                </EnterpriseTableCell>
                <EnterpriseTableCell data-testid={`exec-roi-system-savings-${system.runId}`}>
                  {savingsDisplay}
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </section>
  );
}
