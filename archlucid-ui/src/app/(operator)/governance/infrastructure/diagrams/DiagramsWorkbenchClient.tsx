"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { ArchitectureDiagramViewer } from "@/components/architecture/ArchitectureDiagramViewer";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CopyIdButton } from "@/components/CopyIdButton";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InferenceQuestionnairePanel } from "@/components/infra-evidence/InferenceQuestionnairePanel";
import { InfraEvidenceCompletenessWarningsBanner } from "@/components/infra-evidence/InfraEvidenceCompletenessWarningsBanner";
import { OperatorInferredConnectionsPanel } from "@/components/infra-evidence/OperatorInferredConnectionsPanel";
import { InfraEvidenceDataFlowCaptionDisclosure } from "@/components/infra-evidence/InfraEvidenceDataFlowCaptionDisclosure";
import { InfraEvidenceDiagramOutline } from "@/components/infra-evidence/InfraEvidenceDiagramOutline";
import { InfraEvidenceDiagramLegend } from "@/components/infra-evidence/InfraEvidenceDiagramLegend";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatusTag } from "@/components/ui/status-tag";
import {
  downloadInfraEvidenceMermaidPng,
  fetchInfraEvidenceMermaidPreview,
  fetchInfraEvidenceMermaidRender,
  formatInfraEvidenceMermaidApiError,
  type InfraEvidenceMermaidRenderQuery,
} from "@/lib/infra-evidence/infra-evidence-mermaid-api";
import {
  INFRA_DIAGRAMS_CLOUD_RESOURCE_ID_PARAM,
  INFRA_DIAGRAMS_MERMAID_MODE_PARAM,
  INFRA_DIAGRAMS_MERMAID_VIEW_PARAM,
  INFRA_DIAGRAMS_DIAGRAM_TYPE_OPTIONS,
  INFRA_DIAGRAMS_MODE_OPTIONS,
  INFRA_DIAGRAMS_SEED_NODE_ID_PARAM,
  INFRA_DIAGRAMS_INCLUDE_NEVER_SHOW_PARAM,
  INFRA_DIAGRAMS_HIDE_EXECUTIVE_TIERS_PARAM,
  INFRA_DIAGRAMS_INCLUDE_PRIVATE_ENDPOINTS_PARAM,
  INFRA_DIAGRAMS_INCLUDE_RECOVERY_SERVICES_PARAM,
  INFRA_DIAGRAMS_SHOW_TRIVIAL_COMPONENTS_PARAM,
  INFRA_DIAGRAMS_SNAPSHOT_ID_PARAM,
  INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_PARAM,
  infraDiagramsFilterHrefFromSearch,
  parseInfraDiagramsCloudResourceIdFromSearch,
  parseInfraDiagramsHiddenExecutiveTierKeysFromSearchParam,
  parseInfraDiagramsIncludeNeverShowFromSearch,
  parseInfraDiagramsIncludePrivateEndpointsFromSearch,
  parseInfraDiagramsIncludeRecoveryServicesFromSearch,
  parseInfraDiagramsSubscriptionFilterFromSearch,
  isInfraDiagramsMermaidModeSelected,
  parseInfraDiagramsMermaidModeFromSearch,
  parseInfraDiagramsMermaidViewFromSearch,
  parseInfraDiagramsSeedNodeIdFromSearch,
  parseInfraDiagramsSnapshotIdFromSearch,
  resolveInfraDiagramsSelectedSnapshotId,
} from "@/lib/infra-evidence/infra-evidence-diagrams-filter-url";
import {
  exceedsInfraEvidenceMermaidClientGuard,
  INFRA_EVIDENCE_MERMAID_CLIENT_READABILITY_THRESHOLDS,
  INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE,
} from "@/lib/infra-evidence/infra-evidence-mermaid-client-guard";
import { buildDiagramWalkthrough } from "@/lib/infra-evidence/build-diagram-walkthrough";
import { filterInfraEvidenceMermaidOutline } from "@/lib/infra-evidence/azure-inventory-never-show-arm-types";
import { resolveAlwaysExcludedMermaidCollapseEntries } from "@/lib/infra-evidence/infra-evidence-mermaid-collapse-report";
import { resolveDiagramCameraFocusNodeIds } from "@/lib/architecture/architecture-diagram-camera-focus";
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
import {
  buildInfraDiagramsSubscriptionFilterOptions,
  filterInfraDiagramsSnapshotsBySubscription,
  INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_ALL,
  INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_UNSELECTED,
  isInfraDiagramsSubscriptionFilterChosen,
  normalizeInfraEvidenceDiagramsSnapshotSummaries,
  resolveInfraDiagramsSubscriptionFilterForSnapshot,
  sortInfraDiagramsSnapshotsForPicker,
} from "@/lib/infra-evidence/infra-evidence-diagrams-snapshot-catalog";
import { resolveInfraEvidenceMermaidRenderStatusPresentation } from "@/lib/infra-evidence/infra-evidence-mermaid-render-status-presentation";
import { parseInfraDiagramsDataFlowCaptionPresentation } from "@/lib/infra-evidence/infra-evidence-data-flow-diagram";
import { isInfraEvidenceMermaidDiagramEmpty } from "@/lib/infra-evidence/infra-evidence-mermaid-empty-content";
import { resolveInfraEvidenceDiagramOutlineResourceName } from "@/lib/infra-evidence/resolve-infra-evidence-diagram-outline-resource-name";
import {
  normalizeInfraEvidenceLayoutSvgForDisplay,
  normalizeInfraEvidenceMermaidSourceForDisplay,
} from "@/lib/infra-evidence/normalize-infra-evidence-mermaid-display";
import { stripExecutiveOverflowNodesFromInfraEvidenceMermaid } from "@/lib/infra-evidence/strip-infra-evidence-executive-overflow-from-mermaid";
import {
  parseInfraEvidenceMermaidOutline,
  resolveInfraEvidenceOutlineSeedNodeId,
  type InfraEvidenceMermaidOutline,
  type InfraEvidenceMermaidOutlineNode,
} from "@/lib/infra-evidence/parse-infra-evidence-mermaid-outline";
import {
  dependencyNeighborhoodRequiresAppliedSeed,
  resolveDependencyNeighborhoodSeedBlockedReason,
  type DependencyNeighborhoodSeedBlockedReason,
} from "@/lib/infra-evidence/infra-evidence-diagrams-dependency-seed";
import { resolveInfraDiagramsDensityCoachPresentation } from "@/lib/infra-evidence/infra-evidence-diagrams-density-coach-presentation";
import { INFRA_DIAGRAMS_EXECUTIVE_TIERS } from "@/lib/infra-evidence/infra-evidence-diagrams-executive-tiers";
import {
  resolveInfraDiagramsDefaultFallbackKey,
  resolveInfraDiagramsEffectiveFallbackKey,
  resolveInfraDiagramsFallbackArtifacts,
  resolveInfraDiagramsResourceGroupFallbackArtifacts,
  resolveInfraDiagramsThematicFallbackArtifacts,
  isInfraDiagramsExecutiveMode,
  shouldPaintInfraDiagramsCanvas,
  shouldShowInfraDiagramsPartitionedViews,
} from "@/lib/infra-evidence/infra-evidence-diagrams-partitioned-view";
import {
  buildInfraDiagramsResourceGroupModeToken,
  INFRA_DIAGRAMS_RESOURCE_GROUP_MODE,
  isInfraDiagramsResourceGroupMode,
  isInfraEvidenceBackboneKeepMermaid,
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
import { InfraEvidenceSelectionAnnouncer } from "@/components/infra-evidence/InfraEvidenceSelectionAnnouncer";
import { InfraEvidenceWorkbenchBuildProvenanceStrip } from "@/components/infra-evidence/InfraEvidenceWorkbenchBuildProvenanceStrip";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";
import { useInfraEvidenceResourceHubAuditLineage } from "@/hooks/use-infra-evidence-resource-hub-audit-lineage";
import { useTenantBrandingPresentationQuery } from "@/hooks/use-tenant-branding-presentation-query";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_FORM_FIELD_LABEL_CLASS,
  DESIGN_TOKENS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_SNAPSHOTS_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_SNAPSHOTS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_BROWSER_FALLBACK_NOTE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_DISCLAIMER,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_ERROR_RECOVERY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RENDER_FAILED_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RENDER_FAILED_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_CANCEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_CONFIRM,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_MODE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_TYPE_PLACEHOLDER,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_TYPE_PROMPT_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_TYPE_PROMPT_TITLE,
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
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_BACKBONE_KEEP_CAPTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_ALL,
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
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_PROMPT_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_PROMPT_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_PROMPT_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_INCLUDE_NEVER_SHOW_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_ALWAYS_EXCLUDED_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EXECUTIVE_ALWAYS_SHOW_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EXECUTIVE_ALWAYS_SHOW_BODY,
  formatGovernanceInfrastructureInlineActionError,
} from "@/lib/governance/governance-infrastructure-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { downloadBrowserTextFile } from "@/lib/graph-view-model-export";
import { useDocumentDarkMode } from "@/lib/use-document-dark-mode";
import { useIanaTimeZonePreference } from "@/lib/use-iana-time-zone-preference";
import { cn } from "@/lib/utils";

