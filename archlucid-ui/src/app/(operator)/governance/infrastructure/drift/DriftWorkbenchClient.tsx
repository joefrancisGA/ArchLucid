"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

import { LayerHeader } from "@/components/LayerHeader";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
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
import { buildInfraEvidenceAuditControlOptions, buildInfraEvidenceAuditControlScopePatch } from "@/lib/infra-evidence/infra-evidence-audit-control-options";
import type { CloudResourceAuditLineageMatch } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { buildInfrastructureAskHref, resourceHubFilterHrefFromSearch } from "@/lib/infra-evidence/infra-evidence-hub-filter-url";
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
  GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_DIFF_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_LOAD_ERROR_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SCOPE_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";
import { GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
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

export function DriftWorkbenchClient() {
  const buyerPolishedShell = useProductionEvalChrome();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSnapshotId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(DRIFT_WORKBENCH_SNAPSHOT_ID_PARAM));
  const urlCloudResourceId = parseInfraEvidenceWorkbenchQueryValue(
    searchParams.get(DRIFT_WORKBENCH_CLOUD_RESOURCE_ID_PARAM),
  );
  const urlChangeId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(DRIFT_WORKBENCH_CHANGE_ID_PARAM));
  const urlDiffId = parseInfraEvidenceWorkbenchQueryValue(searchParams.get(DRIFT_WORKBENCH_DIFF_ID_PARAM));

  const [snapshots, setSnapshots] = useState<InfraEvidenceSnapshotSummary[]>([]);
  const [diffs, setDiffs] = useState<InfraEvidenceDiffSummary[]>([]);
  const [changes, setChanges] = useState<InfraEvidenceDiffChange[]>([]);
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string>("");
  const [selectedDiffId, setSelectedDiffId] = useState<string>("");
  const [selectedChangeId, setSelectedChangeId] = useState<string | null>(null);
  const [loadingSnapshots, setLoadingSnapshots] = useState(true);
  const [loadingDiffs, setLoadingDiffs] = useState(false);
  const [loadingChanges, setLoadingChanges] = useState(false);
  const [exportBusy, setExportBusy] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const visibleChanges = changes;

  const selectedChange = useMemo(
    () => visibleChanges.find((row) => row.changeId === selectedChangeId) ?? null,
    [selectedChangeId, visibleChanges],
  );

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
  const onAuditControlChange = useCallback((match: CloudResourceAuditLineageMatch) => {
    router.replace(
      driftWorkbenchHrefFromSearch(searchParams, buildInfraEvidenceAuditControlScopePatch(match)),
      { scroll: false },
    );
  }, [router, searchParams]);

  const syncDriftUrl = useCallback(
    (patch: {
      readonly snapshotId?: string | null;
      readonly diffId?: string | null;
      readonly changeId?: string | null;
    }) => {
      router.replace(driftWorkbenchHrefFromSearch(searchParams, patch), { scroll: false });
    },
    [router, searchParams],
  );

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
        const response = await fetchInfraEvidenceSnapshots(1, 50);
        const items = response.items ?? [];

        if (!cancelled) {
          setSnapshots(items);

          if (items.length > 0) {
            const preferredSnapshotId =
              urlSnapshotId.length > 0 && items.some((item) => item.snapshotId === urlSnapshotId)
                ? urlSnapshotId
                : items[0].snapshotId;

            setSelectedSnapshotId((current) => (current.length > 0 ? current : preferredSnapshotId));
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
  }, [urlSnapshotId]);

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
      setSelectedChangeId(null);
      return;
    }

    let cancelled = false;

    async function loadChanges() {
      setLoadingChanges(true);
      setLoadError(null);

      try {
        const response = await fetchInfraEvidenceDiffChanges(selectedDiffId, 1, 100, {
          cloudResourceId: urlCloudResourceId.length > 0 ? urlCloudResourceId : null,
        });

        if (!cancelled) {
          setChanges(response.items ?? []);

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
  }, [selectedDiffId, urlChangeId, urlCloudResourceId]);

  const runExport = useCallback(async () => {
    if (selectedSnapshotId.length === 0) {
      return;
    }

    setExportBusy(true);

    try {
      await downloadInfraEvidenceTerraformAdvisoryZip(selectedSnapshotId);
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

    const propertyLabel = selectedChange.property ?? selectedChange.changeType;

    return `Showing drift change ${propertyLabel}.`;
  }, [selectedChange]);

  return (
    <OperatorPageContainer
      variant="full"
      className="py-4"
      data-testid="infra-drift-workbench"
    >
      {buyerPolishedShell ? (
        <a
          href={`#${GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID}`}
          className={HELP_PAGE_LAYOUT.technicalReferenceSkipLink}
        >
          {GOVERNANCE_INFRASTRUCTURE_DRIFT_SKIP_LINK_LABEL}
        </a>
      ) : null}

      <OperatorPageHeader
        navHref={GOVERNANCE_INFRASTRUCTURE_DRIFT_PATH}
        title={GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_TITLE}
        subtitle={GOVERNANCE_INFRASTRUCTURE_DRIFT_PAGE_LEAD}
        claimDiscipline={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_DRIFT_CLAIM_DISCIPLINE : undefined}
        claimDisciplineTestId="infra-drift-claim-discipline"
        titleTestId="infra-drift-page-title"
        breadcrumb={buyerPolishedShell ? <DriftBreadcrumb /> : undefined}
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
        id={buyerPolishedShell ? GOVERNANCE_INFRASTRUCTURE_DRIFT_PRIMARY_CONTENT_ID : undefined}
        className={cn(
          "mx-auto flex w-full max-w-6xl flex-col gap-4",
          buyerPolishedShell ? "scroll-mt-24" : undefined,
        )}
        data-testid="infra-drift-primary-content"
      >
      {buyerPolishedShell ? (
        <div className="flex justify-end">
          <CopyScopedOperatorLinkButton testId="infra-drift-copy-scoped-link" />
        </div>
      ) : null}

      {!buyerPolishedShell ? (
        <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          Compare inventory snapshots, inspect semantic drift rows, and export advisory Terraform reconstructed from snapshot
          evidence. This is not original Terraform and must not be applied without human review.
        </p>
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
        buyerPolishedShell ? (
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
        ) : (
          <StatusTag kind="needs-attention" label={loadError} />
        )
      ) : null}

      <section className={cn("grid gap-4 md:grid-cols-2", cnCard)} aria-label="Snapshot and diff selection">
        {buyerPolishedShell ? (
          <>
            <div className="grid gap-2">
              <Label htmlFor="infra-drift-snapshot-picker">{GOVERNANCE_INFRASTRUCTURE_DRIFT_SNAPSHOT_LABEL}</Label>
              <select
                id="infra-drift-snapshot-picker"
                className={cnField}
                data-testid="infra-drift-snapshot-picker"
                disabled={loadingSnapshots || snapshots.length === 0}
                value={selectedSnapshotId}
                onChange={(event) => {
                  const nextSnapshotId = event.target.value;
                  setSelectedSnapshotId(nextSnapshotId);
                  syncDriftUrl({ snapshotId: nextSnapshotId, diffId: "", changeId: "" });
                }}
              >
                {snapshots.length === 0 ? <option value="">No snapshots in scope</option> : null}
                {snapshots.map((snapshot) => (
                  <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                    {formatSnapshotLabel(snapshot)}
                  </option>
                ))}
              </select>
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
                  syncDriftUrl({ diffId: nextDiffId, changeId: "" });
                }}
              >
                {diffs.length === 0 ? <option value="">No diffs for this snapshot</option> : null}
                {diffs.map((diff) => (
                  <option key={diff.diffId} value={diff.diffId}>
                    {formatDiffLabel(diff, selectedSnapshotId)}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <label className="flex flex-col gap-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>Current snapshot</span>
              <select
                className={cnField}
                data-testid="infra-drift-snapshot-picker"
                disabled={loadingSnapshots || snapshots.length === 0}
                value={selectedSnapshotId}
                onChange={(event) => {
                  const nextSnapshotId = event.target.value;
                  setSelectedSnapshotId(nextSnapshotId);
                  syncDriftUrl({ snapshotId: nextSnapshotId, diffId: "", changeId: "" });
                }}
              >
                {snapshots.length === 0 ? <option value="">No snapshots in scope</option> : null}
                {snapshots.map((snapshot) => (
                  <option key={snapshot.snapshotId} value={snapshot.snapshotId}>
                    {formatSnapshotLabel(snapshot)}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={OPERATOR_TYPOGRAPHY.helper}>Diff vs other snapshot</span>
              <select
                className={cnField}
                data-testid="infra-drift-diff-picker"
                disabled={loadingDiffs || diffs.length === 0}
                value={selectedDiffId}
                onChange={(event) => {
                  const nextDiffId = event.target.value;
                  setSelectedDiffId(nextDiffId);
                  syncDriftUrl({ diffId: nextDiffId, changeId: "" });
                }}
              >
                {diffs.length === 0 ? <option value="">No diffs for this snapshot</option> : null}
                {diffs.map((diff) => (
                  <option key={diff.diffId} value={diff.diffId}>
                    {formatDiffLabel(diff, selectedSnapshotId)}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
      </section>

      <section className={cn("flex flex-wrap items-center gap-3", cnCard)} aria-label="Drift export actions">
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid="infra-drift-export-terraform"
          disabled={exportBusy || selectedSnapshotId.length === 0}
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
        <p className={cn("m-0 max-w-2xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {TERRAFORM_ADVISORY_EXPORT_DISCLAIMER}
        </p>
      </section>

      <EnterpriseTable ariaLabel="Inventory drift changes">
        <EnterpriseTableHead>
          <EnterpriseTableRow>
            <EnterpriseTableHeaderCell>Resource</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Change</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Property</EnterpriseTableHeaderCell>
            <EnterpriseTableHeaderCell>Risk</EnterpriseTableHeaderCell>
          </EnterpriseTableRow>
        </EnterpriseTableHead>
        <EnterpriseTableBody>
          {loadingChanges ? (
            <EnterpriseTableRow>
              <EnterpriseTableCell colSpan={4}>Loading changes…</EnterpriseTableCell>
            </EnterpriseTableRow>
          ) : null}
          {!loadingChanges && visibleChanges.length === 0 ? (
            <EnterpriseTableRow>
              <EnterpriseTableCell colSpan={4}>
                {urlCloudResourceId.length > 0
                  ? "No drift rows match the scoped cloud resource for this diff."
                  : "Select a snapshot and diff to view property-level changes."}
              </EnterpriseTableCell>
            </EnterpriseTableRow>
          ) : null}
          {visibleChanges.map((row) => (
            <EnterpriseTableRow
              key={row.changeId}
              data-testid={`infra-drift-change-row-${row.changeId}`}
              className={cn(
                "cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                selectedChangeId === row.changeId ? "bg-neutral-100 dark:bg-neutral-900/40" : undefined,
              )}
              role="button"
              tabIndex={0}
              aria-selected={selectedChangeId === row.changeId}
              onClick={() => {
                setSelectedChangeId(row.changeId);
                syncDriftUrl({ changeId: row.changeId });
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedChangeId(row.changeId);
                  syncDriftUrl({ changeId: row.changeId });
                }
              }}
            >
              <EnterpriseTableCell className="max-w-xs truncate font-mono text-xs">
                {row.azureResourceId ?? "—"}
              </EnterpriseTableCell>
              <EnterpriseTableCell>{row.changeType}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.property ?? "—"}</EnterpriseTableCell>
              <EnterpriseTableCell>{row.riskClassification ?? "—"}</EnterpriseTableCell>
            </EnterpriseTableRow>
          ))}
        </EnterpriseTableBody>
      </EnterpriseTable>

      {selectedChange != null ? (
        <section
          className={cnCard}
          aria-label="Selected change details"
          data-testid="infra-drift-change-drawer"
        >
          <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>Change detail</h2>
          <dl className="grid gap-2 text-sm">
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
              <dd className="font-mono text-xs">{selectedChange.evidenceReference ?? "—"}</dd>
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

        {buyerPolishedShell ? <DriftClaimOrientationStrip /> : null}
      </main>
    </OperatorPageContainer>
  );
}
