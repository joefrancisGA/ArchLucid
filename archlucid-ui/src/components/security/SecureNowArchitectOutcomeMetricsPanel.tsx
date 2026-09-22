"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { useInfraEvidenceSnapshotsQuery } from "@/hooks/use-infra-evidence-snapshots-query";
import { useSecureNowArchitectOutcomeMetricsQuery } from "@/hooks/use-securenow-architect-metrics-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { operatorLastRefreshedClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import {
  SECURENOW_ARCHITECT_METRICS_BLAST_RADIUS_PATHS_REMOVED,
  SECURENOW_ARCHITECT_METRICS_COMPARE_BUTTON,
  SECURENOW_ARCHITECT_METRICS_CRITICAL_PATHS_REMOVED,
  SECURENOW_ARCHITECT_METRICS_CROWN_JEWEL_PATHS_REMOVED,
  SECURENOW_ARCHITECT_METRICS_EGRESS_PATHS_REDUCED,
  SECURENOW_ARCHITECT_METRICS_ERROR,
  SECURENOW_ARCHITECT_METRICS_EXCEPTIONS_EXPIRED,
  SECURENOW_ARCHITECT_METRICS_FROM_LABEL,
  SECURENOW_ARCHITECT_METRICS_LEAD,
  SECURENOW_ARCHITECT_METRICS_LOADING,
  SECURENOW_ARCHITECT_METRICS_PRIVILEGED_NODES_REDUCED,
  SECURENOW_ARCHITECT_METRICS_REMEDIATION_RECURRENCE,
  SECURENOW_ARCHITECT_METRICS_RULE_VERSION_PREFIX,
  SECURENOW_ARCHITECT_METRICS_SNAPSHOTS_EMPTY,
  SECURENOW_ARCHITECT_METRICS_SUPPORTING_OPEN_FINDINGS,
  SECURENOW_ARCHITECT_METRICS_TITLE,
  SECURENOW_ARCHITECT_METRICS_TO_LABEL,
} from "@/lib/product-line/securenow-architect-metrics-copy";
import { remediationFactoryArchitectMetricsErrorRecovery } from "@/lib/remediation-factory/remediation-factory-error-recovery";
import {
  parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch,
  remediationFactorySnapshotIdentityDisclosureHrefFromSearch,
} from "@/lib/remediation-factory/remediation-factory-snapshot-identity-disclosure-url";
import type { SecureNowArchitectOutcomeMetrics } from "@/lib/securenow-architect-metrics-types";
import { cn } from "@/lib/utils";

function formatSnapshotOptionLabel(snapshot: InfraEvidenceSnapshotSummary): string {
  const shortId = snapshot.snapshotId.slice(0, 8);
  const captured =
    snapshot.capturedUtc != null && snapshot.capturedUtc.trim().length > 0
      ? operatorLastRefreshedClockLabel(new Date(snapshot.capturedUtc))
      : "unknown time";

  return `${shortId}… · ${captured ?? "unknown time"} · ${snapshot.resourceCount} resources`;
}

function sortSnapshotsNewestFirst(
  snapshots: ReadonlyArray<InfraEvidenceSnapshotSummary>,
): InfraEvidenceSnapshotSummary[] {
  return [...snapshots].sort((left, right) => {
    const leftTime = left.capturedUtc ?? "";
    const rightTime = right.capturedUtc ?? "";

    return rightTime.localeCompare(leftTime);
  });
}

function OutcomeMetricsGrid(props: { readonly metrics: SecureNowArchitectOutcomeMetrics }) {
  const metrics = props.metrics;

  return (
    <section
      aria-label={SECURENOW_ARCHITECT_METRICS_TITLE}
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      data-testid="securenow-architect-outcome-metrics-grid"
    >
      <MetricCard label={SECURENOW_ARCHITECT_METRICS_CRITICAL_PATHS_REMOVED} value={String(metrics.criticalOrHighConfidencePathsRemoved)} />
      <MetricCard label={SECURENOW_ARCHITECT_METRICS_PRIVILEGED_NODES_REDUCED} value={String(metrics.privilegedIdentityNodesOnPathsReduced)} />
      <MetricCard label={SECURENOW_ARCHITECT_METRICS_EGRESS_PATHS_REDUCED} value={String(metrics.unrestrictedEgressCapabilityPathsReduced)} />
      <MetricCard label={SECURENOW_ARCHITECT_METRICS_CROWN_JEWEL_PATHS_REMOVED} value={String(metrics.assertedCrownJewelExposurePathsRemoved)} />
      <MetricCard label={SECURENOW_ARCHITECT_METRICS_BLAST_RADIUS_PATHS_REMOVED} value={String(metrics.sharedControlBlastRadiusPathsRemoved)} />
      <MetricCard label={SECURENOW_ARCHITECT_METRICS_EXCEPTIONS_EXPIRED} value={String(metrics.exceptionsExpired)} />
      <MetricCard label={SECURENOW_ARCHITECT_METRICS_REMEDIATION_RECURRENCE} value={String(metrics.remediationRecurrenceCount)} />
      {metrics.supportingOperationalMetrics != null ? (
        <MetricCard
          label={SECURENOW_ARCHITECT_METRICS_SUPPORTING_OPEN_FINDINGS}
          value={String(metrics.supportingOperationalMetrics.openFindings)}
        />
      ) : null}
    </section>
  );
}

