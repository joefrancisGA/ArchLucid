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
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";
import { presentExecutiveEstimatedSavings } from "@/lib/executive-estimated-savings-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveExecutiveSystemRowScopeLabel } from "@/lib/roi-sponsor-scope-labels";

type ExecutiveRoiSystemsIncludedSectionProps = {
  readonly summary: ExecutiveRoiSummary;
};

export function ExecutiveRoiSystemsIncludedSection(
  props: ExecutiveRoiSystemsIncludedSectionProps,
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
          {resolveExecutiveSystemRowScopeLabel(summary)}
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
                ? "—"
                : presentExecutiveEstimatedSavings(system.estimatedUsdSavings, {
                    loading: false,
                    summary,
                  }).display;

            return (
              <EnterpriseTableRow key={`${system.systemName}-${system.runId}`}>
                <EnterpriseTableCell>{system.systemName}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <Link
                    href={`/architecture/reviews/${encodeURIComponent(system.runId)}`}
                    className="text-teal-700 underline dark:text-teal-400"
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
