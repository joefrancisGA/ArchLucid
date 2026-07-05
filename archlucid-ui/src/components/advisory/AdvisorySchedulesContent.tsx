"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { CronExpressionBuilder } from "@/components/advisory/CronExpressionBuilder";
import { DocumentLayout } from "@/components/DocumentLayout";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  createAdvisorySchedule,
  listAdvisorySchedules,
  listScheduleExecutions,
  runAdvisoryScheduleNow,
} from "@/lib/api";
import {
  advisorySchedulesCreateScheduleButtonLabelReaderRank,
  advisorySchedulesCreateSectionHeadingOperator,
  advisorySchedulesCreateSectionHeadingReader,
  advisorySchedulesEmptyListOperatorLine,
  advisorySchedulesEmptyListReaderLine,
  advisorySchedulesListHeadingOperator,
  advisorySchedulesListHeadingReader,
  advisorySchedulesLoadExecutionsButtonLabelReaderRank,
  advisorySchedulesLoadExecutionsButtonTitleOperator,
  advisorySchedulesLoadExecutionsButtonTitleReader,
  advisorySchedulesRunNowButtonLabelReaderRank,
  alertToolingListRefreshButtonTitleOperator,
  alertToolingListRefreshButtonTitleReader,
  enterpriseMutationControlDisabledTitle,
} from "@/lib/enterprise-controls-context-copy";
import type { AdvisoryScanExecution, AdvisoryScanSchedule } from "@/types/advisory-scheduling";

