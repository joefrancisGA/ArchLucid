import Link from "next/link";
import {
  buildLearningPlanningReportFileUrl,
  buildLearningPlanningReportJsonUrl,
} from "@/lib/learning-planning-report-urls";

const boxCls = "mt-5 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-50/90 px-3.5 py-3 text-sm leading-relaxed text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300";

/** Download / API links for 59R planning reports plus cross-link to 58R pilot feedback exports. */
export function PlanningExportReadinessNote() {
  return (
    <aside className={boxCls} aria-label="Reporting and export readiness">
      <strong>Reporting and export</strong>
      <p className="mt-2">
        <strong>59R planning report</strong> —{" "}
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
        . Same scope as the operator shell (<code className="text-[13px]">GET /v1/learning/report</code>,{" "}
        <code className="text-[13px]">…/report/file</code>). For 58R pilot roll-ups, use{" "}
        <Link href="/product-learning" className="workflow-inline-link font-medium text-blue-900 dark:text-blue-300">
          Pilot feedback
        </Link>
        .
      </p>
    </aside>
  );
}
