"use client";

import Link from "next/link";
import type { CSSProperties, ReactElement } from "react";

import { FindingClassificationChip } from "@/components/findings/FindingClassificationChip";
import { FindingConfidenceBadge } from "@/components/findings/FindingConfidenceBadge";
import { FindingCounterfactualLine } from "@/components/findings/FindingCounterfactualLine";
import { FindingEvidenceLinkChip } from "@/components/usability/FindingEvidenceLinkChip";
import {
  EnterpriseTableCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { getFindingDetailHref } from "@/lib/findings/finding-evidence-navigation";
import { buildQuickDecisionFindingEvidenceLinks } from "@/lib/quick-decision-finding-links";
import {
  humanReviewStatusDisplay,
  severityBadgeLabel,
  severityKindFromNumericValue,
  type QuickDecisionFinding,
} from "@/lib/quick-decision-summary-derive";
import { cn } from "@/lib/utils";

export type RunDetailFindingsDenseTableRowProps = {
  readonly runId: string;
  readonly finding: QuickDecisionFinding;
  readonly showDensityScore: boolean;
  readonly isFocused?: boolean;
  readonly style?: CSSProperties;
  readonly onOpenRow?: () => void;
};

export function RunDetailFindingsDenseTableRow(props: RunDetailFindingsDenseTableRowProps): ReactElement {
  const { runId, finding, showDensityScore, isFocused, style, onOpenRow } = props;
  const href = getFindingDetailHref(runId, finding.findingId);
  const badgeLabel = severityBadgeLabel(finding.severityValue);
  const reviewStatus = humanReviewStatusDisplay(finding.humanReviewStatus);
  const { evidenceRefCount, viewEvidenceHref } = buildQuickDecisionFindingEvidenceLinks(runId, finding);

  return (
    <EnterpriseTableRow
      data-finding-id={finding.findingId}
      tabIndex={0}
      selected={isFocused}
      className={cn(isFocused ? "ring-1 ring-inset ring-neutral-400 dark:ring-neutral-500" : undefined)}
      style={style}
      onClick={() => {
        onOpenRow?.();
      }}
    >
      <EnterpriseTableCell className="w-[5.5rem] align-top">
        <SeverityTag
          severity={badgeLabel}
          kind={severityKindFromNumericValue(finding.severityValue)}
          label={badgeLabel}
          className="tabular-nums"
        />
      </EnterpriseTableCell>
      <EnterpriseTableCell className="min-w-[12rem] align-top font-medium text-al-text-primary">
        <Link
          href={href}
          prefetch={false}
          className={OPERATOR_LINK.inline}
          onClick={(event) => {
            event.stopPropagation();
          }}
        >
          {finding.title}
        </Link>
        <FindingCounterfactualLine finding={finding} className="mt-0.5" />
        {finding.classification !== null && finding.classification !== undefined ? (
          <div className="mt-1">
            <FindingClassificationChip classification={finding.classification} findingId={finding.findingId} />
          </div>
        ) : null}
        <p className={cn("m-0 mt-0.5 font-mono text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          {finding.findingId}
        </p>
      </EnterpriseTableCell>
      {showDensityScore ? (
        <EnterpriseTableCell className="w-[5rem] align-top tabular-nums text-al-text-secondary">
          {finding.insightDensityScore !== null && finding.insightDensityScore !== undefined ? (
            <span data-testid={`run-detail-findings-density-${finding.findingId}`}>
              {Math.trunc(finding.insightDensityScore)}
            </span>
          ) : (
            "—"
          )}
        </EnterpriseTableCell>
      ) : null}
      <EnterpriseTableCell className="w-[6rem] align-top">
        {finding.confidenceLevel === "High" ||
        finding.confidenceLevel === "Medium" ||
        finding.confidenceLevel === "Low" ? (
          <FindingConfidenceBadge level={finding.confidenceLevel} />
        ) : (
          <span className="text-al-text-secondary">—</span>
        )}
      </EnterpriseTableCell>
      <EnterpriseTableCell className="w-[7rem] align-top">
        {reviewStatus !== null ? (
          <StatusTag kind={reviewStatus.statusKind} label={reviewStatus.label} />
        ) : (
          <span className="text-al-text-secondary">—</span>
        )}
      </EnterpriseTableCell>
      <EnterpriseTableCell className="w-[5rem] align-top">
        {viewEvidenceHref !== null ? (
          <FindingEvidenceLinkChip href={viewEvidenceHref} evidenceRefCount={evidenceRefCount} />
        ) : (
          <span className="text-al-text-secondary">—</span>
        )}
      </EnterpriseTableCell>
    </EnterpriseTableRow>
  );
}
