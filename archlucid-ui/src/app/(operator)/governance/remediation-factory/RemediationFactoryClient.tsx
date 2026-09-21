"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import { SecureNowArchitectOutcomeMetricsPanel } from "@/components/security/SecureNowArchitectOutcomeMetricsPanel";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { RefreshButton } from "@/components/ui/refresh-button";
import { PageContextualHelpButton, PAGE_HELP_SHORT_TRIGGER_TEXT } from "@/components/usability/PageContextualHelpButton";
import { OperatorAdvisorySimulatorProvenanceBlock } from "@/components/usability/OperatorAdvisorySimulatorProvenanceBlock";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { fetchRemediationScoreExplanation } from "@/lib/remediation-factory-api";
import type { RemediationPrioritizedFinding } from "@/lib/remediation-factory-types";
import {
  useRemediationFactoryMetricsQuery,
  useRemediationRankedFindingsQuery,
} from "@/hooks/use-remediation-factory-query";
import { useSecurityEvidenceRankedPathsQuery } from "@/hooks/use-security-evidence-ranked-paths-query";
import { useOperatorRelativeFreshnessNowMs } from "@/hooks/use-operator-relative-freshness-now-ms";
import { useRemediationFactoryShortcuts } from "@/hooks/useRemediationFactoryShortcuts";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { remediationFactoryPathForProductLine } from "@/lib/product-line/securenow-remediation-factory-route";
import {
  REMEDIATION_FACTORY_INSPECT_PREREQUISITE_EMPTY,
  REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY,
  REMEDIATION_FACTORY_RANKED_PATHS_EMPTY,
  REMEDIATION_FACTORY_SIMULATOR_PREREQUISITE_EMPTY,
} from "@/lib/remediation-factory/remediation-factory-empty-presets";
import {
  remediationFactoryArchitectMetricsErrorRecovery,
  remediationFactoryExecutiveMetricsErrorRecovery,
  remediationFactoryPriorityQueueErrorRecovery,
  remediationFactoryRankedPathsErrorRecovery,
} from "@/lib/remediation-factory/remediation-factory-error-recovery";
import {
  SECURENOW_PATH_RANKED_PATHS_LEAD,
  SECURENOW_PATH_RANKED_PATHS_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";
import { cn } from "@/lib/utils";

import { RemediationFactoryExecutiveMetricsSection } from "./RemediationFactoryExecutiveMetricsSection";
import { RemediationFactoryPriorityTable } from "./RemediationFactoryPriorityTable";
import { RemediationFactoryRankedPathsTable } from "./RemediationFactoryRankedPathsTable";
import {
  REMEDIATION_FACTORY_LAST_REFRESHED_PREFIX,
  REMEDIATION_FACTORY_REFRESHING_LABEL,
  remediationFactoryDataStaleCue,
  remediationFactoryPerSourceAgeLines,
  resolveRemediationFactoryLastRefreshedAt,
} from "./remediation-factory-freshness";
import { useRemediationFactoryUrlState } from "./useRemediationFactoryUrlState";

const RANKED_PATHS_PAGE_SIZE = 25;

function withServerRankOrder(rows: RemediationPrioritizedFinding[]): RemediationPrioritizedFinding[] {
  return rows.map((row, index) => ({
    ...row,
    rankOrder: row.rankOrder ?? index + 1,
  }));
}

function RegionErrorRecovery(props: {
  readonly presentation: ReturnType<typeof remediationFactoryExecutiveMetricsErrorRecovery>;
  readonly onRetry: () => void;
}) {
  return (
    <div className="space-y-2">
      <StatusTag kind="needs-attention" label="Section unavailable" />
      <OperatorErrorRecoveryContract presentation={props.presentation} />
      <Button type="button" variant="outline" size="sm" onClick={props.onRetry}>
        Retry this section
      </Button>
    </div>
  );
}

export function RemediationFactoryClient() {
  const { productLine } = useProductLine();
  const navHref = remediationFactoryPathForProductLine(productLine);
  const scopeLabel = "This workspace";
  const nowMs = useOperatorRelativeFreshnessNowMs();
  const { state: urlState, replaceState: replaceUrlState } = useRemediationFactoryUrlState();
  const [rankedPathsPage, setRankedPathsPage] = useState(1);

  const rankedQuery = useRemediationRankedFindingsQuery();
  const rankedPathsQuery = useSecurityEvidenceRankedPathsQuery(rankedPathsPage, RANKED_PATHS_PAGE_SIZE);
  const metricsQuery = useRemediationFactoryMetricsQuery();

  const selectedFindingId = urlState.selectedFindingId;
  const selectedPathId = urlState.selectedPathId;

  const ranked = useMemo(
    () => withServerRankOrder(rankedQuery.data ?? []),
    [rankedQuery.data],
  );
  const rankedPaths = rankedPathsQuery.data?.items ?? [];
  const rankedPathsTotal = rankedPathsQuery.data?.totalCount ?? rankedPaths.length;

  const refreshing =
    rankedQuery.isFetching || metricsQuery.isFetching || rankedPathsQuery.isFetching;

  const lastRefreshedAt = useMemo(
    () =>
      resolveRemediationFactoryLastRefreshedAt({
        metricsUpdatedAt: metricsQuery.dataUpdatedAt,
        rankedUpdatedAt: rankedQuery.dataUpdatedAt,
        rankedPathsUpdatedAt: rankedPathsQuery.dataUpdatedAt,
      }),
    [metricsQuery.dataUpdatedAt, rankedQuery.dataUpdatedAt, rankedPathsQuery.dataUpdatedAt],
  );

  const freshnessLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: REMEDIATION_FACTORY_LAST_REFRESHED_PREFIX,
    lastRefreshedAt: refreshing ? null : lastRefreshedAt,
    refreshingLabel: refreshing ? REMEDIATION_FACTORY_REFRESHING_LABEL : null,
  });

  const perSourceAges = remediationFactoryPerSourceAgeLines({
    metricsUpdatedAt: metricsQuery.dataUpdatedAt,
    rankedUpdatedAt: rankedQuery.dataUpdatedAt,
    rankedPathsUpdatedAt: rankedPathsQuery.dataUpdatedAt,
  });

  const staleCue = remediationFactoryDataStaleCue(lastRefreshedAt, nowMs);

  const refreshAll = useCallback(() => {
    void rankedQuery.refetch();
    void metricsQuery.refetch();
    void rankedPathsQuery.refetch();
  }, [metricsQuery, rankedPathsQuery, rankedQuery]);

  const pathInspectPanelRef = useRef<HTMLElement | null>(null);
  const [simulatorSummary, setSimulatorSummary] = useState<string | null>(null);
  const [simulatorRuleVersion, setSimulatorRuleVersion] = useState<string | null>(null);
  const [simulatorGeneratedAt, setSimulatorGeneratedAt] = useState<Date | null>(null);
  const [simulatorError, setSimulatorError] = useState<string | null>(null);

  const selectedFindingRow = ranked.find((row) => row.findingId === selectedFindingId) ?? null;
  const selectedPathRow = rankedPaths.find((row) => row.pathId === selectedPathId) ?? null;

  const selectFinding = useCallback(
    (findingId: string) => {
      replaceUrlState({ selectedFindingId: findingId, selectedPathId: null });
    },
    [replaceUrlState],
  );

  const selectPath = useCallback(
    (pathId: string) => {
      replaceUrlState({ selectedPathId: pathId, selectedFindingId: null });
    },
    [replaceUrlState],
  );

  const selectRowById = useCallback(
    (rowId: string) => {
      if (ranked.some((row) => row.findingId === rowId)) {
        selectFinding(rowId);
        return;
      }

      if (rankedPaths.some((row) => row.pathId === rowId)) {
        selectPath(rowId);
      }
    },
    [ranked, rankedPaths, selectFinding, selectPath],
  );

  const runSimulator = useCallback(async (findingId: string) => {
    setSimulatorError(null);

    try {
      const explanation = await fetchRemediationScoreExplanation(findingId);
      setSimulatorSummary(explanation.explanationSummary);
      setSimulatorRuleVersion(explanation.ruleVersion);
      setSimulatorGeneratedAt(new Date());
    } catch {
      setSimulatorError("Could not load score explanation.");
      setSimulatorSummary(null);
      setSimulatorRuleVersion(null);
      setSimulatorGeneratedAt(null);
    }
  }, []);

  useRemediationFactoryShortcuts({
    onSelectRowId: selectRowById,
    onFocusInspect: () => {
      pathInspectPanelRef.current?.focus();
    },
    onExplainScore: () => {
      if (selectedFindingId !== null) {
        void runSimulator(selectedFindingId);
      }
    },
    explainEnabled: selectedFindingId !== null,
  });

  useEffect(() => {
    if (selectedFindingId != null || selectedPathId != null) {
      pathInspectPanelRef.current?.focus();
    }
  }, [selectedFindingId, selectedPathId]);

  const hasQueueRows = ranked.length > 0;
  const hasPathRows = rankedPaths.length > 0;

  const claimDiscipline =
    "Explainable prioritization and ranked scores are advisory — not sealed-record proof, live scanner output, or cloud apply.";

  return (
    <div className="space-y-4 p-4" data-testid="remediation-factory-page">
      <OperatorPageHeader
        navHref={navHref}
        title={OPERATOR_NAV_LINK_LABELS.remediationFactory}
        titleTestId="remediation-factory-page-title"
        subtitle="Explainable prioritization, wave planning, and executive metrics for operational security review."
        subtitleTestId="remediation-factory-page-lead"
        claimDiscipline={claimDiscipline}
        claimDisciplineTestId="remediation-factory-claim-discipline"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
            <RefreshButton
              busy={refreshing}
              label="Refresh"
              data-testid="remediation-factory-refresh-button"
              onClick={refreshAll}
            />
          </div>
        }
        metadata={
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center gap-3">
              <OperatorPageFreshnessMetadata
                testId="remediation-factory-last-refreshed"
                lastRefreshedAt={lastRefreshedAt}
              >
                {freshnessLabel}
              </OperatorPageFreshnessMetadata>
              {staleCue !== null ? (
                <span data-testid="remediation-factory-stale-cue">
                  <StatusTag kind="needs-attention" label={staleCue} />
                </span>
              ) : null}
            </div>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="remediation-factory-per-source-ages">
              {perSourceAges}
            </p>
          </div>
        }
      />

      <section className="space-y-3" aria-label="Operator priority table">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Priority queue</h2>
        {rankedQuery.isError ? (
          <RegionErrorRecovery
            presentation={remediationFactoryPriorityQueueErrorRecovery()}
            onRetry={() => void rankedQuery.refetch()}
          />
        ) : !hasQueueRows ? (
          <EnterpriseCompactEmptyState {...REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY} />
        ) : (
          <RemediationFactoryPriorityTable
            rows={ranked}
            selectedFindingId={selectedFindingId}
            onSelect={selectFinding}
            scopeLabel={scopeLabel}
            totalCount={ranked.length}
          />
        )}
      </section>

      <section className="space-y-3" aria-label={SECURENOW_PATH_RANKED_PATHS_TITLE}>
        <header className="space-y-1">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{SECURENOW_PATH_RANKED_PATHS_TITLE}</h2>
          <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_RANKED_PATHS_LEAD}</p>
        </header>
        {rankedPathsQuery.isError ? (
          <RegionErrorRecovery
            presentation={remediationFactoryRankedPathsErrorRecovery()}
            onRetry={() => void rankedPathsQuery.refetch()}
          />
        ) : !hasPathRows ? (
          <EnterpriseCompactEmptyState {...REMEDIATION_FACTORY_RANKED_PATHS_EMPTY} />
        ) : (
          <RemediationFactoryRankedPathsTable
            rows={rankedPaths}
            selectedPathId={selectedPathId}
            onSelect={selectPath}
            scopeLabel={scopeLabel}
            totalCount={rankedPathsTotal}
            page={rankedPathsPage}
            pageSize={RANKED_PATHS_PAGE_SIZE}
            onPageChange={setRankedPathsPage}
          />
        )}
      </section>

      {hasQueueRows || hasPathRows ? (
        <SecurityEvidencePathInspectPanel
          findingId={selectedFindingId}
          pathIdOverride={selectedPathId}
          panelRef={pathInspectPanelRef}
          selectedFindingSummary={selectedFindingRow}
          selectedPathSummary={selectedPathRow}
          hasInventoryRows={hasQueueRows || hasPathRows}
        />
      ) : (
        <EnterpriseCompactEmptyState {...REMEDIATION_FACTORY_INSPECT_PREREQUISITE_EMPTY} />
      )}

      <section
        className="space-y-3 rounded border border-dashed border-border p-4"
        aria-label="Priority score simulator"
        data-testid="remediation-priority-simulator"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Priority score simulator</h2>
          <StatusTag kind="neutral" label="Simulator — not a live scanner feed" />
        </div>
        {!hasQueueRows ? (
          <EnterpriseCompactEmptyState {...REMEDIATION_FACTORY_SIMULATOR_PREREQUISITE_EMPTY} />
        ) : selectedFindingId === null ? (
          <p className={OPERATOR_TYPOGRAPHY.helper}>Select a row in the priority queue to explain its score.</p>
        ) : (
          <>
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={selectedFindingId === null}
              onClick={() => selectedFindingId && runSimulator(selectedFindingId)}
              data-testid="remediation-simulator-explain-button"
            >
              Explain selected score
            </Button>
            {simulatorError ? <StatusTag kind="needs-attention" label={simulatorError} /> : null}
            {simulatorSummary !== null ? (
              <OperatorAdvisorySimulatorProvenanceBlock
                title="Score explanation"
                simulatorTag="Simulator — not a live scanner feed"
                ruleVersion={simulatorRuleVersion}
                generatedAt={simulatorGeneratedAt}
                targetLabel={
                  selectedFindingRow !== null
                    ? `Finding rank ${selectedFindingRow.rankOrder ?? "—"} · ${selectedFindingRow.controlId ?? "control unknown"}`
                    : selectedFindingId
                }
                body={simulatorSummary}
                auditTrailRecorded={false}
                testId="remediation-simulator-output"
              />
            ) : null}
          </>
        )}
      </section>

      <details
        open={urlState.metricsSummaryOpen}
        onToggle={(event) => {
          replaceUrlState({ metricsSummaryOpen: (event.target as HTMLDetailsElement).open });
        }}
        className="rounded border border-border bg-card p-4"
        data-testid="remediation-factory-metrics-disclosure"
      >
        <summary className={cn("cursor-pointer font-medium", OPERATOR_TYPOGRAPHY.cardTitle)}>
          Executive and architect outcome metrics
        </summary>
        <div className="mt-4 space-y-4">
          {metricsQuery.isError ? (
            <RegionErrorRecovery
              presentation={remediationFactoryExecutiveMetricsErrorRecovery()}
              onRetry={() => void metricsQuery.refetch()}
            />
          ) : metricsQuery.isLoading && metricsQuery.data === undefined ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>Loading executive metrics…</p>
          ) : (
            <RemediationFactoryExecutiveMetricsSection
              metrics={metricsQuery.data}
              metricsLoaded={metricsQuery.data !== undefined}
            />
          )}
          <SecureNowArchitectOutcomeMetricsPanel
            fromSnapshotId={urlState.fromSnapshotId}
            toSnapshotId={urlState.toSnapshotId}
            onSnapshotPairChange={(pair) => {
              replaceUrlState({
                fromSnapshotId: pair.fromSnapshotId,
                toSnapshotId: pair.toSnapshotId,
              });
            }}
          />
        </div>
      </details>
    </div>
  );
}
