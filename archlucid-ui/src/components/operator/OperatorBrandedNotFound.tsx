import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import Link from "next/link";

import { OperatorSectionRetryButton } from "@/components/operator/OperatorSectionRetryButton";
import { OperatorEmptyState } from "@/components/operator/OperatorShellMessage";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import {
  BRANDED_NOT_FOUND_RETRY_HINT,
  BRANDED_NOT_FOUND_WORKSPACE_HINT,
  type BrandedNotFoundVariant,
  brandedNotFoundBody,
  brandedNotFoundTitle,
} from "@/lib/operator/operator-branded-not-found-copy";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const REVIEW_PACKAGES_HREF = "/architecture/reviews";
const START_REVIEW_HREF = "/architecture/reviews/new";
const SAMPLE_REVIEW_HREF = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

export type OperatorBrandedNotFoundProps = {
  /**
   * Retained for call-site compatibility — recovery copy always includes a retry-after-create hint.
   * @deprecated No longer toggles extra copy; the standard second paragraph covers in-flight reviews.
   */
  readonly showProcessingHint?: boolean;
  readonly retryLabel?: string;
  /** When false, hides the curated showcase sample review deep link. Defaults to true. */
  readonly showSampleReviewLink?: boolean;
  /** `review` softens copy for missing review deep links; default is workspace-generic. */
  readonly variant?: BrandedNotFoundVariant;
};

/**
 * Shared 404 body for invalid or stale deep links. With `notFound()` from an operator route, the nearest
 * `app/(operator)/not-found.tsx` wraps this in the normal operator shell.
 */
export function OperatorBrandedNotFound({
  retryLabel = "Retry",
  showSampleReviewLink = true,
  variant = "generic",
}: OperatorBrandedNotFoundProps = {}) {
  const title = brandedNotFoundTitle(variant);
  const body = brandedNotFoundBody(variant);

  return (
    <div data-testid="branded-not-found">
      <OperatorEmptyState title={title}>
      <p className={cn("m-0 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {body}
      </p>
      <p className={cn("m-0 mt-3 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {BRANDED_NOT_FOUND_RETRY_HINT}
      </p>
      <p className={cn("m-0 mt-3 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
        {BRANDED_NOT_FOUND_WORKSPACE_HINT}
      </p>
      <div className={cn("mt-4 flex flex-wrap items-center gap-4 font-medium", OPERATOR_TYPOGRAPHY.body)}>
        <OperatorSectionRetryButton label={retryLabel} />
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
          {BUYER_START_ARCHITECTURE_REVIEW_CTA}
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
      <span className="sr-only">Page not found</span>
      </OperatorEmptyState>
    </div>
  );
}
