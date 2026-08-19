import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { capitalizeInlineGuidanceBody, parseLeadingInlineGuidanceLabel } from "@/lib/inline-guidance-labels";

export type InlineGuidanceTextProps = {
  readonly text: string;
  readonly className?: string;
};

/**
 * Renders plain copy, emphasizing a leading guidance label when present.
 * Use for string data (empty-state steps, readiness summaries, layer notes).
 */
export function InlineGuidanceText(props: InlineGuidanceTextProps): ReactNode {
  const parsed = parseLeadingInlineGuidanceLabel(props.text);

  if (parsed === null) {
    return <span className={props.className}>{props.text}</span>;
  }

  const body = capitalizeInlineGuidanceBody(parsed.label, parsed.body);

  return (
    <span className={cn(props.className)}>
      <InlineGuidanceLabel label={parsed.label} /> {body}
    </span>
  );
}
