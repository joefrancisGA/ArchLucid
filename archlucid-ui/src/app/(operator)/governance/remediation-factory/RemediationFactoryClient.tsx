"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { CompareDiffExpandableValueCell } from "@/components/compare/CompareDiffExpandableValueCell";
import { CopyIdButton } from "@/components/CopyIdButton";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import {
  SecureNowArchitectOutcomeMetricsPanel,
  type SecureNowArchitectOutcomeQueryState,
} from "@/components/security/SecureNowArchitectOutcomeMetricsPanel";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
import { ShortcutHint } from "@/components/ShortcutHint";
import { RefreshButton } from "@/components/ui/refresh-button";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { useEnterpriseTableKeyboardNav } from "@/hooks/use-enterprise-table-keyboard-nav";
import { fetchRemediationScoreExplanation } from "@/lib/remediation-factory-api";
import type {
  RemediationFactoryMetrics,
  RemediationPrioritizedFinding,
  RemediationPrioritizationExplanation,
} from "@/lib/remediation-factory-types";
import {
  useRemediationFactoryMetricsQuery,
  useRemediationRankedFindingsQuery,
} from "@/hooks/use-remediation-factory-query";
import { useSecurityEvidenceRankedPathsQuery } from "@/hooks/use-security-evidence-ranked-paths-query";
import { useOperatorRelativeFreshnessNowMs } from "@/hooks/use-operator-relative-freshness-now-ms";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { assignedToMeFindingsPathForProductLine } from "@/lib/product-line/securenow-assigned-to-me-route";
import { remediationFactoryPathForProductLine } from "@/lib/product-line/securenow-remediation-factory-route";
import {
  formatSecurityEvidencePathConfidenceBandLabel,
  formatSecurityEvidencePathKindLabel,
  securityEvidencePathConfidenceBandStatusKind,
} from "@/lib/security-evidence-path-presentation";
import type { SecurityEvidencePathRankSummary } from "@/lib/security-evidence-path-types";
import {
  SECURENOW_PATH_RANKED_PATHS_LEAD,
  SECURENOW_PATH_RANKED_PATHS_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import { cn } from "@/lib/utils";

import { RemediationFactoryContextStrip } from "./RemediationFactoryContextStrip";

const PATH_VIEWS = [
  { value: "all", label: "All paths" },
  { value: "public-exposure", label: "Public exposure" },
  { value: "privilege", label: "Privilege paths" },
  { value: "insufficient-evidence", label: "Insufficient evidence" },
] as const;
import {
  REMEDIATION_FACTORY_ARCHITECT_SNAPSHOTS_EMPTY,
  REMEDIATION_FACTORY_EXECUTIVE_METRICS_LOADING,
  REMEDIATION_FACTORY_PATH_INSPECT_SELECT_PROMPT,
  REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY,
  REMEDIATION_FACTORY_RANKED_PATHS_EMPTY,
  REMEDIATION_FACTORY_SIMULATOR_SELECT_PROMPT,
} from "./remediation-factory-empty-states";
import {
  buildRemediationFactoryExecutiveMetricPresentations,
  REMEDIATION_FACTORY_EXECUTIVE_METRICS_SCOPE,
  REMEDIATION_FACTORY_EXECUTIVE_METRICS_TITLE,
  type RemediationFactoryMetricPresentation,
} from "./remediation-factory-metric-presentation";
import {
  remediationFactoryDataStaleCue,
  remediationFactoryFreshnessLabel,
  resolveRemediationFactoryLastRefreshedAt,
} from "./remediation-factory-freshness";
import { useRemediationFactoryUrlState } from "./use-remediation-factory-url-state";
import {
  REMEDIATION_FACTORY_PRIMARY_CONTENT_ID,
  REMEDIATION_FACTORY_SKIP_LINK_LABEL,
} from "./remediation-factory-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

function ExecutiveMetricTile(props: {
  readonly label: string;
  readonly presentation: RemediationFactoryMetricPresentation;
  readonly hint?: string;
}) {
  const content = (
    <>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{props.label}</p>
      <p className={OPERATOR_TYPOGRAPHY.dataValue}>{props.presentation.displayValue}</p>
      <p className={OPERATOR_TYPOGRAPHY.helper}>{props.presentation.scopeNote}</p>
      {props.hint ? <p className={OPERATOR_TYPOGRAPHY.helper}>{props.hint}</p> : null}
      {props.presentation.state === "notMeasured" ? (
        <StatusTag kind="draft" label="Not measured" />
      ) : null}
    </>
  );

  if (props.presentation.href !== undefined && props.presentation.href.length > 0) {
    return (
      <Link
        href={props.presentation.href}
        className="block rounded border border-border bg-card p-4 no-underline transition hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2"
        data-testid={`remediation-metric-${props.label}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded border border-border bg-card p-4" data-testid={`remediation-metric-${props.label}`}>
      {content}
    </div>
  );
}

function ExecutiveMetricsGrid(props: { readonly metrics: RemediationFactoryMetrics; readonly openFindingsHref: string }) {
  const tiles = buildRemediationFactoryExecutiveMetricPresentations({
    metrics: props.metrics,
    openFindingsHref: props.openFindingsHref,
  });

  return (
    <section aria-labelledby="remediation-executive-metrics-heading" className="space-y-3">
      <header className="space-y-1">
        <h2 id="remediation-executive-metrics-heading" className={OPERATOR_TYPOGRAPHY.sectionTitle}>
          {REMEDIATION_FACTORY_EXECUTIVE_METRICS_TITLE}
        </h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>{REMEDIATION_FACTORY_EXECUTIVE_METRICS_SCOPE}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <ExecutiveMetricTile key={tile.key} label={tile.label} presentation={tile.presentation} hint={tile.hint} />
        ))}
      </div>
    </section>
  );
}

function useSelectableTableKeyboard(props: {
  readonly rowCount: number;
  readonly onActivate: (index: number) => void;
}) {
  const keyboardNav = useEnterpriseTableKeyboardNav({
    rowCount: props.rowCount,
    onActivateRow: props.onActivate,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current === null) {
      return;
    }

    const focused = scrollRef.current.querySelector<HTMLElement>(
      `[data-selectable-row-index="${keyboardNav.focusedRowIndex}"]`,
    );

    focused?.scrollIntoView({ block: "nearest" });
  }, [keyboardNav.focusedRowIndex]);

  const handleRowKeyDown = useCallback(
    (event: KeyboardEvent, rowIndex: number) => {
      event.stopPropagation();
      keyboardNav.onTableKeyDown(event);

      if (!event.defaultPrevented && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        props.onActivate(rowIndex);
      }
    },
    [keyboardNav, props],
  );

  return { keyboardNav, scrollRef, handleRowKeyDown };
}

function PriorityTable(props: {
  readonly rows: ReadonlyArray<RemediationPrioritizedFinding>;
  readonly selectedFindingId: string | null;
  readonly onSelect: (findingId: string) => void;
}) {
  const { keyboardNav, scrollRef, handleRowKeyDown } = useSelectableTableKeyboard({
    rowCount: props.rows.length,
    onActivate: (index) => {
      const row = props.rows[index];

      if (row !== undefined) {
        props.onSelect(row.findingId);
      }
    },
  });

  return (
    <div
      ref={scrollRef}
      tabIndex={props.rows.length > 0 ? 0 : undefined}
      role="region"
      aria-label="Priority queue keyboard region"
      onKeyDown={props.rows.length > 0 ? keyboardNav.onTableKeyDown : undefined}
      data-testid="remediation-priority-queue-keyboard-region"
      className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2"
    >
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
              data-selectable-row-index={index}
              selected={props.selectedFindingId === row.findingId}
              interactive
              tabIndex={index === keyboardNav.focusedRowIndex ? 0 : -1}
              className={cn(
                keyboardNav.isRowFocused(index)
                  ? "ring-2 ring-inset ring-neutral-500/40 dark:ring-neutral-400/40"
                  : undefined,
              )}
              onClick={() => props.onSelect(row.findingId)}
              onKeyDown={(event) => handleRowKeyDown(event, index)}
            >
              <EnterpriseTableCell>{index + 1}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.totalScore.toFixed(4)}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.controlId ?? "—"}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.patternKey ?? "—"}</EnterpriseTableCell>
              <CompareDiffExpandableValueCell value={row.explanationSummary} />
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}

function RankedPathsTable(props: {
  readonly rows: ReadonlyArray<SecurityEvidencePathRankSummary>;
  readonly selectedPathId: string | null;
  readonly onSelect: (pathId: string) => void;
}) {
  const { keyboardNav, scrollRef, handleRowKeyDown } = useSelectableTableKeyboard({
    rowCount: props.rows.length,
    onActivate: (index) => {
      const row = props.rows[index];

      if (row !== undefined) {
        props.onSelect(row.pathId);
      }
    },
  });

  return (
    <div
      ref={scrollRef}
      tabIndex={props.rows.length > 0 ? 0 : undefined}
      role="region"
      aria-label="Ranked architect paths keyboard region"
      onKeyDown={props.rows.length > 0 ? keyboardNav.onTableKeyDown : undefined}
      data-testid="security-evidence-ranked-paths-keyboard-region"
      className="outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2"
    >
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
          {props.rows.map((row, index) => (
            <EnterpriseTableRow
              key={row.pathId}
              data-testid={`security-evidence-ranked-path-row-${row.pathId}`}
              data-selectable-row-index={index}
              selected={props.selectedPathId === row.pathId}
              interactive
              tabIndex={index === keyboardNav.focusedRowIndex ? 0 : -1}
              className={cn(
                keyboardNav.isRowFocused(index)
                  ? "ring-2 ring-inset ring-neutral-500/40 dark:ring-neutral-400/40"
                  : undefined,
              )}
              onClick={() => props.onSelect(row.pathId)}
              onKeyDown={(event) => handleRowKeyDown(event, index)}
            >
              <EnterpriseTableCell>{row.rankOrder}</EnterpriseTableCell>
              <EnterpriseTableCell title={row.pathKind}>{formatSecurityEvidencePathKindLabel(row.pathKind)}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag
                  kind={securityEvidencePathConfidenceBandStatusKind(row.pathConfidenceBand)}
                  label={formatSecurityEvidencePathConfidenceBandLabel(row.pathConfidenceBand)}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell>{row.compositeSortScore.toFixed(4)}</EnterpriseTableCell>
              <CompareDiffExpandableValueCell value={row.explanationSummary} />
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}

function RemediationSimulatorOutput(props: {
  readonly explanation: RemediationPrioritizationExplanation;
  readonly generatedAt: Date;
}) {
  const copyPayload = [
    `Finding ID: ${props.explanation.findingId}`,
    `Generated: ${props.generatedAt.toISOString()}`,
    `Rule version: ${props.explanation.ruleVersion}`,
    props.explanation.explanationSummary,
  ].join("\n");

  return (
    <div
      className="space-y-2 rounded border border-border bg-muted/30 p-3"
      data-testid="remediation-simulator-output"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className={OPERATOR_TYPOGRAPHY.cardTitle}>Score breakdown</h3>
        <StatusTag kind="neutral" label="Simulator — not a live scanner feed" />
      </div>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        Finding{" "}
        <span className="font-mono">{props.explanation.findingId}</span>
        <CopyIdButton value={props.explanation.findingId} aria-label="Copy finding ID" />
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        Generated {formatIsoUtcForDisplay(props.generatedAt.toISOString())}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        Rule version: {props.explanation.ruleVersion}
      </p>
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{props.explanation.explanationSummary}</p>
      <div className="flex items-center gap-2">
        <CopyIdButton value={copyPayload} aria-label="Copy score breakdown" />
        <span className={OPERATOR_TYPOGRAPHY.helper}>Copy citable breakdown</span>
      </div>
    </div>
  );
}

export function RemediationFactoryClient() {
  const { productLine } = useProductLine();
  const router = useRouter();
  const searchParams = useSearchParams();
  const navHref = remediationFactoryPathForProductLine(productLine);
  const openFindingsHref = assignedToMeFindingsPathForProductLine(productLine);
  const {
    findingId: selectedFindingId,
    pathId: selectedPathId,
    syncSelection,
    selectFinding,
    selectPath,
    ...urlState
  } = useRemediationFactoryUrlState(productLine);
  const nowMs = useOperatorRelativeFreshnessNowMs();
  const rankedQuery = useRemediationRankedFindingsQuery();
  const rankedPathsQuery = useSecurityEvidenceRankedPathsQuery();
  const metricsQuery = useRemediationFactoryMetricsQuery();
  const [outcomeQueryState, setOutcomeQueryState] = useState<SecureNowArchitectOutcomeQueryState | null>(null);
  const [simulatorExplanation, setSimulatorExplanation] = useState<RemediationPrioritizationExplanation | null>(null);
  const [simulatorGeneratedAt, setSimulatorGeneratedAt] = useState<Date | null>(null);
  const [simulatorError, setSimulatorError] = useState<string | null>(null);
  const pathInspectPanelRef = useRef<HTMLElement | null>(null);

  const ranked = rankedQuery.data ?? [];
  const rankedPaths = rankedPathsQuery.data?.items ?? [];
  const pathView = searchParams.get("pathView") ?? "all";
  const visibleRankedPaths = useMemo(() => {
    switch (pathView) {
      case "public-exposure":
        return rankedPaths.filter((row) => row.pathKind.toLowerCase().includes("reachability"));
      case "privilege":
        return rankedPaths.filter((row) => row.pathKind.toLowerCase().includes("privilege"));
      case "insufficient-evidence":
        return rankedPaths.filter((row) => row.pathConfidenceBand === "InsufficientEvidence");
      default:
        return rankedPaths;
    }
  }, [pathView, rankedPaths]);
  const rankedPathsComputedLine = useMemo(() => {
    if (rankedPaths.length === 0) {
      return null;
    }

    const computedTimes = rankedPaths.map((row) => row.computedUtc.trim());

    if (computedTimes.some((computedUtc) => computedUtc.length === 0)) {
      return null;
    }

    return computedTimes.every((computedUtc) => computedUtc === computedTimes[0])
      ? `Computed ${formatIsoUtcForDisplay(computedTimes[0]!)}.`
      : "Computed times differ across this page.";
  }, [rankedPaths]);

  const setPathView = useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("pathView");
    } else {
      params.set("pathView", value);
    }
    const query = params.toString();
    router.replace(query.length > 0 ? `?${query}` : window.location.pathname, { scroll: false });
  }, [router, searchParams]);

  const refreshing =
    rankedQuery.isFetching
    || metricsQuery.isFetching
    || rankedPathsQuery.isFetching
    || outcomeQueryState?.snapshotsFetching === true
    || outcomeQueryState?.outcomeFetching === true;

  const lastRefreshedAt = useMemo(
    () =>
      resolveRemediationFactoryLastRefreshedAt({
        metricsUpdatedAt: metricsQuery.dataUpdatedAt,
        rankedUpdatedAt: rankedQuery.dataUpdatedAt,
        rankedPathsUpdatedAt: rankedPathsQuery.dataUpdatedAt,
        outcomeUpdatedAt: outcomeQueryState?.outcomeUpdatedAt,
        snapshotsUpdatedAt: outcomeQueryState?.snapshotsUpdatedAt,
      }),
    [
      metricsQuery.dataUpdatedAt,
      outcomeQueryState?.outcomeUpdatedAt,
      outcomeQueryState?.snapshotsUpdatedAt,
      rankedPathsQuery.dataUpdatedAt,
      rankedQuery.dataUpdatedAt,
    ],
  );

  const freshnessLabel = remediationFactoryFreshnessLabel({
    lastRefreshedAt,
    refreshing,
  });

  const staleCue = remediationFactoryDataStaleCue(lastRefreshedAt, nowMs);

  const refreshAll = useCallback(() => {
    void rankedQuery.refetch();
    void metricsQuery.refetch();
    void rankedPathsQuery.refetch();
    outcomeQueryState?.refetchAll();
  }, [metricsQuery, outcomeQueryState, rankedPathsQuery, rankedQuery]);

  const selectedFinding = ranked.find((row) => row.findingId === selectedFindingId) ?? null;
  const selectedPath = rankedPaths.find((row) => row.pathId === selectedPathId) ?? null;

  const selectionLabel = useMemo(() => {
    if (selectedFinding != null) {
      return `Finding ${selectedFinding.controlId ?? "—"} · ${selectedFinding.patternKey ?? "—"} · rank ${ranked.indexOf(selectedFinding) + 1}`;
    }

    if (selectedPath != null) {
      return `Path ${selectedPath.pathKind} · rank ${selectedPath.rankOrder}`;
    }

    return null;
  }, [ranked, selectedFinding, selectedPath]);

  useEffect(() => {
    if (selectedFindingId != null || selectedPathId != null) {
      pathInspectPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      pathInspectPanelRef.current?.focus();
    }
  }, [selectedFindingId, selectedPathId]);

  useEffect(() => {
    if (!rankedQuery.isSuccess || selectedFindingId === null) {
      return;
    }

    const stillPresent = ranked.some((row) => row.findingId === selectedFindingId);

    if (!stillPresent) {
      syncSelection({ findingId: null });
    }
  }, [ranked, rankedQuery.isSuccess, selectedFindingId, syncSelection]);

  useEffect(() => {
    if (!rankedPathsQuery.isSuccess || selectedPathId === null) {
      return;
    }

    const stillPresent = rankedPaths.some((row) => row.pathId === selectedPathId);

    if (!stillPresent) {
      syncSelection({ pathId: null });
    }
  }, [rankedPaths, rankedPathsQuery.isSuccess, selectedPathId, syncSelection]);

  async function runSimulator(findingId: string) {
    setSimulatorError(null);

    try {
      const explanation = await fetchRemediationScoreExplanation(findingId);
      setSimulatorExplanation(explanation);
      setSimulatorGeneratedAt(new Date());
    } catch {
      setSimulatorError("Could not load score explanation.");
      setSimulatorExplanation(null);
      setSimulatorGeneratedAt(null);
    }
  }

  return (
    <div className="space-y-4 p-4" data-testid="remediation-factory-page">
      <a
        href={`#${REMEDIATION_FACTORY_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {REMEDIATION_FACTORY_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={navHref}
        title={OPERATOR_NAV_LINK_LABELS.remediationFactory}
        titleTestId="remediation-factory-page-title"
        subtitle="Explainable prioritization, wave planning, and executive metrics. Advisory only — no cloud apply."
        subtitleTestId="remediation-factory-page-lead"
        claimDiscipline="Simulator and ranked scores are advisory — not sealed-record proof or live scanner output."
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
        }
      />

      <main
        id={REMEDIATION_FACTORY_PRIMARY_CONTENT_ID}
        className="scroll-mt-24 space-y-4"
        data-testid="remediation-factory-primary-content"
      >
      <RemediationFactoryContextStrip
        freshnessLabel={freshnessLabel}
        lastRefreshedAt={lastRefreshedAt}
        scopeLabel="Advisory remediation factory · current workspace scope"
        selectionLabel={selectionLabel}
      />

      {metricsQuery.isError ? (
        <StatusTag kind="needs-attention" label="Executive metrics unavailable" />
      ) : metricsQuery.data ? (
        <ExecutiveMetricsGrid metrics={metricsQuery.data} openFindingsHref={openFindingsHref} />
      ) : (
        <p className={OPERATOR_TYPOGRAPHY.helper}>{REMEDIATION_FACTORY_EXECUTIVE_METRICS_LOADING}</p>
      )}

      <SecureNowArchitectOutcomeMetricsPanel
        fromSnapshotId={urlState.fromSnapshotId}
        toSnapshotId={urlState.toSnapshotId}
        hasUrlSnapshotPair={urlState.hasSnapshotPair}
        onSnapshotPairChange={urlState.setSnapshotPair}
        onQueryStateChange={setOutcomeQueryState}
        snapshotsEmptyPreset={REMEDIATION_FACTORY_ARCHITECT_SNAPSHOTS_EMPTY}
      />

      <section className="space-y-3" aria-label="Operator priority table">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Priority queue</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-factory-findings-audience-line">
          These are SecureNow findings for the current inventory snapshot. They are not architecture review findings.
        </p>
        {rankedQuery.isError ? (
          <StatusTag kind="needs-attention" label="Priority queue unavailable" />
        ) : ranked.length === 0 ? (
          <EnterpriseCompactEmptyState {...REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY} />
        ) : (
          <PriorityTable
            rows={ranked}
            selectedFindingId={selectedFindingId}
            onSelect={selectFinding}
          />
        )}
      </section>

      <section className="space-y-3" aria-label={SECURENOW_PATH_RANKED_PATHS_TITLE}>
        <header className="space-y-1">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{SECURENOW_PATH_RANKED_PATHS_TITLE}</h2>
          <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_RANKED_PATHS_LEAD}</p>
          <p className={cn("m-0 flex flex-wrap items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
            Queue shortcuts:
            <span className="inline-flex items-center gap-1">next <ShortcutHint shortcut="alt+j" /></span>
            <span className="inline-flex items-center gap-1">previous <ShortcutHint shortcut="alt+k" /></span>
            <span className="inline-flex items-center gap-1">inspect <ShortcutHint shortcut="alt+i" /></span>
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-2" aria-label="Ranked path views">
          {PATH_VIEWS.map((view) => (
            <Button
              key={view.value}
              type="button"
              size="sm"
              variant={pathView === view.value ? "default" : "outline"}
              aria-pressed={pathView === view.value}
              onClick={() => setPathView(view.value)}
            >
              {rankedPathsQuery.isSuccess
                ? `${view.label} · ${
                    view.value === "all"
                      ? rankedPaths.length
                      : view.value === "public-exposure"
                        ? rankedPaths.filter((row) => row.pathKind.toLowerCase().includes("reachability")).length
                        : view.value === "privilege"
                          ? rankedPaths.filter((row) => row.pathKind.toLowerCase().includes("privilege")).length
                          : rankedPaths.filter((row) => row.pathConfidenceBand === "InsufficientEvidence").length
                  }`
                : view.label}
            </Button>
          ))}
        </div>
        {rankedPathsQuery.isLoading ? (
          <p className={OPERATOR_TYPOGRAPHY.helper}>Loading ranked paths…</p>
        ) : rankedPathsQuery.isError ? (
          <>
            <OperatorErrorRecoveryContract
              presentation={{
                whatFailed: "Ranked paths did not load.",
                whatIsIntact: rankedQuery.isSuccess
                  ? "The priority queue and the selected snapshot stay on this page."
                  : "The snapshot selection stays on this page.",
                nextStep: "Retry the load. This does not change Azure.",
              }}
              testId="remediation-ranked-paths-error-recovery"
            />
            <RefreshButton
              busy={rankedPathsQuery.isFetching}
              label="Retry ranked paths"
              data-testid="remediation-ranked-paths-retry"
              onClick={() => void rankedPathsQuery.refetch()}
            />
          </>
        ) : rankedPathsComputedLine !== null ? (
          <>
            <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-ranked-paths-computed">
              {rankedPathsComputedLine}
            </p>
            {visibleRankedPaths.length === 0 ? (
              <EnterpriseCompactEmptyState {...REMEDIATION_FACTORY_RANKED_PATHS_EMPTY} />
            ) : (
              <RankedPathsTable
                rows={visibleRankedPaths}
                selectedPathId={selectedPathId}
                onSelect={selectPath}
              />
            )}
          </>
        ) : visibleRankedPaths.length === 0 ? (
          <EnterpriseCompactEmptyState {...REMEDIATION_FACTORY_RANKED_PATHS_EMPTY} />
        ) : (
          <RankedPathsTable
            rows={visibleRankedPaths}
            selectedPathId={selectedPathId}
            onSelect={selectPath}
          />
        )}
      </section>

      <SecurityEvidencePathInspectPanel
        findingId={selectedFindingId}
        pathIdOverride={selectedPathId}
        panelRef={pathInspectPanelRef}
        selectedFinding={selectedFinding}
        selectedPath={selectedPath}
        selectPromptPreset={REMEDIATION_FACTORY_PATH_INSPECT_SELECT_PROMPT}
      />

      <section
        id="remediation-priority-simulator"
        className="space-y-3 rounded border border-dashed border-border p-4"
        aria-label="Priority score simulator"
        data-testid="remediation-priority-simulator"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Priority score simulator</h2>
          <StatusTag kind="neutral" label="Simulator — not a live scanner feed" />
        </div>
        {selectedFindingId == null ? (
          <EnterpriseCompactEmptyState {...REMEDIATION_FACTORY_SIMULATOR_SELECT_PROMPT} />
        ) : (
          <>
            <p className={OPERATOR_TYPOGRAPHY.helper}>
              Explain deterministic score breakdown for finding{" "}
              <span className="font-mono">{selectedFindingId}</span>.
            </p>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={selectedFindingId == null}
              onClick={() => selectedFindingId && runSimulator(selectedFindingId)}
            >
              Explain selected score
            </Button>
          </>
        )}
        {simulatorError ? <StatusTag kind="needs-attention" label={simulatorError} /> : null}
        {simulatorExplanation != null && simulatorGeneratedAt != null ? (
          <RemediationSimulatorOutput explanation={simulatorExplanation} generatedAt={simulatorGeneratedAt} />
        ) : null}
      </section>
      </main>
    </div>
  );
}
