"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { AdvisorySchedulesContinueLastViewedRow } from "@/components/advisory/AdvisorySchedulesContinueLastViewedRow";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { Button } from "@/components/ui/button";
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
  ADVISORY_SCANS_SCHEDULES_LAST_SCAN_HEADER,
  ADVISORY_SCANS_SCHEDULES_NEXT_SCAN_HEADER,
  ADVISORY_SCANS_SCHEDULES_NO_FINALIZED_REVIEWS_BODY,
  ADVISORY_SCANS_SCHEDULES_NO_SCAN_HISTORY,
  ADVISORY_SCANS_SCHEDULES_RUN_NOW_NO_REVIEWS_HINT,
  ADVISORY_SCANS_SCHEDULES_SCAN_NOW_LABEL,
  ADVISORY_SCANS_SCHEDULES_SCAN_NOW_SR_ONLY,
  ADVISORY_SCANS_SCHEDULES_SCAN_NOW_WORKING_LABEL,
} from "@/lib/advisory-copy";
import {
  ADVISORY_SCHEDULES_EMPTY_COMPACT,
  ADVISORY_SCHEDULES_NO_FINALIZED_REVIEWS_EMPTY_COMPACT,
} from "@/lib/enterprise-compact-empty-state-presets";
import {
  advisorySchedulesLoadExecutionsButtonLabelReaderRank,
  advisorySchedulesLoadExecutionsButtonTitleOperator,
  advisorySchedulesLoadExecutionsButtonTitleReader,
  advisorySchedulesRunNowButtonLabelReaderRank,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import type { AdvisoryScanExecution } from "@/types/advisory-scheduling";
import type { AdvisorySchedulesPageState } from "@/components/advisory/use-advisory-schedules-page";

export type AdvisorySchedulesTableProps = {
  readonly page: AdvisorySchedulesPageState;
  readonly emptyStateFooter: React.ReactNode;
};

export function AdvisorySchedulesTable(props: AdvisorySchedulesTableProps): React.JSX.Element {
  const { page, emptyStateFooter } = props;
  const {
    canMutateSchedules,
    isEmpty,
    showPrerequisiteEmpty,
    prerequisiteBlocksSchedules,
    continueLastSchedule,
    listViews,
    historyOpenFor,
    executionsBySchedule,
    runningScheduleId,
    runNowDisabledByPrerequisite,
    onRunNow,
    onViewHistory,
    openSchedule,
    runNowHintId,
    viewHistoryHintId,
    mutationDisabledHintId,
    runNowNoReviewsHintId,
  } = page;

  if (isEmpty) {
    return (
      <div className="mt-4">
        <EnterpriseCompactEmptyState
          {...(showPrerequisiteEmpty
            ? ADVISORY_SCHEDULES_NO_FINALIZED_REVIEWS_EMPTY_COMPACT
            : ADVISORY_SCHEDULES_EMPTY_COMPACT)}
          footer={showPrerequisiteEmpty ? undefined : emptyStateFooter}
        />
      </div>
    );
  }

  return (
    <div className="mt-3">
      {prerequisiteBlocksSchedules ? (
        <p
          className={cn("m-0 mb-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="advisory-schedules-prerequisite-blocked"
        >
          {ADVISORY_SCANS_SCHEDULES_NO_FINALIZED_REVIEWS_BODY}
        </p>
      ) : null}
      <span id={runNowNoReviewsHintId} className="sr-only">
        {ADVISORY_SCANS_SCHEDULES_RUN_NOW_NO_REVIEWS_HINT}
      </span>
      <span id={runNowHintId} className="sr-only">
        {ADVISORY_SCANS_SCHEDULES_SCAN_NOW_SR_ONLY}
      </span>
      <span id={viewHistoryHintId} className="sr-only">
        {canMutateSchedules
          ? advisorySchedulesLoadExecutionsButtonTitleOperator
          : advisorySchedulesLoadExecutionsButtonTitleReader}
      </span>
      <span id={mutationDisabledHintId} className="sr-only">
        {enterpriseMutationControlDisabledTitle}
      </span>

      {continueLastSchedule !== null ? (
        <AdvisorySchedulesContinueLastViewedRow target={continueLastSchedule} onOpen={openSchedule} />
      ) : null}

      <EnterpriseTable ariaLabel="Advisory scan schedules">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Cadence</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Scope</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>{ADVISORY_SCANS_SCHEDULES_NEXT_SCAN_HEADER}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>{ADVISORY_SCANS_SCHEDULES_LAST_SCAN_HEADER}</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {listViews.map((view) => (
            <EnterpriseTableRow
              key={view.scheduleId}
              data-schedule-id={view.scheduleId}
              tabIndex={-1}
              className="outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
            >
              <EnterpriseTableCell>
                <span className="font-medium text-neutral-900 dark:text-neutral-100">{view.name}</span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {view.frequencyLabel}
                </span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {view.projectLabel}
                </span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {view.nextRunPrimary}
                  {view.nextRunUtcSecondary.length > 0 ? (
                    <span className="ml-2 text-neutral-500">{view.nextRunUtcSecondary}</span>
                  ) : null}
                </span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {view.lastRunPrimary}
                </span>
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag kind={view.statusKind} label={view.statusLabel} />
              </EnterpriseTableCell>
              <EnterpriseTableCell>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void onRunNow(view.scheduleId)}
                    disabled={!canMutateSchedules || runningScheduleId !== null || runNowDisabledByPrerequisite}
                    aria-describedby={
                      runNowDisabledByPrerequisite
                        ? runNowNoReviewsHintId
                        : canMutateSchedules
                          ? runNowHintId
                          : mutationDisabledHintId
                    }
                  >
                    {runningScheduleId === view.scheduleId
                      ? ADVISORY_SCANS_SCHEDULES_SCAN_NOW_WORKING_LABEL
                      : canMutateSchedules
                        ? ADVISORY_SCANS_SCHEDULES_SCAN_NOW_LABEL
                        : advisorySchedulesRunNowButtonLabelReaderRank}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void onViewHistory(view.scheduleId)}
                    aria-describedby={viewHistoryHintId}
                  >
                    {historyOpenFor === view.scheduleId
                      ? "Hide history"
                      : canMutateSchedules
                        ? "View history"
                        : advisorySchedulesLoadExecutionsButtonLabelReaderRank}
                  </Button>
                </div>
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>

      {historyOpenFor !== null && (executionsBySchedule[historyOpenFor]?.length ?? 0) > 0 ? (
        <div
          className="mt-3 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
          data-testid={`advisory-schedule-history-${historyOpenFor}`}
        >
          <h4 className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
            Recent history — {listViews.find((view) => view.scheduleId === historyOpenFor)?.name}
          </h4>
          <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5", OPERATOR_TYPOGRAPHY.helper)}>
            {executionsBySchedule[historyOpenFor].map((execution: AdvisoryScanExecution) => (
              <li key={execution.executionId}>
                {execution.status} — {new Date(execution.startedUtc).toLocaleString()}
                {execution.errorMessage ? ` — ${execution.errorMessage}` : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {historyOpenFor !== null &&
      executionsBySchedule[historyOpenFor] !== undefined &&
      executionsBySchedule[historyOpenFor].length === 0 ? (
        <p className={cn("m-0 mt-3 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {ADVISORY_SCANS_SCHEDULES_NO_SCAN_HISTORY}
        </p>
      ) : null}
    </div>
  );
}
