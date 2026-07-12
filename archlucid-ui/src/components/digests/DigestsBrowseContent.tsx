"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
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
import { buildDigestSetupChecklistItems, formatDigestInstant } from "@/lib/digest-setup-gap-actions";
import {
  DIGESTS_BROWSE_EMPTY_DESCRIPTION,
  DIGESTS_BROWSE_EMPTY_TITLE,
} from "@/lib/digests-browse-copy";
import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  getArchitectureDigest,
  listArchitectureDigests,
  listDigestDeliveryAttempts,
} from "@/lib/api";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

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

function resolveDeliveryStatus(
  attempts: readonly DigestDeliveryAttempt[],
): { kind: EnterpriseStatusKind; label: string } {
  if (attempts.length === 0) {
    return { kind: "draft", label: "Not delivered" };
  }

  const hasFailure: boolean = attempts.some((a) => /fail|error/i.test(a.status));
  const hasSuccess: boolean = attempts.some((a) => /success|delivered|sent|ok/i.test(a.status));

  if (hasFailure && !hasSuccess) {
    return { kind: "blocked", label: "Delivery failed" };
  }

  if (hasFailure && hasSuccess) {
    return { kind: "needs-attention", label: "Partial delivery" };
  }

  if (hasSuccess) {
    return { kind: "ready", label: "Delivered" };
  }

  return { kind: "in-progress", label: attempts[0]?.status ?? "Pending" };
}

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

