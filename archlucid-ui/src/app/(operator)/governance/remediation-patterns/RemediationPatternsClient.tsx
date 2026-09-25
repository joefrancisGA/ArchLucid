"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { CopyIdButton } from "@/components/CopyIdButton";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RefreshButton } from "@/components/ui/refresh-button";
import { StatusTag } from "@/components/ui/status-tag";
import { InteractiveChip } from "@/components/ui/interactive-chip";
import {
  PageContextualHelpButton,
  PAGE_HELP_SHORT_TRIGGER_TEXT,
} from "@/components/usability/PageContextualHelpButton";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { useRemediationPatternsShortcuts } from "@/hooks/use-remediation-patterns-shortcuts";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOperatorRelativeFreshnessNowMs } from "@/hooks/use-operator-relative-freshness-now-ms";
import { useEnterpriseTableKeyboardNav } from "@/hooks/use-enterprise-table-keyboard-nav";
import {
  useRemediationPatternDetailQuery,
  useRemediationPatternsQuery,
} from "@/hooks/use-remediation-patterns-query";
import { buyerFilterChipClass } from "@/lib/buyer/buyer-shell-home-present";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { errorRecoveryContractForScenario } from "@/lib/error-recovery-contract-copy";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance/governance-route-paths";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { remediationInstancesPathForProductLine } from "@/lib/product-line/securenow-remediation-instances-route";
import { remediationPatternsPathForProductLine } from "@/lib/product-line/securenow-remediation-patterns-route";
import {
  diffRemediationPatternContent,
  findApprovedRemediationPatternVersion,
  formatRemediationPatternVersionContent,
  remediationPatternRegistryAttentionLabel,
  remediationPatternRegistryNeedsAttention,
  remediationPatternRegistryStatusLabel,
  validateRemediationPatternYamlDraft,
} from "@/lib/remediation-pattern-content";
import {
  REMEDIATION_PATTERNS_LAST_REFRESHED_PREFIX,
  REMEDIATION_PATTERNS_REFRESHING_LABEL,
  remediationPatternsDataStaleCue,
  resolveRemediationPatternsLastRefreshedAt,
} from "@/lib/remediation-pattern-freshness";
import {
  approveRemediationPatternVersion,
  importRemediationPatternYaml,
  submitRemediationPatternVersion,
} from "@/lib/remediation-pattern-api";
import {
  countRemediationPatternRegistryByFilter,
  filterRemediationPatternRegistry,
  parseRemediationPatternRegistryFilterFromSearch,
  remediationPatternRegistryFilterHrefFromSearch,
  REMEDIATION_PATTERN_REGISTRY_FILTERS,
  type RemediationPatternRegistryFilter,
} from "@/lib/remediation-pattern-registry-filters";
import {
  REMEDIATION_PATTERN_ID_PARAM,
  REMEDIATION_PATTERN_VERSION_PARAM,
  REMEDIATION_PATTERN_YAML_IMPORT_SECTION_ID,
  parseRemediationPatternIdFromSearch,
  parseRemediationPatternVersionFromSearch,
  remediationPatternSelectionHrefFromSearch,
  remediationPatternYamlImportHref,
} from "@/lib/remediation-pattern-selection-url";
import {
  canApproveRemediationPatternVersion,
  canSubmitRemediationPatternVersion,
  remediationPatternApprovalBlockedReason,
  remediationPatternSubmitBlockedReason,
} from "@/lib/remediation-pattern-sod";
import {
  formatRemediationPatternAutomationLevel,
  remediationPatternStatusKind,
  remediationPatternStatusLabel,
  REMEDIATION_PATTERN_STATUS,
} from "@/lib/remediation-pattern-status";
import type { RemediationPatternRecord, RemediationPatternVersionRecord } from "@/lib/remediation-pattern-types";
import { cn } from "@/lib/utils";

import { RemediationPatternsGuards } from "./RemediationPatternsGuards";
import {
  REMEDIATION_PATTERNS_CLAIM_DISCIPLINE,
  REMEDIATION_PATTERNS_PRIMARY_CONTENT_ID,
  REMEDIATION_PATTERNS_SKIP_LINK_LABEL,
} from "@/lib/remediation-patterns-page-copy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";

const SELECTABLE_ROW_CLASS =
  "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400";

const DRAFT_RULE_COPY =
  "Imported YAML always lands as Draft. Submit and approve before production remediation instances can use it.";

const REGISTRY_FILTER_OPTIONS: ReadonlyArray<{
  readonly id: RemediationPatternRegistryFilter;
  readonly label: string;
}> = [
  { id: REMEDIATION_PATTERN_REGISTRY_FILTERS.all, label: "All" },
  { id: REMEDIATION_PATTERN_REGISTRY_FILTERS.needsAttention, label: "Needs attention" },
  { id: REMEDIATION_PATTERN_REGISTRY_FILTERS.hasApproved, label: "Has approved version" },
];

function activateSelectableRow(event: KeyboardEvent, onActivate: () => void): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

