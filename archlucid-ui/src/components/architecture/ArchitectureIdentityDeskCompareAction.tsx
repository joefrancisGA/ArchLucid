import Link from "next/link";

import { ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL } from "@/lib/architecture/architecture-identity-desk-copy";
import { resolveArchitectureCompareSiblingDefaults } from "@/lib/architecture/resolve-architecture-compare-defaults";
import { compareTwoReviewsHref } from "@/lib/compare-two-reviews-route";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ArchitectureIdentityChildReviewSummary } from "@/types/architecture-identity";

export const ARCHITECTURE_IDENTITY_DESK_COMPARE_DISABLED_REASON =
  "Compare two reviews of this architecture after a second review exists." as const;

type ArchitectureIdentityDeskCompareActionProps = {
  readonly architectureId: string;
  readonly reviews: readonly ArchitectureIdentityChildReviewSummary[];
};

/** Compare CTA scoped to sibling reviews on the architecture desk (CA-30 / AO-29). */
export function ArchitectureIdentityDeskCompareAction(
  props: ArchitectureIdentityDeskCompareActionProps,
): React.JSX.Element {
  const siblingDefaults = resolveArchitectureCompareSiblingDefaults({
    architectureId: props.architectureId,
    reviews: props.reviews,
  });

  if (siblingDefaults === null) {
    return (
      <p
        className={OPERATOR_TYPOGRAPHY.helper}
        data-testid="architecture-identity-compare-disabled-reason"
      >
        {ARCHITECTURE_IDENTITY_DESK_COMPARE_DISABLED_REASON}
      </p>
    );
  }

  const compareHref = compareTwoReviewsHref({
    priorRunId: siblingDefaults.priorRunId,
    laterRunId: siblingDefaults.laterRunId,
    architectureId: siblingDefaults.architectureId,
  });

  return (
    <Link href={compareHref} className={OPERATOR_LINK.nav} data-testid="architecture-identity-compare-entry">
      {ARCHITECTURE_IDENTITY_DESK_COMPARE_LABEL}
    </Link>
  );
}
