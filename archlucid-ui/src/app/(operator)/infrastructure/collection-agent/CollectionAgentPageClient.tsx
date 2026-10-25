"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

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
import { useCollectionRunsQuery, useTriggerCollectionRunMutation } from "@/hooks/use-collection-runs-query";
import {
  formatCollectionRunDuration,
  formatCollectionRunSubscriptionsLabel,
  resolveCollectionAgentHealth,
  resolveCollectionAgentStaleSuccessDetail,
} from "@/lib/collection-agent-presentation";
import type { CollectionRun } from "@/lib/collection-runs-api";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  SECURENOW_INFRASTRUCTURE_DRIFT_PATH,
  SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH,
} from "@/lib/governance/governance-infrastructure-route-paths";
import {
  SECURENOW_COLLECTION_AGENT_PATH,
} from "@/lib/product-line/securenow-collection-agent-route";
import { resolveSecureNowPageHeading } from "@/lib/product-line/securenow-page-heading";

const COLLECTION_AGENT_PAGE_TITLE = resolveSecureNowPageHeading(
  "security",
  "Collection Agent",
  SECURENOW_COLLECTION_AGENT_PATH,
);
import { OPERATOR_LINK, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { cn } from "@/lib/utils";

function collectionRunSortTime(run: CollectionRun): number {
  return Date.parse(run.finishedUtc ?? run.startedUtc ?? "");
}

function sortCollectionRuns(runs: readonly CollectionRun[]): CollectionRun[] {
  return [...runs].sort((left, right) => {
    const leftRunning = left.status === "Running" ? 1 : 0;
    const rightRunning = right.status === "Running" ? 1 : 0;

    return rightRunning - leftRunning || collectionRunSortTime(right) - collectionRunSortTime(left);
  });
}

function collectionRunStatusKind(status: CollectionRun["status"]): "ready" | "needs-attention" | "blocked" | "in-progress" | "neutral" {
  switch (status) {
    case "Succeeded":
    case "Imported":
      return "ready";

    case "Running":
      return "in-progress";

    case "Failed":
    case "Rejected":
    case "PartiallySucceeded":
      return "needs-attention";

    default:
      return "neutral";
  }
}

export function collectionRunStatusLabel(status: CollectionRun["status"]): string {
  if (status === null || status === undefined) {
    return "Capture status was not stored.";
  }

  switch (status) {
    case "Succeeded":
      return "Collection succeeded.";
    case "Failed":
      return "Collection failed.";
    case "Rejected":
      return "Collection was rejected.";
    case "Running":
      return "Collection is running.";
    case "Imported":
      return "Collection was imported.";
    case "PartiallySucceeded":
      return "Partially succeeded. Collection did not finish.";
    default:
      return status;
  }
}

export function collectionRunStartedUtcDisplay(startedUtc: string | undefined): string {
  if (startedUtc === undefined || startedUtc.trim().length === 0) {
    return "Start time was not stored.";
  }

  const formatted = formatIsoUtcForDisplay(startedUtc);

  if (formatted === startedUtc && Number.isNaN(Date.parse(startedUtc))) {
    return "Start time could not be read.";
  }

  return formatted;
}

function resolveCollectionRunErrorSummaryPresentation(run: CollectionRun): string | null {
  if (run.status !== "Failed" && run.status !== "Rejected" && run.status !== "PartiallySucceeded") {
    return null;
  }

  if (run.errorSummary === null || run.errorSummary === undefined) {
    return "Error summary was not stored.";
  }

  if (run.errorSummary.trim().length === 0) {
    return "Error summary was stored empty.";
  }

  return run.errorSummary;
}

function CollectionRunRow({ run }: { readonly run: CollectionRun }): React.JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const errorPresentation = resolveCollectionRunErrorSummaryPresentation(run);
  const expandable = errorPresentation !== null;

  return (
    <>
      <EnterpriseTableRow
        interactive={expandable}
        aria-expanded={expandable ? expanded : undefined}
        onClick={expandable ? () => setExpanded((current) => !current) : undefined}
        onKeyDown={(event) => {
          if (expandable && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            setExpanded((current) => !current);
          }
        }}
      >
        <EnterpriseTableCell>{collectionRunStartedUtcDisplay(run.startedUtc)}</EnterpriseTableCell>
        <EnterpriseTableCell>{formatCollectionRunDuration(run)}</EnterpriseTableCell>
        <EnterpriseTableCell>
          <StatusTag kind={collectionRunStatusKind(run.status)} label={collectionRunStatusLabel(run.status)} />
        </EnterpriseTableCell>
        <EnterpriseTableCell>{formatCollectionRunSubscriptionsLabel(run)}</EnterpriseTableCell>
        <EnterpriseTableCell>
          {run.importedSnapshotId === null
            || run.importedSnapshotId === undefined
            || run.importedSnapshotId.length === 0 ? (
            "Imported snapshot was not stored."
          ) : (
            <Link
              href={`${SECURENOW_INFRASTRUCTURE_DRIFT_PATH}?snapshotId=${encodeURIComponent(run.importedSnapshotId)}`}
              className={cn(OPERATOR_LINK.inline, "font-medium")}
              onClick={(event) => event.stopPropagation()}
            >
              Open drift for this snapshot
            </Link>
          )}
        </EnterpriseTableCell>
      </EnterpriseTableRow>
      {expanded && errorPresentation !== null ? (
        <EnterpriseTableRow>
          <EnterpriseTableCell colSpan={5}>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{errorPresentation}</p>
          </EnterpriseTableCell>
        </EnterpriseTableRow>
      ) : null}
    </>
  );
}

