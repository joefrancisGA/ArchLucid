"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { LayerHeader } from "@/components/LayerHeader";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import {
  fetchArchitectureDiagramModel,
  fetchArchitectureDiagramReconciliation,
  formatInfraEvidenceDiagramReconcileApiError,
  ingestArchitectureDiagram,
  ingestOperationalSecurityFindings,
  reconcileArchitectureDiagram,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-api";
import {
  buildDiagramReconcileOperationalFindingRequestItem,
  formatDiagramReconcileExplanation,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-explanation";
import {
  DIAGRAM_RECONCILE_CORRESPONDENCE_ID_PARAM,
  DIAGRAM_RECONCILE_FILTER_PARAM,
  DIAGRAM_RECONCILE_RUN_ID_PARAM,
  DIAGRAM_RECONCILE_SNAPSHOT_ID_PARAM,
  diagramReconcileFilterHrefFromSearch,
  parseDiagramReconcileCorrespondenceIdFromSearch,
  parseDiagramReconcileFilterFromSearch,
  parseDiagramReconcileRunIdFromSearch,
  parseDiagramReconcileSnapshotIdFromSearch,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-filter-url";
import type {
  DiagramInfrastructureCorrespondenceRow,
  DiagramInfrastructureReconciliationResult,
  DiagramReconcileMatchKindFilter,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-types";
import {
  fetchInfraEvidenceSnapshots,
  formatInfraEvidenceApiError,
} from "@/lib/infra-evidence/infra-evidence-drift-api";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { governanceInfrastructureResourceHubPath } from "@/lib/governance/governance-infrastructure-route-paths";
import { buildInfrastructureAskHref } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { showError, showSuccess } from "@/lib/toast";

const MATCH_KIND_FILTERS: readonly { value: DiagramReconcileMatchKindFilter; label: string }[] = [
  { value: "all", label: "All rows" },
  { value: "Conflict", label: "Conflict" },
  { value: "DiagramOnly", label: "Diagram only" },
  { value: "InfrastructureOnly", label: "Infrastructure only" },
  { value: "Exact", label: "Exact" },
  { value: "Probable", label: "Probable" },
];

function formatSnapshotLabel(snapshot: InfraEvidenceSnapshotSummary): string {
  const captured = snapshot.capturedUtc != null ? new Date(snapshot.capturedUtc).toLocaleString() : "unknown time";
  const subscription = snapshot.subscriptionName ?? snapshot.subscriptionId ?? "subscription";

  return `${subscription} · ${captured} · ${snapshot.resourceCount} resources`;
}

function buildResourceHubHref(cloudResourceId: string | null): string | null {
  if (cloudResourceId == null || cloudResourceId.trim().length === 0) {
    return null;
  }

  return governanceInfrastructureResourceHubPath(cloudResourceId.trim());
}

function buildDiagramReconcileCorrespondenceAskHref(
  row: DiagramInfrastructureCorrespondenceRow,
  snapshotId: string,
  runId: string,
): string {
  return buildInfrastructureAskHref({
    cloudResourceId: row.cloudResourceId != null && row.cloudResourceId.trim().length > 0
      ? row.cloudResourceId
      : undefined,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    correspondenceId: row.correspondenceId,
  });
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator === "undefined" || navigator.clipboard?.writeText == null) {
    throw new Error("Clipboard is unavailable in this browser.");
  }

  await navigator.clipboard.writeText(text);
}

export function DiagramReconcileWorkbenchClient() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const urlRunId = parseDiagramReconcileRunIdFromSearch(searchParams.get(DIAGRAM_RECONCILE_RUN_ID_PARAM));
  const urlSnapshotId = parseDiagramReconcileSnapshotIdFromSearch(
    searchParams.get(DIAGRAM_RECONCILE_SNAPSHOT_ID_PARAM),
  );
  const urlFilter = parseDiagramReconcileFilterFromSearch(searchParams.get(DIAGRAM_RECONCILE_FILTER_PARAM));
  const urlCorrespondenceId = parseDiagramReconcileCorrespondenceIdFromSearch(
    searchParams.get(DIAGRAM_RECONCILE_CORRESPONDENCE_ID_PARAM),
  );

  const [runId, setRunId] = useState<string>(urlRunId);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(urlSnapshotId);
  const [matchKindFilter, setMatchKindFilter] = useState<DiagramReconcileMatchKindFilter>(urlFilter);
  const [selectedCorrespondenceId, setSelectedCorrespondenceId] = useState<string | null>(
    urlCorrespondenceId.length > 0 ? urlCorrespondenceId : null,
  );
  const [diagramSourceName, setDiagramSourceName] = useState<string>("uploaded-diagram");
  const [diagramMermaid, setDiagramMermaid] = useState<string>("");
  const [snapshots, setSnapshots] = useState<InfraEvidenceSnapshotSummary[]>([]);
  const [reconciliation, setReconciliation] = useState<DiagramInfrastructureReconciliationResult | null>(null);
  const [modelNodeCount, setModelNodeCount] = useState<number | null>(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [loadingReconciliation, setLoadingReconciliation] = useState(false);
  const [ingestBusy, setIngestBusy] = useState(false);
  const [reconcileBusy, setReconcileBusy] = useState(false);
  const [findingBusyId, setFindingBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const syncUrl = useCallback(
    (patch: {
      runId?: string;
      snapshotId?: string;
      reconcileFilter?: DiagramReconcileMatchKindFilter;
      correspondenceId?: string;
    }) => {
      router.replace(diagramReconcileFilterHrefFromSearch(searchParams.toString(), patch, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const filteredRows = useMemo(() => {
    const rows = reconciliation?.rows ?? [];

    if (matchKindFilter === "all") {
      return rows;
    }

    return rows.filter((row) => row.matchKind === matchKindFilter);
  }, [matchKindFilter, reconciliation?.rows]);

  const deepLinkedCorrespondenceMissing = useMemo(() => {
    if (
      urlCorrespondenceId.length === 0
      || loadingReconciliation
      || runId.trim().length === 0
      || selectedSnapshotId.trim().length === 0
    ) {
      return false;
    }

    if (reconciliation == null) {
      return true;
    }

    return !reconciliation.rows.some((row) => row.correspondenceId === urlCorrespondenceId);
  }, [loadingReconciliation, reconciliation, runId, selectedSnapshotId, urlCorrespondenceId]);

  useEffect(() => {
    if (urlCorrespondenceId.length === 0 || selectedCorrespondenceId !== urlCorrespondenceId) {
      return;
    }

    document
      .querySelector(`[data-testid="infra-diagram-reconcile-row-${urlCorrespondenceId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [filteredRows.length, selectedCorrespondenceId, urlCorrespondenceId]);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshots() {
      setLoadingSnapshots(true);
      setLoadError(null);

      try {
        const response = await fetchInfraEvidenceSnapshots(1, 50);
        const items = response.items ?? [];

        if (!cancelled) {
          setSnapshots(items);

          const resolvedSnapshotId = urlSnapshotId.length > 0 ? urlSnapshotId : items[0]?.snapshotId ?? "";
          setSelectedSnapshotId(resolvedSnapshotId);

          if (urlSnapshotId.length === 0 && resolvedSnapshotId.length > 0) {
            syncUrl({ snapshotId: resolvedSnapshotId });
          }
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(formatInfraEvidenceApiError(error));
        }
      } finally {
        if (!cancelled) {
          setLoadingSnapshots(false);
        }
      }
    }

    void loadSnapshots();

    return () => {
      cancelled = true;
    };
  }, [syncUrl, urlSnapshotId]);

  useEffect(() => {
    if (runId.trim().length === 0 || selectedSnapshotId.trim().length === 0) {
      setReconciliation(null);
      return;
    }

    let cancelled = false;

    async function loadExistingReconciliation() {
      setLoadingReconciliation(true);
      setLoadError(null);

      try {
        const result = await fetchArchitectureDiagramReconciliation(runId.trim(), selectedSnapshotId.trim());

        if (!cancelled) {
          setReconciliation(result);

          if (urlCorrespondenceId.length > 0) {
            const targetRow = result.rows.find((row) => row.correspondenceId === urlCorrespondenceId);

            if (
              targetRow != null
              && matchKindFilter !== "all"
              && targetRow.matchKind !== matchKindFilter
            ) {
              setMatchKindFilter("all");
              syncUrl({ reconcileFilter: "all" });
            }

            setSelectedCorrespondenceId(urlCorrespondenceId);
          } else {
            setSelectedCorrespondenceId(null);
          }
        }
      } catch {
        if (!cancelled) {
          setReconciliation(null);
          setSelectedCorrespondenceId(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingReconciliation(false);
        }
      }
    }

    void loadExistingReconciliation();

    return () => {
      cancelled = true;
    };
  }, [matchKindFilter, runId, selectedSnapshotId, syncUrl, urlCorrespondenceId]);

  const handleRunIdChange = useCallback(
    (nextRunId: string) => {
      setRunId(nextRunId);
      setModelNodeCount(null);
      syncUrl({ runId: nextRunId });
    },
    [syncUrl],
  );

  const handleSnapshotChange = useCallback(
    (nextSnapshotId: string) => {
      setSelectedSnapshotId(nextSnapshotId);
      syncUrl({ snapshotId: nextSnapshotId });
    },
    [syncUrl],
  );

  const handleFilterChange = useCallback(
    (nextFilter: DiagramReconcileMatchKindFilter) => {
      setMatchKindFilter(nextFilter);
      syncUrl({ reconcileFilter: nextFilter });
    },
    [syncUrl],
  );

  const loadExistingModel = useCallback(async () => {
    if (runId.trim().length === 0) {
      return;
    }

    setLoadError(null);

    try {
      const model = await fetchArchitectureDiagramModel(runId.trim());
      const activeNodes = model.nodes?.filter((node) => node.removed !== true) ?? [];
      setModelNodeCount(activeNodes.length);
      showSuccess(`Loaded existing diagram model — ${activeNodes.length} active node(s) on this sealed run.`);
    } catch (error: unknown) {
      setModelNodeCount(null);
      showError("Could not load diagram model", formatInfraEvidenceDiagramReconcileApiError(error));
    }
  }, [runId]);

  const runIngest = useCallback(async () => {
    if (runId.trim().length === 0) {
      showError("Review id required", "Enter a sealed review record id before ingesting a diagram.");
      return;
    }

    if (diagramMermaid.trim().length === 0) {
      showError("Diagram source required", "Paste Mermaid diagram text before ingesting.");
      return;
    }

    setIngestBusy(true);
    setLoadError(null);

    try {
      const result = await ingestArchitectureDiagram(runId.trim(), {
        sources: [
          {
            name: diagramSourceName.trim().length > 0 ? diagramSourceName.trim() : "uploaded-diagram",
            format: "mermaid",
            content: diagramMermaid,
          },
        ],
      });

      const activeNodes = result.model?.nodes?.filter((node) => node.removed !== true) ?? [];
      setModelNodeCount(activeNodes.length);
      showSuccess(
        result.warnings?.length
          ? `Diagram ingested with ${result.warnings.length} warning(s).`
          : "Structured diagram model saved for this run.",
      );
    } catch (error: unknown) {
      showError("Diagram ingest failed", formatInfraEvidenceDiagramReconcileApiError(error));
    } finally {
      setIngestBusy(false);
    }
  }, [diagramMermaid, diagramSourceName, runId]);

  const runReconcile = useCallback(async () => {
    if (runId.trim().length === 0 || selectedSnapshotId.trim().length === 0) {
      showError("Run and snapshot required", "Select a sealed run and inventory snapshot before reconciling.");
      return;
    }

    setReconcileBusy(true);
    setLoadError(null);

    try {
      const result = await reconcileArchitectureDiagram(runId.trim(), selectedSnapshotId.trim());
      setReconciliation(result);
      showSuccess(`Reconciliation complete — ${result.rows.length} correspondence row(s) generated.`);
    } catch (error: unknown) {
      showError("Reconciliation failed", formatInfraEvidenceDiagramReconcileApiError(error));
    } finally {
      setReconcileBusy(false);
    }
  }, [runId, selectedSnapshotId]);

  const runCreateFinding = useCallback(
    async (row: DiagramInfrastructureCorrespondenceRow) => {
      if (runId.trim().length === 0 || selectedSnapshotId.trim().length === 0) {
        return;
      }

      setFindingBusyId(row.correspondenceId);

      try {
        const item = buildDiagramReconcileOperationalFindingRequestItem(row, runId.trim(), selectedSnapshotId.trim());
        const result = await ingestOperationalSecurityFindings({ items: [item] });
        const outcome = result.items?.[0]?.outcome ?? "Unknown";
        showSuccess(`Operational finding submitted — outcome: ${outcome}`);
      } catch (error: unknown) {
        showError("Could not create operational finding", formatInfraEvidenceDiagramReconcileApiError(error));
      } finally {
        setFindingBusyId(null);
      }
    },
    [runId, selectedSnapshotId],
  );

  const runCopyArmId = useCallback(async (azureResourceId: string | null) => {
    if (azureResourceId == null || azureResourceId.trim().length === 0) {
      return;
    }

    try {
      await copyTextToClipboard(azureResourceId);
      showSuccess("ARM id copied");
    } catch (error: unknown) {
      showError("Copy failed", error instanceof Error ? error.message : "Clipboard unavailable.");
    }
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6" data-testid="infra-diagram-reconcile-workbench">
      <LayerHeader pageKey="infrastructure-diagram-reconcile" />
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Reconcile an ingested architecture diagram against an Azure inventory snapshot. Correspondence rows are
        deterministic — AI rationale appears only on Possible or Unknown matches and cannot promote insufficient
        evidence to confirmed.
      </p>

      {loadError != null ? (
        <StatusTag kind="needs-attention" label={loadError} />
      ) : null}

      {deepLinkedCorrespondenceMissing ? (
        <p
          className={cn("m-0 text-sm text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="infra-diagram-reconcile-correspondence-deep-link-missing"
          role="status"
        >
          The linked diagram correspondence row is not in the loaded reconciliation for this run and snapshot.
        </p>
      ) : null}

      <section className="grid gap-4 rounded-md border border-border p-4" aria-label="Reconciliation wizard">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>1. Diagram source</h2>
        <label className="flex flex-col gap-1">
          <span className={OPERATOR_TYPOGRAPHY.helper}>Sealed review record id</span>
          <input
            className="rounded border border-border bg-background px-3 py-2"
            data-testid="infra-diagram-reconcile-run-id"
            value={runId}
            onChange={(event) => handleRunIdChange(event.target.value)}
            placeholder="00000000-0000-0000-0000-000000000000"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" data-testid="infra-diagram-reconcile-load-model" onClick={() => void loadExistingModel()}>
            Use existing ingested model
          </Button>
          {modelNodeCount != null ? (
            <span className={cn("self-center text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {modelNodeCount} active node(s) loaded
            </span>
          ) : null}
        </div>
        <label className="flex flex-col gap-1">
          <span className={OPERATOR_TYPOGRAPHY.helper}>Source name</span>
          <input
            className="rounded border border-border bg-background px-3 py-2"
            value={diagramSourceName}
            onChange={(event) => setDiagramSourceName(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={OPERATOR_TYPOGRAPHY.helper}>Paste Mermaid diagram</span>
          <textarea
            className="min-h-[8rem] rounded border border-border bg-background px-3 py-2 font-mono text-sm"
            data-testid="infra-diagram-reconcile-mermaid-input"
            value={diagramMermaid}
            onChange={(event) => setDiagramMermaid(event.target.value)}
            placeholder="flowchart LR&#10;  app-->db"
          />
        </label>
        <Button
          type="button"
          variant="outline"
          data-testid="infra-diagram-reconcile-ingest"
          disabled={ingestBusy}
          onClick={() => void runIngest()}
        >
          {ingestBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Ingest diagram on run
        </Button>
      </section>

      <section className="grid gap-4 rounded-md border border-border p-4" aria-label="Snapshot selection">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>2. Inventory snapshot</h2>
        <label className="flex flex-col gap-1">
          <span className={OPERATOR_TYPOGRAPHY.helper}>Snapshot</span>
          <select
            className="rounded border border-border bg-background px-3 py-2"
            data-testid="infra-diagram-reconcile-snapshot-picker"
            disabled={loadingSnapshots || snapshots.length === 0}
            value={selectedSnapshotId}
            onChange={(event) => handleSnapshotChange(event.target.value)}
          >
            {snapshots.length === 0 ? (
              <option value="">No snapshots available</option>
            ) : (
              snapshots.map((snapshot) => (
                <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                  {formatSnapshotLabel(snapshot)}
                </option>
              ))
            )}
          </select>
        </label>
      </section>

      <section className="flex flex-wrap items-center gap-3" aria-label="Run reconciliation">
        <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>3. Reconcile</h2>
        <Button
          type="button"
          data-testid="infra-diagram-reconcile-run"
          disabled={reconcileBusy || runId.trim().length === 0 || selectedSnapshotId.trim().length === 0}
          onClick={() => void runReconcile()}
        >
          {reconcileBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Run reconciliation
        </Button>
        {loadingReconciliation ? (
          <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Loading saved reconciliation…
          </span>
        ) : null}
      </section>

      {reconciliation != null ? (
        <section className="flex flex-col gap-4" aria-label="Reconciliation results">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Correspondence rows</h2>
              <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {reconciliation.diagramNodeCount} diagram nodes · {reconciliation.inventoryResourceCount} inventory
                resources · {filteredRows.length} visible row(s)
              </p>
            </div>
            <label className="flex flex-col gap-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>Filter</span>
              <select
                className="rounded border border-border bg-background px-3 py-2"
                data-testid="infra-diagram-reconcile-filter"
                value={matchKindFilter}
                onChange={(event) => handleFilterChange(event.target.value as DiagramReconcileMatchKindFilter)}
              >
                {MATCH_KIND_FILTERS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <EnterpriseTable ariaLabel="Diagram reconciliation correspondence rows">
            <EnterpriseTableHead>
              <EnterpriseTableRow>
                <EnterpriseTableHeaderCell>Match</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Confidence</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Diagram</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>ARM id</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Explanation</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
              </EnterpriseTableRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {filteredRows.map((row) => {
                const resourceHubHref = buildResourceHubHref(row.cloudResourceId);
                const explanation = formatDiagramReconcileExplanation(row);

                return (
                  <EnterpriseTableRow
                    key={row.correspondenceId}
                    data-testid={`infra-diagram-reconcile-row-${row.correspondenceId}`}
                    className={selectedCorrespondenceId === row.correspondenceId ? "bg-muted/40" : undefined}
                  >
                    <EnterpriseTableCell>{row.matchKind}</EnterpriseTableCell>
                    <EnterpriseTableCell>{row.confidenceBand}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <div>{row.diagramNodeLabel ?? "—"}</div>
                      {row.matchKind === "Conflict" && row.azureResourceId != null ? (
                        <div className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                          Inventory: {row.azureResourceId}
                        </div>
                      ) : null}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <span className="break-all font-mono text-xs">{row.azureResourceId ?? "—"}</span>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>{explanation}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <div className="flex flex-col gap-2">
                        {resourceHubHref != null ? (
                          <Link className="text-al-link hover:underline" href={resourceHubHref}>
                            Open resource hub
                          </Link>
                        ) : null}
                        <Button asChild variant="outline" size="sm">
                          <Link
                            href={buildDiagramReconcileCorrespondenceAskHref(row, selectedSnapshotId, runId)}
                            data-testid={`infra-diagram-reconcile-ask-${row.correspondenceId}`}
                          >
                            Ask
                          </Link>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={row.azureResourceId == null || row.azureResourceId.trim().length === 0}
                          onClick={() => void runCopyArmId(row.azureResourceId)}
                        >
                          Copy ARM id
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={findingBusyId === row.correspondenceId}
                          onClick={() => void runCreateFinding(row)}
                        >
                          {findingBusyId === row.correspondenceId ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : null}
                          Create operational finding
                        </Button>
                      </div>
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                );
              })}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </section>
      ) : null}
    </div>
  );
}
