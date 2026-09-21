"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OperatorPageFreshnessMetadata } from "@/components/operator/OperatorPageFreshnessMetadata";
import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
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
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useOperatorRelativeFreshnessNowMs } from "@/hooks/use-operator-relative-freshness-now-ms";
import {
  useRemediationPatternDetailQuery,
  useRemediationPatternsQuery,
} from "@/hooks/use-remediation-patterns-query";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens-shell-typography";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { operatorFreshnessMetadataWithClockLabel } from "@/lib/operator/operator-last-refreshed-label";
import { remediationPatternsPathForProductLine } from "@/lib/product-line/securenow-remediation-patterns-route";
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

const SELECTABLE_ROW_CLASS =
  "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400";

function activateSelectableRow(event: KeyboardEvent, onActivate: () => void): void {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    onActivate();
  }
}

function VersionHistoryTable(props: {
  readonly versions: ReadonlyArray<RemediationPatternVersionRecord>;
  readonly selectedVersion: string | null;
  readonly onSelectVersion: (version: string) => void;
}) {
  return (
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
        {props.versions.map((version) => (
          <EnterpriseTableRow
            key={version.versionId}
            data-testid={`remediation-pattern-version-${version.version}`}
            selected={props.selectedVersion === version.version}
            className={cn(SELECTABLE_ROW_CLASS, props.selectedVersion === version.version ? "bg-muted/40" : undefined)}
            role="button"
            tabIndex={0}
            aria-selected={props.selectedVersion === version.version}
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

  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(urlPatternId);
  const detailQuery = useRemediationPatternDetailQuery(selectedPatternId);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(urlVersion);
  const [yamlDraft, setYamlDraft] = useState("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const canMutate = useOperateCapability();
  const { currentPrincipal } = useOperatorNavAuthority();

  const patterns = listQuery.data ?? [];
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

  useEffect(() => {
    setSelectedPatternId(urlPatternId);
  }, [urlPatternId]);

  useEffect(() => {
    setSelectedVersion(urlVersion);
  }, [urlVersion]);

  const activeVersion = useMemo(
    () => versions.find((version) => version.version === selectedVersion) ?? versions[0] ?? null,
    [selectedVersion, versions],
  );

  const submitBlockedReason = remediationPatternSubmitBlockedReason(activeVersion, canMutate);
  const canSubmit = activeVersion ? canSubmitRemediationPatternVersion(activeVersion, canMutate) : false;

  const approvalBlockedReason = activeVersion
    ? remediationPatternApprovalBlockedReason(activeVersion, currentPrincipal, canMutate)
    : "Select a version under review to approve.";

  const canApprove = activeVersion
    ? canApproveRemediationPatternVersion(activeVersion, currentPrincipal, canMutate)
    : false;

  const refreshAll = useCallback(() => {
    void listQuery.refetch();
    if (selectedPatternId) {
      void detailQuery.refetch();
    }
  }, [detailQuery, listQuery, selectedPatternId]);

  function selectPattern(patternId: string) {
    setSelectedPatternId(patternId);
    setSelectedVersion(null);
    syncSelectionUrl({ patternId, version: null });
  }

  function selectVersion(version: string) {
    setSelectedVersion(version);
    if (selectedPatternId) {
      syncSelectionUrl({ patternId: selectedPatternId, version });
    }
  }

  async function handleImportYaml() {
    setImportError(null);
    setImportSuccess(null);

    if (!yamlDraft.trim()) {
      setImportError("YAML content is required.");
      return;
    }

    try {
      const result = await importRemediationPatternYaml(yamlDraft);

      if (!result.succeeded) {
        setImportError(result.errorMessage ?? "YAML import failed.");
        return;
      }

      setImportSuccess(
        `Imported as Draft${result.patternId ? ` (${result.patternId})` : ""}${result.version ? ` v${result.version}` : ""}. Draft versions cannot be used for production remediation instances.`,
      );
      setYamlDraft("");
      await listQuery.refetch();
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "YAML import failed.");
    }
  }

  async function handleSubmit() {
    if (!selectedPatternId || !activeVersion || !canSubmit)
      return;

    setActionError(null);

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
    }
  }

  async function handleApproveConfirmed() {
    if (!selectedPatternId || !activeVersion || !canApprove)
      return;

    setActionError(null);

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
    }
  }

  const registryStatusLabel = listQuery.isError
    ? "Pattern list unavailable"
    : listQuery.isLoading
      ? "Loading pattern registry…"
      : `${patterns.length} pattern${patterns.length === 1 ? "" : "s"}`;

  return (
    <div className="space-y-6 p-4" data-testid="remediation-patterns-page">
      <RemediationPatternsGuards yamlDraft={yamlDraft} />
      <OperatorPageHeader
        navHref={navHref}
        title={OPERATOR_NAV_LINK_LABELS.remediationPatterns}
        subtitle="Create, review, and approve governed remediation patterns. YAML import always lands as Draft and is not eligible for production instances until approved by a different actor."
        headingLevel="h1"
        titleTestId="remediation-patterns-page-title"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <PageContextualHelpButton />
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

      <section className="space-y-3" aria-label="Pattern registry list">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Pattern registry</h2>
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-patterns-registry-status">
            {registryStatusLabel}
          </p>
        </div>
        {listQuery.isError ? (
          <div role="alert">
            <StatusTag kind="needs-attention" label="Pattern list unavailable" data-testid="remediation-patterns-list-error" />
          </div>
        ) : listQuery.isLoading ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-patterns-loading">
            Loading remediation patterns…
          </p>
        ) : patterns.length === 0 ? (
          <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-patterns-empty">
            No remediation patterns yet.{" "}
            <Link
              href={remediationPatternYamlImportHref(pathname)}
              className="text-al-link underline-offset-2 hover:underline"
            >
              Import YAML
            </Link>{" "}
            to create a Draft version.
          </p>
        ) : (
          <EnterpriseTable ariaLabel="Remediation patterns">
            <EnterpriseTableHead>
              <EnterpriseTableRow>
                <EnterpriseTableHeaderCell>Key</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Name</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Approved version</EnterpriseTableHeaderCell>
              </EnterpriseTableRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {patterns.map((pattern: RemediationPatternRecord) => (
                <EnterpriseTableRow
                  key={pattern.patternId}
                  data-testid={`remediation-pattern-row-${pattern.patternKey}`}
                  selected={selectedPatternId === pattern.patternId}
                  className={cn(
                    SELECTABLE_ROW_CLASS,
                    selectedPatternId === pattern.patternId ? "bg-muted/40" : undefined,
                  )}
                  role="button"
                  tabIndex={0}
                  aria-selected={selectedPatternId === pattern.patternId}
                  onClick={() => selectPattern(pattern.patternId)}
                  onKeyDown={(event) => activateSelectableRow(event, () => selectPattern(pattern.patternId))}
                >
                  <EnterpriseTableCell>{pattern.patternKey}</EnterpriseTableCell>
                  <EnterpriseTableCell>{pattern.displayName}</EnterpriseTableCell>
                  <EnterpriseTableCell>{pattern.currentApprovedVersion ?? "—"}</EnterpriseTableCell>
                </EnterpriseTableRow>
              ))}
            </EnterpriseTableBody>
          </EnterpriseTable>
        )}
      </section>

      {selectedPatternId ? (
        <section className="space-y-3" aria-label="Version history">
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
                <dd className="break-all font-mono text-xs">{selectedPattern.patternId}</dd>
              </div>
            </dl>
          ) : null}
          {detailQuery.isError ? (
            <div role="alert">
              <StatusTag kind="needs-attention" label="Version history unavailable" />
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
              {activeVersion.approvedByActorKey || activeVersion.approvedUtc ? (
                <div className="sm:col-span-2" data-testid="remediation-pattern-approval-provenance">
                  <dt className={OPERATOR_TYPOGRAPHY.helper}>Approved by</dt>
                  <dd className={OPERATOR_TYPOGRAPHY.body}>
                    {activeVersion.approvedByActorKey ?? "—"}
                    {activeVersion.approvedUtc
                      ? ` · ${formatInstantForLocale(activeVersion.approvedUtc)}`
                      : null}
                  </dd>
                </div>
              ) : null}
            </dl>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={!canSubmit}
              title={submitBlockedReason ?? undefined}
              data-testid="remediation-pattern-submit-button"
              onClick={() => void handleSubmit()}
            >
              Submit for review
            </Button>
            <Button
              type="button"
              variant="default"
              disabled={!canApprove}
              title={approvalBlockedReason ?? undefined}
              data-testid="remediation-pattern-approve-button"
              onClick={() => setApproveDialogOpen(true)}
            >
              Approve version
            </Button>
          </div>
          {submitBlockedReason && activeVersion?.status === REMEDIATION_PATTERN_STATUS.draft ? (
            <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-pattern-submit-blocked-reason">
              {submitBlockedReason}
            </p>
          ) : null}
          {approvalBlockedReason && activeVersion?.status === REMEDIATION_PATTERN_STATUS.underReview ? (
            <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="remediation-pattern-approval-blocked-reason">
              {approvalBlockedReason}
            </p>
          ) : null}
          {actionError ? (
            <div role="alert">
              <StatusTag kind="needs-attention" label={actionError} data-testid="remediation-pattern-action-error" />
            </div>
          ) : null}
        </section>
      ) : null}

      <section
        id={REMEDIATION_PATTERN_YAML_IMPORT_SECTION_ID}
        className="space-y-3 rounded border border-dashed border-border p-4"
        aria-label="YAML import"
      >
        <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>YAML import</h2>
        <p className={OPERATOR_TYPOGRAPHY.helper}>
          Imports create Draft versions only. They are not usable for production remediation instances until reviewed and approved.
        </p>
        <div className="space-y-2">
          <Label htmlFor="remediation-pattern-yaml-input">Remediation pattern YAML</Label>
          <textarea
            id="remediation-pattern-yaml-input"
            className="min-h-32 w-full rounded border border-border bg-background p-3 font-mono text-xs"
            value={yamlDraft}
            onChange={(event) => setYamlDraft(event.target.value)}
            placeholder="Paste remediation pattern YAML…"
            data-testid="remediation-pattern-yaml-input"
            aria-describedby="remediation-pattern-yaml-import-hint"
          />
          <p id="remediation-pattern-yaml-import-hint" className={OPERATOR_TYPOGRAPHY.helper}>
            Imported content always lands as Draft — submit and approve before production remediation instances can use it.
          </p>
        </div>
        <Button
          type="button"
          variant="default"
          disabled={!canMutate}
          title={!canMutate ? "Execute authority is required to import YAML." : undefined}
          data-testid="remediation-pattern-import-button"
          onClick={() => void handleImportYaml()}
        >
          Import YAML as Draft
        </Button>
        {importError ? (
          <div role="alert">
            <StatusTag kind="needs-attention" label={importError} data-testid="remediation-pattern-import-error" />
          </div>
        ) : null}
        {importSuccess ? (
          <div role="status">
            <StatusTag kind="ready" label={importSuccess} data-testid="remediation-pattern-import-success" />
          </div>
        ) : null}
      </section>

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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={!canApprove}
              onClick={(event) => {
                event.preventDefault();
                void handleApproveConfirmed();
              }}
            >
              Approve version
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
