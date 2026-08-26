"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  OPERATOR_DATE_RANGE_END_LABEL,
  OPERATOR_DATE_RANGE_START_LABEL,
} from "@/lib/operator-date-range-copy";
import {
  BUYER_VALUE_REPORT_EXPORT_DISABLED_HELP,
} from "@/lib/buyer/buyer-polish-copy";
import { SPONSOR_REPORT_ROI_SUMMARY_PATH } from "@/lib/sponsor-report-navigation";
import { PILOT_OUTCOMES_PERIOD_PRESETS } from "@/lib/pilot-outcomes-period-presets";
import { pilotOutcomesReportingPeriodHelper } from "@/lib/pilot-outcomes-page-copy";
import { firstWhyDisabledCtaReason, type WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";
import type { RefObject } from "react";

import type { PilotValueReportPilotPageViewModel } from "./pilot-value-report-pilot-page-view-model";

function exportDisabledReason(
  canMutate: boolean,
  hasFinalizedReviews: boolean,
  periodBusy: boolean,
): WhyDisabledCtaReason | null {
  return firstWhyDisabledCtaReason([
    canMutate
      ? null
      : {
          kind: "role",
          message: "Elevated workspace permissions required to generate sponsor reports.",
        },
    !hasFinalizedReviews && !periodBusy
      ? {
          kind: "prerequisite",
          message: BUYER_VALUE_REPORT_EXPORT_DISABLED_HELP,
        }
      : null,
    periodBusy
      ? {
          kind: "lifecycle",
          message: "Wait for the selected reporting period to finish loading.",
        }
      : null,
  ]);
}

type Props = {
  readonly model: PilotValueReportPilotPageViewModel;
  readonly hasFinalizedReviews: boolean;
  readonly periodControlsRef: RefObject<HTMLDivElement | null>;
};

export function PilotValueReportExportControls(props: Props) {
  const { hasFinalizedReviews, model: m, periodControlsRef } = props;
  const exportsDisabledReason = exportDisabledReason(m.canMutate, hasFinalizedReviews, m.busy);
  const canExport = m.canMutate && hasFinalizedReviews && !m.busy;
  const exportDisabledHintId = "value-report-export-disabled-reason";

  return (
    <>
      <div ref={periodControlsRef} className="space-y-3 rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
        <h2 className={cn("m-0", OPERATOR_NAV_GROUP_LABEL)}>Reporting period</h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {pilotOutcomesReportingPeriodHelper(m.reportingTimezoneLabel)}
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Reporting period presets">
          {PILOT_OUTCOMES_PERIOD_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              type="button"
              size="sm"
              variant={m.periodPreset === preset.id ? "default" : "outline"}
              onClick={() => m.applyPeriodPreset(preset.id)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
            <span className={cn("mb-1 block", OPERATOR_TYPOGRAPHY.helper)}>{OPERATOR_DATE_RANGE_START_LABEL}</span>
            <input
              type="datetime-local"
              className={cn(
                "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950",
                OPERATOR_TYPOGRAPHY.body,
              )}
              value={m.fromUtc}
              onChange={(e) => {
                m.setPeriodPreset("custom");
                m.setFromUtc(e.target.value);
              }}
            />
          </label>
          <label className={cn("block", OPERATOR_TYPOGRAPHY.body)}>
            <span className={cn("mb-1 block", OPERATOR_TYPOGRAPHY.helper)}>{OPERATOR_DATE_RANGE_END_LABEL}</span>
            <input
              type="datetime-local"
              className={cn(
                "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-950",
                OPERATOR_TYPOGRAPHY.body,
              )}
              value={m.toUtc}
              onChange={(e) => {
                m.setPeriodPreset("custom");
                m.setToUtc(e.target.value);
              }}
            />
          </label>
          <Button
            type="button"
            variant="default"
            onClick={() => void m.load()}
            disabled={m.busy}
            aria-busy={m.busy}
          >
            {m.busy ? "Generating sponsor report…" : "Apply period"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          disabled={!canExport || m.docxBusy}
          aria-describedby={exportsDisabledReason === null ? undefined : exportDisabledHintId}
          onClick={() => void m.onGenerateDocx()}
        >
          {m.docxBusy ? "Generating…" : "Export sponsor report (.docx)"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={!canExport || m.boardBusy}
          aria-describedby={exportsDisabledReason === null ? undefined : exportDisabledHintId}
          aria-label={
            m.boardBusy
              ? "Generating board pack"
              : "Export board pack (.pdf). Uses the current calendar quarter."
          }
          onClick={() => void m.onBoardPack()}
        >
          {m.boardBusy ? "Generating…" : "Export board pack (.pdf)"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => void m.onDownloadReport("markdown")}
          disabled={m.busy || m.exportBusy || !hasFinalizedReviews}
          aria-busy={m.exportBusy}
        >
          {m.exportBusy ? "Preparing download…" : "Download report"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={m.openEmailPreview}
          disabled={m.busy || m.emailBusy}
        >
          Send sponsor briefing
        </Button>
        <Link href={SPONSOR_REPORT_ROI_SUMMARY_PATH} className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)}>
          Open ROI summary
        </Link>
      </div>

      <WhyDisabledCtaHint
        id={exportDisabledHintId}
        reason={exportsDisabledReason}
        testId={exportDisabledHintId}
      />
    </>
  );
}
