"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InfraEvidenceWorkbenchHeaderActions } from "@/components/infra-evidence/InfraEvidenceWorkbenchHeaderActions";
import { ShortcutHint } from "@/components/ShortcutHint";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { useOperatorRelativeFreshnessNowMs } from "@/hooks/use-operator-relative-freshness-now-ms";
import { buildDiagramReconcileWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-filter-url";
import { buildInfraEvidenceAuditControlOptions, buildInfraEvidenceAuditControlScopePatch } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
import type { CloudResourceAuditLineageMatch } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { invalidateInfraEvidenceResourceHubCacheForResource } from "@/lib/infra-evidence/infra-evidence-resource-hub-cache";
import { buildInfrastructureAskHref, resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  INFRA_REMEDIATION_FINDING_ID_DISCLOSURE_OPEN_PARAM,
  infraRemediationFindingIdDisclosureHrefFromSearch,
  parseInfraRemediationFindingIdDisclosureOpenFromSearch,
} from "@/lib/infra-evidence/infra-remediation-finding-id-disclosure-url";
import {
  INFRA_REMEDIATION_RESOURCE_ID_DISCLOSURE_OPEN_PARAM,
  infraRemediationResourceIdDisclosureHrefFromSearch,
  parseInfraRemediationResourceIdDisclosureOpenFromSearch,
} from "@/lib/infra-evidence/infra-remediation-resource-id-disclosure-url";
import {
  INFRA_REMEDIATION_VERIFY_HINT_DISCLOSURE_OPEN_PARAM,
  infraRemediationVerifyHintDisclosureHrefFromSearch,
  parseInfraRemediationVerifyHintDisclosureOpenFromSearch,
} from "@/lib/infra-evidence/infra-remediation-verify-hint-disclosure-url";
import {
  hasStaleInfraEvidenceAuditUrlParams,
  mergeInfrastructureAskAuditScope,
  mergeWorkbenchHubScopePatch,
  parseInfraEvidenceWorkbenchAuditScopeFromSearch,
} from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import { InfraEvidenceSelectionAnnouncer } from "@/components/infra-evidence/InfraEvidenceSelectionAnnouncer";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";
import { useInfraEvidenceResourceHubAuditLineage } from "@/hooks/use-infra-evidence-resource-hub-audit-lineage";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { remediationWorkbenchHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-remediation-filter-url";
import { formatResourceHubTabViewLabel } from "@/lib/infra-evidence/infra-evidence-hub-tab-labels";
import {
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_FINDING_ID_LABEL,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_FINDING_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SNAPSHOT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_NOT_SCOPED_LABEL,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_SCOPED_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { REMEDIATION_WORKBENCH_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-remediation-page-shortcuts";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import {
  fetchInfraEvidenceSnapshots,
} from "@/lib/infra-evidence/infra-evidence-drift-api";
import { formatInfraEvidenceSnapshotLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  approveRemediationInstance,
  assignRemediationWave,
  closeRemediationInstance,
  createRemediationInstance,
  executeRemediationInstance,
  fetchRemediationFactorySummary,
  fetchRemediationInstanceDetail,
  fetchRemediationInstances,
  fetchRemediationPrioritizedFindings,
  fetchRemediationWaves,
  formatInfraEvidenceRemediationApiError,
  matchOperationalFinding,
  runRemediationPreflight,
  verifyRemediationInstance,
} from "@/lib/infra-evidence/infra-evidence-remediation-api";
import {
  canApproveRemediationInstance,
  canAssignRemediationWave,
  canCloseRemediationInstance,
  canExecuteRemediationInstance,
  canRunRemediationPreflight,
  canVerifyRemediationInstance,
  isRemediationTransitionBlocked,
  mapRemediationInstanceStatusToColumn,
} from "@/lib/infra-evidence/infra-evidence-remediation-stages";
import {
  REMEDIATION_EXECUTE_DISCLAIMER,
  REMEDIATION_WORKBENCH_COLUMNS,
  type RemediationInstanceDetail,
  type RemediationInstanceSummary,
  type RemediationWorkbenchColumn,
} from "@/lib/infra-evidence/infra-evidence-remediation-types";
import {
  buildResourceHubWorkbenchHref,
  parseInfraEvidenceWorkbenchQueryValue,
  REMEDIATION_WORKBENCH_CLOUD_RESOURCE_ID_PARAM,
  REMEDIATION_WORKBENCH_CORRESPONDENCE_ID_PARAM,
  REMEDIATION_WORKBENCH_FINDING_ID_PARAM,
  REMEDIATION_WORKBENCH_RUN_ID_PARAM,
  REMEDIATION_WORKBENCH_SNAPSHOT_ID_PARAM,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";
import { remediationInstanceMutationBlockedReason } from "@/lib/infra-evidence/remediation-instance-mutation-blocked-reason";
import {
  remediationLifecycleActionBlockedReason,
  type RemediationLifecycleAction,
} from "@/lib/infra-evidence/remediation-lifecycle-action-blocked-reason";
import { remediationInstancesPathForProductLine } from "@/lib/product-line/securenow-remediation-instances-route";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

import { RemediationBreadcrumb } from "./RemediationBreadcrumb";
import { RemediationClaimOrientationStrip } from "./RemediationClaimOrientationStrip";
import { RemediationWorkbenchContextStrip } from "./RemediationWorkbenchContextStrip";
import {
  remediationWorkbenchDataStaleCue,
  remediationWorkbenchFreshnessLabel,
} from "./remediation-workbench-freshness";

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

const cnField =
  "rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

const REMEDIATION_DETAIL_SECTION_ID = "infra-remediation-detail-section";

function activateSelectableCard(event: KeyboardEvent, onActivate: () => void): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

function formatRemediationWorkbenchApiError(error: unknown): string {
  const failure = toApiLoadFailure(error);
  const blocked = remediationInstanceMutationBlockedReason(failure);

  return blocked ?? formatInfraEvidenceRemediationApiError(error);
}

function buildDiagramReconcileHref(context: {
  readonly correspondenceId: string | null;
  readonly runId?: string | null;
  readonly snapshotId?: string | null;
  readonly cloudResourceId?: string | null;
}): string | null {
  if (context.correspondenceId == null || context.correspondenceId.trim().length === 0) {
    return null;
  }

  return buildDiagramReconcileWorkbenchHref({
    reconcileFilter: "Conflict",
    correspondenceId: context.correspondenceId,
    runId: context.runId,
    snapshotId: context.snapshotId,
    cloudResourceId: context.cloudResourceId,
  });
}

function buildDiagramHubHref(context: {
  readonly cloudResourceId: string;
  readonly runId?: string | null;
  readonly snapshotId?: string | null;
  readonly assessmentId?: string | null;
  readonly auditEvidenceSnapshotId?: string | null;
  readonly controlId?: string | null;
}): string {
  const trimmedRunId = context.runId?.trim() ?? "";
  const trimmedSnapshotId = context.snapshotId?.trim() ?? "";

  return resourceHubFilterHrefFromSearch(context.cloudResourceId.trim(), "", {
    tab: "diagram",
    snapshotId: trimmedSnapshotId.length > 0 ? trimmedSnapshotId : undefined,
    runId: trimmedRunId.length > 0 ? trimmedRunId : undefined,
    assessmentId: context.assessmentId?.trim().length ? context.assessmentId?.trim() : undefined,
    auditEvidenceSnapshotId: context.auditEvidenceSnapshotId?.trim().length
      ? context.auditEvidenceSnapshotId?.trim()
      : undefined,
    controlId: context.controlId?.trim().length ? context.controlId?.trim() : undefined,
  });
}

export function RemediationWorkbenchClient() {
  const buyerPolishedShell = useProductionEvalChrome();
  const { productLine } = useProductLine();
  const nowMs = useOperatorRelativeFreshnessNowMs();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const navHref = useMemo(() => remediationInstancesPathForProductLine(productLine), [productLine]);
  const searchParams = useSearchParams();
  const boardNavRef = useRef<HTMLDivElement>(null);
  const [focusedBoardIndex, setFocusedBoardIndex] = useState(0);
  const remediationResourceIdOpenParam = searchParams.get(INFRA_REMEDIATION_RESOURCE_ID_DISCLOSURE_OPEN_PARAM);
  const remediationFindingIdOpenParam = searchParams.get(INFRA_REMEDIATION_FINDING_ID_DISCLOSURE_OPEN_PARAM);
  const remediationVerifyHintOpenParam = searchParams.get(INFRA_REMEDIATION_VERIFY_HINT_DISCLOSURE_OPEN_PARAM);
  const [remediationResourceIdOpen, setRemediationResourceIdOpenState] = useState(() =>
    parseInfraRemediationResourceIdDisclosureOpenFromSearch(remediationResourceIdOpenParam),
  );
  const [remediationFindingIdOpen, setRemediationFindingIdOpenState] = useState(() =>
    parseInfraRemediationFindingIdDisclosureOpenFromSearch(remediationFindingIdOpenParam),
  );
  const [remediationVerifyHintOpen, setRemediationVerifyHintOpenState] = useState(() =>
    parseInfraRemediationVerifyHintDisclosureOpenFromSearch(remediationVerifyHintOpenParam),
  );

  const syncRemediationResourceIdOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        infraRemediationResourceIdDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRemediationResourceIdOpen = useCallback(
    (open: boolean) => {
      setRemediationResourceIdOpenState(open);
      syncRemediationResourceIdOpenToUrl(open);
    },
    [syncRemediationResourceIdOpenToUrl],
  );

  const syncRemediationFindingIdOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        infraRemediationFindingIdDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRemediationFindingIdOpen = useCallback(
    (open: boolean) => {
      setRemediationFindingIdOpenState(open);
      syncRemediationFindingIdOpenToUrl(open);
    },
    [syncRemediationFindingIdOpenToUrl],
  );

  const syncRemediationVerifyHintOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        infraRemediationVerifyHintDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRemediationVerifyHintOpen = useCallback(
    (open: boolean) => {
      setRemediationVerifyHintOpenState(open);
      syncRemediationVerifyHintOpenToUrl(open);
    },
    [syncRemediationVerifyHintOpenToUrl],
  );

  useEffect(() => {
    setRemediationResourceIdOpenState(parseInfraRemediationResourceIdDisclosureOpenFromSearch(remediationResourceIdOpenParam));
  }, [remediationResourceIdOpenParam]);

  useEffect(() => {
    setRemediationFindingIdOpenState(parseInfraRemediationFindingIdDisclosureOpenFromSearch(remediationFindingIdOpenParam));
  }, [remediationFindingIdOpenParam]);

  useEffect(() => {
    setRemediationVerifyHintOpenState(parseInfraRemediationVerifyHintDisclosureOpenFromSearch(remediationVerifyHintOpenParam));
  }, [remediationVerifyHintOpenParam]);

  const urlFindingId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(REMEDIATION_WORKBENCH_FINDING_ID_PARAM));
  const urlInstanceId = searchParams.get("instanceId")?.trim() ?? "";
  const urlCorrespondenceId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(REMEDIATION_WORKBENCH_CORRESPONDENCE_ID_PARAM),
  );
  const urlReconcileRunId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(REMEDIATION_WORKBENCH_RUN_ID_PARAM));
  const urlReconcileSnapshotId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(REMEDIATION_WORKBENCH_SNAPSHOT_ID_PARAM),
  );
  const urlCloudResourceId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(REMEDIATION_WORKBENCH_CLOUD_RESOURCE_ID_PARAM),
  );

  const [instances, setInstances] = useState<RemediationInstanceSummary[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState(urlInstanceId);
  const [detail, setDetail] = useState<RemediationInstanceDetail | null>(null);
  const [snapshots, setSnapshots] = useState<InfraEvidenceSnapshotSummary[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState("");
  const [waves, setWaves] = useState<Array<{ waveId: string; name: string }>>([]);
  const [selectedWaveId, setSelectedWaveId] = useState("");
  const [summaryOpenFindings, setSummaryOpenFindings] = useState(0);
  const [summaryRemediatedWeek, setSummaryRemediatedWeek] = useState(0);
  const [summaryBlocked, setSummaryBlocked] = useState(0);
  const [rankedFindings, setRankedFindings] = useState<Array<{ findingId: string; explanationSummary: string }>>([]);
  const [wavePlanner, setWavePlanner] = useState<Array<{ waveId: string; name: string; memberCount: number; targetSize: number | null }>>([]);
  const [findingIdInput, setFindingIdInput] = useState(urlFindingId);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [pendingAction, setPendingAction] = useState<RemediationLifecycleAction | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const visibleInstances = instances;

  const findingScopedInstance = useMemo(
    () => (urlFindingId.length > 0 ? visibleInstances[0] ?? null : null),
    [urlFindingId, visibleInstances],
  );

  const groupedInstances = useMemo(() => {
    const groups = new Map<RemediationWorkbenchColumn, RemediationInstanceSummary[]>();

    for (const column of REMEDIATION_WORKBENCH_COLUMNS) {
      groups.set(column.id, []);
    }

    for (const instance of visibleInstances) {
      const column = mapRemediationInstanceStatusToColumn(instance.status);
      groups.get(column)?.push(instance);
    }

    return groups;
  }, [visibleInstances]);

  const auditScope = useMemo(() => parseInfraEvidenceWorkbenchAuditScopeFromSearch(searchParams), [searchParams]);
  const hasStaleAuditUrlParams = useMemo(
    () => hasStaleInfraEvidenceAuditUrlParams(searchParams),
    [searchParams],
  );
  const remediationSnapshotId = urlReconcileSnapshotId.length > 0 ? urlReconcileSnapshotId : selectedSnapshotId;
  const workbenchHubScopePatch = useMemo(
    () => mergeWorkbenchHubScopePatch(remediationSnapshotId, auditScope, urlReconcileRunId),
    [auditScope, remediationSnapshotId, urlReconcileRunId],
  );
  const { hub: resourceHub } = useInfraEvidenceResourceHubAuditLineage(
    urlCloudResourceId,
    remediationSnapshotId,
  );
  const auditControlOptions = useMemo(
    () => buildInfraEvidenceAuditControlOptions(resourceHub),
    [resourceHub],
  );
  const onAuditControlChange = useCallback((match: CloudResourceAuditLineageMatch) => {
    router.replace(
      remediationWorkbenchHrefFromSearch(searchParams, buildInfraEvidenceAuditControlScopePatch(match)),
      { scroll: false },
    );
  }, [router, searchParams]);

  const syncRemediationUrl = useCallback(
    (patch: { readonly instanceId?: string | null }) => {
      router.replace(remediationWorkbenchHrefFromSearch(searchParams, patch), { scroll: false });
    },
    [router, searchParams],
  );

  const deepLinkedInstanceMissing = useMemo(() => {
    if (urlInstanceId.length === 0 || loading) {
      return false;
    }

    return !visibleInstances.some((instance) => instance.instanceId === urlInstanceId);
  }, [loading, urlInstanceId, visibleInstances]);

  const remediationScopeExtraLinks = useMemo(() => {
    if (urlCorrespondenceId.length === 0) {
      return [];
    }

    return [
      {
        testId: "infra-remediation-open-diagram-hub",
        href: buildDiagramHubHref({
          cloudResourceId: urlCloudResourceId,
          runId: urlReconcileRunId,
          snapshotId: urlReconcileSnapshotId,
          assessmentId: auditScope?.assessmentId ?? null,
          auditEvidenceSnapshotId: auditScope?.auditEvidenceSnapshotId ?? null,
          controlId: auditScope?.controlId ?? null,
        }),
        label: "View diagram correspondence in hub",
      },
    ];
  }, [auditScope, urlCloudResourceId, urlCorrespondenceId, urlReconcileRunId, urlReconcileSnapshotId]);

  const loadWorkbench = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    try {
      const [instanceRows, summary, prioritized, waveRows, snapshotResponse] = await Promise.all([
        fetchRemediationInstances({
          cloudResourceId: urlCloudResourceId.length > 0 ? urlCloudResourceId : null,
          findingId: urlFindingId.length > 0 ? urlFindingId : null,
        }),
        fetchRemediationFactorySummary(),
        fetchRemediationPrioritizedFindings(),
        fetchRemediationWaves(),
        fetchInfraEvidenceSnapshots(1, 20),
      ]);

      setInstances(instanceRows);
      setSummaryOpenFindings(summary.factoryMetrics.openFindings);
      setSummaryRemediatedWeek(summary.factoryMetrics.remediatedThisWeek);
      setSummaryBlocked(summary.factoryMetrics.businessBlockedCount);
      setRankedFindings(
        prioritized.map((row) => ({
          findingId: row.findingId,
          explanationSummary: row.explanationSummary,
        })),
      );
      setWavePlanner(
        summary.waves.map((wave) => ({
          waveId: wave.waveId,
          name: wave.name,
          memberCount: wave.memberCount,
          targetSize: wave.targetSize,
        })),
      );
      setWaves(waveRows);
      setSnapshots(snapshotResponse.items ?? []);

      if (selectedSnapshotId.length === 0 && (snapshotResponse.items?.length ?? 0) > 0) {
        setSelectedSnapshotId(snapshotResponse.items![0].snapshotId);
      }

      if (selectedWaveId.length === 0 && waveRows.length > 0) {
        setSelectedWaveId(waveRows[0].waveId);
      }

      setLastRefreshedAt(new Date());
    } catch (error: unknown) {
      setLoadError(formatRemediationWorkbenchApiError(error));
    } finally {
      setLoading(false);
    }
  }, [selectedSnapshotId, selectedWaveId, urlCloudResourceId, urlFindingId]);

  const loadDetail = useCallback(async (instanceId: string) => {
    if (instanceId.length === 0) {
      setDetail(null);
      return;
    }

    setDetailLoading(true);

    try {
      const response = await fetchRemediationInstanceDetail(instanceId);
      setDetail(response);
    } catch (error: unknown) {
      setLoadError(formatRemediationWorkbenchApiError(error));
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWorkbench();
  }, [loadWorkbench]);

  useEffect(() => {
    setFindingIdInput(urlFindingId);
  }, [urlFindingId]);

  useEffect(() => {
    if (urlInstanceId.length > 0) {
      setSelectedInstanceId(urlInstanceId);
      return;
    }

    if (findingScopedInstance != null) {
      setSelectedInstanceId(findingScopedInstance.instanceId);
      return;
    }

    if (urlCloudResourceId.length > 0 && visibleInstances.length > 0) {
      setSelectedInstanceId(visibleInstances[0].instanceId);
    }
  }, [findingScopedInstance, urlCloudResourceId, urlInstanceId, visibleInstances]);

  useEffect(() => {
    void loadDetail(selectedInstanceId);
  }, [loadDetail, selectedInstanceId]);

  const refreshAfterAction = async (instanceId: string | null) => {
    await loadWorkbench();

    if (instanceId != null && instanceId.length > 0) {
      setSelectedInstanceId(instanceId);
      await loadDetail(instanceId);
    }
  };

  const runCreateFromFinding = async () => {
    const findingId = findingIdInput.trim();

    if (findingId.length === 0) {
      return;
    }

    setActionBusy(true);
    setPendingAction("create");
    setActionMessage(null);

    try {
      await matchOperationalFinding(findingId);
      const result = await createRemediationInstance(findingId);

      if (!result.succeeded) {
        setActionMessage(result.blockers.join(" ") || result.errorMessage || "Create failed.");
        return;
      }

      if (result.instanceId != null) {
        setSelectedInstanceId(result.instanceId);
      }

      if (urlCloudResourceId.length > 0) {
        invalidateInfraEvidenceResourceHubCacheForResource(urlCloudResourceId);
      }

      await refreshAfterAction(result.instanceId);
    } catch (error: unknown) {
      setActionMessage(formatRemediationWorkbenchApiError(error));
    } finally {
      setActionBusy(false);
      setPendingAction(null);
    }
  };

  const runLifecycleAction = async (
    lifecycleAction: RemediationLifecycleAction,
    action: () => Promise<{ succeeded: boolean; instanceId: string | null; blockers: string[]; errorMessage: string | null }>,
  ) => {
    setActionBusy(true);
    setPendingAction(lifecycleAction);
    setActionMessage(null);

    try {
      const result = await action();

      if (!result.succeeded) {
        setActionMessage(result.blockers.join(" ") || result.errorMessage || "Action blocked.");
      }

      await refreshAfterAction(result.instanceId ?? selectedInstanceId);
    } catch (error: unknown) {
      setActionMessage(formatRemediationWorkbenchApiError(error));
    } finally {
      setActionBusy(false);
      setPendingAction(null);
    }
  };

  const selectedStatus = detail?.instance.status ?? null;
  const executionSnapshotId = detail?.instance.executionSnapshotId ?? null;
  const blockers = detail?.instance.status === "PreflightBlocked" ? ["Preflight blocked"] : [];
  const transitionsBlocked = selectedStatus != null && isRemediationTransitionBlocked(selectedStatus, blockers);

  const snapshotOptions = useMemo(() => {
    if (selectedStatus !== "Executed" || executionSnapshotId == null || executionSnapshotId.length === 0) {
      return snapshots;
    }

    return snapshots.filter((snapshot) => snapshot.snapshotId !== executionSnapshotId);
  }, [executionSnapshotId, selectedStatus, snapshots]);

  useEffect(() => {
    if (selectedStatus !== "Executed" || snapshotOptions.length === 0) {
      return;
    }

    const currentIsEligible = snapshotOptions.some((snapshot) => snapshot.snapshotId === selectedSnapshotId);

    if (!currentIsEligible) {
      setSelectedSnapshotId(snapshotOptions[0].snapshotId);
    }
  }, [selectedSnapshotId, selectedStatus, snapshotOptions]);

  const diagramReconcileHref = buildDiagramReconcileHref({
    correspondenceId: urlCorrespondenceId,
    runId: urlReconcileRunId,
    snapshotId: urlReconcileSnapshotId,
    cloudResourceId: urlCloudResourceId,
  });

  const remediationAskHref = useMemo(() => {
    const scopedCloudResourceId = urlCloudResourceId.length > 0
      ? urlCloudResourceId
      : detail?.instance.cloudResourceId?.trim() ?? "";

    if (scopedCloudResourceId.length === 0) {
      return null;
    }

    const scopedFindingId = urlFindingId.length > 0
      ? urlFindingId
      : detail?.finding?.findingId?.trim() ?? "";
    const scopedInstanceId = selectedInstanceId.length > 0 ? selectedInstanceId : urlInstanceId;

    return buildInfrastructureAskHref({
      cloudResourceId: scopedCloudResourceId,
      snapshotId: urlReconcileSnapshotId.length > 0 ? urlReconcileSnapshotId : undefined,
      findingId: scopedFindingId.length > 0 ? scopedFindingId : undefined,
      instanceId: scopedInstanceId.length > 0 ? scopedInstanceId : undefined,
      correspondenceId: urlCorrespondenceId.length > 0 ? urlCorrespondenceId : undefined,
      runId: urlReconcileRunId.length > 0 ? urlReconcileRunId : undefined,
      hubTab: "remediation",
      ...mergeInfrastructureAskAuditScope(auditScope),
    });
  }, [
    auditScope,
    detail,
    selectedInstanceId,
    urlCloudResourceId,
    urlCorrespondenceId,
    urlFindingId,
    urlInstanceId,
    urlReconcileRunId,
    urlReconcileSnapshotId,
  ]);

  const selectionAnnouncement = useMemo(() => {
    if (selectedInstanceId == null || selectedInstanceId.length === 0) {
      return null;
    }

    const selectedInstance = visibleInstances.find((instance) => instance.instanceId === selectedInstanceId);

    if (selectedInstance == null) {
      return `Showing remediation instance ${selectedInstanceId}.`;
    }

    return `Showing remediation instance ${selectedInstance.patternKey}.`;
  }, [selectedInstanceId, visibleInstances]);

  const flatBoardInstances = useMemo(
    () => REMEDIATION_WORKBENCH_COLUMNS.flatMap((column) => groupedInstances.get(column.id) ?? []),
    [groupedInstances],
  );

  useEffect(() => {
    const nextIndex = flatBoardInstances.findIndex((instance) => instance.instanceId === selectedInstanceId);

    if (nextIndex >= 0) {
      setFocusedBoardIndex(nextIndex);
    }
  }, [flatBoardInstances, selectedInstanceId]);

  const lifecycleBlockedContext = useMemo(
    () => ({
      actionBusy,
      selectedStatus,
      transitionsBlocked,
      findingIdInput,
      selectedWaveId,
      selectedSnapshotId,
    }),
    [actionBusy, findingIdInput, selectedSnapshotId, selectedStatus, selectedWaveId, transitionsBlocked],
  );

  const createBlockedReason = remediationLifecycleActionBlockedReason("create", lifecycleBlockedContext);
  const preflightBlockedReason = remediationLifecycleActionBlockedReason("preflight", lifecycleBlockedContext);
  const approveBlockedReason = remediationLifecycleActionBlockedReason("approve", lifecycleBlockedContext);
  const assignWaveBlockedReason = remediationLifecycleActionBlockedReason("assignWave", lifecycleBlockedContext);
  const executeBlockedReason = remediationLifecycleActionBlockedReason("execute", lifecycleBlockedContext);
  const verifyBlockedReason = remediationLifecycleActionBlockedReason("verify", lifecycleBlockedContext);
  const closeBlockedReason = remediationLifecycleActionBlockedReason("close", lifecycleBlockedContext);

  const freshnessLabel = remediationWorkbenchFreshnessLabel({
    lastRefreshedAt,
    refreshing: loading,
  });
  const staleCue = remediationWorkbenchDataStaleCue(lastRefreshedAt, nowMs);
  const loadRecovery = errorRecoveryContractForScenario("api-problem", {
    failureSummary: "Remediation instances could not be loaded.",
    productLineId: productLine,
  });

  const scopeStatusBadge = useMemo(() => {
    if (urlCloudResourceId.length > 0 || urlFindingId.length > 0) {
      return (
        <StatusTag
          kind="ready"
          label={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_SCOPED_LABEL}
          data-testid="infra-remediation-scope-status"
        />
      );
    }

    return (
      <StatusTag
        kind="needs-attention"
        label={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_NOT_SCOPED_LABEL}
        data-testid="infra-remediation-scope-status"
      />
    );
  }, [urlCloudResourceId, urlFindingId]);

  const workbenchScopeLabel = useMemo(() => {
    if (urlCloudResourceId.length > 0 && urlFindingId.length > 0) {
      return "Resource + finding scoped remediation instances";
    }

    if (urlCloudResourceId.length > 0) {
      return "Resource scoped remediation instances";
    }

    if (urlFindingId.length > 0) {
      return "Finding scoped remediation instances";
    }

    return "Remediation instances · current workspace scope";
  }, [urlCloudResourceId, urlFindingId]);

  const workbenchSelectionLabel = useMemo(() => {
    if (selectedInstanceId.length === 0) {
      return null;
    }

    const selectedInstance = visibleInstances.find((instance) => instance.instanceId === selectedInstanceId);

    if (selectedInstance == null) {
      return `Instance ${selectedInstanceId.slice(0, 8)}…`;
    }

    return `${selectedInstance.patternKey} · ${selectedInstance.status}`;
  }, [selectedInstanceId, visibleInstances]);

  const onBoardKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (flatBoardInstances.length === 0) {
        return;
      }

      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        const nextIndex = Math.min(focusedBoardIndex + 1, flatBoardInstances.length - 1);
        const nextInstance = flatBoardInstances[nextIndex];

        if (nextInstance !== undefined) {
          setFocusedBoardIndex(nextIndex);
          setSelectedInstanceId(nextInstance.instanceId);
          syncRemediationUrl({ instanceId: nextInstance.instanceId });
        }

        return;
      }

      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        const nextIndex = Math.max(focusedBoardIndex - 1, 0);
        const nextInstance = flatBoardInstances[nextIndex];

        if (nextInstance !== undefined) {
          setFocusedBoardIndex(nextIndex);
          setSelectedInstanceId(nextInstance.instanceId);
          syncRemediationUrl({ instanceId: nextInstance.instanceId });
        }
      }
    },
    [flatBoardInstances, focusedBoardIndex, syncRemediationUrl],
  );

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-remediation-workbench"
    >
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={navHref}
        title={GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PAGE_LEAD}
        claimDiscipline={GOVERNANCE_INFRASTRUCTURE_REMEDIATION_CLAIM_DISCIPLINE}
        claimDisciplineTestId="infra-remediation-claim-discipline"
        titleTestId="infra-remediation-page-title"
        metadata={
          <div className="flex flex-wrap items-center gap-3">
            <RemediationBreadcrumb />
            {staleCue !== null ? (
              <span data-testid="infra-remediation-stale-cue">
                <StatusTag kind="needs-attention" label={staleCue} />
              </span>
            ) : null}
          </div>
        }
        actions={
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-wrap items-center justify-end gap-2">
              <InfraEvidenceWorkbenchHeaderActions
                shortcutsTestId="infra-remediation-page-shortcuts"
                shortcuts={REMEDIATION_WORKBENCH_PAGE_SHORTCUTS}
                scopeStatusBadge={scopeStatusBadge}
                extraShortcutHints={
                  <>
                    {" "}
                    <ShortcutHint shortcut="j" />/<ShortcutHint shortcut="k" /> move lifecycle cards.
                  </>
                }
              />
              <RefreshButton
                busy={loading}
                data-testid="infra-remediation-refresh-button"
                onClick={() => void loadWorkbench()}
              />
            </div>
          </div>
        }
      />

      <main
        id={GOVERNANCE_INFRASTRUCTURE_REMEDIATION_PRIMARY_CONTENT_ID}
        className="flex w-full flex-col gap-4 scroll-mt-24 space-y-4"
        data-testid="infra-remediation-primary-content"
      >
      <InfraEvidenceSelectionAnnouncer message={selectionAnnouncement} testId="infra-remediation-selection-announcer" />

      <RemediationWorkbenchContextStrip
        freshnessLabel={freshnessLabel}
        lastRefreshedAt={lastRefreshedAt}
        scopeLabel={workbenchScopeLabel}
        selectionLabel={workbenchSelectionLabel}
        detailAnchorId={REMEDIATION_DETAIL_SECTION_ID}
      />

      {urlCloudResourceId.length > 0 ? (
        <section
          className={cnCard}
          data-testid="infra-remediation-resource-scope-banner"
          aria-label="Remediation factory resource scope"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            {buyerPolishedShell ? (
              GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SCOPE_LABEL
            ) : (
              <>
                Showing remediation instances for resource <span className="font-mono text-xs">{urlCloudResourceId}</span>.
              </>
            )}
            {buyerPolishedShell ? "." : null}
          </p>
          {buyerPolishedShell ? (
            <CollapsibleSection
              title="Resource id"
              sectionTestId="infra-remediation-resource-id-disclosure"
              summaryLine="Cloud resource UUID from the scoped link"
              open={remediationResourceIdOpen}
              onToggle={setRemediationResourceIdOpen}
            >
              <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {urlCloudResourceId}
              </p>
            </CollapsibleSection>
          ) : null}
          {(auditScope != null || resourceHub?.auditLineageLink.available === false || hasStaleAuditUrlParams) ? (
            <WorkbenchAuditLineageStatus
              auditScope={auditScope}
              hub={resourceHub}
              cloudResourceId={urlCloudResourceId}
              currentSearch={searchParams.toString()}
              snapshotId={remediationSnapshotId}
              runId={urlReconcileRunId}
              activeTab="remediation"
              hasStaleAuditUrlParams={hasStaleAuditUrlParams}
              auditControlOptions={auditControlOptions}
              onAuditControlChange={onAuditControlChange}
              provenanceTestId="infra-remediation-audit-provenance"
              unavailableTestId="infra-remediation-audit-unavailable"
            />
          ) : null}
          <WorkbenchHubScopeLinks
            cloudResourceId={urlCloudResourceId}
            primaryTab="remediation"
            primaryHref={buildResourceHubWorkbenchHref({
              cloudResourceId: urlCloudResourceId,
              tab: "remediation",
              ...workbenchHubScopePatch,
            })}
            primaryTestId="infra-remediation-open-primary-hub"
            siblingTestIdPrefix="infra-remediation"
            scopePatch={workbenchHubScopePatch}
            siblingTabs={["findings", "drift", "terraform"]}
            includeAuditTab={auditScope != null}
            extraLinks={remediationScopeExtraLinks}
          />
        </section>
      ) : null}

      {urlFindingId.length > 0 ? (
        <section
          className={cnCard}
          data-testid="infra-remediation-finding-scope-banner"
          aria-label="Remediation factory finding scope"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            {buyerPolishedShell ? (
              <>
                {GOVERNANCE_INFRASTRUCTURE_REMEDIATION_FINDING_SCOPE_LABEL}.
              </>
            ) : (
              <>
                Linked from finding <span className="font-mono text-xs">{urlFindingId}</span>.
              </>
            )}
            {findingScopedInstance == null
              ? " No remediation instance exists yet — use Match + create below."
              : " Matching remediation instance is selected on the board."}
          </p>
          {buyerPolishedShell ? (
            <CollapsibleSection
              title="Finding id"
              sectionTestId="infra-remediation-finding-id-disclosure"
              summaryLine="Operational finding UUID from the scoped link"
              open={remediationFindingIdOpen}
              onToggle={setRemediationFindingIdOpen}
            >
              <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {urlFindingId}
              </p>
            </CollapsibleSection>
          ) : null}
          {urlCloudResourceId.length > 0 ? (
            <>
              <Link
                className="mt-2 inline-block text-sm text-al-link hover:underline"
                href={buildResourceHubWorkbenchHref({
                  cloudResourceId: urlCloudResourceId,
                  tab: "findings",
                  snapshotId: urlReconcileSnapshotId.length > 0 ? urlReconcileSnapshotId : null,
                  ...workbenchHubScopePatch,
                })}
                data-testid="infra-remediation-finding-open-findings-hub"
              >
                Open findings in resource hub
              </Link>
              <Link
                className="mt-2 ml-4 inline-block text-sm text-al-link hover:underline"
                href={buildResourceHubWorkbenchHref({
                  cloudResourceId: urlCloudResourceId,
                  tab: "terraform",
                  snapshotId: urlReconcileSnapshotId.length > 0 ? urlReconcileSnapshotId : null,
                  ...workbenchHubScopePatch,
                })}
                data-testid="infra-remediation-finding-open-terraform-hub"
              >
                Open terraform mapping in resource hub
              </Link>
            </>
          ) : null}
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-3" aria-label="Remediation factory metrics">
        <div className={cnCard}>
          <p className={OPERATOR_TYPOGRAPHY.helper}>Open findings</p>
          <p className={OPERATOR_TYPOGRAPHY.sectionTitle}>{summaryOpenFindings}</p>
        </div>
        <div className={cnCard}>
          <p className={OPERATOR_TYPOGRAPHY.helper}>Remediated this week</p>
          <p className={OPERATOR_TYPOGRAPHY.sectionTitle}>{summaryRemediatedWeek}</p>
        </div>
        <div className={cnCard}>
          <p className={OPERATOR_TYPOGRAPHY.helper}>Preflight blocked</p>
          <p className={OPERATOR_TYPOGRAPHY.sectionTitle}>{summaryBlocked}</p>
        </div>
      </section>

      {diagramReconcileHref != null ? (
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
          <Link className="text-al-link hover:underline" href={diagramReconcileHref}>
            Open diagram reconciliation for the originating conflict row
          </Link>
        </p>
      ) : null}

      {remediationAskHref != null ? (
        <Button asChild variant="outline" size="sm" data-testid="infra-remediation-open-ask">
          <Link href={remediationAskHref}>Ask about this remediation scope</Link>
        </Button>
      ) : null}

      <section className={cn("grid gap-3", cnCard)} aria-label="Create remediation instance">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Create from finding</h2>
        <div className="flex flex-wrap gap-2">
          {buyerPolishedShell ? (
            <div className="grid min-w-[280px] flex-1 gap-2">
              <Label htmlFor="infra-remediation-finding-id">{GOVERNANCE_INFRASTRUCTURE_REMEDIATION_FINDING_ID_LABEL}</Label>
              <Input
                id="infra-remediation-finding-id"
                data-testid="infra-remediation-finding-id"
                value={findingIdInput}
                onChange={(event) => setFindingIdInput(event.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
              />
            </div>
          ) : (
            <input
              className={cn("min-w-[280px] flex-1 text-sm", cnField)}
              data-testid="infra-remediation-finding-id"
              value={findingIdInput}
              onChange={(event) => setFindingIdInput(event.target.value)}
              placeholder="Operational finding id"
            />
          )}
          <Button
            type="button"
            size="sm"
            variant="primary"
            data-testid="infra-remediation-create"
            disabled={actionBusy || findingIdInput.trim().length === 0}
            aria-describedby={createBlockedReason ? "infra-remediation-create-blocked-reason" : undefined}
            onClick={() => void runCreateFromFinding()}
          >
            {pendingAction === "create" ? "Creating instance…" : "Match + create instance"}
          </Button>
        </div>
        <WhyDisabledCtaHint
          id="infra-remediation-create-blocked-reason"
          reason={createBlockedReason ? { kind: "incomplete-input", message: createBlockedReason } : null}
          testId="infra-remediation-create-blocked-reason"
        />
        {rankedFindings.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {rankedFindings.slice(0, 3).map((finding) => (
              <Button
                key={finding.findingId}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFindingIdInput(finding.findingId)}
              >
                Use ranked finding {finding.findingId.slice(0, 8)}…
              </Button>
            ))}
          </div>
        ) : null}
      </section>

      {deepLinkedInstanceMissing ? (
        <p
          className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="infra-remediation-instance-deep-link-missing"
          role="status"
        >
          The linked remediation instance is not in the current factory scope
          {urlCloudResourceId.length > 0 ? " for this scoped resource" : ""}.
        </p>
      ) : null}

      {loadError != null ? (
        buyerPolishedShell ? (
          <div className="space-y-2" data-testid="infra-remediation-load-error-panel" role="alert">
            <OperatorSectionLoadFailure
              message={`${GOVERNANCE_INFRASTRUCTURE_REMEDIATION_LOAD_ERROR_TITLE} ${loadError}`}
              onRetry={() => void loadWorkbench()}
              retrying={loading}
              testId="infra-remediation-load-error-panel"
            />
            <OperatorErrorRecoveryContract presentation={loadRecovery} />
          </div>
        ) : (
          <p className="m-0 text-sm text-destructive" role="alert">{loadError}</p>
        )
      ) : null}

      {loading ? (
        <p className={cn("m-0 inline-flex items-center gap-2", OPERATOR_TYPOGRAPHY.helper)}>
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Loading remediation factory…
        </p>
      ) : (
        <section
          className="grid gap-3 xl:grid-cols-6"
          aria-label="Remediation instance lifecycle board"
          data-testid="infra-remediation-board"
          ref={boardNavRef}
          tabIndex={flatBoardInstances.length > 0 ? 0 : undefined}
          onKeyDown={onBoardKeyDown}
        >
          {REMEDIATION_WORKBENCH_COLUMNS.map((column) => (
            <div key={column.id} className={cn("p-3", cnCard)} data-testid={`infra-remediation-column-${column.id}`}>
              <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{column.label}</h3>
              <ul className="m-0 grid gap-2 p-0">
                {(groupedInstances.get(column.id) ?? []).map((instance) => {
                  const flatIndex = flatBoardInstances.findIndex((row) => row.instanceId === instance.instanceId);
                  const isFocused = flatIndex === focusedBoardIndex;

                  return (
                  <li key={instance.instanceId}>
                    <button
                      type="button"
                      className={cn(
                        "w-full rounded-md border border-neutral-200 px-2 py-2 text-left text-sm hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-border-focus)] dark:border-neutral-800 dark:hover:bg-neutral-900",
                        selectedInstanceId === instance.instanceId ? "bg-neutral-100 dark:bg-neutral-900/40" : undefined,
                        isFocused ? "ring-1 ring-inset ring-neutral-400" : undefined,
                      )}
                      data-testid={`infra-remediation-card-${instance.instanceId}`}
                      aria-selected={selectedInstanceId === instance.instanceId}
                      onClick={() => {
                        setSelectedInstanceId(instance.instanceId);
                        syncRemediationUrl({ instanceId: instance.instanceId });
                      }}
                      onKeyDown={(event) =>
                        activateSelectableCard(event, () => {
                          setSelectedInstanceId(instance.instanceId);
                          syncRemediationUrl({ instanceId: instance.instanceId });
                        })
                      }
                    >
                      <div className="font-medium">{instance.patternKey}</div>
                      <div className="text-xs text-al-text-secondary">{instance.status}</div>
                    </button>
                  </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>
      )}

      {selectedInstanceId.length > 0 ? (
        <section
          id={REMEDIATION_DETAIL_SECTION_ID}
          className={cn("grid gap-4", cnCard)}
          aria-label="Remediation instance detail"
          data-testid="infra-remediation-detail"
        >
          {detailLoading || detail == null ? (
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Loading instance detail…</p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{detail.instance.patternKey}</h2>
                <StatusTag kind="in-progress" label={detail.instance.status} />
              </div>

              {detail.finding != null ? (
                <dl className="grid gap-2 text-sm">
                  <div>
                    <dt className="font-medium">Finding</dt>
                    <dd>{detail.finding.title}</dd>
                  </div>
                  <div>
                    <dt className="font-medium">Severity</dt>
                    <dd>{detail.finding.severity ?? "—"}</dd>
                  </div>
                  {detail.finding.cloudResourceId != null ? (
                    <div>
                      <dt className="font-medium">Resource hub</dt>
                      <dd>
                        <Link
                          className="text-al-link hover:underline"
                          href={buildResourceHubWorkbenchHref({
                            cloudResourceId: detail.finding.cloudResourceId,
                            tab: "remediation",
                            ...workbenchHubScopePatch,
                          })}
                        >
                          {formatResourceHubTabViewLabel("remediation")}
                        </Link>
                      </dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}

              {detail.activeMatch != null ? (
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
                  Match: {detail.activeMatch.matchKind} — {detail.activeMatch.explainText}
                </p>
              ) : null}

              {buyerPolishedShell ? (
                <div className="grid max-w-md gap-2">
                  <Label htmlFor="infra-remediation-snapshot-picker">{GOVERNANCE_INFRASTRUCTURE_REMEDIATION_SNAPSHOT_LABEL}</Label>
                  <select
                    id="infra-remediation-snapshot-picker"
                    className={cnField}
                    data-testid="infra-remediation-snapshot-picker"
                    value={selectedSnapshotId}
                    onChange={(event) => setSelectedSnapshotId(event.target.value)}
                  >
                    {snapshotOptions.map((snapshot) => (
                      <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                        {formatInfraEvidenceSnapshotLabel(snapshot)}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <label className="grid max-w-md gap-1 text-sm">
                  <span className="font-medium">Inventory snapshot</span>
                  <select
                    className={cnField}
                    data-testid="infra-remediation-snapshot-picker"
                    value={selectedSnapshotId}
                    onChange={(event) => setSelectedSnapshotId(event.target.value)}
                  >
                    {snapshotOptions.map((snapshot) => (
                      <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                        {formatInfraEvidenceSnapshotLabel(snapshot)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {selectedStatus === "Executed" && executionSnapshotId != null ? (
                buyerPolishedShell ? (
                  <CollapsibleSection
                    title="Verify snapshot hint"
                    sectionTestId="infra-remediation-verify-hint-disclosure"
                    summaryLine="Execution snapshot excluded from verify picker"
                    open={remediationVerifyHintOpen}
                    onToggle={setRemediationVerifyHintOpen}
                  >
                    <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-remediation-verify-hint">
                      Verify requires a snapshot captured after execute ({executionSnapshotId.slice(0, 8)}…). Execution
                      snapshot is excluded from the picker.
                    </p>
                  </CollapsibleSection>
                ) : (
                  <p className={cn("m-0 text-sm", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-remediation-verify-hint">
                    Verify requires a snapshot captured after execute ({executionSnapshotId.slice(0, 8)}…). Execution
                    snapshot is excluded from the picker.
                  </p>
                )
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  data-testid="infra-remediation-preflight"
                  disabled={actionBusy || transitionsBlocked || selectedStatus == null || !canRunRemediationPreflight(selectedStatus)}
                  aria-describedby={preflightBlockedReason ? "infra-remediation-preflight-blocked-reason" : undefined}
                  onClick={() =>
                    void runLifecycleAction("preflight", () =>
                      runRemediationPreflight(detail.instance.instanceId, selectedSnapshotId),
                    )
                  }
                >
                  {pendingAction === "preflight" ? "Running preflight…" : "Run preflight"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  data-testid="infra-remediation-approve"
                  disabled={actionBusy || transitionsBlocked || selectedStatus == null || !canApproveRemediationInstance(selectedStatus)}
                  aria-describedby={approveBlockedReason ? "infra-remediation-approve-blocked-reason" : undefined}
                  onClick={() => void runLifecycleAction("approve", () => approveRemediationInstance(detail.instance.instanceId))}
                >
                  {pendingAction === "approve" ? "Approving…" : "Approve"}
                </Button>
                <label className="inline-flex items-center gap-2 text-sm">
                  <span>Wave</span>
                  <select
                    className={cn("px-2 py-1", cnField)}
                    value={selectedWaveId}
                    onChange={(event) => setSelectedWaveId(event.target.value)}
                  >
                    {waves.map((wave) => (
                      <option key={wave.waveId} value={wave.waveId}>{wave.name}</option>
                    ))}
                  </select>
                </label>
                <Button
                  type="button"
                  size="sm"
                  data-testid="infra-remediation-assign-wave"
                  disabled={actionBusy || transitionsBlocked || selectedStatus == null || !canAssignRemediationWave(selectedStatus) || selectedWaveId.length === 0}
                  aria-describedby={assignWaveBlockedReason ? "infra-remediation-assign-wave-blocked-reason" : undefined}
                  onClick={() =>
                    void runLifecycleAction("assignWave", () =>
                      assignRemediationWave(detail.instance.instanceId, selectedWaveId),
                    )
                  }
                >
                  {pendingAction === "assignWave" ? "Assigning wave…" : "Assign wave"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  data-testid="infra-remediation-execute"
                  disabled={actionBusy || transitionsBlocked || selectedStatus == null || !canExecuteRemediationInstance(selectedStatus)}
                  aria-describedby={executeBlockedReason ? "infra-remediation-execute-blocked-reason" : undefined}
                  onClick={() =>
                    void runLifecycleAction("execute", () =>
                      executeRemediationInstance(detail.instance.instanceId, selectedSnapshotId),
                    )
                  }
                >
                  {pendingAction === "execute" ? "Executing…" : "Execute (emit advisory)"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  data-testid="infra-remediation-verify"
                  disabled={actionBusy || transitionsBlocked || selectedStatus == null || !canVerifyRemediationInstance(selectedStatus)}
                  aria-describedby={verifyBlockedReason ? "infra-remediation-verify-blocked-reason" : undefined}
                  onClick={() =>
                    void runLifecycleAction("verify", () =>
                      verifyRemediationInstance(detail.instance.instanceId, selectedSnapshotId),
                    )
                  }
                >
                  {pendingAction === "verify" ? "Verifying…" : "Verify"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="infra-remediation-close"
                  disabled={actionBusy || selectedStatus == null || !canCloseRemediationInstance(selectedStatus)}
                  aria-describedby={closeBlockedReason ? "infra-remediation-close-blocked-reason" : undefined}
                  onClick={() => void runLifecycleAction("close", () => closeRemediationInstance(detail.instance.instanceId))}
                >
                  {pendingAction === "close" ? "Closing…" : "Close"}
                </Button>
              </div>
              {buyerPolishedShell ? (
                <div className="space-y-1">
                  <WhyDisabledCtaHint
                    id="infra-remediation-preflight-blocked-reason"
                    reason={preflightBlockedReason ? { kind: "policy", message: preflightBlockedReason } : null}
                    testId="infra-remediation-preflight-blocked-reason"
                  />
                  <WhyDisabledCtaHint
                    id="infra-remediation-approve-blocked-reason"
                    reason={approveBlockedReason ? { kind: "policy", message: approveBlockedReason } : null}
                    testId="infra-remediation-approve-blocked-reason"
                  />
                  <WhyDisabledCtaHint
                    id="infra-remediation-assign-wave-blocked-reason"
                    reason={assignWaveBlockedReason ? { kind: "policy", message: assignWaveBlockedReason } : null}
                    testId="infra-remediation-assign-wave-blocked-reason"
                  />
                  <WhyDisabledCtaHint
                    id="infra-remediation-execute-blocked-reason"
                    reason={executeBlockedReason ? { kind: "policy", message: executeBlockedReason } : null}
                    testId="infra-remediation-execute-blocked-reason"
                  />
                  <WhyDisabledCtaHint
                    id="infra-remediation-verify-blocked-reason"
                    reason={verifyBlockedReason ? { kind: "policy", message: verifyBlockedReason } : null}
                    testId="infra-remediation-verify-blocked-reason"
                  />
                  <WhyDisabledCtaHint
                    id="infra-remediation-close-blocked-reason"
                    reason={closeBlockedReason ? { kind: "policy", message: closeBlockedReason } : null}
                    testId="infra-remediation-close-blocked-reason"
                  />
                </div>
              ) : null}

              <p className={cn("m-0 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-remediation-execute-disclaimer">
                {REMEDIATION_EXECUTE_DISCLAIMER}
              </p>

              {detail.evidence.length > 0 ? (
                <div className="grid gap-2">
                  <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Advisory evidence</h3>
                  {detail.evidence.map((item) => (
                    <pre
                      key={item.evidenceId}
                      className="overflow-x-auto rounded-md border border-neutral-200 bg-neutral-50 p-2 text-xs dark:border-neutral-800 dark:bg-neutral-900/40"
                      data-testid={`infra-remediation-evidence-${item.phase}`}
                    >
                      {item.payloadJson}
                    </pre>
                  ))}
                </div>
              ) : null}
            </>
          )}
        </section>
      ) : null}

      <section className={cnCard} aria-label="Wave planner read-only">
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Wave planner (read-only)</h2>
        {wavePlanner.length === 0 ? (
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>No remediation waves yet.</p>
        ) : (
          <ul className="m-0 grid gap-2 pl-5">
            {wavePlanner.map((wave) => (
              <li key={wave.waveId}>
                {wave.name}: {wave.memberCount}
                {wave.targetSize != null ? ` / ${wave.targetSize}` : ""} members
              </li>
            ))}
          </ul>
        )}
      </section>

      {actionMessage != null ? (
        <p className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} role="status">{actionMessage}</p>
      ) : null}

        {buyerPolishedShell ? <RemediationClaimOrientationStrip /> : null}
      </main>
    </OperatorPageContainer>
  );
}