function remediationInstancesForPatternHref(
  productLine: ReturnType<typeof useProductLine>["productLine"],
  patternKey: string,
  patternVersion?: string | null,
): string {
  const base = remediationInstancesPathForProductLine(productLine);
  const params = new URLSearchParams();
  params.set("patternKey", patternKey);

  const version = patternVersion?.trim() ?? "";

  if (version.length > 0) {
    params.set("patternVersion", version);
  }

  return `${base}?${params.toString()}`;
}

function RegistryFilterChip(props: {
  readonly filter: RemediationPatternRegistryFilter;
  readonly label: string;
  readonly count: number;
  readonly selected: boolean;
  readonly href: string;
}) {
  const disabled = props.filter !== REMEDIATION_PATTERN_REGISTRY_FILTERS.all && props.count === 0;
  const disabledReasonId = `remediation-pattern-registry-filter-${props.filter}-disabled-reason`;
  const labelWithCount = `${props.label} (${props.count})`;

  return (
    <span className="inline-flex">
      <InteractiveChip
        href={disabled ? undefined : props.href}
        scroll={false}
        className={buyerFilterChipClass(props.selected, disabled, props.count === 0)}
        aria-current={props.selected ? "page" : undefined}
        aria-label={`Filter pattern registry: ${labelWithCount}`}
        aria-describedby={disabled ? disabledReasonId : undefined}
        disabled={disabled}
        data-testid={`remediation-pattern-registry-filter-${props.filter}`}
      >
        {labelWithCount}
      </InteractiveChip>
      {disabled ? (
        <span id={disabledReasonId} className="sr-only">
          No patterns match this filter yet.
        </span>
      ) : null}
    </span>
  );
}

