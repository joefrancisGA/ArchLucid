"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { CopyIdButton } from "@/components/CopyIdButton";
import { ShortcutHint } from "@/components/ShortcutHint";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { SecurityEvidencePathInspectPanel } from "@/components/security/SecurityEvidencePathInspectPanel";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { PageShortcutsDisclosure } from "@/components/usability/PageShortcutsDisclosure";
import {
  SecureNowArchitectOutcomeMetricsPanel,
  type SecureNowArchitectOutcomeQueryState,
} from "@/components/security/SecureNowArchitectOutcomeMetricsPanel";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { StatusTag } from "@/components/ui/status-tag";
import { Button } from "@/components/ui/button";
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
import { useRemediationFactoryShortcuts } from "@/hooks/useRemediationFactoryShortcuts";
import { focusGovernanceFindingsQueuePathInspectPanel } from "@/hooks/use-governance-findings-queue-path-inspect-shortcuts";
import {
  focusRemediationFactoryEvidence,
  focusRemediationFactoryQueueRow,
} from "@/lib/governance/governance-findings-queue-keyboard-focus";
import { fetchRemediationScoreExplanation } from "@/lib/remediation-factory-api";
import {
  remediationFactoryExecutiveMetricsErrorRecovery,
  remediationFactoryPriorityQueueErrorRecovery,
  remediationFactoryRankedPathsErrorRecovery,
} from "@/lib/remediation-factory/remediation-factory-error-recovery";
import { REMEDIATION_WAVES_SECTION_ID } from "@/lib/remediation-wave-list-copy";
import type {
  RemediationFactoryMetrics,
  RemediationPrioritizationExplanation,
} from "@/lib/remediation-factory-types";
import {
  useRemediationFactoryMetricsQuery,
  useRemediationRankedFindingsQuery,
} from "@/hooks/use-remediation-factory-query";
import { useSecurityEvidenceRankedPathsQuery } from "@/hooks/use-security-evidence-ranked-paths-query";
import { useSecurityEvidencePathReportQuery } from "@/hooks/use-security-evidence-path-report-query";
import { useOperatorRelativeFreshnessNowMs } from "@/hooks/use-operator-relative-freshness-now-ms";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { assignedToMeFindingsPathForProductLine } from "@/lib/product-line/securenow-assigned-to-me-route";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import { resolveSecureNowPageHeading } from "@/lib/product-line/securenow-page-heading";
import { remediationFactoryPathForProductLine } from "@/lib/product-line/securenow-remediation-factory-route";
import { remediationInstancesPathForProductLine } from "@/lib/product-line/securenow-remediation-instances-route";
import {
  SECURENOW_PATH_RANKED_PATHS_LEAD,
  SECURENOW_PATH_RANKED_PATHS_TITLE,
} from "@/lib/product-line/securenow-path-inspect-copy";
import { formatIsoUtcForDisplay } from "@/lib/format-iso-utc";
import { cn } from "@/lib/utils";

