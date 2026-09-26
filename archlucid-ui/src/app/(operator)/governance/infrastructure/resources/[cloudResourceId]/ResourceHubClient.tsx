"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  createRemediationInstance,
  formatInfraEvidenceRemediationApiError,
  matchOperationalFinding,
} from "@/lib/infra-evidence/infra-evidence-remediation-api";
import {
  buildInfrastructureAskHref,
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
  infraResourceHubTechnicalDisclosureHrefFromSearch,
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
  formatResourceHubFindingStreamCaption,
  remediationInstanceStatusTagKind,
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
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  change: CloudResourceInventoryChangeSummary,
  auditContext: InfrastructureAskAuditContext = {},
): string {
  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId,
    runId: runId.length > 0 ? runId : undefined,
    diffId: change.diffId,
    hubTab: "drift",
    ...auditContext,
  });
}

function buildHubFindingAskHref(
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  findingId: string,
  auditContext: InfrastructureAskAuditContext = {},
): string {
  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    findingId,
    hubTab: "findings",
    ...auditContext,
  });
}

function buildHubRemediationAskHref(
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  instanceId: string,
  auditContext: InfrastructureAskAuditContext = {},
): string {
  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    instanceId,
    hubTab: "remediation",
    ...auditContext,
  });
}

function buildHubAuditLineageAskHref(
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  context: {
    readonly assessmentId: string;
    readonly auditEvidenceSnapshotId: string;
    readonly controlId: string;
  },
): string {
  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    assessmentId: context.assessmentId,
    auditEvidenceSnapshotId: context.auditEvidenceSnapshotId,
    controlId: context.controlId,
    hubTab: "audit",
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
): string {
  return buildHubScopedTabHref(cloudResourceId, "audit", snapshotId, runId, {
    assessmentId: context.assessmentId,
    auditEvidenceSnapshotId: context.auditEvidenceSnapshotId,
    controlId: context.controlId,
  });
}

function buildHubScopedTabHref(
  cloudResourceId: string,
  tab: ResourceHubTab,
  snapshotId: string,
  runId: string,
  auditContext: InfrastructureAskAuditContext = {},
): string {
  return buildResourceHubWorkbenchHref({
    cloudResourceId,
    tab,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    assessmentId: auditContext.assessmentId,
    auditEvidenceSnapshotId: auditContext.auditEvidenceSnapshotId,
    controlId: auditContext.controlId,
  });
}

