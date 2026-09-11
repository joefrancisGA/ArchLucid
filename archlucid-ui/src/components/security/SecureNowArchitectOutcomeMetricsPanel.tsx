"use client";

import { useEffect, useMemo, useState } from "react";

import { StatusTag } from "@/components/ui/status-tag";
import { useInfraEvidenceSnapshotsQuery } from "@/hooks/use-infra-evidence-snapshots-query";
import { useSecureNowArchitectOutcomeMetricsQuery } from "@/hooks/use-securenow-architect-metrics-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
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
import type { SecureNowArchitectOutcomeMetrics } from "@/lib/securenow-architect-metrics-types";

function formatSnapshotOptionLabel(snapshot: InfraEvidenceSnapshotSummary): string {
  const shortId = snapshot.snapshotId.slice(0, 8);
  const captured = snapshot.capturedUtc != null && snapshot.capturedUtc.trim().length > 0
    ? snapshot.capturedUtc.replace("T", " ").slice(0, 16)
    : "unknown time";

  return `${shortId}… · ${captured} · ${snapshot.resourceCount} resources`;
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
      <p className={OPERATOR_TYPOGRAPHY.dataValue}>{props.value}</p>
    </div>
  );
}

export function SecureNowArchitectOutcomeMetricsPanel() {
  const snapshotsQuery = useInfraEvidenceSnapshotsQuery();
  const sortedSnapshots = useMemo(
    () => sortSnapshotsNewestFirst(snapshotsQuery.data?.items ?? []),
    [snapshotsQuery.data?.items],
  );
  const [fromSnapshotId, setFromSnapshotId] = useState<string>("");
  const [toSnapshotId, setToSnapshotId] = useState<string>("");
  const [compareRequested, setCompareRequested] = useState(false);

  useEffect(() => {
    if (sortedSnapshots.length < 2) {
      return;
    }

    setFromSnapshotId((current) => (current.length > 0 ? current : sortedSnapshots[1]?.snapshotId ?? ""));
    setToSnapshotId((current) => (current.length > 0 ? current : sortedSnapshots[0]?.snapshotId ?? ""));
    setCompareRequested(true);
  }, [sortedSnapshots]);

  const metricsQuery = useSecureNowArchitectOutcomeMetricsQuery(
    fromSnapshotId.length > 0 ? fromSnapshotId : null,
    toSnapshotId.length > 0 ? toSnapshotId : null,
    compareRequested,
  );

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
                onChange={(event) => {
                  setFromSnapshotId(event.target.value);
                  setCompareRequested(false);
                }}
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
                onChange={(event) => {
                  setToSnapshotId(event.target.value);
                  setCompareRequested(false);
                }}
                data-testid="securenow-architect-metrics-to-snapshot"
              >
                {sortedSnapshots.map((snapshot) => (
                  <option key={`to-${snapshot.snapshotId}`} value={snapshot.snapshotId}>
                    {formatSnapshotOptionLabel(snapshot)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
              disabled={fromSnapshotId.length === 0 || toSnapshotId.length === 0 || fromSnapshotId === toSnapshotId}
              onClick={() => setCompareRequested(true)}
              data-testid="securenow-architect-metrics-compare-button"
            >
              {SECURENOW_ARCHITECT_METRICS_COMPARE_BUTTON}
            </button>
          </div>

          {!compareRequested ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>Select snapshot pair and compare.</p>
          ) : metricsQuery.isLoading ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_ARCHITECT_METRICS_LOADING}</p>
          ) : metricsQuery.isError || metricsQuery.data == null ? (
            <StatusTag kind="needs-attention" label={SECURENOW_ARCHITECT_METRICS_ERROR} />
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
