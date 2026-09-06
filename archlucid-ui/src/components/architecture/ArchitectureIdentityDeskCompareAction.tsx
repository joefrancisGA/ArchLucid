import Link from "next/link";

import { ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL } from "@/lib/architecture/architecture-identity-desk-copy";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

export const ARCHITECTURE_IDENTITY_DESK_COMPARE_DISABLED_REASON =
  "Compare two reviews of this architecture after a second review exists." as const;

type ArchitectureIdentityDeskCompareActionProps = {
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
};

/** Compare CTA scoped to sibling reviews on the architecture desk (CA-30). */
export function ArchitectureIdentityDeskCompareAction(
  props: ArchitectureIdentityDeskCompareActionProps,
): React.JSX.Element {
  if (props.reviews.length < 2) {
    return (
      <p
        className={OPERATOR_TYPOGRAPHY.helper}
        data-testid="architecture-identity-compare-disabled-reason"
      >
        {ARCHITECTURE_IDENTITY_DESK_COMPARE_DISABLED_REASON}
      </p>
    );
  }

  const laterReview = props.reviews[0];
  const priorReview = props.reviews[1];

  if (laterReview === undefined || priorReview === undefined) {
    return (
      <p
        className={OPERATOR_TYPOGRAPHY.helper}
        data-testid="architecture-identity-compare-disabled-reason"
      >
        {ARCHITECTURE_IDENTITY_DESK_COMPARE_DISABLED_REASON}
      </p>
    );
  }

  const compareHref = comparePageHrefAdaptive(priorReview.runId, laterReview.runId);

  return (
    <Link href={compareHref} className={OPERATOR_LINK.nav} data-testid="architecture-identity-compare-entry">
      {ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL}
    </Link>
  );
}
