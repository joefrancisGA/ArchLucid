"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";

import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useTenantWorkspacesListQuery } from "@/hooks/use-tenant-workspaces-list-query";
import { formatRelativeTime } from "@/lib/relative-time";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import {
  isInfraEvidenceSnapshotCaptureSucceeded,
  resolveInfraEvidenceSnapshotCaptureStatusPresentation,
} from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  computeSecureNowCapturePathDelta,
  collectSecurityEvidencePathIdsFromAttackPathReport,
} from "@/lib/product-line/securenow-capture-path-delta";
import {
  formatSecureNowCapturePathDeltaCounts,
  readSecureNowLastOpenedSnapshotId,
  secureNowPathInspectHref,
  writeSecureNowLastOpenedSnapshotId,
} from "@/lib/product-line/securenow-stickiness";
import { SECURENOW_COLLECTION_SETUP_API_UNREACHABLE } from "@/lib/product-line/securenow-workspace-api-unreachable-copy";
import { ADMINISTRATION_SYSTEM_HEALTH_PATH } from "@/lib/administration-route-paths";
import { fetchRankedSecurityEvidencePaths, fetchSecurityEvidencePathAttackPathReport } from "@/lib/security-evidence-path-api";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatScopeSwitcherTriggerLabel,
  isSampleWorkspacePresentationScope,
} from "@/lib/scope-switcher-display";
import { SecureNowCollectionPrimaryBlockerLine } from "@/components/product-line/SecureNowCollectionPrimaryBlockerLine";
import { SecureNowWorkspaceApiUnreachableNotice } from "@/components/product-line/SecureNowWorkspaceApiUnreachableNotice";
import { SecureNowCollectionSetupChecklist } from "@/components/product-line/SecureNowCollectionSetupChecklist";
import {
  resolveSecureNowHomeCollectionSetupFallbackInput,
  useSecureNowCollectionSetupInput,
} from "@/hooks/use-securenow-collection-setup-input";
import { resolveSecureNowHomeEnvironmentNextStep } from "@/lib/product-line/securenow-home-next-step";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { cn } from "@/lib/utils";

const SNAPSHOT_PAGE_SIZE = 20;
const CLOUD_CONNECTIONS_HREF = CLOUD_CONNECTIONS_PATH;
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

function PathIdLinks(props: { readonly pathIds: readonly string[] }): React.JSX.Element {
  if (props.pathIds.length === 0) {
    return <span>None</span>;
  }

  return (
    <>
      {props.pathIds.map((pathId, index) => (
        <span key={pathId}>
          {index > 0 ? ", " : null}
          <ContextLink href={secureNowPathInspectHref(pathId)}>{pathId}</ContextLink>
        </span>
      ))}
    </>
  );
}

