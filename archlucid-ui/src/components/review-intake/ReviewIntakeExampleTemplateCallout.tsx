import { cn } from "@/lib/utils";
import type { ReviewIntakeExampleTemplate } from "@/lib/operator/operator-home-example-request";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
type ReviewIntakeExampleTemplateCalloutProps = {
  readonly template: ReviewIntakeExampleTemplate;
};

/** Non-blocking hint that example content is prefilled and editable before submit. */
export function ReviewIntakeExampleTemplateCallout(props: ReviewIntakeExampleTemplateCalloutProps): React.JSX.Element {
  return (
    <p
      className={cn("m-0 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
      data-testid="review-intake-example-template-callout"
    >
      Starting from the <span className="font-medium">{props.template.title}</span> sample — edit any field before
      you continue.
    </p>
  );
}
