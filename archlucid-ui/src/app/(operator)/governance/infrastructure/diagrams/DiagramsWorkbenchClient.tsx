"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ArchitectureDiagramViewer } from "@/components/architecture/ArchitectureDiagramViewer";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
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
  INFRA_DIAGRAMS_RESOURCE_ID_DISCLOSURE_OPEN_PARAM,
  infraDiagramsResourceIdDisclosureHrefFromSearch,
  parseInfraDiagramsResourceIdDisclosureOpenFromSearch,
} from "@/lib/infra-evidence/infra-diagrams-resource-id-disclosure-url";
import {
  hasStaleInfraEvidenceAuditUrlParams,
  mergeInfrastructureAskAuditScope,
  mergeWorkbenchHubScopePatch,
  parseInfraEvidenceWorkbenchAuditScopeFromSearch,
} from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import { buildResourceHubDiagramReconcileWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-ask-citations";
import { buildInfraEvidenceAuditControlOptions, buildInfraEvidenceAuditControlScopePatch } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
import type { CloudResourceAuditLineageMatch } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { CopyScopedOperatorLinkButton } from "@/components/CopyScopedOperatorLinkButton";
import { InfraEvidenceSelectionAnnouncer } from "@/components/infra-evidence/InfraEvidenceSelectionAnnouncer";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";
import { useInfraEvidenceResourceHubAuditLineage } from "@/hooks/use-infra-evidence-resource-hub-audit-lineage";
import { useTenantBrandingPresentationQuery } from "@/hooks/use-tenant-branding-presentation-query";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_MODE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { downloadBrowserTextFile } from "@/lib/graph-view-model-export";
import { cn } from "@/lib/utils";
import { showError } from "@/lib/toast";

import { DiagramsBreadcrumb } from "./DiagramsBreadcrumb";
import { DiagramsClaimOrientationStrip } from "./DiagramsClaimOrientationStrip";

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

const cnField =
  "rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

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
          ? "border-neutral-300 bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900"
          : "border-neutral-200 bg-white hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-950 dark:hover:bg-neutral-900",
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
  const buyerPolishedShell = useProductionEvalChrome();
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
  const diagramsResourceIdOpenParam = searchParams.get(INFRA_DIAGRAMS_RESOURCE_ID_DISCLOSURE_OPEN_PARAM);
  const [diagramsResourceIdOpen, setDiagramsResourceIdOpenState] = useState(() =>
    parseInfraDiagramsResourceIdDisclosureOpenFromSearch(diagramsResourceIdOpenParam),
  );

  const syncDiagramsResourceIdOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(infraDiagramsResourceIdDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setDiagramsResourceIdOpen = useCallback(
    (open: boolean) => {
      setDiagramsResourceIdOpenState(open);
      syncDiagramsResourceIdOpenToUrl(open);
    },
    [syncDiagramsResourceIdOpenToUrl],
  );

  useEffect(() => {
    setDiagramsResourceIdOpenState(parseInfraDiagramsResourceIdDisclosureOpenFromSearch(diagramsResourceIdOpenParam));
  }, [diagramsResourceIdOpenParam]);

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
  const hasStaleAuditUrlParams = useMemo(
    () => hasStaleInfraEvidenceAuditUrlParams(searchParams),
    [searchParams],
  );
  const scopedSnapshotId = selectedSnapshotId.length > 0 ? selectedSnapshotId : urlSnapshotId;
  const workbenchHubScopePatch = useMemo(
    () => mergeWorkbenchHubScopePatch(scopedSnapshotId, auditScope),
    [auditScope, scopedSnapshotId],
  );
  const { hub: resourceHub } = useInfraEvidenceResourceHubAuditLineage(
    urlCloudResourceId,
    scopedSnapshotId,
  );
  const auditControlOptions = useMemo(
    () => buildInfraEvidenceAuditControlOptions(resourceHub),
    [resourceHub],
  );
  const onAuditControlChange = useCallback((match: CloudResourceAuditLineageMatch) => {
    router.replace(infraDiagramsFilterHrefFromSearch(searchParams.toString(), buildInfraEvidenceAuditControlScopePatch(match), pathname), {
      scroll: false,
    });
  }, [pathname, router, searchParams]);
  const deepLinkedSnapshotMissing = useMemo(() => {
    if (urlSnapshotId.length === 0 || loadingSnapshots || snapshots.length === 0) {
      return false;
    }

    return !snapshots.some((snapshot) => snapshot.snapshotId === urlSnapshotId);
  }, [loadingSnapshots, snapshots, urlSnapshotId]);
  const selectionAnnouncement = useMemo(() => {
    if (selectedSnapshotId.length === 0) {
      return null;
    }

    return `Diagram snapshot ${selectedSnapshotId} selected. Mode ${selectedMode}.`;
  }, [selectedMode, selectedSnapshotId]);

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
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-diagrams-workbench"
    >
      {buyerPolishedShell ? (
        <a
          href={`#${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <OperatorPageHeader
        navHref={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PATH}
        title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD}
        claimDiscipline={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId="infra-diagrams-claim-discipline"
        titleTestId="infra-diagrams-page-title"
        breadcrumb={buyerPolishedShell ? <DiagramsBreadcrumb /> : undefined}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
            {!buyerPolishedShell ? (
              <CopyScopedOperatorLinkButton testId="infra-diagrams-copy-scoped-link" />
            ) : null}
          </div>
        }
      />

      {!buyerPolishedShell ? <LayerHeader pageKey="infrastructure-diagrams" /> : null}

      <main
        id={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID : undefined}
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col gap-4",
          buyerPolishedShell ? "scroll-mt-24" : undefined,
        )}
        data-testid="infra-diagrams-primary-content"
      >
      {buyerPolishedShell ? (
        <div className="flex justify-end">
          <CopyScopedOperatorLinkButton testId="infra-diagrams-copy-scoped-link" />
        </div>
      ) : null}

      {!buyerPolishedShell ? (
        <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Render inventory diagrams from snapshot evidence with partitioned fallbacks when graphs exceed readability
          thresholds. Server PNG export applies tenant branding on the container only — never inside graph nodes.
        </p>
      ) : null}
      <InfraEvidenceSelectionAnnouncer message={selectionAnnouncement} testId="infra-diagrams-selection-announcer" />

      {deepLinkedSnapshotMissing ? (
        <p
          className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="infra-diagrams-snapshot-deep-link-missing"
          role="status"
        >
          The linked snapshot is not available in the diagrams workbench scope.
        </p>
      ) : null}

      {loadError != null ? (
        buyerPolishedShell ? (
          <EnterpriseCompactEmptyState
            role="alert"
            title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_LOAD_ERROR_TITLE}
            description={loadError}
            testId="infra-diagrams-load-error-panel"
            footer={
              <Button type="button" size="sm" variant="primary" onClick={() => window.location.reload()}>
                Reload page
              </Button>
            }
          />
        ) : (
          <StatusTag kind="needs-attention" label={loadError} />
        )
      ) : null}

      {urlCloudResourceId.length > 0 ? (
        <section
          className={cnCard}
          data-testid="infra-diagrams-resource-scope-banner"
          aria-label="Diagrams workbench resource scope"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SCOPE_LABEL}
            {!buyerPolishedShell ? (
              <> <span className="font-mono text-xs">{urlCloudResourceId}</span>.</>
            ) : (
              "."
            )}
          </p>
          {buyerPolishedShell ? (
            <CollapsibleSection
              title="Resource id"
              sectionTestId="infra-diagrams-resource-id-disclosure"
              summaryLine="Cloud resource UUID from the scoped link"
              open={diagramsResourceIdOpen}
              onToggle={setDiagramsResourceIdOpen}
            >
              <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {urlCloudResourceId}
              </p>
            </CollapsibleSection>
          ) : null}
          {auditScope != null || resourceHub?.auditLineageLink.available === false || hasStaleAuditUrlParams ? (
            <WorkbenchAuditLineageStatus
              auditScope={auditScope}
              hub={resourceHub}
              cloudResourceId={urlCloudResourceId}
              currentSearch={searchParams.toString()}
              snapshotId={scopedSnapshotId}
              activeTab="diagram"
              hasStaleAuditUrlParams={hasStaleAuditUrlParams}
              auditControlOptions={auditControlOptions}
              onAuditControlChange={onAuditControlChange}
              provenanceTestId="infra-diagrams-audit-provenance"
              unavailableTestId="infra-diagrams-audit-unavailable"
            />
          ) : null}
          <WorkbenchHubScopeLinks
            cloudResourceId={urlCloudResourceId}
            primaryTab="diagram"
            primaryHref={resourceHubFilterHrefFromSearch(urlCloudResourceId, "", {
              tab: "diagram",
              ...workbenchHubScopePatch,
            })}
            primaryTestId="infra-diagrams-open-primary-hub"
            siblingTestIdPrefix="infra-diagrams"
            scopePatch={workbenchHubScopePatch}
            siblingTabs={["terraform", "findings", "remediation", "drift"]}
            includeAuditTab={auditScope != null}
            extraLinks={[
              {
                testId: "infra-diagrams-open-diagram-reconcile",
                href: buildResourceHubDiagramReconcileWorkbenchHref(
                  scopedSnapshotId,
                  undefined,
                  undefined,
                  urlCloudResourceId,
                  mergeInfrastructureAskAuditScope(auditScope),
                ),
                label: "Open diagram reconciliation",
              },
            ]}
          />
        </section>
      ) : null}

      <section className={cn("grid gap-4 md:grid-cols-2", cnCard)} aria-label="Snapshot and mode selection">
        {buyerPolishedShell ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="infra-diagrams-snapshot-picker">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_LABEL}</Label>
              <select
                id="infra-diagrams-snapshot-picker"
                className={cnField}
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
            </div>
            <div className="grid gap-2">
              <Label htmlFor="infra-diagrams-mode-picker">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_MODE_LABEL}</Label>
              <select
                id="infra-diagrams-mode-picker"
                className={cnField}
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
            </div>
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>Snapshot</span>
              <select
                className={cnField}
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
                className={cnField}
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
          </>
        )}
      </section>

      {selectedMode === "dependencyNeighborhood" ? (
        <section className={cn("flex flex-wrap items-end gap-3", cnCard)} aria-label="Dependency neighborhood drill-down">
          {buyerPolishedShell ? (
            <>
              <div className="grid min-w-[16rem] flex-1 gap-2">
                <Label htmlFor="infra-diagrams-seed-node-input">
                  {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_LABEL}
                </Label>
                <Input
                  id="infra-diagrams-seed-node-input"
                  data-testid="infra-diagrams-seed-node-input"
                  value={seedNodeId}
                  onChange={(event) => setSeedNodeId(event.target.value)}
                  placeholder="/subscriptions/.../resourceGroups/.../providers/..."
                />
              </div>
              <Button type="button" variant="outline" onClick={handleSeedNodeApply}>
                Focus neighborhood
              </Button>
            </>
          ) : (
            <>
              <label className="flex min-w-[16rem] flex-1 flex-col gap-1">
                <span className={OPERATOR_TYPOGRAPHY.helper}>Seed cloud resource id</span>
                <input
                  className={cnField}
                  data-testid="infra-diagrams-seed-node-input"
                  value={seedNodeId}
                  onChange={(event) => setSeedNodeId(event.target.value)}
                  placeholder="/subscriptions/.../resourceGroups/.../providers/..."
                />
              </label>
              <Button type="button" variant="outline" onClick={handleSeedNodeApply}>
                Focus neighborhood
              </Button>
            </>
          )}
        </section>
      ) : null}

      {loadingPreview || loadingRender ? (
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className={OPERATOR_TYPOGRAPHY.body}>Loading diagram…</span>
        </div>
      ) : null}

      {showFallbackCards ? (
        <section className={cn("grid gap-3", cnCard)} aria-label="Partitioned diagram views" data-testid="infra-diagrams-fallback-cards">
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

      <section className={cn("flex flex-wrap items-center gap-2", cnCard)} aria-label="Diagram export actions">
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
                hubTab: "diagram",
                ...mergeInfrastructureAskAuditScope(auditScope),
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

        {buyerPolishedShell ? <DiagramsClaimOrientationStrip /> : null}
      </main>
    </OperatorPageContainer>
  );
}
