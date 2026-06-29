import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";
import {
  buildLearningPlanningReportFileUrl,
  buildLearningPlanningReportJsonUrl,
} from "@/lib/learning-planning-report-urls";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

const boxCls = cn(
  "mt-5 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-50/90 px-3.5 py-3 leading-relaxed text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300",
  OPERATOR_TYPOGRAPHY.body,
);

/** Download / API links for planning reports plus cross-link to pilot feedback exports. */
export function PlanningExportReadinessNote() {
  return (
    <aside className={boxCls} aria-label="Reporting and export readiness">
      <strong>Reporting and export</strong>
      <p className="mt-2">
        <strong>Planning report</strong> —{" "}
        <a
          href={buildLearningPlanningReportFileUrl("markdown")}
          className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300"
        >
          Download Markdown
        </a>
        {" · "}
        <a
          href={buildLearningPlanningReportFileUrl("json")}
          className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300"
        >
          Download JSON
        </a>
        {" · "}
        <a
          href={buildLearningPlanningReportJsonUrl()}
          className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300"
          target="_blank"
          rel="noreferrer"
        >
          Open JSON in browser
        </a>
        . Same scope as the operator shell (<code className={OPERATOR_TYPOGRAPHY.helper}>GET /v1/learning/report</code>,{" "}
        <code className={OPERATOR_TYPOGRAPHY.helper}>…/report/file</code>). For evaluation feedback rollups, use{" "}
        <Link href="/product-learning" className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300">
          {OPERATOR_NAV_LINK_LABELS.pilotFeedback}
        </Link>
        .
      </p>
    </aside>
  );
}