function MetricCard(props: { readonly label: string; readonly value: string }) {
  return (
    <div className="rounded border border-border bg-card p-4" data-testid={`securenow-architect-metric-${props.label}`}>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{props.label}</p>
      <p className={OPERATOR_TYPOGRAPHY.kpiValue}>{props.value}</p>
    </div>
  );
}

function SnapshotIdentityDisclosure(props: {
  readonly fromSnapshot: InfraEvidenceSnapshotSummary | undefined;
  readonly toSnapshot: InfraEvidenceSnapshotSummary | undefined;
}) {
  const pathname = usePathname() ?? "/governance/remediation-factory";
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const open = parseRemediationFactorySnapshotIdentityDisclosureOpenFromSearch(
    searchParams.get("remediationFactorySnapshotIdentityOpen"),
  );

  async function copyId(id: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText != null) {
      await navigator.clipboard.writeText(id);
    }
  }

  return (
    <div className="space-y-2" data-testid="securenow-architect-metrics-snapshot-identity">
      <Link
        href={remediationFactorySnapshotIdentityDisclosureHrefFromSearch(search, !open, pathname)}
        className="text-al-link text-sm underline-offset-2 hover:underline"
        scroll={false}
      >
        {open ? "Hide snapshot identifiers" : "Show snapshot identifiers"}
      </Link>
      {open ? (
        <dl className={cn("m-0 space-y-2 rounded border border-border p-3", OPERATOR_TYPOGRAPHY.helper)}>
          {props.fromSnapshot != null ? (
            <div>
              <dt className="font-medium text-foreground">From snapshot</dt>
              <dd className="m-0 font-mono text-xs">{props.fromSnapshot.snapshotId}</dd>
              <dd className="m-0">
                Captured {operatorLastRefreshedClockLabel(new Date(props.fromSnapshot.capturedUtc ?? ""))} ·{" "}
                {props.fromSnapshot.resourceCount} resources
              </dd>
              <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => copyId(props.fromSnapshot!.snapshotId)}>
                Copy from ID
              </Button>
            </div>
          ) : null}
          {props.toSnapshot != null ? (
            <div>
              <dt className="font-medium text-foreground">To snapshot</dt>
              <dd className="m-0 font-mono text-xs">{props.toSnapshot.snapshotId}</dd>
              <dd className="m-0">
                Captured {operatorLastRefreshedClockLabel(new Date(props.toSnapshot.capturedUtc ?? ""))} ·{" "}
                {props.toSnapshot.resourceCount} resources
              </dd>
              <Button type="button" variant="outline" size="sm" className="mt-1" onClick={() => copyId(props.toSnapshot!.snapshotId)}>
                Copy to ID
              </Button>
            </div>
          ) : null}
        </dl>
      ) : null}
    </div>
  );
}

export type SecureNowArchitectOutcomeMetricsPanelProps = {
  readonly fromSnapshotId?: string | null;
  readonly toSnapshotId?: string | null;
  readonly onSnapshotPairChange?: (pair: { readonly fromSnapshotId: string; readonly toSnapshotId: string }) => void;
};

