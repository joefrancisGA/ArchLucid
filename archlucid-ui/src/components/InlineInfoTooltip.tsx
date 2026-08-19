"use client";

import { FieldHelpTooltip, type FieldHelpTooltipProps } from "@/components/FieldHelpTooltip";

export type InlineInfoTooltipProps = FieldHelpTooltipProps;

/** Inline help icon for short label explanations — not for opening documentation pages. */
export function InlineInfoTooltip(props: InlineInfoTooltipProps): React.JSX.Element {
  return <FieldHelpTooltip {...props} />;
}
