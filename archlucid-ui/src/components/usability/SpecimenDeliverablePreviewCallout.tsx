import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK,
  REVIEWS_NEW_SPECIMEN_PREVIEW_LEAD,
  REVIEWS_NEW_SPECIMEN_PREVIEW_PRIMARY_CTA,
  REVIEWS_NEW_SPECIMEN_PREVIEW_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  showcaseSpecimenFindingsHref,
  showcaseSpecimenSealedReviewRecordHref,
} from "@/lib/showcase-sample-review-registry";
import { cn } from "@/lib/utils";

export type SpecimenDeliverablePreviewCalloutProps = {
  readonly variant?: "section" | "compact" | "header-links";
  readonly sectionTestId?: string;
};

/** Pre-intake specimen preview — Finalized review record + findings (TB-2151). */
export function SpecimenDeliverablePreviewCallout(
  props: SpecimenDeliverablePreviewCalloutProps,
): React.JSX.Element {
  const variant = props.variant ?? "section";
  const sectionTestId = props.sectionTestId ?? "reviews-new-specimen-preview";

  if (variant === "header-links") {
    return (
      <>
        <span className="text-al-text-secondary"> · </span>
        <Link
          href={showcaseSpecimenSealedReviewRecordHref()}
          className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${sectionTestId}-primary-link`}
        >
          {REVIEWS_NEW_SPECIMEN_PREVIEW_PRIMARY_CTA}
        </Link>
        <span className="text-al-text-secondary"> · </span>
        <Link
          href={showcaseSpecimenFindingsHref()}
          className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${sectionTestId}-findings-link`}
        >
          {REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK}
        </Link>
      </>
    );
  }

  if (variant === "compact") {
    return (
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1" data-testid={sectionTestId}>
        <Button asChild variant="outline" size="sm" className="h-8 w-fit">
          <Link
            href={showcaseSpecimenSealedReviewRecordHref()}
            data-testid={`${sectionTestId}-primary-cta`}
          >
            {REVIEWS_NEW_SPECIMEN_PREVIEW_PRIMARY_CTA}
          </Link>
        </Button>
        <Link
          href={showcaseSpecimenFindingsHref()}
          className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${sectionTestId}-findings-link`}
        >
          {REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK}
        </Link>
      </div>
    );
  }

  return (
    <section
      aria-labelledby={`${sectionTestId}-heading`}
      className="space-y-3 rounded-md border border-neutral-200 p-4 dark:border-neutral-800"
      data-testid={sectionTestId}
    >
      <div className="space-y-1">
        <h2
          id={`${sectionTestId}-heading`}
          className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
        >
          {REVIEWS_NEW_SPECIMEN_PREVIEW_TITLE}
        </h2>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.helper)}>
          {REVIEWS_NEW_SPECIMEN_PREVIEW_LEAD}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button asChild variant="outline" size="sm" className="h-8 w-fit" data-testid={`${sectionTestId}-primary-cta`}>
          <Link href={showcaseSpecimenSealedReviewRecordHref()}>{REVIEWS_NEW_SPECIMEN_PREVIEW_PRIMARY_CTA}</Link>
        </Button>
        <Link
          href={showcaseSpecimenFindingsHref()}
          className={cn(OPERATOR_LINK.nav, OPERATOR_TYPOGRAPHY.helper)}
          data-testid={`${sectionTestId}-findings-link`}
        >
          {REVIEWS_NEW_SPECIMEN_PREVIEW_FINDINGS_LINK}
        </Link>
      </div>
    </section>
  );
}
