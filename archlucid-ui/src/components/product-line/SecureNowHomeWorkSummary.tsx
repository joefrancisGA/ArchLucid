"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useAssignedToMeFindingsCountQuery } from "@/hooks/use-assigned-to-me-findings-count-query";
import { fetchInfraEvidenceDiffsForSnapshot, fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { fetchRemediationFactorySummary } from "@/lib/infra-evidence/infra-evidence-remediation-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const SNAPSHOT_PAGE_SIZE = 20;

type WorkSummaryRowProps = {
  readonly label: string;
  readonly href: string;
  readonly detail: string;
  readonly error?: string;
};

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : "Could not load this count.";
}

function newestSnapshotId(rows: readonly { capturedUtc: string | null; snapshotId: string }[]): string | null {
  return [...rows]
    .filter((row) => row.capturedUtc !== null)
    .sort((left, right) => Date.parse(right.capturedUtc ?? "") - Date.parse(left.capturedUtc ?? ""))[0]?.snapshotId ?? null;
}

function WorkSummaryRow({ label, href, detail, error }: WorkSummaryRowProps): React.JSX.Element {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-neutral-200 py-2 last:border-b-0 dark:border-neutral-800">
      <Link className={cn(OPERATOR_LINK.inline, "font-medium", OPERATOR_TYPOGRAPHY.body)} href={href}>
        {label}
      </Link>
      <span className={cn("text-right text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)} role={error ? "alert" : undefined}>
        {error ?? detail}
      </span>
    </li>
  );
}

export function SecureNowHomeWorkSummary(): React.JSX.Element {
  const assignedQuery = useAssignedToMeFindingsCountQuery();
  const factoryQuery = useQuery({
    queryKey: ["securenow", "home", "remediation-factory-summary"],
    queryFn: fetchRemediationFactorySummary,
    retry: false,
  });
  const snapshotsQuery = useQuery({
    queryKey: operatorQueryKeys.infraEvidenceSnapshotsList(1, SNAPSHOT_PAGE_SIZE),
    queryFn: () => fetchInfraEvidenceSnapshots(1, SNAPSHOT_PAGE_SIZE),
    retry: false,
  });
  const newestSnapshotIdValue = newestSnapshotId(snapshotsQuery.data?.items ?? []);
  const diffsQuery = useQuery({
    queryKey: ["securenow", "home", "diffs", newestSnapshotIdValue],
    queryFn: () => fetchInfraEvidenceDiffsForSnapshot(newestSnapshotIdValue ?? ""),
    enabled: newestSnapshotIdValue !== null,
    retry: false,
  });

  const criticalExposureCount = factoryQuery.data?.factoryMetrics.criticalExposureCount;
  const awaitingVerification = factoryQuery.data?.openInstancesByStatus.ChangeImplemented;
  const verificationFailures = factoryQuery.data?.openInstancesByStatus.VerificationFailed ?? 0;
  const newestDiff = diffsQuery.data?.[0];
  const assignedDetail =
    assignedQuery.data === undefined ? "Loading…" : assignedQuery.data === 0 ? "None assigned to you" : `${assignedQuery.data} assigned to you`;
  const priorityDetail =
    criticalExposureCount === undefined
      ? "Loading…"
      : criticalExposureCount === 0
        ? "No critical exposure"
        : `${criticalExposureCount} with critical exposure`;
  const changesDetail =
    snapshotsQuery.isError || diffsQuery.isError
      ? "No comparison yet"
      : newestSnapshotIdValue === null
        ? "No comparison yet"
        : newestDiff === undefined
          ? "No changes since the previous collection"
          : `${newestDiff.totalChanges} changes since the previous collection`;
  const verificationDetail =
    awaitingVerification === undefined
      ? "Loading…"
      : awaitingVerification === 0
        ? "None waiting for a check"
        : `${awaitingVerification} waiting for a check`;
  const factoryError = factoryQuery.isError ? errorMessage(factoryQuery.error) : undefined;
  const assignedError = assignedQuery.isError ? errorMessage(assignedQuery.error) : undefined;
  const changesError =
    snapshotsQuery.isError || diffsQuery.isError
      ? errorMessage(snapshotsQuery.error ?? diffsQuery.error)
      : undefined;
  const verificationSuffix = verificationFailures > 0 ? ` · ${verificationFailures} checks failed` : "";

  return (
    <section aria-labelledby="securenow-home-work-summary-heading" data-testid="securenow-home-work-summary">
      <h2 id="securenow-home-work-summary-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Your work
      </h2>
      <ul className="m-0 mt-2 list-none p-0">
        <WorkSummaryRow
          label="My findings"
          href="/security/assigned-to-me"
          detail={assignedDetail}
          error={assignedError}
        />
        <WorkSummaryRow
          label="Highest-priority findings"
          href="/security/remediation-factory"
          detail={priorityDetail}
          error={factoryError}
        />
        <WorkSummaryRow
          label="Recent changes"
          href="/infrastructure/snapshots-drift"
          detail={changesDetail}
          error={changesError}
        />
        <WorkSummaryRow
          label="Awaiting verification"
          href="/security/remediation-instances"
          detail={`${verificationDetail}${verificationSuffix}`}
          error={factoryError}
        />
      </ul>
    </section>
  );
}
