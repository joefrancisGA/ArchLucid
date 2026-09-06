"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formatDigestInstant } from "@/lib/digest-setup-gap-actions";
import {
  DIGEST_EXPORT_ACTION_LABEL,
  DIGEST_DELIVERY_DIAGNOSTIC_NOTE,
  digestDeliveryAttemptHasDiagnostic,
  digestDeliveryDiagnostics,
  resolveDigestDeliveryAttemptStatus,
  resolveDigestDeliveryStatus,
} from "@/lib/digest-delivery-presentation";
import {
  DIGEST_COVERAGE_COLUMN_HEADER,
  resolveDigestPeriodCoverage,
} from "@/lib/digest-period-coverage";
import { downloadDigestExport } from "@/components/digests/digests-browse-helpers";
import {
  digestsBrowseDisclosureHrefFromSearch,
  parseDigestsBrowseIncludesOpenFromSearch,
  parseDigestsTechnicalDetailsOpenFromSearch,
} from "@/lib/digests/digests-browse-disclosure-url";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";

export type DigestsBrowseDetailPanelProps = {
  readonly selected: ArchitectureDigest | null;
  readonly deliveryAttempts: readonly DigestDeliveryAttempt[];
  readonly previewOpen: boolean;
  readonly onPreviewOpenChange: (open: boolean) => void;
  readonly detailPanelRef: React.RefObject<HTMLElement | null>;
};

export function DigestsBrowseDetailPanel({
  selected,
  deliveryAttempts,
  previewOpen,
  onPreviewOpenChange,
  detailPanelRef,
}: DigestsBrowseDetailPanelProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const digestsTechnicalDetailsOpenParam = searchParams.get("digestsTechnicalDetailsOpen");
  const [technicalDetailsOpen, setTechnicalDetailsOpenState] = useState(() =>
    parseDigestsTechnicalDetailsOpenFromSearch(digestsTechnicalDetailsOpenParam),
  );

  const syncTechnicalDetailsOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        digestsBrowseDisclosureHrefFromSearch(
          searchParams.toString(),
          { technicalDetailsOpen: open, browseIncludesOpen: parseDigestsBrowseIncludesOpenFromSearch(searchParams.get("digestsBrowseIncludesOpen")) },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setTechnicalDetailsOpen = useCallback(
    (open: boolean) => {
      setTechnicalDetailsOpenState(open);
      syncTechnicalDetailsOpenToUrl(open);
    },
    [syncTechnicalDetailsOpenToUrl],
  );

  useEffect(() => {
    setTechnicalDetailsOpenState(parseDigestsTechnicalDetailsOpenFromSearch(digestsTechnicalDetailsOpenParam));
  }, [digestsTechnicalDetailsOpenParam]);

  return (
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
              onClick={() => onPreviewOpenChange(!previewOpen)}
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

          <CollapsibleSection
            title="Technical details"
            open={technicalDetailsOpen}
            onToggle={setTechnicalDetailsOpen}
            sectionTestId="digests-technical-details"
          >
            <dl className={cn("m-0 grid gap-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              <div>
                <dt className="font-medium text-al-text-primary">Digest id</dt>
                <dd className="m-0 font-mono">{selected.digestId}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Review</dt>
                <dd className="m-0 font-mono">{selected.runId ?? " — "}</dd>
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
  );
}
