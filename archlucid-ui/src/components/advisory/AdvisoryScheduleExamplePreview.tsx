"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { ReactElement } from "react";

import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import {
  ADVISORY_SCANS_SCHEDULES_EXAMPLE_PREVIEW_HELPER,
  ADVISORY_SCANS_SCHEDULES_EXAMPLE_PREVIEW_LABEL,
} from "@/lib/advisory-copy";
import { buildAdvisoryScheduleExamplePreviewView } from "@/lib/advisory-schedule-page-model";

export type AdvisoryScheduleExamplePreviewProps = {
  readonly projectLabel: string;
  readonly displayTimeZoneId: string;
};

/** Empty-state illustration — one sample row labeled as example, not live inventory. */
export function AdvisoryScheduleExamplePreview(props: AdvisoryScheduleExamplePreviewProps): ReactElement {
  const example = buildAdvisoryScheduleExamplePreviewView(props.projectLabel, props.displayTimeZoneId);

  return (
    <section
      className="rounded-md border border-dashed border-neutral-200 px-3 py-3 dark:border-neutral-700"
      data-testid="advisory-schedule-example-preview"
      aria-labelledby="advisory-schedule-example-preview-heading"
    >
      <h4
        id="advisory-schedule-example-preview-heading"
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {ADVISORY_SCANS_SCHEDULES_EXAMPLE_PREVIEW_LABEL}
      </h4>
      <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {ADVISORY_SCANS_SCHEDULES_EXAMPLE_PREVIEW_HELPER}
      </p>

      <EnterpriseTable ariaLabel={ADVISORY_SCANS_SCHEDULES_EXAMPLE_PREVIEW_LABEL} className="mt-3">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Cadence</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Scope</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Next run</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Last run</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          <EnterpriseTableRow data-testid="advisory-schedule-example-row" aria-hidden="true">
            <EnterpriseTableCell>
              <span className="font-medium text-neutral-900 dark:text-neutral-100">{example.name}</span>
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {example.frequencyLabel}
              </span>
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {example.projectLabel}
              </span>
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {example.nextRunPrimary}
                {example.nextRunUtcSecondary.length > 0 ? (
                  <span className="ml-2 text-neutral-500">{example.nextRunUtcSecondary}</span>
                ) : null}
              </span>
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {example.lastRunPrimary}
              </span>
            </EnterpriseTableCell>
            <EnterpriseTableCell>
              <StatusTag kind={example.statusKind} label={example.statusLabel} />
            </EnterpriseTableCell>
          </EnterpriseTableRow>
        </EnterpriseTableBody>
      </EnterpriseTable>
    </section>
  );
}
