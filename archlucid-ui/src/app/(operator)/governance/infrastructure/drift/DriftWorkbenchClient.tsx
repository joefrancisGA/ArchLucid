"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { CopyIdButton } from "@/components/CopyIdButton";
import { KeyboardShortcutBadge } from "@/components/KeyboardShortcutBadge";
import { LayerHeader } from "@/components/LayerHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SeverityTag } from "@/components/ui/severity-tag";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import {
  downloadInfraEvidenceTerraformAdvisoryZip,
  fetchInfraEvidenceDiffChanges,
  fetchInfraEvidenceDiffsForSnapshot,
  fetchInfraEvidenceSnapshots,
  formatInfraEvidenceApiError,
} from "@/lib/infra-evidence/infra-evidence-drift-api";
import type {
  InfraEvidenceDiffChange,
  InfraEvidenceDiffSummary,
  InfraEvidenceSnapshotSummary,
} from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  formatInfraEvidenceChangeTypeLabel,
  INFRA_EVIDENCE_DRIFT_CHANGE_TYPE_FILTER_OPTIONS,
  INFRA_EVIDENCE_DRIFT_RISK_FILTER_OPTIONS,
  isNavigableEvidenceReference,
  resolveInfraEvidenceChangeTypeStatusKind,
} from "@/lib/infra-evidence/infra-evidence-drift-display";
import {
  filterDriftChanges,
  parseDriftTableFilterState,
  sortDriftChanges,
  toggleDriftTableSort,
  type DriftTableSortKey,
} from "@/lib/infra-evidence/infra-evidence-drift-table-filter";
import { buildInfraEvidenceAuditControlOptions, buildInfraEvidenceAuditControlScopePatch } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
import type { CloudResourceAuditLineageMatch } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { buildInfrastructureAskHref, resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  INFRA_DRIFT_RESOURCE_ID_DISCLOSURE_OPEN_PARAM,
  infraDriftResourceIdDisclosureHrefFromSearch,
  parseInfraDriftResourceIdDisclosureOpenFromSearch,
} from "@/lib/infra-evidence/infra-drift-resource-id-disclosure-url";
import {
  mergeInfrastructureAskAuditScope,
  mergeWorkbenchHubScopePatch,
  hasStaleInfraEvidenceAuditUrlParams,
  parseInfraEvidenceWorkbenchAuditScopeFromSearch,
} from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import {
  DRIFT_WORKBENCH_CHANGE_ID_PARAM,
  DRIFT_WORKBENCH_CLOUD_RESOURCE_ID_PARAM,
  DRIFT_WORKBENCH_DIFF_ID_PARAM,
  DRIFT_WORKBENCH_SNAPSHOT_ID_PARAM,
  parseInfraEvidenceWorkbenchQueryValue,
} from "@/lib/infra-evidence/infra-evidence-workbench-url";
import { CopyScopedOperatorLinkButton } from "@/components/CopyScopedOperatorLinkButton";
import { InfraEvidenceSelectionAnnouncer } from "@/components/infra-evidence/InfraEvidenceSelectionAnnouncer";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useInfraEvidenceResourceHubAuditLineage } from "@/hooks/use-infra-evidence-resource-hub-audit-lineage";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { driftWorkbenchHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-drift-filter-url";
import { formatResourceHubTabViewLabel } from "@/lib/infra-evidence/infra-evidence-hub-tab-labels";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_ID_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_SCOPED_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_DIFFS_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_DIFFS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_ACTION,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_DISABLED_NO_SNAPSHOT,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_RECEIPT_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_SOURCE_SNAPSHOT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SCOPE_FRESHNESS_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_ID_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_CHANGE_TYPE_FILTER_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_FILTER_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RISK_FILTER_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { formatInventoryShowingLine } from "@/lib/inventory-showing-count";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { TERRAFORM_ADVISORY_EXPORT_DISCLAIMER } from "@/lib/terraform-advisory-disclaimer";
import { cn } from "@/lib/utils";
import { showError } from "@/lib/toast";

import { DriftBreadcrumb } from "./DriftBreadcrumb";
import { DriftClaimOrientationStrip } from "./DriftClaimOrientationStrip";

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

const cnField =
  "rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

const SNAPSHOTS_PAGE_SIZE = 50;
const CHANGES_PAGE_SIZE = 100;

function formatSnapshotLabel(snapshot: InfraEvidenceSnapshotSummary): string {
  const captured = snapshot.capturedUtc != null ? new Date(snapshot.capturedUtc).toLocaleString() : "unknown time";
  const subscription = snapshot.subscriptionName ?? snapshot.subscriptionId ?? "subscription";

  return `${subscription} · ${captured} · ${snapshot.resourceCount} resources`;
}

function formatDiffLabel(diff: InfraEvidenceDiffSummary, selectedSnapshotId: string): string {
  const otherId = diff.snapshotAId === selectedSnapshotId ? diff.snapshotBId : diff.snapshotAId;
  const shortOther = otherId.slice(0, 8);

  return `${diff.totalChanges} changes vs ${shortOther}… (${new Date(diff.createdUtc).toLocaleString()})`;
}

function formatSnapshotFreshness(snapshot: InfraEvidenceSnapshotSummary | null): string | null {
  if (snapshot == null) {
    return null;
  }

  const captured = snapshot.capturedUtc != null ? new Date(snapshot.capturedUtc).toLocaleString() : "unknown time";
  const subscription = snapshot.subscriptionName ?? snapshot.subscriptionId ?? "subscription";

  return `${subscription} · captured ${captured} · ${snapshot.resourceCount} resources`;
}

function sortDirectionForColumn(
  sortBy: DriftTableSortKey,
  column: DriftTableSortKey,
  sortDir: "asc" | "desc",
): "ascending" | "descending" | "none" {
  if (sortBy !== column) {
    return "none";
  }

  return sortDir === "asc" ? "ascending" : "descending";
}

export function DriftWorkbenchClient() {
  const buyerPolishedShell = useProductionEvalChrome();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const driftResourceIdOpenParam = searchParams.get(INFRA_DRIFT_RESOURCE_ID_DISCLOSURE_OPEN_PARAM);
  const [driftResourceIdOpen, setDriftResourceIdOpenState] = useState(() =>
    parseInfraDriftResourceIdDisclosureOpenFromSearch(driftResourceIdOpenParam),
  );

  const syncDriftResourceIdOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(infraDriftResourceIdDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setDriftResourceIdOpen = useCallback(
    (open: boolean) => {
      setDriftResourceIdOpenState(open);
      syncDriftResourceIdOpenToUrl(open);
    },
    [syncDriftResourceIdOpenToUrl],
  );

  useEffect(() => {
    setDriftResourceIdOpenState(parseInfraDriftResourceIdDisclosureOpenFromSearch(driftResourceIdOpenParam));
  }, [driftResourceIdOpenParam]);

  const changeDrawerRef = useRef<HTMLElement | null>(null);
  const urlSnapshotId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(DRIFT_WORKBENCH_SNAPSHOT_ID_PARAM));
  const urlCloudResourceId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(DRIFT_WORKBENCH_CLOUD_RESOURCE_ID_PARAM),
  );
  const urlChangeId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(DRIFT_WORKBENCH_CHANGE_ID_PARAM));
  const urlDiffId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(DRIFT_WORKBENCH_DIFF_ID_PARAM));
  const tableFilterState = useMemo(() => parseDriftTableFilterState(searchParams), [searchParams]);

  const [snapshots, setSnapshots] = useState<InfraEvidenceSnapshotSummary[]>([]);
  const [snapshotsTotalCount, setSnapshotsTotalCount] = useState(0);
  const [snapshotsHasMore, setSnapshotsHasMore] = useState(false);
  const [diffs, setDiffs] = useState<InfraEvidenceDiffSummary[]>([]);
  const [changes, setChanges] = useState<InfraEvidenceDiffChange[]>([]);
  const [changesTotalCount, setChangesTotalCount] = useState(0);
  const [changesHasMore, setChangesHasMore] = useState(false);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");
  const [selectedDiffId, setSelectedDiffId] = useState<string>("");
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [loadingDiffs, setLoadingDiffs] = useState(false);
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportReceipt, setExportReceipt] = useState<{ snapshotId: string; exportedAtUtc: string } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.snapshotId === selectedSnapshotId) ?? null,
    [selectedSnapshotId, snapshots],
  );

  const visibleChanges = useMemo(() => {
    const filtered = filterDriftChanges(changes, tableFilterState);

    return sortDriftChanges(filtered, tableFilterState.sortBy, tableFilterState.sortDir);
  }, [changes, tableFilterState]);

  const selectedChange = useMemo(
    () => visibleChanges.find((row) => row.changeId === selectedChangeId) ?? null,
    [selectedChangeId, visibleChanges],
  );

  const scopeFreshnessLine = useMemo(() => {
    const segments: string[] = [];
    const snapshotFreshness = formatSnapshotFreshness(selectedSnapshot);

    if (snapshotFreshness != null) {
      segments.push(snapshotFreshness);
    }

    if (urlCloudResourceId.length > 0) {
      segments.push(`resource ${urlCloudResourceId}`);
    }

    if (selectedDiffId.length > 0) {
      segments.push(`diff ${selectedDiffId}`);
    }

    return segments.length > 0 ? segments.join(" · ") : null;
  }, [selectedDiffId, selectedSnapshot, urlCloudResourceId]);

  const deepLinkedChangeMissing = useMemo(() => {
    if (urlChangeId.length === 0 || loadingChanges || selectedDiffId.length === 0) {
      return false;
    }

    return !visibleChanges.some((row) => row.changeId === urlChangeId);
  }, [loadingChanges, selectedDiffId.length, urlChangeId, visibleChanges]);

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

  const replaceDriftUrl = useCallback(
    (patch: {
      readonly snapshotId?: string | null;
      readonly diffId?: string | null;
      readonly changeId?: string | null;
      readonly tableFilters?: Partial<typeof tableFilterState>;
    }) => {
      router.replace(driftWorkbenchHrefFromSearch(searchParams, patch), { scroll: false });
    },
    [router, searchParams],
  );

  const pushDriftUrl = useCallback(
    (patch: {
      readonly snapshotId?: string | null;
      readonly diffId?: string | null;
      readonly changeId?: string | null;
      readonly tableFilters?: Partial<typeof tableFilterState>;
    }) => {
      router.push(driftWorkbenchHrefFromSearch(searchParams, patch), { scroll: false });
    },
    [router, searchParams],
  );

  const onAuditControlChange = useCallback((match: CloudResourceAuditLineageMatch) => {
    router.replace(
      driftWorkbenchHrefFromSearch(searchParams, buildInfraEvidenceAuditControlScopePatch(match)),
      { scroll: false },
    );
  }, [router, searchParams]);

  const activateChange = useCallback(
    (changeId: string, historyMode: "push" | "replace") => {
      setSelectedChangeId(changeId);

      const sync = historyMode === "push" ? pushDriftUrl : replaceDriftUrl;
      sync({ changeId });

      window.requestAnimationFrame(() => {
        changeDrawerRef.current?.focus();
      });
    },
    [pushDriftUrl, replaceDriftUrl],
  );

  const clearSelectedChange = useCallback(() => {
    setSelectedChangeId(null);
    pushDriftUrl({ changeId: "" });
  }, [pushDriftUrl]);

  useEffect(() => {
    if (urlChangeId.length === 0 || selectedChangeId !== urlChangeId) {
      return;
    }

    document
      .querySelector(`[data-testid="infra-drift-change-row-${urlChangeId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedChangeId, urlChangeId, visibleChanges.length]);

  useEffect(() => {
    let cancelled = false;

    async function loadSnapshots() {
      setLoadingSnapshots(true);
      setLoadError(null);

      try {
        const response = await fetchInfraEvidenceSnapshots(tableFilterState.snapshotsPage, SNAPSHOTS_PAGE_SIZE);
        const items = response.items ?? [];

        if (!cancelled) {
          setSnapshots((current) =>
            tableFilterState.snapshotsPage > 1 ? [...current, ...items] : items,
          );
          setSnapshotsTotalCount(response.totalCount ?? items.length);
          setSnapshotsHasMore(response.hasMore === true);

          if (items.length > 0) {
            const preferredSnapshotId =
              urlSnapshotId.length > 0 && items.some((item) => item.snapshotId === urlSnapshotId)
                ? urlSnapshotId
                : items[0].snapshotId;

            setSelectedSnapshotId((current) => (current.length > 0 ? current : preferredSnapshotId));
          } else if (tableFilterState.snapshotsPage === 1) {
            setSelectedSnapshotId("");
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
  }, [tableFilterState.snapshotsPage, urlSnapshotId]);

  useEffect(() => {
    if (urlSnapshotId.length === 0) {
      return;
    }

    setSelectedSnapshotId(urlSnapshotId);
  }, [urlSnapshotId]);

  useEffect(() => {
    if (selectedSnapshotId.length === 0) {
      setDiffs([]);
      setSelectedDiffId("");
      return;
    }

    let cancelled = false;

    async function loadDiffs() {
      setLoadingDiffs(true);
      setLoadError(null);

      try {
        const rows = await fetchInfraEvidenceDiffsForSnapshot(selectedSnapshotId);

        if (!cancelled) {
          setDiffs(rows);
          const preferredDiffId =
            urlDiffId.length > 0 && rows.some((row) => row.diffId === urlDiffId)
              ? urlDiffId
              : rows[0]?.diffId ?? "";

          setSelectedDiffId(preferredDiffId);
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(formatInfraEvidenceApiError(error));
          setDiffs([]);
          setSelectedDiffId("");
        }
      } finally {
        if (!cancelled) {
          setLoadingDiffs(false);
        }
      }
    }

    void loadDiffs();

    return () => {
      cancelled = true;
    };
  }, [selectedSnapshotId, urlDiffId]);

  useEffect(() => {
    if (selectedDiffId.length === 0) {
      setChanges([]);
      setChangesTotalCount(0);
      setChangesHasMore(false);
      setSelectedChangeId(null);
      return;
    }

    let cancelled = false;

    async function loadChanges() {
      setLoadingChanges(true);
      setLoadError(null);

      try {
        const response = await fetchInfraEvidenceDiffChanges(selectedDiffId, tableFilterState.changesPage, CHANGES_PAGE_SIZE, {
          cloudResourceId: urlCloudResourceId.length > 0 ? urlCloudResourceId : null,
        });

        if (!cancelled) {
          const items = response.items ?? [];
          setChanges((current) =>
            tableFilterState.changesPage > 1 ? [...current, ...items] : items,
          );
          setChangesTotalCount(response.totalCount ?? items.length);
          setChangesHasMore(response.hasMore === true);

          if (urlChangeId.length > 0) {
            setSelectedChangeId(urlChangeId);
          } else {
            setSelectedChangeId(null);
          }
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(formatInfraEvidenceApiError(error));
          setChanges([]);
          setChangesTotalCount(0);
          setChangesHasMore(false);
        }
      } finally {
        if (!cancelled) {
          setLoadingChanges(false);
        }
      }
    }

    void loadChanges();

    return () => {
      cancelled = true;
    };
  }, [selectedDiffId, tableFilterState.changesPage, urlChangeId, urlCloudResourceId]);

  useEffect(() => {
    if (urlChangeId.length === 0 || loadingChanges) {
      return;
    }

    if (visibleChanges.some((row) => row.changeId === urlChangeId)) {
      window.requestAnimationFrame(() => {
        changeDrawerRef.current?.focus();
      });
    }
  }, [loadingChanges, urlChangeId, visibleChanges]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (visibleChanges.length === 0) {
        return;
      }

      if (event.key === "Escape" && selectedChangeId != null) {
        event.preventDefault();
        clearSelectedChange();
        return;
      }

      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") {
        return;
      }

      const activeElement = document.activeElement;
      const isFormControl =
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLSelectElement ||
        activeElement instanceof HTMLTextAreaElement;

      if (isFormControl) {
        return;
      }

      event.preventDefault();

      const currentIndex = selectedChangeId == null
        ? -1
        : visibleChanges.findIndex((row) => row.changeId === selectedChangeId);
      const nextIndex = event.key === "ArrowDown"
        ? Math.min(currentIndex + 1, visibleChanges.length - 1)
        : Math.max(currentIndex - 1, 0);
      const nextRow = visibleChanges[nextIndex];

      if (nextRow != null) {
        activateChange(nextRow.changeId, "push");
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activateChange, clearSelectedChange, selectedChangeId, visibleChanges]);

  const runExport = useCallback(async () => {
    if (selectedSnapshotId.length === 0) {
      return;
    }

    setExportBusy(true);

    try {
      await downloadInfraEvidenceTerraformAdvisoryZip(selectedSnapshotId);
      setExportReceipt({
        snapshotId: selectedSnapshotId,
        exportedAtUtc: new Date().toISOString(),
      });
    } catch (error: unknown) {
      showError("Could not download Terraform advisory export", formatInfraEvidenceApiError(error));
    } finally {
      setExportBusy(false);
    }
  }, [selectedSnapshotId]);

  const selectionAnnouncement = useMemo(() => {
    if (selectedChange == null) {
      return null;
    }

    const propertyLabel = selectedChange.property ?? formatInfraEvidenceChangeTypeLabel(selectedChange.changeType);

    return `Showing drift change ${propertyLabel}.`;
  }, [selectedChange]);

  const snapshotsShowingLine = formatInventoryShowingLine(snapshots.length, snapshotsTotalCount, snapshotsHasMore);
  const changesShowingLine = formatInventoryShowingLine(changes.length, changesTotalCount, changesHasMore);
  const exportDisabledReason =
    selectedSnapshotId.length === 0 ? GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_DISABLED_NO_SNAPSHOT : null;

  const handleSortColumn = (column: DriftTableSortKey) => {
    pushDriftUrl({
      tableFilters: toggleDriftTableSort(tableFilterState, column),
    });
  };

  const renderSortableHeader = (column: DriftTableSortKey, label: string) => (
    <EnterpriseTableHeaderCell sortDirection={sortDirectionForColumn(tableFilterState.sortBy, column, tableFilterState.sortDir)}>
      <button
        type="button"
        className="inline-flex items-center gap-1 text-left"
        onClick={() => handleSortColumn(column)}
      >
        {label}
      </button>
    </EnterpriseTableHeaderCell>
  );

  const renderChangesEmptyState = () => {
    if (loadingChanges) {
      return (
        <EnterpriseTableRow>
          <EnterpriseTableCell colSpan={4}>Loading changes…</EnterpriseTableCell>
        </EnterpriseTableRow>
      );
    }

    if (selectedDiffId.length === 0) {
      return (
        <EnterpriseTableRow>
          <EnterpriseTableCell colSpan={4}>
            <EnterpriseCompactEmptyState
              title={GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_TITLE}
              description={GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_BODY}
              testId="infra-drift-changes-empty-unselected"
            />
          </EnterpriseTableCell>
        </EnterpriseTableRow>
      );
    }

    return (
      <EnterpriseTableRow>
        <EnterpriseTableCell colSpan={4}>
          <EnterpriseCompactEmptyState
            title={GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_TITLE}
            description={
              urlCloudResourceId.length > 0
                ? GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_SCOPED_BODY
                : GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_BODY
            }
            testId="infra-drift-changes-empty-resolved"
          />
        </EnterpriseTableCell>
      </EnterpriseTableRow>
    );
  };

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-drift-workbench"
    >
      <a
        href={`#${GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL}
      </a>

      <OperatorPageHeader
        navHref={GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH}
        title={GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD}
        claimDiscipline={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId="infra-drift-claim-discipline"
        titleTestId="infra-drift-page-title"
        breadcrumb={<DriftBreadcrumb />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
            {!buyerPolishedShell ? (
              <CopyScopedOperatorLinkButton testId="infra-drift-copy-scoped-link" />
            ) : null}
          </div>
        }
      />

      {!buyerPolishedShell ? <LayerHeader pageKey="infrastructure-drift" /> : null}

      <main
        id={GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID}
        className={cn("mx-auto flex w-full max-w-6xl flex-col gap-4 scroll-mt-24")}
        data-testid="infra-drift-primary-content"
      >
        {buyerPolishedShell ? (
          <div className="flex justify-end">
            <CopyScopedOperatorLinkButton testId="infra-drift-copy-scoped-link" />
          </div>
        ) : null}

        <InfraEvidenceSelectionAnnouncer message={selectionAnnouncement} testId="infra-drift-selection-announcer" />

        {urlCloudResourceId.length > 0 ? (
          <section
            className={cnCard}
            data-testid="infra-drift-resource-scope-banner"
            aria-label="Drift workbench resource scope"
          >
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_SCOPE_LABEL}
              {!buyerPolishedShell ? (
                <> <span className="font-mono text-xs">{urlCloudResourceId}</span>.</>
              ) : (
                "."
              )}
            </p>
            {buyerPolishedShell ? (
              <CollapsibleSection
                title="Resource id"
                sectionTestId="infra-drift-resource-id-disclosure"
                summaryLine="Cloud resource UUID from the scoped link"
                open={driftResourceIdOpen}
                onToggle={setDriftResourceIdOpen}
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
                activeTab="drift"
                hasStaleAuditUrlParams={hasStaleAuditUrlParams}
                auditControlOptions={auditControlOptions}
                onAuditControlChange={onAuditControlChange}
                provenanceTestId="infra-drift-audit-provenance"
                unavailableTestId="infra-drift-audit-unavailable"
              />
            ) : null}
            <WorkbenchHubScopeLinks
              cloudResourceId={urlCloudResourceId}
              primaryTab="drift"
              primaryHref={resourceHubFilterHrefFromSearch(urlCloudResourceId, "", {
                tab: "drift",
                ...workbenchHubScopePatch,
              })}
              primaryTestId="infra-drift-open-primary-hub"
              siblingTestIdPrefix="infra-drift"
              scopePatch={workbenchHubScopePatch}
              siblingTabs={["terraform", "findings", "remediation", "diagram"]}
              includeAuditTab={auditScope != null}
            />
          </section>
        ) : null}

        {deepLinkedChangeMissing ? (
          <p
            className={cn("m-0 text-sm text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="infra-drift-change-deep-link-missing"
            role="status"
          >
            The linked drift change is not in the selected diff
            {urlCloudResourceId.length > 0 ? " for this scoped resource" : ""}.
          </p>
        ) : null}

        {loadError != null ? (
          <EnterpriseCompactEmptyState
            role="alert"
            title={GOVERNANCE_INFRASTRUCTURE_DRIFT_LOAD_ERROR_TITLE}
            description={loadError}
            testId="infra-drift-load-error-panel"
            footer={
              <Button type="button" size="sm" variant="primary" onClick={() => window.location.reload()}>
                Reload page
              </Button>
            }
          />
        ) : null}

        {scopeFreshnessLine != null ? (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="infra-drift-scope-freshness"
          >
            <span className="font-medium text-al-text-primary">{GOVERNANCE_INFRASTRUCTURE_DRIFT_SCOPE_FRESHNESS_LABEL}:</span>{" "}
            {scopeFreshnessLine}
          </p>
        ) : null}

        <section className={cn("flex flex-col gap-3", cnCard)} aria-label="Drift workbench controls">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-end">
            <div className="grid gap-2">
              <Label htmlFor="infra-drift-snapshot-picker">{GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_LABEL}</Label>
              <select
                id="infra-drift-snapshot-picker"
                className={cnField}
                data-testid="infra-drift-snapshot-picker"
                disabled={loadingSnapshots || (snapshots.length === 0 && !loadingSnapshots)}
                value={selectedSnapshotId}
                onChange={(event) => {
                  const nextSnapshotId = event.target.value;
                  setSelectedSnapshotId(nextSnapshotId);
                  pushDriftUrl({ snapshotId: nextSnapshotId, diffId: "", changeId: "", tableFilters: { changesPage: 1 } });
                }}
              >
                {loadingSnapshots ? <option value="">Loading snapshots…</option> : null}
                {!loadingSnapshots && snapshots.length === 0 ? <option value="">No snapshots in scope</option> : null}
                {snapshots.map((snapshot) => (
                  <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                    {formatSnapshotLabel(snapshot)}
                  </option>
                ))}
              </select>
              {snapshotsShowingLine != null ? (
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-drift-snapshots-showing-line">
                  {snapshotsShowingLine}
                </p>
              ) : null}
              {snapshotsHasMore ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  data-testid="infra-drift-load-more-snapshots"
                  disabled={loadingSnapshots}
                  onClick={() => {
                    pushDriftUrl({
                      tableFilters: { snapshotsPage: tableFilterState.snapshotsPage + 1 },
                    });
                  }}
                >
                  {loadingSnapshots ? "Loading…" : "Load more snapshots"}
                </Button>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="infra-drift-diff-picker">{GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_LABEL}</Label>
              <select
                id="infra-drift-diff-picker"
                className={cnField}
                data-testid="infra-drift-diff-picker"
                disabled={loadingDiffs || diffs.length === 0}
                value={selectedDiffId}
                onChange={(event) => {
                  const nextDiffId = event.target.value;
                  setSelectedDiffId(nextDiffId);
                  pushDriftUrl({ diffId: nextDiffId, changeId: "", tableFilters: { changesPage: 1 } });
                }}
              >
                {loadingDiffs ? <option value="">Loading diffs…</option> : null}
                {!loadingDiffs && diffs.length === 0 ? <option value="">No diffs for this snapshot</option> : null}
                {diffs.map((diff) => (
                  <option key={diff.diffId} value={diff.diffId}>
                    {formatDiffLabel(diff, selectedSnapshotId)}
                  </option>
                ))}
              </select>
              {selectedSnapshotId.length > 0 ? (
                <div className="flex items-center gap-2">
                  <p className={cn("m-0 font-mono text-xs break-all text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    <span className="font-sans font-medium text-al-text-primary">
                      {GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_ID_LABEL}:
                    </span>{" "}
                    <span title={selectedSnapshotId}>{selectedSnapshotId}</span>
                  </p>
                  <CopyIdButton value={selectedSnapshotId} aria-label="Copy snapshot id" />
                </div>
              ) : null}
            </div>

            <div className="flex min-w-[14rem] flex-col gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="infra-drift-export-terraform"
                disabled={exportBusy || exportDisabledReason != null}
                title={exportDisabledReason ?? undefined}
                aria-describedby={exportDisabledReason != null ? "infra-drift-export-disabled-reason" : undefined}
                onClick={() => void runExport()}
              >
                {exportBusy ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Exporting…
                  </span>
                ) : (
                  "Export advisory Terraform"
                )}
              </Button>
              {exportDisabledReason != null ? (
                <p id="infra-drift-export-disabled-reason" className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  {exportDisabledReason}
                </p>
              ) : null}
              {selectedSnapshotId.length > 0 ? (
                <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}>
                  <span className="font-medium text-al-text-primary">
                    {GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_SOURCE_SNAPSHOT_LABEL}:
                  </span>{" "}
                  <span className="font-mono text-xs" title={selectedSnapshotId}>{selectedSnapshotId}</span>
                </p>
              ) : null}
              {selectedDiffId.length > 0 ? (
                <Button asChild variant="outline" size="sm" data-testid="infra-drift-open-ask">
                  <Link
                    href={buildInfrastructureAskHref({
                      cloudResourceId: urlCloudResourceId.length > 0 ? urlCloudResourceId : undefined,
                      snapshotId: selectedSnapshotId,
                      diffId: selectedDiffId,
                      hubTab: "drift",
                      ...mergeInfrastructureAskAuditScope(auditScope),
                    })}
                  >
                    Ask about this diff
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <p className={cn("m-0 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {TERRAFORM_ADVISORY_EXPORT_DISCLAIMER}
          </p>

          {exportReceipt != null ? (
            <div
              className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-800 dark:bg-neutral-900/40"
              data-testid="infra-drift-export-receipt"
              role="status"
            >
              <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_RECEIPT_TITLE}
              </p>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Snapshot {exportReceipt.snapshotId} · {new Date(exportReceipt.exportedAtUtc).toLocaleString()}
              </p>
            </div>
          ) : null}
        </section>

        {!loadingSnapshots && snapshots.length === 0 ? (
          <EnterpriseCompactEmptyState
            title={GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_TITLE}
            description={GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_BODY}
            testId="infra-drift-snapshots-empty-resolved"
            footer={
              <Button asChild size="sm" variant="primary">
                <Link href={CLOUD_CONNECTIONS_PATH}>{GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_ACTION}</Link>
              </Button>
            }
          />
        ) : null}

        {!loadingDiffs && selectedSnapshotId.length > 0 && diffs.length === 0 ? (
          <EnterpriseCompactEmptyState
            title={GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_DIFFS_TITLE}
            description={GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_DIFFS_BODY}
            testId="infra-drift-diffs-empty-resolved"
          />
        ) : null}

        <section className={cn("flex flex-col gap-3", cnCard)} aria-label="Drift table filters">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="grid gap-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>{GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RISK_FILTER_LABEL}</span>
              <select
                className={cnField}
                data-testid="infra-drift-risk-filter"
                value={tableFilterState.riskFilter}
                onChange={(event) => {
                  pushDriftUrl({
                    tableFilters: { riskFilter: event.target.value, changesPage: 1 },
                  });
                }}
              >
                {INFRA_EVIDENCE_DRIFT_RISK_FILTER_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>
                {GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_CHANGE_TYPE_FILTER_LABEL}
              </span>
              <select
                className={cnField}
                data-testid="infra-drift-change-type-filter"
                value={tableFilterState.changeTypeFilter}
                onChange={(event) => {
                  pushDriftUrl({
                    tableFilters: { changeTypeFilter: event.target.value, changesPage: 1 },
                  });
                }}
              >
                {INFRA_EVIDENCE_DRIFT_CHANGE_TYPE_FILTER_OPTIONS.map((option) => (
                  <option key={option.value || "all"} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>
                {GOVERNANCE_INFRASTRUCTURE_DRIFT_TABLE_RESOURCE_FILTER_LABEL}
              </span>
              <Input
                className={cnField}
                data-testid="infra-drift-resource-filter"
                value={tableFilterState.resourceFilter}
                onChange={(event) => {
                  pushDriftUrl({
                    tableFilters: { resourceFilter: event.target.value, changesPage: 1 },
                  });
                }}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Row shortcuts:</span>
            <KeyboardShortcutBadge shortcut="↑" />
            <KeyboardShortcutBadge shortcut="↓" />
            <KeyboardShortcutBadge shortcut="Esc" />
          </div>
        </section>

        <EnterpriseTable ariaLabel="Inventory drift changes">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              {renderSortableHeader("resource", "Resource")}
              {renderSortableHeader("change", "Change")}
              {renderSortableHeader("property", "Property")}
              {renderSortableHeader("risk", "Risk")}
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {visibleChanges.length === 0 ? renderChangesEmptyState() : null}
            {visibleChanges.map((row) => (
              <EnterpriseTableRow
                key={row.changeId}
                data-testid={`infra-drift-change-row-${row.changeId}`}
                selected={selectedChangeId === row.changeId}
                tabIndex={0}
                aria-selected={selectedChangeId === row.changeId}
                onClick={() => {
                  activateChange(row.changeId, "push");
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    activateChange(row.changeId, "push");
                  }
                }}
              >
                <EnterpriseTableCell className="max-w-xs truncate font-mono text-xs" title={row.azureResourceId ?? undefined}>
                  {row.azureResourceId ?? "—"}
                </EnterpriseTableCell>
                <EnterpriseTableCell>
                  <StatusTag
                    kind={resolveInfraEvidenceChangeTypeStatusKind(row.changeType)}
                    label={formatInfraEvidenceChangeTypeLabel(row.changeType)}
                  />
                </EnterpriseTableCell>
                <EnterpriseTableCell title={row.property ?? undefined}>{row.property ?? "—"}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  {row.riskClassification != null ? (
                    <SeverityTag severity={row.riskClassification} />
                  ) : (
                    "—"
                  )}
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>

        {changesShowingLine != null || changesHasMore ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            {changesShowingLine != null ? (
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-drift-changes-showing-line">
                {changesShowingLine}
              </p>
            ) : <span />}
            {changesHasMore ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                data-testid="infra-drift-load-more-changes"
                disabled={loadingChanges}
                onClick={() => {
                  pushDriftUrl({
                    tableFilters: { changesPage: tableFilterState.changesPage + 1 },
                  });
                }}
              >
                {loadingChanges ? "Loading…" : "Load more changes"}
              </Button>
            ) : null}
          </div>
        ) : null}

        {selectedChange != null ? (
          <section
            ref={changeDrawerRef}
            tabIndex={-1}
            className={cnCard}
            aria-label="Selected change details"
            data-testid="infra-drift-change-drawer"
          >
            <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Change detail</h2>
            <dl className="grid gap-2 text-sm">
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <dt className="font-medium">{GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGE_ID_LABEL}</dt>
                  <dd className="m-0 font-mono text-xs break-all">{selectedChange.changeId}</dd>
                </div>
                <CopyIdButton value={selectedChange.changeId} aria-label="Copy change id" />
              </div>
              {selectedChange.cloudResourceId != null ? (
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <dt className="font-medium">Cloud resource id</dt>
                    <dd className="m-0 font-mono text-xs break-all">{selectedChange.cloudResourceId}</dd>
                  </div>
                  <CopyIdButton value={selectedChange.cloudResourceId} aria-label="Copy cloud resource id" />
                </div>
              ) : null}
              <div>
                <dt className="font-medium">Old value</dt>
                <dd className="font-mono text-xs">{selectedChange.oldValue ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-medium">New value</dt>
                <dd className="font-mono text-xs">{selectedChange.newValue ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-medium">Evidence</dt>
                <dd className="font-mono text-xs">
                  {isNavigableEvidenceReference(selectedChange.evidenceReference) ? (
                    <Link
                      className="text-al-link hover:underline"
                      href={selectedChange.evidenceReference ?? "#"}
                    >
                      {selectedChange.evidenceReference}
                    </Link>
                  ) : (
                    selectedChange.evidenceReference ?? "—"
                  )}
                </dd>
              </div>
            </dl>
            {selectedChange.cloudResourceId != null ? (
              <p className={cn("m-0 mt-3", OPERATOR_TYPOGRAPHY.helper)}>
                <Link
                  className="text-al-link hover:underline"
                  href={resourceHubFilterHrefFromSearch(selectedChange.cloudResourceId, "", {
                    tab: "drift",
                    ...workbenchHubScopePatch,
                  })}
                >
                  {formatResourceHubTabViewLabel("drift")}
                </Link>
              </p>
            ) : null}
          </section>
        ) : null}

        <DriftClaimOrientationStrip />
      </main>
    </OperatorPageContainer>
  );
}
