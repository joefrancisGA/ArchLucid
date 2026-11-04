"use client";

import { CollapsibleSection } from "@/components/CollapsibleSection";
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
import { SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE } from "@/lib/export-markdown-sendable-cover";
import type { SponsorRoiSummary } from "@/lib/sponsor-report-markdown";
import { presentSponsorEstimatedSavings } from "@/lib/sponsor-estimated-savings-display";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { resolveSponsorSystemRowScopeLabel } from "@/lib/roi-sponsor-scope-labels";
import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

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

  const summaryLine = `${summary.systems.length} system${summary.systems.length === 1 ? "" : "s"} — per-row savings do not sum to the headline.`;

  return (
    <CollapsibleSection
      title="Systems included (per-system detail)"
      headingLevel={3}
      summaryLine={summaryLine}
      sectionTestId="exec-roi-systems-included-section"
      summaryId="exec-roi-systems-included-heading"
      className="mb-0 border-neutral-100 bg-neutral-50/80 dark:border-neutral-800 dark:bg-neutral-950/40"
    >
      <div className="space-y-3 pt-2">
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {resolveSponsorSystemRowScopeLabel(summary)}
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="exec-roi-systems-included-non-summing">
          {SENDABLE_EXPORT_COVER_ROI_NON_SUMMING_LINE}
        </p>

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
                  ? "Amount not returned"
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
      </div>
    </CollapsibleSection>
  );
}
