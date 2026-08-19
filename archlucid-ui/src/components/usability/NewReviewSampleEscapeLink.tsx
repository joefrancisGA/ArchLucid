import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  NEW_REVIEW_SAMPLE_ESCAPE_CTA,
  NEW_REVIEW_SAMPLE_ESCAPE_HINT,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showcaseSpecimenSignedReviewRecordHref } from "@/lib/showcase-sample-review-registry";

const sampleReviewHref = showcaseSpecimenSignedReviewRecordHref();

export type NewReviewSampleEscapeLinkProps = {
  /** List item for secondary start paths; inline link beside the primary CTA on first-pilot intake. */
  readonly presentation?: "list" | "inline";
};

/** Secondary start path — finished package without configuration (TB-2130). */
export function NewReviewSampleEscapeLink(props: NewReviewSampleEscapeLinkProps): React.JSX.Element {
  const presentation = props.presentation ?? "list";

  if (presentation === "inline") {
    return (
      <Button asChild variant="outline" size="sm" data-testid="new-review-sample-escape-inline">
        <Link href={sampleReviewHref}>{NEW_REVIEW_SAMPLE_ESCAPE_CTA}</Link>
      </Button>
    );
  }

  return (
    <li className="space-y-1" data-testid="new-review-sample-escape">
      <Button asChild variant="outline" size="sm" className="w-full justify-start">
        <Link href={sampleReviewHref}>{NEW_REVIEW_SAMPLE_ESCAPE_CTA}</Link>
      </Button>
      <p className={cn("m-0 px-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {NEW_REVIEW_SAMPLE_ESCAPE_HINT}
      </p>
    </li>
  );
}
