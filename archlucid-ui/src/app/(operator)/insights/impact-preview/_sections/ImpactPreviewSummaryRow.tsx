"use client";

import { cn } from "@/lib/utils";

import {
  IMPACT_PREVIEW_SUMMARY_COST_IMPACT,
  IMPACT_PREVIEW_SUMMARY_FINDINGS_CHANGED,
  IMPACT_PREVIEW_SUMMARY_GOVERNANCE_STATUS,
  IMPACT_PREVIEW_SUMMARY_RISKS_INTRODUCED,
  IMPACT_PREVIEW_SUMMARY_RISKS_REDUCED,
} from "@/lib/impact-preview-page-copy";
import type { ImpactPreviewSummaryMetrics } from "@/lib/impact-preview-page-types";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

function SummaryMetric(props: { readonly label: string; readonly value: string }): React.JSX.Element {
  return (
    <div className="rounded-md border border-neutral-200 bg-al-surface-raised px-3 py-2 dark:border-neutral-800">
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={cn("m-0 mt-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{props.value}</p>
    </div>
  );
}

export type ImpactPreviewSummaryRowProps = {
  readonly metrics: ImpactPreviewSummaryMetrics;
};

export function ImpactPreviewSummaryRow(props: ImpactPreviewSummaryRowProps): React.JSX.Element {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" data-testid="impact-preview-summary-row">
      <SummaryMetric label={IMPACT_PREVIEW_SUMMARY_FINDINGS_CHANGED} value={props.metrics.findingsChangedLabel} />
      <SummaryMetric label={IMPACT_PREVIEW_SUMMARY_RISKS_REDUCED} value={props.metrics.risksReducedLabel} />
      <SummaryMetric label={IMPACT_PREVIEW_SUMMARY_RISKS_INTRODUCED} value={props.metrics.risksIntroducedLabel} />
      <SummaryMetric label={IMPACT_PREVIEW_SUMMARY_COST_IMPACT} value={props.metrics.costImpactLabel} />
      <SummaryMetric label={IMPACT_PREVIEW_SUMMARY_GOVERNANCE_STATUS} value={props.metrics.governanceStatusLabel} />
    </section>
  );
}
