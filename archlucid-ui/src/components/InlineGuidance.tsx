import type { ReactNode } from "react";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";
import { capitalizeInlineGuidanceBody } from "@/lib/inline-guidance-labels";

export type InlineGuidanceProps = {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly labelTestId?: string;
};

/** Inline guidance sentence — emphasized label prefix with normal-weight body copy. */
export function InlineGuidance(props: InlineGuidanceProps) {
  const body =
    typeof props.children === "string"
      ? capitalizeInlineGuidanceBody(props.label, props.children)
      : props.children;

  return (
    <span className={props.className}>
      <InlineGuidanceLabel label={props.label} testId={props.labelTestId} /> {body}
    </span>
  );
}