function buildHubDiagramCorrespondenceAskHref(
  cloudResourceId: string,
  snapshotId: string,
  runId: string,
  correspondenceId: string,
  auditContext: InfrastructureAskAuditContext = {},
): string {
  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    correspondenceId,
    hubTab: "diagram",
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

  const syncInfraResourceHubTechnicalKeyToUrl = useCallback(
    (technicalKey: string | null) => {
      router.replace(
        infraResourceHubTechnicalDisclosureHrefFromSearch(searchParams.toString(), technicalKey, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setInfraResourceHubTechnicalKey = useCallback(
    (technicalKey: string | null) => {
      setInfraResourceHubTechnicalKeyState(technicalKey ?? "");
      syncInfraResourceHubTechnicalKeyToUrl(technicalKey);
    },
    [syncInfraResourceHubTechnicalKeyToUrl],
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

  const explorerBackHref = useMemo(
    () => (workQueue !== "all" ? resourceExplorerFilterHrefFromSearch("", { workQueue }) : resourcesPath),
    [resourcesPath, workQueue],
  );

  const loadHub = useCallback(async () => {
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
      setHub(response);
    } catch (error: unknown) {
      setLoadError(formatInfraEvidenceHubApiError(error));
    } finally {
      setLoading(false);
    }
  }, [assessmentId, auditEvidenceSnapshotId, cloudResourceId, controlId, runId, snapshotId]);

  useEffect(() => {
    void loadHub();
  }, [loadHub]);

  const setActiveTab = useCallback((tab: ResourceHubTab) => {
    setFindingActionMessages({});
    const sanitizedSearch = sanitizeResourceHubQueryForTab(searchParams.toString(), tab);
    const nextHref = resourceHubFilterHrefFromSearch(cloudResourceId, sanitizedSearch, { tab });
    router.replace(nextHref);
  }, [cloudResourceId, router, searchParams]);

  useResourceHubShortcuts({
    enabled: hub != null,
    setActiveTab,
    explorerHref: explorerBackHref,
  });

  const resourceTitle = useMemo(() => {
    if (hub == null) {
      return cloudResourceId;
    }

    const configName = hub.currentConfiguration?.azureResourceId.split("/").pop();
    const rawTitle = configName ?? hub.externalResourceId.split("/").pop() ?? cloudResourceId;

    return normalizeSecureNowResourceNameForDisplay(rawTitle);
  }, [cloudResourceId, hub]);

  const resolvedAuditLineage = useMemo(() => {
    if (hub?.auditLineageLink.available !== true) {
      return null;
    }

    const resolvedAssessmentId =
      assessmentId.length > 0 ? assessmentId : hub.auditLineageLink.assessmentId ?? "";
    const resolvedAuditSnapshotId =
      auditEvidenceSnapshotId.length > 0
        ? auditEvidenceSnapshotId
        : hub.auditLineageLink.auditEvidenceSnapshotId ?? "";
    const resolvedControlId = controlId.length > 0 ? controlId : hub.auditLineageLink.controlId ?? "";

    if (
      resolvedAssessmentId.length === 0
      || resolvedAuditSnapshotId.length === 0
      || resolvedControlId.length === 0
    ) {
      return null;
    }

    const activeMatch = hub.auditLineageLink.matches.find(
      (match) => match.controlId === resolvedControlId,
    );
    const labelParts = activeMatch != null
      ? [activeMatch.controlNumber, activeMatch.controlTitle]
      : [hub.auditLineageLink.controlNumber, hub.auditLineageLink.controlTitle];

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
  }, [assessmentId, auditEvidenceSnapshotId, controlId, hub]);

  const workbenchLinkAuditContext = useMemo(
    () => toWorkbenchLinkAuditContext(askAuditContext),
    [askAuditContext],
  );

  const hasStaleAuditUrlParams = useMemo(
    () => hasStaleInfraEvidenceAuditUrlParams(searchParams),
    [searchParams],
  );

  const auditScopeActive = parseInfraEvidenceWorkbenchAuditScopeFromSearch(searchParams) != null;

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

  const hasTerraformMapping = useMemo(() => {
    if (hub == null) {
      return false;
    }

    const terraformAddress = hub.terraformAddress?.trim() ?? "";

    return terraformAddress.length > 0;
  }, [hub]);

  const diagramCorrespondenceRemediationHref = useMemo(() => {
    if (hub?.diagramCorrespondence == null) {
      return null;
    }

    return buildDiagramReconcileRemediationHref({
      row: hub.diagramCorrespondence,
      runId,
      snapshotId: resolvedSnapshotId,
      scopedCloudResourceId: cloudResourceId,
      ...workbenchLinkAuditContext,
    });
  }, [cloudResourceId, hub?.diagramCorrespondence, resolvedSnapshotId, runId, workbenchLinkAuditContext]);

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
        setFindingActionMessages((current) => ({
          ...current,
          [trimmedFindingId]: {
            message: result.blockers.join(" ") || result.errorMessage || "Remediation create failed.",
            instanceId: null,
          },
        }));
        return;
      }

      setFindingActionMessages((current) => ({
        ...current,
        [trimmedFindingId]: {
          message: "Remediation instance created.",
          instanceId: result.instanceId,
        },
      }));

      invalidateInfraEvidenceResourceHubCacheForResource(cloudResourceId);
      await loadHub();
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
              {hub?.externalResourceId ?? cloudResourceId}
            </p>
          </CollapsibleSection>
        </section>
      ) : (
        <section
          className={cnCard}
          aria-label="Resource identifiers"
          data-testid="infra-resource-hub-identifier-strip"
        >
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
                {hub?.externalResourceId ?? cloudResourceId}
                <CopyIdButton
                  value={hub?.externalResourceId ?? cloudResourceId}
                  aria-label="Copy ARM resource path"
                />
              </dd>
            </div>
          </dl>
        </section>
      )}

      {auditScopeActive && workbenchLinkAuditContext != null ? (
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

      {hasStaleAuditUrlParams ? (
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
        <EnterpriseCompactEmptyState
          role="alert"
          title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_LOAD_ERROR_TITLE}
          description={loadError}
          testId="infra-resource-hub-load-error"
          footer={
            <Button type="button" variant="outline" size="sm" onClick={() => void loadHub()}>
              Retry
            </Button>
          }
        />
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
              <p
                className={cn("m-0 inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}
                role="status"
                data-testid="infra-resource-hub-refreshing"
              >
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Refreshing…
              </p>
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
            {hub.auditLineageLink.available !== true ? (
              <InfraAuditLineageUnavailableBanner
                degradedReason={hub.auditLineageLink.degradedReason}
                testId="infra-resource-hub-overview-audit-unavailable"
              />
            ) : null}
            <section className={cnCard}>
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Ask about this resource</h2>
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                Open Infrastructure Ask with this resource and snapshot context prefilled.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3" data-testid="infra-resource-hub-open-ask">
                <Link
                  href={buildInfrastructureAskHref({
                    cloudResourceId,
                    snapshotId: resolvedSnapshotId,
                    runId,
                    hubTab: "overview",
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
                    })}
                    data-testid="infra-resource-hub-open-audit-work"
                  >
                    Open audit lineage
                  </Link>
                ) : null}
              </div>
            </section>

            <section className={cnCard}>
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Current configuration</h2>
              {hub.currentConfiguration == null ? (
                <EnterpriseCompactEmptyState
                  title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CONFIG_EMPTY_TITLE}
                  description={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_CONFIG_EMPTY_BODY}
                  testId="infra-resource-hub-config-empty"
                />
              ) : (
                <>
                  <dl className="grid gap-2 text-sm md:grid-cols-3">
                    <div>
                      <dt className="font-medium">Resource type</dt>
                      <dd>{hub.currentConfiguration.resourceType}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Resource group</dt>
                      <dd>{hub.currentConfiguration.resourceGroup ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="font-medium">Region</dt>
                      <dd>{hub.currentConfiguration.region ?? "—"}</dd>
                    </div>
                  </dl>
                  {Object.keys(hub.currentConfiguration.properties).length > 0 ? (
                    <div className="mt-4">
                      <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Properties</h3>
                      <EnterpriseTable ariaLabel="Resource properties">
                        <EnterpriseTableHead>
                          <EnterpriseTableRow>
                            <EnterpriseTableHeaderCell>Key</EnterpriseTableHeaderCell>
                            <EnterpriseTableHeaderCell>Value</EnterpriseTableHeaderCell>
                          </EnterpriseTableRow>
                        </EnterpriseTableHead>
                        <EnterpriseTableBody>
                          {Object.entries(hub.currentConfiguration.properties).map(([key, value]) => (
                            <EnterpriseTableRow key={key}>
                              <EnterpriseTableCell className="font-mono text-xs">{key}</EnterpriseTableCell>
                              <EnterpriseTableCell className="font-mono text-xs">{value}</EnterpriseTableCell>
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
                      <EnterpriseTable ariaLabel="Resource tags">
                        <EnterpriseTableHead>
                          <EnterpriseTableRow>
                            <EnterpriseTableHeaderCell>Key</EnterpriseTableHeaderCell>
                            <EnterpriseTableHeaderCell>Value</EnterpriseTableHeaderCell>
                          </EnterpriseTableRow>
                        </EnterpriseTableHead>
                        <EnterpriseTableBody>
                          {Object.entries(hub.currentConfiguration.tags).map(([key, value]) => (
                            <EnterpriseTableRow key={key}>
                              <EnterpriseTableCell className="font-mono text-xs">{key}</EnterpriseTableCell>
                              <EnterpriseTableCell className="font-mono text-xs">{value}</EnterpriseTableCell>
                            </EnterpriseTableRow>
                          ))}
                        </EnterpriseTableBody>
                      </EnterpriseTable>
                    </div>
                  ) : (
                    <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>No tags captured.</p>
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
                    <EnterpriseTable ariaLabel="RBAC assignments">
                      <EnterpriseTableHead>
                        <EnterpriseTableRow>
                          <EnterpriseTableHeaderCell>Principal</EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell>Role</EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell>Scope</EnterpriseTableHeaderCell>
                        </EnterpriseTableRow>
                      </EnterpriseTableHead>
                      <EnterpriseTableBody>
                        {hub.rbacAssignments.map((assignment) => (
                          <EnterpriseTableRow key={`${assignment.principalId}-${assignment.roleDefinitionId}`}>
                            <EnterpriseTableCell className="font-mono text-xs">{assignment.principalId}</EnterpriseTableCell>
                            <EnterpriseTableCell className="font-mono text-xs">{assignment.roleDefinitionId}</EnterpriseTableCell>
                            <EnterpriseTableCell className="font-mono text-xs">{assignment.scope}</EnterpriseTableCell>
                          </EnterpriseTableRow>
                        ))}
                      </EnterpriseTableBody>
                    </EnterpriseTable>
                  </div>
                ) : (
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No RBAC assignments captured.</p>
                )}
                {hub.networkRelationships.length > 0 ? (
                  <div className="mb-4">
                    <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Network relationships</h3>
                    <EnterpriseTable ariaLabel="Network relationships">
                      <EnterpriseTableHead>
                        <EnterpriseTableRow>
                          <EnterpriseTableHeaderCell>Type</EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell>From</EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell>To</EnterpriseTableHeaderCell>
                        </EnterpriseTableRow>
                      </EnterpriseTableHead>
                      <EnterpriseTableBody>
                        {hub.networkRelationships.map((relationship) => (
                          <EnterpriseTableRow key={`${relationship.fromAzureResourceId}-${relationship.toAzureResourceId}`}>
                            <EnterpriseTableCell>{relationship.relationshipType}</EnterpriseTableCell>
                            <EnterpriseTableCell className="font-mono text-xs">{relationship.fromAzureResourceId}</EnterpriseTableCell>
                            <EnterpriseTableCell className="font-mono text-xs">{relationship.toAzureResourceId}</EnterpriseTableCell>
                          </EnterpriseTableRow>
                        ))}
                      </EnterpriseTableBody>
                    </EnterpriseTable>
                  </div>
                ) : (
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No network relationships captured.</p>
                )}
                {hub.evidencePointers.length > 0 ? (
                  <div>
                    <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Evidence pointers</h3>
                    <EnterpriseTable ariaLabel="Evidence pointers">
                      <EnterpriseTableHead>
                        <EnterpriseTableRow>
                          <EnterpriseTableHeaderCell>Kind</EnterpriseTableHeaderCell>
                          <EnterpriseTableHeaderCell>Path</EnterpriseTableHeaderCell>
                        </EnterpriseTableRow>
                      </EnterpriseTableHead>
                      <EnterpriseTableBody>
                        {hub.evidencePointers.map((pointer) => (
                          <EnterpriseTableRow key={`${pointer.kind}-${pointer.relativePath}`}>
                            <EnterpriseTableCell>{pointer.kind}</EnterpriseTableCell>
                            <EnterpriseTableCell className="font-mono text-xs">{pointer.relativePath}</EnterpriseTableCell>
                          </EnterpriseTableRow>
                        ))}
                      </EnterpriseTableBody>
                    </EnterpriseTable>
                  </div>
                ) : (
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No evidence pointers linked.</p>
                )}
              </section>
            ) : null}

            {hub.recentChanges.length > 0 ? (
              <section className={cnCard}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Recent changes</h2>
                  {hub.recentChanges.length > 5 ? (
                    <Link
                      className={OPERATOR_LINK.inline}
                      href={buildHubScopedTabHref(cloudResourceId, "drift", resolvedSnapshotId, runId, workbenchLinkAuditContext)}
                      data-testid="infra-resource-hub-overview-view-all-drift"
                    >
                      View all {hub.recentChanges.length} in Drift
                    </Link>
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
                    buildHubDriftChangeAskHref(cloudResourceId, resolvedSnapshotId, runId, change, askAuditContext)}
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
                  buildHubDriftChangeAskHref(cloudResourceId, resolvedSnapshotId, runId, change, askAuditContext)}
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
                      hub.diagramCorrespondence.matchKind,
                      hub.diagramCorrespondence.confidenceBand,
                    )}
                    label={hub.diagramCorrespondence.matchKind}
                  />
                  <StatusTag
                    kind={resolveDiagramCorrespondenceConfidenceStatusKind(hub.diagramCorrespondence.confidenceBand)}
                    label={hub.diagramCorrespondence.confidenceBand}
                  />
                </div>
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>{hub.diagramCorrespondence.explainText}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button asChild variant="outline" size="sm" data-testid="infra-resource-hub-diagram-reconcile">
                    <Link
                      href={buildResourceHubDiagramReconcileWorkbenchHref(
                        resolvedSnapshotId,
                        runId,
                        hub.diagramCorrespondence.correspondenceId,
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
                        cloudResourceId,
                        resolvedSnapshotId,
                        runId,
                        hub.diagramCorrespondence.correspondenceId,
                        askAuditContext,
                      )}
                    >
                      Ask about this correspondence
                    </Link>
                  </Button>
                </div>
              </section>
            ) : (
              <EnterpriseCompactEmptyState
                title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_DIAGRAM_EMPTY_TITLE}
                description={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_DIAGRAM_EMPTY_BODY}
                testId="infra-resource-hub-diagram-empty"
              />
            )}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="terraform" className="mt-4 space-y-3">
            <section className={cnCard}>
              <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Advisory Terraform mapping</h2>
              <dl className="grid gap-2 text-sm">
                {buyerPolishedShell ? (
                  <CollapsibleSection
                    title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_TERRAFORM_ADDRESS_LABEL}
                    sectionTestId="infra-resource-hub-terraform-address-disclosure"
                    summaryLine={hub.terraformAddress ?? "Not mapped"}
                    open={infraResourceHubTechnicalKey === "terraformAddress"}
                    onToggle={(open) => setInfraResourceHubTechnicalKey(open ? "terraformAddress" : null)}
                  >
                    <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                      {hub.terraformAddress ?? "Not mapped"}
                    </p>
                  </CollapsibleSection>
                ) : (
                  <div>
                    <dt className="font-medium">Terraform address</dt>
                    <dd className="font-mono text-xs">{hub.terraformAddress ?? "Not mapped"}</dd>
                  </div>
                )}
                <div>
                  <dt className="font-medium">Generation method</dt>
                  <dd>{hub.terraformGenerationMethod ?? "—"}</dd>
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
            {[hub.operationalSecurityFindings, hub.architectureReviewFindings].map((stream) => (
              <section key={stream.streamKind} className={cnCard}>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{stream.streamLabel}</h2>
                  {formatResourceHubFindingStreamCaption(stream.items.length, stream.totalCount, stream.hasMore) != null ? (
                    <Link
                      className={OPERATOR_LINK.inline}
                      href={buildResourceScopedWorkbenchHref(cloudResourceId, "remediation", resolvedSnapshotId, workbenchLinkAuditContext, runId)}
                      data-testid={`infra-resource-hub-findings-stream-more-${stream.streamKind}`}
                    >
                      {formatResourceHubFindingStreamCaption(stream.items.length, stream.totalCount, stream.hasMore)}
                    </Link>
                  ) : null}
                </div>
                {stream.items.length === 0 ? (
                  <EnterpriseCompactEmptyState
                    title={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_FINDINGS_EMPTY_TITLE}
                    description={GOVERNANCE_INFRASTRUCTURE_RESOURCE_HUB_FINDINGS_EMPTY_BODY}
                    testId={`infra-resource-hub-findings-empty-${stream.streamKind}`}
                  />
                ) : (
                  <EnterpriseTable ariaLabel={`${stream.streamLabel} findings`}>
                    <EnterpriseTableHead>
                      <EnterpriseTableRow>
                        <EnterpriseTableHeaderCell>Title</EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                        <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                      </EnterpriseTableRow>
                    </EnterpriseTableHead>
                    <EnterpriseTableBody>
                      {stream.items.map((item) => (
                        <EnterpriseTableRow key={`${stream.streamKind}-${item.id}`}>
                          <EnterpriseTableCell>
                            <div className="space-y-1">
                              <div>{item.title}</div>
                              {findingActionMessages[item.id] != null ? (
                                <p
                                  className={cn("m-0 text-sm", OPERATOR_TYPOGRAPHY.helper)}
                                  role="status"
                                  data-testid={`infra-resource-hub-finding-message-${item.id}`}
                                >
                                  {findingActionMessages[item.id].message}
                                  {findingActionMessages[item.id].instanceId != null ? (
                                    <>
                                      {" "}
                                      <Link
                                        className={OPERATOR_LINK.inline}
                                        href={buildRemediationWorkbenchHref({
                                          cloudResourceId,
                                          instanceId: findingActionMessages[item.id].instanceId ?? undefined,
                                          snapshotId: resolvedSnapshotId,
                                          runId: runId.length > 0 ? runId : undefined,
                                          ...workbenchLinkAuditContext,
                                        })}
                                        data-testid={`infra-resource-hub-finding-created-factory-${item.id}`}
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
                            {item.severity != null ? <SeverityTag severity={item.severity} /> : "—"}
                          </EnterpriseTableCell>
                          <EnterpriseTableCell>
                            {item.status != null ? (
                              <StatusTag kind={findingStatusTagKind(item.status)} label={item.status} />
                            ) : (
                              "—"
                            )}
                          </EnterpriseTableCell>
                          <EnterpriseTableCell>
                            {stream.streamKind === "OperationalSecurity" ? (
                              <div className="flex flex-wrap gap-2">
                                <Button asChild size="sm" variant="outline">
                                  <Link
                                    href={buildRemediationWorkbenchHref({
                                      cloudResourceId,
                                      findingId: item.id,
                                      snapshotId: resolvedSnapshotId,
                                      runId: runId.length > 0 ? runId : undefined,
                                      ...workbenchLinkAuditContext,
                                    })}
                                    data-testid={`infra-resource-hub-finding-factory-${item.id}`}
                                  >
                                    Open in factory
                                  </Link>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="primary"
                                  data-testid={`infra-resource-hub-create-remediation-${item.id}`}
                                  disabled={findingActionBusyId === item.id}
                                  onClick={() => {
                                    setPendingRemediationFinding({ id: item.id, title: item.title });
                                  }}
                                >
                                  {findingActionBusyId === item.id ? "Creating…" : "Create remediation…"}
                                </Button>
                                <Button asChild size="sm" variant="outline">
                                  <Link
                                    href={buildHubFindingAskHref(cloudResourceId, resolvedSnapshotId, runId, item.id, askAuditContext)}
                                    data-testid={`infra-resource-hub-finding-ask-${item.id}`}
                                  >
                                    Ask
                                  </Link>
                                </Button>
                              </div>
                            ) : (
                              <Button asChild size="sm" variant="outline">
                                <Link
                                  href={buildHubFindingAskHref(cloudResourceId, resolvedSnapshotId, runId, item.id, askAuditContext)}
                                  data-testid={`infra-resource-hub-architecture-finding-ask-${item.id}`}
                                >
                                  Ask
                                </Link>
                              </Button>
                            )}
                          </EnterpriseTableCell>
                        </EnterpriseTableRow>
                      ))}
                    </EnterpriseTableBody>
                  </EnterpriseTable>
                )}
              </section>
            ))}
          </EnterpriseTabsContent>

          <EnterpriseTabsContent value="remediation" className="mt-4 space-y-3">
            <Link
              className={OPERATOR_LINK.inline}
              href={buildRemediationWorkbenchHref({ cloudResourceId, snapshotId: resolvedSnapshotId, runId: runId.length > 0 ? runId : undefined, ...workbenchLinkAuditContext })}
              data-testid="infra-resource-hub-open-remediation-factory"
            >
              Open remediation factory
            </Link>
            {hub.remediationInstances.hasMore ? (
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                {formatResourceHubFindingStreamCaption(
                  hub.remediationInstances.items.length,
                  hub.remediationInstances.totalCount,
                  hub.remediationInstances.hasMore,
                )}
              </p>
            ) : null}
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
                    <EnterpriseTableHeaderCell>Pattern</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                    <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                  </EnterpriseTableRow>
                </EnterpriseTableHead>
                <EnterpriseTableBody>
                  {hub.remediationInstances.items.map((item) => (
                    <EnterpriseTableRow key={item.instanceId}>
                      <EnterpriseTableCell className="font-mono text-xs">{item.patternKey}</EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <StatusTag kind={remediationInstanceStatusTagKind(item.status)} label={item.status} />
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={buildRemediationWorkbenchHref({
                                cloudResourceId,
                                instanceId: item.instanceId,
                                snapshotId: resolvedSnapshotId,
                                runId: runId.length > 0 ? runId : undefined,
                                ...workbenchLinkAuditContext,
                              })}
                              data-testid={`infra-resource-hub-remediation-factory-${item.instanceId}`}
                            >
                              Open in factory
                            </Link>
                          </Button>
                          <Button asChild size="sm" variant="outline">
                            <Link
                              href={buildHubRemediationAskHref(cloudResourceId, resolvedSnapshotId, runId, item.instanceId, askAuditContext)}
                              data-testid={`infra-resource-hub-remediation-ask-${item.instanceId}`}
                            >
                              Ask
                            </Link>
                          </Button>
                        </div>
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ))}
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
                    href={buildHubAuditLineageAskHref(cloudResourceId, resolvedSnapshotId, runId, {
                      assessmentId: resolvedAuditLineage.assessmentId,
                      auditEvidenceSnapshotId: resolvedAuditLineage.auditEvidenceSnapshotId,
                      controlId: resolvedAuditLineage.controlId,
                    })}
                    data-testid="infra-resource-hub-audit-ask"
                  >
                    Ask about this control
                  </Link>
                </div>
                {resolvedAuditLineage.matches.length > 1 ? (
                  <section className={cnCard} aria-label="Additional audit controls">
                    <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Other linked controls</h2>
                    <ul className="m-0 list-disc space-y-2 pl-5 text-sm">
                      {resolvedAuditLineage.matches.slice(1).map((match: CloudResourceAuditLineageMatch) => (
                        <li key={`${match.controlId}-${match.auditEvidenceSnapshotId}`}>
                          <div className="flex flex-wrap items-center gap-2">
                            <Link
                              className="text-al-link hover:underline"
                              href={buildAuditEvidenceLineageUiPath(
                                match.assessmentId,
                                match.auditEvidenceSnapshotId,
                                match.controlId,
                              )}
                            >
                              {match.controlNumber} · {match.controlTitle}
                            </Link>
                            <Link
                              className="text-sm text-al-link hover:underline"
                              href={buildHubAuditLineageAskHref(cloudResourceId, resolvedSnapshotId, runId, {
                                assessmentId: match.assessmentId,
                                auditEvidenceSnapshotId: match.auditEvidenceSnapshotId,
                                controlId: match.controlId,
                              })}
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
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  {hub.auditLineageLink.degradedReason ??
                    "No audit evidence snapshot rows reference this cloud resource yet."}
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
        findingTitle={pendingRemediationFinding?.title ?? ""}
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
