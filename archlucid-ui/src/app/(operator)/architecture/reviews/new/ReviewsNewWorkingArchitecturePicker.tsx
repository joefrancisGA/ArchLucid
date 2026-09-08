"use client";

import Link from "next/link";

import { useArchitectureIdentitiesListQuery } from "@/hooks/use-architecture-identities-list-query";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { startReviewFromArchitectureNestedHref } from "@/lib/architecture/architecture-routes";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

export const REVIEWS_NEW_WORKING_ARCHITECTURE_PICKER_TITLE = "Pick an architecture to start a review";

export const REVIEWS_NEW_WORKING_ARCHITECTURE_PICKER_BODY =
  "Start review is a job of a named architecture. Choose which system this review belongs to before you continue.";

/** Working `/architecture/reviews/new` without `sourceArchitectureId` — architecture picker (AO-22). */
export function ReviewsNewWorkingArchitecturePicker(): React.JSX.Element {
  const query = useArchitectureIdentitiesListQuery(1, 50);

  if (query.isLoading) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.body} data-testid="reviews-new-working-architecture-picker-loading">
        Loading architectures…
      </p>
    );
  }

  if (query.isError) {
    return (
      <p className={OPERATOR_TYPOGRAPHY.body} data-testid="reviews-new-working-architecture-picker-error">
        Could not load architectures. Try again from the Architectures list.
      </p>
    );
  }

  const items = query.data?.items ?? [];

  return (
    <section className="space-y-3" data-testid="reviews-new-working-architecture-picker">
      <h2 className={OPERATOR_TYPOGRAPHY.sectionTitle}>{REVIEWS_NEW_WORKING_ARCHITECTURE_PICKER_TITLE}</h2>
      <p className={OPERATOR_TYPOGRAPHY.body}>{REVIEWS_NEW_WORKING_ARCHITECTURE_PICKER_BODY}</p>
      {items.length === 0 ? (
        <p className={OPERATOR_TYPOGRAPHY.helper}>No architectures in this workspace yet.</p>
      ) : (
        <EnterpriseTable ariaLabel="Architectures" data-testid="reviews-new-working-architecture-picker-table">
          <EnterpriseTableHead>
            <EnterpriseTableHeadRow>
              <EnterpriseTableHeaderCell>Architecture</EnterpriseTableHeaderCell>
              <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
            </EnterpriseTableHeadRow>
          </EnterpriseTableHead>
          <EnterpriseTableBody>
            {items.map((item) => (
              <EnterpriseTableRow key={item.architectureId}>
                <EnterpriseTableCell>{item.displayName}</EnterpriseTableCell>
                <EnterpriseTableCell>
                  <Link
                    href={startReviewFromArchitectureNestedHref(item.architectureId)}
                    className={OPERATOR_LINK.nav}
                    data-testid={`reviews-new-pick-architecture-${item.architectureId}`}
                  >
                    Start review
                  </Link>
                </EnterpriseTableCell>
              </EnterpriseTableRow>
            ))}
          </EnterpriseTableBody>
        </EnterpriseTable>
      )}
    </section>
  );
}
