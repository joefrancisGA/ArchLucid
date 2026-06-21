import type { ReviewIntakeExampleTemplate } from "@/lib/operator-home-example-request";

type ReviewIntakeExampleTemplateCalloutProps = {
  readonly template: ReviewIntakeExampleTemplate;
};

/** Non-blocking hint that example content is prefilled and editable before submit. */
export function ReviewIntakeExampleTemplateCallout(props: ReviewIntakeExampleTemplateCalloutProps): React.JSX.Element {
  return (
    <p
      className="m-0 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-300"
      data-testid="review-intake-example-template-callout"
    >
      Starting from the <span className="font-medium">{props.template.title}</span> example — edit any field before
      you continue.
    </p>
  );
}
