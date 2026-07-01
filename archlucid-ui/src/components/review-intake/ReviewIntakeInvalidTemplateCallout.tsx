import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
type ReviewIntakeInvalidTemplateCalloutProps = {
  readonly templateId: string;
};

/** Safe fallback when `?template=` does not match a registry entry. */
export function ReviewIntakeInvalidTemplateCallout(
  props: ReviewIntakeInvalidTemplateCalloutProps,
): React.JSX.Element {
  return (
    <p
      className={cn("m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100", OPERATOR_TYPOGRAPHY.body)}
      data-testid="review-intake-invalid-template-callout"
      role="status"
    >
      Example template &quot;{props.templateId}&quot; was not recognized — starting with a blank intake.
    </p>
  );
}
