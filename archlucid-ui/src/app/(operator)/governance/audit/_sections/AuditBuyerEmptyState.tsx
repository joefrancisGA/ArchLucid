"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  AUDIT_TRAIL_EMPTY_CHOOSE_REVIEW_ACTION,
  AUDIT_TRAIL_EMPTY_CLEAR_FILTERS_ACTION,
  AUDIT_TRAIL_EMPTY_DESCRIPTION,
  AUDIT_TRAIL_EMPTY_SAMPLE_NOTE,
  AUDIT_TRAIL_EMPTY_TITLE,
  AUDIT_TRAIL_OPEN_REVIEW_PACKAGE_ACTION,
} from "@/lib/audit-trail-page-copy";
import { OPERATOR_LAYOUT, OPERATOR_TYPE_SCALE } from "@/lib/design-tokens";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";

import { AuditBuyerEmptyStatePreview } from "./AuditBuyerEmptyStatePreview";

type AuditBuyerEmptyStateProps = {
  readonly reviewPackageHref: string | null;
  readonly onClearFilters: () => void;
  readonly onChooseAnotherReview: () => void;
  readonly clearingFilters: boolean;
};

/** Actionable empty state when no audit events match the current review and filters. */
export function AuditBuyerEmptyState(props: AuditBuyerEmptyStateProps): React.JSX.Element {
  const { reviewPackageHref, onClearFilters, onChooseAnotherReview, clearingFilters } = props;

  return (
    <div className="space-y-4" data-testid="audit-buyer-empty-state">
      <div
        role="status"
        aria-label={AUDIT_TRAIL_EMPTY_TITLE}
        className={cn(
          "rounded-md border border-dashed border-neutral-200 px-3 py-3 dark:border-neutral-700",
          OPERATOR_LAYOUT.sectionStack,
        )}
      >
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle, "text-al-text-primary")}>{AUDIT_TRAIL_EMPTY_TITLE}</p>
        <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-600 dark:text-neutral-400")}>
          {AUDIT_TRAIL_EMPTY_DESCRIPTION}
        </p>
        {isNextPublicDemoMode() ? (
          <p className={cn("m-0", OPERATOR_TYPE_SCALE.helper, "text-neutral-500 dark:text-neutral-500")}>
            {AUDIT_TRAIL_EMPTY_SAMPLE_NOTE}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" size="sm" variant="primary" disabled={clearingFilters} onClick={onClearFilters}>
            {AUDIT_TRAIL_EMPTY_CLEAR_FILTERS_ACTION}
          </Button>
          <Button type="button" size="sm" variant="outline" className="border-neutral-300 dark:border-neutral-600" onClick={onChooseAnotherReview}>
            {AUDIT_TRAIL_EMPTY_CHOOSE_REVIEW_ACTION}
          </Button>
          {reviewPackageHref !== null ? (
            <Button type="button" size="sm" variant="outline" className="border-neutral-300 dark:border-neutral-600" asChild>
              <Link href={reviewPackageHref}>{AUDIT_TRAIL_OPEN_REVIEW_PACKAGE_ACTION}</Link>
            </Button>
          ) : null}
        </div>
      </div>
      <AuditBuyerEmptyStatePreview />
    </div>
  );
}
