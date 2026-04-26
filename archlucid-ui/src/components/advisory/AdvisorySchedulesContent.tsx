"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { ContextualHelp } from "@/components/ContextualHelp";
import { DocumentLayout } from "@/components/DocumentLayout";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
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
import { cn } from "@/lib/utils";
import type { AdvisoryScanExecution, AdvisoryScanSchedule } from "@/types/advisory-scheduling";

const inputClass =
  "block w-full rounded-md border border-neutral-300 bg-white p-2 text-sm text-neutral-900 dark:border-neutral-600 dark:bg-neutral-950 dark:text-neutral-100";

/**
 * Schedules tab: CRUD and history for scan windows (Execute-class mutations; inspect-only for Read — former `/advisory-scheduling`).
 */
export function AdvisorySchedulesContent() {
  const canMutateSchedules: boolean = useEnterpriseMutationCapability();
  const [schedules, setSchedules] = useState<AdvisoryScanSchedule[]>([]);
  const [executionsBySchedule, setExecutionsBySchedule] = useState<Record<string, AdvisoryScanExecution[]>>(
    {},
  );
  const [loading, setLoading] = useState(false);
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
    try {
      await runAdvisoryScheduleNow(scheduleId);
      await loadExecutions(scheduleId);
      await refresh();
    } catch (err) {
      setFailure(toApiLoadFailure(err));
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <DocumentLayout>
        <div className="m-0 mb-1 flex flex-wrap items-center gap-2">
          <h2 className="m-0 text-xl font-bold text-neutral-900 dark:text-neutral-50">Advisory schedules</h2>
          <ContextualHelp helpKey="advisory-hub" />
        </div>
        <p className="doc-meta m-0">
          Background worker polls every ~5 minutes for due schedules. Use the <strong>project slug</strong> (same as
          Architecture runs list, often <code className="rounded bg-neutral-200 px-1 text-xs dark:bg-neutral-800">default</code>) so recent runs are discovered.
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
            <h3 className="mt-0 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
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
              <label>
                Cron / preset (<code className="rounded bg-neutral-200 px-1 text-xs dark:bg-neutral-800">@hourly</code>, <code className="rounded bg-neutral-200 px-1 text-xs dark:bg-neutral-800">@daily</code>, <code className="rounded bg-neutral-200 px-1 text-xs dark:bg-neutral-800">0 7 * * *</code>)
                <input
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                  readOnly={!canMutateSchedules}
                  title={canMutateSchedules ? undefined : enterpriseMutationControlDisabledTitle}
                  className={cn(inputClass, "mt-1 font-mono")}
                />
              </label>
              <label>
                Run project slug
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

            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {canMutateSchedules ? advisorySchedulesListHeadingOperator : advisorySchedulesListHeadingReader}
            </h3>
            {schedules.length === 0 ? (
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
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
                    <div className="mt-2 text-[13px] text-neutral-600 dark:text-neutral-400">
                      <div>
                        Cron: <code className="font-mono">{s.cronExpression}</code>
                      </div>
                      <div>
                        Slug: <code className="font-mono">{s.runProjectSlug}</code>
                      </div>
                      <div>Enabled: {s.isEnabled ? "yes" : "no"}</div>
                      <div>Next run: {s.nextRunUtc ? new Date(s.nextRunUtc).toLocaleString() : "—"}</div>
                      <div>Last run: {s.lastRunUtc ? new Date(s.lastRunUtc).toLocaleString() : "—"}</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => void onRunNow(s.scheduleId)}
                        disabled={!canMutateSchedules}
                        title={canMutateSchedules ? undefined : enterpriseMutationControlDisabledTitle}
                      >
                        {canMutateSchedules ? "Run now" : advisorySchedulesRunNowButtonLabelReaderRank}
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
                        <h4 className="mt-2 mb-2 text-sm font-semibold text-neutral-900 dark:text-neutral-100">Recent executions</h4>
                        <ul className="pl-[18px] text-[13px]">
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
    </main>
  );
}
