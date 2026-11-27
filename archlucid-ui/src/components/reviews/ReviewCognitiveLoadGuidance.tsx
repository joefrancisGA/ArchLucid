import Link from "next/link";

import { Button } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  REVIEW_COGNITIVE_LOAD_GLOSSARY_LINE,
} from "@/lib/reviews/review-cognitive-load-copy";
import type { ReviewCognitiveLoadPrimaryAction } from "@/lib/reviews/review-cognitive-load-copy";
import { cn } from "@/lib/utils";

type ReviewCognitiveLoadGuidanceProps = {
  readonly nextAction: string;
  readonly emptyLine: string | null;
  readonly primaryAction: ReviewCognitiveLoadPrimaryAction | null;
};

/** One next action and a first-encounter glossary. Does not add or hide workspace tabs. */
export function ReviewCognitiveLoadGuidance(props: ReviewCognitiveLoadGuidanceProps): React.JSX.Element {
  return (
    <div className="mt-2 space-y-1" data-testid="review-cognitive-load-guidance">
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)} data-testid="review-cognitive-load-next-action">
        {props.nextAction}
      </p>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-cognitive-load-glossary">
        {REVIEW_COGNITIVE_LOAD_GLOSSARY_LINE}
      </p>
      {props.emptyLine !== null ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="review-cognitive-load-empty-next-step">
          {props.emptyLine}
        </p>
      ) : null}
      {props.primaryAction !== null ? (
        <Button asChild size="sm" data-testid="review-cognitive-load-primary">
          <Link href={props.primaryAction.href}>{props.primaryAction.label}</Link>
        </Button>
      ) : null}
    </div>
  );
}