const inputClass =
  (cn("block w-full rounded-md border border-neutral-300 bg-white p-2 text-neutral-900 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body));

/**
 * Schedules tab: CRUD and history for scan windows (Execute-class mutations; inspect-only for Read — former `/advisory-scheduling`).
 */
export function AdvisorySchedulesContent() {
  const canMutateSchedules: boolean = useOperateCapability();
  const [schedules, setSchedules] = useState<AdvisoryScanSchedule[]>([]);
  const [executionsBySchedule, setExecutionsBySchedule] = useState<Record<string, AdvisoryScanExecution[]>>(
    {},
  );
  const [loading, setLoading] = useState(false);
  const [runningScheduleId, setRunningScheduleId] = useState<string | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

  const [name, setName] = useState("Daily Advisory Scan");
  const [cronExpression, setCronExpression] = useState("0 7 * * *");
  const [runProjectSlug, setRunProjectSlug] = useState("default");

  const refresh = useCallback(async () => {
    setLoading(true);
    setFailure(null);
    try {
      const list: AdvisoryScanSchedule[] = await listAdvisorySchedules();
      setSchedules(list);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function loadExecutions(scheduleId: string) {
    try {
      const execs: AdvisoryScanExecution[] = await listScheduleExecutions(scheduleId, 20);
      setExecutionsBySchedule((prev) => ({ ...prev, [scheduleId]: execs }));
    } catch {
      /* ignore */
    }
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();

    if (!canMutateSchedules) {
      return;
    }

    setFailure(null);
    try {
      await createAdvisorySchedule({
        name: name.trim() || "Daily Advisory Scan",
        cronExpression: cronExpression.trim() || "0 7 * * *",
        runProjectSlug: runProjectSlug.trim() || "default",
        isEnabled: true,
      });
      await refresh();
    } catch (err) {
      setFailure(toApiLoadFailure(err));
    }
  }

  async function onRunNow(scheduleId: string) {
    if (!canMutateSchedules) {
      return;
    }

    setFailure(null);
    setRunningScheduleId(scheduleId);

    try {
      await runAdvisoryScheduleNow(scheduleId);
      await loadExecutions(scheduleId);
      await refresh();
    } catch (err) {
      setFailure(toApiLoadFailure(err));
    } finally {
      setRunningScheduleId(null);
    }
  }

  return (
    <div className="w-full max-w-[1200px] px-4 py-6">
      <DocumentLayout>
        <div className="m-0 mb-1 flex flex-wrap items-center gap-2">
          <h2 className={cn("m-0 font-bold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}>Schedules</h2>
        </div>
        <p className="doc-meta m-0">
          Advisory scans evaluate your architecture against configurable advisory rules. Background worker polls every
          ~5 minutes for due schedules. Use the <strong>project slug</strong> (same as the architecture reviews list,
          often <code className={cn("rounded bg-neutral-200 px-1 dark:bg-neutral-800", OPERATOR_TYPOGRAPHY.helper)}>default</code>) so recent
          reviews are discovered.
        </p>

        {failure !== null ? (
          <div role="alert">
            <OperatorApiProblem
              problem={failure.problem}
              fallbackMessage={failure.message}
              correlationId={failure.correlationId}
            />
          </div>
        ) : null}

        <div className={cn("flex flex-col gap-6", !canMutateSchedules && "flex-col-reverse")}>
          <section className="mb-0 rounded-lg border border-neutral-200 p-4 dark:border-neutral-700">
            <h3 className={cn("mt-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {canMutateSchedules
                ? advisorySchedulesCreateSectionHeadingOperator
                : advisorySchedulesCreateSectionHeadingReader}
            </h3>
            <form onSubmit={(ev) => void onCreate(ev)} className="grid max-w-lg gap-3">
              <label>
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  readOnly={!canMutateSchedules}
                  title={canMutateSchedules ? undefined : enterpriseMutationControlDisabledTitle}
                  className={cn(inputClass, "mt-1")}
                />
              </label>
              <CronExpressionBuilder
                value={cronExpression}
                onChange={setCronExpression}
                disabled={!canMutateSchedules}
                inputClassName={inputClass}
              />
              <label>
                Workspace project slug
                <input
                  value={runProjectSlug}
                  onChange={(e) => setRunProjectSlug(e.target.value)}
                  readOnly={!canMutateSchedules}
                  title={canMutateSchedules ? undefined : enterpriseMutationControlDisabledTitle}
                  className={cn(inputClass, "mt-1 font-mono")}
                />
              </label>
              <Button
                type="submit"
                disabled={loading || !canMutateSchedules}
                title={canMutateSchedules ? undefined : enterpriseMutationControlDisabledTitle}
                variant={canMutateSchedules ? "default" : "outline"}
              >
                {canMutateSchedules ? "Create schedule" : advisorySchedulesCreateScheduleButtonLabelReaderRank}
              </Button>
            </form>
          </section>

          <div>
            <div className="mb-4 flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => void refresh()}
                disabled={loading}
                title={
                  canMutateSchedules
                    ? alertToolingListRefreshButtonTitleOperator
                    : alertToolingListRefreshButtonTitleReader
                }
              >
                {loading ? "Loading…" : "Refresh"}
              </Button>
            </div>

            <h3 className={cn("font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {canMutateSchedules ? advisorySchedulesListHeadingOperator : advisorySchedulesListHeadingReader}
            </h3>
            {schedules.length === 0 ? (
              <p className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                {canMutateSchedules ? advisorySchedulesEmptyListOperatorLine : advisorySchedulesEmptyListReaderLine}
              </p>
            ) : (
              <ul className="list-none space-y-3 p-0">
                {schedules.map((s) => (
                  <li
                    key={s.scheduleId}
                    className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
                  >
                    <strong className="text-neutral-900 dark:text-neutral-100">{s.name}</strong>
                    <div className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      <div>
                        Cron: <code className="font-mono">{s.cronExpression}</code>
                      </div>
                      <div>
                        Slug: <code className="font-mono">{s.runProjectSlug}</code>
                      </div>
                      <div>Enabled: {s.isEnabled ? "yes" : "no"}</div>
                      <div>Next execution: {s.nextRunUtc ? new Date(s.nextRunUtc).toLocaleString() : "—"}</div>
                      <div>Last execution: {s.lastRunUtc ? new Date(s.lastRunUtc).toLocaleString() : "—"}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void onRunNow(s.scheduleId)}
                        disabled={!canMutateSchedules || runningScheduleId !== null}
                        title={
                          canMutateSchedules
                            ? "Trigger this schedule immediately for testing (does not wait for the next cron tick)."
                            : enterpriseMutationControlDisabledTitle
                        }
                      >
                        {runningScheduleId === s.scheduleId
                          ? "Running test scan…"
                          : canMutateSchedules
                            ? "Run now (test)"
                            : advisorySchedulesRunNowButtonLabelReaderRank}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void loadExecutions(s.scheduleId)}
                        title={
                          canMutateSchedules
                            ? advisorySchedulesLoadExecutionsButtonTitleOperator
                            : advisorySchedulesLoadExecutionsButtonTitleReader
                        }
                      >
                        {canMutateSchedules ? "Load executions" : advisorySchedulesLoadExecutionsButtonLabelReaderRank}
                      </Button>
                    </div>
                    {executionsBySchedule[s.scheduleId]?.length ? (
                      <div className="mt-3">
                        <h4 className={cn("mt-2 mb-2 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Recent executions</h4>
                        <ul className={cn("pl-[18px]", OPERATOR_TYPOGRAPHY.helper)}>
                          {executionsBySchedule[s.scheduleId].map((ex) => (
                            <li key={ex.executionId}>
                              {ex.status} — {new Date(ex.startedUtc).toLocaleString()}
                              {ex.errorMessage ? ` — ${ex.errorMessage}` : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DocumentLayout>
    </div>
  );
}
