import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInventoryUpdatedAtCell } from "@/lib/relative-time";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";
import Link from "next/link";

type ArchitectureIdentityDeskReviewsTableProps = {
  readonly architectureId: string;
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
};

export function ArchitectureIdentityDeskReviewsTable(
  props: ArchitectureIdentityDeskReviewsTableProps,
): React.JSX.Element {
  if (props.reviews.length === 0) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.body} data-testid="architecture-identity-reviews-empty">
        No sealed or in-flight reviews yet for this architecture.
      </p>
    );
  }

  return (
    <EnterpriseTable data-testid="architecture-identity-reviews-table">
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Review</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Started</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {props.reviews.map((review) => {
          const label = review.description?.trim() || "Architecture review";

          return (
            <EnterpriseTableRow key={review.runId} data-testid={`architecture-identity-review-row-${review.runId}`}>
              <EnterpriseTableCell>
                <Link href={reviewDetailPath(review.runId)} className={OPERATOR_LINK.nav}>
                  {label}
                </Link>
              </EnterpriseTableCell>
              <EnterpriseTableCell>{formatInventoryUpdatedAtCell(review.createdUtc).display}</EnterpriseTableCell>
            </EnterpriseTableRow>
          );
        })}
      </EnterpriseTableBody>
    </EnterpriseTable>
  );
}
