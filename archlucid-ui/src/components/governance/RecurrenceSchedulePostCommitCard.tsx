"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CronExpressionBuilder } from "@/components/advisory/CronExpressionBuilder";
import { normalizeRunIdForRecurrenceApi } from "@/components/runs/RunDetailRecurrenceScheduleCard";
import { RecurrenceScheduleActivationActions } from "@/components/governance/RecurrenceScheduleActivationActions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { StatusTag } from "@/components/ui/status-tag";
import {
  createArchitectureReviewRecurrenceSchedule,
  listArchitectureReviewRecurrenceSchedules,
  type ArchitectureReviewRecurrenceSchedule,
} from "@/lib/api/governance-stickiness-api";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { RecurrenceLocalTimeDisplay } from "@/components/governance/RecurrenceLocalTimeDisplay";
import {
  formatRecurrenceInstantLocalFirst,
  resolveRecurrenceDisplayTimeZoneId,
} from "@/lib/recurrence-local-time";
import { RECURRENCE_SCHEDULES_MANAGE_PATH } from "@/lib/recurrence-schedules-copy";
import {
  clearRecurrenceProposalDecline,
  hasDeclinedRecurrenceProposal,
  recordRecurrenceProposalDecline,
} from "@/lib/governance/recurrence-proposal-decline";
import {
  RECURRENCE_DECLINED_STATUS,
  RECURRENCE_PROPOSAL_LEAD,
} from "@/lib/recurrence-schedule-activation-copy";

const DEFAULT_CRON = "0 8 * * 1";
const DEFAULT_NAME = "Weekly architecture review";

