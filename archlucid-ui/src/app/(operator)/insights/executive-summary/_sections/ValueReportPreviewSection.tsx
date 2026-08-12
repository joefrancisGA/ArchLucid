"use client";

import { cn } from "@/lib/utils";
import { PilotValueReportMetricCard } from "@/app/(operator)/insights/pilot-outcomes/_sections/PilotValueReportMetricCard";
import { BUYER_VALUE_REPORT_PREVIEW_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ValueReportPreviewMetrics } from "./value-report-preview-metrics";

type ValueReportPreviewSectionProps = {
  metrics: ValueReportPreviewMetrics;
};

export function ValueReportPreviewSection({ metrics }: ValueReportPreviewSectionProps): React.JSX.Element {
  return (
    <section
      id="value-report-preview"
      className={cn("space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800", DESIGN_TOKENS.surface.card)}
      data-testid="value-report-preview"
    >
      <h2 className={`m-0 ${OPERATOR_TYPOGRAPHY.sectionTitle}`}>{BUYER_VALUE_REPORT_PREVIEW_TITLE}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <PilotValueReportMetricCard title="Reviews included" value={metrics.reviewsIncluded.toString()} />
        <PilotValueReportMetricCard title="Findings generated" value={metrics.findingsGenerated.toString()} />
        <PilotValueReportMetricCard title="Decisions recorded" value={metrics.decisionsRecorded.toString()} />
        <PilotValueReportMetricCard title="Estimated hours saved" value={metrics.estimatedHoursSaved} />
        <PilotValueReportMetricCard title="Open governance risks" value={metrics.openGovernanceRisks.toString()} />
      </div>
    </section>
  );
}
