"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatDigestInstant } from "@/lib/digest-setup-gap-actions";
import {
  DIGEST_COVERAGE_COLUMN_HEADER,
  resolveDigestPeriodCoverage,
  type DigestPeriodCoverage,
} from "@/lib/digest-period-coverage";
import { digestRowElementId } from "@/lib/digests-browse-deep-link";
import { uniqueRecipients } from "@/components/digests/digests-browse-helpers";
import { Button } from "@/components/ui/button";
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
import { resolveDigestDeliveryStatus } from "@/lib/digest-delivery-presentation";
import type { ArchitectureDigest } from "@/types/advisory-scheduling";
import type { DigestDeliveryAttempt } from "@/types/digest-subscriptions";

export type DigestsBrowseHistoryListProps = {
  readonly digests: readonly ArchitectureDigest[];
  readonly rowAttempts: Record<string, DigestDeliveryAttempt[]>;
  readonly selectedDigestId: string | null | undefined;
  readonly onSelectDigest: (digestId: string) => void;
};

export function DigestsBrowseHistoryList({
  digests,
  rowAttempts,
  selectedDigestId,
  onSelectDigest,
}: DigestsBrowseHistoryListProps): React.ReactElement {
  return (
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
            const selectedRow = selectedDigestId === digest.digestId;

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
                    onClick={() => onSelectDigest(digest.digestId)}
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
                    onClick={() => onSelectDigest(digest.digestId)}
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
  );
}
