"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { NewReviewSampleEscapeLink } from "@/components/usability/NewReviewSampleEscapeLink";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEWS_NEW_GUIDED_QUESTIONS_LABEL,
  REVIEWS_NEW_MORE_WAYS_TO_START_SUMMARY,
  REVIEWS_NEW_MORE_WAYS_TO_START_TITLE,
  REVIEWS_NEW_PATH_HINTS,
} from "@/lib/reviews-new-path-copy";

import type { ReviewsNewActivePath } from "./reviews-new-path-switcher-state";

type ReviewsNewMoreWaysToStartProps = {
  readonly onSelectPath: (path: ReviewsNewActivePath) => void;
};

const SECONDARY_PATHS: readonly { id: ReviewsNewActivePath; label: string }[] = [
  { id: "guided-intake", label: REVIEWS_NEW_GUIDED_QUESTIONS_LABEL },
  { id: "detailed", label: "Templates and imports" },
] as const;

function secondaryPathTestId(path: ReviewsNewActivePath): string {
  switch (path) {
    case "guided-intake":
      return "reviews-new-more-path-guided-intake";
    case "detailed":
      return "reviews-new-more-path-detailed";
    case "quick-review":
      return "reviews-new-more-path-quick-review";
    default: {
      const exhaustive: never = path;
      return exhaustive;
    }
  }
}

/** Secondary review-start paths for first-run tenants (TB-2130). */
export function ReviewsNewMoreWaysToStart(props: ReviewsNewMoreWaysToStartProps): React.JSX.Element {
  const { onSelectPath } = props;

  return (
    <CollapsibleSection
      title={REVIEWS_NEW_MORE_WAYS_TO_START_TITLE}
      summaryLine={REVIEWS_NEW_MORE_WAYS_TO_START_SUMMARY}
      sectionTestId="reviews-new-more-intake-options"
    >
      <ul className="m-0 list-none space-y-3 p-0">
        <NewReviewSampleEscapeLink />
        {SECONDARY_PATHS.map((path) => (
          <li key={path.id} className="space-y-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start"
              data-testid={secondaryPathTestId(path.id)}
              onClick={() => {
                onSelectPath(path.id);
              }}
            >
              {path.label}
            </Button>
            <p className={cn("m-0 px-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {REVIEWS_NEW_PATH_HINTS[path.id]}
            </p>
          </li>
        ))}
      </ul>
    </CollapsibleSection>
  );
}