import { RemediationFactoryAttackPathReportSection } from "./RemediationFactoryAttackPathReportSection";
import { RemediationFactoryTopCutPointsSection } from "./RemediationFactoryTopCutPointsSection";
import { RemediationFactoryContextStrip } from "./RemediationFactoryContextStrip";
import { RemediationFactoryPriorityTable } from "./RemediationFactoryPriorityTable";
import { RemediationFactoryRankedPathsShortcutHints } from "./RemediationFactoryRankedPathsShortcutHints";
import { RemediationFactoryRankedPathsTable } from "./RemediationFactoryRankedPathsTable";
import { remediationFactoryPageShortcutsDisclosureEntries } from "./remediation-factory-page-shortcuts-disclosure";
import {
  computeRemediationFactoryRankedPathViewCounts,
  remediationFactoryRankedPathViewFilteredCount,
} from "./remediation-factory-ranked-path-view-counts";
import {
  resolveAttackPathReportSnapshotId,
  shouldShowAttackPathReportRankedSnapshotHint,
} from "./resolve-attack-path-report-snapshot-id";

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
} from "./remediation-factory-metric-presentation";
import {
  remediationFactoryDataStaleCue,
  remediationFactoryFreshnessLabel,
  resolveRemediationFactoryLastRefreshedAt,
} from "./remediation-factory-freshness";
import { useRemediationFactoryUrlState } from "./use-remediation-factory-url-state";
import { REMEDIATION_FACTORY_RANKED_PATHS_DEFAULT_PAGE_SIZE } from "./remediation-factory-url-state";
import {
  REMEDIATION_FACTORY_OPEN_WAVES_LABEL,
  REMEDIATION_FACTORY_PAGE_SUBTITLE,
  REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID,
  REMEDIATION_FACTORY_PRIMARY_CONTENT_ID,
  REMEDIATION_FACTORY_SKIP_LINK_LABEL,
} from "./remediation-factory-page-copy";
import { RemediationFactoryMetricsMeasurementDisclosure } from "./RemediationFactoryMetricsMeasurementDisclosure";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

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
      <EnterpriseTable ariaLabel="Executive remediation metrics">
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>Metric</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell className="text-right">Value</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>What it measures</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {tiles.map((tile) => {
            const href = tile.presentation.href;
            const metricLabel =
              href !== undefined && href.length > 0 ? (
                <Link href={href} className={OPERATOR_LINK.inline}>
                  {tile.label}
                </Link>
              ) : (
                tile.label
              );

            return (
              <EnterpriseTableRow key={tile.key} data-testid={`remediation-metric-${tile.label}`}>
                <EnterpriseTableCell>{metricLabel}</EnterpriseTableCell>
                <EnterpriseTableCell className="text-right tabular-nums">
                  <span className={OPERATOR_TYPOGRAPHY.dataValue}>{tile.presentation.displayValue}</span>
                  {tile.presentation.state === "notMeasured" ? (
                    <StatusTag kind="draft" label="Not measured" />
                  ) : null}
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <p className={OPERATOR_TYPOGRAPHY.helper}>{tile.presentation.scopeNote}</p>
                  {tile.hint ? <p className={OPERATOR_TYPOGRAPHY.helper}>{tile.hint}</p> : null}
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            );
          })}
        </EnterpriseTableBody>
      </EnterpriseTable>
      <RemediationFactoryMetricsMeasurementDisclosure />
    </section>
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
        This explains the queue ranking; it does not apply a remediation.
      </p>
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
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
        Copies this explanation. It does not create a sealed review record.
      </p>
    </div>
  );
}

