"use client";

import { InlineHelp } from "@/components/InlineHelp";
import {
  ROI_HEADLINE_MATH_TOOLTIP_HINT,
  ROI_HEADLINE_MATH_TOOLTIP_LABEL,
} from "@/lib/roi-disposition-training-copy";

/** Inline help for disposition-aware, FindingId-deduplicated portfolio headline savings. */
export function RoiHeadlineMathTooltip(): React.JSX.Element {
  return (
    <InlineHelp
      label={ROI_HEADLINE_MATH_TOOLTIP_LABEL}
      hint={ROI_HEADLINE_MATH_TOOLTIP_HINT}
    />
  );
}