export function CollectionAgentPageClient(): React.JSX.Element {
  const query = useCollectionRunsQuery();
  const triggerMutation = useTriggerCollectionRunMutation();
  const runs = useMemo(() => sortCollectionRuns(query.data ?? []), [query.data]);
  const health = resolveCollectionAgentHealth(runs);
  const staleSuccessDetail = resolveCollectionAgentStaleSuccessDetail(runs);
  const activeRun = runs.find((run) => run.status === "Running") ?? null;
  const reportedSchedule = runs.find((run) => run.schedule !== null && run.schedule !== undefined && run.schedule.trim().length > 0)?.schedule;
  const triggerFailure = triggerMutation.error === null || triggerMutation.error === undefined
    ? null
    : toApiLoadFailure(triggerMutation.error);
  const successfulRunLabel = health.successfulRun === null
    ? "No successful run was stored."
    : health.successfulRun.finishedUtc === null || health.successfulRun.finishedUtc === undefined
      ? "Last successful run finish time was not stored."
      : `Last successful run ${formatRelativeTime(health.successfulRun.finishedUtc)}`;

  if (query.isPending) {
    return <p className={cn("p-6", OPERATOR_TYPOGRAPHY.body)}>Loading collection runs…</p>;
  }

  if (query.isError) {
    const failure = toApiLoadFailure(query.error);

    return (
      <OperatorPageContainer variant="workflow" className={cn("px-1 py-4 sm:px-0", OPERATOR_LAYOUT.sectionStack)}>
        <OperatorPageHeader title={COLLECTION_AGENT_PAGE_TITLE} subtitle="Whether scheduled collection is running and what it found." />
        <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-950 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-100">
          {failure.message}
        </div>
      </OperatorPageContainer>
    );
  }

  return (
    <OperatorPageContainer variant="workflow" className={cn("px-1 py-4 sm:px-0", OPERATOR_LAYOUT.sectionStack)}>
      <OperatorPageHeader
        navHref={SECURENOW_COLLECTION_AGENT_PATH}
        title={COLLECTION_AGENT_PAGE_TITLE}
        subtitle="Whether a collection run is stored, and its status."
        actions={
          <button
            type="button"
            onClick={() => void triggerMutation.mutateAsync(crypto.randomUUID())}
            disabled={triggerMutation.isPending || activeRun !== null}
            className="rounded border border-teal-700 bg-transparent px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-teal-300 dark:text-teal-200 dark:hover:bg-teal-950"
          >
            {triggerMutation.isPending ? "Starting…" : "Run now"}
          </button>
        }
      />
      {triggerFailure !== null ? (
        <div role="alert" className="rounded-md border border-rose-300 bg-rose-50 p-4 text-rose-950 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-100">
          {triggerFailure.message}
        </div>
      ) : null}
      <section className="space-y-2" aria-labelledby="collection-agent-health-heading">
        <h2 id="collection-agent-health-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Collection health</h2>
        <div className="flex flex-wrap items-center gap-3">
          {runs.length > 0 ? <StatusTag kind={health.kind} label={health.label} /> : null}
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{successfulRunLabel}</span>
        </div>
        {staleSuccessDetail !== null ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>{staleSuccessDetail}</p>
        ) : null}
      </section>

      <section className="space-y-2" aria-labelledby="collection-agent-schedule-heading">
        <h2 id="collection-agent-schedule-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Schedule</h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          {reportedSchedule
            ? `Schedule reported on a collection run: ${reportedSchedule}`
            : "Collection schedule was not stored."}
        </p>
      </section>

      {runs.length === 0 ? (
        <section className="space-y-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800" aria-labelledby="collection-agent-empty-heading">
          <h2 id="collection-agent-empty-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>No collection runs yet.</h2>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            No collection runs were stored. Set up scheduled collection, or upload a package.
          </p>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            <Link href={inAppHelpHref("cloud-connections-azure")} className={cn(OPERATOR_LINK.inline, "font-medium")}>Collection agent setup help</Link>
            {" · "}
            <Link href={SECURENOW_INFRASTRUCTURE_EXTRACT_UPLOAD_PATH} className={cn(OPERATOR_LINK.inline, "font-medium")}>Manual upload</Link>
          </p>
        </section>
      ) : (
        <section className="space-y-3" aria-labelledby="collection-agent-runs-heading">
          <h2 id="collection-agent-runs-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Recent runs</h2>
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
              {runs.map((run) => <CollectionRunRow key={run.runId} run={run} />)}
            </EnterpriseTableBody>
          </EnterpriseTable>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Select a failed, rejected, or partial run to expand its error summary when one was stored.
          </p>
        </section>
      )}
    </OperatorPageContainer>
  );
}
