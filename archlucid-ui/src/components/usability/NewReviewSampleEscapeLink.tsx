import { cn } from "@/lib/utils";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  NEW_REVIEW_SAMPLE_ESCAPE_CTA,
  NEW_REVIEW_SAMPLE_ESCAPE_HINT,
} from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";

const sampleReviewHref = `/architecture/reviews/${encodeURIComponent(SHOWCASE_STATIC_DEMO_RUN_ID)}`;

/** Secondary start path — finished package without configuration (TB-2130). */
export function NewReviewSampleEscapeLink(): React.JSX.Element {
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