export function RemediationFactoryClient() {
  const { productLine } = useProductLine();
  const router = useRouter();
  const searchParams = useSearchParams();
  const navHref = remediationFactoryPathForProductLine(productLine);
  const pageTitle = resolveSecureNowPageHeading(
    productLine,
    OPERATOR_NAV_LINK_LABELS.remediationFactory,
    SECURENOW_REMEDIATION_FACTORY_PATH,
  );
  const openFindingsHref = assignedToMeFindingsPathForProductLine(productLine);
  const {
    findingId: selectedFindingId,
    pathId: selectedPathId,
    rankedPage,
    syncSelection,
    selectFinding,
    selectPath,
    setRankedPage,
    ...urlState
  } = useRemediationFactoryUrlState(productLine);
  const nowMs = useOperatorRelativeFreshnessNowMs();
  const rankedQuery = useRemediationRankedFindingsQuery();
  const rankedPathsPageSize = REMEDIATION_FACTORY_RANKED_PATHS_DEFAULT_PAGE_SIZE;
  const rankedPathsQuery = useSecurityEvidenceRankedPathsQuery(rankedPage, rankedPathsPageSize);
  const workbenchSnapshotId = urlState.toSnapshotId ?? urlState.fromSnapshotId;
  const reportSnapshotId = useMemo(
    () =>
      resolveAttackPathReportSnapshotId(
        urlState.toSnapshotId,
        urlState.fromSnapshotId,
        rankedPathsQuery.data?.items ?? [],
        rankedPathsQuery.isLoading,
      ),
    [
      urlState.toSnapshotId,
      urlState.fromSnapshotId,
      rankedPathsQuery.data?.items,
      rankedPathsQuery.isLoading,
    ],
  );
  const showAttackPathReportRankedSnapshotHint = useMemo(
    () =>
      shouldShowAttackPathReportRankedSnapshotHint(
        urlState.toSnapshotId,
        urlState.fromSnapshotId,
        rankedPathsQuery.data?.items ?? [],
      ),
    [urlState.toSnapshotId, urlState.fromSnapshotId, rankedPathsQuery.data?.items],
  );
  const attackPathReportQuery = useSecurityEvidencePathReportQuery(reportSnapshotId);
  const metricsQuery = useRemediationFactoryMetricsQuery();
  const [outcomeQueryState, setOutcomeQueryState] = useState<SecureNowArchitectOutcomeQueryState | null>(null);
  const [simulatorExplanation, setSimulatorExplanation] = useState<RemediationPrioritizationExplanation | null>(null);
  const [simulatorGeneratedAt, setSimulatorGeneratedAt] = useState<Date | null>(null);
  const [simulatorError, setSimulatorError] = useState<string | null>(null);
  const [simulatorFindingId, setSimulatorFindingId] = useState<string | null>(null);
  const pathInspectPanelRef = useRef<HTMLElement | null>(null);
  const ranked = rankedQuery.data ?? [];
  const rankedPaths = rankedPathsQuery.data?.items ?? [];
  const selectedFindingIdRef = useRef(selectedFindingId);
  const selectedPathIdRef = useRef(selectedPathId);
  const rankedRef = useRef(ranked);
  const rankedPathsRef = useRef(rankedPaths);
  selectedFindingIdRef.current = selectedFindingId;
  selectedPathIdRef.current = selectedPathId;
  rankedRef.current = ranked;
  rankedPathsRef.current = rankedPaths;
  const pathView = searchParams.get("pathView") ?? "all";
  const pathViewCounts = useMemo(
    () => computeRemediationFactoryRankedPathViewCounts(rankedPaths),
    [rankedPaths],
  );

  useEffect(() => {
    setRankedPage(1);
  }, [pathView, setRankedPage]);

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
  const rankedPathsPaginationLine = useMemo(() => {
    const totalCount = rankedPathsQuery.data?.totalCount ?? rankedPaths.length;

    if (totalCount === 0) {
      return null;
    }

    return `Showing page ${rankedPage} (${rankedPaths.length} rows) of ${totalCount} ranked paths.`;
  }, [rankedPaths.length, rankedPage, rankedPathsQuery.data?.totalCount]);

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
      return `Finding ${selectedFinding.controlId ?? "—"} · rank ${ranked.indexOf(selectedFinding) + 1}`;
    }

    if (selectedPath != null) {
      return `Path ${selectedPath.pathKind} · rank ${selectedPath.rankOrder}`;
    }

    return null;
  }, [ranked, selectedFinding, selectedPath]);

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

  useEffect(() => {
    if (!rankedPathsQuery.isSuccess || selectedPathId === null) {
      return;
    }

    const stillVisible = visibleRankedPaths.some((row) => row.pathId === selectedPathId);

    if (!stillVisible) {
      syncSelection({ pathId: null });
    }
  }, [rankedPathsQuery.isSuccess, selectedPathId, syncSelection, visibleRankedPaths]);

  useEffect(() => {
    setSimulatorError(null);
    setSimulatorExplanation(null);
    setSimulatorGeneratedAt(null);
    setSimulatorFindingId(null);
  }, [selectedFindingId]);

  const runSimulator = useCallback(async (findingId: string) => {
    setSimulatorError(null);
    setSimulatorFindingId(findingId);

    try {
      const explanation = await fetchRemediationScoreExplanation(findingId);
      setSimulatorExplanation(explanation);
      setSimulatorGeneratedAt(new Date());
    } catch {
      setSimulatorError("Could not load score explanation.");
      setSimulatorExplanation(null);
      setSimulatorGeneratedAt(null);
      setSimulatorFindingId(null);
    }
  }, []);

  const getNavigationAnchorRowId = useCallback(
    () => selectedFindingIdRef.current ?? selectedPathIdRef.current,
    [],
  );

  const onSelectRowId = useCallback(
    (rowId: string) => {
      if (rankedRef.current.some((row) => row.findingId === rowId)) {
        selectFinding(rowId);

        return;
      }

      if (rankedPathsRef.current.some((row) => row.pathId === rowId)) {
        selectPath(rowId);
      }
    },
    [selectFinding, selectPath],
  );

  const onFocusInspect = useCallback(() => {
    focusGovernanceFindingsQueuePathInspectPanel(pathInspectPanelRef.current);
  }, []);

  const onFocusEvidence = useCallback(() => {
    focusRemediationFactoryEvidence(getNavigationAnchorRowId(), pathInspectPanelRef.current);
  }, [getNavigationAnchorRowId]);

  const onReturnToQueue = useCallback(() => {
    focusRemediationFactoryQueueRow(getNavigationAnchorRowId());
  }, [getNavigationAnchorRowId]);

  const onSelectPathAndFocusInspect = useCallback(
    (pathId: string) => {
      selectPath(pathId);
      focusGovernanceFindingsQueuePathInspectPanel(pathInspectPanelRef.current);
    },
    [selectPath],
  );

  const onExplainScore = useCallback(() => {
    const findingId = selectedFindingIdRef.current;

    if (findingId == null) {
      return;
    }

    void runSimulator(findingId);
  }, [runSimulator]);

  useRemediationFactoryShortcuts({
    getNavigationAnchorRowId,
    onSelectRowId,
    onFocusInspect,
    onFocusEvidence,
    onReturnToQueue,
    onExplainScore,
    explainEnabled: selectedFindingId != null,
  });

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
        title={pageTitle}
        titleTestId="remediation-factory-page-title"
        subtitle={REMEDIATION_FACTORY_PAGE_SUBTITLE}
        subtitleTestId="remediation-factory-page-lead"
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
              <>
                <span data-testid="remediation-factory-stale-cue">
                  <StatusTag kind="needs-attention" label={staleCue} />
                </span>
                <span className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-factory-stale-refresh-honesty">
                  Refresh rereads the SecureNow lists on this page. It does not change Azure.
                </span>
              </>
            ) : null}
          </div>
        }
      />

      <div
        id={REMEDIATION_FACTORY_PRIMARY_CONTENT_ID}
        className="scroll-mt-24 space-y-4"
        data-testid="remediation-factory-primary-content"
      >
      <RemediationFactoryContextStrip
        freshnessLabel={freshnessLabel}
        lastRefreshedAt={lastRefreshedAt}
        scopeLabel="Advisory remediation factory · current workspace scope"
        selectionLabel={selectionLabel}
        findingId={selectedFindingId}
        pathId={selectedPathId}
      />

      <PageShortcutsDisclosure
        testId="remediation-factory-page-shortcuts"
        entries={remediationFactoryPageShortcutsDisclosureEntries()}
      />

      {metricsQuery.isError ? (
        <>
          <OperatorErrorRecoveryContract
            presentation={remediationFactoryExecutiveMetricsErrorRecovery()}
            testId="remediation-executive-metrics-error-recovery"
          />
          <RefreshButton
            busy={metricsQuery.isFetching}
            label="Retry executive metrics"
            data-testid="remediation-executive-metrics-retry"
            onClick={() => void metricsQuery.refetch()}
          />
        </>
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

      <RemediationFactoryAttackPathReportSection
        snapshotId={reportSnapshotId}
        reportQuery={attackPathReportQuery}
        selectedPathId={selectedPathId}
        onSelectPath={onSelectPathAndFocusInspect}
        awaitingRankedSnapshot={
          urlState.toSnapshotId === null
          && urlState.fromSnapshotId === null
          && rankedPathsQuery.isLoading
        }
        showRankedSnapshotHint={showAttackPathReportRankedSnapshotHint}
      />

      <RemediationFactoryTopCutPointsSection
        cutPoints={rankedPathsQuery.data?.topCutPoints ?? []}
        isLoading={rankedPathsQuery.isLoading}
        isError={rankedPathsQuery.isError}
        isFetching={rankedPathsQuery.isFetching}
        isSuccess={rankedPathsQuery.isSuccess}
        refetch={() => rankedPathsQuery.refetch()}
        selectedPathId={selectedPathId}
        onSelectPath={onSelectPathAndFocusInspect}
      />

      <section className="space-y-3" aria-label="Operator priority table">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Priority queue</h2>
        <Link
          href={`${remediationInstancesPathForProductLine(productLine)}#${REMEDIATION_WAVES_SECTION_ID}`}
          className={OPERATOR_LINK.inline}
          data-testid="remediation-factory-open-waves"
        >
          {REMEDIATION_FACTORY_OPEN_WAVES_LABEL}
        </Link>
        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-factory-findings-audience-line">
          These are SecureNow findings for the current inventory snapshot.
        </p>
        {rankedQuery.isError ? (
          <>
            <OperatorErrorRecoveryContract
              presentation={remediationFactoryPriorityQueueErrorRecovery()}
              testId="remediation-priority-queue-error-recovery"
            />
            <RefreshButton
              busy={rankedQuery.isFetching}
              label="Retry priority queue"
              data-testid="remediation-priority-queue-retry"
              onClick={() => void rankedQuery.refetch()}
            />
          </>
        ) : ranked.length === 0 ? (
          <EnterpriseCompactEmptyState {...REMEDIATION_FACTORY_PRIORITY_QUEUE_EMPTY} />
        ) : (
          <RemediationFactoryPriorityTable
            rows={ranked}
            selectedFindingId={selectedFindingId}
            onSelect={selectFinding}
            scopeLabel="Priority queue"
            totalCount={ranked.length}
            workbenchSnapshotId={workbenchSnapshotId}
          />
        )}
      </section>

      <section className="space-y-3" aria-label={SECURENOW_PATH_RANKED_PATHS_TITLE}>
        <header className="space-y-1">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{SECURENOW_PATH_RANKED_PATHS_TITLE}</h2>
          <p className={OPERATOR_TYPOGRAPHY.helper}>{SECURENOW_PATH_RANKED_PATHS_LEAD}</p>
          <RemediationFactoryRankedPathsShortcutHints />
        </header>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="remediation-ranked-path-filters-scope">
          These filters narrow the path list only. Counts are for paths on this page.
        </p>
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
                ? `${view.label} · ${remediationFactoryRankedPathViewFilteredCount(view.value, pathViewCounts)}`
                : view.label}
            </Button>
          ))}
        </div>
        {rankedPathsQuery.isLoading ? (
          <p className={OPERATOR_TYPOGRAPHY.helper}>Loading ranked paths…</p>
        ) : rankedPathsQuery.isError ? (
          <>
            <OperatorErrorRecoveryContract
              presentation={remediationFactoryRankedPathsErrorRecovery()}
              testId="remediation-ranked-paths-error-recovery"
            />
            <RefreshButton
              busy={rankedPathsQuery.isFetching}
              label="Retry ranked paths"
              data-testid="remediation-ranked-paths-retry"
              onClick={() => void rankedPathsQuery.refetch()}
            />
          </>
        ) : (
          <>
            {rankedPathsComputedLine !== null ? (
              <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-ranked-paths-computed">
                {rankedPathsComputedLine}
              </p>
            ) : null}
            {rankedPathsPaginationLine !== null ? (
              <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-ranked-paths-pagination">
                {rankedPathsPaginationLine}
              </p>
            ) : null}
            {visibleRankedPaths.length === 0 ? (
              <EnterpriseCompactEmptyState {...REMEDIATION_FACTORY_RANKED_PATHS_EMPTY} />
            ) : (
              <RemediationFactoryRankedPathsTable
                rows={visibleRankedPaths}
                selectedPathId={selectedPathId}
                onSelect={selectPath}
                scopeLabel={SECURENOW_PATH_RANKED_PATHS_TITLE}
                totalCount={rankedPathsQuery.data?.totalCount ?? rankedPaths.length}
                page={rankedPage}
                pageSize={rankedPathsPageSize}
                pageControlsBusy={rankedPathsQuery.isFetching}
                onPageChange={setRankedPage}
              />
            )}
          </>
        )}
      </section>

      <SecurityEvidencePathInspectPanel
        id={REMEDIATION_FACTORY_PATH_INSPECT_PANEL_ID}
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
              Explain selected score <ShortcutHint shortcut="alt+e" />
            </Button>
          </>
        )}
        {simulatorError ? <StatusTag kind="needs-attention" label={simulatorError} /> : null}
        {simulatorExplanation != null
          && simulatorGeneratedAt != null
          && simulatorFindingId !== null
          && simulatorFindingId !== selectedFindingId ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-simulator-stale-honesty">
            Score breakdown below is for a different finding. Select the same row again or run Explain to refresh.
          </p>
        ) : null}
        {simulatorExplanation != null
          && simulatorGeneratedAt != null
          && simulatorFindingId === selectedFindingId ? (
          <RemediationSimulatorOutput explanation={simulatorExplanation} generatedAt={simulatorGeneratedAt} />
        ) : null}
      </section>
      </div>
    </div>
  );
}
