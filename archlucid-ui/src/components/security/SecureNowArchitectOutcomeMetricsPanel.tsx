"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import type { EnterpriseCompactEmptyStateProps } from "@/components/EnterpriseCompactEmptyState";
import { CopyIdButton } from "@/components/CopyIdButton";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { useInfraEvidenceSnapshotsQuery } from "@/hooks/use-infra-evidence-snapshots-query";
import { useSecureNowArchitectOutcomeMetricsQuery } from "@/hooks/use-securenow-architect-metrics-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { parseIsoUtcMs } from "@/lib/format-iso-utc";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { formatInfraEvidenceSnapshotLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
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
  formatSecureNowArchitectMetricsRuleVersionExplanation,
  SECURENOW_ARCHITECT_METRICS_SUPPORTING_OPEN_FINDINGS,
  SECURENOW_ARCHITECT_METRICS_TITLE,
  SECURENOW_ARCHITECT_METRICS_TO_LABEL,
} from "@/lib/product-line/securenow-architect-metrics-copy";
import { remediationFactoryArchitectMetricsErrorRecovery } from "@/lib/remediation-factory/remediation-factory-error-recovery";
import type { SecureNowArchitectOutcomeMetrics } from "@/lib/securenow-architect-metrics-types";
import { cn } from "@/lib/utils";

import {
  architectOutcomeMetricPresentation,
  type RemediationFactoryMetricPresentation,
} from "@/app/(operator)/governance/remediation-factory/remediation-factory-metric-presentation";

export type SecureNowArchitectOutcomeQueryState = {
  readonly snapshotsUpdatedAt: number;
  readonly snapshotsFetching: boolean;
  readonly outcomeUpdatedAt: number;
  readonly outcomeFetching: boolean;
  readonly refetchAll: () => void;
};

function sortSnapshotsNewestFirst(
  snapshots: ReadonlyArray<InfraEvidenceSnapshotSummary>,
): InfraEvidenceSnapshotSummary[] {
  return [...snapshots].sort((left, right) => {
    const leftTime = left.capturedUtc ?? "";
    const rightTime = right.capturedUtc ?? "";

    return rightTime.localeCompare(leftTime);
  });
}

function resolveDefaultSnapshotPair(
  snapshots: ReadonlyArray<InfraEvidenceSnapshotSummary>,
): { readonly fromSnapshotId: string; readonly toSnapshotId: string } | null {
  if (snapshots.length < 2) {
    return null;
  }

  const sorted = sortSnapshotsNewestFirst(snapshots);

  return {
    fromSnapshotId: sorted[1]?.snapshotId ?? "",
    toSnapshotId: sorted[0]?.snapshotId ?? "",
  };
}

function isSnapshotPairInverted(
  fromSnapshot: InfraEvidenceSnapshotSummary | undefined,
  toSnapshot: InfraEvidenceSnapshotSummary | undefined,
): boolean {
  if (fromSnapshot === undefined || toSnapshot === undefined) {
    return false;
  }

  const fromMs = parseIsoUtcMs(fromSnapshot.capturedUtc ?? "");
  const toMs = parseIsoUtcMs(toSnapshot.capturedUtc ?? "");

  if (Number.isNaN(fromMs) || Number.isNaN(toMs)) {
    return false;
  }

  return fromMs > toMs;
}

function OutcomeMetricTile(props: {
  readonly label: string;
  readonly presentation: RemediationFactoryMetricPresentation;
}) {
  return (
    <div
      className="rounded border border-border bg-card p-4"
      data-testid={`securenow-architect-metric-${props.label}`}
    >
      <p className={OPERATOR_TYPOGRAPHY.helper}>{props.label}</p>
      <p className={cn(OPERATOR_TYPOGRAPHY.dataValue, props.presentation.state === "measuredZero" && "text-al-text-secondary")}>
        {props.presentation.displayValue}
      </p>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{props.presentation.scopeNote}</p>
      {props.presentation.state === "notMeasured" ? <StatusTag kind="draft" label="Not measured" /> : null}
    </div>
  );
}

