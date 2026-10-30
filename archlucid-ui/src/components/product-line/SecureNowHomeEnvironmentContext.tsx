"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useTenantWorkspacesListQuery } from "@/hooks/use-tenant-workspaces-list-query";
import { formatRelativeTime } from "@/lib/relative-time";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { resolveInfraEvidenceSnapshotCaptureStatusPresentation } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatScopeSwitcherTriggerLabel,
  isSampleWorkspacePresentationScope,
} from "@/lib/scope-switcher-display";
import { cn } from "@/lib/utils";

const SNAPSHOT_PAGE_SIZE = 20;
const CLOUD_CONNECTIONS_HREF = "/integrations/cloud-connections";
const DRIFT_HREF = "/infrastructure/snapshots-drift";

function subscriptionPhrase(snapshots: readonly InfraEvidenceSnapshotSummary[]): string | null {
  const subscriptions = [...new Set(
    snapshots
      .map((row) => {
        const name = row.subscriptionName?.trim();

        if (name !== undefined && name.length > 0) {
          return name;
        }

        if (row.subscriptionId?.trim()) {
          return "Subscription name was not stored.";
        }

        return "";
      })
      .filter((value) => value.length > 0),
  )];

  if (subscriptions.length === 0) {
    return null;
  }

  if (subscriptions.length === 1) {
    return subscriptions[0] ?? null;
  }

  return `${subscriptions.length} subscriptions`;
}

function collectionGapDescription(snapshot: InfraEvidenceSnapshotSummary): string | null {
  const presentation = resolveInfraEvidenceSnapshotCaptureStatusPresentation(snapshot.captureStatus);

  if (presentation.kind === "needs-attention" || presentation.kind === "blocked" || presentation.kind === "in-progress") {
    return presentation.description;
  }

  return null;
}

function errorMessage(error: unknown): string {
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : "Could not load collection context.";
}

function ContextLink(props: { readonly href: string; readonly children: string }): React.JSX.Element {
  return (
    <Link className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.body)} href={props.href}>
      {props.children}
    </Link>
  );
}

/** One line: workspace, subscription scope, latest collection, and a gap when capture status says there is one. */
export function SecureNowHomeEnvironmentContext(): React.JSX.Element {
  const scope = useOperatorScopeQueryKey();
  const snapshotsQuery = useQuery({
    queryKey: operatorQueryKeys.infraEvidenceSnapshotsList(1, SNAPSHOT_PAGE_SIZE),
    queryFn: () => fetchInfraEvidenceSnapshots(1, SNAPSHOT_PAGE_SIZE),
    retry: false,
  });
  const workspacesQuery = useTenantWorkspacesListQuery();
  const workspace = workspacesQuery.data?.workspaces.find((row) => row.workspaceId === scope.workspaceId);
  const project = workspace?.projects.find((row) => row.projectId === scope.projectId);
  const workspaceName = workspace?.name?.trim() ?? "";
  const projectName = project?.name?.trim() ?? "";
  const isSampleWorkspaceSession = isSampleWorkspacePresentationScope(scope.workspaceId, scope.projectId);
  const workspaceLabel = workspaceName.length === 0
    ? null
    : formatScopeSwitcherTriggerLabel({
        workspaceLabel: workspaceName,
        projectLabel: projectName.length > 0 ? projectName : workspaceName,
        isSampleWorkspaceSession,
        includeProject: !isSampleWorkspaceSession && projectName.length > 0,
      });

  if (snapshotsQuery.isError) {
    return (
      <p className={cn("m-0 flex flex-wrap gap-x-3 gap-y-1", OPERATOR_TYPOGRAPHY.body)} data-testid="securenow-home-environment-context" role="alert">
        {workspaceLabel !== null ? <span>{workspaceLabel}</span> : null}
        <span>{errorMessage(snapshotsQuery.error)}</span>
      </p>
    );
  }

  if (snapshotsQuery.isPending) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-home-environment-context">
        Loading collection context…
      </p>
    );
  }

  const snapshotRows = snapshotsQuery.data?.items ?? [];
  const snapshot = snapshotRows[0] ?? null;

  if (snapshot === null) {
    return (
      <p className={cn("m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1", OPERATOR_TYPOGRAPHY.body)} data-testid="securenow-home-environment-context">
        {workspaceLabel !== null ? <span>{workspaceLabel}</span> : null}
        <ContextLink href={CLOUD_CONNECTIONS_HREF}>No collection yet</ContextLink>
      </p>
    );
  }

  const subscriptions = subscriptionPhrase(snapshotRows);
  const collectedAt = snapshot.capturedUtc === null ? null : formatRelativeTime(snapshot.capturedUtc);
  const gap = collectionGapDescription(snapshot);

  return (
    <p className={cn("m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1", OPERATOR_TYPOGRAPHY.body)} data-testid="securenow-home-environment-context">
      {workspaceLabel !== null ? <span>{workspaceLabel}</span> : null}
      {subscriptions !== null ? <ContextLink href={CLOUD_CONNECTIONS_HREF}>{subscriptions}</ContextLink> : null}
      {collectedAt !== null ? <ContextLink href={DRIFT_HREF}>{collectedAt}</ContextLink> : null}
      {gap !== null ? <ContextLink href={CLOUD_CONNECTIONS_HREF}>{gap}</ContextLink> : null}
    </p>
  );
}