function downloadDigestExport(digest: ArchitectureDigest): void {
  const blob = new Blob([digest.contentMarkdown ?? ""], {
    type: "text/plain;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${digest.title.replace(/[^\w\-]+/g, "_").slice(0, 64) || "digest"}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Browse tab: architecture digest history and detail.
 */
export function DigestsBrowseContent(props: DigestsBrowseContentProps = {}): ReactElement {
  const { refreshToken = 0, onLoaded, hidePageHeader = false, healthSnap = null } = props;
  const [digests, setDigests] = useState<ArchitectureDigest[]>([]);
  const [selected, setSelected] = useState<ArchitectureDigest | null>(null);
  const [deliveryAttempts, setDeliveryAttempts] = useState<DigestDeliveryAttempt[]>([]);
  const [rowAttempts, setRowAttempts] = useState<Record<string, DigestDeliveryAttempt[]>>({});
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [previewOpen, setPreviewOpen] = useState(true);

  const loadDigests = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const data = await listArchitectureDigests(40);
      setDigests(data);
      setSelected(null);
      setDeliveryAttempts([]);

      // Prefetch delivery rows so the history table can show recipients and status without an extra click.
      const attemptEntries = await Promise.all(
        data.map(async (digest) => {
          try {
            const attempts = await listDigestDeliveryAttempts(digest.digestId);
            return [digest.digestId, attempts] as const;
          } catch {
            return [digest.digestId, [] as DigestDeliveryAttempt[]] as const;
          }
        }),
      );
      const nextAttempts: Record<string, DigestDeliveryAttempt[]> = {};

      for (const [digestId, attempts] of attemptEntries) {
        nextAttempts[digestId] = attempts;
      }

      setRowAttempts(nextAttempts);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
      setRowAttempts({});
    } finally {
      setLoading(false);
      onLoaded?.();
    }
  }, [onLoaded]);

  useEffect(() => {
    void loadDigests();
  }, [loadDigests, refreshToken]);

  async function selectDigest(d: ArchitectureDigest): Promise<void> {
    setFailure(null);

    try {
      const full = await getArchitectureDigest(d.digestId);
      setSelected(full);
      const attempts = await listDigestDeliveryAttempts(d.digestId);
      setDeliveryAttempts(attempts);
      setRowAttempts((prev) => ({ ...prev, [d.digestId]: attempts }));
      setPreviewOpen(true);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    }
  }

  const setupChecklist =
    healthSnap !== null ? buildDigestSetupChecklistItems(healthSnap, digests.length > 0) : null;
  const setupIncomplete: boolean =
    setupChecklist !== null ? setupChecklist.some((item) => !item.complete) : false;

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

      {loading && digests.length === 0 && failure === null ? (
        <p className={cn("mt-4 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>Loading digests…</p>
      ) : null}

      {!loading && digests.length === 0 && failure === null ? (
        <div className="mt-4 space-y-4" data-testid="digests-browse-empty-state">
          {setupChecklist !== null && setupIncomplete ? (
            <DigestsBrowseSetupChecklist items={setupChecklist} />
          ) : null}
          <DigestsBrowseIncludesPreview />
          <EnterpriseCompactEmptyState
            testId="digests-empty-state"
            title={DIGESTS_BROWSE_EMPTY_TITLE}
            description={DIGESTS_BROWSE_EMPTY_DESCRIPTION}
          />
        </div>
      ) : null}

      {setupChecklist !== null && setupIncomplete && digests.length > 0 ? (
        <DigestsBrowseSetupChecklist items={setupChecklist} />
      ) : null}

      {digests.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
          <section className="min-w-0 rounded-lg border border-neutral-200 bg-white p-3 dark:border-neutral-700 dark:bg-neutral-950">
            <h3 className={cn("m-0 mb-3 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Digest history
            </h3>
            <EnterpriseTable ariaLabel="Architecture digest history">
              <EnterpriseTableHead>
                <EnterpriseTableHeadRow>
                  <EnterpriseTableHeaderCell>Digest</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Period</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Generated</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Recipients</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                  <EnterpriseTableHeaderCell>Actions</EnterpriseTableHeaderCell>
                </EnterpriseTableHeadRow>
              </EnterpriseTableHead>
              <EnterpriseTableBody>
                {digests.map((digest) => {
                  const attempts = rowAttempts[digest.digestId] ?? [];
                  const status = resolveDeliveryStatus(attempts);
                  const selectedRow = selected?.digestId === digest.digestId;

                  return (
                    <EnterpriseTableRow key={digest.digestId} selected={selectedRow}>
                      <EnterpriseTableCell>
                        <button
                          type="button"
                          className={cn(
                            "cursor-pointer text-left text-al-link underline-offset-2 hover:underline",
                            OPERATOR_TYPOGRAPHY.body,
                          )}
                          onClick={() => void selectDigest(digest)}
                        >
                          {digest.title}
                        </button>
                      </EnterpriseTableCell>
                      <EnterpriseTableCell>
                        <span className={OPERATOR_TYPOGRAPHY.helper}>
                          {digest.comparedToRunId ? "Compared period" : "Current period"}
                        </span>
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
                        <Button type="button" size="sm" variant="outline" onClick={() => void selectDigest(digest)}>
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
                    Included sections
                  </h4>
                  <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    Review activity, governance signals, findings, and advisory scan highlights when available for the
                    period.
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
                      kind={resolveDeliveryStatus(deliveryAttempts).kind}
                      label={resolveDeliveryStatus(deliveryAttempts).label}
                    />
                  </div>
                  {deliveryAttempts.length > 0 ? (
                    <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5 text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
                      {deliveryAttempts.map((a) => (
                        <li key={a.attemptId}>
                          {a.status} · {a.channelType} · {formatDigestInstant(a.attemptedUtc)}
                          {a.errorMessage ? (
                            <span className="text-rose-700 dark:text-rose-300"> — {a.errorMessage}</span>
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
                    Download / export
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
                      <dt className="font-medium text-al-text-primary">Review package</dt>
                      <dd className="m-0 font-mono">{selected.runId ?? "—"}</dd>
                    </div>
                    {selected.comparedToRunId ? (
                      <div>
                        <dt className="font-medium text-al-text-primary">Compared to</dt>
                        <dd className="m-0 font-mono">{selected.comparedToRunId}</dd>
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
