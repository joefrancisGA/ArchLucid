"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ArchitectureDiagramViewer } from "@/components/architecture/ArchitectureDiagramViewer";
import { LayerHeader } from "@/components/LayerHeader";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import {
  downloadInfraEvidenceMermaidPng,
  fetchInfraEvidenceMermaidPreview,
  fetchInfraEvidenceMermaidRender,
  formatInfraEvidenceMermaidApiError,
} from "@/lib/infra-evidence/infra-evidence-mermaid-api";
import {
  INFRA_DIAGRAMS_DEFAULT_MODE,
  INFRA_DIAGRAMS_CLOUD_RESOURCE_ID_PARAM,
  INFRA_DIAGRAMS_MERMAID_MODE_PARAM,
  INFRA_DIAGRAMS_MERMAID_VIEW_PARAM,
  INFRA_DIAGRAMS_MODE_OPTIONS,
  INFRA_DIAGRAMS_SEED_NODE_ID_PARAM,
  INFRA_DIAGRAMS_SNAPSHOT_ID_PARAM,
  infraDiagramsFilterHrefFromSearch,
  parseInfraDiagramsCloudResourceIdFromSearch,
  parseInfraDiagramsMermaidModeFromSearch,
  parseInfraDiagramsMermaidViewFromSearch,
  parseInfraDiagramsSeedNodeIdFromSearch,
  parseInfraDiagramsSnapshotIdFromSearch,
} from "@/lib/infra-evidence/infra-evidence-diagrams-filter-url";
import {
  exceedsInfraEvidenceMermaidClientGuard,
  INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE,
} from "@/lib/infra-evidence/infra-evidence-mermaid-client-guard";
import type {
  InfraEvidenceMermaidFallbackArtifactSummary,
  InfraEvidenceMermaidModePreview,
  InfraEvidenceMermaidRenderResponse,
} from "@/lib/infra-evidence/infra-evidence-mermaid-types";
import {
  fetchInfraEvidenceSnapshots,
  formatInfraEvidenceApiError,
} from "@/lib/infra-evidence/infra-evidence-drift-api";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { buildInfrastructureAskHref, resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  formatResourceHubWorkbenchPrimaryHubLabel,
  mergeWorkbenchHubScopePatch,
  parseInfraEvidenceWorkbenchAuditScopeFromSearch,
} from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import { buildResourceHubDiagramReconcileWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-ask-citations";
import { buildResourceHubWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-workbench-url";
import { useTenantBrandingPresentationQuery } from "@/hooks/use-tenant-branding-presentation-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { downloadBrowserTextFile } from "@/lib/graph-view-model-export";
import { cn } from "@/lib/utils";
import { showError } from "@/lib/toast";

function formatSnapshotLabel(snapshot: InfraEvidenceSnapshotSummary): string {
  const captured = snapshot.capturedUtc != null ? new Date(snapshot.capturedUtc).toLocaleString() : "unknown time";
  const subscription = snapshot.subscriptionName ?? snapshot.subscriptionId ?? "subscription";

  return `${subscription} · ${captured} · ${snapshot.resourceCount} resources`;
}

function resolveDefaultFallbackKey(
  artifacts: readonly InfraEvidenceMermaidFallbackArtifactSummary[],
): string {
  const executive = artifacts.find((artifact) => artifact.key === "executive");

  if (executive != null) {
    return executive.key;
  }

  const succeeded = artifacts.find((artifact) => artifact.status === "Succeeded");

  if (succeeded != null) {
    return succeeded.key;
  }

  return artifacts[0]?.key ?? "";
}

function FallbackCard(props: {
  readonly artifact: InfraEvidenceMermaidFallbackArtifactSummary;
  readonly selected: boolean;
  readonly onSelect: () => void;
}): React.JSX.Element {
  const { artifact, selected, onSelect } = props;

  return (
    <button
      type="button"
      className={cn(
        "rounded-md border p-3 text-left transition-colors",
        selected
          ? "border-[var(--al-accent-border-focus)] bg-[var(--al-accent-surface-subtle)]"
          : "border-border bg-background hover:bg-muted/40",
      )}
      data-testid={`infra-diagrams-fallback-${artifact.key}`}
      onClick={onSelect}
    >
      <div className="font-medium">{artifact.label}</div>
      <div className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {artifact.nodeCount} nodes · {artifact.edgeCount} edges · {artifact.status}
      </div>
    </button>
  );
}

export function DiagramsWorkbenchClient() {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const urlSnapshotId = parseInfraDiagramsSnapshotIdFromSearch(searchParams.get(INFRA_DIAGRAMS_SNAPSHOT_ID_PARAM));
  const urlCloudResourceId = parseInfraDiagramsCloudResourceIdFromSearch(
    searchParams.get(INFRA_DIAGRAMS_CLOUD_RESOURCE_ID_PARAM),
  );
  const urlMermaidMode = parseInfraDiagramsMermaidModeFromSearch(searchParams.get(INFRA_DIAGRAMS_MERMAID_MODE_PARAM));
  const urlMermaidView = parseInfraDiagramsMermaidViewFromSearch(searchParams.get(INFRA_DIAGRAMS_MERMAID_VIEW_PARAM));
  const urlSeedNodeId = parseInfraDiagramsSeedNodeIdFromSearch(searchParams.get(INFRA_DIAGRAMS_SEED_NODE_ID_PARAM));

  const [snapshots, setSnapshots] = useState<InfraEvidenceSnapshotSummary[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(urlSnapshotId);
  const [selectedMode, setSelectedMode] = useState<string>(urlMermaidMode);
  const [selectedViewKey, setSelectedViewKey] = useState<string>(urlMermaidView);
  const [seedNodeId, setSeedNodeId] = useState<string>(urlSeedNodeId);
  const [modePreviews, setModePreviews] = useState<InfraEvidenceMermaidModePreview[]>([]);
  const [renderResult, setRenderResult] = useState<InfraEvidenceMermaidRenderResponse | null>(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingRender, setLoadingRender] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [browserRenderBlocked, setBrowserRenderBlocked] = useState(false);

  const { data: brandingPresentation } = useTenantBrandingPresentationQuery({ context: "MermaidDiagram" });
  const tenantBrandActive = brandingPresentation?.usesTenantVisualBrand === true;

  const syncUrl = useCallback(
    (patch: {
      snapshotId?: string;
      mermaidMode?: string;
      mermaidView?: string;
      seedNodeId?: string;
    }) => {
      router.replace(infraDiagramsFilterHrefFromSearch(searchParams.toString(), patch, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const activeModePreview = useMemo(
    () => modePreviews.find((preview) => preview.mode === selectedMode) ?? null,
    [modePreviews, selectedMode],
  );

  const fallbackArtifacts = useMemo(
    () => renderResult?.fallbackArtifacts ?? activeModePreview?.fallbackArtifacts ?? [],
    [activeModePreview?.fallbackArtifacts, renderResult?.fallbackArtifacts],
  );

  const showFallbackCards = useMemo(() => {
    const status = renderResult?.status ?? activeModePreview?.status ?? "";

    return status === "Partitioned" && fallbackArtifacts.length > 0;
  }, [activeModePreview?.status, fallbackArtifacts, renderResult?.status]);

  const effectiveFallbackKey = useMemo(() => {
    if (!showFallbackCards) {
      return "";
    }

    if (selectedViewKey.length > 0) {
      return selectedViewKey;
    }

    return resolveDefaultFallbackKey(fallbackArtifacts);
  }, [fallbackArtifacts, selectedViewKey, showFallbackCards]);

  const auditScope = useMemo(() => parseInfraEvidenceWorkbenchAuditScopeFromSearch(searchParams), [searchParams]);
  const scopedSnapshotId = selectedSnapshotId.length > 0 ? selectedSnapshotId : urlSnapshotId;
  const workbenchHubScopePatch = useMemo(
    () => mergeWorkbenchHubScopePatch(scopedSnapshotId, auditScope),
    [auditScope, scopedSnapshotId],
  );

  const mermaidSource = renderResult?.mermaid ?? "";
  const metrics = renderResult?.metrics ?? null;
  const tooLargeForBrowser = exceedsInfraEvidenceMermaidClientGuard(metrics) || browserRenderBlocked;

  const renderQuery = useMemo(() => {
    if (effectiveFallbackKey.length > 0) {
      return { fallbackKey: effectiveFallbackKey };
    }

    return {
      mode: selectedMode,
      seedNodeId: selectedMode === "dependencyNeighborhood" ? seedNodeId : null,
    };
  }, [effectiveFallbackKey, seedNodeId, selectedMode]);

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

          const resolvedSnapshotId = urlSnapshotId.length > 0
            ? urlSnapshotId
            : items[0]?.snapshotId ?? "";

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
    if (selectedSnapshotId.length === 0) {
      setModePreviews([]);
      setRenderResult(null);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      setLoadingPreview(true);
      setLoadError(null);

      try {
        const preview = await fetchInfraEvidenceMermaidPreview(selectedSnapshotId);

        if (!cancelled) {
          setModePreviews(preview.modes ?? []);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(formatInfraEvidenceMermaidApiError(error));
          setModePreviews([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingPreview(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [selectedSnapshotId]);

  useEffect(() => {
    if (selectedSnapshotId.length === 0) {
      setRenderResult(null);
      return;
    }

    let cancelled = false;

    async function loadRender() {
      setLoadingRender(true);
      setLoadError(null);
      setBrowserRenderBlocked(false);

      try {
        const response = await fetchInfraEvidenceMermaidRender(selectedSnapshotId, renderQuery);

        if (!cancelled) {
          setRenderResult(response);

          if (
            response.status === "Partitioned"
            && selectedViewKey.length === 0
            && (response.fallbackArtifacts?.length ?? 0) > 0
          ) {
            const defaultKey = resolveDefaultFallbackKey(response.fallbackArtifacts);
            setSelectedViewKey(defaultKey);
            syncUrl({ mermaidView: defaultKey });
          }
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(formatInfraEvidenceMermaidApiError(error));
          setRenderResult(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingRender(false);
        }
      }
    }

    void loadRender();

    return () => {
      cancelled = true;
    };
  }, [renderQuery, selectedSnapshotId, selectedViewKey, syncUrl]);

  const handleSnapshotChange = useCallback(
    (nextSnapshotId: string) => {
      setSelectedSnapshotId(nextSnapshotId);
      setSelectedViewKey("");
      syncUrl({ snapshotId: nextSnapshotId, mermaidView: "" });
    },
    [syncUrl],
  );

  const handleModeChange = useCallback(
    (nextMode: string) => {
      setSelectedMode(nextMode);
      setSelectedViewKey("");
      syncUrl({ mermaidMode: nextMode, mermaidView: "" });
    },
    [syncUrl],
  );

  const handleFallbackSelect = useCallback(
    (fallbackKey: string) => {
      setSelectedViewKey(fallbackKey);
      syncUrl({ mermaidView: fallbackKey });
    },
    [syncUrl],
  );

  const handleSeedNodeApply = useCallback(() => {
    setSelectedMode("dependencyNeighborhood");
    syncUrl({ mermaidMode: "dependencyNeighborhood", seedNodeId });
  }, [seedNodeId, syncUrl]);

  const runPngExport = useCallback(async () => {
    if (selectedSnapshotId.length === 0) {
      return;
    }

    setExportBusy(true);

    try {
      const useFallback = effectiveFallbackKey.length > 0;
      await downloadInfraEvidenceMermaidPng(selectedSnapshotId, {
        mode: useFallback ? null : selectedMode,
        fallbackKey: useFallback ? effectiveFallbackKey : null,
        seedNodeId: selectedMode === "dependencyNeighborhood" ? seedNodeId : null,
      });
    } catch (error: unknown) {
      showError("Could not download diagram PNG", formatInfraEvidenceMermaidApiError(error));
    } finally {
      setExportBusy(false);
    }
  }, [effectiveFallbackKey, seedNodeId, selectedMode, selectedSnapshotId]);

  const runMermaidExport = useCallback(() => {
    if (mermaidSource.trim().length === 0) {
      return;
    }

    downloadBrowserTextFile(
      `infra-evidence-mermaid-${selectedSnapshotId}.mmd`,
      mermaidSource,
      "text/plain;charset=utf-8",
    );
  }, [mermaidSource, selectedSnapshotId]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6" data-testid="infra-diagrams-workbench">
      <LayerHeader pageKey="infrastructure-diagrams" />
      <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Render inventory diagrams from snapshot evidence with partitioned fallbacks when graphs exceed readability
        thresholds. Server PNG export applies tenant branding on the container only — never inside graph nodes.
      </p>

      {loadError != null ? (
        <StatusTag kind="needs-attention" label={loadError} />
      ) : null}

      {urlCloudResourceId.length > 0 ? (
        <section
          className="rounded border border-border bg-card p-4"
          data-testid="infra-diagrams-resource-scope-banner"
          aria-label="Diagrams workbench resource scope"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            Scoped to resource <span className="font-mono text-xs">{urlCloudResourceId}</span>.
          </p>
          <Link
            className="mt-2 inline-block text-sm text-al-link hover:underline"
            href={resourceHubFilterHrefFromSearch(urlCloudResourceId, "", {
              tab: "diagram",
              ...workbenchHubScopePatch,
            })}
            data-testid="infra-diagrams-open-primary-hub"
          >
            {formatResourceHubWorkbenchPrimaryHubLabel("diagram")}
          </Link>
          <Link
            className="mt-2 ml-4 inline-block text-sm text-al-link hover:underline"
            href={buildResourceHubDiagramReconcileWorkbenchHref(
              scopedSnapshotId,
              undefined,
              undefined,
              urlCloudResourceId,
            )}
            data-testid="infra-diagrams-open-diagram-reconcile"
          >
            Open diagram reconciliation
          </Link>
          <Link
            className="mt-2 ml-4 inline-block text-sm text-al-link hover:underline"
            href={buildResourceHubWorkbenchHref({
              cloudResourceId: urlCloudResourceId,
              tab: "terraform",
              ...workbenchHubScopePatch,
            })}
            data-testid="infra-diagrams-open-terraform-hub"
          >
            Open terraform mapping
          </Link>
          <Link
            className="mt-2 ml-4 inline-block text-sm text-al-link hover:underline"
            href={buildResourceHubWorkbenchHref({
              cloudResourceId: urlCloudResourceId,
              tab: "findings",
              ...workbenchHubScopePatch,
            })}
            data-testid="infra-diagrams-open-findings-hub"
          >
            Open findings
          </Link>
          <Link
            className="mt-2 ml-4 inline-block text-sm text-al-link hover:underline"
            href={buildResourceHubWorkbenchHref({
              cloudResourceId: urlCloudResourceId,
              tab: "remediation",
              ...workbenchHubScopePatch,
            })}
            data-testid="infra-diagrams-open-remediation-hub"
          >
            Open remediation
          </Link>
          <Link
            className="mt-2 ml-4 inline-block text-sm text-al-link hover:underline"
            href={buildResourceHubWorkbenchHref({
              cloudResourceId: urlCloudResourceId,
              tab: "drift",
              ...workbenchHubScopePatch,
            })}
            data-testid="infra-diagrams-open-drift-hub"
          >
            Open drift
          </Link>
          {auditScope != null ? (
            <Link
              className="mt-2 ml-4 inline-block text-sm text-al-link hover:underline"
              href={buildResourceHubWorkbenchHref({
                cloudResourceId: urlCloudResourceId,
                tab: "audit",
                ...workbenchHubScopePatch,
              })}
              data-testid="infra-diagrams-open-audit-hub"
            >
              Open audit lineage
            </Link>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2" aria-label="Snapshot and mode selection">
        <label className="flex flex-col gap-1">
          <span className={OPERATOR_TYPOGRAPHY.helper}>Snapshot</span>
          <select
            className="rounded border border-border bg-background px-3 py-2"
            data-testid="infra-diagrams-snapshot-picker"
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

        <label className="flex flex-col gap-1">
          <span className={OPERATOR_TYPOGRAPHY.helper}>Diagram mode</span>
          <select
            className="rounded border border-border bg-background px-3 py-2"
            data-testid="infra-diagrams-mode-picker"
            disabled={loadingPreview || selectedSnapshotId.length === 0}
            value={selectedMode}
            onChange={(event) => handleModeChange(event.target.value)}
          >
            {INFRA_DIAGRAMS_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {selectedMode === "dependencyNeighborhood" ? (
        <section className="flex flex-wrap items-end gap-3" aria-label="Dependency neighborhood drill-down">
          <label className="flex min-w-[16rem] flex-1 flex-col gap-1">
            <span className={OPERATOR_TYPOGRAPHY.helper}>Seed cloud resource id</span>
            <input
              className="rounded border border-border bg-background px-3 py-2"
              data-testid="infra-diagrams-seed-node-input"
              value={seedNodeId}
              onChange={(event) => setSeedNodeId(event.target.value)}
              placeholder="/subscriptions/.../resourceGroups/.../providers/..."
            />
          </label>
          <Button type="button" variant="outline" onClick={handleSeedNodeApply}>
            Focus neighborhood
          </Button>
        </section>
      ) : null}

      {loadingPreview || loadingRender ? (
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className={OPERATOR_TYPOGRAPHY.body}>Loading diagram…</span>
        </div>
      ) : null}

      {showFallbackCards ? (
        <section className="grid gap-3" aria-label="Partitioned diagram views" data-testid="infra-diagrams-fallback-cards">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Partitioned views</h2>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            This snapshot is too large for a single diagram. Pick a focused view — Executive is the default.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {fallbackArtifacts.map((artifact) => (
              <FallbackCard
                key={artifact.key}
                artifact={artifact}
                selected={artifact.key === effectiveFallbackKey}
                onSelect={() => handleFallbackSelect(artifact.key)}
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="flex flex-wrap items-center gap-2" aria-label="Diagram export actions">
        <Button
          type="button"
          variant="default"
          data-testid="infra-diagrams-export-png"
          disabled={exportBusy || selectedSnapshotId.length === 0}
          onClick={() => void runPngExport()}
        >
          {exportBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Export PNG{tenantBrandActive ? " (branded)" : ""}
        </Button>
        <Button
          type="button"
          variant="outline"
          data-testid="infra-diagrams-export-mmd"
          disabled={mermaidSource.trim().length === 0}
          onClick={runMermaidExport}
        >
          Export Mermaid (.mmd)
        </Button>
        {selectedSnapshotId.length > 0 ? (
          <Button asChild variant="outline" data-testid="infra-diagrams-open-ask">
            <Link
              href={buildInfrastructureAskHref({
                cloudResourceId: urlCloudResourceId.length > 0 ? urlCloudResourceId : undefined,
                snapshotId: selectedSnapshotId,
                seedNodeId:
                  selectedMode === "dependencyNeighborhood" && seedNodeId.length > 0
                    ? seedNodeId
                    : undefined,
              })}
            >
              Ask about this snapshot
            </Link>
          </Button>
        ) : null}
      </section>

      {tooLargeForBrowser ? (
        <div className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
          <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
            {INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE}
          </p>
          <div className="mt-3">
            <Button type="button" variant="outline" size="sm" onClick={() => void runPngExport()}>
              Download server PNG
            </Button>
          </div>
        </div>
      ) : mermaidSource.trim().length > 0 ? (
        <ArchitectureDiagramViewer
          mermaidSource={mermaidSource}
          textAlternative={`Inventory diagram for snapshot ${selectedSnapshotId} in ${selectedMode} mode.`}
          onRenderFailure={() => setBrowserRenderBlocked(true)}
          onRetry={() => setBrowserRenderBlocked(false)}
        />
      ) : renderResult?.status === "Failed" ? (
        <StatusTag kind="needs-attention" label="Diagram render failed for the selected mode." />
      ) : null}
    </div>
  );
}
