"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";
import { SecureNowWorkspaceApiUnreachableNotice } from "@/components/product-line/SecureNowWorkspaceApiUnreachableNotice";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { isInfraEvidenceSnapshotCaptureSucceeded } from "@/lib/infra-evidence/infra-evidence-snapshot-capture-status";
import { fetchRemediationInstances } from "@/lib/infra-evidence/infra-evidence-remediation-api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  collectSecurityEvidencePathIdsFromAttackPathReport,
  computeSecureNowCapturePathDelta,
} from "@/lib/product-line/securenow-capture-path-delta";
import {
  SECURENOW_RETURN_HOME_SECTION_HEADING,
  SECURENOW_RETURN_HOME_SECTION_LEAD,
} from "@/lib/product-line/securenow-return-home-copy";
import { fetchSecurityEvidencePathAttackPathReport } from "@/lib/security-evidence-path-api";
import {
  SECURENOW_RETURN_HOME_EMPTY,
  SECURENOW_RETURN_HOME_API_UNREACHABLE,
  buildSecureNowReturnHomeRows,
  countRemediationInstancesAwaitingVerification,
  countSecureNowExtendDispositionsInBrowserCache,
  readSecureNowLastOpenedSnapshotId,
  readSecureNowPinnedPathId,
  resolveSecureNowPinnedPathStatus,
} from "@/lib/product-line/securenow-stickiness";
import { cn } from "@/lib/utils";

const SNAPSHOT_PAGE_SIZE = 20;

/** SecureNow Home — unfinished work that can require a later return. */
export function SecureNowReturnHomeSection(): React.JSX.Element {
  const scope = useOperatorScopeQueryKey();
  const [browserMemoryReady, setBrowserMemoryReady] = useState(false);
  const snapshotsQuery = useQuery({
    queryKey: operatorQueryKeys.infraEvidenceSnapshotsList(1, SNAPSHOT_PAGE_SIZE),
    queryFn: () => fetchInfraEvidenceSnapshots(1, SNAPSHOT_PAGE_SIZE),
    retry: false,
  });
  const instancesQuery = useQuery({
    queryKey: ["securenow", "home", "remediation-instances", scope.workspaceId, scope.projectId],
    queryFn: () => fetchRemediationInstances(),
    retry: false,
  });
  const eligibleSnapshots = (snapshotsQuery.data?.items ?? []).filter((row) =>
    isInfraEvidenceSnapshotCaptureSucceeded(row.captureStatus),
  );
  const deltaTargets = eligibleSnapshots.slice(0, 2);
  const latestReportQuery = useQuery({
    queryKey: ["securenow", "home", "capture-path-delta", scope.workspaceId, scope.projectId, deltaTargets[0]?.snapshotId ?? "none"],
    queryFn: async () => collectSecurityEvidencePathIdsFromAttackPathReport(
      await fetchSecurityEvidencePathAttackPathReport(deltaTargets[0]?.snapshotId ?? ""),
    ),
    enabled: deltaTargets.length >= 2 && deltaTargets[0] !== undefined,
    retry: false,
  });
  const previousReportQuery = useQuery({
    queryKey: ["securenow", "home", "capture-path-delta", scope.workspaceId, scope.projectId, deltaTargets[1]?.snapshotId ?? "none"],
    queryFn: async () => collectSecurityEvidencePathIdsFromAttackPathReport(
      await fetchSecurityEvidencePathAttackPathReport(deltaTargets[1]?.snapshotId ?? ""),
    ),
    enabled: deltaTargets.length >= 2 && deltaTargets[1] !== undefined,
    retry: false,
  });

  useEffect(() => {
    setBrowserMemoryReady(true);
  }, []);

  const reportsPending =
    deltaTargets.length >= 2 && (latestReportQuery.isPending || previousReportQuery.isPending);
  const pending = snapshotsQuery.isPending || instancesQuery.isPending || reportsPending;

  if (pending) {
    return (
      <section aria-labelledby="securenow-return-home-heading" data-testid="securenow-return-home-section">
        <h2 id="securenow-return-home-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {SECURENOW_RETURN_HOME_SECTION_HEADING}
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)} data-testid="securenow-return-home-status">
          Checking unfinished work…
        </p>
      </section>
    );
  }

  if (snapshotsQuery.isError) {
    return (
      <section aria-labelledby="securenow-return-home-heading" data-testid="securenow-return-home-section">
        <h2 id="securenow-return-home-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {SECURENOW_RETURN_HOME_SECTION_HEADING}
        </h2>
        <div className="mt-2">
          <SecureNowWorkspaceApiUnreachableNotice
            message={SECURENOW_RETURN_HOME_API_UNREACHABLE}
            testId="securenow-return-home-unreachable"
          />
        </div>
      </section>
    );
  }

  const delta = computeSecureNowCapturePathDelta(previousReportQuery.data ?? [], latestReportQuery.data ?? []);
  const stickinessScope = { tenantId: scope.tenantId, workspaceId: scope.workspaceId };
  const pinnedPathId = browserMemoryReady ? readSecureNowPinnedPathId(stickinessScope) : null;
  const rows = buildSecureNowReturnHomeRows({
    awaitingVerificationCount: instancesQuery.isError
      ? 0
      : countRemediationInstancesAwaitingVerification(instancesQuery.data ?? []),
    addedCount: deltaTargets.length >= 2 && !latestReportQuery.isError && !previousReportQuery.isError ? delta.added.length : 0,
    goneCount: deltaTargets.length >= 2 && !latestReportQuery.isError && !previousReportQuery.isError ? delta.gone.length : 0,
    latestSnapshotId: eligibleSnapshots[0]?.snapshotId ?? null,
    lastOpenedSnapshotId: browserMemoryReady ? readSecureNowLastOpenedSnapshotId(stickinessScope) : null,
    pinnedPathId,
    pinnedPathStatus:
      pinnedPathId === null || deltaTargets.length < 2
        ? null
        : resolveSecureNowPinnedPathStatus(pinnedPathId, latestReportQuery.data ?? [], previousReportQuery.data ?? []),
    extendDispositionCount: browserMemoryReady ? countSecureNowExtendDispositionsInBrowserCache() : 0,
  });

  if (rows.length === 0) {
    return (
      <section aria-labelledby="securenow-return-home-heading" data-testid="securenow-return-home-section">
        <h2 id="securenow-return-home-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
          {SECURENOW_RETURN_HOME_SECTION_HEADING}
        </h2>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.helper)}>{SECURENOW_RETURN_HOME_SECTION_LEAD}</p>
        <p className={cn("m-0 mt-2", OPERATOR_TYPOGRAPHY.body)} data-testid="securenow-return-home-empty">
          {SECURENOW_RETURN_HOME_EMPTY}
        </p>
      </section>
    );
  }

  return (
    <SecureNowHomeDestinationSection
      heading={SECURENOW_RETURN_HOME_SECTION_HEADING}
      lead={SECURENOW_RETURN_HOME_SECTION_LEAD}
      rows={rows}
      sectionTestId="securenow-return-home-section"
      headingId="securenow-return-home-heading"
      tableAriaLabel="SecureNow return reasons"
      linkTestIdPrefix="securenow-return-home-link"
    />
  );
}