function OutcomeMetricsGrid(props: {
  readonly metrics: SecureNowArchitectOutcomeMetrics;
  readonly comparisonDenominator: number | null;
}) {
  const metrics = props.metrics;
  const denominator = props.comparisonDenominator;

  const tiles: Array<{
    readonly label: string;
    readonly presentation: RemediationFactoryMetricPresentation;
  }> = [
    {
      label: SECURENOW_ARCHITECT_METRICS_CRITICAL_PATHS_REMOVED,
      presentation: architectOutcomeMetricPresentation({
        value: metrics.criticalOrHighConfidencePathsRemoved,
        denominator,
        populationLabel: "Compared snapshots",
      }),
    },
    {
      label: SECURENOW_ARCHITECT_METRICS_PRIVILEGED_NODES_REDUCED,
      presentation: architectOutcomeMetricPresentation({
        value: metrics.privilegedIdentityNodesOnPathsReduced,
        denominator,
        populationLabel: "Compared snapshots",
      }),
    },
    {
      label: SECURENOW_ARCHITECT_METRICS_EGRESS_PATHS_REDUCED,
      presentation: architectOutcomeMetricPresentation({
        value: metrics.unrestrictedEgressCapabilityPathsReduced,
        denominator,
        populationLabel: "Compared snapshots",
      }),
    },
    {
      label: SECURENOW_ARCHITECT_METRICS_CROWN_JEWEL_PATHS_REMOVED,
      presentation: architectOutcomeMetricPresentation({
        value: metrics.assertedCrownJewelExposurePathsRemoved,
        denominator,
        populationLabel: "Compared snapshots",
      }),
    },
    {
      label: SECURENOW_ARCHITECT_METRICS_BLAST_RADIUS_PATHS_REMOVED,
      presentation: architectOutcomeMetricPresentation({
        value: metrics.sharedControlBlastRadiusPathsRemoved,
        denominator,
        populationLabel: "Compared snapshots",
      }),
    },
    {
      label: SECURENOW_ARCHITECT_METRICS_EXCEPTIONS_EXPIRED,
      presentation: architectOutcomeMetricPresentation({
        value: metrics.exceptionsExpired,
        denominator,
        populationLabel: "Compared snapshots",
      }),
    },
    {
      label: SECURENOW_ARCHITECT_METRICS_REMEDIATION_RECURRENCE,
      presentation: architectOutcomeMetricPresentation({
        value: metrics.remediationRecurrenceCount,
        denominator,
        populationLabel: "Compared snapshots",
      }),
    },
  ];

  if (metrics.supportingOperationalMetrics != null) {
    tiles.push({
      label: SECURENOW_ARCHITECT_METRICS_SUPPORTING_OPEN_FINDINGS,
      presentation: architectOutcomeMetricPresentation({
        value: metrics.supportingOperationalMetrics.openFindings,
        denominator,
        populationLabel: "Supporting open findings",
      }),
    });
  }

  return (
    <section
      aria-label={SECURENOW_ARCHITECT_METRICS_TITLE}
      className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      data-testid="securenow-architect-outcome-metrics-grid"
    >
      {tiles.map((tile) => (
        <OutcomeMetricTile key={tile.label} label={tile.label} presentation={tile.presentation} />
      ))}
    </section>
  );
}