export function SecureNowArchitectOutcomeMetricsPanel(props: SecureNowArchitectOutcomeMetricsPanelProps = {}) {
  const snapshotsQuery = useInfraEvidenceSnapshotsQuery();
  const sortedSnapshots = useMemo(
    () => sortSnapshotsNewestFirst(snapshotsQuery.data?.items ?? []),
    [snapshotsQuery.data?.items],
  );
  const [internalFromSnapshotId, setInternalFromSnapshotId] = useState<string>("");
  const [internalToSnapshotId, setInternalToSnapshotId] = useState<string>("");
  const [compareRequested, setCompareRequested] = useState(false);
  const awaitingManualCompareRef = useRef(false);

  const controlled = props.onSnapshotPairChange !== undefined;
  const fromSnapshotId = controlled ? (props.fromSnapshotId ?? "") : internalFromSnapshotId;
  const toSnapshotId = controlled ? (props.toSnapshotId ?? "") : internalToSnapshotId;

  useEffect(() => {
    if (sortedSnapshots.length < 2 || controlled) {
      return;
    }

    setInternalFromSnapshotId((current) => (current.length > 0 ? current : sortedSnapshots[1]?.snapshotId ?? ""));
    setInternalToSnapshotId((current) => (current.length > 0 ? current : sortedSnapshots[0]?.snapshotId ?? ""));
    setCompareRequested(true);
  }, [controlled, sortedSnapshots]);

  useEffect(() => {
    if (!controlled || sortedSnapshots.length < 2) {
      return;
    }

    const from = (props.fromSnapshotId ?? "").trim();
    const to = (props.toSnapshotId ?? "").trim();

    if (from.length === 0 && to.length === 0) {
      awaitingManualCompareRef.current = false;
      props.onSnapshotPairChange?.({
        fromSnapshotId: sortedSnapshots[1]?.snapshotId ?? "",
        toSnapshotId: sortedSnapshots[0]?.snapshotId ?? "",
      });
      setCompareRequested(true);
      return;
    }

    const pairIsValid =
      from.length > 0
      && to.length > 0
      && from !== to
      && sortedSnapshots.some((snapshot) => snapshot.snapshotId === from)
      && sortedSnapshots.some((snapshot) => snapshot.snapshotId === to);

    if (pairIsValid && !awaitingManualCompareRef.current) {
      setCompareRequested(true);
    }
  }, [controlled, props.fromSnapshotId, props.toSnapshotId, props.onSnapshotPairChange, sortedSnapshots]);

  const metricsQuery = useSecureNowArchitectOutcomeMetricsQuery(
    fromSnapshotId.length > 0 ? fromSnapshotId : null,
    toSnapshotId.length > 0 ? toSnapshotId : null,
    compareRequested,
  );

  const fromSnapshot = sortedSnapshots.find((snapshot) => snapshot.snapshotId === fromSnapshotId);
  const toSnapshot = sortedSnapshots.find((snapshot) => snapshot.snapshotId === toSnapshotId);

  function updateFrom(id: string) {
    awaitingManualCompareRef.current = true;
    if (controlled) {
      props.onSnapshotPairChange?.({ fromSnapshotId: id, toSnapshotId });
    } else {
      setInternalFromSnapshotId(id);
    }

    setCompareRequested(false);
  }

  function updateTo(id: string) {
    awaitingManualCompareRef.current = true;
    if (controlled) {
      props.onSnapshotPairChange?.({ fromSnapshotId, toSnapshotId: id });
    } else {
      setInternalToSnapshotId(id);
    }

    setCompareRequested(false);
  }

  function requestCompare() {
    awaitingManualCompareRef.current = false;
    setCompareRequested(true);
  }

  return (
    <section className="space-y-3" aria-label={SECURENOW_ARCHITECT_METRICS_TITLE} data-testid="securenow-architect-outcome-metrics-panel">
      <header className="space-y-1">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{SECURENOW_ARCHITECT_METRICS_TITLE}</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_ARCHITECT_METRICS_LEAD}</p>
      </header>

      {snapshotsQuery.isError ? (
        <StatusTag kind="needs-attention" label={SECURENOW_ARCHITECT_METRICS_ERROR} />
      ) : sortedSnapshots.length < 2 ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_ARCHITECT_METRICS_SNAPSHOTS_EMPTY}</p>
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_ARCHITECT_METRICS_FROM_LABEL}</span>
              <select
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                value={fromSnapshotId}
                onChange={(event) => updateFrom(event.target.value)}
                data-testid="securenow-architect-metrics-from-snapshot"
              >
                {sortedSnapshots.map((snapshot) => (
                  <option key={`from-${snapshot.snapshotId}`} value={snapshot.snapshotId}>
                    {formatSnapshotOptionLabel(snapshot)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_ARCHITECT_METRICS_TO_LABEL}</span>
              <select
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                value={toSnapshotId}
                onChange={(event) => updateTo(event.target.value)}
                data-testid="securenow-architect-metrics-to-snapshot"
              >
                {sortedSnapshots.map((snapshot) => (
                  <option key={`to-${snapshot.snapshotId}`} value={snapshot.snapshotId}>
                    {formatSnapshotOptionLabel(snapshot)}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={fromSnapshotId.length === 0 || toSnapshotId.length === 0 || fromSnapshotId === toSnapshotId}
              onClick={requestCompare}
              data-testid="securenow-architect-metrics-compare-button"
            >
              {SECURENOW_ARCHITECT_METRICS_COMPARE_BUTTON}
            </Button>
          </div>

          <SnapshotIdentityDisclosure fromSnapshot={fromSnapshot} toSnapshot={toSnapshot} />

          {!compareRequested ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>Select snapshot pair and compare.</p>
          ) : metricsQuery.isLoading ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_ARCHITECT_METRICS_LOADING}</p>
          ) : metricsQuery.isError || metricsQuery.data == null ? (
            <div className="space-y-2">
              <StatusTag kind="needs-attention" label={SECURENOW_ARCHITECT_METRICS_ERROR} />
              <OperatorErrorRecoveryContract
                presentation={remediationFactoryArchitectMetricsErrorRecovery()}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => void metricsQuery.refetch()}>
                Retry architect metrics
              </Button>
            </div>
          ) : (
            <>
              <p className={OPERATOR_TYPOGRAPHY.helper}>
                {SECURENOW_ARCHITECT_METRICS_RULE_VERSION_PREFIX}: {metricsQuery.data.ruleVersion}
              </p>
              <OutcomeMetricsGrid metrics={metricsQuery.data} />
            </>
          )}
        </>
      )}
    </section>
  );
}
