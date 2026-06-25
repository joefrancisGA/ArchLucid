"use client";

import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import {
  ROI_DISPOSITION_TRAINING_TOOLTIP_HINT,
  ROI_DISPOSITION_TRAINING_TOOLTIP_LABEL,
} from "@/lib/roi-disposition-training-copy";

/** Inline help for disposition-aware headline vs per-system ROI semantics. */
export function RoiDispositionTrainingTooltip(): React.JSX.Element {
  return (
    <FieldHelpTooltip
      label={ROI_DISPOSITION_TRAINING_TOOLTIP_LABEL}
      hint={ROI_DISPOSITION_TRAINING_TOOLTIP_HINT}
    />
  );
}
