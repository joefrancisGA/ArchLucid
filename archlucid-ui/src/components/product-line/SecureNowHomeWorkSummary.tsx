"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useAssignedToMeFindingsCountQuery } from "@/hooks/use-assigned-to-me-findings-count-query";
import { fetchInfraEvidenceDiffsForSnapshot, fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import type { InfraEvidenceDiffSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { fetchRemediationFactorySummary } from "@/lib/infra-evidence/infra-evidence-remediation-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";
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

function newestDiff(diffs: readonly InfraEvidenceDiffSummary[]): InfraEvidenceDiffSummary | null {
  return [...diffs].sort((left, right) => Date.parse(right.createdUtc) - Date.parse(left.createdUtc))[0] ?? null;
}

function knownCountDetail(count: number | null | undefined, zeroCopy: string, knownCopy: (count: number) => string): string {
  if (count === null || count === undefined) {
    return "";
  }

  if (count === 0) {
    return zeroCopy;
  }

  return knownCopy(count);
}

function WorkSummaryRow({ label, href, detail, error }: WorkSummaryRowProps): React.JSX.Element {
  const visibleDetail = error ?? detail;

  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-neutral-200 py-2 last:border-b-0 dark:border-neutral-800">
      <Link className={cn(OPERATOR_LINK.inline, "font-medium", OPERATOR_TYPOGRAPHY.body)} href={href}>
        {label}
      </Link>
      {visibleDetail.length > 0 ? (
        <span className={cn("text-right", OPERATOR_TYPOGRAPHY.dataValue)} role={error ? "alert" : undefined}>
          {visibleDetail}
        </span>
      ) : null}
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
  const factorySummary = factoryQuery.data;
  const criticalExposureCount = factorySummary === undefined
    ? undefined
    : factorySummary.factoryMetrics.criticalExposureCount;
  const awaitingVerification = factorySummary === undefined
    ? undefined
    : factorySummary.openInstancesByStatus.ChangeImplemented;
  const verificationFailures = factorySummary?.openInstancesByStatus.VerificationFailed;
  const myFindingsLabel = SECURENOW_NAV_LABELS["/security/assigned-to-me"] ?? "My findings";
  const assignedDetail = assignedQuery.isPending
    ? "Loading…"
    : knownCountDetail(assignedQuery.data, "None assigned to you", (count) => `${count} assigned to you`);
  const priorityDetail = factoryQuery.isPending
    ? "Loading…"
    : knownCountDetail(
        criticalExposureCount,
        "No critical exposure",
        (count) => `${count} with critical exposure`,
      );
  const comparisonDiff = diffsQuery.data === undefined ? null : newestDiff(diffsQuery.data);
  const changesDetail = snapshotsQuery.isPending || (newestSnapshotIdValue !== null && diffsQuery.isPending)
    ? "Loading…"
    : comparisonDiff === null
      ? "No comparison yet"
      : knownCountDetail(
          comparisonDiff.totalChanges,
          "No comparison yet",
          (count) => `${count} changes since the previous collection`,
        );
  const verificationDetail = factoryQuery.isPending
    ? "Loading…"
    : knownCountDetail(
        awaitingVerification,
        "None waiting for a check",
        (count) => `${count} waiting for a check`,
      );
  const verificationSuffix = verificationFailures !== undefined && verificationFailures > 0
    ? ` · ${verificationFailures} checks failed`
    : "";
  const factoryError = factoryQuery.isError ? errorMessage(factoryQuery.error) : undefined;
  const assignedError = assignedQuery.isError ? errorMessage(assignedQuery.error) : undefined;
  const changesError = snapshotsQuery.isError || diffsQuery.isError
    ? errorMessage(snapshotsQuery.error ?? diffsQuery.error)
    : undefined;

  return (
    <section
      aria-labelledby="securenow-home-work-summary-heading"
      className="space-y-4 p-4"
      data-testid="securenow-home-work-summary"
    >
      <h2 id="securenow-home-work-summary-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
        Your work
      </h2>
      <ul className="m-0 list-none p-0">
        <WorkSummaryRow
          label={myFindingsLabel}
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
          detail={factoryError === undefined ? `${verificationDetail}${verificationSuffix}` : verificationDetail}
          error={factoryError}
        />
      </ul>
    </section>
  );
}
