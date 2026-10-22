import { cn } from "@/lib/utils";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
type ReviewIntakeInvalidTemplateCalloutProps = {
  readonly templateId: string;
};

/** Safe fallback when `?template=` does not match a registry entry. */
export function ReviewIntakeInvalidTemplateCallout(
  props: ReviewIntakeInvalidTemplateCalloutProps,
): React.JSX.Element {
  return (
    <p
      className={cn("m-0", DESIGN_TOKENS.callout.warn, OPERATOR_TYPOGRAPHY.body)}
      data-testid="review-intake-invalid-template-callout"
      role="status"
    >
      Example template &quot;{props.templateId}&quot; was not recognized — starting with a blank intake.
    </p>
  );
}
