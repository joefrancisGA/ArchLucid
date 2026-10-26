"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InfraAuditLineageUnavailableBanner } from "@/components/infra-evidence/InfraAuditLineageUnavailableBanner";
import { InfraEvidenceAuditScopeBar } from "@/components/infra-evidence/InfraEvidenceAuditScopeBar";
import { InfraEvidenceWorkbenchHeaderActions } from "@/components/infra-evidence/InfraEvidenceWorkbenchHeaderActions";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTabs,
  EnterpriseTabsContent,
  EnterpriseTabsList,
  EnterpriseTabsTrigger,
} from "@/components/ui/enterprise-tabs";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { infrastructureResourcesPathForProductLine } from "@/lib/product-line/securenow-infrastructure-resources-route";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OPEN_ACTION,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_ARM_RESOURCE_PATH_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CLOUD_RESOURCE_ID_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CONFIG_EMPTY_BODY,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CONFIG_EMPTY_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_DIAGRAM_EMPTY_BODY,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_DIAGRAM_EMPTY_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_DRIFT_EMPTY_BODY,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_DRIFT_EMPTY_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_FINDINGS_EMPTY_BODY,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_FINDINGS_EMPTY_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_REMEDIATION_EMPTY_BODY,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_REMEDIATION_EMPTY_TITLE,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_TERRAFORM_ADDRESS_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import {
  formatInfraEvidenceChangeTypeLabel,
  resolveInfraEvidenceChangeTypeStatusKind,
} from "@/lib/infra-evidence/infra-evidence-drift-display";
import {
  buildAuditEvidenceLineageUiPath,
  buildResourceHubDiagramReconcileWorkbenchHref,
  buildResourceHubDiagramsWorkbenchHref,
  buildResourceHubDriftWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-ask-citations";
import {
  buildDriftWorkbenchHref,
  buildRemediationWorkbenchHref,
  buildResourceHubWorkbenchHref,
  buildResourceScopedWorkbenchHref,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";
import { buildDiagramReconcileRemediationHref } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-filter-url";
import { buildTerraformWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-terraform-filter-url";
import { buildScopedHubDriftChangeWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-scoped-workbench-href";
import { buildInfraEvidenceClearAuditScopeHref } from "@/lib/infra-evidence/infra-evidence-audit-scope-url";
import { sanitizeResourceHubQueryForTab } from "@/lib/infra-evidence/infra-evidence-hub-tab-query";
import { formatInfraEvidenceHubApiError } from "@/lib/infra-evidence/infra-evidence-hub-api";
import { normalizeSecureNowResourceNameForDisplay } from "@/lib/infra-evidence/format-azure-resource-display";
import { isUuidLike } from "@/lib/resolve-governance-finding-resource-group";
import {
  createRemediationInstance,
  formatInfraEvidenceRemediationApiError,
  matchOperationalFinding,
} from "@/lib/infra-evidence/infra-evidence-remediation-api";
import { buildInfrastructureAskHandoffHref } from "@/lib/infra-evidence/infrastructure-ask-drawer-url";
import {
  parseResourceHubQueryValueFromSearch,
  parseResourceHubTabFromSearch,
  resolveInfrastructureAskAuditContext,
  resourceExplorerFilterHrefFromSearch,
  resourceHubFilterHrefFromSearch,
  toWorkbenchLinkAuditContext,
  type InfrastructureAskAuditContext,
  RESOURCE_EXPLORER_WORK_QUEUE_PARAM,
  RESOURCE_HUB_ASSESSMENT_ID_PARAM,
  RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_CONTROL_ID_PARAM,
  RESOURCE_HUB_RUN_ID_PARAM,
  RESOURCE_HUB_SNAPSHOT_ID_PARAM,
  RESOURCE_HUB_TAB_PARAM,
} from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM,
  buildInfraResourceHubTechnicalDisclosureScopedHref,
  parseInfraResourceHubTechnicalKeyFromSearch,
} from "@/lib/infra-evidence/infra-resource-hub-technical-disclosure-url";
import {
  formatCloudResourceExplorerWorkQueueLabel,
  parseResourceExplorerWorkQueueFromSearch,
} from "@/lib/infra-evidence/infra-evidence-explorer-work-queue";
import { buildInfraEvidenceAuditControlOptions } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
import {
  hasStaleInfraEvidenceAuditUrlParams,
  parseInfraEvidenceWorkbenchAuditScopeFromSearch,
} from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import { InfraEvidenceAuditScopeChip } from "@/components/infra-evidence/InfraEvidenceAuditScopeChip";
import {
  fetchCachedInfraEvidenceResourceHub,
  invalidateInfraEvidenceResourceHubCacheForResource,
} from "@/lib/infra-evidence/infra-evidence-resource-hub-cache";
import type {
  CloudResourceAuditLineageMatch,
  CloudResourceEvidenceHubResponse,
  CloudResourceInventoryChangeSummary,
  ResourceHubTab,
} from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  formatAuditLineageControlLinkLabel,
  formatResourceHubFindingStreamCaption,
  formatStoredInfraEvidenceHubField,
  remediationInstanceStatusTagKind,
  formatDiagramCorrespondenceConfidenceBandLabel,
  resolveDiagramCorrespondenceConfidenceStatusKind,
  resolveDiagramCorrespondenceStatusKind,
} from "@/lib/infra-evidence/infra-evidence-resource-hub-display";
import { RESOURCE_HUB_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-resource-hub-page-shortcuts";
import { findingStatusTagKind } from "@/app/(operator)/architecture/reviews/[reviewId]/findings/[findingId]/_sections/finding-detail-route-display";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";

import { ResourceHubBreadcrumb } from "./ResourceHubBreadcrumb";
import { ResourceHubClaimOrientationStrip } from "./ResourceHubClaimOrientationStrip";
import { ResourceHubCreateRemediationConfirmDialog } from "./ResourceHubCreateRemediationConfirmDialog";
import { ResourceHubDriftChangesTable } from "./ResourceHubDriftChangesTable";
import { ResourceHubSnapshotScopeStrip } from "./ResourceHubSnapshotScopeStrip";
import { useResourceHubShortcuts } from "./use-resource-hub-shortcuts";

const HUB_TABS: readonly { readonly id: ResourceHubTab; readonly label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "drift", label: "Drift" },
  { id: "diagram", label: "Diagram" },
  { id: "terraform", label: "Terraform" },
  { id: "findings", label: "Findings" },
  { id: "remediation", label: "Remediation" },
  { id: "audit", label: "Audit lineage" },
];

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

const cnCardDashed =
  "rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-900/20";

type ResourceHubClientProps = {
  readonly cloudResourceId: string;
};

type ResourceHubExplorerWorkQueue = ReturnType<typeof parseResourceExplorerWorkQueueFromSearch>;

function infrastructureAskWorkQueueForExplorer(explorerWorkQueue: ResourceHubExplorerWorkQueue) {
  return explorerWorkQueue !== "all" ? explorerWorkQueue : undefined;
}

function buildHubDriftChangeWorkbenchHref(
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  change: CloudResourceInventoryChangeSummary,
  auditContext: InfrastructureAskAuditContext,
): string {
  return buildScopedHubDriftChangeWorkbenchHref(cloudResourceId, snapshotId, change, auditContext, runId);
}

function buildHubDriftChangeAskHref(
  pathname: string,
  currentSearch: string,
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  change: CloudResourceInventoryChangeSummary,
  auditContext: InfrastructureAskAuditContext = {},
  explorerWorkQueue: ResourceHubExplorerWorkQueue = "all",
): string {
  return buildInfrastructureAskHandoffHref(pathname, currentSearch, {
    cloudResourceId,
    snapshotId,
    runId: runId.length > 0 ? runId : undefined,
    diffId: change.diffId,
    hubTab: "drift",
    workQueue: infrastructureAskWorkQueueForExplorer(explorerWorkQueue),
    ...auditContext,
  });
}

function buildHubFindingAskHref(
  pathname: string,
  currentSearch: string,
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  findingId: string,
  auditContext: InfrastructureAskAuditContext = {},
  explorerWorkQueue: ResourceHubExplorerWorkQueue = "all",
): string {
  return buildInfrastructureAskHandoffHref(pathname, currentSearch, {
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    findingId,
    hubTab: "findings",
    workQueue: infrastructureAskWorkQueueForExplorer(explorerWorkQueue),
    ...auditContext,
  });
}

function buildHubRemediationAskHref(
  pathname: string,
  currentSearch: string,
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  instanceId: string,
  auditContext: InfrastructureAskAuditContext = {},
  explorerWorkQueue: ResourceHubExplorerWorkQueue = "all",
): string {
  return buildInfrastructureAskHandoffHref(pathname, currentSearch, {
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    instanceId,
    hubTab: "remediation",
    workQueue: infrastructureAskWorkQueueForExplorer(explorerWorkQueue),
    ...auditContext,
  });
}

function buildHubAuditLineageAskHref(
  pathname: string,
  currentSearch: string,
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  context: {
    readonly assessmentId: string;
    readonly auditEvidenceSnapshotId: string;
    readonly controlId: string;
  },
  explorerWorkQueue: ResourceHubExplorerWorkQueue = "all",
): string {
  return buildInfrastructureAskHandoffHref(pathname, currentSearch, {
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    assessmentId: context.assessmentId,
    auditEvidenceSnapshotId: context.auditEvidenceSnapshotId,
    controlId: context.controlId,
    hubTab: "audit",
    workQueue: infrastructureAskWorkQueueForExplorer(explorerWorkQueue),
  });
}

function buildHubAuditLineageTabHref(
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  context: {
    readonly assessmentId: string;
    readonly auditEvidenceSnapshotId: string;
    readonly controlId: string;
  },
  explorerWorkQueue: ReturnType<typeof parseResourceExplorerWorkQueueFromSearch>,
): string {
  return buildHubScopedTabHref(cloudResourceId, "audit", snapshotId, runId, {
    assessmentId: context.assessmentId,
    auditEvidenceSnapshotId: context.auditEvidenceSnapshotId,
    controlId: context.controlId,
  }, explorerWorkQueue);
}

function buildHubScopedTabHref(
  cloudResourceId: string,
  tab: ResourceHubTab,
  snapshotId: string,
  runId: string,
  auditContext: InfrastructureAskAuditContext = {},
  explorerWorkQueue: ReturnType<typeof parseResourceExplorerWorkQueueFromSearch> = "all",
): string {
  return buildResourceHubWorkbenchHref({
    cloudResourceId,
    tab,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    workQueue: explorerWorkQueue !== "all" ? explorerWorkQueue : undefined,
    assessmentId: auditContext.assessmentId,
    auditEvidenceSnapshotId: auditContext.auditEvidenceSnapshotId,
    controlId: auditContext.controlId,
  });
}

function buildHubDiagramCorrespondenceAskHref(
  pathname: string,
  currentSearch: string,
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  correspondenceId: string,
  auditContext: InfrastructureAskAuditContext = {},
  explorerWorkQueue: ResourceHubExplorerWorkQueue = "all",
): string {
  return buildInfrastructureAskHandoffHref(pathname, currentSearch, {
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    correspondenceId,
    hubTab: "diagram",
    workQueue: infrastructureAskWorkQueueForExplorer(explorerWorkQueue),
    ...auditContext,
  });
}

export function ResourceHubClient(props: ResourceHubClientProps) {
  const { cloudResourceId } = props;
  const buyerPolishedShell = useProductionEvalChrome();
  const { productLine } = useProductLine();
  const resourcesPath = infrastructureResourcesPathForProductLine(productLine);
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const infrastructureAskHandoffSearch = searchParams.toString();
  const activeTab = parseResourceHubTabFromSearch(searchParams.get(RESOURCE_HUB_TAB_PARAM));
  const runId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_RUN_ID_PARAM));
  const snapshotId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_SNAPSHOT_ID_PARAM));
  const assessmentId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_ASSESSMENT_ID_PARAM));
  const auditEvidenceSnapshotId = parseResourceHubQueryValueFromSearch(
    searchParams.get(RESOURCE_HUB_AUDIT_SNAPSHOT_ID_PARAM),
  );
  const controlId = parseResourceHubQueryValueFromSearch(searchParams.get(RESOURCE_HUB_CONTROL_ID_PARAM));
  const workQueue = parseResourceExplorerWorkQueueFromSearch(searchParams.get(RESOURCE_EXPLORER_WORK_QUEUE_PARAM));
  const workQueueLabel = formatCloudResourceExplorerWorkQueueLabel(workQueue);
  const infraResourceHubTechnicalKeyParam = searchParams.get(INFRA_RESOURCE_HUB_TECHNICAL_KEY_PARAM);
  const [infraResourceHubTechnicalKey, setInfraResourceHubTechnicalKeyState] = useState(() =>
    parseInfraResourceHubTechnicalKeyFromSearch(infraResourceHubTechnicalKeyParam),
  );

  useEffect(() => {
    setInfraResourceHubTechnicalKeyState(parseInfraResourceHubTechnicalKeyFromSearch(infraResourceHubTechnicalKeyParam));
  }, [infraResourceHubTechnicalKeyParam]);

  const [hub, setHub] = useState<CloudResourceEvidenceHubResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [findingActionBusyId, setFindingActionBusyId] = useState<string | null>(null);
  const [findingActionMessages, setFindingActionMessages] = useState<
    Record<string, { readonly message: string; readonly instanceId: string | null }>
  >({});
  const loadRequestGeneration = useRef(0);
  const [pendingRemediationFinding, setPendingRemediationFinding] = useState<{
    readonly id: string;
    readonly title: string;
  } | null>(null);

  const resolvedSnapshotId = useMemo(() => {
    if (snapshotId.length > 0) {
      return snapshotId;
    }

    return hub?.currentConfiguration?.snapshotId ?? "";
  }, [hub?.currentConfiguration?.snapshotId, snapshotId]);

  const snapshotPinned = snapshotId.length > 0;

  const syncInfraResourceHubTechnicalKeyToUrl = useCallback(
    (technicalKey: string | null) => {
      router.replace(
        buildInfraResourceHubTechnicalDisclosureScopedHref(
          cloudResourceId,
          searchParams.toString(),
          technicalKey,
          pathname,
          {
            snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : undefined,
            runId: runId.length > 0 ? runId : undefined,
          },
        ),
        { scroll: false },
      );
    },
    [cloudResourceId, pathname, resolvedSnapshotId, router, runId, searchParams],
  );

  const setInfraResourceHubTechnicalKey = useCallback(
    (technicalKey: string | null) => {
      setInfraResourceHubTechnicalKeyState(technicalKey ?? "");
      syncInfraResourceHubTechnicalKeyToUrl(technicalKey);
    },
    [syncInfraResourceHubTechnicalKeyToUrl],
  );

  const explorerBackHref = useMemo(
    () => (workQueue !== "all" ? resourceExplorerFilterHrefFromSearch("", { workQueue }) : resourcesPath),
    [resourcesPath, workQueue],
  );

  const loadHub = useCallback(async (options?: { retainFindingMessages?: boolean }) => {
    const requestGeneration = loadRequestGeneration.current + 1;
    loadRequestGeneration.current = requestGeneration;
    if (!options?.retainFindingMessages) {
      setFindingActionMessages({});
    }
    setLoading(true);
    setLoadError(null);

    try {
      const response = await fetchCachedInfraEvidenceResourceHub(cloudResourceId, {
        runId,
        snapshotId,
        assessmentId,
        auditEvidenceSnapshotId,
        controlId,
      });

      // A URL change can leave an older request in flight; only its latest generation may update the hub.
      if (requestGeneration !== loadRequestGeneration.current) {
        return;
      }

      setHub(response);
    } catch (error: unknown) {

      if (requestGeneration !== loadRequestGeneration.current) {
        return;
      }

      setLoadError(formatInfraEvidenceHubApiError(error));
      setHub(null);
    } finally {

      if (requestGeneration !== loadRequestGeneration.current) {
        return;
      }

      setLoading(false);
    }
  }, [assessmentId, auditEvidenceSnapshotId, cloudResourceId, controlId, runId, snapshotId]);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  const setActiveTab = useCallback((tab: ResourceHubTab) => {
    setFindingActionMessages({});
    const sanitizedSearch = sanitizeResourceHubQueryForTab(searchParams.toString(), tab);
    const nextHref = resourceHubFilterHrefFromSearch(cloudResourceId, sanitizedSearch, {
      tab,
      snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : undefined,
      runId: runId.length > 0 ? runId : undefined,
    });
    router.replace(nextHref);
  }, [cloudResourceId, resolvedSnapshotId, router, runId, searchParams]);

  useResourceHubShortcuts({
    enabled: hub != null,
    setActiveTab,
    explorerHref: explorerBackHref,
  });

  const resourceTitle = useMemo(() => {
    if (hub == null) {
      return isUuidLike(cloudResourceId) ? "Resource name was not stored." : cloudResourceId;
    }

    const lastCapturedResourcePathSegment = (resourceId: string | null | undefined): string | undefined => {
      if (resourceId == null || resourceId.endsWith("/")) {
        return undefined;
      }

      const segment = resourceId.split("/").filter(Boolean).pop();
      const trimmed = segment?.trim() ?? "";

      return trimmed.length > 0 ? trimmed : undefined;
    };

    const configName = lastCapturedResourcePathSegment(hub.currentConfiguration?.azureResourceId);
    const externalResourceName = lastCapturedResourcePathSegment(hub.externalResourceId);
    const rawTitle = configName ?? externalResourceName ?? cloudResourceId;

    if (rawTitle === cloudResourceId && isUuidLike(rawTitle)) {
      return "Resource name was not stored.";
    }

    return normalizeSecureNowResourceNameForDisplay(rawTitle);
  }, [cloudResourceId, hub]);

  const resolvedAuditLineage = useMemo(() => {
    if (hub?.auditLineageLink.available !== true) {
      return null;
    }

    const urlSpecifiesFullAuditScope =
      assessmentId.length > 0
      && auditEvidenceSnapshotId.length > 0
      && controlId.length > 0;

    let resolvedAssessmentId = (
      assessmentId.length > 0 ? assessmentId : hub.auditLineageLink.assessmentId ?? ""
    ).trim();
    let resolvedAuditSnapshotId = (
      auditEvidenceSnapshotId.length > 0
        ? auditEvidenceSnapshotId
        : hub.auditLineageLink.auditEvidenceSnapshotId ?? ""
    ).trim();
    let resolvedControlId = (
      controlId.length > 0 ? controlId : hub.auditLineageLink.controlId ?? ""
    ).trim();

    if (
      !urlSpecifiesFullAuditScope
      && hub.auditLineageLink.matches.length > 0
      && (
        resolvedAssessmentId.length === 0
        || resolvedAuditSnapshotId.length === 0
        || resolvedControlId.length === 0
      )
    ) {
      const primaryMatch = hub.auditLineageLink.matches[0];

      if (resolvedAssessmentId.length === 0) {
        resolvedAssessmentId = primaryMatch.assessmentId.trim();
      }

      if (resolvedAuditSnapshotId.length === 0) {
        resolvedAuditSnapshotId = primaryMatch.auditEvidenceSnapshotId.trim();
      }

      if (resolvedControlId.length === 0) {
        resolvedControlId = primaryMatch.controlId.trim();
      }
    }

    if (
      resolvedAssessmentId.length === 0
      || resolvedAuditSnapshotId.length === 0
      || resolvedControlId.length === 0
    ) {
      return null;
    }

    const activeMatch = hub.auditLineageLink.matches.find(
      (match) =>
        match.assessmentId.trim() === resolvedAssessmentId
        && match.auditEvidenceSnapshotId.trim() === resolvedAuditSnapshotId
        && match.controlId.trim() === resolvedControlId,
    );

    if (activeMatch == null) {
      return null;
    }

    const labelParts = [activeMatch.controlNumber, activeMatch.controlTitle];

    const filteredLabelParts = labelParts.filter((part) => part != null && part.trim().length > 0);

    return {
      assessmentId: resolvedAssessmentId,
      auditEvidenceSnapshotId: resolvedAuditSnapshotId,
      controlId: resolvedControlId,
      label: filteredLabelParts.length > 0 ? filteredLabelParts.join(" · ") : "Open audit control lineage",
      matches: hub.auditLineageLink.matches,
    };
  }, [assessmentId, auditEvidenceSnapshotId, controlId, hub]);

  const auditControlOptions = useMemo(
    () => buildInfraEvidenceAuditControlOptions(hub),
    [hub],
  );

  const switchActiveAuditControl = useCallback((match: CloudResourceAuditLineageMatch) => {
    const nextHref = resourceHubFilterHrefFromSearch(cloudResourceId, searchParams.toString(), {
      tab: activeTab,
      snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : undefined,
      runId: runId.length > 0 ? runId : undefined,
      assessmentId: match.assessmentId,
      auditEvidenceSnapshotId: match.auditEvidenceSnapshotId,
      controlId: match.controlId,
    });
    router.replace(nextHref);
  }, [activeTab, cloudResourceId, resolvedSnapshotId, router, runId, searchParams]);

  const askAuditContext = useMemo((): InfrastructureAskAuditContext => {
    if (resolvedAuditLineage != null) {
      return {
        assessmentId: resolvedAuditLineage.assessmentId,
        auditEvidenceSnapshotId: resolvedAuditLineage.auditEvidenceSnapshotId,
        controlId: resolvedAuditLineage.controlId,
      };
    }

    const payloadContext = hub?.auditLineageLink.available === true
      ? {
          assessmentId: hub.auditLineageLink.assessmentId ?? undefined,
          auditEvidenceSnapshotId: hub.auditLineageLink.auditEvidenceSnapshotId ?? undefined,
          controlId: hub.auditLineageLink.controlId ?? undefined,
        }
      : null;

    return resolveInfrastructureAskAuditContext(
      {
        assessmentId,
        auditEvidenceSnapshotId,
        controlId,
      },
      payloadContext,
    );
  }, [assessmentId, auditEvidenceSnapshotId, controlId, hub, resolvedAuditLineage]);

  const workbenchLinkAuditContext = useMemo(
    () => toWorkbenchLinkAuditContext(askAuditContext),
    [askAuditContext],
  );

  const hasStaleAuditUrlParams = useMemo(
    () => hasStaleInfraEvidenceAuditUrlParams(searchParams),
    [searchParams],
  );

  const auditScopeActive = parseInfraEvidenceWorkbenchAuditScopeFromSearch(searchParams) != null;

  const hasUnlinkedAuditScopeInUrl = useMemo(() => {
    const auditScope = parseInfraEvidenceWorkbenchAuditScopeFromSearch(searchParams);

    if (auditScope == null || hub?.auditLineageLink.available !== true) {
      return false;
    }

    return !hub.auditLineageLink.matches.some(
      (match) =>
        match.assessmentId.trim() === auditScope.assessmentId.trim()
        && match.auditEvidenceSnapshotId.trim() === auditScope.auditEvidenceSnapshotId.trim()
        && match.controlId.trim() === auditScope.controlId.trim(),
    );
  }, [hub, searchParams]);

  const showStaleAuditScopeBanner = hasStaleAuditUrlParams || hasUnlinkedAuditScopeInUrl;

  const auditScopeChipHref = useMemo(() => {
    if (!auditScopeActive) {
      return null;
    }

    return resourceHubFilterHrefFromSearch(cloudResourceId, searchParams.toString(), {
      tab: "audit",
      snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : undefined,
      runId: runId.length > 0 ? runId : undefined,
      assessmentId: workbenchLinkAuditContext?.assessmentId,
      auditEvidenceSnapshotId: workbenchLinkAuditContext?.auditEvidenceSnapshotId,
      controlId: workbenchLinkAuditContext?.controlId,
      workQueue: workQueue !== "all" ? workQueue : undefined,
    });
  }, [
    auditScopeActive,
    cloudResourceId,
    resolvedSnapshotId,
    runId,
    searchParams,
    workQueue,
    workbenchLinkAuditContext,
  ]);

  const hubTabs = useMemo(() => {
    if (hub == null) {
      return HUB_TABS;
    }

    const openFindingsCount =
      hub.operationalSecurityFindings.totalCount + hub.architectureReviewFindings.totalCount;

    return HUB_TABS.map((tab) => {
      if (tab.id === "findings" && openFindingsCount > 0) {
        return {
          ...tab,
          label: `Findings (${openFindingsCount})`,
        };
      }

      if (tab.id === "remediation" && hub.remediationInstances.totalCount > 0) {
        return {
          ...tab,
          label: `Remediation (${hub.remediationInstances.totalCount})`,
        };
      }

      if (tab.id === "drift" && hub.recentChanges.length > 0) {
        return {
          ...tab,
          label: `Drift (${hub.recentChanges.length})`,
        };
      }

      return tab;
    });
  }, [hub]);

  const openFindingsCount = useMemo(() => {
    if (hub == null) {
      return 0;
    }

    return hub.operationalSecurityFindings.totalCount + hub.architectureReviewFindings.totalCount;
  }, [hub]);

  const terraformAddressDisplayLabel = useMemo(
    () => formatStoredInfraEvidenceHubField(hub?.terraformAddress, "Terraform address was not stored."),
    [hub?.terraformAddress],
  );

  const hasTerraformMapping = terraformAddressDisplayLabel !== "Terraform address was not stored.";

  const terraformGenerationMethodDisplayLabel = useMemo(
    () =>
      formatStoredInfraEvidenceHubField(
        hub?.terraformGenerationMethod,
        "Terraform generation method was not stored.",
      ),
    [hub?.terraformGenerationMethod],
  );

  const diagramCorrespondenceExplainDisplayLabel = useMemo(
    () =>
      formatStoredInfraEvidenceHubField(
        hub?.diagramCorrespondence?.explainText,
        "Correspondence explanation was not stored.",
      ),
    [hub?.diagramCorrespondence?.explainText],
  );

  const diagramCorrespondenceMatchKindDisplayLabel = useMemo(
    () =>
      formatStoredInfraEvidenceHubField(
        hub?.diagramCorrespondence?.matchKind,
        "Match kind was not stored.",
      ),
    [hub?.diagramCorrespondence?.matchKind],
  );

  const externalResourceIdDisplayLabel = useMemo(
    () => formatStoredInfraEvidenceHubField(hub?.externalResourceId, "ARM resource path was not stored."),
    [hub?.externalResourceId],
  );

  const diagramCorrespondenceIdTrimmed = useMemo(
    () => hub?.diagramCorrespondence?.correspondenceId?.trim() ?? "",
    [hub?.diagramCorrespondence?.correspondenceId],
  );

  const diagramCorrespondenceRemediationHref = useMemo(() => {
    if (hub?.diagramCorrespondence == null || diagramCorrespondenceIdTrimmed.length === 0) {
      return null;
    }

    return buildDiagramReconcileRemediationHref({
      row: hub.diagramCorrespondence,
      runId,
      snapshotId: resolvedSnapshotId,
      scopedCloudResourceId: cloudResourceId,
      ...workbenchLinkAuditContext,
    });
  }, [
    cloudResourceId,
    diagramCorrespondenceIdTrimmed,
    hub?.diagramCorrespondence,
    resolvedSnapshotId,
    runId,
    workbenchLinkAuditContext,
  ]);

  const runCreateRemediationFromFinding = async (findingId: string) => {
    const trimmedFindingId = findingId.trim();

    if (trimmedFindingId.length === 0) {
      return;
    }

    setFindingActionBusyId(trimmedFindingId);
    setFindingActionMessages((current) => {
      const next = { ...current };
      delete next[trimmedFindingId];
      return next;
    });

    try {
      await matchOperationalFinding(trimmedFindingId);
      const result = await createRemediationInstance(trimmedFindingId);

      if (!result.succeeded) {
        const blockerMessage = result.blockers
          .map((blocker) => blocker.trim())
          .filter((blocker) => blocker.length > 0)
          .join(" ");
        const trimmedErrorMessage = result.errorMessage?.trim() ?? "";
        const failureMessage =
          blockerMessage.length > 0
            ? blockerMessage
            : trimmedErrorMessage.length > 0
              ? trimmedErrorMessage
              : "Remediation create failed.";

        setFindingActionMessages((current) => ({
          ...current,
          [trimmedFindingId]: {
            message: failureMessage,
            instanceId: null,
          },
        }));
        return;
      }

      const trimmedCreatedInstanceId = result.instanceId?.trim() ?? "";

      setFindingActionMessages((current) => ({
        ...current,
        [trimmedFindingId]: {
          message: "Remediation instance created.",
          instanceId: trimmedCreatedInstanceId.length > 0 ? trimmedCreatedInstanceId : null,
        },
      }));

      invalidateInfraEvidenceResourceHubCacheForResource(cloudResourceId);
      await loadHub({ retainFindingMessages: true });
    } catch (error: unknown) {
      setFindingActionMessages((current) => ({
        ...current,
        [trimmedFindingId]: {
          message: formatInfraEvidenceRemediationApiError(error),
          instanceId: null,
        },
      }));
    } finally {
      setFindingActionBusyId(null);
      setPendingRemediationFinding(null);
    }
  };

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-resource-hub-workbench"
    >
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={resourcesPath}
        title={resourceTitle}
        subtitle={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PAGE_LEAD}
        claimDiscipline={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CLAIM_DISCIPLINE}
        claimDisciplineTestId="infra-resource-hub-claim-discipline"
        titleTestId="infra-resource-hub-page-title"
        breadcrumb={<ResourceHubBreadcrumb />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <InfraEvidenceWorkbenchHeaderActions
              shortcutsTestId="infra-resource-hub-page-shortcuts"
              shortcuts={RESOURCE_HUB_PAGE_SHORTCUTS}
            />
            <Link
              className={cn("text-sm", OPERATOR_LINK.inline)}
              href={explorerBackHref}
              data-testid={workQueue !== "all" ? "infra-resource-hub-explorer-work-queue-back-link" : undefined}
            >
              {workQueue !== "all" ? `Back to explorer (${workQueueLabel})` : "Back to explorer"}
            </Link>
          </div>
        }
      />

      <ResourceHubSnapshotScopeStrip
        snapshotId={resolvedSnapshotId}
        snapshotPinned={snapshotPinned}
        runId={runId}
      />

      <main
        id={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_PRIMARY_CONTENT_ID}
        className={cn("flex w-full flex-col gap-4 scroll-mt-24")}
        data-testid="infra-resource-hub-primary-content"
      >
      {buyerPolishedShell ? (
        <section className={cnCard} aria-label="Resource identifiers">
          <CollapsibleSection
            title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CLOUD_RESOURCE_ID_LABEL}
            sectionTestId="infra-resource-hub-cloud-resource-id-disclosure"
            summaryLine="Cloud resource UUID for this evidence hub"
            open={infraResourceHubTechnicalKey === "cloudResourceId"}
            onToggle={(open) => setInfraResourceHubTechnicalKey(open ? "cloudResourceId" : null)}
          >
            <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {cloudResourceId}
            </p>
          </CollapsibleSection>
          <CollapsibleSection
            title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_ARM_RESOURCE_PATH_LABEL}
            sectionTestId="infra-resource-hub-arm-resource-path-disclosure"
            summaryLine="Azure Resource Manager path from inventory capture"
            open={infraResourceHubTechnicalKey === "armResourcePath"}
            onToggle={(open) => setInfraResourceHubTechnicalKey(open ? "armResourcePath" : null)}
          >
            <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {hub != null ? externalResourceIdDisplayLabel : cloudResourceId}
            </p>
          </CollapsibleSection>
        </section>
      ) : (
        <section
          className={cnCard}
          aria-label="Resource identifiers"
          data-testid="infra-resource-hub-identifier-strip"
        >
          <p className={cn("m-0 mb-2", OPERATOR_TYPOGRAPHY.helper)}>
            These identifiers locate the resource in captured inventory; they are not editable Azure settings.
          </p>
          <dl className="m-0 grid gap-2 text-sm md:grid-cols-2">
            <div>
              <dt className="font-medium">{GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CLOUD_RESOURCE_ID_LABEL}</dt>
              <dd className="m-0 inline-flex items-center gap-1 font-mono text-xs break-all text-al-text-secondary">
                {cloudResourceId}
                <CopyIdButton value={cloudResourceId} aria-label="Copy cloud resource id" />
              </dd>
            </div>
            <div>
              <dt className="font-medium">{GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_ARM_RESOURCE_PATH_LABEL}</dt>
              <dd className="m-0 inline-flex items-center gap-1 font-mono text-xs break-all text-al-text-secondary">
                {hub != null ? externalResourceIdDisplayLabel : cloudResourceId}
                <CopyIdButton
                  value={hub?.externalResourceId ?? cloudResourceId}
                  aria-label="Copy ARM resource path"
                />
              </dd>
            </div>
          </dl>
        </section>
      )}

      {auditScopeActive && workbenchLinkAuditContext != null && !hasUnlinkedAuditScopeInUrl ? (
        <InfraEvidenceAuditScopeBar
          cloudResourceId={cloudResourceId}
          auditScope={{
            assessmentId: workbenchLinkAuditContext.assessmentId ?? "",
            auditEvidenceSnapshotId: workbenchLinkAuditContext.auditEvidenceSnapshotId ?? "",
            controlId: workbenchLinkAuditContext.controlId ?? "",
          }}
          currentSearch={searchParams.toString()}
          activeTab={activeTab}
          snapshotId={resolvedSnapshotId}
          runId={runId}
          controlNumber={hub?.auditLineageLink.controlNumber}
          controlTitle={hub?.auditLineageLink.controlTitle}
          auditControlOptions={auditControlOptions}
          onAuditControlChange={switchActiveAuditControl}
          testId="infra-resource-hub-audit-scope-bar"
        />
      ) : null}

      {showStaleAuditScopeBanner ? (
        <InfraAuditLineageUnavailableBanner
          degradedReason="Audit scope in the URL could not be resolved for this resource."
          testId="infra-resource-hub-stale-audit-scope"
          auditTabHref={resourceHubFilterHrefFromSearch(cloudResourceId, searchParams.toString(), {
            tab: "audit",
            snapshotId: resolvedSnapshotId.length > 0 ? resolvedSnapshotId : undefined,
            runId: runId.length > 0 ? runId : undefined,
          })}
          clearAuditScopeHref={buildInfraEvidenceClearAuditScopeHref(
            cloudResourceId,
            searchParams.toString(),
            activeTab,
            resolvedSnapshotId,
            runId,
          )}
        />
      ) : null}

      {workQueue !== "all" ? (
        <p
          className={cn("m-0 text-sm text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="infra-resource-hub-work-queue-banner"
        >
          Explorer work queue: {workQueueLabel}
        </p>
      ) : null}

      {loadError != null ? (
        <>
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
            This page could not load captured evidence. It does not prove the Azure resource is unavailable.
          </p>
          <EnterpriseCompactEmptyState
            role="alert"
            title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_LOAD_ERROR_TITLE}
            description={formatStoredInfraEvidenceHubField(loadError, "Captured evidence could not be loaded.")}
            testId="infra-resource-hub-load-error"
            footer={
              <Button type="button" variant="outline" size="sm" onClick={() => void loadHub()}>
                Retry
              </Button>
            }
          />
        </>
      ) : null}

      {loading && hub == null ? (
        <p className={cn("m-0 inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading evidence hub…
        </p>
      ) : null}

      {hub != null ? (
        <EnterpriseTabs value={activeTab} onValueChange={(value) => setActiveTab(value as ResourceHubTab)}>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <EnterpriseTabsList aria-label="Resource evidence hub sections" data-testid="infra-resource-hub-tabs">
              {hubTabs.map((tab, index) => (
                <EnterpriseTabsTrigger
                  key={tab.id}
                  value={tab.id}
                  data-testid={`infra-resource-hub-tab-${tab.id}`}
                  title={`${tab.label} (Alt+${index + 1})`}
                >
                  {tab.label}
                </EnterpriseTabsTrigger>
              ))}
            </EnterpriseTabsList>
            {loading ? (
              <div className="space-y-1">
                <p
                  className={cn("m-0 inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}
                  role="status"
                  data-testid="infra-resource-hub-refreshing"
                >
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Refreshing…
                </p>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  Refreshing reloads the evidence hub; it does not recapture Azure inventory.
                </p>
              </div>
            ) : null}
            {auditScopeActive ? (
              <InfraEvidenceAuditScopeChip
                controlLabel={resolvedAuditLineage?.label}
                href={auditScopeChipHref}
                testId="infra-resource-hub-audit-scope-chip"
              />
            ) : null}
          </div>

          <EnterpriseTabsContent value="overview" className="mt-4 space-y-4">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              Overview combines the selected resource&apos;s captured configuration, findings, and recent changes.
            </p>
            {hub.auditLineageLink.available !== true ? (
              <InfraAuditLineageUnavailableBanner
                degradedReason={formatStoredInfraEvidenceHubField(
                  hub.auditLineageLink.degradedReason,
                  "No audit evidence snapshot rows reference this cloud resource yet.",
                )}
                testId="infra-resource-hub-overview-audit-unavailable"
              />
            ) : null}
            <section className={cnCard}>
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Ask about this resource</h2>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                Open Infrastructure Ask with this resource and snapshot context prefilled.
              </p>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                Ask starts with this resource and snapshot context; it does not broaden the evidence scope automatically.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3" data-testid="infra-resource-hub-open-ask">
                <Link
                  href={buildInfrastructureAskHandoffHref(pathname, infrastructureAskHandoffSearch, {
                    cloudResourceId,
                    snapshotId: resolvedSnapshotId,
                    runId,
                    hubTab: "overview",
                    workQueue: infrastructureAskWorkQueueForExplorer(workQueue),
                    ...askAuditContext,
                  })}
                >
                  Ask about this resource
                </Link>
              </Button>
            </section>

            <section className={cnCard}>
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Open in workbench</h2>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                Cross-workbench exits for this resource without re-filtering manually.
              </p>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                These links carry the current resource context into another workbench.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link
                  className={OPERATOR_LINK.inline}
                  href={buildResourceScopedWorkbenchHref(cloudResourceId, "remediation", resolvedSnapshotId, workbenchLinkAuditContext, runId)}
                  data-testid="infra-resource-hub-open-remediation-work"
                >
                  Open remediation factory
                </Link>
                <Link
                  className={OPERATOR_LINK.inline}
                  href={buildDriftWorkbenchHref({
                    cloudResourceId,
                    snapshotId: resolvedSnapshotId,
                    runId: runId.length > 0 ? runId : undefined,
                    ...workbenchLinkAuditContext,
                  })}
                  data-testid="infra-resource-hub-open-drift-work"
                >
                  Open drift workbench
                </Link>
                <Link
                  className={OPERATOR_LINK.inline}
                  href={buildResourceHubDiagramsWorkbenchHref(
                    resolvedSnapshotId,
                    cloudResourceId,
                    hub.externalResourceId,
                    workbenchLinkAuditContext,
                    runId,
                  )}
                  data-testid="infra-resource-hub-open-diagrams-work"
                >
                  {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OPEN_ACTION}
                </Link>
                <Link
                  className={OPERATOR_LINK.inline}
                  href={buildResourceHubDiagramReconcileWorkbenchHref(
                    resolvedSnapshotId,
                    runId,
                    undefined,
                    cloudResourceId,
                    workbenchLinkAuditContext,
                  )}
                  data-testid="infra-resource-hub-open-diagram-reconcile-work"
                >
                  Open diagram reconciliation
                </Link>
                {resolvedAuditLineage != null ? (
                  <Link
                    className={OPERATOR_LINK.inline}
                    href={buildHubAuditLineageTabHref(cloudResourceId, resolvedSnapshotId, runId, {
                      assessmentId: resolvedAuditLineage.assessmentId,
                      auditEvidenceSnapshotId: resolvedAuditLineage.auditEvidenceSnapshotId,
                      controlId: resolvedAuditLineage.controlId,
                    }, workQueue)}
                    data-testid="infra-resource-hub-open-audit-work"
                  >
                    Open audit lineage
                  </Link>
                ) : null}
              </div>
            </section>

            <section className={cnCard}>
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Current configuration</h2>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                These values come from the selected snapshot. They are not a live Azure read.
              </p>
              {hub.currentConfiguration == null ? (
                <>
                  <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
                    No configuration was captured for this resource in the selected snapshot.
                  </p>
                  <EnterpriseCompactEmptyState
                    title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CONFIG_EMPTY_TITLE}
                    description={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CONFIG_EMPTY_BODY}
                    testId="infra-resource-hub-config-empty"
                  />
                </>
              ) : (
                <>
                  <dl className="grid gap-2 text-sm md:grid-cols-3">
                    <div>
                      <dt className="font-medium">Resource type</dt>
                      <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                        The Azure type recorded for this resource.
                      </dd>
                      <dd>
                        {formatStoredInfraEvidenceHubField(
                          hub.currentConfiguration.resourceType,
                          "Resource type was not stored.",
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium">Resource group</dt>
                      <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                        The group recorded as containing this resource.
                      </dd>
                      <dd>{hub.currentConfiguration.resourceGroup?.trim() || "Resource group was not stored."}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Region</dt>
                      <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                        The Azure region recorded for this resource.
                      </dd>
                      <dd>{hub.currentConfiguration.region?.trim() || "Azure region was not stored."}</dd>
                    </div>
                  </dl>
                  {Object.keys(hub.currentConfiguration.properties).length > 0 ? (
                    <div className="mt-4">
                      <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Properties</h3>
                      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                        Configuration keys and values recorded in the snapshot.
                      </p>
                      <EnterpriseTable ariaLabel="Resource properties">
                        <EnterpriseTableHead>
                          <EnterpriseTableRow>
                            <EnterpriseTableHeaderCell>
                              <span>Key</span>
                              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                                The configuration property name recorded in the snapshot.
                              </span>
                            </EnterpriseTableHeaderCell>
                            <EnterpriseTableHeaderCell>
                              <span>Value</span>
                              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                                The configuration value recorded for this property.
                              </span>
                            </EnterpriseTableHeaderCell>
                          </EnterpriseTableRow>
                        </EnterpriseTableHead>
                        <EnterpriseTableBody>
                          {Object.entries(hub.currentConfiguration.properties).map(([key, value]) => (
                            <EnterpriseTableRow key={key}>
                              <EnterpriseTableCell className="font-mono text-xs">
                                {formatStoredInfraEvidenceHubField(key, "Property key was not stored.")}
                              </EnterpriseTableCell>
                              <EnterpriseTableCell className="font-mono text-xs">
                                {formatStoredInfraEvidenceHubField(value, "Property value was not stored.")}
                              </EnterpriseTableCell>
                            </EnterpriseTableRow>
                          ))}
                        </EnterpriseTableBody>
                      </EnterpriseTable>
                    </div>
                  ) : (
                    <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>No properties captured.</p>
                  )}
                  {Object.keys(hub.currentConfiguration.tags).length > 0 ? (
                    <div className="mt-4">
                      <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Tags</h3>
                      <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                        Tags recorded on this resource in the snapshot.
                      </p>
                      <EnterpriseTable ariaLabel="Resource tags">
                        <EnterpriseTableHead>
                          <EnterpriseTableRow>
                            <EnterpriseTableHeaderCell>
                              <span>Key</span>
                              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                                The tag name recorded on the resource.
                              </span>
                            </EnterpriseTableHeaderCell>
                            <EnterpriseTableHeaderCell>
                              <span>Value</span>
                              <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                                The tag value recorded for this resource.
                              </span>
                            </EnterpriseTableHeaderCell>
                          </EnterpriseTableRow>
                        </EnterpriseTableHead>
                        <EnterpriseTableBody>
                          {Object.entries(hub.currentConfiguration.tags).map(([key, value]) => (
                            <EnterpriseTableRow key={key}>
                              <EnterpriseTableCell className="font-mono text-xs">
                                {formatStoredInfraEvidenceHubField(key, "Tag key was not stored.")}
                              </EnterpriseTableCell>
                              <EnterpriseTableCell className="font-mono text-xs">
                                {formatStoredInfraEvidenceHubField(value, "Tag value was not stored.")}
                              </EnterpriseTableCell>
                            </EnterpriseTableRow>
                          ))}
                        </EnterpriseTableBody>
                      </EnterpriseTable>
                    </div>
                  ) : (
                    <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
                      No tags were captured for this resource in the selected snapshot.
                    </p>
                  )}
                </>
              )}
            </section>

            {hub.rbacAssignments.length > 0 || hub.networkRelationships.length > 0 || hub.evidencePointers.length > 0 ? (
              <section className={cnCard}>
                <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Access and relationships</h2>
                {hub.rbacAssignments.length > 0 ? (
                  <div className="mb-4">
                    <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>RBAC assignments</h3>
                    <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                      Principal is the identity granted the role. Role is the role recorded in the snapshot. Scope is where that role applies.
                    </p>
                    <EnterpriseTable ariaLabel="RBAC assignments">
                      <EnterpriseTableHead>
                        <EnterpriseTableRow>
                          <EnterpriseTableHeaderCell>
                            <span>Principal</span>
                            <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                              The identity granted this role.
                            </span>
                          </EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell>
                            <span>Role</span>
                            <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                              The role recorded in the snapshot.
                            </span>
                          </EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell>
                            <span>Scope</span>
                            <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                              Where that role applies.
                            </span>
                          </EnterpriseTableHeaderCell>
                        </EnterpriseTableRow>
                      </EnterpriseTableHead>
                      <EnterpriseTableBody>
                        {hub.rbacAssignments.map((assignment) => (
                          <EnterpriseTableRow
                            key={`${assignment.principalId}-${assignment.roleDefinitionId}-${assignment.scope}`}
                          >
                            <EnterpriseTableCell className="font-mono text-xs">
                              {formatStoredInfraEvidenceHubField(
                                assignment.principalId,
                                "RBAC principal was not stored.",
                              )}
                            </EnterpriseTableCell>
                            <EnterpriseTableCell className="font-mono text-xs">
                              {formatStoredInfraEvidenceHubField(
                                assignment.roleDefinitionId,
                                "RBAC role was not stored.",
                              )}
                            </EnterpriseTableCell>
                            <EnterpriseTableCell className="font-mono text-xs">
                              {formatStoredInfraEvidenceHubField(assignment.scope, "RBAC scope was not stored.")}
                            </EnterpriseTableCell>
                          </EnterpriseTableRow>
                        ))}
                      </EnterpriseTableBody>
                    </EnterpriseTable>
                  </div>
                ) : (
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                    No RBAC assignment was captured for this resource in the selected snapshot.
                  </p>
                )}
                {hub.networkRelationships.length > 0 ? (
                  <div className="mb-4">
                    <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Network relationships</h3>
                    <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                      Type is the kind of network relationship recorded between the two resources.
                    </p>
                    <EnterpriseTable ariaLabel="Network relationships">
                      <EnterpriseTableHead>
                        <EnterpriseTableRow>
                          <EnterpriseTableHeaderCell>Type</EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell>
                            <span>From</span>
                            <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                              The source resource in the captured relationship.
                            </span>
                          </EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell>
                            <span>To</span>
                            <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                              The destination resource in the captured relationship.
                            </span>
                          </EnterpriseTableHeaderCell>
                        </EnterpriseTableRow>
                      </EnterpriseTableHead>
                      <EnterpriseTableBody>
                        {hub.networkRelationships.map((relationship) => (
                          <EnterpriseTableRow
                            key={`${relationship.fromAzureResourceId}-${relationship.toAzureResourceId}-${relationship.relationshipType}`}
                          >
                            <EnterpriseTableCell>
                              {formatStoredInfraEvidenceHubField(
                                relationship.relationshipType,
                                "Network relationship type was not stored.",
                              )}
                            </EnterpriseTableCell>
                            <EnterpriseTableCell className="font-mono text-xs">
                              {formatStoredInfraEvidenceHubField(
                                relationship.fromAzureResourceId,
                                "Network relationship from resource was not stored.",
                              )}
                            </EnterpriseTableCell>
                            <EnterpriseTableCell className="font-mono text-xs">
                              {formatStoredInfraEvidenceHubField(
                                relationship.toAzureResourceId,
                                "Network relationship to resource was not stored.",
                              )}
                            </EnterpriseTableCell>
                          </EnterpriseTableRow>
                        ))}
                      </EnterpriseTableBody>
                    </EnterpriseTable>
                  </div>
                ) : (
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                    No network relationship was captured for this resource in the selected snapshot.
                  </p>
                )}
                {hub.evidencePointers.length > 0 ? (
                  <div>
                    <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Evidence pointers</h3>
                    <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                      A pointer to captured evidence. It does not open Azure.
                    </p>
                    <EnterpriseTable ariaLabel="Evidence pointers">
                      <EnterpriseTableHead>
                        <EnterpriseTableRow>
                          <EnterpriseTableHeaderCell>
                            <span>Kind</span>
                            <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                              The type of captured evidence referenced by this pointer.
                            </span>
                          </EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell>
                            <span>Path</span>
                            <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                              Where the captured evidence is located in the evidence bundle.
                            </span>
                          </EnterpriseTableHeaderCell>
                        </EnterpriseTableRow>
                      </EnterpriseTableHead>
                      <EnterpriseTableBody>
                        {hub.evidencePointers.map((pointer, pointerIndex) => (
                          <EnterpriseTableRow key={`${pointer.kind}-${pointer.relativePath}-${pointerIndex}`}>
                            <EnterpriseTableCell>
                              {formatStoredInfraEvidenceHubField(
                                pointer.kind,
                                "Evidence pointer kind was not stored.",
                              )}
                            </EnterpriseTableCell>
                            <EnterpriseTableCell className="font-mono text-xs">
                              {formatStoredInfraEvidenceHubField(
                                pointer.relativePath,
                                "Evidence pointer path was not stored.",
                              )}
                            </EnterpriseTableCell>
                          </EnterpriseTableRow>
                        ))}
                      </EnterpriseTableBody>
                    </EnterpriseTable>
                  </div>
                ) : (
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                    No captured evidence pointer is linked to this resource.
                  </p>
                )}
              </section>
            ) : null}

            {hub.recentChanges.length > 0 ? (
              <section className={cnCard}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Recent changes</h2>
                  {hub.recentChanges.length > 5 ? (
                    <div className="flex flex-col items-end gap-1">
                      <Link
                        className={OPERATOR_LINK.inline}
                        href={buildHubScopedTabHref(cloudResourceId, "drift", resolvedSnapshotId, runId, workbenchLinkAuditContext, workQueue)}
                        data-testid="infra-resource-hub-overview-view-all-drift"
                      >
                        View all {hub.recentChanges.length} in Drift
                      </Link>
                      <span className={cn("text-right", OPERATOR_TYPOGRAPHY.helper)}>
                        Opens all captured changes for this resource in the selected snapshot context.
                      </span>
                    </div>
                  ) : null}
                </div>
                <ResourceHubDriftChangesTable
                  changes={hub.recentChanges.slice(0, 5)}
                  cloudResourceId={cloudResourceId}
                  resolvedSnapshotId={resolvedSnapshotId}
                  runId={runId}
                  askAuditContext={askAuditContext}
                  buildChangeWorkbenchHref={(change) =>
                    buildHubDriftChangeWorkbenchHref(cloudResourceId, resolvedSnapshotId, runId, change, askAuditContext)}
                  buildChangeAskHref={(change) =>
                    buildHubDriftChangeAskHref(pathname, infrastructureAskHandoffSearch, cloudResourceId, resolvedSnapshotId, runId, change, askAuditContext, workQueue)}
                  testIdPrefix="infra-resource-hub-drift"
                />
              </section>
            ) : null}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="drift" className="mt-4 space-y-3">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Open the drift workbench with this resource&apos;s snapshot context prefilled.
            </p>
            <Link
              className={OPERATOR_LINK.inline}
              href={buildResourceHubDriftWorkbenchHref(resolvedSnapshotId, cloudResourceId, workbenchLinkAuditContext, runId)}
              data-testid="infra-resource-hub-open-drift"
            >
              Open drift workbench
            </Link>
            {hub.recentChanges.length > 0 ? (
              <ResourceHubDriftChangesTable
                changes={hub.recentChanges}
                cloudResourceId={cloudResourceId}
                resolvedSnapshotId={resolvedSnapshotId}
                runId={runId}
                askAuditContext={askAuditContext}
                buildChangeWorkbenchHref={(change) =>
                  buildHubDriftChangeWorkbenchHref(cloudResourceId, resolvedSnapshotId, runId, change, askAuditContext)}
                buildChangeAskHref={(change) =>
                  buildHubDriftChangeAskHref(pathname, infrastructureAskHandoffSearch, cloudResourceId, resolvedSnapshotId, runId, change, askAuditContext, workQueue)}
                testIdPrefix="infra-resource-hub-drift-tab"
              />
            ) : (
              <EnterpriseCompactEmptyState
                title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_DRIFT_EMPTY_TITLE}
                description={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_DRIFT_EMPTY_BODY}
                testId="infra-resource-hub-drift-empty"
              />
            )}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="diagram" className="mt-4 space-y-3">
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              Review diagram correspondence and open inventory diagram or reconciliation workbenches.
            </p>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
              This compares diagram correspondence with captured inventory; it does not redraw Azure.
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <Link
                className={OPERATOR_LINK.inline}
                href={buildResourceHubDiagramsWorkbenchHref(
                  resolvedSnapshotId,
                  cloudResourceId,
                  hub.externalResourceId,
                  workbenchLinkAuditContext,
                  runId,
                )}
                data-testid="infra-resource-hub-diagrams-workbench"
              >
                {GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OPEN_ACTION}
              </Link>
              <Link
                className={OPERATOR_LINK.inline}
                href={buildResourceHubDiagramReconcileWorkbenchHref(
                  resolvedSnapshotId,
                  runId,
                  undefined,
                  cloudResourceId,
                  workbenchLinkAuditContext,
                )}
                data-testid="infra-resource-hub-diagram-reconcile-workbench"
              >
                Open diagram reconciliation
              </Link>
            </div>
            {hub.diagramCorrespondence != null ? (
              <section className={cnCard}>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <StatusTag
                    kind={resolveDiagramCorrespondenceStatusKind(
                      hub.diagramCorrespondence.matchKind ?? "",
                      hub.diagramCorrespondence.confidenceBand,
                    )}
                    label={diagramCorrespondenceMatchKindDisplayLabel}
                  />
                  <StatusTag
                    kind={resolveDiagramCorrespondenceConfidenceStatusKind(hub.diagramCorrespondence.confidenceBand)}
                    label={formatDiagramCorrespondenceConfidenceBandLabel(hub.diagramCorrespondence.confidenceBand)}
                  />
                </div>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  Match kind describes how the captured resource and diagram item correspond. Confidence band describes the evidence strength for that correspondence.
                </p>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  {diagramCorrespondenceExplainDisplayLabel}
                </p>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  This explanation describes the recorded correspondence result, not observed runtime traffic.
                </p>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  Reconciliation records correspondence work; it does not change the diagram or Azure.
                </p>
                {diagramCorrespondenceIdTrimmed.length > 0 ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-reconcile">
                      <Link
                        href={buildResourceHubDiagramReconcileWorkbenchHref(
                          resolvedSnapshotId,
                          runId,
                          diagramCorrespondenceIdTrimmed,
                          cloudResourceId,
                          workbenchLinkAuditContext,
                        )}
                      >
                        Open in reconciliation workbench
                      </Link>
                    </Button>
                    {diagramCorrespondenceRemediationHref != null ? (
                      <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-remediation">
                        <Link href={diagramCorrespondenceRemediationHref}>Open in remediation factory</Link>
                      </Button>
                    ) : null}
                    <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-ask">
                      <Link
                        href={buildHubDiagramCorrespondenceAskHref(
                          pathname,
                          infrastructureAskHandoffSearch,
                          cloudResourceId,
                          resolvedSnapshotId,
                          runId,
                          diagramCorrespondenceIdTrimmed,
                          askAuditContext,
                          workQueue,
                        )}
                      >
                        Ask about this correspondence
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
                    Correspondence id was not stored.
                  </p>
                )}
              </section>
            ) : (
              <>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  No correspondence was recorded for this resource in the selected snapshot.
                </p>
                <EnterpriseCompactEmptyState
                  title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_DIAGRAM_EMPTY_TITLE}
                  description={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_DIAGRAM_EMPTY_BODY}
                  testId="infra-resource-hub-diagram-empty"
                />
              </>
            )}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="terraform" className="mt-4 space-y-3">
            <section className={cnCard}>
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Advisory Terraform mapping</h2>
              <p className={cn("m-0 mt-1", OPERATOR_TYPOGRAPHY.helper)}>
                This mapping is advisory. Exporting it does not apply Terraform.
              </p>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                Not mapped means no Terraform address was captured; it does not mean the resource is unmanaged in Azure.
              </p>
              <dl className="grid gap-2 text-sm">
                {buyerPolishedShell ? (
                  <CollapsibleSection
                    title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_TERRAFORM_ADDRESS_LABEL}
                    sectionTestId="infra-resource-hub-terraform-address-disclosure"
                    summaryLine={terraformAddressDisplayLabel}
                    open={infraResourceHubTechnicalKey === "terraformAddress"}
                    onToggle={(open) => setInfraResourceHubTechnicalKey(open ? "terraformAddress" : null)}
                  >
                    <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {terraformAddressDisplayLabel}
                    </p>
                  </CollapsibleSection>
                ) : (
                  <div>
                    <dt className="font-medium">Terraform address</dt>
                  <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                    The advisory address used to identify this resource in Terraform.
                  </dd>
                    <dd className="font-mono text-xs">{terraformAddressDisplayLabel}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium">Generation method</dt>
                  <dd className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                    How this Terraform mapping was produced from captured evidence.
                  </dd>
                  <dd>{terraformGenerationMethodDisplayLabel}</dd>
                </div>
              </dl>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link
                  className={OPERATOR_LINK.inline}
                  href={buildTerraformWorkbenchHref({
                    cloudResourceId,
                    snapshotId: resolvedSnapshotId,
                    runId: runId.length > 0 ? runId : undefined,
                    assessmentId: workbenchLinkAuditContext?.assessmentId ?? null,
                    auditEvidenceSnapshotId: workbenchLinkAuditContext?.auditEvidenceSnapshotId ?? null,
                    controlId: workbenchLinkAuditContext?.controlId ?? null,
                  })}
                  data-testid="infra-resource-hub-terraform-open-workbench"
                >
                  Open terraform workbench
                </Link>
                <Link
                  className={OPERATOR_LINK.inline}
                  href={buildResourceHubDriftWorkbenchHref(resolvedSnapshotId, cloudResourceId, workbenchLinkAuditContext, runId)}
                  data-testid="infra-resource-hub-terraform-drift-export"
                >
                  Export from drift workbench
                </Link>
              </div>
            </section>
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="findings" className="mt-4 space-y-4">
            {[hub.operationalSecurityFindings, hub.architectureReviewFindings].map((stream) => {
              const findingsStreamSectionLabel = formatStoredInfraEvidenceHubField(
                stream.streamLabel,
                "Findings stream label was not stored.",
              );

              return (
              <section key={stream.streamKind} className={cnCard}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>
                    {findingsStreamSectionLabel}
                  </h2>
                  {formatResourceHubFindingStreamCaption(stream.items.length, stream.totalCount, stream.hasMore) != null ? (
                    <Link
                      className={OPERATOR_LINK.inline}
                      href={buildResourceScopedWorkbenchHref(
                        cloudResourceId,
                        stream.streamKind === "ArchitectureReview" ? "findings" : "remediation",
                        resolvedSnapshotId,
                        workbenchLinkAuditContext,
                        runId,
                      )}
                      data-testid={`infra-resource-hub-findings-stream-more-${stream.streamKind}`}
                    >
                      {formatResourceHubFindingStreamCaption(stream.items.length, stream.totalCount, stream.hasMore)}
                    </Link>
                  ) : null}
                </div>
                <p className={cn("m-0 mb-2", OPERATOR_TYPOGRAPHY.helper)}>
                  This list is limited to findings linked to this resource.
                </p>
                {stream.items.length === 0 ? (
                  <EnterpriseCompactEmptyState
                    title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_FINDINGS_EMPTY_TITLE}
                    description={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_FINDINGS_EMPTY_BODY}
                    testId={`infra-resource-hub-findings-empty-${stream.streamKind}`}
                  />
                ) : (
                  <EnterpriseTable
                    ariaLabel={`${findingsStreamSectionLabel} findings`}
                  >
                    <EnterpriseTableHead>
                      <EnterpriseTableRow>
                        <EnterpriseTableHeaderCell>
                          <span>Title</span>
                          <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                            The finding name recorded for this resource.
                          </span>
                        </EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>
                          <span>Severity</span>
                          <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                            How serious this finding is recorded as.
                          </span>
                        </EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>
                          <span>Status</span>
                          <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                            Where this finding is in its recorded review workflow.
                          </span>
                        </EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>
                          <span>Actions</span>
                          <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                            Open the finding or start the available remediation workflow.
                          </span>
                        </EnterpriseTableHeaderCell>
                      </EnterpriseTableRow>
                    </EnterpriseTableHead>
                    <EnterpriseTableBody>
                      {stream.items.map((item, itemIndex) => {
                        const findingIdTrimmed = item.id.trim();

                        return (
                        <EnterpriseTableRow
                          key={
                            findingIdTrimmed.length > 0
                              ? `${stream.streamKind}-${findingIdTrimmed}`
                              : `${stream.streamKind}-finding-row-${itemIndex}`
                          }
                        >
                          <EnterpriseTableCell>
                            <div className="space-y-1">
                              <div>
                                {item.title.trim().length > 0
                                  ? item.title
                                  : "Finding title was not stored."}
                              </div>
                              {findingActionMessages[findingIdTrimmed] != null ? (
                                <p
                                  className={cn("m-0 text-sm", OPERATOR_TYPOGRAPHY.helper)}
                                  role="status"
                                  data-testid={`infra-resource-hub-finding-message-${findingIdTrimmed}`}
                                >
                                  {formatStoredInfraEvidenceHubField(
                                    findingActionMessages[findingIdTrimmed].message,
                                    "Remediation action message was not stored.",
                                  )}
                                  {(findingActionMessages[findingIdTrimmed].instanceId?.trim() ?? "").length > 0 ? (
                                    <>
                                      {" "}
                                      <Link
                                        className={OPERATOR_LINK.inline}
                                        href={buildRemediationWorkbenchHref({
                                          cloudResourceId,
                                          instanceId:
                                            findingActionMessages[findingIdTrimmed].instanceId?.trim() ?? undefined,
                                          snapshotId: resolvedSnapshotId,
                                          runId: runId.length > 0 ? runId : undefined,
                                          ...workbenchLinkAuditContext,
                                        })}
                                        data-testid={`infra-resource-hub-finding-created-factory-${findingIdTrimmed}`}
                                      >
                                        Open in factory
                                      </Link>
                                    </>
                                  ) : null}
                                </p>
                              ) : null}
                            </div>
                          </EnterpriseTableCell>
                          <EnterpriseTableCell>
                            {item.severity != null && item.severity.trim().length > 0 ? (
                              <SeverityTag severity={item.severity} />
                            ) : (
                              "Severity was not stored."
                            )}
                          </EnterpriseTableCell>
                          <EnterpriseTableCell>
                            {item.status != null && item.status.trim().length > 0 ? (
                              <StatusTag kind={findingStatusTagKind(item.status)} label={item.status} />
                            ) : (
                              "Finding status was not stored."
                            )}
                          </EnterpriseTableCell>
                          <EnterpriseTableCell>
                            {stream.streamKind === "OperationalSecurity" ? (
                              findingIdTrimmed.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                <Button asChild size="sm" variant="outline">
                                  <Link
                                    href={buildRemediationWorkbenchHref({
                                      cloudResourceId,
                                      findingId: findingIdTrimmed,
                                      snapshotId: resolvedSnapshotId,
                                      runId: runId.length > 0 ? runId : undefined,
                                      ...workbenchLinkAuditContext,
                                    })}
                                    data-testid={`infra-resource-hub-finding-factory-${findingIdTrimmed}`}
                                  >
                                    Open in factory
                                  </Link>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="primary"
                                  data-testid={`infra-resource-hub-create-remediation-${findingIdTrimmed}`}
                                  disabled={findingActionBusyId === findingIdTrimmed}
                                  onClick={() => {
                                    setPendingRemediationFinding({ id: findingIdTrimmed, title: item.title });
                                  }}
                                >
                                  {findingActionBusyId === findingIdTrimmed ? "Creating…" : "Create remediation…"}
                                </Button>
                                <Button asChild size="sm" variant="outline">
                                  <Link
                                    href={buildHubFindingAskHref(pathname, infrastructureAskHandoffSearch, cloudResourceId, resolvedSnapshotId, runId, findingIdTrimmed, askAuditContext, workQueue)}
                                    data-testid={`infra-resource-hub-finding-ask-${findingIdTrimmed}`}
                                  >
                                    Ask
                                  </Link>
                                </Button>
                              </div>
                              ) : (
                                "Finding id was not stored."
                              )
                            ) : findingIdTrimmed.length > 0 ? (
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  href={buildHubFindingAskHref(
                                    pathname,
                                    infrastructureAskHandoffSearch,
                                    cloudResourceId,
                                    resolvedSnapshotId,
                                    runId,
                                    findingIdTrimmed,
                                    askAuditContext,
                                    workQueue,
                                  )}
                                  data-testid={`infra-resource-hub-architecture-finding-ask-${findingIdTrimmed}`}
                                >
                                  Ask
                                </Link>
                              </Button>
                            ) : (
                              "Finding id was not stored."
                            )}
                          </EnterpriseTableCell>
                        </EnterpriseTableRow>
                        );
                      })}
                    </EnterpriseTableBody>
                  </EnterpriseTable>
                )}
              </section>
              );
            })}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="remediation" className="mt-4 space-y-3">
            <Link
              className={OPERATOR_LINK.inline}
              href={buildRemediationWorkbenchHref({ cloudResourceId, snapshotId: resolvedSnapshotId, runId: runId.length > 0 ? runId : undefined, ...workbenchLinkAuditContext })}
              data-testid="infra-resource-hub-open-remediation-factory"
            >
              Open remediation factory
            </Link>
            {(() => {
              const remediationStreamCaption = formatResourceHubFindingStreamCaption(
                hub.remediationInstances.items.length,
                hub.remediationInstances.totalCount,
                hub.remediationInstances.hasMore,
              );

              return remediationStreamCaption != null ? (
                <p
                  className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="infra-resource-hub-remediation-stream-caption"
                >
                  {remediationStreamCaption}
                </p>
              ) : null;
            })()}
            {hub.remediationInstances.items.length === 0 ? (
              <EnterpriseCompactEmptyState
                title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_REMEDIATION_EMPTY_TITLE}
                description={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_REMEDIATION_EMPTY_BODY}
                testId="infra-resource-hub-remediation-empty"
              />
            ) : (
              <EnterpriseTable ariaLabel="Remediation instances">
                <EnterpriseTableHead>
                  <EnterpriseTableRow>
                    <EnterpriseTableHeaderCell>
                      <span>Pattern</span>
                      <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                        The remediation pattern associated with this instance.
                      </span>
                    </EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>
                      <span>Status</span>
                      <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                        The recorded state of this remediation instance. It does not change Azure.
                      </span>
                    </EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>
                      <span>Actions</span>
                      <span className={cn("ml-2 font-normal", OPERATOR_TYPOGRAPHY.helper)}>
                        Open the remediation workbench or ask about this instance.
                      </span>
                    </EnterpriseTableHeaderCell>
                  </EnterpriseTableRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {hub.remediationInstances.items.map((item, itemIndex) => {
                    const remediationStatusLabel = item.status?.trim() ?? "";
                    const remediationInstanceId = item.instanceId?.trim() ?? "";

                    return (
                    <EnterpriseTableRow
                      key={remediationInstanceId.length > 0 ? remediationInstanceId : `remediation-row-${itemIndex}`}
                    >
                      <EnterpriseTableCell className="font-mono text-xs">
                        {formatStoredInfraEvidenceHubField(item.patternKey, "Remediation pattern was not stored.")}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        {remediationStatusLabel.length > 0 ? (
                          <StatusTag
                            kind={remediationInstanceStatusTagKind(remediationStatusLabel)}
                            label={remediationStatusLabel}
                          />
                        ) : (
                          "Remediation status was not stored."
                        )}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        {remediationInstanceId.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={buildRemediationWorkbenchHref({
                                  cloudResourceId,
                                  instanceId: remediationInstanceId,
                                  snapshotId: resolvedSnapshotId,
                                  runId: runId.length > 0 ? runId : undefined,
                                  ...workbenchLinkAuditContext,
                                })}
                                data-testid={`infra-resource-hub-remediation-factory-${remediationInstanceId}`}
                              >
                                Open in factory
                              </Link>
                            </Button>
                            <Button asChild size="sm" variant="outline">
                              <Link
                                href={buildHubRemediationAskHref(
                                  pathname,
                                  infrastructureAskHandoffSearch,
                                  cloudResourceId,
                                  resolvedSnapshotId,
                                  runId,
                                  remediationInstanceId,
                                  askAuditContext,
                                  workQueue,
                                )}
                                data-testid={`infra-resource-hub-remediation-ask-${remediationInstanceId}`}
                              >
                                Ask
                              </Link>
                            </Button>
                          </div>
                        ) : (
                          "Remediation instance id was not stored."
                        )}
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                    );
                  })}
                </EnterpriseTableBody>
              </EnterpriseTable>
            )}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="audit" className="mt-4 space-y-3">
            {resolvedAuditLineage != null ? (
              <>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  AE-10 chain of custody for {resolvedAuditLineage.label}.
                </p>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  This lineage connects the resource evidence to the selected assessment context.
                </p>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  Ask uses the selected control and resource evidence as context; it does not query Azure live.
                </p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <Link
                    className={OPERATOR_LINK.inline}
                    href={buildAuditEvidenceLineageUiPath(
                      resolvedAuditLineage.assessmentId,
                      resolvedAuditLineage.auditEvidenceSnapshotId,
                      resolvedAuditLineage.controlId,
                    )}
                    data-testid="infra-resource-hub-audit-lineage-link"
                  >
                    Open audit control lineage
                  </Link>
                  <Link
                    className={OPERATOR_LINK.inline}
                    href={buildHubAuditLineageAskHref(pathname, infrastructureAskHandoffSearch, cloudResourceId, resolvedSnapshotId, runId, {
                      assessmentId: resolvedAuditLineage.assessmentId,
                      auditEvidenceSnapshotId: resolvedAuditLineage.auditEvidenceSnapshotId,
                      controlId: resolvedAuditLineage.controlId,
                    }, workQueue)}
                    data-testid="infra-resource-hub-audit-ask"
                  >
                    Ask about this control
                  </Link>
                </div>
                {resolvedAuditLineage.matches.length > 1 ? (
                  <section className={cnCard} aria-label="Additional audit controls">
                    <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Other linked controls</h2>
                    <ul className="m-0 list-disc space-y-2 pl-5 text-sm">
                      {resolvedAuditLineage.matches
                        .filter(
                          (match: CloudResourceAuditLineageMatch) =>
                            match.assessmentId !== resolvedAuditLineage.assessmentId
                            || match.auditEvidenceSnapshotId !== resolvedAuditLineage.auditEvidenceSnapshotId
                            || match.controlId !== resolvedAuditLineage.controlId,
                        )
                        .map((match: CloudResourceAuditLineageMatch) => (
                        <li key={`${match.assessmentId}-${match.auditEvidenceSnapshotId}-${match.controlId}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              className="text-al-link hover:underline"
                              href={buildAuditEvidenceLineageUiPath(
                                match.assessmentId,
                                match.auditEvidenceSnapshotId,
                                match.controlId,
                              )}
                            >
                              {formatAuditLineageControlLinkLabel(match.controlNumber, match.controlTitle)}
                            </Link>
                            <Link
                              className="text-sm text-al-link hover:underline"
                              href={buildHubAuditLineageAskHref(pathname, infrastructureAskHandoffSearch, cloudResourceId, resolvedSnapshotId, runId, {
                                assessmentId: match.assessmentId,
                                auditEvidenceSnapshotId: match.auditEvidenceSnapshotId,
                                controlId: match.controlId,
                              }, workQueue)}
                              data-testid={`infra-resource-hub-audit-ask-${match.controlId}`}
                            >
                              Ask
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </>
            ) : (
              <section
                className={cnCardDashed}
                data-testid="infra-resource-hub-audit-degraded"
              >
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  No audit evidence snapshot currently references this resource; this is not evidence that the control is absent.
                </p>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  {formatStoredInfraEvidenceHubField(
                    hub.auditLineageLink.degradedReason,
                    "No audit evidence snapshot rows reference this cloud resource yet.",
                  )}
                </p>
              </section>
            )}
          </EnterpriseTabsContent>
        </EnterpriseTabs>
      ) : null}

      <ResourceHubClaimOrientationStrip />
      </main>

      <ResourceHubCreateRemediationConfirmDialog
        open={pendingRemediationFinding != null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemediationFinding(null);
          }
        }}
        findingTitle={
          pendingRemediationFinding != null
            ? formatStoredInfraEvidenceHubField(
                pendingRemediationFinding.title,
                "Finding title was not stored.",
              )
            : ""
        }
        resourceTitle={resourceTitle}
        busy={pendingRemediationFinding != null && findingActionBusyId === pendingRemediationFinding.id}
        onConfirm={() => {
          if (pendingRemediationFinding != null) {
            void runCreateRemediationFromFinding(pendingRemediationFinding.id);
          }
        }}
      />
    </OperatorPageContainer>
  );
}