function PatternContentReviewPanel(props: {
  readonly activeVersion: RemediationPatternVersionRecord;
  readonly approvedVersion: RemediationPatternVersionRecord | null;
  readonly onContentViewed: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const activeContent = formatRemediationPatternVersionContent(props.activeVersion.contentJson);
  const approvedContent = formatRemediationPatternVersionContent(props.approvedVersion?.contentJson);
  const diffLines =
    props.approvedVersion !== null && props.activeVersion.version !== props.approvedVersion.version
      ? diffRemediationPatternContent(approvedContent, activeContent)
      : [];

  useEffect(() => {
    const node = panelRef.current;

    if (node === null || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          props.onContentViewed();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [props]);

  return (
    <section
      ref={panelRef}
      className="space-y-2 rounded border border-border bg-card p-4"
      aria-label="Pattern version content"
      data-testid="remediation-pattern-version-content-panel"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Pattern content</h3>
        <Button type="button" variant="outline" size="sm" onClick={props.onContentViewed}>
          Mark content reviewed
        </Button>
      </div>
      {activeContent === null ? (
        <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-pattern-version-content-unavailable">
          Pattern body is not available from the API for this version. Approval still requires reviewing control
          objective and automation fields above.
        </p>
      ) : (
        <pre
          className="max-h-64 overflow-auto rounded border border-border bg-background p-3 font-mono text-xs whitespace-pre-wrap"
          data-testid="remediation-pattern-version-content-body"
        >
          {activeContent}
        </pre>
      )}
      {diffLines.length > 0 ? (
        <div className="space-y-2" data-testid="remediation-pattern-version-content-diff">
          <p className={OPERATOR_TYPOGRAPHY.helper}>
            Diff vs approved v{props.approvedVersion?.version} (line-oriented, client-side).
          </p>
          <pre className="max-h-48 overflow-auto rounded border border-border bg-background p-3 font-mono text-xs whitespace-pre-wrap">
            {diffLines.map((line, index) => {
              const prefix = line.kind === "added" ? "+ " : line.kind === "removed" ? "- " : "  ";

              return (
                <span
                  key={`${line.kind}-${index}`}
                  className={cn(
                    line.kind === "added" ? "text-emerald-700 dark:text-emerald-300" : undefined,
                    line.kind === "removed" ? "text-rose-700 dark:text-rose-300" : undefined,
                  )}
                >
                  {prefix}
                  {line.text}
                  {"\n"}
                </span>
              );
            })}
          </pre>
        </div>
      ) : null}
    </section>
  );
}

function VersionHistoryTable(props: {
  readonly versions: ReadonlyArray<RemediationPatternVersionRecord>;
  readonly selectedVersion: string | null;
  readonly onSelectVersion: (version: string) => void;
}) {
  const keyboardNav = useEnterpriseTableKeyboardNav({
    rowCount: props.versions.length,
    onActivateRow: (index) => {
      const version = props.versions[index];

      if (version !== undefined) {
        props.onSelectVersion(version.version);
      }
    },
  });

  return (
    <div
      tabIndex={props.versions.length > 0 ? 0 : undefined}
      data-testid="remediation-pattern-version-table-nav"
      onKeyDown={keyboardNav.onTableKeyDown}
    >
      <EnterpriseTable ariaLabel="Remediation pattern version history">
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>Version</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Author</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Updated</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {props.versions.map((version, index) => (
            <EnterpriseTableRow
              key={version.versionId}
              data-testid={`remediation-pattern-version-${version.version}`}
              data-selectable-row-index={index}
              selected={props.selectedVersion === version.version}
              className={cn(
                SELECTABLE_ROW_CLASS,
                props.selectedVersion === version.version ? "bg-muted/40" : undefined,
                keyboardNav.isRowFocused(index) ? "ring-1 ring-inset ring-neutral-400" : undefined,
              )}
              tabIndex={-1}
              aria-current={props.selectedVersion === version.version ? "true" : undefined}
              onClick={() => props.onSelectVersion(version.version)}
              onKeyDown={(event) => activateSelectableRow(event, () => props.onSelectVersion(version.version))}
            >
              <EnterpriseTableCell>{version.version}</EnterpriseTableCell>
              <EnterpriseTableCell>
                <StatusTag
                  kind={remediationPatternStatusKind(version.status)}
                  label={remediationPatternStatusLabel(version.status)}
                />
              </EnterpriseTableCell>
              <EnterpriseTableCell>{version.authorActorKey}</EnterpriseTableCell>
              <EnterpriseTableCell>{formatInstantForLocale(version.updatedUtc)}</EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>
    </div>
  );
}

export function RemediationPatternsClient() {
  const { productLine } = useProductLine();
  const navHref = remediationPatternsPathForProductLine(productLine);
  const pathname = usePathname() ?? navHref;
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchString = searchParams.toString();
  const nowMs = useOperatorRelativeFreshnessNowMs();

  const listQuery = useRemediationPatternsQuery();
  const urlPatternId = parseRemediationPatternIdFromSearch(searchParams.get(REMEDIATION_PATTERN_ID_PARAM));
  const urlVersion = parseRemediationPatternVersionFromSearch(searchParams.get(REMEDIATION_PATTERN_VERSION_PARAM));
  const registryFilter = parseRemediationPatternRegistryFilterFromSearch(
    searchParams.get("registryFilter"),
  );

  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(urlPatternId);
  const detailQuery = useRemediationPatternDetailQuery(selectedPatternId);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(urlVersion);
  const [yamlDraft, setYamlDraft] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [importPanelOpen, setImportPanelOpen] = useState(false);
  const [importPending, setImportPending] = useState(false);
  const [submitPending, setSubmitPending] = useState(false);
  const [approvePending, setApprovePending] = useState(false);
  const [viewedVersionKeys, setViewedVersionKeys] = useState<ReadonlySet<string>>(() => new Set());
  const canMutate = useOperateCapability();
  const { currentPrincipal } = useOperatorNavAuthority();

  const yamlInputRef = useRef<HTMLTextAreaElement>(null);
  const yamlFileInputRef = useRef<HTMLInputElement>(null);
  const detailSectionRef = useRef<HTMLElement>(null);
  const registryTableNavRef = useRef<HTMLDivElement>(null);

  const patterns = listQuery.data ?? [];
  const filteredPatterns = useMemo(
    () => filterRemediationPatternRegistry(patterns, registryFilter),
    [patterns, registryFilter],
  );
  const registryFilterCounts = useMemo(() => countRemediationPatternRegistryByFilter(patterns), [patterns]);
  const versions = detailQuery.data?.versions ?? [];
  const selectedPattern = patterns.find((pattern) => pattern.patternId === selectedPatternId) ?? null;

  const refreshing = listQuery.isFetching || detailQuery.isFetching;

  const lastRefreshedAt = useMemo(
    () =>
      resolveRemediationPatternsLastRefreshedAt({
        listUpdatedAt: listQuery.dataUpdatedAt,
        detailUpdatedAt: selectedPatternId ? detailQuery.dataUpdatedAt : null,
      }),
    [detailQuery.dataUpdatedAt, listQuery.dataUpdatedAt, selectedPatternId],
  );

  const freshnessLabel = operatorFreshnessMetadataWithClockLabel({
    prefix: REMEDIATION_PATTERNS_LAST_REFRESHED_PREFIX,
    lastRefreshedAt: refreshing ? null : lastRefreshedAt,
    refreshingLabel: REMEDIATION_PATTERNS_REFRESHING_LABEL,
  });

  const staleCue = remediationPatternsDataStaleCue(lastRefreshedAt, nowMs);

  const syncSelectionUrl = useCallback(
    (patch: { readonly patternId: string | null; readonly version: string | null }) => {
      const nextHref = remediationPatternSelectionHrefFromSearch(searchString, patch, pathname);
      router.replace(nextHref, { scroll: false });
    },
    [pathname, router, searchString],
  );

  const openImportPanel = useCallback((focusTextarea = true) => {
    setImportPanelOpen(true);

    if (focusTextarea) {
      window.requestAnimationFrame(() => {
        yamlInputRef.current?.focus();
      });
    }
  }, []);

  useEffect(() => {
    setSelectedPatternId(urlPatternId);
  }, [urlPatternId]);

  useEffect(() => {
    setSelectedVersion(urlVersion);
  }, [urlVersion]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const openFromHash = () => {
      if (window.location.hash === `#${REMEDIATION_PATTERN_YAML_IMPORT_SECTION_ID}`) {
        openImportPanel(true);
      }
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);

    return () => {
      window.removeEventListener("hashchange", openFromHash);
    };
  }, [openImportPanel]);

  const activeVersion = useMemo(
    () => versions.find((version) => version.version === selectedVersion) ?? versions[0] ?? null,
    [selectedVersion, versions],
  );

  const approvedBaselineVersion = useMemo(
    () => findApprovedRemediationPatternVersion(versions, selectedPattern?.currentApprovedVersion),
    [selectedPattern?.currentApprovedVersion, versions],
  );

  const activeVersionViewKey =
    activeVersion !== null && selectedPatternId !== null
      ? `${selectedPatternId}:${activeVersion.version}`
      : null;

  const hasViewedActiveVersionContent =
    activeVersionViewKey !== null && viewedVersionKeys.has(activeVersionViewKey);

  const markActiveVersionContentViewed = useCallback(() => {
    if (activeVersionViewKey === null) {
      return;
    }

    setViewedVersionKeys((current) => {
      if (current.has(activeVersionViewKey)) {
        return current;
      }

      const next = new Set(current);
      next.add(activeVersionViewKey);

      return next;
    });
  }, [activeVersionViewKey]);

  const yamlValidation = useMemo(() => validateRemediationPatternYamlDraft(yamlDraft), [yamlDraft]);
  const importReady = yamlValidation.ok && canMutate && !importPending;

  const submitBlockedReason = remediationPatternSubmitBlockedReason(activeVersion, canMutate);
  const canSubmit =
    activeVersion !== null && canSubmitRemediationPatternVersion(activeVersion, canMutate) && !submitPending;

  const approvalBlockedReason = activeVersion
    ? remediationPatternApprovalBlockedReason(
        activeVersion,
        currentPrincipal,
        canMutate,
        hasViewedActiveVersionContent,
      )
    : "Select a version under review to approve.";

  const canApprove =
    activeVersion !== null &&
    canApproveRemediationPatternVersion(activeVersion, currentPrincipal, canMutate) &&
    hasViewedActiveVersionContent &&
    !approvePending;

  const submitBlockedReasonId = "remediation-pattern-submit-blocked-reason";
  const approvalBlockedReasonId = "remediation-pattern-approval-blocked-reason";
  const importBlockedReasonId = "remediation-pattern-import-blocked-reason";

  const refreshAll = useCallback(() => {
    void listQuery.refetch();

    if (selectedPatternId) {
      void detailQuery.refetch();
    }
  }, [detailQuery, listQuery, selectedPatternId]);

  const selectPattern = useCallback(
    (patternId: string) => {
      if (patternId === selectedPatternId) {
        return;
      }

      setSelectedPatternId(patternId);
      setSelectedVersion(null);
      syncSelectionUrl({ patternId, version: null });
    },
    [selectedPatternId, syncSelectionUrl],
  );

  const selectVersion = useCallback(
    (version: string) => {
      setSelectedVersion(version);

      if (selectedPatternId) {
        syncSelectionUrl({ patternId: selectedPatternId, version });
      }
    },
    [selectedPatternId, syncSelectionUrl],
  );

  const navigateRegistryRow = useCallback(
    (delta: number) => {
      if (filteredPatterns.length === 0) {
        return;
      }

      const currentIndex = filteredPatterns.findIndex((pattern) => pattern.patternId === selectedPatternId);
      const startIndex = currentIndex >= 0 ? currentIndex : 0;
      let nextIndex = startIndex + delta;

      if (nextIndex < 0) {
        nextIndex = filteredPatterns.length - 1;
      } else if (nextIndex >= filteredPatterns.length) {
        nextIndex = 0;
      }

      const nextPattern = filteredPatterns[nextIndex];

      if (nextPattern !== undefined) {
        selectPattern(nextPattern.patternId);
        registryTableNavRef.current?.focus();
      }
    },
    [filteredPatterns, selectPattern, selectedPatternId],
  );

  const handleImportYaml = useCallback(async () => {
    setImportError(null);
    setImportSuccess(null);

    if (!yamlValidation.ok) {
      setImportError(yamlValidation.message);
      return;
    }

    if (importPending) {
      return;
    }

    setImportPending(true);

    try {
      const result = await importRemediationPatternYaml(yamlDraft);

      if (!result.succeeded) {
        setImportError(result.errorMessage ?? "YAML import failed.");
        return;
      }

      setImportSuccess(
        `Imported as Draft${result.patternId ? ` (${result.patternId})` : ""}${result.version ? ` v${result.version}` : ""}.`,
      );
      setYamlDraft("");
      await listQuery.refetch();

      if (result.patternId) {
        setSelectedPatternId(result.patternId);

        if (result.version) {
          setSelectedVersion(result.version);
          syncSelectionUrl({ patternId: result.patternId, version: result.version });
        } else {
          syncSelectionUrl({ patternId: result.patternId, version: null });
        }

        window.requestAnimationFrame(() => {
          detailSectionRef.current?.focus();
        });
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "YAML import failed.");
    } finally {
      setImportPending(false);
    }
  }, [importPending, listQuery, syncSelectionUrl, yamlDraft, yamlValidation]);

  const handleSubmit = useCallback(async () => {
    if (!selectedPatternId || !activeVersion || !canSubmit) {
      return;
    }

    if (submitPending) {
      return;
    }

    setActionError(null);
    setSubmitPending(true);

    try {
      const result = await submitRemediationPatternVersion(selectedPatternId, activeVersion.version);

      if (!result.succeeded) {
        setActionError(result.errorMessage ?? "Submit failed.");
        return;
      }

      await detailQuery.refetch();
      await listQuery.refetch();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Submit failed.");
    } finally {
      setSubmitPending(false);
    }
  }, [activeVersion, canSubmit, detailQuery, listQuery, selectedPatternId, submitPending]);

  const handleApproveConfirmed = useCallback(async () => {
    if (!selectedPatternId || !activeVersion || !canApprove) {
      return;
    }

    if (approvePending) {
      return;
    }

    setActionError(null);
    setApprovePending(true);

    try {
      const result = await approveRemediationPatternVersion(selectedPatternId, activeVersion.version);

      if (!result.succeeded) {
        setActionError(result.errorMessage ?? "Approval failed.");
        return;
      }

      setApproveDialogOpen(false);
      await detailQuery.refetch();
      await listQuery.refetch();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Approval failed.");
    } finally {
      setApprovePending(false);
    }
  }, [activeVersion, approvePending, canApprove, detailQuery, listQuery, selectedPatternId]);

  const handleYamlFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file === undefined) {
      return;
    }

    void file.text().then((text) => {
      setYamlDraft(text);
      setImportError(null);
      setImportSuccess(null);
      openImportPanel(true);
    });

    event.target.value = "";
  }, [openImportPanel]);

  useRemediationPatternsShortcuts({
    onImportYaml: () => {
      void handleImportYaml();
    },
    importEnabled: importPanelOpen && importReady,
    onApprove: () => {
      if (canApprove) {
        setApproveDialogOpen(true);
      }
    },
    approveEnabled: canApprove,
  });

  const registryStatusLabel = listQuery.isError
    ? "Pattern list unavailable"
    : listQuery.isLoading || (listQuery.isFetching && patterns.length === 0)
      ? "Loading pattern registry…"
      : `${filteredPatterns.length} pattern${filteredPatterns.length === 1 ? "" : "s"}`;

  const showRegistryEmpty =
    listQuery.isSuccess && !listQuery.isFetching && patterns.length === 0;

  const showFilteredRegistryEmpty =
    listQuery.isSuccess && patterns.length > 0 && filteredPatterns.length === 0;

  const listLoadRecovery = errorRecoveryContractForScenario("api-problem", {
    failureSummary: "Remediation pattern registry could not be loaded.",
    productLineId: productLine,
  });

  const detailLoadRecovery = errorRecoveryContractForScenario("api-problem", {
    failureSummary: "Version history could not be loaded for this pattern.",
    productLineId: productLine,
  });

  const registryKeyboardNav = useEnterpriseTableKeyboardNav({
    rowCount: filteredPatterns.length,
    onActivateRow: (index) => {
      const pattern = filteredPatterns[index];

      if (pattern !== undefined) {
        selectPattern(pattern.patternId);
      }
    },
  });

  const onRegistryTableKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (
        event.key === "j" ||
        event.key === "k" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowUp"
      ) {
        event.preventDefault();
        event.stopPropagation();
        const delta = event.key === "j" || event.key === "ArrowDown" ? 1 : -1;
        navigateRegistryRow(delta);

        return;
      }

      registryKeyboardNav.onTableKeyDown(event);
    },
    [navigateRegistryRow, registryKeyboardNav],
  );

  return (
    <div className="space-y-4 p-4" data-testid="remediation-patterns-page">
      <a
        href={`#${REMEDIATION_PATTERNS_PRIMARY_CONTENT_ID}`}
        className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
      >
        {REMEDIATION_PATTERNS_SKIP_LINK_LABEL}
      </a>

      <RemediationPatternsGuards yamlDraft={yamlDraft} />
      <OperatorPageHeader
        navHref={navHref}
        title={OPERATOR_NAV_LINK_LABELS.remediationPatterns}
        subtitle="Create, review, and approve governed remediation patterns."
        claimDiscipline={REMEDIATION_PATTERNS_CLAIM_DISCIPLINE}
        claimDisciplineTestId="remediation-patterns-claim-discipline"
        headingLevel="h1"
        titleTestId="remediation-patterns-page-title"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="default"
              data-testid="remediation-patterns-header-import-button"
              onClick={() => openImportPanel(true)}
            >
              Import YAML
            </Button>
            <PageContextualHelpButton triggerText={PAGE_HELP_SHORT_TRIGGER_TEXT} />
            <RefreshButton
              busy={refreshing}
              label="Refresh"
              data-testid="remediation-patterns-refresh-button"
              onClick={refreshAll}
            />
          </div>
        }
        metadata={
          <div className="flex flex-wrap items-center gap-3">
            <OperatorPageFreshnessMetadata
              testId="remediation-patterns-last-refreshed"
              lastRefreshedAt={lastRefreshedAt}
            >
              {freshnessLabel}
            </OperatorPageFreshnessMetadata>
            {staleCue !== null ? (
              <span data-testid="remediation-patterns-stale-cue">
                <StatusTag kind="needs-attention" label={staleCue} />
              </span>
            ) : null}
          </div>
        }
      />

      <main
        id={REMEDIATION_PATTERNS_PRIMARY_CONTENT_ID}
        className="scroll-mt-24 space-y-4"
        data-testid="remediation-patterns-primary-content"
      >
      <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)} data-testid="remediation-patterns-draft-rule-copy">
        {DRAFT_RULE_COPY}
      </p>

      <section className="space-y-3" aria-label="Pattern registry list">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Pattern registry</h2>
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-patterns-registry-status">
            {registryStatusLabel}
          </p>
        </div>

        {patterns.length > 0 ? (
          <div className="flex flex-wrap gap-2" data-testid="remediation-pattern-registry-filter-chips">
            {REGISTRY_FILTER_OPTIONS.map((option) => (
              <RegistryFilterChip
                key={option.id}
                filter={option.id}
                label={option.label}
                count={registryFilterCounts[option.id]}
                selected={registryFilter === option.id}
                href={remediationPatternRegistryFilterHrefFromSearch(searchString, option.id, pathname)}
              />
            ))}
          </div>
        ) : null}

        {listQuery.isError ? (
          <div className="space-y-2" data-testid="remediation-patterns-list-error">
            <OperatorSectionLoadFailure
              message="Pattern list unavailable."
              onRetry={refreshAll}
              retrying={listQuery.isFetching}
            />
            <OperatorErrorRecoveryContract presentation={listLoadRecovery} />
          </div>
        ) : listQuery.isLoading || (listQuery.isFetching && patterns.length === 0) ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-patterns-loading">
            Loading remediation patterns…
          </p>
        ) : showRegistryEmpty ? (
          <EnterpriseCompactEmptyState
            title="No remediation patterns yet"
            description={DRAFT_RULE_COPY}
            actions={[
              {
                label: "Import YAML",
                href: remediationPatternYamlImportHref(pathname),
                variant: "primary",
              },
            ]}
            footer={
              <Button
                type="button"
                variant="outline"
                data-testid="remediation-patterns-empty-import-button"
                onClick={() => openImportPanel(true)}
              >
                Open YAML import
              </Button>
            }
            testId="remediation-patterns-empty"
          />
        ) : showFilteredRegistryEmpty ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-patterns-filtered-empty">
            No patterns match this filter.{" "}
            <Link
              href={remediationPatternRegistryFilterHrefFromSearch(
                searchString,
                REMEDIATION_PATTERN_REGISTRY_FILTERS.all,
                pathname,
              )}
              className={OPERATOR_LINK.inline}
            >
              Show all patterns
            </Link>
          </p>
        ) : (
          <div
            ref={registryTableNavRef}
            tabIndex={filteredPatterns.length > 0 ? 0 : undefined}
            data-testid="remediation-pattern-registry-table-nav"
            onKeyDown={onRegistryTableKeyDown}
          >
            <EnterpriseTable ariaLabel="Remediation patterns">
              <EnterpriseTableHead>
                <EnterpriseTableRow>
                  <EnterpriseTableHeaderCell>Key</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Attention</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Approved version</EnterpriseTableHeaderCell>
                </EnterpriseTableRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {filteredPatterns.map((pattern: RemediationPatternRecord, index) => (
                  <EnterpriseTableRow
                    key={pattern.patternId}
                    data-testid={`remediation-pattern-row-${pattern.patternKey}`}
                    data-selectable-row-index={index}
                    selected={selectedPatternId === pattern.patternId}
                    className={cn(
                      SELECTABLE_ROW_CLASS,
                      selectedPatternId === pattern.patternId ? "bg-muted/40" : undefined,
                      registryKeyboardNav.isRowFocused(index) ? "ring-1 ring-inset ring-neutral-400" : undefined,
                    )}
                    tabIndex={-1}
                    aria-current={selectedPatternId === pattern.patternId ? "true" : undefined}
                    onClick={() => selectPattern(pattern.patternId)}
                    onKeyDown={(event) => activateSelectableRow(event, () => selectPattern(pattern.patternId))}
                  >
                    <EnterpriseTableCell>{pattern.patternKey}</EnterpriseTableCell>
                    <EnterpriseTableCell>{pattern.displayName}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <StatusTag
                        kind={remediationPatternRegistryNeedsAttention(pattern) ? "draft" : "ready"}
                        label={remediationPatternRegistryStatusLabel(pattern)}
                      />
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <StatusTag
                        kind={remediationPatternRegistryNeedsAttention(pattern) ? "needs-attention" : "ready"}
                        label={remediationPatternRegistryAttentionLabel(pattern)}
                      />
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>{pattern.currentApprovedVersion ?? "—"}</EnterpriseTableCell>
                  </EnterpriseTableRow>
                ))}
              </EnterpriseTableBody>
            </EnterpriseTable>
          </div>
        )}
      </section>

      {selectedPatternId ? (
        <section
          ref={detailSectionRef}
          tabIndex={-1}
          className="space-y-3"
          aria-label="Version history"
          data-testid="remediation-pattern-detail-section"
        >
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Version history</h2>
          {selectedPattern ? (
            <dl className="grid gap-2 sm:grid-cols-2" data-testid="remediation-pattern-selected-identity">
              <div>
                <dt className={OPERATOR_TYPOGRAPHY.helper}>Pattern key</dt>
                <dd className={OPERATOR_TYPOGRAPHY.body}>{selectedPattern.patternKey}</dd>
              </div>
              <div>
                <dt className={OPERATOR_TYPOGRAPHY.helper}>Display name</dt>
                <dd className={OPERATOR_TYPOGRAPHY.body}>{selectedPattern.displayName}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className={OPERATOR_TYPOGRAPHY.helper}>Pattern ID</dt>
                <dd className="flex flex-wrap items-center gap-2 break-all font-mono text-xs">
                  <span>{selectedPattern.patternId}</span>
                  <CopyIdButton value={selectedPattern.patternId} aria-label="Copy pattern ID" />
                </dd>
              </div>
            </dl>
          ) : null}
          {detailQuery.isError ? (
            <div className="space-y-2" data-testid="remediation-patterns-detail-error">
              <OperatorSectionLoadFailure
                message="Version history unavailable."
                onRetry={() => void detailQuery.refetch()}
                retrying={detailQuery.isFetching}
              />
              <OperatorErrorRecoveryContract presentation={detailLoadRecovery} />
            </div>
          ) : detailQuery.isLoading ? (
            <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-patterns-version-loading">
              Loading version history…
            </p>
          ) : versions.length === 0 ? (
            <p className={OPERATOR_TYPOGRAPHY.helper}>No versions found for this pattern.</p>
          ) : (
            <VersionHistoryTable
              versions={versions}
              selectedVersion={activeVersion?.version ?? null}
              onSelectVersion={selectVersion}
            />
          )}

          {activeVersion ? (
            <>
              <dl className="grid gap-2 sm:grid-cols-2" data-testid="remediation-pattern-version-review-fields">
                <div className="sm:col-span-2">
                  <dt className={OPERATOR_TYPOGRAPHY.helper}>Control objective</dt>
                  <dd className={OPERATOR_TYPOGRAPHY.body}>{activeVersion.controlObjective || "—"}</dd>
                </div>
                <div>
                  <dt className={OPERATOR_TYPOGRAPHY.helper}>Automation level</dt>
                  <dd className={OPERATOR_TYPOGRAPHY.body}>
                    {formatRemediationPatternAutomationLevel(activeVersion.automationLevel)}
                  </dd>
                </div>
                <div>
                  <dt className={OPERATOR_TYPOGRAPHY.helper}>Version status</dt>
                  <dd>
                    <StatusTag
                      kind={remediationPatternStatusKind(activeVersion.status)}
                      label={remediationPatternStatusLabel(activeVersion.status)}
                    />
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className={OPERATOR_TYPOGRAPHY.helper}>Version ID</dt>
                  <dd className="flex flex-wrap items-center gap-2 break-all font-mono text-xs">
                    <span>{activeVersion.versionId}</span>
                    <CopyIdButton value={activeVersion.versionId} aria-label="Copy version ID" />
                  </dd>
                </div>
                <div className="sm:col-span-2" data-testid="remediation-pattern-submitter-provenance">
                  <dt className={OPERATOR_TYPOGRAPHY.helper}>Submitted by</dt>
                  <dd className={OPERATOR_TYPOGRAPHY.body}>
                    {activeVersion.authorActorKey || "—"}
                    <span className="text-al-text-secondary">
                      {" "}
                      (author actor — dedicated submitter field not returned by API)
                    </span>
                  </dd>
                </div>
                {activeVersion.approvedByActorKey || activeVersion.approvedUtc ? (
                  <div className="sm:col-span-2" data-testid="remediation-pattern-approval-provenance">
                    <dt className={OPERATOR_TYPOGRAPHY.helper}>Approved by</dt>
                    <dd className={OPERATOR_TYPOGRAPHY.body}>
                      {activeVersion.approvedByActorKey ?? "—"}
                      {activeVersion.approvedUtc
                        ? ` · ${formatInstantForLocale(activeVersion.approvedUtc)}`
                        : null}
                      {" · "}
                      <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.inline}>
                        View audit trail
                      </Link>
                    </dd>
                  </div>
                ) : (
                  <div className="sm:col-span-2">
                    <Link href={GOVERNANCE_AUDIT_PATH} className={OPERATOR_LINK.inline}>
                      View audit trail
                    </Link>
                  </div>
                )}
                {selectedPattern ? (
                  <div className="sm:col-span-2" data-testid="remediation-pattern-instances-link">
                    <dt className={OPERATOR_TYPOGRAPHY.helper}>Remediation instances</dt>
                    <dd className={OPERATOR_TYPOGRAPHY.body}>
                      <Link
                        href={remediationInstancesForPatternHref(
                          productLine,
                          selectedPattern.patternKey,
                          activeVersion.version,
                        )}
                        className={OPERATOR_LINK.inline}
                      >
                        Open instances for {selectedPattern.patternKey} v{activeVersion.version}
                      </Link>
                      <span className="text-al-text-secondary">
                        {" "}
                        (workbench filters by pattern key when supported)
                      </span>
                    </dd>
                  </div>
                ) : null}
              </dl>

              <PatternContentReviewPanel
                activeVersion={activeVersion}
                approvedVersion={approvedBaselineVersion}
                onContentViewed={markActiveVersionContentViewed}
              />

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!canSubmit}
                  aria-describedby={submitBlockedReason ? submitBlockedReasonId : undefined}
                  data-testid="remediation-pattern-submit-button"
                  onClick={() => void handleSubmit()}
                >
                  {submitPending ? "Submitting…" : "Submit for review"}
                </Button>
                <Button
                  type="button"
                  variant="default"
                  disabled={!canApprove}
                  aria-describedby={approvalBlockedReason ? approvalBlockedReasonId : undefined}
                  data-testid="remediation-pattern-approve-button"
                  onClick={() => setApproveDialogOpen(true)}
                >
                  {approvePending ? "Approving…" : "Approve version"}
                </Button>
              </div>
              <WhyDisabledCtaHint
                id={submitBlockedReasonId}
                reason={
                  submitBlockedReason && activeVersion.status === REMEDIATION_PATTERN_STATUS.draft
                    ? { kind: "policy", message: submitBlockedReason }
                    : null
                }
                testId="remediation-pattern-submit-blocked-reason"
              />
              <WhyDisabledCtaHint
                id={approvalBlockedReasonId}
                reason={
                  approvalBlockedReason && activeVersion.status === REMEDIATION_PATTERN_STATUS.underReview
                    ? { kind: "policy", message: approvalBlockedReason }
                    : null
                }
                testId="remediation-pattern-approval-blocked-reason"
              />
              {actionError ? (
                <OperatorMutationInlineError
                  message={actionError}
                  testId="remediation-pattern-action-error"
                  recoveryScenario="governance-mutation"
                />
              ) : null}
            </>
          ) : null}
        </section>
      ) : null}

      {importPanelOpen ? (
        <section
          id={REMEDIATION_PATTERN_YAML_IMPORT_SECTION_ID}
          className="space-y-3 rounded border border-border bg-card p-4"
          aria-label="YAML import"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>YAML import</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="remediation-pattern-import-panel-close"
              onClick={() => setImportPanelOpen(false)}
            >
              Close
            </Button>
          </div>
          <div className="space-y-2">
            <Label htmlFor="remediation-pattern-yaml-input">Remediation pattern YAML</Label>
            <textarea
              ref={yamlInputRef}
              id="remediation-pattern-yaml-input"
              className="min-h-32 w-full rounded border border-border bg-background p-3 font-mono text-xs"
              value={yamlDraft}
              spellCheck={false}
              onChange={(event) => {
                setYamlDraft(event.target.value);
                setImportError(null);
                setImportSuccess(null);
              }}
              placeholder="Paste remediation pattern YAML…"
              data-testid="remediation-pattern-yaml-input"
              aria-describedby="remediation-pattern-yaml-import-hint"
              aria-invalid={!yamlValidation.ok && yamlDraft.trim().length > 0 ? true : undefined}
            />
            <input
              ref={yamlFileInputRef}
              type="file"
              accept=".yaml,.yml,text/yaml,text/plain"
              className="sr-only"
              data-testid="remediation-pattern-yaml-file-input"
              onChange={handleYamlFileChange}
            />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="remediation-pattern-yaml-load-file-button"
                onClick={() => yamlFileInputRef.current?.click()}
              >
                Load file
              </Button>
            </div>
            <p id="remediation-pattern-yaml-import-hint" className={OPERATOR_TYPOGRAPHY.helper}>
              {DRAFT_RULE_COPY} Use Ctrl+Enter to import.
            </p>
            {!yamlValidation.ok && yamlDraft.trim().length > 0 ? (
              <p className={OPERATOR_TYPOGRAPHY.helper} role="alert" data-testid="remediation-pattern-yaml-parse-error">
                {yamlValidation.message}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="default"
            disabled={!importReady}
            aria-describedby={!importReady ? importBlockedReasonId : undefined}
            data-testid="remediation-pattern-import-button"
            onClick={() => void handleImportYaml()}
          >
            {importPending ? "Importing…" : "Import YAML as Draft"}
          </Button>
          <WhyDisabledCtaHint
            id={importBlockedReasonId}
            reason={
              !importReady
                ? !canMutate
                  ? { kind: "role", message: "Execute authority is required to import YAML." }
                  : !yamlValidation.ok
                    ? { kind: "incomplete-input", message: yamlValidation.message }
                    : null
                : null
            }
            testId="remediation-pattern-import-readiness"
          />
          {importError ? (
            <OperatorMutationInlineError
              message={importError}
              testId="remediation-pattern-import-error"
              recoveryScenario="governance-mutation"
            />
          ) : null}
          {importSuccess ? (
            <p className={OPERATOR_TYPOGRAPHY.body} role="status" data-testid="remediation-pattern-import-success">
              {importSuccess}
            </p>
          ) : null}
        </section>
      ) : null}
      </main>

      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent data-testid="remediation-pattern-approve-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve pattern version?</AlertDialogTitle>
            <AlertDialogDescription>
              {activeVersion
                ? `Approve v${activeVersion.version} for ${selectedPattern?.patternKey ?? "this pattern"}? Production remediation instances may use this version only after approval. You cannot approve your own submission (segregation of duties).`
                : "Select a version under review before approving."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approvePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!canApprove || approvePending}
              onClick={(event) => {
                event.preventDefault();
                void handleApproveConfirmed();
              }}
            >
              {approvePending ? "Approving…" : "Approve version"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