type RecurrenceSchedulePostCommitCardProps = {
  readonly runId: string;
  readonly hasStickinessPrompt?: boolean;
  /** When ReviewPackageDoThisNextStrip owns the filled page primary (TB-2175). */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

/** TB-222 — post-commit recurrence scheduling with cron + display name. */
export function RecurrenceSchedulePostCommitCard({
  runId,
  hasStickinessPrompt = false,
  pagePrimaryOwnedElsewhere = false,
}: RecurrenceSchedulePostCommitCardProps) {
  const [open, setOpen] = useState(hasStickinessPrompt);
  const [schedules, setSchedules] = useState<ArchitectureReviewRecurrenceSchedule[]>([]);
  const [name, setName] = useState(DEFAULT_NAME);
  const [cronExpression, setCronExpression] = useState(DEFAULT_CRON);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [declined, setDeclined] = useState(false);

  const normalizedRunId = normalizeRunIdForRecurrenceApi(runId);
  const displayTimeZoneId = useMemo(() => resolveRecurrenceDisplayTimeZoneId(), []);

  // Read after mount, not during state init: both mount sites allow SSR, and localStorage is
  // client-only, so an initializer read would desync the hydrated markup.
  useEffect(() => {
    if (hasDeclinedRecurrenceProposal(runId)) {
      setDeclined(true);
      setOpen(false);
    }
  }, [runId]);

  const reload = useCallback(async (): Promise<void> => {
    const rows = await listArchitectureReviewRecurrenceSchedules();
    setSchedules(
      normalizedRunId === null
        ? []
        : rows.filter((row) => row.sourceRunId.replace(/-/g, "").toLowerCase() === normalizedRunId.replace(/-/g, "")),
    );
  }, [normalizedRunId]);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      try {
        await reload();
      } catch {
        if (!canceled) {
          setErrorMessage("Recurrence schedules could not be loaded.");
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [reload]);

  async function submitSchedule(isEnabled: boolean): Promise<void> {
    if (normalizedRunId === null) {
      setErrorMessage("Run id is not a valid GUID for recurrence scheduling.");

      return;
    }

    setBusy(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await createArchitectureReviewRecurrenceSchedule({
        sourceRunId: normalizedRunId,
        name: name.trim() || DEFAULT_NAME,
        cronExpression: cronExpression.trim() || DEFAULT_CRON,
        isEnabled,
      });

      setStatusMessage(isEnabled ? "Recurring assessments enabled." : "Recurrence schedule saved (paused).");
      await reload();
    } catch (error: unknown) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to create recurrence schedule.");
    } finally {
      setBusy(false);
    }
  }

  /** Declining creates nothing: it records the choice locally and stops re-proposing. */
  function declineProposal(): void {
    recordRecurrenceProposalDecline(runId);
    setErrorMessage(null);
    setStatusMessage(null);
    setDeclined(true);
  }

  /** Never trap the operator in a declined state; clearing the record restores the proposal. */
  function reconsiderProposal(): void {
    clearRecurrenceProposalDecline(runId);
    setDeclined(false);
  }

  const existing = schedules[0] ?? null;

  return (
    <Collapsible
      id="recurrence-schedule-post-commit-card"
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950"
      data-testid="recurrence-schedule-post-commit-card"
    >
      <CollapsibleTrigger className="flex w-full items-center justify-between gap-2 p-4 text-left">
        <h3 className={cn("m-0", OPERATOR_TYPOGRAPHY.pageTitle)}>Schedule next review</h3>
        <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{open ? "Hide" : "Show"}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-neutral-200 px-4 pb-4 pt-3 dark:border-neutral-700">
        <p className={cn("m-0 mb-3", OPERATOR_TYPOGRAPHY.body)} data-testid="recurrence-proposal-lead">
          {existing === null && !declined
            ? RECURRENCE_PROPOSAL_LEAD
            : "Clone this committed review on a schedule so governance does not depend on manual scheduling."}
        </p>
        {existing ? (
          <div className="space-y-2">
            <StatusTag kind="ready" label="Scheduled" />
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.label)}>
              {existing.name} — {existing.cronExpression}
            </p>
            <div className={cn(OPERATOR_TYPOGRAPHY.label)}>
              <span className="block">Next run</span>
              <RecurrenceLocalTimeDisplay
                summary={formatRecurrenceInstantLocalFirst(existing.nextRunUtc, displayTimeZoneId)}
              />
            </div>
            <Link
              href={RECURRENCE_SCHEDULES_MANAGE_PATH}
              className={OPERATOR_BODY_INLINE_LINK_CLASS}
              data-testid="recurrence-schedule-manage-link"
            >
              Manage all recurrence schedules
            </Link>
          </div>
        ) : declined ? (
          <div className="space-y-2" data-testid="recurrence-proposal-declined">
            <StatusTag kind="neutral" label="Not scheduled" />
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{RECURRENCE_DECLINED_STATUS}</p>
            <button
              type="button"
              className={cn(OPERATOR_BODY_INLINE_LINK_CLASS, "cursor-pointer bg-transparent p-0 text-left")}
              onClick={reconsiderProposal}
              data-testid="recurrence-reconsider-proposal"
            >
              Set up a schedule anyway
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className={cn("flex flex-col gap-1", OPERATOR_TYPOGRAPHY.body)}>
              <span className={OPERATOR_TYPOGRAPHY.label}>
                Schedule name <span className="text-red-700 dark:text-red-400">*</span>
              </span>
              <input
                required
                className={cn(
                  "rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900",
                  OPERATOR_TYPOGRAPHY.body,
                )}
                value={name}
                onChange={(e) => setName(e.target.value)}
                data-testid="recurrence-schedule-name"
              />
            </label>
            <CronExpressionBuilder
              value={cronExpression}
              onChange={setCronExpression}
              disabled={busy}
              inputClassName={cn(
                "w-full rounded border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900",
                OPERATOR_TYPOGRAPHY.body,
              )}
            />
            <RecurrenceScheduleActivationActions
              mode="create"
              cronExpression={cronExpression}
              pendingIsEnabled={false}
              disabled={normalizedRunId === null}
              busy={busy}
              onSavePaused={() => void submitSchedule(false)}
              onEnableRecurring={() => void submitSchedule(true)}
              onDecline={declineProposal}
              pagePrimaryOwnedElsewhere={pagePrimaryOwnedElsewhere}
            />
            {statusMessage ? (
              <p className={cn("m-0 text-teal-800 dark:text-teal-300", OPERATOR_TYPOGRAPHY.body)}>{statusMessage}</p>
            ) : null}
            {errorMessage ? (
              <p className={cn("m-0 text-red-700 dark:text-red-400", OPERATOR_TYPOGRAPHY.body)}>{errorMessage}</p>
            ) : null}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
