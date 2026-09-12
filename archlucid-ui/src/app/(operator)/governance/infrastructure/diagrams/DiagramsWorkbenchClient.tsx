"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ArchitectureDiagramViewer } from "@/components/architecture/ArchitectureDiagramViewer";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InfraEvidenceDiagramOutline } from "@/components/infra-evidence/InfraEvidenceDiagramOutline";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  downloadInfraEvidenceMermaidPng,
  fetchInfraEvidenceMermaidPreview,
  fetchInfraEvidenceMermaidRender,
  formatInfraEvidenceMermaidApiError,
  type InfraEvidenceMermaidRenderQuery,
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
import { fetchInfraEvidenceSnapshots } from "@/lib/infra-evidence/infra-evidence-drift-api";
import { formatInfraEvidenceDiagramsApiError } from "@/lib/infra-evidence/infra-evidence-diagrams-api";
import { formatInfraEvidenceMermaidPngExportError } from "@/lib/infra-evidence/infra-evidence-mermaid-png-export-error";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { formatInfraEvidenceDiagramsSnapshotPickerLabel } from "@/lib/infra-evidence/format-infra-evidence-diagrams-snapshot-label";
import { resolveInfraEvidenceMermaidRenderStatusPresentation } from "@/lib/infra-evidence/infra-evidence-mermaid-render-status-presentation";
import { isInfraEvidenceMermaidDiagramEmpty } from "@/lib/infra-evidence/infra-evidence-mermaid-empty-content";
import {
  parseInfraEvidenceMermaidOutline,
  resolveInfraEvidenceOutlineSeedNodeId,
  type InfraEvidenceMermaidOutlineNode,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import {
  dependencyNeighborhoodRequiresAppliedSeed,
  resolveDependencyNeighborhoodSeedBlockedReason,
  type DependencyNeighborhoodSeedBlockedReason,
} from "@/lib/infra-evidence/infra-evidence-diagrams-dependency-seed";
import {
  resolveInfraDiagramsDefaultFallbackKey,
  resolveInfraDiagramsEffectiveFallbackKey,
  resolveInfraDiagramsFallbackArtifacts,
  resolveInfraDiagramsResourceGroupFallbackArtifacts,
  resolveInfraDiagramsThematicFallbackArtifacts,
  shouldPaintInfraDiagramsMermaidSource,
  shouldShowInfraDiagramsPartitionedViews,
} from "@/lib/infra-evidence/infra-evidence-diagrams-partitioned-view";
import {
  buildInfraDiagramsResourceGroupModeToken,
  isInfraDiagramsResourceGroupMode,
  isInfraEvidenceResourceGroupMapMermaid,
  parseInfraDiagramsResourceGroupName,
} from "@/lib/infra-evidence/infra-evidence-diagrams-resource-group-view";
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
import { OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_BROWSER_FALLBACK_NOTE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_ERROR_RECOVERY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_MODE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_DIALOG_DISMISS,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_FOCUS_ACTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_PROMPT_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_MAP_CAPTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_PROMPT_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_PROMPT_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PARTITIONED_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_PROMPT_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_REQUIRED_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_REQUIRED_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_HELPER,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_PASTE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_LABEL,
  formatGovernanceInfrastructureInlineActionError,
} from "@/lib/governance/governance-infrastructure-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { downloadBrowserTextFile } from "@/lib/graph-view-model-export";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";
import { cn } from "@/lib/utils";

import { DiagramsBreadcrumb } from "./DiagramsBreadcrumb";
import { DiagramsClaimOrientationStrip } from "./DiagramsClaimOrientationStrip";

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

const cnField =
  "rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

function resolveInfraDiagramsModeLabel(mode: string, fallbackKey: string, resourceGroupName: string): string {
  if (isInfraDiagramsResourceGroupMode(mode)) {
    if (resourceGroupName.length > 0) {
      return `Resource group · ${resourceGroupName}`;
    }

    return "Pick a Resource Group";
  }

  if (fallbackKey.length > 0) {
    return `Partitioned view · ${fallbackKey}`;
  }

  const option = INFRA_DIAGRAMS_MODE_OPTIONS.find((entry) => entry.value === mode);

  return option?.label ?? mode;
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
  const [seedNodeDraft, setSeedNodeDraft] = useState<string>(urlSeedNodeId);
  const [appliedSeedNodeId, setAppliedSeedNodeId] = useState<string>(() =>
    urlMermaidMode === "dependencyNeighborhood" ? urlSeedNodeId : "",
  );
  const [seedCandidateNodes, setSeedCandidateNodes] = useState<InfraEvidenceMermaidOutlineNode[]>([]);
  const [dependencySeedBlockedDialog, setDependencySeedBlockedDialog] =
    useState<DependencyNeighborhoodSeedBlockedReason | null>(null);
  const [modePreviews, setModePreviews] = useState<InfraEvidenceMermaidModePreview[]>([]);
  const [renderResult, setRenderResult] = useState<InfraEvidenceMermaidRenderResponse | null>(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingRender, setLoadingRender] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [pngExportError, setPngExportError] = useState<string | null>(null);
  const [pngBrowserFallbackNote, setPngBrowserFallbackNote] = useState<string | null>(null);
  const [exportableSvgMarkup, setExportableSvgMarkup] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadGeneration, setLoadGeneration] = useState(0);

  const { data: brandingPresentation } = useTenantBrandingPresentationQuery({ context: "MermaidDiagram" });
  const tenantBrandActive = brandingPresentation?.usesTenantVisualBrand === true;
  const dark = useDocumentDarkMode();

  useEffect(() => {
    setSeedNodeDraft(urlSeedNodeId);

    if (urlMermaidMode === "dependencyNeighborhood") {
      setAppliedSeedNodeId(urlSeedNodeId);
    }
  }, [urlMermaidMode, urlSeedNodeId]);

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

  const syncUrlRef = useRef(syncUrl);

  syncUrlRef.current = syncUrl;

  const activeModePreview = useMemo(
    () => modePreviews.find((preview) => preview.mode === selectedMode) ?? null,
    [modePreviews, selectedMode],
  );

  const fallbackArtifacts = useMemo(
    () => resolveInfraDiagramsFallbackArtifacts(renderResult?.fallbackArtifacts, activeModePreview?.fallbackArtifacts),
    [activeModePreview?.fallbackArtifacts, renderResult?.fallbackArtifacts],
  );
  const thematicFallbackArtifacts = useMemo(
    () => resolveInfraDiagramsThematicFallbackArtifacts(fallbackArtifacts),
    [fallbackArtifacts],
  );
  const resourceGroupFallbackArtifacts = useMemo(
    () => resolveInfraDiagramsResourceGroupFallbackArtifacts(fallbackArtifacts),
    [fallbackArtifacts],
  );
  const selectedResourceGroupName = useMemo(
    () => (isInfraDiagramsResourceGroupMode(selectedMode) ? parseInfraDiagramsResourceGroupName(selectedViewKey) : ""),
    [selectedMode, selectedViewKey],
  );
  const resourceGroupPickerAwaitingSelection =
    isInfraDiagramsResourceGroupMode(selectedMode) && selectedResourceGroupName.length === 0;

  const showFallbackCards = useMemo(
    () =>
      selectedMode !== "dependencyNeighborhood"
      && !isInfraDiagramsResourceGroupMode(selectedMode)
      && shouldShowInfraDiagramsPartitionedViews({
        selectedViewKey,
        previewStatus: activeModePreview?.status ?? "",
        renderStatus: renderResult?.status ?? "",
        fallbackArtifactCount: thematicFallbackArtifacts.length,
      }),
    [activeModePreview?.status, renderResult?.status, selectedMode, selectedViewKey, thematicFallbackArtifacts.length],
  );

  const showResourceGroupCards =
    isInfraDiagramsResourceGroupMode(selectedMode) && resourceGroupFallbackArtifacts.length > 0;

  const effectiveFallbackKey = useMemo(
    () =>
      resolveInfraDiagramsEffectiveFallbackKey({
        showPartitionedViews: showFallbackCards,
        selectedViewKey,
        fallbackArtifacts: thematicFallbackArtifacts,
      }),
    [showFallbackCards, selectedViewKey, thematicFallbackArtifacts],
  );

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

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.snapshotId === selectedSnapshotId) ?? null,
    [selectedSnapshotId, snapshots],
  );

  const selectedSnapshotDisplayLabel = useMemo(() => {
    if (selectedSnapshot != null) {
      return formatInfraEvidenceDiagramsSnapshotPickerLabel(selectedSnapshot);
    }

    if (selectedSnapshotId.length > 0) {
      return selectedSnapshotId;
    }

    return null;
  }, [selectedSnapshot, selectedSnapshotId]);

  const selectedModeLabel = useMemo(
    () => resolveInfraDiagramsModeLabel(selectedMode, effectiveFallbackKey, selectedResourceGroupName),
    [effectiveFallbackKey, selectedMode, selectedResourceGroupName],
  );

  const selectionAnnouncement = useMemo(() => {
    if (deepLinkedSnapshotMissing) {
      return "Linked snapshot is not available. Pick a snapshot from the list.";
    }

    if (selectedSnapshotId.length === 0) {
      return null;
    }

    const status = renderResult?.status ?? activeModePreview?.status ?? "loading";
    const metrics = renderResult?.metrics;
    const metricLine =
      metrics != null
        ? `${metrics.nodeCount} nodes, ${metrics.edgeCount} edges, ${metrics.subgraphCount} subgraphs.`
        : "";

    return `Diagram snapshot ${selectedSnapshotDisplayLabel} selected. Mode ${selectedModeLabel}. Render status ${status}.${metricLine.length > 0 ? ` ${metricLine}` : ""}`;
  }, [
    activeModePreview?.status,
    deepLinkedSnapshotMissing,
    renderResult?.metrics,
    renderResult?.status,
    selectedModeLabel,
    selectedSnapshotDisplayLabel,
    selectedSnapshotId,
  ]);

  const mermaidSource = renderResult?.mermaid ?? "";
  const metrics = renderResult?.metrics ?? null;
  const dependencyNeighborhoodAwaitingSeed = dependencyNeighborhoodRequiresAppliedSeed(
    selectedMode,
    appliedSeedNodeId,
  );
  const paintMermaidSource = shouldPaintInfraDiagramsMermaidSource({
    mermaidSource,
    effectiveFallbackKey,
    renderFallbackKey: renderResult?.fallbackKey,
  });
  const tooLargeForBrowser =
    exceedsInfraEvidenceMermaidClientGuard(metrics)
    && !paintMermaidSource
    && !showFallbackCards;
  const isResourceGroupMapDiagram = isInfraEvidenceResourceGroupMapMermaid(mermaidSource);
  const diagramContentEmpty = isInfraEvidenceMermaidDiagramEmpty(mermaidSource, metrics?.nodeCount);
  const renderInFlight = loadingPreview || loadingRender;
  const exportsDisabled =
    exportBusy
    || renderInFlight
    || selectedSnapshotId.length === 0
    || deepLinkedSnapshotMissing
    || dependencyNeighborhoodAwaitingSeed
    || resourceGroupPickerAwaitingSelection;
  const mermaidExportDisabled = exportsDisabled || !paintMermaidSource;

  const renderStatusPresentation = useMemo(() => {
    const status = renderResult?.status ?? activeModePreview?.status ?? "";

    if (status.length === 0) {
      return null;
    }

    return resolveInfraEvidenceMermaidRenderStatusPresentation({
      status,
      mermaidEmpty: diagramContentEmpty && status === "Succeeded",
    });
  }, [activeModePreview?.status, diagramContentEmpty, mermaidSource, renderResult?.status]);

  const mermaidOutline = useMemo(() => {
    if (mermaidSource.trim().length === 0) {
      return null;
    }

    return parseInfraEvidenceMermaidOutline(mermaidSource);
  }, [mermaidSource]);

  useEffect(() => {
    setSeedCandidateNodes([]);
  }, [selectedSnapshotId]);

  useEffect(() => {
    if (mermaidOutline == null || mermaidOutline.nodes.length === 0) {
      return;
    }

    setSeedCandidateNodes([...mermaidOutline.nodes]);
  }, [mermaidOutline]);

  const diagramScopeContextLine = useMemo(() => {
    const parts: string[] = [];

    if (selectedSnapshotDisplayLabel != null) {
      parts.push(`Snapshot ${selectedSnapshotDisplayLabel}`);
    }

    parts.push(selectedModeLabel);

    if (urlCloudResourceId.length > 0) {
      parts.push(`resource ${urlCloudResourceId}`);
    }

    return parts.join(" · ");
  }, [selectedModeLabel, selectedSnapshotDisplayLabel, urlCloudResourceId]);

  const renderQuery = useMemo((): InfraEvidenceMermaidRenderQuery | null => {
    if (isInfraDiagramsResourceGroupMode(selectedMode)) {
      if (selectedResourceGroupName.length === 0) {
        return { mode: "resourceGroup" };
      }

      return { mode: buildInfraDiagramsResourceGroupModeToken(selectedResourceGroupName) };
    }

    if (effectiveFallbackKey.length > 0) {
      return { fallbackKey: effectiveFallbackKey };
    }

    if (selectedMode === "dependencyNeighborhood") {
      const trimmedSeed = appliedSeedNodeId.trim();

      if (trimmedSeed.length === 0) {
        return null;
      }

      return {
        mode: selectedMode,
        seedNodeId: trimmedSeed,
      };
    }

    return {
      mode: selectedMode,
      seedNodeId: null,
    };
  }, [appliedSeedNodeId, effectiveFallbackKey, selectedMode, selectedResourceGroupName]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setLoadGeneration((current) => current + 1);
  }, []);

  const handleRenderFailure = useCallback(() => {
    // ArchitectureDiagramViewer surfaces retry; client render failures are not oversized-graph guards.
  }, []);

  const handleRenderRetry = useCallback(() => {
    // Retry is owned by ArchitectureDiagramViewer.
  }, []);

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

          const urlSnapshotAvailable =
            urlSnapshotId.length > 0 && items.some((snapshot) => snapshot.snapshotId === urlSnapshotId);

          const resolvedSnapshotId =
            urlSnapshotId.length > 0
              ? urlSnapshotAvailable
                ? urlSnapshotId
                : ""
              : items[0]?.snapshotId ?? "";

          setSelectedSnapshotId(resolvedSnapshotId);

          if (urlSnapshotId.length === 0 && resolvedSnapshotId.length > 0) {
            syncUrlRef.current({ snapshotId: resolvedSnapshotId });
          }
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(formatInfraEvidenceDiagramsApiError(error));
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
  }, [loadGeneration, urlSnapshotId]);

  useEffect(() => {
    if (selectedSnapshotId.length === 0 || deepLinkedSnapshotMissing) {
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
  }, [deepLinkedSnapshotMissing, loadGeneration, selectedSnapshotId]);

  useEffect(() => {
    if (selectedSnapshotId.length === 0 || deepLinkedSnapshotMissing) {
      setRenderResult(null);
      return;
    }

    if (renderQuery === null) {
      setRenderResult(null);
      setLoadError(null);
      setLoadingRender(false);
      return;
    }

    const activeRenderQuery = renderQuery;
    let cancelled = false;

    async function loadRender() {
      setLoadingRender(true);
      setLoadError(null);

      try {
        const response = await fetchInfraEvidenceMermaidRender(selectedSnapshotId, activeRenderQuery);

        if (!cancelled) {
          setRenderResult(response);

          if (
            response.status === "Partitioned"
            && selectedViewKey.length === 0
            && (response.fallbackArtifacts?.length ?? 0) > 0
          ) {
            const defaultKey = resolveInfraDiagramsDefaultFallbackKey(response.fallbackArtifacts);
            setSelectedViewKey(defaultKey);
            syncUrlRef.current({ mermaidView: defaultKey });
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

    return (): void => {
      cancelled = true;
    };
  }, [deepLinkedSnapshotMissing, loadGeneration, renderQuery, selectedSnapshotId, selectedViewKey.length]);

  useEffect(() => {
    if (selectedMode !== "dependencyNeighborhood") {
      return;
    }

    if (loadingRender || dependencyNeighborhoodAwaitingSeed) {
      return;
    }

    const blockedReason = resolveDependencyNeighborhoodSeedBlockedReason({
      appliedSeedNodeId,
      loadError,
      renderResult,
    });

    if (blockedReason != null) {
      setDependencySeedBlockedDialog(blockedReason);
    }
  }, [
    appliedSeedNodeId,
    dependencyNeighborhoodAwaitingSeed,
    loadError,
    loadingRender,
    renderResult,
    selectedMode,
  ]);

  const handleSnapshotChange = useCallback(
    (nextSnapshotId: string) => {
      setSelectedSnapshotId(nextSnapshotId);
      setSelectedViewKey("");
      setRenderResult(null);
      syncUrl({ snapshotId: nextSnapshotId, mermaidView: "" });
    },
    [syncUrl],
  );

  const handleModeChange = useCallback(
    (nextMode: string) => {
      setSelectedMode(nextMode);
      setSelectedViewKey("");
      setRenderResult(null);
      setDependencySeedBlockedDialog(null);

      if (nextMode !== "dependencyNeighborhood") {
        setAppliedSeedNodeId("");
      } else if (urlSeedNodeId.trim().length === 0) {
        setAppliedSeedNodeId("");
      }

      syncUrl({ mermaidMode: nextMode, mermaidView: "" });
    },
    [syncUrl, urlSeedNodeId],
  );

  const handleFallbackSelect = useCallback(
    (fallbackKey: string) => {
      if (isInfraDiagramsResourceGroupMode(selectedMode)) {
        const resourceGroupName = parseInfraDiagramsResourceGroupName(fallbackKey);
        setSelectedViewKey(resourceGroupName);
        syncUrl({ mermaidView: resourceGroupName });
        return;
      }

      setSelectedViewKey(fallbackKey);
      syncUrl({ mermaidView: fallbackKey });
    },
    [selectedMode, syncUrl],
  );

  const applySeedNode = useCallback(
    (rawSeed: string) => {
      const trimmedSeed = rawSeed.trim();

      if (trimmedSeed.length === 0) {
        setDependencySeedBlockedDialog({
          title: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_REQUIRED_TITLE,
          message: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_REQUIRED_BODY,
        });
        return;
      }

      setSeedNodeDraft(trimmedSeed);
      setAppliedSeedNodeId(trimmedSeed);
      setDependencySeedBlockedDialog(null);
      setSelectedMode("dependencyNeighborhood");
      setSelectedViewKey("");
      syncUrl({ mermaidMode: "dependencyNeighborhood", mermaidView: "", seedNodeId: trimmedSeed });
    },
    [syncUrl],
  );

  const handleSeedNodeApply = useCallback(() => {
    applySeedNode(seedNodeDraft);
  }, [applySeedNode, seedNodeDraft]);

  const handleOutlineFocusNeighborhood = useCallback(
    (node: InfraEvidenceMermaidOutlineNode) => {
      applySeedNode(resolveInfraEvidenceOutlineSeedNodeId(node));
    },
    [applySeedNode],
  );

  const runPngExport = useCallback(async () => {
    if (selectedSnapshotId.length === 0 || exportsDisabled) {
      return;
    }

    setExportBusy(true);
    setPngExportError(null);
    setPngBrowserFallbackNote(null);

    try {
      const useFallback = effectiveFallbackKey.length > 0;
      const query = {
        mode: useFallback ? null : selectedMode,
        fallbackKey: useFallback ? effectiveFallbackKey : null,
        seedNodeId:
          selectedMode === "dependencyNeighborhood" && appliedSeedNodeId.trim().length > 0
            ? appliedSeedNodeId.trim()
            : null,
      };

      if (tooLargeForBrowser) {
        await downloadInfraEvidenceMermaidPng(selectedSnapshotId, query);
        return;
      }

      const result = await downloadInfraEvidenceMermaidPng(selectedSnapshotId, query, {
        fallbackMermaidSource: mermaidSource,
        fallbackSvgMarkup: exportableSvgMarkup,
        dark,
      });

      if (result.usedBrowserFallback) {
        setPngBrowserFallbackNote(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_BROWSER_FALLBACK_NOTE);
      }
    } catch (error: unknown) {
      const pngExportDetail =
        formatInfraEvidenceMermaidPngExportError(error) ?? formatInfraEvidenceMermaidApiError(error);

      setPngExportError(
        formatGovernanceInfrastructureInlineActionError(
          GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_ERROR_TITLE,
          pngExportDetail,
        ),
      );
    } finally {
      setExportBusy(false);
    }
  }, [
    dark,
    effectiveFallbackKey,
    exportsDisabled,
    exportableSvgMarkup,
    mermaidSource,
    appliedSeedNodeId,
    selectedMode,
    selectedSnapshotId,
    tooLargeForBrowser,
  ]);

  const runMermaidExport = useCallback(() => {
    if (mermaidExportDisabled) {
      return;
    }

    const exportModeToken = effectiveFallbackKey.length > 0 ? effectiveFallbackKey : selectedMode;

    downloadBrowserTextFile(
      `infra-evidence-mermaid-${selectedSnapshotId}-${exportModeToken}.mmd`,
      mermaidSource,
      "text/plain;charset=utf-8",
    );
  }, [effectiveFallbackKey, mermaidExportDisabled, mermaidSource, selectedMode, selectedSnapshotId]);

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-diagrams-workbench"
    >
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={pathname}
        title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PAGE_LEAD}
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

      <main
        id={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID}
        className={cn("flex w-full flex-col gap-4 scroll-mt-24")}
        data-testid="infra-diagrams-primary-content"
      >
      {buyerPolishedShell ? (
        <div className="flex justify-end">
          <CopyScopedOperatorLinkButton testId="infra-diagrams-copy-scoped-link" />
        </div>
      ) : null}

      <InfraEvidenceSelectionAnnouncer message={selectionAnnouncement} testId="infra-diagrams-selection-announcer" />

      {deepLinkedSnapshotMissing ? (
        <StatusTag
          kind="needs-attention"
          label="Linked snapshot is not available in the diagrams workbench scope. Pick a snapshot below."
          data-testid="infra-diagrams-snapshot-deep-link-missing"
        />
      ) : null}

      {loadError != null
      && !(
        selectedMode === "dependencyNeighborhood"
        && appliedSeedNodeId.trim().length > 0
      ) ? (
        <EnterpriseCompactEmptyState
          role="alert"
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_LOAD_ERROR_TITLE}
          description={loadError}
          testId="infra-diagrams-load-error-panel"
          footer={
            <Button type="button" size="sm" variant="primary" onClick={retryLoad}>
              Retry load
            </Button>
          }
        />
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

      <section
        className={cn("grid gap-4 md:grid-cols-[minmax(0,3fr)_minmax(9rem,1fr)]", cnCard)}
        aria-label="Snapshot and mode selection"
      >
        {buyerPolishedShell ? (
          <>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="infra-diagrams-snapshot-picker">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_LABEL}</Label>
              <select
                id="infra-diagrams-snapshot-picker"
                className={cn("w-full", cnField)}
                data-testid="infra-diagrams-snapshot-picker"
                disabled={loadingSnapshots || snapshots.length === 0}
                value={selectedSnapshotId}
                onChange={(event) => handleSnapshotChange(event.target.value)}
              >
                {snapshots.length === 0 ? (
                  <option value="">No snapshots available</option>
                ) : (
                  <>
                    {selectedSnapshotId.length === 0 ? (
                      <option value="">Select a snapshot</option>
                    ) : null}
                    {snapshots.map((snapshot) => (
                      <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                        {formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot)}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {selectedSnapshot != null ? (
                <div className="flex items-start gap-2" data-testid="infra-diagrams-snapshot-id-readout">
                  <span className={cn("font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {selectedSnapshot.snapshotId}
                  </span>
                  <CopyIdButton value={selectedSnapshot.snapshotId} aria-label="Copy snapshot id" />
                </div>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="infra-diagrams-mode-picker">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_MODE_LABEL}</Label>
              <select
                id="infra-diagrams-mode-picker"
                className={cn("w-full", cnField)}
                data-testid="infra-diagrams-mode-picker"
                disabled={loadingPreview || selectedSnapshotId.length === 0 || deepLinkedSnapshotMissing}
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
            <label className="flex min-w-0 flex-col gap-1">
              <span className={OPERATOR_FORM_FIELD_LABEL_CLASS}>Snapshot</span>
              <select
                className={cn("w-full", cnField)}
                data-testid="infra-diagrams-snapshot-picker"
                disabled={loadingSnapshots || snapshots.length === 0}
                value={selectedSnapshotId}
                onChange={(event) => handleSnapshotChange(event.target.value)}
              >
                {snapshots.length === 0 ? (
                  <option value="">No snapshots available</option>
                ) : (
                  <>
                    {selectedSnapshotId.length === 0 ? (
                      <option value="">Select a snapshot</option>
                    ) : null}
                    {snapshots.map((snapshot) => (
                      <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                        {formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot)}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {selectedSnapshot != null ? (
                <div className="mt-1 flex items-start gap-2" data-testid="infra-diagrams-snapshot-id-readout">
                  <span className={cn("font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {selectedSnapshot.snapshotId}
                  </span>
                  <CopyIdButton value={selectedSnapshot.snapshotId} aria-label="Copy snapshot id" />
                </div>
              ) : null}
            </label>
            <label className="flex min-w-0 flex-col gap-1">
              <span className={OPERATOR_FORM_FIELD_LABEL_CLASS}>Diagram mode</span>
              <select
                className={cn("w-full", cnField)}
                data-testid="infra-diagrams-mode-picker"
                disabled={loadingPreview || selectedSnapshotId.length === 0 || deepLinkedSnapshotMissing}
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
          {seedCandidateNodes.length > 0 ? (
            <label className="flex min-w-[16rem] flex-1 flex-col gap-1">
              <span className={OPERATOR_FORM_FIELD_LABEL_CLASS}>
                {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_LABEL}
              </span>
              <select
                className={cn("w-full", cnField)}
                data-testid="infra-diagrams-seed-node-picker"
                value={
                  seedCandidateNodes.some(
                    (node) => resolveInfraEvidenceOutlineSeedNodeId(node) === seedNodeDraft,
                  )
                    ? seedNodeDraft
                    : ""
                }
                onChange={(event) => {
                  const nextSeed = event.target.value;

                  setSeedNodeDraft(nextSeed);

                  if (nextSeed.trim().length > 0) {
                    applySeedNode(nextSeed);
                  }
                }}
              >
                <option value="">Select a starting resource</option>
                {seedCandidateNodes.map((node) => {
                  const seedValue = resolveInfraEvidenceOutlineSeedNodeId(node);

                  return (
                    <option key={`${node.id}:${seedValue}`} value={seedValue}>
                      {node.label}
                    </option>
                  );
                })}
              </select>
            </label>
          ) : null}
          {buyerPolishedShell ? (
            <>
              <div className="grid min-w-[16rem] flex-1 gap-2">
                <Label htmlFor="infra-diagrams-seed-node-input">
                  {seedCandidateNodes.length > 0
                    ? GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_PASTE_LABEL
                    : GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_LABEL}
                </Label>
                <Input
                  id="infra-diagrams-seed-node-input"
                  data-testid="infra-diagrams-seed-node-input"
                  value={seedNodeDraft}
                  onChange={(event) => setSeedNodeDraft(event.target.value)}
                  placeholder="Cloud resource id or ARM id"
                />
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_HELPER}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={handleSeedNodeApply}>
                {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_FOCUS_ACTION}
              </Button>
            </>
          ) : (
            <>
              <label className="flex min-w-[16rem] flex-1 flex-col gap-1">
                <span className={OPERATOR_FORM_FIELD_LABEL_CLASS}>
                  {seedCandidateNodes.length > 0
                    ? GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_PASTE_LABEL
                    : GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_LABEL}
                </span>
                <input
                  className={cnField}
                  data-testid="infra-diagrams-seed-node-input"
                  value={seedNodeDraft}
                  onChange={(event) => setSeedNodeDraft(event.target.value)}
                  placeholder="Cloud resource id or ARM id"
                />
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_HELPER}
                </span>
              </label>
              <Button type="button" variant="outline" onClick={handleSeedNodeApply}>
                {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_FOCUS_ACTION}
              </Button>
            </>
          )}
        </section>
      ) : null}

      {renderInFlight ? (
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className={OPERATOR_TYPOGRAPHY.body}>Loading diagram…</span>
        </div>
      ) : null}

      {showResourceGroupCards ? (
        <section className={cn("grid gap-3", cnCard)} aria-label="Resource groups" data-testid="infra-diagrams-resource-group-cards">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_TITLE}
          </h2>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_BODY}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {resourceGroupFallbackArtifacts.map((artifact) => (
              <FallbackCard
                key={artifact.key}
                artifact={artifact}
                selected={parseInfraDiagramsResourceGroupName(artifact.key) === selectedResourceGroupName}
                onSelect={() => handleFallbackSelect(artifact.key)}
              />
            ))}
          </div>
        </section>
      ) : null}

      {showFallbackCards ? (
        <section className={cn("grid gap-3", cnCard)} aria-label="Partitioned diagram views" data-testid="infra-diagrams-fallback-cards">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>Partitioned views</h2>
          <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PARTITIONED_BODY}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {thematicFallbackArtifacts.map((artifact) => (
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

      {renderInFlight ? (
        <div
          className={cn(
            "sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-white/95 p-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95",
          )}
          data-testid="infra-diagrams-render-status-strip"
          aria-label="Diagram render status"
          aria-live="polite"
        >
          <StatusTag kind="in-progress" label="Rendering diagram…" />
        </div>
      ) : renderStatusPresentation != null ? (
        <div
          className={cn(
            "sticky top-0 z-10 flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 bg-white/95 p-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95",
          )}
          data-testid="infra-diagrams-render-status-strip"
          aria-label="Diagram render status"
        >
          <StatusTag kind={renderStatusPresentation.kind} label={renderStatusPresentation.label} />
          {metrics != null ? (
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {metrics.nodeCount} nodes · {metrics.edgeCount} edges · {metrics.subgraphCount} subgraphs
            </span>
          ) : null}
          <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{selectedModeLabel}</span>
        </div>
      ) : null}

      <section className={cn("flex flex-col gap-3", cnCard)} aria-label="Diagram export actions">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="default"
            data-testid="infra-diagrams-export-png"
            disabled={exportsDisabled}
            aria-describedby={pngExportError != null ? "infra-diagrams-png-export-error" : undefined}
            onClick={() => void runPngExport()}
          >
            {exportBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Export PNG{tenantBrandActive ? " (branded)" : ""}
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="infra-diagrams-export-mmd"
            disabled={mermaidExportDisabled}
            onClick={runMermaidExport}
          >
            Export Mermaid (.mmd)
          </Button>
        </div>
        {pngExportError != null ? (
          <OperatorMutationInlineError
            message={pngExportError}
            testId="infra-diagrams-png-export-error"
            recoveryPresentation={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_ERROR_RECOVERY}
          />
        ) : null}
        {pngBrowserFallbackNote != null ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="infra-diagrams-png-browser-fallback-note"
          >
            {pngBrowserFallbackNote}
          </p>
        ) : null}
      </section>

      {selectedSnapshotId.length > 0 ? (
        <div className={cn("flex flex-wrap items-center gap-2", cnCard)} aria-label="Diagram follow-up links">
          <Link
            className={OPERATOR_LINK.inline}
            data-testid="infra-diagrams-open-ask"
            href={buildInfrastructureAskHref({
              cloudResourceId: urlCloudResourceId.length > 0 ? urlCloudResourceId : undefined,
              snapshotId: selectedSnapshotId,
              seedNodeId:
                selectedMode === "dependencyNeighborhood" && appliedSeedNodeId.trim().length > 0
                  ? appliedSeedNodeId.trim()
                  : undefined,
              hubTab: "diagram",
              ...mergeInfrastructureAskAuditScope(auditScope),
            })}
          >
            Ask about this snapshot
          </Link>
        </div>
      ) : null}

      {dependencyNeighborhoodAwaitingSeed ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_PROMPT_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_PROMPT_BODY}
          testId="infra-diagrams-dependency-seed-prompt"
        />
      ) : resourceGroupPickerAwaitingSelection ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_PROMPT_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_PROMPT_BODY}
          testId="infra-diagrams-resource-group-picker-prompt"
        />
      ) : tooLargeForBrowser ? (
        <>
          <div className="rounded-md border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/40">
            <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}>
              {INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE}
            </p>
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" disabled={exportsDisabled} onClick={() => void runPngExport()}>
                Download server PNG
              </Button>
            </div>
          </div>
          {mermaidOutline != null ? (
            <InfraEvidenceDiagramOutline
              outline={mermaidOutline}
              onFocusNeighborhood={handleOutlineFocusNeighborhood}
            />
          ) : null}
        </>
      ) : diagramContentEmpty && renderResult?.status === "Succeeded" ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_BODY}
          testId="infra-diagrams-empty-content"
        />
      ) : paintMermaidSource ? (
        <>
          {isResourceGroupMapDiagram ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="infra-diagrams-resource-group-map-caption"
            >
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_MAP_CAPTION}
            </p>
          ) : null}
          <ArchitectureDiagramViewer
            mermaidSource={mermaidSource}
            textAlternative={`Inventory diagram for snapshot ${selectedSnapshotDisplayLabel ?? selectedSnapshotId} in ${selectedModeLabel} mode.`}
            viewportAriaLabel={`Inventory diagram for snapshot ${selectedSnapshotDisplayLabel ?? selectedSnapshotId}`}
            fullscreenTitle={`Inventory diagram · ${selectedModeLabel}`}
            scopeContextLine={diagramScopeContextLine}
            canvasStale={renderInFlight}
            onRenderFailure={handleRenderFailure}
            onRetry={handleRenderRetry}
            onExportableSvgMarkupChange={setExportableSvgMarkup}
          />
          {mermaidOutline != null ? (
            <InfraEvidenceDiagramOutline
              outline={mermaidOutline}
              onFocusNeighborhood={handleOutlineFocusNeighborhood}
            />
          ) : null}
        </>
      ) : renderResult?.status === "Failed" ? (
        <StatusTag kind="needs-attention" label="Diagram render failed for the selected mode." />
      ) : null}

        <DiagramsClaimOrientationStrip />
      </main>

      <AlertDialog
        open={dependencySeedBlockedDialog != null}
        onOpenChange={(open) => {
          if (!open) {
            setDependencySeedBlockedDialog(null);
          }
        }}
      >
        <AlertDialogContent data-testid="infra-diagrams-dependency-seed-blocked-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{dependencySeedBlockedDialog?.title ?? ""}</AlertDialogTitle>
            <AlertDialogDescription>{dependencySeedBlockedDialog?.message ?? ""}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_DIALOG_DISMISS}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OperatorPageContainer>
  );
}
