"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";

import { useArchitectureDigestsBrowseQuery } from "@/hooks/use-architecture-digests-browse-query";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { DigestsBrowseHistorySkeleton } from "@/components/digests/DigestsBrowseHistorySkeleton";
import { DigestsBrowseIncludesPreview } from "@/components/digests/DigestsBrowseIncludesPreview";
import { DigestsBrowseSetupChecklist } from "@/components/digests/DigestsBrowseSetupChecklist";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeaderCell,
  EnterpriseTableHeadRow,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { StatusTag } from "@/components/ui/status-tag";
import {
  buildDigestSetupChecklistItems,
  digestSetupHasIncompleteActionableStep,
  formatDigestInstant,
  type DigestSetupChecklistItem,
} from "@/lib/digest-setup-gap-actions";
import {
  DIGEST_EXPORT_ACTION_LABEL,
  DIGEST_DELIVERY_DIAGNOSTIC_NOTE,
  buildDigestExportFile,
  digestDeliveryAttemptHasDiagnostic,
  digestDeliveryDiagnostics,
  resolveDigestDeliveryAttemptStatus,
  resolveDigestDeliveryStatus,
  type DigestExportFile,
} from "@/lib/digest-delivery-presentation";
import {
  DIGEST_COVERAGE_COLUMN_HEADER,
  resolveDigestPeriodCoverage,
  type DigestPeriodCoverage,
} from "@/lib/digest-period-coverage";
import {
  DIGESTS_BROWSE_EMPTY_DESCRIPTION,
  DIGESTS_BROWSE_EMPTY_TITLE,
  DIGESTS_BROWSE_INCLUDES_SECTION_TITLE,
  DIGESTS_BROWSE_LOADING_LABEL,
  DIGESTS_BROWSE_SETUP_UNKNOWN_DESCRIPTION,
  DIGESTS_BROWSE_SETUP_UNKNOWN_TITLE,
} from "@/lib/digests-browse-copy";
import { digestRowElementId, digestIdFromLocationHash } from "@/lib/digests-browse-deep-link";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  getArchitectureDigest,
  listDigestDeliveryAttempts,
  listDigestDeliveryAttemptsBatch,
} from "@/lib/api";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

const EMPTY_DIGESTS: ArchitectureDigest[] = [];

export type DigestsBrowseContentProps = {
  /** When incremented by the hub Refresh control, reloads the digest list. */
  readonly refreshToken?: number;
  /** Called after a list load attempt finishes (success or failure). */
  readonly onLoaded?: () => void;
  /** When true, omits the page title (hub already renders OperatorPageHeader). */
  readonly hidePageHeader?: boolean;
  /** Weekly health snapshot for setup checklist and browse guidance. */
  readonly healthSnap?: WeeklyDigestHealthDto | null;
};

function uniqueRecipients(attempts: readonly DigestDeliveryAttempt[]): string {
  const destinations: string[] = [
    ...new Set(
      attempts
        .map((a) => a.destination?.trim())
        .filter((d): d is string => d !== undefined && d.length > 0),
    ),
  ];

  if (destinations.length === 0) {
    return "—";
  }

  if (destinations.length <= 2) {
    return destinations.join(", ");
  }

  return `${destinations.slice(0, 2).join(", ")} +${destinations.length - 2}`;
}

/**
 * Saves the digest body to disk. The anchor is attached to the document and the
 * object URL is released on the next task so Firefox and Safari finish the
 * download before the blob is revoked.
 */
