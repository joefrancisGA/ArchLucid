import { cn } from "@/lib/utils";
import Link from "next/link";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import {
  NEW_REVIEW_SAMPLE_ESCAPE_CTA,
  NEW_REVIEW_SAMPLE_ESCAPE_LEAD,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const sampleReviewHref = `/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/** Quiet escape hatch on the new-review wizard — finished package without configuration. */
export function NewReviewSampleEscapeLink(props: { readonly className?: string }): React.JSX.Element {
  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-al-text-secondary", props.className)}
      data-testid="new-review-sample-escape"
    >
      <InlineGuidanceLabel label={NEW_REVIEW_SAMPLE_ESCAPE_LEAD} />{" "}
      <Link
        href={sampleReviewHref}
        className="font-medium text-al-accent-interactive underline underline-offset-2"
      >
        {NEW_REVIEW_SAMPLE_ESCAPE_CTA}
      </Link>
      .
    </p>
  );
}
