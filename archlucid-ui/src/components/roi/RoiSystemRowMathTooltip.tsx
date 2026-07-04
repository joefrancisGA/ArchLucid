"use client";

import { InlineHelp } from "@/components/InlineHelp";
import {
  ROI_SYSTEM_ROW_MATH_TOOLTIP_HINT,
  ROI_SYSTEM_ROW_MATH_TOOLTIP_LABEL,
} from "@/lib/roi-disposition-training-copy";

/** Inline help explaining why per-system savings rows do not sum to the portfolio headline. */
export function RoiSystemRowMathTooltip(): React.JSX.Element {
  return (
    <InlineHelp
      label={ROI_SYSTEM_ROW_MATH_TOOLTIP_LABEL}
      hint={ROI_SYSTEM_ROW_MATH_TOOLTIP_HINT}
    />
  );
}