export type SecureNowArchitectOutcomeMetricsPanelProps = {
  readonly fromSnapshotId?: string | null;
  readonly toSnapshotId?: string | null;
  readonly hasUrlSnapshotPair?: boolean;
  readonly onSnapshotPairChange?: (pair: { readonly fromSnapshotId: string; readonly toSnapshotId: string }) => void;
  readonly onQueryStateChange?: (state: SecureNowArchitectOutcomeQueryState) => void;
  readonly snapshotsEmptyPreset?: EnterpriseCompactEmptyStateProps;
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
  const defaultControlledPairAppliedRef = useRef(false);
  const onSnapshotPairChangeRef = useRef(props.onSnapshotPairChange);
  const onQueryStateChangeRef = useRef(props.onQueryStateChange);

  onSnapshotPairChangeRef.current = props.onSnapshotPairChange;
  onQueryStateChangeRef.current = props.onQueryStateChange;

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
    if (sortedSnapshots.length < 2) {
      defaultControlledPairAppliedRef.current = false;
    }
  }, [sortedSnapshots.length]);

  useEffect(() => {
    if (!controlled || sortedSnapshots.length < 2) {
      return;
    }

    const from = (props.fromSnapshotId ?? "").trim();
    const to = (props.toSnapshotId ?? "").trim();

    if (from.length === 0 && to.length === 0) {
      if (defaultControlledPairAppliedRef.current) {
        return;
      }

      const defaultPair = resolveDefaultSnapshotPair(sortedSnapshots);

      if (defaultPair == null) {
        return;
      }

      defaultControlledPairAppliedRef.current = true;
      awaitingManualCompareRef.current = false;
      onSnapshotPairChangeRef.current?.(defaultPair);
      setCompareRequested(true);

      return;
    }

    defaultControlledPairAppliedRef.current = true;

    const pairIsValid =
      from.length > 0
      && to.length > 0
      && from !== to
      && sortedSnapshots.some((snapshot) => snapshot.snapshotId === from)
      && sortedSnapshots.some((snapshot) => snapshot.snapshotId === to);

    if (pairIsValid && !awaitingManualCompareRef.current) {
      setCompareRequested(true);
    }
  }, [controlled, props.fromSnapshotId, props.toSnapshotId, sortedSnapshots]);

  useEffect(() => {
    if (props.hasUrlSnapshotPair === true) {
      setCompareRequested(true);
    }
  }, [props.hasUrlSnapshotPair]);

  const fromSnapshot = sortedSnapshots.find((snapshot) => snapshot.snapshotId === fromSnapshotId);
  const toSnapshot = sortedSnapshots.find((snapshot) => snapshot.snapshotId === toSnapshotId);
  const pairInverted = isSnapshotPairInverted(fromSnapshot, toSnapshot);
  const comparisonDenominator =
    fromSnapshot != null && toSnapshot != null
      ? Math.max(fromSnapshot.resourceCount, toSnapshot.resourceCount)
      : null;

  const metricsQuery = useSecureNowArchitectOutcomeMetricsQuery(
    fromSnapshotId.length > 0 ? fromSnapshotId : null,
    toSnapshotId.length > 0 ? toSnapshotId : null,
    compareRequested && !pairInverted,
  );

  const refetchSnapshots = snapshotsQuery.refetch;
  const refetchOutcomeMetrics = metricsQuery.refetch;

  const refetchAll = useCallback(() => {
    void refetchSnapshots();
    void refetchOutcomeMetrics();
  }, [refetchOutcomeMetrics, refetchSnapshots]);

  const refetchAllRef = useRef(refetchAll);

  refetchAllRef.current = refetchAll;

  useEffect(() => {
    onQueryStateChangeRef.current?.({
      snapshotsUpdatedAt: snapshotsQuery.dataUpdatedAt,
      snapshotsFetching: snapshotsQuery.isFetching,
      outcomeUpdatedAt: metricsQuery.dataUpdatedAt,
      outcomeFetching: metricsQuery.isFetching,
      refetchAll: () => {
        refetchAllRef.current();
      },
    });
  }, [
    metricsQuery.dataUpdatedAt,
    metricsQuery.isFetching,
    snapshotsQuery.dataUpdatedAt,
    snapshotsQuery.isFetching,
  ]);

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
        props.snapshotsEmptyPreset != null ? (
          <EnterpriseCompactEmptyState {...props.snapshotsEmptyPreset} />
        ) : (
          <p className={OPERATOR_TYPOGRAPHY.helper}>At least two inventory snapshots are required.</p>
        )
      ) : (
        <>
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
            <label className="space-y-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_ARCHITECT_METRICS_FROM_LABEL} (earlier)</span>
              <select
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                value={fromSnapshotId}
                onChange={(event) => updateFrom(event.target.value)}
                data-testid="securenow-architect-metrics-from-snapshot"
              >
                {sortedSnapshots.map((snapshot) => (
                  <option key={`from-${snapshot.snapshotId}`} value={snapshot.snapshotId}>
                    {formatInfraEvidenceSnapshotLabel(snapshot)}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_ARCHITECT_METRICS_TO_LABEL} (later)</span>
              <select
                className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
                value={toSnapshotId}
                onChange={(event) => updateTo(event.target.value)}
                data-testid="securenow-architect-metrics-to-snapshot"
              >
                {sortedSnapshots.map((snapshot) => (
                  <option key={`to-${snapshot.snapshotId}`} value={snapshot.snapshotId}>
                    {formatInfraEvidenceSnapshotLabel(snapshot)}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={
                fromSnapshotId.length === 0
                || toSnapshotId.length === 0
                || fromSnapshotId === toSnapshotId
                || pairInverted
              }
              onClick={requestCompare}
              data-testid="securenow-architect-metrics-compare-button"
            >
              {SECURENOW_ARCHITECT_METRICS_COMPARE_BUTTON}
            </Button>
          </div>

          {fromSnapshot != null && toSnapshot != null ? (
            <div
              className="space-y-1 rounded border border-border bg-muted/20 p-3"
              data-testid="securenow-architect-metrics-provenance"
            >
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                From snapshot: {formatInfraEvidenceSnapshotLabel(fromSnapshot)}
                <CopyIdButton value={fromSnapshot.snapshotId} aria-label="Copy from snapshot ID" />
              </p>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                To snapshot: {formatInfraEvidenceSnapshotLabel(toSnapshot)}
                <CopyIdButton value={toSnapshot.snapshotId} aria-label="Copy to snapshot ID" />
              </p>
            </div>
          ) : null}

          {pairInverted ? (
            <StatusTag
              kind="needs-attention"
              label="Snapshot pair is inverted — choose an earlier From snapshot and a later To snapshot."
            />
          ) : null}

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
                {formatSecureNowArchitectMetricsRuleVersionExplanation(metricsQuery.data.ruleVersion)}
              </p>
              <OutcomeMetricsGrid metrics={metricsQuery.data} comparisonDenominator={comparisonDenominator} />
            </>
          )}
        </>
      )}
    </section>
  );
}
