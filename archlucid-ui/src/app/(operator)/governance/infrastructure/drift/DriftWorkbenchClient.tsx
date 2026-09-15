"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { SponsorExportSendHonestyStrip } from "@/components/exports/SponsorExportSendHonestyStrip";
import { KeyboardShortcutBadge } from "@/components/KeyboardShortcutBadge";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import {
  downloadInfraEvidenceTerraformAdvisoryZip,
  fetchInfraEvidenceDiffChanges,
  fetchInfraEvidenceDiffsForSnapshot,
  fetchInfraEvidenceSnapshotInventoryRows,
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
  resolveInfraEvidenceChangeTypeStatusKind,
} from "@/lib/infra-evidence/infra-evidence-drift-display";
import {
  buildDriftResourceChangeGroup,
  findDriftResourceChangeGroupByChangeId,
  groupDriftChangesByResource,
  resolveDriftResourceGroupKey,
  sortDriftResourceChangeGroups,
  summarizeDriftResourceGroupChangeTypes,
  summarizeDriftResourceGroupProperties,
} from "@/lib/infra-evidence/group-drift-changes-by-resource";
import {
  clearDriftSnapshotsTableFilters,
  filterDriftSnapshots,
  hasActiveDriftSnapshotsTableFilters,
  parseDriftSnapshotsTableFilterState,
  sortDriftSnapshots,
  toggleDriftSnapshotsTableSort,
  type DriftSnapshotsTableFilterState,
  type DriftSnapshotsTableSortKey,
} from "@/lib/infra-evidence/infra-evidence-drift-snapshots-table-filter";
import {
  clearDriftTableFilters,
  filterDriftChanges,
  hasActiveDriftTableFilters,
  parseDriftTableFilterState,
  sortDriftChanges,
  toggleDriftTableSort,
  type DriftTableFilterState,
  type DriftTableSortKey,
} from "@/lib/infra-evidence/infra-evidence-drift-table-filter";
import { buildInfraEvidenceAuditControlOptions, buildInfraEvidenceAuditControlScopePatch } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
import type { CloudResourceAuditLineageMatch } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { buildInfrastructureAskHref, resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
import {
  INFRA_DRIFT_CHANGE_IDENTIFIERS_OPEN_PARAM,
  infraDriftChangeIdentifiersDisclosureHrefFromSearch,
  parseInfraDriftChangeIdentifiersOpenFromSearch,
} from "@/lib/infra-evidence/infra-drift-change-identifiers-disclosure-url";
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
import { InfraEvidenceSelectionAnnouncer } from "@/components/infra-evidence/InfraEvidenceSelectionAnnouncer";
import { WorkbenchAuditLineageStatus } from "@/components/infra-evidence/WorkbenchAuditLineageStatus";
import { WorkbenchHubScopeLinks } from "@/components/infra-evidence/WorkbenchHubScopeLinks";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { useInfraEvidenceResourceHubAuditLineage } from "@/hooks/use-infra-evidence-resource-hub-audit-lineage";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { driftWorkbenchHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-drift-filter-url";
import {
  formatGovernanceInfrastructureDriftCrossSubscriptionDiffDialogDescription,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_INCLUDE_UNCHANGED_HELPER,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_INCLUDE_UNCHANGED_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_RISKY_ONLY_HELPER,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_RISKY_ONLY_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_DRIFT_ANALYSIS_SECTION_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_DRIFT_ANALYSIS_SECTION_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_SCOPED_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_CHANGES_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_INVENTORY_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_INVENTORY_SCOPED_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_INVENTORY_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGES_TABLE_ARIA_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_INVENTORY_TABLE_ARIA_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_DIFFS_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_DIFFS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_LATER_DIFFS_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_LATER_DIFFS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_ACTION,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_SNAPSHOTS_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_DISABLED_NO_SNAPSHOT,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_INVENTORY_PICKER_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_INVENTORY_PICKER_PLACEHOLDER,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_RECEIPT_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_SUBTITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_SECTION_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_SECTION_TITLE,
  formatGovernanceInfrastructureInlineActionError,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";
import { formatInventoryShowingLine } from "@/lib/inventory-showing-count";
import { formatAbsoluteUpdatedAtTitle } from "@/lib/relative-time";
import { OPERATOR_FORM_FIELD_LABEL_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatInfraEvidenceDiffLabel,
  formatInfraEvidenceSnapshotLabel,
} from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import { filterInfraEvidenceDiffsAfterAnchorSnapshot } from "@/lib/infra-evidence/infra-evidence-drift-diff-filter";
import {
  infraEvidenceSnapshotsShareSubscription,
  resolveInfraEvidenceDiffOtherSnapshot,
  resolveInfraEvidenceSnapshotSubscriptionLabel,
} from "@/lib/infra-evidence/infra-evidence-drift-subscription-scope";
import { cn } from "@/lib/utils";

import { DriftBreadcrumb } from "./DriftBreadcrumb";
import { DriftCrossSubscriptionDiffConfirmDialog } from "./DriftCrossSubscriptionDiffConfirmDialog";
import { DriftChangeDetail } from "./DriftChangeDetail";
import { DriftChangeRiskCell } from "./DriftChangeRiskCell";
import { DriftChangeResourceCells } from "./DriftChangeResourceCell";
import { DriftChangesPagination } from "./DriftChangesPagination";
import {
  DRIFT_CHANGES_TABLE_COLUMN_COUNT,
  DRIFT_INVENTORY_TABLE_COLUMN_COUNT,
  DriftChangesTableHead,
} from "./DriftChangesTableHead";
import { DriftClaimOrientationStrip } from "./DriftClaimOrientationStrip";
import { DriftSnapshotIdentifiers } from "./DriftSnapshotIdentifiers";
import { DriftSnapshotsTable } from "./DriftSnapshotsTable";

const cnCard =
  "rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950";

const cnField =
  "rounded-md border border-neutral-200 bg-white px-3 py-2 dark:border-neutral-800 dark:bg-neutral-950";

const cnPickerField = cn(cnField, "w-full max-w-md");

const SNAPSHOTS_PAGE_SIZE = 50;

type PendingDriftSubscriptionConfirmation =
  | { readonly kind: "snapshot"; readonly snapshotId: string }
  | { readonly kind: "diff"; readonly diffId: string };

export function DriftWorkbenchClient() {
  const buyerPolishedShell = useProductionEvalChrome();
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const driftResourceIdOpenParam = searchParams.get(INFRA_DRIFT_RESOURCE_ID_DISCLOSURE_OPEN_PARAM);
  const driftChangeIdentifiersOpenParam = searchParams.get(INFRA_DRIFT_CHANGE_IDENTIFIERS_OPEN_PARAM);
  const [driftResourceIdOpen, setDriftResourceIdOpenState] = useState(() =>
    parseInfraDriftResourceIdDisclosureOpenFromSearch(driftResourceIdOpenParam),
  );
  const [driftChangeIdentifiersOpen, setDriftChangeIdentifiersOpenState] = useState(() =>
    parseInfraDriftChangeIdentifiersOpenFromSearch(driftChangeIdentifiersOpenParam),
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

  const syncDriftChangeIdentifiersOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(infraDriftChangeIdentifiersDisclosureHrefFromSearch(searchParams.toString(), open, pathname), {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const setDriftChangeIdentifiersOpen = useCallback(
    (open: boolean) => {
      setDriftChangeIdentifiersOpenState(open);
      syncDriftChangeIdentifiersOpenToUrl(open);
    },
    [syncDriftChangeIdentifiersOpenToUrl],
  );

  useEffect(() => {
    setDriftResourceIdOpenState(parseInfraDriftResourceIdDisclosureOpenFromSearch(driftResourceIdOpenParam));
  }, [driftResourceIdOpenParam]);

  useEffect(() => {
    setDriftChangeIdentifiersOpenState(parseInfraDriftChangeIdentifiersOpenFromSearch(driftChangeIdentifiersOpenParam));
  }, [driftChangeIdentifiersOpenParam]);

  const changeDrawerRef = useRef<HTMLElement | null>(null);
  const snapshotsSectionRef = useRef<HTMLElement | null>(null);
  const userClearedDiffRef = useRef(false);
  const urlSnapshotId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(DRIFT_WORKBENCH_SNAPSHOT_ID_PARAM));
  const urlCloudResourceId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(DRIFT_WORKBENCH_CLOUD_RESOURCE_ID_PARAM),
  );
  const urlChangeId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(DRIFT_WORKBENCH_CHANGE_ID_PARAM));
  const urlDiffId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(DRIFT_WORKBENCH_DIFF_ID_PARAM));
  const tableFilterState = useMemo(() => parseDriftTableFilterState(searchParams), [searchParams]);
  const snapshotTableFilterState = useMemo(
    () => parseDriftSnapshotsTableFilterState(searchParams),
    [searchParams],
  );

  const [snapshots, setSnapshots] = useState<InfraEvidenceSnapshotSummary[]>([]);
  const [snapshotsTotalCount, setSnapshotsTotalCount] = useState(0);
  const [snapshotsHasMore, setSnapshotsHasMore] = useState(false);
  const [diffs, setDiffs] = useState<InfraEvidenceDiffSummary[]>([]);
  const [changes, setChanges] = useState<InfraEvidenceDiffChange[]>([]);
  const [changesTotalCount, setChangesTotalCount] = useState(0);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");
  const [anchorSnapshotId, setAnchorSnapshotId] = useState<string>("");
  const [selectedDiffId, setSelectedDiffId] = useState<string>("");
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [loadingDiffs, setLoadingDiffs] = useState(false);
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [exportReceipt, setExportReceipt] = useState<{ snapshotId: string; exportedAtUtc: string } | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subscriptionConfirmOpen, setSubscriptionConfirmOpen] = useState(false);
  const [subscriptionConfirmDescription, setSubscriptionConfirmDescription] = useState("");
  const [pendingSubscriptionConfirmation, setPendingSubscriptionConfirmation] =
    useState<PendingDriftSubscriptionConfirmation | null>(null);

  const selectedSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.snapshotId === selectedSnapshotId) ?? null,
    [selectedSnapshotId, snapshots],
  );
  const anchorSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.snapshotId === anchorSnapshotId) ?? null,
    [anchorSnapshotId, snapshots],
  );
  const visibleDiffs = useMemo(() => {
    if (anchorSnapshot == null) {
      return [];
    }

    return filterInfraEvidenceDiffsAfterAnchorSnapshot(diffs, anchorSnapshot, snapshots);
  }, [anchorSnapshot, diffs, snapshots]);
  const selectedDiff = useMemo(
    () => visibleDiffs.find((diff) => diff.diffId === selectedDiffId) ?? null,
    [selectedDiffId, visibleDiffs],
  );

  const visibleSnapshots = useMemo(() => {
    const filtered = filterDriftSnapshots(snapshots, snapshotTableFilterState);

    return sortDriftSnapshots(filtered, snapshotTableFilterState.sortBy, snapshotTableFilterState.sortDir);
  }, [snapshots, snapshotTableFilterState]);

  const snapshotPickerOptions = useMemo(
    () => sortDriftSnapshots(snapshots, "captured", "desc"),
    [snapshots],
  );
  const isViewingSnapshotInventory = selectedSnapshotId.length > 0 && selectedDiffId.length === 0;
  const changesTableColumnCount = isViewingSnapshotInventory
    ? DRIFT_INVENTORY_TABLE_COLUMN_COUNT
    : DRIFT_CHANGES_TABLE_COLUMN_COUNT;

  const effectiveTableFilterState = useMemo(() => {
    if (!isViewingSnapshotInventory) {
      return tableFilterState;
    }

    const inventorySortBy =
      tableFilterState.sortBy === "change"
      || tableFilterState.sortBy === "property"
      || tableFilterState.sortBy === "risk"
        ? "resource"
        : tableFilterState.sortBy;

    return {
      ...tableFilterState,
      riskFilter: "",
      changeTypeFilter: "",
      propertyFilter: "",
      riskyOnly: false,
      sortBy: inventorySortBy,
    };
  }, [isViewingSnapshotInventory, tableFilterState]);

  const visibleChanges = useMemo(() => {
    const filtered = filterDriftChanges(changes, effectiveTableFilterState, selectedDiff);

    return sortDriftChanges(filtered, effectiveTableFilterState.sortBy, effectiveTableFilterState.sortDir);
  }, [changes, effectiveTableFilterState, selectedDiff]);

  const visibleResourceGroups = useMemo(() => {
    const groups = isViewingSnapshotInventory
      ? visibleChanges.map((change) => buildDriftResourceChangeGroup(resolveDriftResourceGroupKey(change), [change]))
      : groupDriftChangesByResource(visibleChanges);

    return sortDriftResourceChangeGroups(groups, effectiveTableFilterState.sortBy, effectiveTableFilterState.sortDir);
  }, [effectiveTableFilterState.sortBy, effectiveTableFilterState.sortDir, isViewingSnapshotInventory, visibleChanges]);

  const hasActiveSnapshotTableFilters = useMemo(
    () => hasActiveDriftSnapshotsTableFilters(snapshotTableFilterState),
    [snapshotTableFilterState],
  );

  const hasActiveTableFilters = useMemo(() => {
    if (isViewingSnapshotInventory) {
      return (
        effectiveTableFilterState.resourceFilter.trim().length > 0
        || effectiveTableFilterState.resourceGroupFilter.trim().length > 0
        || effectiveTableFilterState.resourceTypeFilter.trim().length > 0
      );
    }

    return hasActiveDriftTableFilters(tableFilterState);
  }, [effectiveTableFilterState, isViewingSnapshotInventory, tableFilterState]);

  const selectedResourceGroup = useMemo(
    () => findDriftResourceChangeGroupByChangeId(visibleResourceGroups, selectedChangeId ?? ""),
    [selectedChangeId, visibleResourceGroups],
  );

  const deepLinkedChangeMissing = useMemo(() => {
    if (urlChangeId.length === 0 || loadingChanges || isViewingSnapshotInventory) {
      return false;
    }

    return !visibleChanges.some((row) => row.changeId === urlChangeId);
  }, [isViewingSnapshotInventory, loadingChanges, urlChangeId, visibleChanges]);

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
      readonly snapshotTableFilters?: Partial<typeof snapshotTableFilterState>;
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
      readonly snapshotTableFilters?: Partial<typeof snapshotTableFilterState>;
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

    const selectedGroup = findDriftResourceChangeGroupByChangeId(visibleResourceGroups, urlChangeId);
    const rowChangeId = selectedGroup?.representativeChange.changeId ?? urlChangeId;

    document
      .querySelector(`[data-testid="infra-drift-change-row-${rowChangeId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [selectedChangeId, urlChangeId, visibleResourceGroups]);

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

          if (items.length === 0 && tableFilterState.snapshotsPage === 1) {
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
    setAnchorSnapshotId(urlSnapshotId);
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
        }
      } catch (error: unknown) {
        if (!cancelled) {
          setLoadError(formatInfraEvidenceApiError(error));
          setDiffs([]);
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
  }, [selectedSnapshotId]);

  useEffect(() => {
    if (selectedSnapshotId.length === 0) {
      return;
    }

    if (urlDiffId.length === 0) {
      userClearedDiffRef.current = false;
      setSelectedDiffId("");
      return;
    }

    if (userClearedDiffRef.current) {
      return;
    }

    if (visibleDiffs.some((row) => row.diffId === urlDiffId)) {
      setSelectedDiffId(urlDiffId);
    }
  }, [selectedSnapshotId, urlDiffId, visibleDiffs]);

  useEffect(() => {
    if (selectedDiffId.length === 0 || loadingDiffs) {
      return;
    }

    if (visibleDiffs.some((row) => row.diffId === selectedDiffId)) {
      return;
    }

    userClearedDiffRef.current = true;
    setSelectedDiffId("");
    setSelectedChangeId(null);
    replaceDriftUrl({ diffId: "", changeId: "", tableFilters: { changesPage: 1 } });
  }, [loadingDiffs, replaceDriftUrl, selectedDiffId, visibleDiffs]);

  useEffect(() => {
    if (selectedSnapshotId.length === 0) {
      setChanges([]);
      setChangesTotalCount(0);
      setSelectedChangeId(null);
      return;
    }

    let cancelled = false;

    async function loadChanges() {
      setLoadingChanges(true);
      setLoadError(null);

      try {
        const response = isViewingSnapshotInventory
          ? await fetchInfraEvidenceSnapshotInventoryRows(
              selectedSnapshotId,
              tableFilterState.changesPage,
              tableFilterState.changesPageSize,
              {
                cloudResourceId: urlCloudResourceId.length > 0 ? urlCloudResourceId : null,
              },
            )
          : await fetchInfraEvidenceDiffChanges(selectedDiffId, tableFilterState.changesPage, tableFilterState.changesPageSize, {
              cloudResourceId: urlCloudResourceId.length > 0 ? urlCloudResourceId : null,
              includeUnchanged: tableFilterState.includeUnchanged,
            });

        if (!cancelled) {
          const items = response.items ?? [];
          setChanges(items);
          setChangesTotalCount(response.totalCount ?? items.length);

          if (!isViewingSnapshotInventory && urlChangeId.length > 0) {
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
  }, [
    isViewingSnapshotInventory,
    selectedDiffId,
    selectedSnapshotId,
    tableFilterState.changesPage,
    tableFilterState.changesPageSize,
    tableFilterState.includeUnchanged,
    urlChangeId,
    urlCloudResourceId,
  ]);

  useEffect(() => {
    if (urlChangeId.length === 0 || loadingChanges) {
      return;
    }

    if (findDriftResourceChangeGroupByChangeId(visibleResourceGroups, urlChangeId) != null) {
      window.requestAnimationFrame(() => {
        changeDrawerRef.current?.focus();
      });
    }
  }, [loadingChanges, urlChangeId, visibleResourceGroups]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (visibleResourceGroups.length === 0) {
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
        : visibleResourceGroups.findIndex((group) =>
            group.changes.some((change) => change.changeId === selectedChangeId),
          );
      const nextIndex = event.key === "ArrowDown"
        ? Math.min(currentIndex + 1, visibleResourceGroups.length - 1)
        : Math.max(currentIndex - 1, 0);
      const nextGroup = visibleResourceGroups[nextIndex];

      if (nextGroup != null) {
        activateChange(nextGroup.representativeChange.changeId, "push");
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [activateChange, clearSelectedChange, selectedChangeId, visibleResourceGroups]);

  const runExport = useCallback(async () => {
    if (selectedSnapshotId.length === 0) {
      return;
    }

    setExportBusy(true);
    setExportError(null);

    try {
      await downloadInfraEvidenceTerraformAdvisoryZip(selectedSnapshotId);
      setExportReceipt({
        snapshotId: selectedSnapshotId,
        exportedAtUtc: new Date().toISOString(),
      });
    } catch (error: unknown) {
      setExportError(
        formatGovernanceInfrastructureInlineActionError(
          GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_ERROR_TITLE,
          formatInfraEvidenceApiError(error),
        ),
      );
    } finally {
      setExportBusy(false);
    }
  }, [selectedSnapshotId]);

  const selectionAnnouncement = useMemo(() => {
    if (selectedResourceGroup == null) {
      return null;
    }

    if (selectedResourceGroup.changes.length > 1) {
      return `Showing ${selectedResourceGroup.changes.length} drift changes for this resource.`;
    }

    const selectedChange = selectedResourceGroup.representativeChange;
    const propertyLabel = selectedChange.property ?? formatInfraEvidenceChangeTypeLabel(selectedChange.changeType);

    return `Showing drift change ${propertyLabel}.`;
  }, [selectedResourceGroup]);

  const snapshotsShowingLine = formatInventoryShowingLine(snapshots.length, snapshotsTotalCount, snapshotsHasMore);
  const exportDisabledReason =
    selectedSnapshotId.length === 0 ? GOVERNANCE_INFRASTRUCTURE_DRIFT_EXPORT_DISABLED_NO_SNAPSHOT : null;

  const handleSortColumn = (column: DriftTableSortKey) => {
    pushDriftUrl({
      tableFilters: toggleDriftTableSort(tableFilterState, column),
    });
  };

  const handleTableFiltersChange = (patch: Partial<DriftTableFilterState>) => {
    pushDriftUrl({
      tableFilters: patch,
    });
  };

  const handleClearTableFilters = () => {
    pushDriftUrl({
      tableFilters: clearDriftTableFilters(tableFilterState),
    });
  };

  const handleSnapshotSortColumn = (column: DriftSnapshotsTableSortKey) => {
    pushDriftUrl({
      snapshotTableFilters: toggleDriftSnapshotsTableSort(snapshotTableFilterState, column),
    });
  };

  const handleSnapshotTableFiltersChange = (patch: Partial<DriftSnapshotsTableFilterState>) => {
    pushDriftUrl({
      snapshotTableFilters: patch,
    });
  };

  const handleClearSnapshotTableFilters = () => {
    pushDriftUrl({
      snapshotTableFilters: clearDriftSnapshotsTableFilters(snapshotTableFilterState),
    });
  };

  const requestSubscriptionConfirmation = useCallback(
    (
      pending: PendingDriftSubscriptionConfirmation,
      anchorSnapshot: InfraEvidenceSnapshotSummary,
      nextSnapshot: InfraEvidenceSnapshotSummary,
    ) => {
      setPendingSubscriptionConfirmation(pending);
      setSubscriptionConfirmDescription(
        formatGovernanceInfrastructureDriftCrossSubscriptionDiffDialogDescription(
          resolveInfraEvidenceSnapshotSubscriptionLabel(anchorSnapshot),
          resolveInfraEvidenceSnapshotSubscriptionLabel(nextSnapshot),
        ),
      );
      setSubscriptionConfirmOpen(true);
    },
    [],
  );

  const applySnapshotSelect = useCallback(
    (nextSnapshotId: string) => {
      setSelectedSnapshotId(nextSnapshotId);
      setAnchorSnapshotId(nextSnapshotId);
      setSelectedDiffId("");
      setSelectedChangeId(null);
      pushDriftUrl({
        snapshotId: nextSnapshotId,
        diffId: "",
        changeId: "",
        tableFilters: { changesPage: 1 },
      });
    },
    [pushDriftUrl],
  );

  const applySnapshotClear = useCallback(() => {
    userClearedDiffRef.current = true;
    setSelectedSnapshotId("");
    setAnchorSnapshotId("");
    setSelectedDiffId("");
    setSelectedChangeId(null);
    pushDriftUrl({
      snapshotId: "",
      diffId: "",
      changeId: "",
      tableFilters: { changesPage: 1 },
    });
  }, [pushDriftUrl]);

  const applyDiffSelect = useCallback(
    (nextDiffId: string) => {
      userClearedDiffRef.current = false;
      setSelectedDiffId(nextDiffId);
      setSelectedChangeId(null);
      pushDriftUrl({ diffId: nextDiffId, changeId: "", tableFilters: { changesPage: 1 } });
    },
    [pushDriftUrl],
  );

  const handleSnapshotSelect = useCallback(
    (nextSnapshotId: string) => {
      if (nextSnapshotId === selectedSnapshotId) {
        return;
      }

      const nextSnapshot = snapshots.find((snapshot) => snapshot.snapshotId === nextSnapshotId) ?? null;

      if (nextSnapshot == null) {
        applySnapshotSelect(nextSnapshotId);
        return;
      }

      const subscriptionAnchor = anchorSnapshot ?? selectedSnapshot;

      if (subscriptionAnchor != null && !infraEvidenceSnapshotsShareSubscription(subscriptionAnchor, nextSnapshot)) {
        requestSubscriptionConfirmation({ kind: "snapshot", snapshotId: nextSnapshotId }, subscriptionAnchor, nextSnapshot);
        return;
      }

      applySnapshotSelect(nextSnapshotId);
    },
    [anchorSnapshot, applySnapshotSelect, requestSubscriptionConfirmation, selectedSnapshot, selectedSnapshotId, snapshots],
  );

  const handleSnapshotPickerChange = useCallback(
    (nextSnapshotId: string) => {
      if (nextSnapshotId.length === 0) {
        applySnapshotClear();
        return;
      }

      handleSnapshotSelect(nextSnapshotId);
    },
    [applySnapshotClear, handleSnapshotSelect],
  );

  const handleDiffSelect = useCallback(
    (nextDiffId: string) => {
      if (nextDiffId.length === 0) {
        const restoreSnapshotId =
          anchorSnapshotId.length > 0 ? anchorSnapshotId : selectedSnapshotId;

        userClearedDiffRef.current = true;
        setSelectedDiffId("");
        setSelectedChangeId(null);

        if (restoreSnapshotId.length > 0 && restoreSnapshotId !== selectedSnapshotId) {
          setSelectedSnapshotId(restoreSnapshotId);
        }

        pushDriftUrl({
          snapshotId: restoreSnapshotId.length > 0 ? restoreSnapshotId : null,
          diffId: "",
          changeId: "",
          tableFilters: { changesPage: 1 },
        });

        window.requestAnimationFrame(() => {
          snapshotsSectionRef.current?.scrollIntoView({ block: "nearest" });
        });
        return;
      }

      if (nextDiffId === selectedDiffId) {
        return;
      }

      const nextDiff = visibleDiffs.find((diff) => diff.diffId === nextDiffId) ?? null;

      if (nextDiff == null || anchorSnapshot == null) {
        applyDiffSelect(nextDiffId);
        return;
      }

      const otherSnapshot = resolveInfraEvidenceDiffOtherSnapshot(nextDiff, anchorSnapshotId, snapshots);

      if (otherSnapshot != null && !infraEvidenceSnapshotsShareSubscription(anchorSnapshot, otherSnapshot)) {
        requestSubscriptionConfirmation({ kind: "diff", diffId: nextDiffId }, anchorSnapshot, otherSnapshot);
        return;
      }

      applyDiffSelect(nextDiffId);
    },
    [
      anchorSnapshot,
      anchorSnapshotId,
      applyDiffSelect,
      pushDriftUrl,
      requestSubscriptionConfirmation,
      selectedDiffId,
      selectedSnapshotId,
      snapshots,
      visibleDiffs,
    ],
  );

  const handleSubscriptionConfirm = useCallback(() => {
    const pending = pendingSubscriptionConfirmation;

    setSubscriptionConfirmOpen(false);
    setPendingSubscriptionConfirmation(null);

    if (pending == null) {
      return;
    }

    if (pending.kind === "snapshot") {
      applySnapshotSelect(pending.snapshotId);
      return;
    }

    applyDiffSelect(pending.diffId);
  }, [applyDiffSelect, applySnapshotSelect, pendingSubscriptionConfirmation]);

  const handleSubscriptionConfirmOpenChange = useCallback((open: boolean) => {
    setSubscriptionConfirmOpen(open);

    if (!open) {
      setPendingSubscriptionConfirmation(null);
    }
  }, []);

  const renderChangesEmptyState = () => {
    if (loadingChanges) {
      return (
        <EnterpriseTableRow>
          <EnterpriseTableCell colSpan={changesTableColumnCount}>Loading changes…</EnterpriseTableCell>
        </EnterpriseTableRow>
      );
    }

    if (isViewingSnapshotInventory) {
      return (
        <EnterpriseTableRow>
          <EnterpriseTableCell colSpan={changesTableColumnCount}>
            <EnterpriseCompactEmptyState
              title={GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_INVENTORY_TITLE}
              description={
                urlCloudResourceId.length > 0
                  ? GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_INVENTORY_SCOPED_BODY
                  : GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_INVENTORY_BODY
              }
              testId="infra-drift-changes-empty-inventory"
            />
          </EnterpriseTableCell>
        </EnterpriseTableRow>
      );
    }

    return (
      <EnterpriseTableRow>
        <EnterpriseTableCell colSpan={changesTableColumnCount}>
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
        subtitle={
          buyerPolishedShell
            ? GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD
            : GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_SUBTITLE
        }
        subtitleTestId="infra-drift-page-lead"
        claimDiscipline={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId="infra-drift-claim-discipline"
        titleTestId="infra-drift-page-title"
        breadcrumb={<DriftBreadcrumb />}
        actions={<PageContextualHelpButton />}
      />

      <main
        id={GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID}
        className={cn("flex w-full flex-col gap-4 scroll-mt-24")}
        data-testid="infra-drift-primary-content"
      >
        <InfraEvidenceSelectionAnnouncer message={selectionAnnouncement} testId="infra-drift-selection-announcer" />

        {urlCloudResourceId.length > 0 ? (
          <section
            className={cnCard}
            data-testid="infra-drift-resource-scope-banner"
            aria-label="Drift workbench resource scope"
          >
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body)}>
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_SCOPE_LABEL}.
            </p>
            <CollapsibleSection
              title="Resource id"
              sectionTestId="infra-drift-resource-id-disclosure"
              summaryLine="Cloud resource UUID from the scoped link"
              open={driftResourceIdOpen}
              onToggle={setDriftResourceIdOpen}
              className="mb-0"
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

        {buyerPolishedShell ? null : (
          <p
            className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
            data-testid="infra-drift-page-secondary-lead"
          >
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD}
          </p>
        )}

        <section
          ref={snapshotsSectionRef}
          className={cn("flex flex-col gap-3", cnCard)}
          aria-label={GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_SECTION_TITLE}
        >
          <div>
            <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>{GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_SECTION_TITLE}</h2>
            <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              {GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOTS_SECTION_BODY}
            </p>
          </div>

          <div className="grid max-w-md gap-2">
            <Label htmlFor="infra-drift-snapshot-picker">{GOVERNANCE_INFRASTRUCTURE_DRIFT_INVENTORY_PICKER_LABEL}</Label>
            <select
              id="infra-drift-snapshot-picker"
              className={cnPickerField}
              data-testid="infra-drift-snapshot-picker"
              disabled={loadingSnapshots || snapshotPickerOptions.length === 0}
              value={selectedSnapshotId}
              onChange={(event) => {
                handleSnapshotPickerChange(event.target.value);
              }}
            >
              <option value="">{GOVERNANCE_INFRASTRUCTURE_DRIFT_INVENTORY_PICKER_PLACEHOLDER}</option>
              {loadingSnapshots ? <option value="" disabled>Loading inventory files…</option> : null}
              {!loadingSnapshots && snapshotPickerOptions.length === 0 ? (
                <option value="" disabled>No inventory files yet</option>
              ) : null}
              {snapshotPickerOptions.map((snapshot) => (
                <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                  {formatInfraEvidenceSnapshotLabel(snapshot)}
                </option>
              ))}
            </select>
          </div>

          <DriftSnapshotsTable
            snapshots={visibleSnapshots}
            selectedSnapshotId={selectedSnapshotId}
            loading={loadingSnapshots}
            tableFilterState={snapshotTableFilterState}
            hasActiveFilters={hasActiveSnapshotTableFilters}
            onSelectSnapshot={handleSnapshotSelect}
            onSortColumn={handleSnapshotSortColumn}
            onTableFiltersChange={handleSnapshotTableFiltersChange}
            onClearFilters={handleClearSnapshotTableFilters}
          />

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

          {selectedSnapshotId.length > 0 ? (
            <div className="flex flex-col gap-3 border-t border-neutral-200 pt-3 dark:border-neutral-800">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="infra-drift-selected-snapshot-summary">
                <span className="font-medium text-al-text-primary">{GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_LABEL}:</span>{" "}
                {selectedSnapshot != null ? formatInfraEvidenceSnapshotLabel(selectedSnapshot) : selectedSnapshotId}
              </p>

              <div className="flex flex-wrap items-start gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="infra-drift-export-terraform"
                  disabled={exportBusy || exportDisabledReason != null}
                  title={exportDisabledReason ?? undefined}
                  aria-describedby={
                    exportDisabledReason != null
                      ? "infra-drift-export-disabled-reason"
                      : exportError != null
                        ? "infra-drift-export-error"
                        : undefined
                  }
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
              </div>

              <SponsorExportSendHonestyStrip testIdPrefix="infra-drift-export-terraform" />

              <DriftSnapshotIdentifiers snapshotId={selectedSnapshotId} diffId={selectedDiffId} />

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
                    {formatAbsoluteUpdatedAtTitle(exportReceipt.exportedAtUtc)}
                  </p>
                </div>
              ) : null}

              {exportError != null ? (
                <OperatorMutationInlineError message={exportError} testId="infra-drift-export-error" />
              ) : null}
            </div>
          ) : null}
        </section>

        {selectedSnapshotId.length > 0 ? (
          <section className={cn("flex flex-col gap-3", cnCard)} aria-label={GOVERNANCE_INFRASTRUCTURE_DRIFT_DRIFT_ANALYSIS_SECTION_TITLE}>
            <div>
              <h2 className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
                {GOVERNANCE_INFRASTRUCTURE_DRIFT_DRIFT_ANALYSIS_SECTION_TITLE}
              </h2>
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {GOVERNANCE_INFRASTRUCTURE_DRIFT_DRIFT_ANALYSIS_SECTION_BODY}
              </p>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="grid min-w-[16rem] max-w-xl gap-2">
                <Label htmlFor="infra-drift-diff-picker">{GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_LABEL}</Label>
                <select
                  id="infra-drift-diff-picker"
                  className={cn(cnField, "w-full")}
                  data-testid="infra-drift-diff-picker"
                  disabled={loadingDiffs || visibleDiffs.length === 0}
                  value={selectedDiffId}
                  onChange={(event) => {
                    handleDiffSelect(event.target.value);
                  }}
                >
                  <option value="">Select a diff…</option>
                  {loadingDiffs ? <option value="" disabled>Loading diffs…</option> : null}
                  {!loadingDiffs && diffs.length === 0 ? <option value="" disabled>No diffs for this snapshot</option> : null}
                  {!loadingDiffs && diffs.length > 0 && visibleDiffs.length === 0 ? (
                    <option value="" disabled>No later inventory captures to compare</option>
                  ) : null}
                  {visibleDiffs.map((diff) => (
                    <option key={diff.diffId} value={diff.diffId}>
                      {formatInfraEvidenceDiffLabel(diff, anchorSnapshotId, snapshots)}
                    </option>
                  ))}
                </select>
              </div>

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

            {selectedDiffId.length > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="infra-drift-include-unchanged"
                      data-testid="infra-drift-include-unchanged"
                      checked={tableFilterState.includeUnchanged}
                      onCheckedChange={(checked) => {
                        handleTableFiltersChange({
                          includeUnchanged: checked === true,
                          changesPage: 1,
                        });
                      }}
                    />
                    <Label htmlFor="infra-drift-include-unchanged" className="cursor-pointer font-normal">
                      {GOVERNANCE_INFRASTRUCTURE_DRIFT_INCLUDE_UNCHANGED_LABEL}
                    </Label>
                  </div>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {GOVERNANCE_INFRASTRUCTURE_DRIFT_INCLUDE_UNCHANGED_HELPER}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="infra-drift-risky-only"
                      data-testid="infra-drift-risky-only"
                      checked={tableFilterState.riskyOnly}
                      onCheckedChange={(checked) => {
                        const riskyOnly = checked === true;
                        const riskFilter = tableFilterState.riskFilter.trim().toLowerCase();
                        const clearsRiskFilter = riskyOnly && (riskFilter === "none" || riskFilter === "unknown");

                        handleTableFiltersChange({
                          riskyOnly,
                          riskFilter: clearsRiskFilter ? "" : tableFilterState.riskFilter,
                          changesPage: 1,
                        });
                      }}
                    />
                    <Label htmlFor="infra-drift-risky-only" className="cursor-pointer font-normal">
                      {GOVERNANCE_INFRASTRUCTURE_DRIFT_RISKY_ONLY_LABEL}
                    </Label>
                  </div>
                  <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {GOVERNANCE_INFRASTRUCTURE_DRIFT_RISKY_ONLY_HELPER}
                  </p>
                </div>
              </div>
            ) : null}

            <p className={cn("m-0 flex flex-wrap items-center gap-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
              <span>Row shortcuts:</span>
              <KeyboardShortcutBadge shortcut="↑" />
              <KeyboardShortcutBadge shortcut="↓" />
              <KeyboardShortcutBadge shortcut="Esc" />
            </p>
          </section>
        ) : null}

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

        {!loadingDiffs && selectedSnapshotId.length > 0 && diffs.length > 0 && visibleDiffs.length === 0 ? (
          <EnterpriseCompactEmptyState
            title={GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_LATER_DIFFS_TITLE}
            description={GOVERNANCE_INFRASTRUCTURE_DRIFT_EMPTY_LATER_DIFFS_BODY}
            testId="infra-drift-diffs-empty-later-than-anchor"
          />
        ) : null}

        {selectedSnapshotId.length > 0 ? (
        <>
        <EnterpriseTable
          ariaLabel={
            isViewingSnapshotInventory
              ? GOVERNANCE_INFRASTRUCTURE_DRIFT_INVENTORY_TABLE_ARIA_LABEL
              : GOVERNANCE_INFRASTRUCTURE_DRIFT_CHANGES_TABLE_ARIA_LABEL
          }
        >
          <DriftChangesTableHead
            tableFilterState={tableFilterState}
            hasActiveFilters={hasActiveTableFilters}
            showDiffColumns={!isViewingSnapshotInventory}
            onSortColumn={handleSortColumn}
            onTableFiltersChange={handleTableFiltersChange}
            onClearFilters={handleClearTableFilters}
          />
          <EnterpriseTableBody data-testid="infra-drift-changes-body">
            {visibleResourceGroups.length === 0 ? renderChangesEmptyState() : null}
            {visibleResourceGroups.map((group) => {
              const rowChange = group.representativeChange;
              const isSelected =
                !isViewingSnapshotInventory
                && group.changes.some((change) => change.changeId === selectedChangeId);

              return (
                <Fragment key={group.groupKey}>
                  <EnterpriseTableRow
                    data-testid={`infra-drift-change-row-${rowChange.changeId}`}
                    selected={isSelected}
                    tabIndex={isViewingSnapshotInventory ? undefined : 0}
                    aria-selected={isViewingSnapshotInventory ? undefined : isSelected}
                    aria-expanded={isViewingSnapshotInventory ? undefined : isSelected}
                    onClick={
                      isViewingSnapshotInventory
                        ? undefined
                        : () => {
                            activateChange(rowChange.changeId, "push");
                          }
                    }
                    onKeyDown={
                      isViewingSnapshotInventory
                        ? undefined
                        : (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              activateChange(rowChange.changeId, "push");
                            }
                          }
                    }
                  >
                    <DriftChangeResourceCells azureResourceId={rowChange.azureResourceId} />
                    {!isViewingSnapshotInventory ? (
                      <>
                        <EnterpriseTableCell>
                          <StatusTag
                            kind={resolveInfraEvidenceChangeTypeStatusKind(rowChange.changeType)}
                            label={summarizeDriftResourceGroupChangeTypes(group)}
                          />
                        </EnterpriseTableCell>
                        <EnterpriseTableCell>{summarizeDriftResourceGroupProperties(group)}</EnterpriseTableCell>
                        <EnterpriseTableCell>
                          <DriftChangeRiskCell change={rowChange} />
                        </EnterpriseTableCell>
                      </>
                    ) : null}
                  </EnterpriseTableRow>
                  {isSelected && selectedResourceGroup != null ? (
                    <EnterpriseTableRow data-testid={`infra-drift-change-detail-row-${rowChange.changeId}`}>
                      <EnterpriseTableCell
                        colSpan={changesTableColumnCount}
                        className="bg-neutral-50 p-0 dark:bg-neutral-900/40"
                      >
                        <DriftChangeDetail
                          selectedChanges={selectedResourceGroup.changes}
                          changeDrawerRef={changeDrawerRef}
                          changeIdentifiersOpen={driftChangeIdentifiersOpen}
                          onChangeIdentifiersToggle={setDriftChangeIdentifiersOpen}
                          variant="inline"
                          hubHref={
                            rowChange.cloudResourceId != null
                              ? resourceHubFilterHrefFromSearch(rowChange.cloudResourceId, "", {
                                  tab: "drift",
                                  ...workbenchHubScopePatch,
                                })
                              : null
                          }
                        />
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </EnterpriseTableBody>
        </EnterpriseTable>

        <DriftChangesPagination
          page={tableFilterState.changesPage}
          pageSize={tableFilterState.changesPageSize}
          totalCount={changesTotalCount}
          disabled={loadingChanges}
          onPageChange={(page) => {
            pushDriftUrl({
              tableFilters: { changesPage: page },
            });
          }}
          onPageSizeChange={(pageSize) => {
            pushDriftUrl({
              tableFilters: { changesPage: 1, changesPageSize: pageSize },
            });
          }}
        />

        </>
        ) : null}

        <DriftClaimOrientationStrip />
      </main>

      <DriftCrossSubscriptionDiffConfirmDialog
        open={subscriptionConfirmOpen}
        description={subscriptionConfirmDescription}
        onOpenChange={handleSubscriptionConfirmOpenChange}
        onConfirm={handleSubscriptionConfirm}
      />
    </OperatorPageContainer>
  );
}
