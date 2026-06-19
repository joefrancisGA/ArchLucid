import Link from "next/link";

import { OperatorSectionRetryButton } from "@/components/OperatorSectionRetryButton";
import { OperatorEmptyState } from "@/components/OperatorShellMessage";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const REVIEW_PACKAGES_HREF = "/reviews?projectId=default";
const START_REVIEW_HREF = "/reviews/new";
const SAMPLE_REVIEW_HREF = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

export type OperatorBrandedNotFoundProps = {
  /**
   * Retained for call-site compatibility — recovery copy always includes a retry-after-create hint.
   * @deprecated No longer toggles extra copy; the standard second paragraph covers in-flight reviews.
   */
  readonly showProcessingHint?: boolean;
  readonly retryLabel?: string;
  /** When false, hides the curated showcase sample review deep link. Defaults to true. */
  readonly showSampleReviewLink?: boolean;
};

/**
 * Shared 404 body for invalid or stale deep links. With `notFound()` from an operator route, the nearest
 * `app/(operator)/not-found.tsx` wraps this in the normal operator shell.
 */
export function OperatorBrandedNotFound({
  retryLabel = "Retry",
  showSampleReviewLink = true,
}: OperatorBrandedNotFoundProps = {}) {
  return (
    <OperatorEmptyState title="We could not find that ArchLucid artifact">
      <p className="m-0 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        The link may be mistyped, expired, or pointed to a review package, evidence item, finding, or workspace item
        that is not available in the current workspace.
      </p>
      <p className="m-0 mt-3 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        If the review was just created, wait a moment and retry. If you pasted an ID, confirm the full value was
        copied.
      </p>
      <p className="m-0 mt-3 text-xs text-neutral-600 dark:text-neutral-400">
        If you expected a completed review, open Review packages and confirm the workspace selector is set correctly.
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-medium">
        <OperatorSectionRetryButton label={retryLabel} />
        <Link className="text-teal-800 underline dark:text-teal-300" href="/" data-testid="not-found-home">
          {OPERATOR_NAV_LINK_LABELS.home}
        </Link>
        <Link
          className="text-teal-800 underline dark:text-teal-300"
          href={REVIEW_PACKAGES_HREF}
          data-testid="not-found-review-packages"
        >
          {OPERATOR_NAV_LINK_LABELS.reviewPackage}
        </Link>
        <Link
          className="text-teal-800 underline dark:text-teal-300"
          href={START_REVIEW_HREF}
          data-testid="not-found-start-review"
        >
          {OPERATOR_NAV_LINK_LABELS.capture}
        </Link>
        {showSampleReviewLink ? (
          <Link
            className="text-teal-800 underline dark:text-teal-300"
            href={SAMPLE_REVIEW_HREF}
            data-testid="not-found-sample-review"
          >
            Open sample review
          </Link>
        ) : null}
      </div>
      <p className="m-0 mt-6 text-[11px] uppercase tracking-wide text-neutral-800 dark:text-neutral-300">
        ArchLucid · 404
      </p>
      <span data-testid="branded-not-found" className="sr-only">
        Page not found
      </span>
    </OperatorEmptyState>
  );
}
