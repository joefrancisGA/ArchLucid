"use client";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  ROI_HEADLINE_MATH_TOOLTIP_HINT,
  ROI_HEADLINE_MATH_TOOLTIP_LABEL,
} from "@/lib/roi-disposition-training-copy";

/** Inline help for disposition-aware, FindingId-deduplicated portfolio headline savings. */
export function RoiHeadlineMathTooltip(): React.JSX.Element {
  return (
    <FieldHelpTooltip
      label={ROI_HEADLINE_MATH_TOOLTIP_LABEL}
      hint={ROI_HEADLINE_MATH_TOOLTIP_HINT}
    />
  );
}
