import { cn } from "@/lib/utils";

import { INLINE_GUIDANCE_LABEL_CLASS } from "@/lib/design-tokens";

export type InlineGuidanceLabelProps = {
  readonly label: string;
  readonly className?: string;
  readonly testId?: string;
};

/** Semibold scan marker for inline guidance prefixes (e.g. "Next:", "Use this when:"). */
export function InlineGuidanceLabel(props: InlineGuidanceLabelProps) {
  const label = props.label.endsWith(":") ? props.label : `${props.label}:`;

  return (
    <strong
      className={cn(INLINE_GUIDANCE_LABEL_CLASS, props.className)}
      data-testid={props.testId}
    >
      {label}
    </strong>
  );
}
