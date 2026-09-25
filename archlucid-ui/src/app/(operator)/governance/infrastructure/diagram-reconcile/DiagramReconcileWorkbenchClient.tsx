"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { InfraEvidenceWorkbenchHeaderActions } from "@/components/infra-evidence/InfraEvidenceWorkbenchHeaderActions";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { diagramIngestMutationBlockedReason } from "@/lib/infra-evidence/diagram-ingest-mutation-blocked-reason";
import { diagramReconcileMutationBlockedReason } from "@/lib/infra-evidence/diagram-reconcile-mutation-blocked-reason";
import { diagramReconcileLoadModelBlockedReason } from "@/lib/infra-evidence/diagram-reconcile-load-model-blocked-reason";
import { isApiNotFoundFailure, toApiLoadFailure } from "@/lib/api-load-failure";
import {
  diagramReconcileMutationsAllowed,
  isDiagramReconcileRunIdInputValid,
  resolveDiagramReconcileSealedReviewRecordFromSummary,
} from "@/lib/infra-evidence/diagram-reconcile-sealed-review-record";
import {
  readDiagramReconcileSessionDraft,
  writeDiagramReconcileSessionDraft,
} from "@/lib/infra-evidence/diagram-reconcile-session-draft";
import {
  resolveDiagramReconcileBlockedReason,
  resolveDiagramReconcileDiagramSourceStepReadiness,
  resolveDiagramReconcileReconcileStepReadiness,
  resolveDiagramReconcileSnapshotStepReadiness,
} from "@/lib/infra-evidence/diagram-reconcile-readiness";
import { resolveDiagramReconcileSnapshotSelectionSummary } from "@/lib/infra-evidence/diagram-reconcile-snapshot-selection";
import { DIAGRAM_RECONCILE_WORKBENCH_PAGE_SHORTCUTS } from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-page-shortcuts";
import {
  buildDiagramReconcileOperationalFindingRequestItem,
  formatDiagramReconcileExplanation,
  formatDiagramReconcileResourceLabelForDisplay,
} from "@/lib/infra-evidence/infra-evidence-diagram-reconcile-explanation";
import {
  buildDiagramReconcileRemediationHref,
  DIAGRAM_RECONCILE_CORRESPONDENCE_ID_PARAM,
  DIAGRAM_RECONCILE_CLOUD_RESOURCE_ID_PARAM,
  DIAGRAM_RECONCILE_FILTER_PARAM,
  DIAGRAM_RECONCILE_RUN_ID_PARAM,
  DIAGRAM_RECONCILE_SNAPSHOT_ID_PARAM,
  diagramReconcileFilterHrefFromSearch,
  parseDiagramReconcileCloudResourceIdFromSearch,
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
import { formatInfraEvidenceSnapshotLabel } from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { buildInfraEvidenceAuditControlOptions, buildInfraEvidenceAuditControlScopePatch } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
import { buildInfrastructureAskHref, resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  INFRA_DIAGRAM_RECONCILE_RESOURCE_ID_DISCLOSURE_OPEN_PARAM,
  infraDiagramReconcileResourceIdDisclosureHrefFromSearch,
  parseInfraDiagramReconcileResourceIdDisclosureOpenFromSearch,
} from "@/lib/infra-evidence/infra-diagram-reconcile-resource-id-disclosure-url";
import { invalidateInfraEvidenceResourceHubCacheForResource } from "@/lib/infra-evidence/infra-evidence-resource-hub-cache";
import type { CloudResourceAuditLineageMatch } from "@/lib/infra-evidence/infra-evidence-hub-types";
import {
  hasStaleInfraEvidenceAuditUrlParams,
  mergeInfrastructureAskAuditScope,
  mergeWorkbenchHubScopePatch,
  parseInfraEvidenceWorkbenchAuditScopeFromSearch,
} from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import { buildResourceHubDiagramsWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-ask-citations";
import { InfraEvidenceSelectionAnnouncer } from "@/components/infra-evidence/InfraEvidenceSelectionAnnouncer";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";
import { useInfraEvidenceResourceHubAuditLineage } from "@/hooks/use-infra-evidence-resource-hub-audit-lineage";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { useRunSummaryQuery } from "@/hooks/use-run-summary-query";
import { CTA_WIDTH, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_COPY_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_DIAGRAM_SOURCE_REQUIRED_ERROR,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_DRAFT_RESTORED_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_FINDING_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_INGEST_BUTTON_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_INGEST_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_INGEST_SUCCESS_AUDIT_NOTE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_LOAD_MODEL_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_NO_SAVED_RECONCILIATION_DESCRIPTION,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_NO_SAVED_RECONCILIATION_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RECONCILE_BUTTON_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RECONCILE_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RECONCILIATION_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RESOURCE_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_REVIEW_ID_REQUIRED_ERROR,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RUN_ID_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RUN_SNAPSHOT_REQUIRED_ERROR,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCE_NAME_PLACEHOLDER,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OPEN_ACTION,
  GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_SCOPED_LABEL,
  formatGovernanceInfrastructureInlineActionError,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { cn } from "@/lib/utils";
import { showSuccess } from "@/lib/toast";

import { DiagramReconcileBreadcrumb } from "./DiagramReconcileBreadcrumb";
import { DiagramReconcileClaimOrientationStrip } from "./DiagramReconcileClaimOrientationStrip";
import { DiagramReconcileIngestConfirmDialog } from "./DiagramReconcileIngestConfirmDialog";
import { useDiagramReconcileWorkbenchShortcuts } from "./use-diagram-reconcile-workbench-shortcuts";

type ReconciliationLoadState =
  | "idle"
  | "loading"
  | "loaded"
  | "not-found"
  | "error";

const MATCH_KIND_FILTERS: readonly { value: DiagramReconcileMatchKindFilter; label: string }[] = [
  { value: "all", label: "All rows" },
  { value: "Conflict", label: "Conflict" },
  { value: "DiagramOnly", label: "Diagram only" },
  { value: "InfrastructureOnly", label: "Infrastructure only" },
  { value: "Exact", label: "Exact" },
  { value: "Probable", label: "Probable" },
];

function buildDiagramReconcileCorrespondenceAskHref(
  row: DiagramInfrastructureCorrespondenceRow,
  snapshotId: string,
  runId: string,
  scopedCloudResourceId?: string,
  auditScope?: ReturnType<typeof parseInfraEvidenceWorkbenchAuditScopeFromSearch>,
): string {
  const rowCloudResourceId = row.cloudResourceId != null && row.cloudResourceId.trim().length > 0
    ? row.cloudResourceId
    : undefined;
  const cloudResourceId = rowCloudResourceId ?? (
    scopedCloudResourceId != null && scopedCloudResourceId.trim().length > 0
      ? scopedCloudResourceId
      : undefined
  );

  return buildInfrastructureAskHref({
    cloudResourceId,
    snapshotId: snapshotId.length > 0 ? snapshotId : undefined,
    runId: runId.length > 0 ? runId : undefined,
    correspondenceId: row.correspondenceId,
    hubTab: "diagram",
    ...mergeInfrastructureAskAuditScope(auditScope ?? null),
  });
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof navigator === "undefined" || navigator.clipboard?.writeText == null) {
    throw new Error("Clipboard is unavailable in this browser.");
  }

  await navigator.clipboard.writeText(text);
}

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

const cnField =
  "rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

export function DiagramReconcileWorkbenchClient() {
  const buyerPolishedShell = useProductionEvalChrome();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const urlRunId = parseDiagramReconcileRunIdFromSearch(searchParams.get(DIAGRAM_RECONCILE_RUN_ID_PARAM));
  const urlSnapshotId = parseDiagramReconcileSnapshotIdFromSearch(
    searchParams.get(DIAGRAM_RECONCILE_SNAPSHOT_ID_PARAM),
  );
  const urlCloudResourceId = parseDiagramReconcileCloudResourceIdFromSearch(
    searchParams.get(DIAGRAM_RECONCILE_CLOUD_RESOURCE_ID_PARAM),
  );
  const urlFilter = parseDiagramReconcileFilterFromSearch(searchParams.get(DIAGRAM_RECONCILE_FILTER_PARAM));
  const urlCorrespondenceId = parseDiagramReconcileCorrespondenceIdFromSearch(
    searchParams.get(DIAGRAM_RECONCILE_CORRESPONDENCE_ID_PARAM),
  );
  const diagramReconcileResourceIdOpenParam = searchParams.get(
    INFRA_DIAGRAM_RECONCILE_RESOURCE_ID_DISCLOSURE_OPEN_PARAM,
  );
  const [diagramReconcileResourceIdOpen, setDiagramReconcileResourceIdOpenState] = useState(() =>
    parseInfraDiagramReconcileResourceIdDisclosureOpenFromSearch(diagramReconcileResourceIdOpenParam),
  );

  const syncDiagramReconcileResourceIdOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        infraDiagramReconcileResourceIdDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setDiagramReconcileResourceIdOpen = useCallback(
    (open: boolean) => {
      setDiagramReconcileResourceIdOpenState(open);
      syncDiagramReconcileResourceIdOpenToUrl(open);
    },
    [syncDiagramReconcileResourceIdOpenToUrl],
  );

  useEffect(() => {
    setDiagramReconcileResourceIdOpenState(
      parseInfraDiagramReconcileResourceIdDisclosureOpenFromSearch(diagramReconcileResourceIdOpenParam),
    );
  }, [diagramReconcileResourceIdOpenParam]);

  const [runId, setRunId] = useState<string>(urlRunId);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>(urlSnapshotId);
  const [matchKindFilter, setMatchKindFilter] = useState<DiagramReconcileMatchKindFilter>(urlFilter);
  const [selectedCorrespondenceId, setSelectedCorrespondenceId] = useState<string | null>(
    urlCorrespondenceId.length > 0 ? urlCorrespondenceId : null,
  );
  const [diagramSourceName, setDiagramSourceName] = useState<string>("");
  const [diagramMermaid, setDiagramMermaid] = useState<string>("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [snapshots, setSnapshots] = useState<InfraEvidenceSnapshotSummary[]>([]);
  const [reconciliation, setReconciliation] = useState<DiagramInfrastructureReconciliationResult | null>(null);
  const [reconciliationLoadState, setReconciliationLoadState] = useState<ReconciliationLoadState>("idle");
  const [reconciliationLoadError, setReconciliationLoadError] = useState<string | null>(null);
  const [modelNodeCount, setModelNodeCount] = useState<number | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [loadingReconciliation, setLoadingReconciliation] = useState(false);
  const [ingestBusy, setIngestBusy] = useState(false);
  const [ingestConfirmOpen, setIngestConfirmOpen] = useState(false);
  const [reconcileBusy, setReconcileBusy] = useState(false);
  const mermaidInputRef = useRef<HTMLTextAreaElement | null>(null);
  const hydratedDraftRunIdRef = useRef<string | null>(null);
  const [findingBusyId, setFindingBusyId] = useState<string | null>(null);
  const [ingestedFindingIds, setIngestedFindingIds] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);
  const [diagramSourceActionError, setDiagramSourceActionError] = useState<string | null>(null);
  const [reconcileActionError, setReconcileActionError] = useState<string | null>(null);
  const [rowActionError, setRowActionError] = useState<{ correspondenceId: string; message: string } | null>(null);
  const [workbenchRetryNonce, setWorkbenchRetryNonce] = useState(0);

  const retryWorkbenchLoad = useCallback(() => {
    setLoadError(null);
    setWorkbenchRetryNonce((value) => value + 1);
  }, []);

  const runSummaryQuery = useRunSummaryQuery(runId, {
    enabled: isDiagramReconcileRunIdInputValid(runId),
    authoritative: true,
  });
  const sealedReviewRecord = useMemo(
    () =>
      resolveDiagramReconcileSealedReviewRecordFromSummary({
        runId,
        summary: runSummaryQuery.data,
        failure: runSummaryQuery.failure,
        blockedReason: runSummaryQuery.blockedReason,
        isLoading: runSummaryQuery.isLoading || runSummaryQuery.isFetching,
      }),
    [
      runId,
      runSummaryQuery.blockedReason,
      runSummaryQuery.data,
      runSummaryQuery.failure,
      runSummaryQuery.isFetching,
      runSummaryQuery.isLoading,
    ],
  );
  const mutationsAllowed = diagramReconcileMutationsAllowed(sealedReviewRecord);
  const validRunId = isDiagramReconcileRunIdInputValid(runId);
  const validMermaidInput = diagramMermaid.trim().length > 0;

  const scopeStatusBadge = useMemo(() => {
    if (urlCloudResourceId.length > 0) {
      return (
        <StatusTag
          kind="ready"
          label={GOVERNANCE_INFRASTRUCTURE_TERRAFORM_SCOPE_SCOPED_LABEL}
          data-testid="infra-diagram-reconcile-scope-status"
        />
      );
    }

    return (
      <StatusTag
        kind="ready"
        label={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RESOURCE_SCOPE_LABEL}
        data-testid="infra-diagram-reconcile-scope-status"
      />
    );
  }, [urlCloudResourceId]);

  const diagramSourceStepReadiness = useMemo(
    () =>
      resolveDiagramReconcileDiagramSourceStepReadiness({
        sealedRecord: sealedReviewRecord,
        modelNodeCount,
        loadingModel,
        mermaidDraft: diagramMermaid,
      }),
    [diagramMermaid, loadingModel, modelNodeCount, sealedReviewRecord],
  );
  const snapshotStepReadiness = useMemo(
    () =>
      resolveDiagramReconcileSnapshotStepReadiness({
        selectedSnapshotId,
        loadingSnapshots,
        snapshotCount: snapshots.length,
      }),
    [loadingSnapshots, selectedSnapshotId, snapshots.length],
  );
  const reconcileStepReadiness = useMemo(
    () =>
      resolveDiagramReconcileReconcileStepReadiness({
        sealedRecord: sealedReviewRecord,
        selectedSnapshotId,
        modelNodeCount,
        reconciliationSaved: reconciliation != null,
        loadingReconciliation,
      }),
    [
      loadingReconciliation,
      modelNodeCount,
      reconciliation,
      sealedReviewRecord,
      selectedSnapshotId,
    ],
  );
  const reconcileBlockedReason = useMemo(
    () =>
      resolveDiagramReconcileBlockedReason({
        sealedRecord: sealedReviewRecord,
        selectedSnapshotId,
        modelNodeCount,
      }),
    [modelNodeCount, sealedReviewRecord, selectedSnapshotId],
  );
  const snapshotSelectionSummary = useMemo(
    () =>
      resolveDiagramReconcileSnapshotSelectionSummary({
        snapshots,
        selectedSnapshotId,
        urlSnapshotId,
      }),
    [selectedSnapshotId, snapshots, urlSnapshotId],
  );

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
    let visibleRows = rows;

    if (matchKindFilter !== "all") {
      visibleRows = visibleRows.filter((row) => row.matchKind === matchKindFilter);
    }

    if (urlCloudResourceId.length > 0) {
      visibleRows = visibleRows.filter((row) => row.cloudResourceId === urlCloudResourceId);
    }

    return visibleRows;
  }, [matchKindFilter, reconciliation?.rows, urlCloudResourceId]);

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

    return !reconciliation.rows.some((row) => {
      if (row.correspondenceId !== urlCorrespondenceId) {
        return false;
      }

      if (urlCloudResourceId.length === 0) {
        return true;
      }

      return row.cloudResourceId === urlCloudResourceId;
    });
  }, [loadingReconciliation, reconciliation, runId, selectedSnapshotId, urlCloudResourceId, urlCorrespondenceId]);

  const auditScope = useMemo(() => parseInfraEvidenceWorkbenchAuditScopeFromSearch(searchParams), [searchParams]);
  const hasStaleAuditUrlParams = useMemo(
    () => hasStaleInfraEvidenceAuditUrlParams(searchParams),
    [searchParams],
  );
  const scopedSnapshotId = selectedSnapshotId.length > 0 ? selectedSnapshotId : urlSnapshotId;
  const workbenchHubScopePatch = useMemo(
    () => mergeWorkbenchHubScopePatch(scopedSnapshotId, auditScope, runId),
    [auditScope, runId, scopedSnapshotId],
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
    router.replace(
      diagramReconcileFilterHrefFromSearch(searchParams.toString(), buildInfraEvidenceAuditControlScopePatch(match), pathname),
      { scroll: false },
    );
  }, [pathname, router, searchParams]);

  useEffect(() => {
    if (urlCorrespondenceId.length === 0 || selectedCorrespondenceId !== urlCorrespondenceId) {
      return;
    }

    document
      .querySelector(`[data-testid="infra-diagram-reconcile-row-${urlCorrespondenceId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [filteredRows.length, selectedCorrespondenceId, urlCorrespondenceId]);

  useEffect(() => {
    if (selectedCorrespondenceId === null || selectedCorrespondenceId.length === 0) {
      return;
    }

    if (loadingReconciliation) {
      return;
    }

    const stillVisible = filteredRows.some((row) => row.correspondenceId === selectedCorrespondenceId);

    if (!stillVisible) {
      setSelectedCorrespondenceId(null);
      syncUrl({ correspondenceId: "" });
    }
  }, [filteredRows, loadingReconciliation, selectedCorrespondenceId, syncUrl]);

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
  }, [syncUrl, urlSnapshotId, workbenchRetryNonce]);

  useEffect(() => {
    const trimmedRunId = runId.trim();

    if (!validRunId) {
      hydratedDraftRunIdRef.current = null;
      setDraftRestored(false);
      return;
    }

    if (hydratedDraftRunIdRef.current === trimmedRunId) {
      return;
    }

    hydratedDraftRunIdRef.current = trimmedRunId;
    const draft = readDiagramReconcileSessionDraft(trimmedRunId);

    if (draft == null) {
      setDraftRestored(false);
      return;
    }

    setDiagramMermaid(draft.mermaid);
    setDiagramSourceName(draft.sourceName);
    setDraftRestored(draft.mermaid.trim().length > 0 || draft.sourceName.trim().length > 0);
  }, [runId, validRunId]);

  useEffect(() => {
    if (!validRunId) {
      return;
    }

    writeDiagramReconcileSessionDraft(runId, {
      sourceName: diagramSourceName,
      mermaid: diagramMermaid,
    });
  }, [diagramMermaid, diagramSourceName, runId, validRunId]);

  useEffect(() => {
    if (!mutationsAllowed || runId.trim().length === 0) {
      return;
    }

    let cancelled = false;

    async function loadModelForRecord() {
      setLoadingModel(true);

      try {
        const model = await fetchArchitectureDiagramModel(runId.trim());
        const activeNodes = model.nodes?.filter((node) => node.removed !== true) ?? [];

        if (!cancelled) {
          setModelNodeCount(activeNodes.length);
        }
      } catch {
        if (!cancelled) {
          setModelNodeCount(null);
        }
      } finally {
        if (!cancelled) {
          setLoadingModel(false);
        }
      }
    }

    void loadModelForRecord();

    return () => {
      cancelled = true;
    };
  }, [mutationsAllowed, runId, workbenchRetryNonce]);

  useEffect(() => {
    if (runId.trim().length === 0 || selectedSnapshotId.trim().length === 0) {
      setReconciliation(null);
      setReconciliationLoadState("idle");
      setReconciliationLoadError(null);
      return;
    }

    let cancelled = false;

    async function loadExistingReconciliation() {
      setLoadingReconciliation(true);
      setReconciliationLoadState("loading");
      setReconciliationLoadError(null);
      setLoadError(null);

      try {
        const result = await fetchArchitectureDiagramReconciliation(runId.trim(), selectedSnapshotId.trim());

        if (!cancelled) {
          setReconciliation(result);
          setReconciliationLoadState("loaded");

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
      } catch (error: unknown) {
        if (!cancelled) {
          const failure = toApiLoadFailure(error);
          setReconciliation(null);
          setSelectedCorrespondenceId(null);

          if (isApiNotFoundFailure(failure)) {
            setReconciliationLoadState("not-found");
            setReconciliationLoadError(null);
          } else {
            setReconciliationLoadState("error");
            setReconciliationLoadError(formatInfraEvidenceDiagramReconcileApiError(error));
          }
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
  }, [matchKindFilter, runId, selectedSnapshotId, syncUrl, urlCorrespondenceId, workbenchRetryNonce]);

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
    if (!validRunId || !mutationsAllowed) {
      return;
    }

    setLoadError(null);
    setDiagramSourceActionError(null);
    setLoadingModel(true);

    try {
      const model = await fetchArchitectureDiagramModel(runId.trim());
      const activeNodes = model.nodes?.filter((node) => node.removed !== true) ?? [];
      setModelNodeCount(activeNodes.length);
      showSuccess(`Loaded existing diagram model — ${activeNodes.length} active node(s) on this sealed review record.`);
    } catch (error: unknown) {
      setModelNodeCount(null);
      const failure = toApiLoadFailure(error);
      const blocked = diagramReconcileLoadModelBlockedReason(failure);

      setDiagramSourceActionError(
        formatGovernanceInfrastructureInlineActionError(
          GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_LOAD_MODEL_ERROR_TITLE,
          blocked ?? formatInfraEvidenceDiagramReconcileApiError(error),
        ),
      );
    } finally {
      setLoadingModel(false);
    }
  }, [mutationsAllowed, runId, validRunId]);

  const executeIngest = useCallback(async () => {
    setIngestBusy(true);
    setLoadError(null);
    setDiagramSourceActionError(null);

    try {
      const result = await ingestArchitectureDiagram(runId.trim(), {
        sources: [
          {
            name:
              diagramSourceName.trim().length > 0
                ? diagramSourceName.trim()
                : GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCE_NAME_PLACEHOLDER,
            format: "mermaid",
            content: diagramMermaid,
          },
        ],
      });

      const activeNodes = result.model?.nodes?.filter((node) => node.removed !== true) ?? [];
      setModelNodeCount(activeNodes.length);
      const warningSuffix =
        result.warnings?.length
          ? ` Diagram ingested with ${result.warnings.length} warning(s).`
          : "";
      showSuccess(
        `Structured diagram model saved for this review record.${warningSuffix} ${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_INGEST_SUCCESS_AUDIT_NOTE}`,
      );
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      const blocked = diagramIngestMutationBlockedReason(failure);

      setDiagramSourceActionError(
        formatGovernanceInfrastructureInlineActionError(
          GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_INGEST_ERROR_TITLE,
          blocked ?? formatInfraEvidenceDiagramReconcileApiError(error),
        ),
      );
    } finally {
      setIngestBusy(false);
      setIngestConfirmOpen(false);
    }
  }, [diagramMermaid, diagramSourceName, runId]);

  const runIngest = useCallback(() => {
    if (!validRunId) {
      setDiagramSourceActionError(GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_REVIEW_ID_REQUIRED_ERROR);
      return;
    }

    if (!mutationsAllowed) {
      setDiagramSourceActionError("Review record must be sealed before ingesting a diagram.");
      return;
    }

    if (!validMermaidInput) {
      setDiagramSourceActionError(GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_DIAGRAM_SOURCE_REQUIRED_ERROR);
      return;
    }

    if (modelNodeCount != null && modelNodeCount > 0) {
      setIngestConfirmOpen(true);
      return;
    }

    void executeIngest();
  }, [executeIngest, modelNodeCount, mutationsAllowed, validMermaidInput, validRunId]);

  const runReconcile = useCallback(async () => {
    if (reconcileBlockedReason != null) {
      setReconcileActionError(reconcileBlockedReason);
      return;
    }

    if (runId.trim().length === 0 || selectedSnapshotId.trim().length === 0) {
      setReconcileActionError(GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RUN_SNAPSHOT_REQUIRED_ERROR);
      return;
    }

    setReconcileBusy(true);
    setLoadError(null);
    setReconcileActionError(null);

    try {
      const result = await reconcileArchitectureDiagram(runId.trim(), selectedSnapshotId.trim());
      setReconciliation(result);
      setReconciliationLoadState("loaded");
      setReconciliationLoadError(null);
      showSuccess(`Reconciliation complete — ${result.rows.length} correspondence row(s) generated.`);
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      const blocked = diagramReconcileMutationBlockedReason(failure);

      setReconcileActionError(
        formatGovernanceInfrastructureInlineActionError(
          GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RECONCILE_ERROR_TITLE,
          blocked ?? formatInfraEvidenceDiagramReconcileApiError(error),
        ),
      );
    } finally {
      setReconcileBusy(false);
    }
  }, [reconcileBlockedReason, runId, selectedSnapshotId]);

  const selectAdjacentCorrespondenceRow = useCallback(
    (delta: number) => {
      if (filteredRows.length === 0) {
        return;
      }

      const currentIndex =
        selectedCorrespondenceId == null
          ? -1
          : filteredRows.findIndex((row) => row.correspondenceId === selectedCorrespondenceId);
      const nextIndex =
        currentIndex < 0
          ? (delta > 0 ? 0 : filteredRows.length - 1)
          : (currentIndex + delta + filteredRows.length) % filteredRows.length;
      const nextRow = filteredRows[nextIndex];

      if (nextRow == null) {
        return;
      }

      setSelectedCorrespondenceId(nextRow.correspondenceId);
      syncUrl({ correspondenceId: nextRow.correspondenceId });
      document
        .querySelector(`[data-testid="infra-diagram-reconcile-row-${nextRow.correspondenceId}"]`)
        ?.scrollIntoView({ block: "nearest" });
    },
    [filteredRows, selectedCorrespondenceId, syncUrl],
  );

  useDiagramReconcileWorkbenchShortcuts(
    {
      ingestDiagram: runIngest,
      reconcileDiagram: () => {
        void runReconcile();
      },
      selectNextRow: () => {
        selectAdjacentCorrespondenceRow(1);
      },
      selectPreviousRow: () => {
        selectAdjacentCorrespondenceRow(-1);
      },
    },
    { enabled: !buyerPolishedShell },
  );

  const runCreateFinding = useCallback(
    async (row: DiagramInfrastructureCorrespondenceRow) => {
      if (runId.trim().length === 0 || selectedSnapshotId.trim().length === 0) {
        return;
      }

      setFindingBusyId(row.correspondenceId);
      setRowActionError(null);

      try {
        const item = buildDiagramReconcileOperationalFindingRequestItem(row, runId.trim(), selectedSnapshotId.trim());
        const result = await ingestOperationalSecurityFindings({ items: [item] });
        const ingestItem = result.items?.[0];
        const outcome = ingestItem?.outcome ?? "Unknown";
        const findingId = ingestItem?.findingId?.trim() ?? "";

        if (findingId.length > 0) {
          setIngestedFindingIds((current) => ({
            ...current,
            [row.correspondenceId]: findingId,
          }));
        }

        if (row.cloudResourceId != null && row.cloudResourceId.trim().length > 0) {
          invalidateInfraEvidenceResourceHubCacheForResource(row.cloudResourceId);
        }

        showSuccess(
          findingId.length > 0
            ? `Operational finding submitted — outcome: ${outcome}. Open remediation factory to match and create an instance.`
            : `Operational finding submitted — outcome: ${outcome}`,
        );
      } catch (error: unknown) {
        setRowActionError({
          correspondenceId: row.correspondenceId,
          message: formatGovernanceInfrastructureInlineActionError(
            GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_FINDING_ERROR_TITLE,
            formatInfraEvidenceDiagramReconcileApiError(error),
          ),
        });
      } finally {
        setFindingBusyId(null);
      }
    },
    [runId, selectedSnapshotId],
  );

  const runCopyArmId = useCallback(async (row: DiagramInfrastructureCorrespondenceRow, azureResourceId: string | null) => {
    if (azureResourceId == null || azureResourceId.trim().length === 0) {
      return;
    }

    setRowActionError(null);

    try {
      await copyTextToClipboard(azureResourceId);
      showSuccess("ARM id copied");
    } catch (error: unknown) {
      setRowActionError({
        correspondenceId: row.correspondenceId,
        message: formatGovernanceInfrastructureInlineActionError(
          GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_COPY_ERROR_TITLE,
          error instanceof Error ? error.message : "Clipboard unavailable.",
        ),
      });
    }
  }, []);

  const selectionAnnouncement = useMemo(() => {
    if (selectedCorrespondenceId == null || selectedCorrespondenceId.length === 0) {
      return null;
    }

    const selectedRow = filteredRows.find((row) => row.correspondenceId === selectedCorrespondenceId);

    if (selectedRow == null) {
      return `Showing diagram correspondence ${selectedCorrespondenceId}.`;
    }

    return `Showing diagram correspondence ${formatDiagramReconcileResourceLabelForDisplay(selectedRow)}.`;
  }, [filteredRows, selectedCorrespondenceId]);

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-diagram-reconcile-workbench"
    >
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SKIP_LINK_LABEL}
      </a>

      <DiagramReconcileBreadcrumb />

      <OperatorPageHeader
        navHref={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PATH}
        title={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PAGE_LEAD}
        claimDiscipline={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_CLAIM_DISCIPLINE}
        claimDisciplineTestId="infra-diagram-reconcile-claim-discipline"
        titleTestId="infra-diagram-reconcile-page-title"
        actions={
          <InfraEvidenceWorkbenchHeaderActions
            shortcuts={DIAGRAM_RECONCILE_WORKBENCH_PAGE_SHORTCUTS}
            shortcutsTestId="infra-diagram-reconcile-page-shortcuts"
            scopeStatusBadge={scopeStatusBadge}
          />
        }
      />

      <main
        id={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_PRIMARY_CONTENT_ID}
        className="flex w-full flex-col gap-4 scroll-mt-24"
        data-testid="infra-diagram-reconcile-primary-content"
      >
      <InfraEvidenceSelectionAnnouncer
        message={selectionAnnouncement}
        testId="infra-diagram-reconcile-selection-announcer"
      />

      {loadError != null ? (
        <EnterpriseCompactEmptyState
          role="alert"
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_LOAD_ERROR_TITLE}
          description={loadError}
          testId="infra-diagram-reconcile-load-error-panel"
          footer={
            <Button type="button" size="sm" variant="primary" onClick={retryWorkbenchLoad}>
              Retry load
            </Button>
          }
        />
      ) : null}

      {urlCloudResourceId.length > 0 ? (
        <section
          className={cnCard}
          data-testid="infra-diagram-reconcile-resource-scope-banner"
          aria-label="Diagram reconcile workbench resource scope"
        >
          <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SCOPE_LABEL}.
          </p>
          <CollapsibleSection
            title="Resource id"
            sectionTestId="infra-diagram-reconcile-resource-id-disclosure"
            summaryLine="Cloud resource UUID from the scoped link"
            open={diagramReconcileResourceIdOpen}
            onToggle={setDiagramReconcileResourceIdOpen}
          >
            <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {urlCloudResourceId}
            </p>
          </CollapsibleSection>
          {(auditScope != null || resourceHub?.auditLineageLink.available === false || hasStaleAuditUrlParams) ? (
            <WorkbenchAuditLineageStatus
              auditScope={auditScope}
              hub={resourceHub}
              cloudResourceId={urlCloudResourceId}
              currentSearch={searchParams.toString()}
              snapshotId={scopedSnapshotId}
              runId={runId}
              activeTab="diagram"
              hasStaleAuditUrlParams={hasStaleAuditUrlParams}
              auditControlOptions={auditControlOptions}
              onAuditControlChange={onAuditControlChange}
              provenanceTestId="infra-diagram-reconcile-audit-provenance"
              unavailableTestId="infra-diagram-reconcile-audit-unavailable"
            />
          ) : null}
          <WorkbenchHubScopeLinks
            cloudResourceId={urlCloudResourceId}
            primaryTab="diagram"
            primaryHref={resourceHubFilterHrefFromSearch(urlCloudResourceId, "", {
              tab: "diagram",
              ...workbenchHubScopePatch,
            })}
            primaryTestId="infra-diagram-reconcile-open-primary-hub"
            siblingTestIdPrefix="infra-diagram-reconcile"
            scopePatch={workbenchHubScopePatch}
            siblingTabs={["terraform", "findings", "remediation", "drift"]}
            includeAuditTab={auditScope != null}
            extraLinks={[
              {
                testId: "infra-diagram-reconcile-open-diagrams",
                href: buildResourceHubDiagramsWorkbenchHref(
                  scopedSnapshotId,
                  urlCloudResourceId,
                  undefined,
                  mergeInfrastructureAskAuditScope(auditScope),
                ),
                label: GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OPEN_ACTION,
              },
            ]}
          />
        </section>
      ) : null}

      {deepLinkedCorrespondenceMissing ? (
        <p
          className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="infra-diagram-reconcile-correspondence-deep-link-missing"
          role="status"
        >
          The linked diagram correspondence row is not in the loaded reconciliation for this review and snapshot
          {urlCloudResourceId.length > 0 ? " for this scoped resource" : ""}.
        </p>
      ) : null}

      <section className={cn("grid gap-4", cnCard)} aria-label="Reconciliation wizard">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>1. Diagram source</h2>
          <StatusTag
            kind={diagramSourceStepReadiness.kind}
            label={diagramSourceStepReadiness.label}
            data-testid="infra-diagram-reconcile-step-1-status"
          />
        </div>
        {buyerPolishedShell ? (
          <div className="grid gap-2">
            <Label htmlFor="infra-diagram-reconcile-run-id">
              Sealed Review Record ID
            </Label>
            <Input
              id="infra-diagram-reconcile-run-id"
              data-testid="infra-diagram-reconcile-run-id"
              value={runId}
              onChange={(event) => handleRunIdChange(event.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </div>
        ) : (
          <div className="grid gap-2">
            <Label htmlFor="infra-diagram-reconcile-run-id">
              Sealed Review Record ID
            </Label>
            <input
              id="infra-diagram-reconcile-run-id"
              className={cnField}
              data-testid="infra-diagram-reconcile-run-id"
              value={runId}
              onChange={(event) => handleRunIdChange(event.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
            />
          </div>
        )}
        {sealedReviewRecord.kind !== "idle" && sealedReviewRecord.kind !== "invalid-id" ? (
          <div
            className="grid gap-2 rounded-md border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-800 dark:bg-neutral-900/40"
            data-testid="infra-diagram-reconcile-sealed-record-strip"
          >
            {sealedReviewRecord.kind === "loading" ? (
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>Verifying sealed review record…</p>
            ) : null}
            {sealedReviewRecord.kind === "not-found" || sealedReviewRecord.kind === "blocked" ? (
              <div className="flex flex-wrap items-center gap-2">
                <StatusTag kind="blocked" label="Blocked" />
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>{sealedReviewRecord.message}</p>
              </div>
            ) : null}
            {sealedReviewRecord.kind === "loaded" ? (
              <div className="grid gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusTag
                    kind={sealedReviewRecord.sealStatusKind}
                    label={sealedReviewRecord.sealStatusLabel}
                    data-testid="infra-diagram-reconcile-sealed-record-status"
                  />
                  <span className={OPERATOR_TYPOGRAPHY.body}>{sealedReviewRecord.reviewTitle}</span>
                </div>
                {sealedReviewRecord.sealDateLabel != null ? (
                  <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                    Sealed {sealedReviewRecord.sealDateLabel}
                  </p>
                ) : null}
                <CollapsibleSection
                  title="Review record ID"
                  sectionTestId="infra-diagram-reconcile-run-id-disclosure"
                  summaryLine="Raw sealed review record identifier"
                >
                  <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {sealedReviewRecord.runId}
                  </p>
                </CollapsibleSection>
              </div>
            ) : null}
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            data-testid="infra-diagram-reconcile-load-model"
            disabled={!validRunId || !mutationsAllowed || loadingModel}
            onClick={() => void loadExistingModel()}
          >
            Use existing ingested model
          </Button>
          {modelNodeCount != null ? (
            <span className={cn("self-center text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {modelNodeCount} active node(s) loaded
            </span>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="infra-diagram-reconcile-source-name">Source Name</Label>
          <input
            id="infra-diagram-reconcile-source-name"
            className={cnField}
            value={diagramSourceName}
            onChange={(event) => setDiagramSourceName(event.target.value)}
            placeholder={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_SOURCE_NAME_PLACEHOLDER}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="infra-diagram-reconcile-mermaid-input">Mermaid Diagram</Label>
          <textarea
            ref={mermaidInputRef}
            id="infra-diagram-reconcile-mermaid-input"
            className={cn("min-h-[8rem] font-mono text-sm", cnField)}
            data-testid="infra-diagram-reconcile-mermaid-input"
            value={diagramMermaid}
            onChange={(event) => setDiagramMermaid(event.target.value)}
            placeholder="flowchart LR&#10;  app-->db"
          />
        </div>
        {draftRestored ? (
          <p
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="infra-diagram-reconcile-draft-restored"
          >
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_DRAFT_RESTORED_LABEL}
          </p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className={CTA_WIDTH.content}
          data-testid="infra-diagram-reconcile-ingest"
          disabled={ingestBusy || !validRunId || !mutationsAllowed || !validMermaidInput}
          aria-describedby={diagramSourceActionError != null ? "infra-diagram-reconcile-diagram-source-error" : undefined}
          onClick={runIngest}
        >
          {ingestBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_INGEST_BUTTON_LABEL}
        </Button>
        {diagramSourceActionError != null ? (
          <OperatorMutationInlineError
            message={diagramSourceActionError}
            testId="infra-diagram-reconcile-diagram-source-error"
          />
        ) : null}
      </section>

      <section className={cn("grid gap-4", cnCard)} aria-label="Snapshot selection">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>2. Inventory snapshot</h2>
          <StatusTag
            kind={snapshotStepReadiness.kind}
            label={snapshotStepReadiness.label}
            data-testid="infra-diagram-reconcile-step-2-status"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="infra-diagram-reconcile-snapshot-picker">Inventory Snapshot</Label>
          <select
            id="infra-diagram-reconcile-snapshot-picker"
            className={cnField}
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
                  {formatInfraEvidenceSnapshotLabel(snapshot)}
                </option>
              ))
            )}
          </select>
        </div>
        {snapshotSelectionSummary != null ? (
          <div
            className="flex flex-wrap items-center gap-2"
            data-testid="infra-diagram-reconcile-snapshot-freshness"
          >
            <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Captured {snapshotSelectionSummary.capturedLabel} · {snapshotSelectionSummary.ageLabel}
            </span>
            {snapshotSelectionSummary.selectionMarker != null ? (
              <StatusTag kind="ready" label={snapshotSelectionSummary.selectionMarker} />
            ) : null}
            {snapshotSelectionSummary.stale ? (
              <StatusTag kind="needs-attention" label="Needs attention" />
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="flex flex-col gap-3" aria-label="Run reconciliation">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>3. Reconcile</h2>
          <StatusTag
            kind={reconcileStepReadiness.kind}
            label={reconcileStepReadiness.label}
            data-testid="infra-diagram-reconcile-step-3-status"
          />
          <Button
            type="button"
            data-testid="infra-diagram-reconcile-run"
            disabled={reconcileBusy || reconcileBlockedReason != null}
            aria-describedby={
              reconcileActionError != null || reconcileBlockedReason != null
                ? "infra-diagram-reconcile-run-readiness"
                : undefined
            }
            onClick={() => void runReconcile()}
          >
            {reconcileBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            {GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RECONCILE_BUTTON_LABEL}
          </Button>
          {loadingReconciliation ? (
            <span className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              Loading saved reconciliation…
            </span>
          ) : null}
        </div>
        {reconcileBlockedReason != null && reconcileActionError == null ? (
          <p
            id="infra-diagram-reconcile-run-readiness"
            className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="infra-diagram-reconcile-run-readiness"
          >
            {reconcileBlockedReason}
          </p>
        ) : null}
        {reconcileActionError != null ? (
          <OperatorMutationInlineError
            message={reconcileActionError}
            testId="infra-diagram-reconcile-run-error"
          />
        ) : null}
      </section>

      {reconciliationLoadState === "not-found" && reconciliation == null && !loadingReconciliation ? (
        <EnterpriseCompactEmptyState
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_NO_SAVED_RECONCILIATION_TITLE}
          description={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_NO_SAVED_RECONCILIATION_DESCRIPTION}
          testId="infra-diagram-reconcile-no-saved-reconciliation"
        />
      ) : null}

      {reconciliationLoadState === "error" && reconciliationLoadError != null ? (
        <EnterpriseCompactEmptyState
          role="alert"
          title={GOVERNANCE_INFRASTRUCTURE_DIAGRAM_RECONCILE_RECONCILIATION_LOAD_ERROR_TITLE}
          description={reconciliationLoadError}
          testId="infra-diagram-reconcile-reconciliation-load-error"
          footer={
            <Button type="button" size="sm" variant="primary" onClick={retryWorkbenchLoad}>
              Retry
            </Button>
          }
        />
      ) : null}

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
                className={cnField}
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
              {filteredRows.length === 0 ? (
                <EnterpriseTableRow>
                  <EnterpriseTableCell colSpan={6}>
                    {urlCloudResourceId.length > 0
                      ? "No correspondence rows match the scoped cloud resource for this reconciliation."
                      : "No correspondence rows match the selected filter."}
                  </EnterpriseTableCell>
                </EnterpriseTableRow>
              ) : null}
              {filteredRows.map((row) => {
                const resourceHubHref = row.cloudResourceId != null && row.cloudResourceId.trim().length > 0
                  ? resourceHubFilterHrefFromSearch(row.cloudResourceId, "", {
                    tab: "diagram",
                    snapshotId: selectedSnapshotId,
                    runId: runId.length > 0 ? runId : undefined,
                    assessmentId: auditScope?.assessmentId,
                    auditEvidenceSnapshotId: auditScope?.auditEvidenceSnapshotId,
                    controlId: auditScope?.controlId,
                  })
                  : null;
                const explanation = formatDiagramReconcileExplanation(row);
                const ingestedFindingId = ingestedFindingIds[row.correspondenceId] ?? null;
                const remediationHref = buildDiagramReconcileRemediationHref({
                  row,
                  runId,
                  snapshotId: selectedSnapshotId,
                  scopedCloudResourceId: urlCloudResourceId,
                  findingId: ingestedFindingId,
                  assessmentId: auditScope?.assessmentId ?? null,
                  auditEvidenceSnapshotId: auditScope?.auditEvidenceSnapshotId ?? null,
                  controlId: auditScope?.controlId ?? null,
                });

                return (
                  <EnterpriseTableRow
                    key={row.correspondenceId}
                    data-testid={`infra-diagram-reconcile-row-${row.correspondenceId}`}
                    className={cn(
                      "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400",
                      selectedCorrespondenceId === row.correspondenceId ? "bg-neutral-100 dark:bg-neutral-900/40" : undefined,
                    )}
                    role="button"
                    tabIndex={0}
                    aria-selected={selectedCorrespondenceId === row.correspondenceId}
                    onClick={() => {
                      setSelectedCorrespondenceId(row.correspondenceId);
                      syncUrl({ correspondenceId: row.correspondenceId });
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setSelectedCorrespondenceId(row.correspondenceId);
                        syncUrl({ correspondenceId: row.correspondenceId });
                      }
                    }}
                  >
                    <EnterpriseTableCell>{row.matchKind}</EnterpriseTableCell>
                    <EnterpriseTableCell>{row.confidenceBand}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <div>{formatDiagramReconcileResourceLabelForDisplay(row)}</div>
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
                            href={buildDiagramReconcileCorrespondenceAskHref(
                              row,
                              selectedSnapshotId,
                              runId,
                              urlCloudResourceId,
                              auditScope,
                            )}
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
                          onClick={(event) => {
                            event.stopPropagation();
                            void runCopyArmId(row, row.azureResourceId);
                          }}
                        >
                          Copy ARM id
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={findingBusyId === row.correspondenceId}
                          onClick={(event) => {
                            event.stopPropagation();
                            void runCreateFinding(row);
                          }}
                        >
                          {findingBusyId === row.correspondenceId ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                          ) : null}
                          Create operational finding
                        </Button>
                        {rowActionError != null && rowActionError.correspondenceId === row.correspondenceId ? (
                          <OperatorMutationInlineError
                            message={rowActionError.message}
                            testId={`infra-diagram-reconcile-row-error-${row.correspondenceId}`}
                          />
                        ) : null}
                        {remediationHref != null ? (
                          <Button asChild variant="outline" size="sm">
                            <Link
                              href={remediationHref}
                              data-testid={`infra-diagram-reconcile-remediation-${row.correspondenceId}`}
                            >
                              Open in factory
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                );
              })}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </section>
      ) : null}

        <DiagramReconcileClaimOrientationStrip />
      </main>

      {sealedReviewRecord.kind === "loaded" && modelNodeCount != null && modelNodeCount > 0 ? (
        <DiagramReconcileIngestConfirmDialog
          open={ingestConfirmOpen}
          reviewTitle={sealedReviewRecord.reviewTitle}
          runId={sealedReviewRecord.runId}
          existingNodeCount={modelNodeCount}
          onOpenChange={setIngestConfirmOpen}
          onConfirm={() => {
            void executeIngest();
          }}
        />
      ) : null}
    </OperatorPageContainer>
  );
}
