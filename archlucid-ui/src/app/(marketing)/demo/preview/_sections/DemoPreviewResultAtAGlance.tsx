import {
  DEMO_PREVIEW_METRIC_DECISIONS,
  DEMO_PREVIEW_METRIC_DELIVERABLES,
  DEMO_PREVIEW_METRIC_DURATION,
  DEMO_PREVIEW_METRIC_MONITORED_RISKS,
  DEMO_PREVIEW_METRIC_OVERALL,
  DEMO_PREVIEW_METRIC_POLICY_PACK,
  DEMO_PREVIEW_METRIC_STATUS,
  DEMO_PREVIEW_METRIC_UNRESOLVED,
  DEMO_PREVIEW_RESULT_CONCLUSION_FALLBACK,
  DEMO_PREVIEW_RESULT_HEADING,
} from "@/lib/demo-preview-page-copy";
import { buildDemoPreviewAtAGlanceMetrics } from "@/lib/demo-preview-present";
import { MARKETING_TYPOGRAPHY } from "@/lib/design-tokens";
import type { DemoCommitPagePreviewResponse } from "@/types/demo-preview";
import { cn } from "@/lib/utils";

type DemoPreviewResultAtAGlanceProps = {
  readonly payload: DemoCommitPagePreviewResponse;
};

export function DemoPreviewResultAtAGlance(props: DemoPreviewResultAtAGlanceProps) {
  const metrics = buildDemoPreviewAtAGlanceMetrics(props.payload);
  const conclusion =
    metrics.conclusion.length > 0 ? metrics.conclusion : DEMO_PREVIEW_RESULT_CONCLUSION_FALLBACK;

  const items = [
    { label: DEMO_PREVIEW_METRIC_STATUS, value: metrics.status },
    { label: DEMO_PREVIEW_METRIC_OVERALL, value: metrics.overallAssessment },
    { label: DEMO_PREVIEW_METRIC_POLICY_PACK, value: metrics.policyPack },
    { label: DEMO_PREVIEW_METRIC_DECISIONS, value: metrics.decisions },
    { label: DEMO_PREVIEW_METRIC_MONITORED_RISKS, value: metrics.monitoredRisks },
    { label: DEMO_PREVIEW_METRIC_UNRESOLVED, value: metrics.unresolvedIssues },
    { label: DEMO_PREVIEW_METRIC_DURATION, value: metrics.reviewDuration },
    { label: DEMO_PREVIEW_METRIC_DELIVERABLES, value: metrics.deliverablesProduced },
  ];

  return (
    <section
      id="demo-preview-result-at-a-glance"
      className="scroll-mt-24 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-950"
      data-testid="demo-preview-result-at-a-glance"
    >
      <h2 className={cn("m-0 text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.sectionTitle)}>
        {DEMO_PREVIEW_RESULT_HEADING}
      </h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="rounded-lg border border-neutral-200 bg-neutral-50/80 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40">
            <dt className={cn("m-0 text-neutral-600 dark:text-neutral-400", MARKETING_TYPOGRAPHY.meta)}>{item.label}</dt>
            <dd className={cn("m-0 mt-1 font-medium text-neutral-900 dark:text-neutral-50", MARKETING_TYPOGRAPHY.body)}>
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
      <p className={cn("m-0 mt-4 max-w-3xl text-neutral-800 dark:text-neutral-200", MARKETING_TYPOGRAPHY.body)}>
        {conclusion}
      </p>
    </section>
  );
}
