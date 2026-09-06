import Link from "next/link";

import { InventoryShowingCountBand } from "@/components/usability/InventoryShowingCountBand";
import { Button } from "@/components/ui/button";
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
  ARCHITECTURE_IDENTITY_DESK_REVIEWS_EMPTY,
  ARCHITECTURE_IDENTITY_DESK_START_REVIEW_LABEL,
} from "@/lib/architecture/architecture-identity-desk-copy";
import { reviewDetailPath } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatInventoryUpdatedAtCell } from "@/lib/relative-time";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

type ArchitectureIdentityDeskReviewsTableProps = {
  readonly architectureId: string;
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
  readonly reviewCount?: number;
  readonly startReviewHref?: string | null;
};

export function ArchitectureIdentityDeskReviewsTable(
  props: ArchitectureIdentityDeskReviewsTableProps,
): React.JSX.Element {
  if (props.reviews.length === 0) {
    return (
      <div className="space-y-2" data-testid="architecture-identity-reviews-empty">
        <p className={OPERATOR_TYPOGRAPHY.body}>{ARCHITECTURE_IDENTITY_DESK_REVIEWS_EMPTY}</p>
        {props.startReviewHref !== null && props.startReviewHref !== undefined && props.startReviewHref.length > 0 ? (
          <Button type="button" variant="outline" size="sm" asChild data-testid="architecture-identity-start-review">
            <Link href={props.startReviewHref}>{ARCHITECTURE_IDENTITY_DESK_START_REVIEW_LABEL}</Link>
          </Button>
        ) : null}
      </div>
    );
  }

  const reviewCount = props.reviewCount ?? props.reviews.length;

  return (
    <div className="space-y-2">
      <InventoryShowingCountBand
        loaded={props.reviews.length}
        total={reviewCount}
        testId="architecture-identity-reviews-showing-count"
      />
      <EnterpriseTable ariaLabel="Architecture reviews" data-testid="architecture-identity-reviews-table">
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
    </div>
  );
}
