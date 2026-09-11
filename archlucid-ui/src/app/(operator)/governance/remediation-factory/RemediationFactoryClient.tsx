"use client";

import { useEffect, useRef, useState } from "react";

import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import { SecureNowArchitectOutcomeMetricsPanel } from "@/components/security/SecureNowArchitectOutcomeMetricsPanel";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { fetchRemediationScoreExplanation } from "@/lib/remediation-factory-api";
import type { RemediationFactoryMetrics, RemediationPrioritizedFinding } from "@/lib/remediation-factory-types";
import {
  useRemediationFactoryMetricsQuery,
  useRemediationRankedFindingsQuery,
} from "@/hooks/use-remediation-factory-query";
import { useSecurityEvidenceRankedPathsQuery } from "@/hooks/use-security-evidence-ranked-paths-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import {
  formatSecurityEvidencePathConfidenceBandLabel,
  securityEvidencePathConfidenceBandStatusKind,
} from "@/lib/security-evidence-path-presentation";
import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";
import {
  SECURENOW_PATH_RANKED_PATHS_EMPTY,
  SECURENOW_PATH_RANKED_PATHS_ERROR,
  SECURENOW_PATH_RANKED_PATHS_LEAD,
  SECURENOW_PATH_RANKED_PATHS_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";

function MetricCard(props: { readonly label: string; readonly value: string; readonly hint?: string }) {
  return (
    <div className="rounded border border-border bg-card p-4" data-testid={`remediation-metric-${props.label}`}>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{props.label}</p>
      <p className={OPERATOR_TYPOGRAPHY.dataValue}>{props.value}</p>
      {props.hint ? <p className={OPERATOR_TYPOGRAPHY.helper}>{props.hint}</p> : null}
    </div>
  );
}

function ExecutiveMetricsGrid(props: { readonly metrics: RemediationFactoryMetrics }) {
  const metrics = props.metrics;

  return (
    <section aria-label="Executive remediation metrics" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Open findings" value={String(metrics.openFindings)} />
      <MetricCard label="Risk-weighted open" value={metrics.riskWeightedOpen.toFixed(2)} />
      <MetricCard label="Critical exposure" value={String(metrics.criticalExposureCount)} />
      <MetricCard label="Net burn (7d)" value={String(metrics.netBurn)} hint={`Created ${metrics.createdThisWeek} · Remediated ${metrics.remediatedThisWeek}`} />
      <MetricCard label="Pattern ExactMatch %" value={`${metrics.patternCoverageExactMatchPercent}%`} />
      <MetricCard label="Automation %" value={`${metrics.automationPercent}%`} />
      <MetricCard label="Exceptions active" value={String(metrics.exceptionsActive)} hint={`${metrics.exceptionsExpiringSoon} expiring soon`} />
      <MetricCard label="Avg age (days)" value={metrics.averageAgeDays.toFixed(1)} />
    </section>
  );
}

function PriorityTable(props: {
  readonly rows: ReadonlyArray<RemediationPrioritizedFinding>;
  readonly selectedFindingId: string | null;
  readonly onSelect: (findingId: string) => void;
}) {
  return (
    <EnterpriseTable ariaLabel="Remediation priority queue">
      <EnterpriseTableHead>
        <EnterpriseTableRow>
          <EnterpriseTableHeaderCell>Rank</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Score</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Control</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Pattern</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
        </EnterpriseTableRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.rows.map((row, index) => (
          <EnterpriseTableRow
            key={row.findingId}
            data-testid={`remediation-priority-row-${row.findingId}`}
            onClick={() => props.onSelect(row.findingId)}
            className={props.selectedFindingId === row.findingId ? "bg-muted/40" : undefined}
          >
            <EnterpriseTableCell>{index + 1}</EnterpriseTableCell>
            <EnterpriseTableCell>{row.totalScore.toFixed(4)}</EnterpriseTableCell>
            <EnterpriseTableCell>{row.controlId ?? "—"}</EnterpriseTableCell>
            <EnterpriseTableCell>{row.patternKey ?? "—"}</EnterpriseTableCell>
            <EnterpriseTableCell className="max-w-md truncate">{row.explanationSummary}</EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

function RankedPathsTable(props: {
  readonly rows: ReadonlyArray<SecurityEvidencePathRankSummary>;
  readonly selectedPathId: string | null;
  readonly onSelect: (pathId: string) => void;
}) {
  return (
    <EnterpriseTable ariaLabel={SECURENOW_PATH_RANKED_PATHS_TITLE}>
      <EnterpriseTableHead>
        <EnterpriseTableRow>
          <EnterpriseTableHeaderCell>Rank</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Kind</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Band</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Score</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Summary</EnterpriseTableHeaderCell>
        </EnterpriseTableRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.rows.map((row) => (
          <EnterpriseTableRow
            key={row.pathId}
            data-testid={`security-evidence-ranked-path-row-${row.pathId}`}
            onClick={() => props.onSelect(row.pathId)}
            className={props.selectedPathId === row.pathId ? "bg-muted/40" : undefined}
          >
            <EnterpriseTableCell>{row.rankOrder}</EnterpriseTableCell>
            <EnterpriseTableCell>{row.pathKind}</EnterpriseTableCell>
            <EnterpriseTableCell>
              <StatusTag
                kind={securityEvidencePathConfidenceBandStatusKind(row.pathConfidenceBand)}
                label={formatSecurityEvidencePathConfidenceBandLabel(row.pathConfidenceBand)}
              />
            </EnterpriseTableCell>
            <EnterpriseTableCell>{row.compositeSortScore.toFixed(4)}</EnterpriseTableCell>
            <EnterpriseTableCell className="max-w-md truncate">{row.explanationSummary}</EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}

export function RemediationFactoryClient() {
  const rankedQuery = useRemediationRankedFindingsQuery();
  const rankedPathsQuery = useSecurityEvidenceRankedPathsQuery();
  const metricsQuery = useRemediationFactoryMetricsQuery();
  const [selectedFindingId, setSelectedFindingId] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [simulatorSummary, setSimulatorSummary] = useState<string | null>(null);
  const [simulatorError, setSimulatorError] = useState<string | null>(null);
  const pathInspectPanelRef = useRef<HTMLElement | null>(null);

  const ranked = rankedQuery.data ?? [];
  const rankedPaths = rankedPathsQuery.data?.items ?? [];

  useEffect(() => {
    if (selectedFindingId != null || selectedPathId != null) {
      pathInspectPanelRef.current?.focus();
    }
  }, [selectedFindingId, selectedPathId]);

  async function runSimulator(findingId: string) {
    setSimulatorError(null);

    try {
      const explanation = await fetchRemediationScoreExplanation(findingId);
      setSimulatorSummary(explanation.explanationSummary);
    } catch {
      setSimulatorError("Could not load score explanation.");
      setSimulatorSummary(null);
    }
  }

  return (
    <div className="space-y-6 p-4" data-testid="remediation-factory-page">
      <header className="space-y-2">
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Remediation factory</h1>
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          Explainable prioritization, wave planning, and executive metrics. Advisory only — no cloud apply.
        </p>
      </header>

      {metricsQuery.isError ? (
        <StatusTag kind="needs-attention" label="Executive metrics unavailable" />
      ) : metricsQuery.data ? (
        <ExecutiveMetricsGrid metrics={metricsQuery.data} />
      ) : (
        <p className={OPERATOR_TYPOGRAPHY.helper}>Loading executive metrics…</p>
      )}

      <SecureNowArchitectOutcomeMetricsPanel />

      <section className="space-y-3" aria-label="Operator priority table">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Priority queue</h2>
        {rankedQuery.isError ? (
          <StatusTag kind="needs-attention" label="Priority queue unavailable" />
        ) : ranked.length === 0 ? (
          <p className={OPERATOR_TYPOGRAPHY.helper}>No open operational security findings to rank.</p>
        ) : (
          <PriorityTable
            rows={ranked}
            selectedFindingId={selectedFindingId}
            onSelect={(findingId) => {
              setSelectedFindingId(findingId);
              setSelectedPathId(null);
            }}
          />
        )}
      </section>

      <section className="space-y-3" aria-label={SECURENOW_PATH_RANKED_PATHS_TITLE}>
        <header className="space-y-1">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{SECURENOW_PATH_RANKED_PATHS_TITLE}</h2>
          <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_RANKED_PATHS_LEAD}</p>
        </header>
        {rankedPathsQuery.isError ? (
          <StatusTag kind="needs-attention" label={SECURENOW_PATH_RANKED_PATHS_ERROR} />
        ) : rankedPaths.length === 0 ? (
          <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_RANKED_PATHS_EMPTY}</p>
        ) : (
          <RankedPathsTable
            rows={rankedPaths}
            selectedPathId={selectedPathId}
            onSelect={(pathId) => {
              setSelectedPathId(pathId);
              setSelectedFindingId(null);
            }}
          />
        )}
      </section>

      <SecurityEvidencePathInspectPanel
        findingId={selectedFindingId}
        pathIdOverride={selectedPathId}
        panelRef={pathInspectPanelRef}
      />

      <section
        className="space-y-3 rounded border border-dashed border-border p-4"
        aria-label="Priority score simulator"
        data-testid="remediation-priority-simulator"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Priority score simulator</h2>
          <StatusTag kind="neutral" label="Simulator — not a live scanner feed" />
        </div>
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          Select a row above, then run the simulator to view the deterministic score breakdown for that finding.
        </p>
        <button
          type="button"
          className="rounded bg-primary px-3 py-2 text-sm text-primary-foreground disabled:opacity-50"
          disabled={!selectedFindingId}
          onClick={() => selectedFindingId && runSimulator(selectedFindingId)}
        >
          Explain selected score
        </button>
        {simulatorError ? <StatusTag kind="needs-attention" label={simulatorError} /> : null}
        {simulatorSummary ? (
          <pre className="overflow-x-auto rounded bg-muted p-3 text-xs" data-testid="remediation-simulator-output">
            {simulatorSummary}
          </pre>
        ) : null}
      </section>
    </div>
  );
}
