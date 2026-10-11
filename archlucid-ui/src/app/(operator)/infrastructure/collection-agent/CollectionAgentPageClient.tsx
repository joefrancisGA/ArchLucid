"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  CollectionRunApiError,
  fetchCollectionRuns,
  triggerCollectionRun,
  type CollectionRun,
  type CollectionRunStatus,
} from "@/lib/securenow-collection-agent-api";
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
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_LAYOUT, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { cn } from "@/lib/utils";

const COLLECTION_AGENT_HELP_PATH = "/help/collection-agent";
const REFRESH_INTERVAL_MS = 15_000;
const EXPECTED_COLLECTION_INTERVAL_MS = 24 * 60 * 60 * 1000;

export function CollectionAgentPageClient(): React.JSX.Element {
  const [runs, setRuns] = useState<CollectionRun[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [isTriggering, setIsTriggering] = useState<boolean>(false);

  const loadRuns = useCallback(async (signal?: AbortSignal): Promise<void> => {
    try {
      const nextRuns = await fetchCollectionRuns(signal);
      setRuns(nextRuns);
      setLoadError(null);
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setLoadError(error instanceof Error ? error.message : "Collection runs could not be loaded.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void loadRuns(controller.signal);
    return () => controller.abort();
  }, [loadRuns]);

  const pending = runs.some((run) => normalizeStatus(run.status) === "Running");

  useEffect(() => {
    if (!pending) {
      return;
    }

    const interval = window.setInterval(() => {
      void loadRuns();
    }, REFRESH_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [loadRuns, pending]);

  const handleTrigger = async (): Promise<void> => {
    setIsTriggering(true);
    setTriggerError(null);

    try {
      await triggerCollectionRun();
      await loadRuns();
    } catch (error: unknown) {
      setTriggerError(
        error instanceof CollectionRunApiError || error instanceof Error
          ? error.message
          : "The collection run could not be started.",
      );
    } finally {
      setIsTriggering(false);
    }
  };

  const latestSuccessfulRun = runs.find((run) => isSuccessfulStatus(normalizeStatus(run.status)));
  const latestRun = runs[0];
  const health = resolveHealth(latestSuccessfulRun, latestRun);

  return (
    <OperatorPageContainer variant="workflow" className={cn("px-1 py-4 sm:px-0", OPERATOR_LAYOUT.sectionStack)}>
      <OperatorPageHeader
        navHref="/infrastructure"
        title="Collection agent"
        subtitle="See whether scheduled evidence collection is healthy and what the latest run found."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleTrigger()}
            disabled={isTriggering || pending}
            data-testid="collection-agent-run-now"
          >
            {isTriggering ? "Starting…" : pending ? "Run pending" : "Run now"}
          </Button>
        }
      />

      <section className="space-y-4" aria-labelledby="collection-agent-health-heading">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/40">
          <div>
            <h2 id="collection-agent-health-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
              Collection health
            </h2>
            <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {latestSuccessfulRun
                ? `Last successful run ${formatRelativeTime(latestSuccessfulRun.finishedUtc ?? latestSuccessfulRun.startedUtc)}.`
                : "There has never been a successful collection run."}
            </p>
          </div>
          <StatusTag kind={health.kind} label={health.label} />
        </div>

        {triggerError ? (
          <p role="alert" className="m-0 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {triggerError}
          </p>
        ) : null}

        <div className="rounded-md border border-neutral-200 p-4 dark:border-neutral-700">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Schedule</dt>
              <dd className="m-0 mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                {latestRun?.scheduleDescription ?? "Schedule not reported yet."}
              </dd>
            </div>
            <div>
              <dt className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Last run</dt>
              <dd className="m-0 mt-1 text-sm text-neutral-900 dark:text-neutral-100">
                {latestRun ? formatRelativeTime(latestRun.startedUtc) : "No collection runs yet."}
              </dd>
            </div>
          </dl>
        </div>

        {isLoading ? <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">Loading collection runs…</p> : null}
        {loadError ? (
          <p role="alert" className="m-0 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
            {loadError}
          </p>
        ) : null}

        {!isLoading && !loadError && runs.length === 0 ? <EmptyCollectionRuns /> : null}

        {!isLoading && !loadError && runs.length > 0 ? <CollectionRunsTable runs={runs} /> : null}
      </section>
    </OperatorPageContainer>
  );
}

function CollectionRunsTable({ runs }: { readonly runs: readonly CollectionRun[] }): React.JSX.Element {
  return (
    <section className="space-y-3" aria-labelledby="collection-agent-recent-runs-heading">
      <h2 id="collection-agent-recent-runs-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Recent runs
      </h2>
      <EnterpriseTable ariaLabel="Recent collection runs">
        <EnterpriseTableHead>
          <EnterpriseTableHeadRow>
            <EnterpriseTableHeaderCell>Started</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Duration</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Subscriptions</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Snapshot</EnterpriseTableHeaderCell>
          </EnterpriseTableHeadRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {runs.map((run) => {
            const status = normalizeStatus(run.status);
            const error = status === "Failed" || status === "Rejected" ? run.errorSummary : null;
            return (
              <EnterpriseTableRow key={run.runId}>
                <EnterpriseTableCell>{formatDateTime(run.startedUtc)}</EnterpriseTableCell>
                <EnterpriseTableCell>{formatDuration(run.startedUtc, run.finishedUtc)}</EnterpriseTableCell>
                <EnterpriseTableCell><StatusTag kind={statusKind(status)} label={statusLabel(status)} /></EnterpriseTableCell>
                <EnterpriseTableCell>{parseSubscriptions(run.subscriptionsCoveredJson)}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  {run.importedSnapshotId ? (
                    <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={`/infrastructure/snapshots-drift?snapshotId=${encodeURIComponent(run.importedSnapshotId)}`}>
                      View changes
                    </Link>
                  ) : "—"}
                  {error ? (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-neutral-600 dark:text-neutral-400">Why it failed</summary>
                      <p className="mt-1 max-w-sm whitespace-normal text-red-700 dark:text-red-300">{error}</p>
                    </details>
                  ) : null}
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </section>
  );
}

function EmptyCollectionRuns(): React.JSX.Element {
  return (
    <div
      className="rounded-md border border-dashed border-neutral-300 p-6 dark:border-neutral-700"
      data-testid="collection-agent-empty-state"
    >
      <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">No collection runs yet.</p>
      <p className="m-0 mt-1 text-sm text-neutral-600 dark:text-neutral-400">
        Set up the collection agent or use a ZIP while live collection is unavailable.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={COLLECTION_AGENT_HELP_PATH}>Agent setup help</Link>
        <Link className={cn(OPERATOR_LINK.inline, "font-medium")} href={SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH}>Manual upload</Link>
      </div>
    </div>
  );
}

function resolveHealth(
  successfulRun: CollectionRun | undefined,
  latestRun: CollectionRun | undefined,
): { readonly kind: "ready" | "needs-attention" | "blocked"; readonly label: string } {
  if (!successfulRun) {
    return { kind: "blocked", label: "Blocked" };
  }

  const successfulAt = new Date(successfulRun.finishedUtc ?? successfulRun.startedUtc).getTime();
  const hasRecentSuccess = Date.now() - successfulAt <= EXPECTED_COLLECTION_INTERVAL_MS;
  const latestFailed = latestRun !== undefined && ["Failed", "Rejected"].includes(normalizeStatus(latestRun.status));
  return hasRecentSuccess && !latestFailed
    ? { kind: "ready", label: "Ready" }
    : { kind: "needs-attention", label: "Needs attention" };
}

function normalizeStatus(status: CollectionRunStatus | number): CollectionRunStatus {
  if (typeof status === "number") {
    return ["Running", "Succeeded", "PartiallySucceeded", "Failed", "Imported", "Rejected"][status] as CollectionRunStatus ?? "Failed";
  }
  return status;
}

function isSuccessfulStatus(status: CollectionRunStatus): boolean {
  return status === "Succeeded" || status === "Imported";
}

function statusKind(status: CollectionRunStatus): "ready" | "needs-attention" | "blocked" | "in-progress" | "neutral" {
  if (status === "Running") {
    return "in-progress";
  }
  if (isSuccessfulStatus(status)) {
    return "ready";
  }
  if (status === "Failed" || status === "Rejected" || status === "PartiallySucceeded") {
    return "needs-attention";
  }
  return "neutral";
}

function statusLabel(status: CollectionRunStatus): string {
  return status === "PartiallySucceeded" ? "Partial" : status;
}

function parseSubscriptions(json: string): string {
  try {
    const subscriptions: unknown = JSON.parse(json);
    return Array.isArray(subscriptions) ? `${subscriptions.length} covered` : "—";
  } catch {
    return "—";
  }
}

function formatRelativeTime(value: string): string {
  const elapsedMinutes = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60_000));
  if (elapsedMinutes < 60) return `${elapsedMinutes}m ago`;
  const elapsedHours = Math.round(elapsedMinutes / 60);
  if (elapsedHours < 24) return `${elapsedHours}h ago`;
  return `${Math.round(elapsedHours / 24)}d ago`;
}

function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatDuration(started: string, finished: string | null): string {
  if (!finished) return "In progress";
  const seconds = Math.max(0, Math.round((new Date(finished).getTime() - new Date(started).getTime()) / 1000));
  return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}
