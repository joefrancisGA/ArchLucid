import type { ReactNode } from "react";

import { InlineGuidanceLabel } from "@/components/InlineGuidanceLabel";

export type InlineGuidanceProps = {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
  readonly labelTestId?: string;
};

/** Inline guidance sentence — emphasized label prefix with normal-weight body copy. */
export function InlineGuidance(props: InlineGuidanceProps) {
  return (
    <span className={props.className}>
      <InlineGuidanceLabel label={props.label} testId={props.labelTestId} /> {props.children}
    </span>
  );
}