import { DiagramsBreadcrumb } from "./DiagramsBreadcrumb";
import { DiagramsClaimOrientationStrip } from "./DiagramsClaimOrientationStrip";
import { useDiagramsWorkbenchShortcuts } from "./use-diagrams-workbench-shortcuts";

function resolveInfraDiagramsRenderStatusAnnouncement(status: string): string {
  const normalized = status.trim().toLowerCase();

  if (normalized.length === 0 || normalized === "loading") {
    return "Loading diagram";
  }

  if (normalized === "succeeded") {
    return "Diagram ready";
  }

  if (normalized === "failed") {
    return "Diagram render failed";
  }

  if (normalized === "partitioned") {
    return "Diagram partitioned — pick a view";
  }

  return status;
}

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
  const { ianaTimeZoneId } = useIanaTimeZonePreference();
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
  const urlSubscriptionFilter = parseInfraDiagramsSubscriptionFilterFromSearch(
    searchParams.get(INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_PARAM),
  );
  const urlIncludePrivateEndpoints = parseInfraDiagramsIncludePrivateEndpointsFromSearch(
    searchParams.get(INFRA_DIAGRAMS_INCLUDE_PRIVATE_ENDPOINTS_PARAM),
  );
  const urlIncludeRecoveryServices = parseInfraDiagramsIncludeRecoveryServicesFromSearch(
    searchParams.get(INFRA_DIAGRAMS_INCLUDE_RECOVERY_SERVICES_PARAM),
  );
  const includeNeverShow = parseInfraDiagramsIncludeNeverShowFromSearch(
    searchParams.get(INFRA_DIAGRAMS_INCLUDE_NEVER_SHOW_PARAM),
    searchParams.get(INFRA_DIAGRAMS_SHOW_TRIVIAL_COMPONENTS_PARAM),
  );
  const hiddenExecutiveTierKeys = useMemo(
    () =>
      parseInfraDiagramsHiddenExecutiveTierKeysFromSearchParam(
        searchParams.get(INFRA_DIAGRAMS_HIDE_EXECUTIVE_TIERS_PARAM),
      ),
    [searchParams],
  );
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
  const [selectedSubscriptionFilter, setSelectedSubscriptionFilter] = useState<string>(() =>
    urlSubscriptionFilter.length > 0 ? urlSubscriptionFilter : INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_UNSELECTED,
  );
  const [subscriptionResourceGroupArtifacts, setSubscriptionResourceGroupArtifacts] = useState<
    readonly InfraEvidenceMermaidFallbackArtifactSummary[]
  >([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(urlSnapshotId);
  const [selectedMode, setSelectedMode] = useState<string>(urlMermaidMode);
  const [showPrivateEndpoints, setShowPrivateEndpoints] = useState(urlIncludePrivateEndpoints);
  const [includeRecoveryServices, setIncludeRecoveryServices] = useState(urlIncludeRecoveryServices);
  const [pendingSubscriptionFilter, setPendingSubscriptionFilter] = useState<string | null>(null);
  const [subscriptionChangeConfirmOpen, setSubscriptionChangeConfirmOpen] = useState(false);
  const [selectedViewKey, setSelectedViewKey] = useState<string>(urlMermaidView);
  const [seedNodeDraft, setSeedNodeDraft] = useState<string>(urlSeedNodeId);
  const [appliedSeedNodeId, setAppliedSeedNodeId] = useState<string>(() =>
    urlMermaidMode === "dependencyNeighborhood" ? urlSeedNodeId : "",
  );
  const [seedCandidateNodes, setSeedCandidateNodes] = useState<InfraEvidenceMermaidOutlineNode[]>([]);
  const [seedCatalogOutline, setSeedCatalogOutline] = useState<InfraEvidenceMermaidOutline | null>(null);
  const [loadingSeedCatalog, setLoadingSeedCatalog] = useState(false);
  const [dependencySeedBlockedDialog, setDependencySeedBlockedDialog] =
    useState<DependencyNeighborhoodSeedBlockedReason | null>(null);
  const [modePreviews, setModePreviews] = useState<InfraEvidenceMermaidModePreview[]>([]);
  const [snapshotCompletenessWarnings, setSnapshotCompletenessWarnings] = useState<string[]>([]);
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
  const [renderRequestGeneration, setRenderRequestGeneration] = useState(0);

  const { data: brandingPresentation } = useTenantBrandingPresentationQuery({ context: "MermaidDiagram" });
  const tenantBrandActive = brandingPresentation?.usesTenantVisualBrand === true;
  const dark = useDocumentDarkMode();

  useEffect(() => {
    setSeedNodeDraft(urlSeedNodeId);

    if (urlMermaidMode !== "dependencyNeighborhood") {
      setAppliedSeedNodeId("");
      return;
    }

    const trimmedUrlSeed = urlSeedNodeId.trim();

    if (trimmedUrlSeed.length > 0) {
      setAppliedSeedNodeId(trimmedUrlSeed);
    }
  }, [urlMermaidMode, urlSeedNodeId]);

  useEffect(() => {
    setShowPrivateEndpoints(urlIncludePrivateEndpoints);
  }, [urlIncludePrivateEndpoints]);

  useEffect(() => {
    setIncludeRecoveryServices(urlIncludeRecoveryServices);
  }, [urlIncludeRecoveryServices]);

  useEffect(() => {
    if (urlSubscriptionFilter.length === 0) {
      return;
    }

    setSelectedSubscriptionFilter(urlSubscriptionFilter);
  }, [urlSubscriptionFilter]);

  const syncUrl = useCallback(
    (patch: {
      snapshotId?: string;
      mermaidMode?: string;
      mermaidView?: string;
      seedNodeId?: string;
      subscriptionFilter?: string;
      includePrivateEndpoints?: boolean;
      includeRecoveryServices?: boolean;
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

  const showFallbackCards = useMemo(
    () =>
      selectedMode !== "dependencyNeighborhood"
      && !isInfraDiagramsResourceGroupMode(selectedMode)
      && shouldShowInfraDiagramsPartitionedViews({
        selectedMode,
        selectedViewKey,
        previewStatus: activeModePreview?.status ?? "",
        renderStatus: renderResult?.status ?? "",
        fallbackArtifactCount: thematicFallbackArtifacts.length,
      }),
    [
      activeModePreview?.status,
      renderResult?.status,
      selectedMode,
      selectedViewKey,
      thematicFallbackArtifacts.length,
    ],
  );

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
  const subscriptionFilterOptions = useMemo(
    () => buildInfraDiagramsSubscriptionFilterOptions(snapshots),
    [snapshots],
  );

  const visibleSnapshots = useMemo(
    () =>
      sortInfraDiagramsSnapshotsForPicker(
        filterInfraDiagramsSnapshotsBySubscription(snapshots, selectedSubscriptionFilter),
      ),
    [selectedSubscriptionFilter, snapshots],
  );

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

  const selectedSnapshotVisibleInSubscriptionFilter = useMemo(
    () => visibleSnapshots.some((snapshot) => snapshot.snapshotId === selectedSnapshotId),
    [selectedSnapshotId, visibleSnapshots],
  );

  const diagramsSubscriptionChosen = isInfraDiagramsSubscriptionFilterChosen(selectedSubscriptionFilter);

  const snapshotPickerEnabled =
    diagramsSubscriptionChosen
    && !loadingSnapshots
    && visibleSnapshots.length > 0;

  const diagramTypePickerEnabled =
    diagramsSubscriptionChosen
    && selectedSnapshotId.length > 0
    && !deepLinkedSnapshotMissing
    && selectedSnapshotVisibleInSubscriptionFilter;

  const resourceGroupPickerArtifacts = useMemo(() => {
    if (resourceGroupFallbackArtifacts.length >= 2) {
      return resourceGroupFallbackArtifacts;
    }

    return subscriptionResourceGroupArtifacts;
  }, [resourceGroupFallbackArtifacts, subscriptionResourceGroupArtifacts]);

  const showResourceGroupDropdown = diagramTypePickerEnabled;

  const diagramTypeSelected = useMemo(() => {
    if (isInfraDiagramsResourceGroupMode(selectedMode)) {
      if (selectedResourceGroupName.length > 0) {
        return true;
      }

      return !showResourceGroupDropdown;
    }

    return isInfraDiagramsMermaidModeSelected(selectedMode);
  }, [selectedMode, selectedResourceGroupName, showResourceGroupDropdown]);

  const diagramTypePickerValue =
    diagramTypeSelected
    && !isInfraDiagramsResourceGroupMode(selectedMode)
    && selectedMode !== "selectedResources"
      ? selectedMode
      : "";

  const resourceGroupPickerAwaitingSelection =
    isInfraDiagramsResourceGroupMode(selectedMode)
    && selectedResourceGroupName.length === 0;

  const showResourceGroupCards =
    isInfraDiagramsResourceGroupMode(selectedMode)
    && selectedResourceGroupName.length === 0
    && resourceGroupPickerArtifacts.length > 0;

  const awaitingSnapshotSelection =
    !loadingSnapshots
    && !deepLinkedSnapshotMissing
    && diagramsSubscriptionChosen
    && selectedSnapshotId.length === 0
    && snapshots.length > 0;

  const awaitingDiagramTypeSelection =
    diagramTypePickerEnabled && !diagramTypeSelected;

  const formatSnapshotPickerLabel = useCallback(
    (snapshot: InfraEvidenceSnapshotSummary): string => {
      return formatInfraEvidenceDiagramsSnapshotPickerLabel(snapshot, ianaTimeZoneId);
    },
    [ianaTimeZoneId],
  );

  const selectedSnapshotDisplayLabel = useMemo(() => {
    if (selectedSnapshot != null) {
      return formatSnapshotPickerLabel(selectedSnapshot);
    }

    if (selectedSnapshotId.length > 0) {
      return selectedSnapshotId;
    }

    return null;
  }, [formatSnapshotPickerLabel, selectedSnapshot, selectedSnapshotId]);

  const selectedModeLabel = useMemo(() => {
    if (!diagramTypeSelected) {
      return GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_TYPE_PLACEHOLDER;
    }

    return resolveInfraDiagramsModeLabel(selectedMode, effectiveFallbackKey, selectedResourceGroupName);
  }, [diagramTypeSelected, effectiveFallbackKey, selectedMode, selectedResourceGroupName]);

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
        ? `${metrics.nodeCount} nodes and ${metrics.edgeCount} edges across ${metrics.subgraphCount} subgraphs.`
        : "";
    const statusLine = resolveInfraDiagramsRenderStatusAnnouncement(status);

    return `${selectedModeLabel} diagram for snapshot ${selectedSnapshotDisplayLabel}. ${statusLine}.${metricLine.length > 0 ? ` ${metricLine}` : ""}`;
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
  const displayMermaidSource = useMemo(
    () =>
      normalizeInfraEvidenceMermaidSourceForDisplay(
        stripExecutiveOverflowNodesFromInfraEvidenceMermaid(mermaidSource),
      ),
    [mermaidSource],
  );
  const displayLayoutSvg = useMemo(
    () => normalizeInfraEvidenceLayoutSvgForDisplay(renderResult?.layoutSvg ?? ""),
    [renderResult?.layoutSvg],
  );
  const metrics = renderResult?.metrics ?? null;
  const dependencyNeighborhoodAwaitingSeed = dependencyNeighborhoodRequiresAppliedSeed(
    selectedMode,
    appliedSeedNodeId,
  );
  const layoutSvg = renderResult?.layoutSvg ?? null;
  const paintDiagramCanvas = shouldPaintInfraDiagramsCanvas({
    mermaidSource,
    layoutSvg,
    effectiveFallbackKey,
    renderFallbackKey: renderResult?.fallbackKey,
  });
  const tooLargeForBrowser =
    exceedsInfraEvidenceMermaidClientGuard(metrics)
    && !paintDiagramCanvas
    && !showFallbackCards;
  const isResourceGroupMapDiagram = isInfraEvidenceResourceGroupMapMermaid(mermaidSource);
  const isBackboneKeepDiagram = isInfraEvidenceBackboneKeepMermaid(mermaidSource);
  const dataFlowCaptionPresentation = useMemo(() => {
    if (selectedMode !== "dataFlow") {
      return null;
    }

    const presentation = parseInfraDiagramsDataFlowCaptionPresentation(mermaidSource);

    if (presentation.honestyCaptions.length === 0 && presentation.metadataComments.length === 0) {
      return null;
    }

    return presentation;
  }, [mermaidSource, selectedMode]);
  const diagramContentEmpty =
    isInfraEvidenceMermaidDiagramEmpty(mermaidSource, metrics?.nodeCount)
    && (layoutSvg ?? "").trim().length === 0;
  const renderInFlight = loadingPreview || loadingRender;
  const exportsDisabled =
    exportBusy
    || renderInFlight
    || selectedSnapshotId.length === 0
    || deepLinkedSnapshotMissing
    || !diagramsSubscriptionChosen
    || !diagramTypeSelected
    || dependencyNeighborhoodAwaitingSeed
    || resourceGroupPickerAwaitingSelection;
  const mermaidExportDisabled = exportsDisabled || !paintDiagramCanvas;

  const renderStatus = renderResult?.status ?? activeModePreview?.status ?? "";

  const completenessWarnings = useMemo(
    () => renderResult?.completenessWarnings ?? snapshotCompletenessWarnings,
    [renderResult?.completenessWarnings, snapshotCompletenessWarnings],
  );
  const completenessSummary = renderResult?.completenessSummary ?? null;

  const renderStatusPresentation = useMemo(() => {
    if (renderStatus.length === 0 || renderStatus !== "Failed") {
      return null;
    }

    return resolveInfraEvidenceMermaidRenderStatusPresentation({
      status: renderStatus,
      mermaidEmpty: diagramContentEmpty,
    });
  }, [diagramContentEmpty, renderStatus]);

  const mermaidOutline = useMemo(() => {
    if (mermaidSource.trim().length === 0) {
      return null;
    }

    return parseInfraEvidenceMermaidOutline(mermaidSource);
  }, [mermaidSource]);

  const visibleMermaidOutline = useMemo(() => {
    if (mermaidOutline == null) {
      return null;
    }

    return filterInfraEvidenceMermaidOutline(mermaidOutline, includeNeverShow);
  }, [includeNeverShow, mermaidOutline]);

  const visibleSeedCatalogOutline = useMemo(() => {
    if (seedCatalogOutline == null) {
      return null;
    }

    return filterInfraEvidenceMermaidOutline(seedCatalogOutline, includeNeverShow);
  }, [includeNeverShow, seedCatalogOutline]);

  const diagramWalkthrough = useMemo(() => {
    if (visibleMermaidOutline == null) {
      return null;
    }

    return buildDiagramWalkthrough(visibleMermaidOutline);
  }, [visibleMermaidOutline]);

  const alwaysExcludedCollapseEntries = useMemo(() => {
    if (includeNeverShow) {
      return [];
    }

    return resolveAlwaysExcludedMermaidCollapseEntries(renderResult?.collapseReport);
  }, [includeNeverShow, renderResult?.collapseReport]);

  const handleIncludeNeverShowChange = useCallback(
    (nextIncludeNeverShow: boolean) => {
      router.replace(
        infraDiagramsFilterHrefFromSearch(
          searchParams.toString(),
          { includeNeverShow: nextIncludeNeverShow },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const handleExecutiveTierVisibilityChange = useCallback(
    (tierKey: string, visible: boolean) => {
      const normalizedKey = tierKey.trim().toLowerCase();
      const hiddenSet = new Set(hiddenExecutiveTierKeys);

      if (visible) {
        hiddenSet.delete(normalizedKey);
      } else {
        hiddenSet.add(normalizedKey);
      }

      router.replace(
        infraDiagramsFilterHrefFromSearch(
          searchParams.toString(),
          { hiddenExecutiveTierKeys: [...hiddenSet] },
          pathname,
        ),
        { scroll: false },
      );
    },
    [hiddenExecutiveTierKeys, pathname, router, searchParams],
  );

  const densityCoachPresentation = useMemo(
    () =>
      resolveInfraDiagramsDensityCoachPresentation({
        showFallbackCards,
        tooLargeForBrowser,
        diagramContentEmpty,
        renderStatus: renderResult?.status ?? "",
        paintDiagramCanvas,
        selectedMode,
        nodeCount: metrics?.nodeCount ?? null,
        maxNodes: INFRA_EVIDENCE_MERMAID_CLIENT_READABILITY_THRESHOLDS.maxNodes,
        isExecutiveMode: isInfraDiagramsExecutiveMode(selectedMode),
        inventoryFilteredIdentityArmTypes:
          renderResult?.identityDiagramHints?.inventoryFilteredIdentityArmTypes ?? [],
      }),
    [
      diagramContentEmpty,
      metrics?.nodeCount,
      paintDiagramCanvas,
      renderResult?.identityDiagramHints,
      renderResult?.status,
      selectedMode,
      showFallbackCards,
      tooLargeForBrowser,
    ],
  );

  // Identity empty already explains the capture omit in the density coach.
  const showGenericEmptyContent =
    diagramContentEmpty
    && renderResult?.status === "Succeeded"
    && densityCoachPresentation?.variant !== "empty-identity";

  const cameraFocusNodeIds = useMemo(
    () => resolveDiagramCameraFocusNodeIds(appliedSeedNodeId, visibleMermaidOutline),
    [appliedSeedNodeId, visibleMermaidOutline],
  );

  const [cameraFocusNonce, setCameraFocusNonce] = useState(0);

  useEffect(() => {
    if (cameraFocusNodeIds.length === 0) {
      return;
    }

    setCameraFocusNonce((current) => current + 1);
  }, [appliedSeedNodeId, cameraFocusNodeIds.length]);

  useEffect(() => {
    setSeedCandidateNodes([]);
    setSeedCatalogOutline(null);
  }, [selectedSnapshotId]);

  useEffect(() => {
    if (visibleMermaidOutline == null || visibleMermaidOutline.nodes.length === 0) {
      return;
    }

    setSeedCandidateNodes([...visibleMermaidOutline.nodes]);
  }, [visibleMermaidOutline]);

  useEffect(() => {
    if (
      selectedMode !== "dependencyNeighborhood"
      || !dependencyNeighborhoodAwaitingSeed
      || selectedSnapshotId.length === 0
      || deepLinkedSnapshotMissing
    ) {
      return;
    }

    if (seedCatalogOutline != null && seedCatalogOutline.nodes.length > 0) {
      return;
    }

    let cancelled = false;

    async function loadSeedCatalog() {
      setLoadingSeedCatalog(true);

      try {
        const catalogRender = await fetchInfraEvidenceMermaidRender(selectedSnapshotId, { mode: "executive" });
        const catalogOutline = parseInfraEvidenceMermaidOutline(catalogRender.mermaid ?? "");

        if (cancelled || catalogOutline == null || catalogOutline.nodes.length === 0) {
          return;
        }

        setSeedCatalogOutline(catalogOutline);
        setSeedCandidateNodes([
          ...filterInfraEvidenceMermaidOutline(catalogOutline, includeNeverShow).nodes,
        ]);
      } catch {
        // Seed picker still supports paste; catalog is a convenience for VNet selection.
      } finally {
        if (!cancelled) {
          setLoadingSeedCatalog(false);
        }
      }
    }

    void loadSeedCatalog();

    return (): void => {
      cancelled = true;
    };
  }, [
    deepLinkedSnapshotMissing,
    dependencyNeighborhoodAwaitingSeed,
    seedCatalogOutline,
    selectedMode,
    selectedSnapshotId,
    includeNeverShow,
  ]);

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
    if (!diagramsSubscriptionChosen || !diagramTypeSelected) {
      return null;
    }

    const executiveTierQuery =
      isInfraDiagramsExecutiveMode(selectedMode) && hiddenExecutiveTierKeys.length > 0
        ? { hiddenExecutiveTierKeys }
        : {};

    if (isInfraDiagramsResourceGroupMode(selectedMode)) {
      if (selectedResourceGroupName.length === 0) {
        return {
          mode: "resourceGroup",
          includeNeverShow,
          includePrivateEndpointNodes: showPrivateEndpoints,
          includeRecoveryServices,
          ...executiveTierQuery,
        };
      }

      return {
        mode: buildInfraDiagramsResourceGroupModeToken(selectedResourceGroupName),
        includeNeverShow,
        includePrivateEndpointNodes: showPrivateEndpoints,
        includeRecoveryServices,
        ...executiveTierQuery,
      };
    }

    if (effectiveFallbackKey.length > 0) {
      return {
        fallbackKey: effectiveFallbackKey,
        includeNeverShow,
        includePrivateEndpointNodes: showPrivateEndpoints,
        includeRecoveryServices,
        ...executiveTierQuery,
      };
    }

    if (selectedMode === "dependencyNeighborhood") {
      const trimmedSeed = appliedSeedNodeId.trim();

      if (trimmedSeed.length === 0) {
        return null;
      }

      return {
        mode: selectedMode,
        seedNodeId: trimmedSeed,
        includeNeverShow,
        includePrivateEndpointNodes: showPrivateEndpoints,
        includeRecoveryServices,
        ...executiveTierQuery,
      };
    }

    if (selectedMode === "selectedResources") {
      const trimmedSelection = appliedSeedNodeId.trim();

      if (trimmedSelection.length === 0) {
        return null;
      }

      return {
        mode: selectedMode,
        seedNodeId: trimmedSelection,
        includeNeverShow,
        includePrivateEndpointNodes: showPrivateEndpoints,
        includeRecoveryServices,
        ...executiveTierQuery,
      };
    }

    return {
      mode: selectedMode,
      seedNodeId: null,
      includeNeverShow,
      includePrivateEndpointNodes: showPrivateEndpoints,
      includeRecoveryServices,
      ...executiveTierQuery,
    };
  }, [
    appliedSeedNodeId,
    effectiveFallbackKey,
    hiddenExecutiveTierKeys,
    includeNeverShow,
    includeRecoveryServices,
    diagramsSubscriptionChosen,
    diagramTypeSelected,
    selectedMode,
    selectedResourceGroupName,
    showPrivateEndpoints,
  ]);

  const retryLoad = useCallback(() => {
    setLoadError(null);
    setLoadGeneration((current) => current + 1);
  }, []);

  const handleRenderFailure = useCallback(() => {
    // ArchitectureDiagramViewer surfaces retry; client render failures are not oversized-graph guards.
  }, []);

  const handleRenderRetry = useCallback(() => {
    setLoadError(null);
    setRenderRequestGeneration((current) => current + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshots() {
      setLoadingSnapshots(true);
      setLoadError(null);

      try {
        const response = await fetchInfraEvidenceSnapshots(1, 50);
        const items = sortInfraDiagramsSnapshotsForPicker(
          normalizeInfraEvidenceDiagramsSnapshotSummaries(response.items ?? []),
        );

        if (!cancelled) {
          setSnapshots(items);

          const resolvedSnapshotId = resolveInfraDiagramsSelectedSnapshotId(urlSnapshotId, items);

          setSelectedSnapshotId(resolvedSnapshotId);

          if (resolvedSnapshotId.length > 0) {
            const linkedSnapshot = items.find((snapshot) => snapshot.snapshotId === resolvedSnapshotId) ?? null;

            setSelectedSubscriptionFilter(resolveInfraDiagramsSubscriptionFilterForSnapshot(linkedSnapshot));
          } else if (urlSubscriptionFilter.length > 0) {
            const subscriptionKnown = buildInfraDiagramsSubscriptionFilterOptions(items).some(
              (option) => option.value === urlSubscriptionFilter,
            );

            if (subscriptionKnown) {
              setSelectedSubscriptionFilter(urlSubscriptionFilter);
            }
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
  }, [loadGeneration, urlSnapshotId, urlSubscriptionFilter]);

  useEffect(() => {
    if (urlSnapshotId.length === 0 || snapshots.length === 0) {
      return;
    }

    const linkedSnapshot = snapshots.find((snapshot) => snapshot.snapshotId === urlSnapshotId) ?? null;

    if (linkedSnapshot != null) {
      setSelectedSubscriptionFilter(resolveInfraDiagramsSubscriptionFilterForSnapshot(linkedSnapshot));
    }
  }, [snapshots, urlSnapshotId]);

  const applySubscriptionFilterChange = useCallback(
    (nextSubscriptionFilter: string) => {
      setSelectedSubscriptionFilter(nextSubscriptionFilter);
      syncUrl({ subscriptionFilter: nextSubscriptionFilter });

      const filteredSnapshots = filterInfraDiagramsSnapshotsBySubscription(snapshots, nextSubscriptionFilter);
      const snapshotStillVisible = filteredSnapshots.some((snapshot) => snapshot.snapshotId === selectedSnapshotId);

      if (
        nextSubscriptionFilter === INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_ALL
        || nextSubscriptionFilter === INFRA_DIAGRAMS_SUBSCRIPTION_FILTER_UNSELECTED
      ) {
        setSelectedMode("");
        setSelectedViewKey("");
        setRenderResult(null);
        setSubscriptionResourceGroupArtifacts([]);
        syncUrl({ mermaidMode: "", mermaidView: "", subscriptionFilter: nextSubscriptionFilter });
      }

      if (!snapshotStillVisible) {
        setSelectedSnapshotId("");
        setSelectedMode("");
        setSelectedViewKey("");
        setRenderResult(null);
        syncUrl({ snapshotId: "", mermaidMode: "", mermaidView: "", subscriptionFilter: nextSubscriptionFilter });
      }
    },
    [selectedSnapshotId, snapshots, syncUrl],
  );

  const subscriptionChangeWouldClearSelection = useCallback(
    (nextSubscriptionFilter: string): boolean => {
      if (nextSubscriptionFilter === selectedSubscriptionFilter) {
        return false;
      }

      if (selectedSnapshotId.length === 0 && !diagramTypeSelected) {
        return false;
      }

      const filteredSnapshots = filterInfraDiagramsSnapshotsBySubscription(snapshots, nextSubscriptionFilter);
      const snapshotStillVisible = filteredSnapshots.some((snapshot) => snapshot.snapshotId === selectedSnapshotId);

      return !snapshotStillVisible || selectedMode.length > 0 || selectedViewKey.length > 0;
    },
    [
      diagramTypeSelected,
      selectedMode,
      selectedSnapshotId,
      selectedSubscriptionFilter,
      selectedViewKey.length,
      snapshots,
    ],
  );

  const handleSubscriptionFilterChange = useCallback(
    (nextSubscriptionFilter: string) => {
      if (nextSubscriptionFilter === selectedSubscriptionFilter) {
        return;
      }

      if (subscriptionChangeWouldClearSelection(nextSubscriptionFilter)) {
        setPendingSubscriptionFilter(nextSubscriptionFilter);
        setSubscriptionChangeConfirmOpen(true);
        return;
      }

      applySubscriptionFilterChange(nextSubscriptionFilter);
    },
    [applySubscriptionFilterChange, selectedSubscriptionFilter, subscriptionChangeWouldClearSelection],
  );

  const handleSubscriptionChangeConfirm = useCallback(() => {
    const nextSubscriptionFilter = pendingSubscriptionFilter;

    setSubscriptionChangeConfirmOpen(false);
    setPendingSubscriptionFilter(null);

    if (nextSubscriptionFilter == null) {
      return;
    }

    applySubscriptionFilterChange(nextSubscriptionFilter);
  }, [applySubscriptionFilterChange, pendingSubscriptionFilter]);

  const handlePrivateEndpointsToggle = useCallback(() => {
    const nextShowPrivateEndpoints = !showPrivateEndpoints;

    setShowPrivateEndpoints(nextShowPrivateEndpoints);
    syncUrl({ includePrivateEndpoints: nextShowPrivateEndpoints });
  }, [showPrivateEndpoints, syncUrl]);

  const handleIncludeRecoveryServicesToggle = useCallback(() => {
    const nextIncludeRecoveryServices = !includeRecoveryServices;

    setIncludeRecoveryServices(nextIncludeRecoveryServices);
    syncUrl({ includeRecoveryServices: nextIncludeRecoveryServices });
  }, [includeRecoveryServices, syncUrl]);

  useEffect(() => {
    if (selectedSnapshotId.length === 0 || deepLinkedSnapshotMissing) {
      setModePreviews([]);
      setSnapshotCompletenessWarnings([]);
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
          setSnapshotCompletenessWarnings(preview.completenessWarnings ?? []);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(formatInfraEvidenceMermaidApiError(error));
          setModePreviews([]);
          setSnapshotCompletenessWarnings([]);
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
    const prefetchSnapshotId = visibleSnapshots[0]?.snapshotId ?? "";

    const resourceGroupSnapshotId = selectedSnapshotId.length > 0 ? selectedSnapshotId : prefetchSnapshotId;

    if (!diagramsSubscriptionChosen || resourceGroupSnapshotId.length === 0) {
      setSubscriptionResourceGroupArtifacts([]);
      return;
    }

    let cancelled = false;

    async function loadSubscriptionResourceGroups() {
      try {
        const preview = await fetchInfraEvidenceMermaidPreview(resourceGroupSnapshotId);
        const previewArtifacts = (preview.modes ?? []).flatMap((modePreview) => modePreview.fallbackArtifacts ?? []);
        const artifacts = resolveInfraDiagramsResourceGroupFallbackArtifacts(previewArtifacts);

        if (!cancelled) {
          setSubscriptionResourceGroupArtifacts(artifacts);
        }
      } catch {
        if (!cancelled) {
          setSubscriptionResourceGroupArtifacts([]);
        }
      }
    }

    void loadSubscriptionResourceGroups();

    return () => {
      cancelled = true;
    };
  }, [diagramsSubscriptionChosen, selectedSnapshotId, selectedSubscriptionFilter, visibleSnapshots]);

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
  }, [
    deepLinkedSnapshotMissing,
    loadGeneration,
    renderQuery,
    renderRequestGeneration,
    selectedSnapshotId,
    selectedViewKey.length,
  ]);

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
      const trimmedMode = nextMode.trim();

      setSelectedMode(trimmedMode);
      setSelectedViewKey("");
      setRenderResult(null);
      setDependencySeedBlockedDialog(null);

      if (trimmedMode !== "dependencyNeighborhood") {
        setAppliedSeedNodeId("");
      } else if (urlSeedNodeId.trim().length === 0) {
        setAppliedSeedNodeId("");
      }

      syncUrl({ mermaidMode: trimmedMode, mermaidView: "" });
    },
    [syncUrl, urlSeedNodeId],
  );

  const handleResourceGroupPickerChange = useCallback(
    (nextResourceGroupName: string) => {
      const trimmedName = nextResourceGroupName.trim();

      if (trimmedName.length === 0) {
        setSelectedMode("");
        setSelectedViewKey("");
        setRenderResult(null);
        syncUrl({ mermaidMode: "", mermaidView: "" });
        return;
      }

      setSelectedMode(INFRA_DIAGRAMS_RESOURCE_GROUP_MODE);
      setSelectedViewKey(trimmedName);
      setRenderResult(null);
      setDependencySeedBlockedDialog(null);
      syncUrl({ mermaidMode: INFRA_DIAGRAMS_RESOURCE_GROUP_MODE, mermaidView: trimmedName });
    },
    [syncUrl],
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

      const seedChanged = trimmedSeed !== appliedSeedNodeId.trim();

      setSeedNodeDraft(trimmedSeed);
      setAppliedSeedNodeId(trimmedSeed);
      setDependencySeedBlockedDialog(null);
      setLoadError(null);
      setSelectedMode("dependencyNeighborhood");
      setSelectedViewKey("");

      if (seedChanged) {
        setRenderResult(null);
      }

      setRenderRequestGeneration((current) => current + 1);
      syncUrl({ mermaidMode: "dependencyNeighborhood", mermaidView: "", seedNodeId: trimmedSeed });

      const primaryContent = document.getElementById(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID);

      if (primaryContent != null) {
        primaryContent.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [appliedSeedNodeId, syncUrl],
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
    if (selectedSnapshotId.length === 0 || exportsDisabled || renderQuery == null) {
      return;
    }

    setExportBusy(true);
    setPngExportError(null);
    setPngBrowserFallbackNote(null);

    try {
      const query = renderQuery;

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
    exportsDisabled,
    exportableSvgMarkup,
    mermaidSource,
    renderQuery,
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

  const focusSubscriptionPicker = useCallback(() => {
    document.getElementById("infra-diagrams-subscription-picker")?.focus();
  }, []);

  const focusSnapshotPicker = useCallback(() => {
    document.getElementById("infra-diagrams-snapshot-picker")?.focus();
  }, []);

  const focusDiagramTypePicker = useCallback(() => {
    document.getElementById("infra-diagrams-mode-picker")?.focus();
  }, []);

  useDiagramsWorkbenchShortcuts(
    {
      focusSubscriptionPicker,
      focusSnapshotPicker,
      focusDiagramTypePicker,
    },
    { enabled: !buyerPolishedShell },
  );

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
        claimDiscipline={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_CLAIM_DISCIPLINE}
        claimDisciplineTestId="infra-diagrams-claim-discipline"
        titleTestId="infra-diagrams-page-title"
        metadata={<DiagramsBreadcrumb />}
      />

      <main
        id={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PRIMARY_CONTENT_ID}
        className={cn("flex w-full flex-col gap-4 scroll-mt-24")}
        data-testid="infra-diagrams-primary-content"
      >
      <InfraEvidenceSelectionAnnouncer message={selectionAnnouncement} testId="infra-diagrams-selection-announcer" />

      {deepLinkedSnapshotMissing ? (
        <StatusTag
          kind="needs-attention"
          label="Linked snapshot is not available in the diagrams workbench scope. Pick a snapshot below."
          data-testid="infra-diagrams-snapshot-deep-link-missing"
        />
      ) : null}

      {selectedSnapshotId.length > 0 && !deepLinkedSnapshotMissing ? (
        <InfraEvidenceCompletenessWarningsBanner
          warnings={completenessWarnings}
          summary={completenessSummary}
        />
      ) : null}

      {selectedSnapshotId.length > 0 && !deepLinkedSnapshotMissing ? (
        <OperatorInferredConnectionsPanel snapshotId={selectedSnapshotId} />
      ) : null}

      {selectedSnapshotId.length > 0 && !deepLinkedSnapshotMissing ? (
        <InferenceQuestionnairePanel snapshotId={selectedSnapshotId} />
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
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SCOPE_LABEL}.
          </p>
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
        className={cn(
          "grid items-start gap-x-4 gap-y-2 md:grid-cols-2",
          cnCard,
        )}
        aria-label="Subscription, snapshot, and diagram type selection"
      >
        {buyerPolishedShell ? (
          <>
            <div
              className={cn(
                "col-span-full grid min-w-0 gap-2",
                showResourceGroupDropdown ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "md:max-w-md",
              )}
            >
              <div className="grid min-w-0 gap-2">
                <select
                  id="infra-diagrams-subscription-picker"
                  className="w-full bg-transparent px-3 py-2"
                  data-testid="infra-diagrams-subscription-picker"
                  aria-label={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_LABEL}
                  disabled={loadingSnapshots || snapshots.length === 0}
                  value={selectedSubscriptionFilter}
                  onChange={(event) => handleSubscriptionFilterChange(event.target.value)}
                >
                  <option value="">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_PROMPT_TITLE}</option>
                  {subscriptionFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {showResourceGroupDropdown ? (
                <div className="grid min-w-0 gap-2">
                  <Label htmlFor="infra-diagrams-resource-group-picker">
                    {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_TITLE}
                  </Label>
                  <select
                    id="infra-diagrams-resource-group-picker"
                    className={cn("w-full", cnField)}
                    data-testid="infra-diagrams-resource-group-picker"
                    disabled={loadingPreview}
                    value={isInfraDiagramsResourceGroupMode(selectedMode) ? selectedResourceGroupName : ""}
                    onChange={(event) => handleResourceGroupPickerChange(event.target.value)}
                  >
                    <option value="">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_ALL}</option>
                    {resourceGroupPickerArtifacts.map((artifact) => (
                      <option
                        key={artifact.key}
                        value={parseInfraDiagramsResourceGroupName(artifact.key)}
                      >
                        {artifact.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="infra-diagrams-snapshot-picker">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_LABEL}</Label>
              <select
                id="infra-diagrams-snapshot-picker"
                className={cn("w-full", cnField)}
                data-testid="infra-diagrams-snapshot-picker"
                disabled={!snapshotPickerEnabled}
                value={selectedSnapshotVisibleInSubscriptionFilter ? selectedSnapshotId : ""}
                onChange={(event) => handleSnapshotChange(event.target.value)}
              >
                {visibleSnapshots.length === 0 ? (
                  <option value="">No snapshots available</option>
                ) : (
                  <>
                    {selectedSnapshotId.length === 0 || !selectedSnapshotVisibleInSubscriptionFilter ? (
                      <option value="">Select a snapshot</option>
                    ) : null}
                    {visibleSnapshots.map((snapshot) => (
                      <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                        {formatSnapshotPickerLabel(snapshot)}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div className="grid min-w-0 gap-2">
              <Label htmlFor="infra-diagrams-mode-picker">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_MODE_LABEL}</Label>
              <select
                id="infra-diagrams-mode-picker"
                className={cn("w-full", cnField)}
                data-testid="infra-diagrams-mode-picker"
                disabled={loadingPreview || !diagramTypePickerEnabled}
                value={diagramTypePickerValue}
                onChange={(event) => handleModeChange(event.target.value)}
              >
                {diagramTypePickerValue.length === 0 ? (
                  <option value="">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_TYPE_PLACEHOLDER}</option>
                ) : null}
                {INFRA_DIAGRAMS_DIAGRAM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedSnapshot != null ? (
              <div
                className="col-start-1 flex items-start gap-2"
                data-testid="infra-diagrams-snapshot-id-readout"
              >
                <span className={cn("font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {selectedSnapshot.snapshotId}
                </span>
                <CopyIdButton value={selectedSnapshot.snapshotId} aria-label="Copy snapshot id" />
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div
              className={cn(
                "col-span-full grid min-w-0 gap-2",
                showResourceGroupDropdown ? "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : "md:max-w-md",
              )}
            >
              <div className="flex min-w-0 flex-col gap-1">
                <select
                  id="infra-diagrams-subscription-picker"
                  className="w-full bg-transparent px-3 py-2"
                  data-testid="infra-diagrams-subscription-picker"
                  aria-label={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_LABEL}
                  disabled={loadingSnapshots || snapshots.length === 0}
                  value={selectedSubscriptionFilter}
                  onChange={(event) => handleSubscriptionFilterChange(event.target.value)}
                >
                  <option value="">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_PROMPT_TITLE}</option>
                  {subscriptionFilterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              {showResourceGroupDropdown ? (
                <div className="flex min-w-0 flex-col gap-1">
                  <label className={OPERATOR_FORM_FIELD_LABEL_CLASS} htmlFor="infra-diagrams-resource-group-picker">
                    {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_TITLE}
                  </label>
                  <select
                    id="infra-diagrams-resource-group-picker"
                    className={cn("w-full", cnField)}
                    data-testid="infra-diagrams-resource-group-picker"
                    disabled={loadingPreview}
                    value={isInfraDiagramsResourceGroupMode(selectedMode) ? selectedResourceGroupName : ""}
                    onChange={(event) => handleResourceGroupPickerChange(event.target.value)}
                  >
                    <option value="">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_ALL}</option>
                    {resourceGroupPickerArtifacts.map((artifact) => (
                      <option
                        key={artifact.key}
                        value={parseInfraDiagramsResourceGroupName(artifact.key)}
                      >
                        {artifact.label}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label className={OPERATOR_FORM_FIELD_LABEL_CLASS} htmlFor="infra-diagrams-snapshot-picker">
                Snapshot
              </label>
              <select
                id="infra-diagrams-snapshot-picker"
                className={cn("w-full", cnField)}
                data-testid="infra-diagrams-snapshot-picker"
                disabled={!snapshotPickerEnabled}
                value={selectedSnapshotVisibleInSubscriptionFilter ? selectedSnapshotId : ""}
                onChange={(event) => handleSnapshotChange(event.target.value)}
              >
                {visibleSnapshots.length === 0 ? (
                  <option value="">No snapshots available</option>
                ) : (
                  <>
                    {selectedSnapshotId.length === 0 || !selectedSnapshotVisibleInSubscriptionFilter ? (
                      <option value="">Select a snapshot</option>
                    ) : null}
                    {visibleSnapshots.map((snapshot) => (
                      <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                        {formatSnapshotPickerLabel(snapshot)}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>
            <div className="flex min-w-0 flex-col gap-1">
              <label className={OPERATOR_FORM_FIELD_LABEL_CLASS} htmlFor="infra-diagrams-mode-picker">
                Diagram type
              </label>
              <select
                id="infra-diagrams-mode-picker"
                className={cn("w-full", cnField)}
                data-testid="infra-diagrams-mode-picker"
                disabled={loadingPreview || !diagramTypePickerEnabled}
                value={diagramTypePickerValue}
                onChange={(event) => handleModeChange(event.target.value)}
              >
                {diagramTypePickerValue.length === 0 ? (
                  <option value="">{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_TYPE_PLACEHOLDER}</option>
                ) : null}
                {INFRA_DIAGRAMS_DIAGRAM_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {selectedSnapshot != null ? (
              <div
                className="col-start-1 flex items-start gap-2"
                data-testid="infra-diagrams-snapshot-id-readout"
              >
                <span className={cn("font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  {selectedSnapshot.snapshotId}
                </span>
                <CopyIdButton value={selectedSnapshot.snapshotId} aria-label="Copy snapshot id" />
              </div>
            ) : null}
          </>
        )}
      </section>

      {loadingSnapshots ? (
        <div
          className="flex items-center gap-2 text-al-text-secondary"
          data-testid="infra-diagrams-snapshots-loading"
          aria-live="polite"
        >
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          <span className={OPERATOR_TYPOGRAPHY.body}>Loading snapshots…</span>
        </div>
      ) : null}

      {!loadingSnapshots && snapshots.length === 0 ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_SNAPSHOTS_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_SNAPSHOTS_BODY}
          testId="infra-diagrams-empty-snapshots"
        />
      ) : null}

      <section className={cn("flex flex-col gap-3", cnCard)} aria-label="Diagram display options">
        <div>
          <p className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>Display options</p>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            Private endpoints and backup/recovery resources are hidden from the canvas by default.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={showPrivateEndpoints}
              data-testid="infra-diagrams-show-private-endpoints"
              aria-label="Show private endpoints"
              onCheckedChange={handlePrivateEndpointsToggle}
            />
            <span className={OPERATOR_TYPOGRAPHY.body}>Show private endpoints</span>
          </label>
          {selectedMode !== "businessContinuity" ? (
            <label className="flex items-center gap-2">
              <Checkbox
                checked={includeRecoveryServices}
                data-testid="infra-diagrams-include-recovery-services"
                aria-label="Include backup and recovery"
                onCheckedChange={handleIncludeRecoveryServicesToggle}
              />
              <span className={OPERATOR_TYPOGRAPHY.body}>Include backup and recovery</span>
            </label>
          ) : null}
        </div>
      </section>

      {selectedMode === "dependencyNeighborhood" ? (
        <section className={cn("flex flex-col gap-3", cnCard)} aria-label="Dependency neighborhood drill-down">
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SEED_NODE_HELPER}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="infra-diagrams-choose-another-view"
              onClick={() => {
                const modePicker = document.getElementById("infra-diagrams-mode-picker");

                modePicker?.scrollIntoView({ behavior: "smooth", block: "center" });

                if (modePicker instanceof HTMLSelectElement) {
                  modePicker.focus();
                }
              }}
            >
              Choose another diagram
            </Button>
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              Return to the diagram type selector.
            </span>
          </div>
          <div className="flex flex-wrap items-end gap-3">
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
                        {resolveInfraEvidenceDiagramOutlineResourceName(node)}
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
                </label>
                <Button type="button" variant="outline" onClick={handleSeedNodeApply}>
                  {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_FOCUS_ACTION}
                </Button>
              </>
            )}
          </div>
        </section>
      ) : null}

      {diagramTypeSelected
      && isInfraDiagramsExecutiveMode(selectedMode)
      && selectedSnapshotId.length > 0
      && !deepLinkedSnapshotMissing ? (
        <section
          className={cn("flex flex-col gap-3", cnCard)}
          aria-label={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EXECUTIVE_ALWAYS_SHOW_TITLE}
          data-testid="infra-diagrams-executive-always-show"
        >
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EXECUTIVE_ALWAYS_SHOW_TITLE}
          </h2>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EXECUTIVE_ALWAYS_SHOW_BODY}
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {INFRA_DIAGRAMS_EXECUTIVE_TIERS.map((tier) => {
              const visible = !hiddenExecutiveTierKeys.includes(tier.key);

              return (
                <label
                  key={tier.key}
                  className="flex min-w-0 items-center gap-2"
                  data-testid={`infra-diagrams-executive-tier-${tier.key}`}
                >
                  <Checkbox
                    checked={visible}
                    disabled={selectedSnapshotId.length === 0 || deepLinkedSnapshotMissing || loadingRender}
                    aria-label={tier.label}
                    onCheckedChange={(checked) => {
                      handleExecutiveTierVisibilityChange(tier.key, checked === true);
                    }}
                  />
                  <span className={OPERATOR_TYPOGRAPHY.body}>{tier.label}</span>
                </label>
              );
            })}
          </div>
        </section>
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
            {resourceGroupPickerArtifacts.map((artifact) => (
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
        </div>
      ) : null}

      {densityCoachPresentation != null ? (
        <section
          className={cn("grid gap-3", cnCard)}
          aria-label="Diagram density coach"
          data-testid="infra-diagrams-density-coach"
          data-coach-variant={densityCoachPresentation.variant}
        >
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{densityCoachPresentation.title}</h2>
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {densityCoachPresentation.body}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="primary" data-testid="infra-diagrams-density-coach-executive" onClick={() => handleModeChange("executive")}>
              Executive
            </Button>
            {resourceGroupFallbackArtifacts.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                data-testid="infra-diagrams-density-coach-resource-group"
                onClick={() => {
                  if (showResourceGroupDropdown) {
                    document.getElementById("infra-diagrams-resource-group-picker")?.focus();
                    return;
                  }

                  handleModeChange("resourceGroup");
                }}
              >
                Pick a resource group
              </Button>
            ) : null}
            <Button type="button" variant="outline" data-testid="infra-diagrams-density-coach-neighborhood" onClick={() => handleModeChange("dependencyNeighborhood")}>
              Dependency neighborhood
            </Button>
          </div>
        </section>
      ) : null}

      <section className={cn("flex flex-col gap-3", cnCard)} aria-label="Diagram export actions">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-2">
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="infra-diagrams-png-export-disclaimer"
            >
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_PNG_EXPORT_DISCLAIMER}
            </p>
          </div>
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
              Export Mermaid
            </Button>
          </div>
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
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
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

      {awaitingSnapshotSelection ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_PROMPT_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SNAPSHOT_PROMPT_BODY}
          testId="infra-diagrams-snapshot-prompt"
        />
      ) : awaitingDiagramTypeSelection ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_TYPE_PROMPT_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_TYPE_PROMPT_BODY}
          testId="infra-diagrams-type-prompt"
        />
      ) : dependencyNeighborhoodAwaitingSeed ? (
        <>
          {loadingSeedCatalog ? (
            <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400" aria-live="polite">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              <span className={OPERATOR_TYPOGRAPHY.body}>Loading starting resources…</span>
            </div>
          ) : null}
          {visibleSeedCatalogOutline != null && visibleSeedCatalogOutline.nodes.length > 0 ? (
            <InfraEvidenceDiagramOutline
              outline={visibleSeedCatalogOutline}
              onFocusNeighborhood={handleOutlineFocusNeighborhood}
            />
          ) : (
            <EnterpriseCompactEmptyState
              title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_PROMPT_TITLE}
              description={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DEPENDENCY_SEED_PROMPT_BODY}
              testId="infra-diagrams-dependency-seed-prompt"
            />
          )}
        </>
      ) : resourceGroupPickerAwaitingSelection ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_PROMPT_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_PICKER_PROMPT_BODY}
          testId="infra-diagrams-resource-group-picker-prompt"
        />
      ) : tooLargeForBrowser ? (
        <>
          <div className={cn("rounded-md border p-4", DESIGN_TOKENS.callout.warn)}>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              {INFRA_EVIDENCE_MERMAID_TOO_LARGE_FOR_BROWSER_MESSAGE}
            </p>
            <div className="mt-3">
              <Button type="button" variant="outline" size="sm" disabled={exportsDisabled} onClick={() => void runPngExport()}>
                Download server PNG
              </Button>
            </div>
          </div>
          {visibleMermaidOutline != null ? (
            <InfraEvidenceDiagramOutline
              outline={visibleMermaidOutline}
              onFocusNeighborhood={handleOutlineFocusNeighborhood}
            />
          ) : null}
        </>
      ) : showGenericEmptyContent ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_EMPTY_CONTENT_BODY}
          testId="infra-diagrams-empty-content"
        />
      ) : paintDiagramCanvas ? (
        <>
          {isResourceGroupMapDiagram ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="infra-diagrams-resource-group-map-caption"
            >
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RESOURCE_GROUP_MAP_CAPTION}
            </p>
          ) : null}
          {isBackboneKeepDiagram ? (
            <p
              className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="infra-diagrams-backbone-keep-caption"
            >
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_BACKBONE_KEEP_CAPTION}
            </p>
          ) : null}
          {dataFlowCaptionPresentation != null ? (
            <InfraEvidenceDataFlowCaptionDisclosure presentation={dataFlowCaptionPresentation} />
          ) : null}
          {diagramWalkthrough != null ? (
            <div className="flex flex-col gap-2">
              <p
                className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                role="status"
                data-testid="infra-diagrams-walkthrough"
              >
                {diagramWalkthrough}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={includeNeverShow ? "secondary" : "outline"}
                  aria-pressed={includeNeverShow}
                  aria-busy={loadingRender}
                  data-testid="infra-diagrams-include-never-show"
                  disabled={selectedSnapshotId.length === 0 || deepLinkedSnapshotMissing}
                  onClick={() => {
                    handleIncludeNeverShowChange(!includeNeverShow);
                  }}
                >
                  {loadingRender ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : null}
                  {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_INCLUDE_NEVER_SHOW_LABEL}
                </Button>
              </div>
              {!includeNeverShow && alwaysExcludedCollapseEntries.length > 0 ? (
                <div
                  className="rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
                  data-testid="infra-diagrams-always-excluded-panel"
                >
                  <h3 className={cn("m-0 mb-2", OPERATOR_TYPOGRAPHY.cardTitle)}>
                    {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_ALWAYS_EXCLUDED_TITLE}
                  </h3>
                  <ul className={cn("m-0 list-disc pl-5", OPERATOR_TYPOGRAPHY.helper)}>
                    {alwaysExcludedCollapseEntries.map((entry, index) => (
                      <li key={`${entry.kind}-${entry.reason}-${index}`}>{entry.reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
          <ArchitectureDiagramViewer
            mermaidSource={displayMermaidSource}
            layoutSvg={displayLayoutSvg.length > 0 ? displayLayoutSvg : null}
            textAlternative={`Inventory diagram for snapshot ${selectedSnapshotDisplayLabel ?? selectedSnapshotId} in ${selectedModeLabel} mode.`}
            viewportAriaLabel={`Inventory diagram for snapshot ${selectedSnapshotDisplayLabel ?? selectedSnapshotId}`}
            fullscreenTitle={`Inventory diagram · ${selectedModeLabel}`}
            scopeContextLine={diagramScopeContextLine}
            canvasStale={renderInFlight}
            viewportControlsLayout="stacked"
            cameraMaxHeightClassName="max-h-[42rem]"
            focusNodeIds={cameraFocusNodeIds}
            focusNonce={cameraFocusNonce}
            onRenderFailure={handleRenderFailure}
            onRetry={handleRenderRetry}
            onExportableSvgMarkupChange={setExportableSvgMarkup}
          />
          <InfraEvidenceDiagramLegend
            outline={visibleMermaidOutline}
            mermaidSource={displayMermaidSource}
            layoutSvg={displayLayoutSvg}
          />
          {visibleMermaidOutline != null ? (
            <InfraEvidenceDiagramOutline
              outline={visibleMermaidOutline}
              onFocusNeighborhood={handleOutlineFocusNeighborhood}
            />
          ) : null}
        </>
      ) : renderResult?.status === "Failed" ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RENDER_FAILED_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_RENDER_FAILED_BODY}
          testId="infra-diagrams-render-failed"
          footer={
            <Button type="button" size="sm" variant="primary" onClick={handleRenderRetry}>
              Retry render
            </Button>
          }
        />
      ) : null}

        <DiagramsClaimOrientationStrip />
        <InfraEvidenceWorkbenchBuildProvenanceStrip testId="infra-diagrams-build-provenance-limitation" />
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

      <AlertDialog
        open={subscriptionChangeConfirmOpen}
        onOpenChange={(open) => {
          setSubscriptionChangeConfirmOpen(open);

          if (!open) {
            setPendingSubscriptionFilter(null);
          }
        }}
      >
        <AlertDialogContent data-testid="infra-diagrams-subscription-change-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_TITLE}</AlertDialogTitle>
            <AlertDialogDescription>
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_BODY}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="infra-diagrams-subscription-change-cancel">
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_CANCEL}
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="infra-diagrams-subscription-change-confirm"
              onClick={handleSubscriptionChangeConfirm}
            >
              {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_SUBSCRIPTION_CHANGE_DIALOG_CONFIRM}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </OperatorPageContainer>
  );
}
