import { OPERATOR_GUIDANCE_NEXT_LABEL_CLASS } from "@/lib/design-tokens";

/** Semibold scan marker for inline guidance prefixes (e.g. First-hour path "Next:"). */
export function OperatorGuidanceNextLabel() {
  return (
    <strong className={OPERATOR_GUIDANCE_NEXT_LABEL_CLASS} data-testid="operator-guidance-next-label">
      Next:
    </strong>
  );
}