function downloadDigestExport(digest: ArchitectureDigest): void {
  const file: DigestExportFile = buildDigestExportFile(digest);
  const blob = new Blob([file.contents], { type: file.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Browse tab: architecture digest history and detail.
 */
export function DigestsBrowseContent(props: DigestsBrowseContentProps = {}): ReactElement {
  const { refreshToken = 0, onLoaded, hidePageHeader = false, healthSnap = null } = props;
  const digestsQuery = useArchitectureDigestsBrowseQuery(40);
  const digests = digestsQuery.data ?? EMPTY_DIGESTS;
  const [selected, setSelected] = useState<ArchitectureDigest | null>(null);
  const [deliveryAttempts, setDeliveryAttempts] = useState<DigestDeliveryAttempt[]>([]);
  const [rowAttempts, setRowAttempts] = useState<Record<string, DigestDeliveryAttempt[]>>({});
  const [detailFailure, setDetailFailure] = useState<ApiLoadFailureState | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);
  const detailPanelRef = useRef<HTMLElement | null>(null);
  const loading = digestsQuery.isLoading;
  const failure =
    detailFailure ??
    (digestsQuery.isError ? toApiLoadFailure(digestsQuery.error) : null);

  const selectDigest = useCallback(async (digestId: string): Promise<void> => {
    setDetailFailure(null);

    try {
      const full = await getArchitectureDigest(digestId);
      setSelected(full);
      const attempts = await listDigestDeliveryAttempts(digestId);
      setDeliveryAttempts(attempts);
      setRowAttempts((prev) => ({ ...prev, [digestId]: attempts }));
      setPreviewOpen(true);
    } catch (e) {
      setDetailFailure(toApiLoadFailure(e));
    }
  }, []);

  useEffect(() => {
    if (!digestsQuery.isFetched) {
      return;
    }

    onLoaded?.();
  }, [digestsQuery.isFetched, onLoaded]);

  useEffect(() => {
    if (refreshToken === 0) {
      return;
    }

    void digestsQuery.refetch();
  }, [refreshToken, digestsQuery.refetch]);

  useEffect(() => {
    setSelected(null);
    setDeliveryAttempts([]);
  }, [refreshToken]);

  useEffect(() => {
    if (digests.length === 0) {
      setRowAttempts({});

      return;
    }

    let cancelled = false;

    void (async () => {
      const nextAttempts: Record<string, DigestDeliveryAttempt[]> = {};

      try {
        const batch = await listDigestDeliveryAttemptsBatch(
          digests.map((digest) => digest.digestId),
        );

        for (const item of batch) {
          nextAttempts[item.digestId] = item.attempts ?? [];
        }
      } catch {
        for (const digest of digests) {
          nextAttempts[digest.digestId] = [];
        }
      }

      if (cancelled) {
        return;
      }

      setRowAttempts(nextAttempts);
    })();

    return () => {
      cancelled = true;
    };
  }, [digests, refreshToken]);

  /**
   * Honors `/digests?tab=browse#digest-{id}` from the hub Preview action and
   * schedule links (TB-1501). Re-runs on hashchange so repeat clicks re-select.
   */
  useEffect(() => {
    if (digests.length === 0) {
      return;
    }

    function selectFromHash(): void {
      const hashDigestId: string | null = digestIdFromLocationHash(window.location.hash);

      if (hashDigestId === null) {
        return;
      }

      const match: ArchitectureDigest | undefined = digests.find(
        (digest) => digest.digestId === hashDigestId,
      );

      if (match === undefined) {
        return;
      }

      void selectDigest(match.digestId).then(() => {
        detailPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    selectFromHash();
    window.addEventListener("hashchange", selectFromHash);

    return () => window.removeEventListener("hashchange", selectFromHash);
  }, [digests, selectDigest]);

  const setupChecklist: readonly DigestSetupChecklistItem[] | null =
    healthSnap !== null ? buildDigestSetupChecklistItems(healthSnap, digests.length > 0) : null;
  const setupIncomplete: boolean =
    setupChecklist !== null ? digestSetupHasIncompleteActionableStep(setupChecklist) : false;
  const showEmptyComposition: boolean = !loading && digests.length === 0 && failure === null;

  return (
    <div className="w-full max-w-[1400px]" data-testid="digests-browse-content">
      {!hidePageHeader ? (
        <>
          <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.pageTitle)}>
            Architecture digests
          </h2>
          <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
            Send scheduled summaries of review activity, governance signals, findings, and advisory scans.
          </p>
        </>
      ) : null}

      {failure !== null ? (
        <div className="mt-4" role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {loading && failure === null ? (
        <>
          <span className="sr-only">{DIGESTS_BROWSE_LOADING_LABEL}</span>
          <DigestsBrowseHistorySkeleton />
        </>
      ) : null}

      {showEmptyComposition ? (
        <div className="mt-4 space-y-3" data-testid="digests-browse-empty-state">
          {setupChecklist !== null ? (
            <DigestsBrowseSetupChecklist items={setupChecklist} />
          ) : (
            <EnterpriseCompactEmptyState
              testId="digests-empty-state"
              title={DIGESTS_BROWSE_SETUP_UNKNOWN_TITLE}
              description={DIGESTS_BROWSE_SETUP_UNKNOWN_DESCRIPTION}
            />
          )}
          <CollapsibleSection
            title={DIGESTS_BROWSE_INCLUDES_SECTION_TITLE}
            defaultOpen={false}
            sectionTestId="digests-browse-includes-disclosure"
          >
            <DigestsBrowseIncludesPreview />
          </CollapsibleSection>
        </div>
      ) : null}

      {setupChecklist !== null && setupIncomplete && digests.length > 0 ? (
        <div className="mt-4">
          <DigestsBrowseSetupChecklist items={setupChecklist} />
        </div>
      ) : null}

      {digests.length > 0 ? (
        <div
          className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]"
          data-testid="digests-browse-master-detail"
          data-operator-side-rail-kind="master-detail"
        >
          <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
            <h3 className={cn("m-0 mb-3 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Digest history
            </h3>
            <EnterpriseTable ariaLabel="Architecture digest history">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Digest</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>{DIGEST_COVERAGE_COLUMN_HEADER}</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Generated</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Recipients</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {digests.map((digest) => {
                  const attempts = rowAttempts[digest.digestId] ?? [];
                  const status = resolveDigestDeliveryStatus(attempts);
                  const coverage: DigestPeriodCoverage = resolveDigestPeriodCoverage(digest);
                  const selectedRow = selected?.digestId === digest.digestId;

                  return (
                    <EnterpriseTableRow
                      key={digest.digestId}
                      id={digestRowElementId(digest.digestId)}
                      selected={selectedRow}
                    >
                      <EnterpriseTableCell>
                        <button
                          type="button"
                          className={cn(
                            "cursor-pointer text-left text-al-link underline-offset-2 hover:underline",
                            OPERATOR_TYPOGRAPHY.body,
                          )}
                          onClick={() => void selectDigest(digest.digestId)}
                        >
                          {digest.title}
                        </button>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <span className={cn("block", OPERATOR_TYPOGRAPHY.helper)}>{coverage.label}</span>
                        {coverage.detail !== null ? (
                          <span
                            className={cn("block text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                          >
                            {coverage.detail}
                          </span>
                        ) : null}
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <span className={OPERATOR_TYPOGRAPHY.helper}>{formatDigestInstant(digest.generatedUtc)}</span>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <span className={OPERATOR_TYPOGRAPHY.helper}>{uniqueRecipients(attempts)}</span>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <StatusTag kind={status.kind} label={status.label} />
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => void selectDigest(digest.digestId)}
                        >
                          Open
                        </Button>
                      </EnterpriseTableCell>
                    </EnterpriseTableRow>
                  );
                })}
              </EnterpriseTableBody>
            </EnterpriseTable>
          </section>

          <section
            className="min-w-0 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
            data-testid="digests-detail-panel"
            ref={detailPanelRef}
          >
            {!selected ? (
              <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                Select a digest to view summary, recipients, delivery status, and preview.
              </p>
            ) : (
              <div className="space-y-4">
                <div>
                  <h3 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.cardTitle)}>
                    {selected.title}
                  </h3>
                  <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    Generated {formatDigestInstant(selected.generatedUtc)}
                  </p>
                </div>

                <div>
                  <h4 className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Summary</h4>
                  <p className={cn("m-0 mt-1 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>
                    {selected.summary?.trim() ? selected.summary : "No summary available."}
                  </p>
                </div>

                <div>
                  <h4 className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    {DIGEST_COVERAGE_COLUMN_HEADER}
                  </h4>
                  <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    {resolveDigestPeriodCoverage(selected).label}
                    {resolveDigestPeriodCoverage(selected).detail !== null
                      ? ` · ${resolveDigestPeriodCoverage(selected).detail}`
                      : ""}
                  </p>
                </div>

                <div>
                  <h4 className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>Recipients</h4>
                  {deliveryAttempts.length === 0 ? (
                    <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                      No delivery recipients recorded. Add subscriptions in the Subscriptions tab.
                    </p>
                  ) : (
                    <ul className={cn("m-0 mt-1 list-disc space-y-1 pl-5 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
                      {[...new Set(deliveryAttempts.map((a) => `${a.channelType}: ${a.destination}`))].map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <h4 className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    Delivery status
                  </h4>
                  <div className="mt-1">
                    <StatusTag
                      kind={resolveDigestDeliveryStatus(deliveryAttempts).kind}
                      label={resolveDigestDeliveryStatus(deliveryAttempts).label}
                    />
                  </div>
                  {deliveryAttempts.length > 0 ? (
                    <ul
                      className={cn("m-0 mt-2 list-disc space-y-1 pl-5 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}
                      data-testid="digests-delivery-attempts"
                    >
                      {deliveryAttempts.map((a) => (
                        <li key={a.attemptId}>
                          {resolveDigestDeliveryAttemptStatus(a).label} · {a.channelType} ·{" "}
                          {formatDigestInstant(a.attemptedUtc)}
                          {digestDeliveryAttemptHasDiagnostic(a) ? (
                            <span className="block text-al-text-secondary">
                              {DIGEST_DELIVERY_DIAGNOSTIC_NOTE}
                            </span>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setPreviewOpen((open) => !open)}
                    data-testid="digests-preview-toggle"
                    aria-expanded={previewOpen}
                  >
                    {previewOpen ? "Hide preview" : "Preview"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => downloadDigestExport(selected)}
                    data-testid="digests-download-export"
                  >
                    {DIGEST_EXPORT_ACTION_LABEL}
                  </Button>
                </div>

                {previewOpen ? (
                  <pre
                    className={cn(
                      "max-h-[28rem] overflow-auto whitespace-pre-wrap rounded-md border border-neutral-200 bg-neutral-100 p-3 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
                      OPERATOR_TYPOGRAPHY.body,
                    )}
                    data-testid="digests-preview-body"
                  >
                    {selected.contentMarkdown}
                  </pre>
                ) : null}

                <CollapsibleSection title="Technical details" defaultOpen={false} sectionTestId="digests-technical-details">
                  <dl className={cn("m-0 grid gap-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
                    <div>
                      <dt className="font-medium text-al-text-primary">Digest id</dt>
                      <dd className="m-0 font-mono">{selected.digestId}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-al-text-primary">Review</dt>
                      <dd className="m-0 font-mono">{selected.runId ?? "—"}</dd>
                    </div>
                    {selected.comparedToRunId ? (
                      <div>
                        <dt className="font-medium text-al-text-primary">Compared to</dt>
                        <dd className="m-0 font-mono">{selected.comparedToRunId}</dd>
                      </div>
                    ) : null}
                    {digestDeliveryDiagnostics(deliveryAttempts).length > 0 ? (
                      <div data-testid="digests-delivery-diagnostics">
                        <dt className="font-medium text-al-text-primary">Delivery diagnostics</dt>
                        {digestDeliveryDiagnostics(deliveryAttempts).map((line) => (
                          <dd key={line} className="m-0 font-mono break-words">
                            {line}
                          </dd>
                        ))}
                      </div>
                    ) : null}
                  </dl>
                </CollapsibleSection>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
