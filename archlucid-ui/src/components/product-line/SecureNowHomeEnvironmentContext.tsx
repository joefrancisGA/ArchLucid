"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useTenantWorkspacesListQuery } from "@/hooks/use-tenant-workspaces-list-query";
import { formatRelativeTime } from "@/lib/relative-time";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { resolveInfraEvidenceSnapshotCaptureStatusPresentation } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { fetchRankedSecurityEvidencePaths } from "@/lib/security-evidence-path-api";
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
const RANKED_PATHS_HREF = "/security/remediation-factory";
const FIRST_HOUR_STOP_HREF = "/administration/securenow-first-hour#stop";

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
    ? `${error.message}. Check cloud connections and try again.`
    : "Could not load collection context. Check cloud connections and try again.";
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
  const searchParams = useSearchParams();
  const scope = useOperatorScopeQueryKey();
  const snapshotsQuery = useQuery({
    queryKey: operatorQueryKeys.infraEvidenceSnapshotsList(1, SNAPSHOT_PAGE_SIZE),
    queryFn: () => fetchInfraEvidenceSnapshots(1, SNAPSHOT_PAGE_SIZE),
    retry: false,
  });
  const rankedPathsQuery = useQuery({
    queryKey: ["securenow", "home", "ranked-paths", scope.workspaceId, scope.projectId],
    queryFn: () => fetchRankedSecurityEvidencePaths(1, 1),
    retry: false,
    enabled: snapshotsQuery.isSuccess,
  });
  const firstRankedPathId = rankedPathsQuery.data?.items[0]?.pathId.trim() ?? "";
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
        <ContextLink href={CLOUD_CONNECTIONS_HREF}>Check cloud connections</ContextLink>
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
  const selectedPathId = searchParams.get("pathId")?.trim() ?? "";

  const nextStep = (
    needsCollection: boolean,
    firstRankedPathId: string,
  ): { label: string; href: string } => {
    if (needsCollection) {
      return { label: "Next: Scope and freshness", href: CLOUD_CONNECTIONS_HREF };
    }

    if (selectedPathId.length > 0) {
      return { label: "Next: Stop", href: FIRST_HOUR_STOP_HREF };
    }

    if (firstRankedPathId.length > 0) {
      return {
        label: "Next: One ranked path",
        href: `${RANKED_PATHS_HREF}?pathId=${encodeURIComponent(firstRankedPathId)}`,
      };
    }

    return { label: "Next: One ranked path", href: RANKED_PATHS_HREF };
  };

  if (snapshot === null) {
    const next = nextStep(true, firstRankedPathId);

    return (
      <div
        className="space-y-1"
        data-testid="securenow-home-environment-context"
      >
        <p className={cn("m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1", OPERATOR_TYPOGRAPHY.body)}>
        {workspaceLabel !== null ? <span>{workspaceLabel}</span> : null}
        <ContextLink href={CLOUD_CONNECTIONS_HREF}>No collection yet</ContextLink>
        <ContextLink href="/administration/securenow-first-hour">First hour</ContextLink>
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-home-next-step">
          Next step:{" "}
          <ContextLink href={next.href}>{next.label.replace("Next: ", "")}</ContextLink>{" "}
          This is not a timed SLA.
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-home-capture-delta">
          Capture delta: Waiting for a second capture.{" "}
          <ContextLink href={DRIFT_HREF}>Compare captures</ContextLink>
        </p>
      </div>
    );
  }

  const subscriptions = subscriptionPhrase(snapshotRows);
  const collectedAt = snapshot.capturedUtc === null ? null : formatRelativeTime(snapshot.capturedUtc);
  const gap = collectionGapDescription(snapshot);
  const next = nextStep(gap !== null, firstRankedPathId);

  return (
    <div className="space-y-1" data-testid="securenow-home-environment-context">
      <p className={cn("m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1", OPERATOR_TYPOGRAPHY.body)}>
        {workspaceLabel !== null ? <span>{workspaceLabel}</span> : null}
        {subscriptions !== null ? <ContextLink href={CLOUD_CONNECTIONS_HREF}>{subscriptions}</ContextLink> : null}
        {collectedAt !== null ? <ContextLink href={DRIFT_HREF}>{collectedAt}</ContextLink> : null}
        {gap !== null ? <ContextLink href={CLOUD_CONNECTIONS_HREF}>{gap}</ContextLink> : null}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-home-next-step">
        Next step:{" "}
        <ContextLink href={next.href}>{next.label.replace("Next: ", "")}</ContextLink>{" "}
        This is not a timed SLA.
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-home-capture-delta">
        Capture delta: {snapshotRows.length >= 2
          ? "Two or more captures are available. Compare stored snapshot evidence in Drift."
          : "Waiting for a second capture."}{" "}
        <ContextLink href={DRIFT_HREF}>Compare captures</ContextLink>
      </p>
    </div>
  );
}
