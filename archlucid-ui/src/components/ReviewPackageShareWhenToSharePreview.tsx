"use client";

import type { ReactElement } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildReviewPackageShareWhenToSharePreview } from "@/lib/review-package-share-when-to-share";
import { cn } from "@/lib/utils";

export type ReviewPackageShareWhenToSharePreviewProps = {
  readonly className?: string;
};

/**
 * Review-package when-to-share preview (TB-2243).
 * Buyer nouns for share link vs print vs export occasions — not permission clarity.
 */
export function ReviewPackageShareWhenToSharePreview(
  props: ReviewPackageShareWhenToSharePreviewProps,
): ReactElement {
  const preview = buildReviewPackageShareWhenToSharePreview();

  return (
    <aside
      className={cn(
        "mb-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-900",
        props.className,
      )}
      data-testid="review-package-share-when-to-share"
      aria-labelledby="review-package-share-when-to-share-title"
    >
      <h3
        id="review-package-share-when-to-share-title"
        className={cn(
          "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
          OPERATOR_TYPOGRAPHY.cardTitle,
        )}
      >
        {preview.title}
      </h3>
      <p
        className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="review-package-share-when-to-share-summary"
      >
        {preview.summary}
      </p>
      <dl className="m-0 mt-3 grid gap-2">
        {preview.rows.map((row) => (
          <div key={row.id} data-testid={`review-package-share-when-to-share-${row.id}`}>
            <dt className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {row.label}
            </dt>
            <dd className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.occasion}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