function CaptureDeltaBlock(props: {
  readonly stickinessScope: { readonly tenantId: string; readonly workspaceId: string };
  readonly eligibleSnapshots: readonly InfraEvidenceSnapshotSummary[];
  readonly reportQueries: ReadonlyArray<{ readonly isPending: boolean; readonly isError: boolean; readonly data: ReturnType<typeof collectSecurityEvidencePathIdsFromAttackPathReport> | undefined }>;
}): React.JSX.Element {
  const latestSnapshotId = props.eligibleSnapshots[0]?.snapshotId ?? null;
  const [lastOpenedSnapshotId, setLastOpenedSnapshotId] = useState<string | null>(null);

  useEffect(() => {
    const previous = readSecureNowLastOpenedSnapshotId(props.stickinessScope);
    setLastOpenedSnapshotId(previous);

    if (latestSnapshotId !== null) {
      writeSecureNowLastOpenedSnapshotId(props.stickinessScope, latestSnapshotId);
    }
  }, [latestSnapshotId, props.stickinessScope]);
  if (props.eligibleSnapshots.length < 2) {
    return (
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-capture-delta">
        A second capture is required before path changes can be listed.{" "}
        <ContextLink href={DRIFT_HREF}>Compare captures</ContextLink>
      </p>
    );
  }

  if (props.reportQueries.some((query) => query.isPending)) {
    return (
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-capture-delta">
        Loading path changes since the previous capture…
      </p>
    );
  }

  if (props.reportQueries.some((query) => query.isError)) {
    return (
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-capture-delta">
        Path changes could not be loaded for the latest captures.{" "}
        <ContextLink href={DRIFT_HREF}>Compare captures</ContextLink>
      </p>
    );
  }

  const latestIds = props.reportQueries[0]?.data ?? [];
  const previousIds = props.reportQueries[1]?.data ?? [];
  const delta = computeSecureNowCapturePathDelta(previousIds, latestIds);

  const returnSinceLastOpen =
    lastOpenedSnapshotId === null || latestSnapshotId === null
      ? null
      : lastOpenedSnapshotId === latestSnapshotId
        ? "No newer capture since you last opened Home."
        : "New capture since you last opened Home.";

  return (
    <div className={cn("m-0 space-y-1", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-capture-delta">
      <p className="m-0" data-testid="securenow-capture-delta-counts">
        {formatSecureNowCapturePathDeltaCounts(delta)}
      </p>
      <p className="m-0">
        Added: <PathIdLinks pathIds={delta.added} /> · Gone: <PathIdLinks pathIds={delta.gone} /> · Unchanged:{" "}
        <PathIdLinks pathIds={delta.unchanged} />
      </p>
      {returnSinceLastOpen !== null ? (
        <p className="m-0" data-testid="securenow-last-opened-capture">
          {returnSinceLastOpen}
        </p>
      ) : null}
      <p className="m-0">
        This is not a usage claim.{" "}
        <ContextLink href={DRIFT_HREF}>Compare captures</ContextLink>
      </p>
    </div>
  );
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

function SecureNowHomeCollectionSetupBlock(props: {
  readonly snapshotCaptureSucceeded: boolean | null;
  readonly subscriptionLabelPresent: boolean;
}): React.JSX.Element {
  const setupQuery = useSecureNowCollectionSetupInput({
    snapshotCaptureSucceeded: props.snapshotCaptureSucceeded,
  });

  if (setupQuery.isError) {
    return (
      <SecureNowWorkspaceApiUnreachableNotice
        message={SECURENOW_COLLECTION_SETUP_API_UNREACHABLE}
        testId="securenow-home-collection-setup-unreachable"
      />
    );
  }

  const collectionInput =
    setupQuery.collectionInput
    ?? resolveSecureNowHomeCollectionSetupFallbackInput({
      snapshotCaptureSucceeded: props.snapshotCaptureSucceeded,
      subscriptionLabelPresent: props.subscriptionLabelPresent,
    });

  return (
    <div className="space-y-2">
      <SecureNowCollectionPrimaryBlockerLine
        input={collectionInput}
        testIdPrefix="securenow-home"
        youAreHereMode
      />
      <SecureNowCollectionSetupChecklist
        input={collectionInput}
        testIdPrefix="securenow-home"
        suppressRecoveryLink
      />
    </div>
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
  const snapshotRowsForDelta = snapshotsQuery.data?.items ?? [];
  const eligibleCaptureSnapshots = snapshotRowsForDelta.filter((row) =>
    isInfraEvidenceSnapshotCaptureSucceeded(row.captureStatus),
  );
  const pathDeltaReportTargets = eligibleCaptureSnapshots.slice(0, 2);
  const pathDeltaReportQueries = useQueries({
    queries: pathDeltaReportTargets.map((snapshot) => ({
      queryKey: [
        "securenow",
        "home",
        "capture-path-delta",
        scope.workspaceId,
        scope.projectId,
        snapshot.snapshotId,
      ],
      queryFn: async () => {
        const report = await fetchSecurityEvidencePathAttackPathReport(snapshot.snapshotId);

        return collectSecurityEvidencePathIdsFromAttackPathReport(report);
      },
      enabled: snapshotsQuery.isSuccess && pathDeltaReportTargets.length >= 2,
      retry: false,
    })),
  });
  const pathDeltaReportQueryViews = pathDeltaReportQueries.map((query) => ({
    isPending: query.isPending,
    isError: query.isError,
    data: query.data,
  }));
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
        <ContextLink href={ADMINISTRATION_SYSTEM_HEALTH_PATH}>System health</ContextLink>
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

  if (snapshot === null) {
    const next = resolveSecureNowHomeEnvironmentNextStep({
      needsCollection: true,
      selectedPathId,
      firstRankedPathId,
    });

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
        <SecureNowHomeCollectionSetupBlock
          snapshotCaptureSucceeded={false}
          subscriptionLabelPresent={false}
        />
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-home-next-step">
          Next step:{" "}
          <ContextLink href={next.href}>{next.label.replace("Next: ", "")}</ContextLink>{" "}
          This is not a timed SLA.
        </p>
        <CaptureDeltaBlock
          stickinessScope={{ tenantId: scope.tenantId, workspaceId: scope.workspaceId }}
          eligibleSnapshots={eligibleCaptureSnapshots}
          reportQueries={pathDeltaReportQueryViews}
        />
      </div>
    );
  }

  const subscriptions = subscriptionPhrase(snapshotRows);
  const collectedAt = snapshot.capturedUtc === null ? null : formatRelativeTime(snapshot.capturedUtc);
  const gap = collectionGapDescription(snapshot);
  const snapshotCaptureSucceeded =
    snapshot !== null && gap === null && isInfraEvidenceSnapshotCaptureSucceeded(snapshot.captureStatus);
  const next = resolveSecureNowHomeEnvironmentNextStep({
    needsCollection: gap !== null,
    selectedPathId,
    firstRankedPathId,
  });
  const showCollectionSetup =
    gap !== null
    || snapshot === null
    || !isInfraEvidenceSnapshotCaptureSucceeded(snapshot.captureStatus);
  // Wait for ranked-path query before linking "One ranked path" so the CTA can include pathId.
  const rankedPathNextStepPending = gap === null && rankedPathsQuery.isPending;

  return (
    <div className="space-y-1" data-testid="securenow-home-environment-context">
      <p className={cn("m-0 flex flex-wrap items-baseline gap-x-3 gap-y-1", OPERATOR_TYPOGRAPHY.body)}>
        {workspaceLabel !== null ? <span>{workspaceLabel}</span> : null}
        {subscriptions !== null ? <ContextLink href={CLOUD_CONNECTIONS_HREF}>{subscriptions}</ContextLink> : null}
        {collectedAt !== null ? <ContextLink href={DRIFT_HREF}>{collectedAt}</ContextLink> : null}
        {gap !== null ? <ContextLink href={CLOUD_CONNECTIONS_HREF}>{gap}</ContextLink> : null}
      </p>
      {showCollectionSetup ? (
        <SecureNowHomeCollectionSetupBlock
          snapshotCaptureSucceeded={snapshotCaptureSucceeded}
          subscriptionLabelPresent={subscriptions !== null}
        />
      ) : null}
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-home-next-step">
        Next step:{" "}
        {rankedPathNextStepPending ? (
          <span>Loading next step…</span>
        ) : (
          <ContextLink href={next.href}>{next.label.replace("Next: ", "")}</ContextLink>
        )}{" "}
        This is not a timed SLA.
      </p>
      <CaptureDeltaBlock
        stickinessScope={{ tenantId: scope.tenantId, workspaceId: scope.workspaceId }}
        eligibleSnapshots={eligibleCaptureSnapshots}
        reportQueries={pathDeltaReportQueryViews}
      />
    </div>
  );
}
