"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import {
  buildLearningPlanningReportFileUrl,
  buildLearningPlanningReportJsonUrl,
} from "@/lib/learning-planning-report-urls";
import {
  IMPROVEMENT_PLANNING_DOWNLOAD_REPORT_CTA,
  IMPROVEMENT_PLANNING_EXPORT_DATA_CTA,
  IMPROVEMENT_PLANNING_EXPORT_SECTION_DESCRIPTION,
  IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE,
  IMPROVEMENT_PLANNING_TECHNICAL_EXPORT_TITLE,
} from "@/lib/planning-page-copy";

const boxCls = cn(
  "mt-5 max-w-3xl rounded-lg border border-neutral-200 bg-neutral-50/90 px-3.5 py-3 leading-relaxed text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-300",
  OPERATOR_TYPOGRAPHY.body,
);

/** Product-facing export actions for planning summaries, with technical options behind disclosure. */
export function PlanningExportReadinessNote() {
  const showTechnicalExport = isShowSystemAdministrationNavEnabled();

  return (
    <aside
      id="planning-export-section"
      className={boxCls}
      aria-label={IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE}
      data-testid="planning-export-section"
    >
      <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE}</h3>
      <p className="mt-2">{IMPROVEMENT_PLANNING_EXPORT_SECTION_DESCRIPTION}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a id="planning-export-report" href={buildLearningPlanningReportFileUrl("markdown")}>
            {IMPROVEMENT_PLANNING_DOWNLOAD_REPORT_CTA}
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a id="planning-export-data" href={buildLearningPlanningReportFileUrl("json")}>
            {IMPROVEMENT_PLANNING_EXPORT_DATA_CTA}
          </a>
        </Button>
      </div>

      {showTechnicalExport ? (
        <div className="mt-4">
          <CollapsibleSection
            title={IMPROVEMENT_PLANNING_TECHNICAL_EXPORT_TITLE}
            defaultOpen={false}
            sectionTestId="planning-technical-export-options"
          >
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Open the raw JSON document in a new tab for debugging or integration checks.
            </p>
            <p className={cn("mt-2", OPERATOR_TYPOGRAPHY.helper)}>
              <Link
                href={buildLearningPlanningReportJsonUrl()}
                className={OPERATOR_LINK.inline}
                target="_blank"
                rel="noreferrer"
              >
                Open JSON in browser
              </Link>
              {" · "}
              <span>
                API routes: <code>GET /v1/learning/report</code>, <code>GET /v1/learning/report/file</code>
              </span>
            </p>
          </CollapsibleSection>
        </div>
      ) : null}
    </aside>
  );
}
