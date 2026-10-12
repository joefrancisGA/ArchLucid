"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { StatusTag } from "@/components/ui/status-tag";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useTenantWorkspacesListQuery } from "@/hooks/use-tenant-workspaces-list-query";
import { formatRelativeTime } from "@/lib/relative-time";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { infraEvidenceSnapshotCaptureStatusTagProps } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

const SNAPSHOT_PAGE_SIZE = 20;

function newestSnapshot(snapshots: readonly InfraEvidenceSnapshotSummary[]): InfraEvidenceSnapshotSummary | null {
  return [...snapshots]
    .filter((snapshot) => snapshot.capturedUtc !== null)
    .sort((left, right) => Date.parse(right.capturedUtc ?? "") - Date.parse(left.capturedUtc ?? ""))[0] ?? null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : "Could not load collection context.";
}

export function SecureNowHomeEnvironmentContext(): React.JSX.Element {
  const scope = useOperatorScopeQueryKey();
  const snapshotsQuery = useQuery({
    queryKey: operatorQueryKeys.infraEvidenceSnapshotsList(1, SNAPSHOT_PAGE_SIZE),
    queryFn: () => fetchInfraEvidenceSnapshots(1, SNAPSHOT_PAGE_SIZE),
    retry: false,
  });
  const workspacesQuery = useTenantWorkspacesListQuery();
  const snapshotPage = snapshotsQuery.data;
  const snapshotRows = snapshotPage?.items ?? [];
  const snapshot = newestSnapshot(snapshotRows);
  const workspace = workspacesQuery.data?.workspaces.find((row) => row.workspaceId === scope.workspaceId);
  const project = workspace?.projects.find((row) => row.projectId === scope.projectId);
  const workspaceLabel = workspace?.name ?? "Workspace";
  const workspaceDetail = project?.name ? `${workspaceLabel} — ${project.name}` : workspaceLabel;
  const subscriptions = [...new Set(
    snapshotRows
      .map((row) => row.subscriptionName?.trim() || row.subscriptionId?.trim() || "")
      .filter((value) => value.length > 0),
  )];

  if (snapshotsQuery.isError) {
    return (
      <section className="space-y-1" data-testid="securenow-home-environment-context">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          <span className="font-semibold">Workspace:</span> {workspaceDetail}
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="alert">
          {errorMessage(snapshotsQuery.error)}
        </p>
      </section>
    );
  }

  if (snapshotsQuery.isPending) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-home-environment-context">
        Loading collection context…
      </p>
    );
  }

  if (snapshot === null) {
    return (
      <section className="space-y-1" data-testid="securenow-home-environment-context">
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          <span className="font-semibold">Workspace:</span> {workspaceDetail}
        </p>
        <Link className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)} href="/integrations/cloud-connections">
          No collection yet
        </Link>
      </section>
    );
  }

  const status = infraEvidenceSnapshotCaptureStatusTagProps(snapshot.captureStatus);
  const hasGap = status.kind !== "ready";
  const subscriptionLabel =
    subscriptions.length > 1 ? `${subscriptions.length} subscriptions` : subscriptions[0] ?? "Subscription unavailable";

  return (
    <section className="flex flex-wrap gap-x-4 gap-y-1" data-testid="securenow-home-environment-context">
      <span className={OPERATOR_TYPOGRAPHY.body}>
        <span className="font-semibold">Workspace:</span> {workspaceDetail}
      </span>
      <Link className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)} href="/integrations/cloud-connections">
        <span className="font-semibold">Subscription:</span> {subscriptionLabel}
      </Link>
      <Link className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)} href="/infrastructure/snapshots-drift">
        <span className="font-semibold">Latest collection:</span> {formatRelativeTime(snapshot.capturedUtc ?? "")}
      </Link>
      {hasGap ? (
        <Link className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)} href="/integrations/cloud-connections">
          <StatusTag kind={status.kind} label={status.label} /> {status.title}
        </Link>
      ) : null}
    </section>
  );
}
