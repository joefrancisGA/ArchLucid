"use client";

import type { ReactElement } from "react";

import { useWorkspaceMode } from "@/components/WorkspaceModeProvider";
import { StatusTag } from "@/components/ui/status-tag";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatInsightDensityBandLabel,
  INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE,
  resolveInsightDensityBand,
} from "@/lib/findings/insight-density-band";
import { cn } from "@/lib/utils";

export type FindingInsightDensityBandProps = {
  readonly insightDensityScore: number | null | undefined;
  readonly findingId: string;
  readonly className?: string;
  readonly showHonestyLine?: boolean;
};

function densityBandKind(
  bandId: "decision-grade" | "review" | "generic",
): "ready" | "needs-attention" | "neutral" {
  if (bandId === "decision-grade") {
    return "neutral";
  }

  if (bandId === "generic") {
    return "needs-attention";
  }

  return "neutral";
}

/** Compact Working-mode density band for review-detail finding rows (LI-01). */
export function FindingInsightDensityBand(props: FindingInsightDensityBandProps): ReactElement | null {
  const { isWorkingMode } = useWorkspaceMode();
  const band = resolveInsightDensityBand(props.insightDensityScore);
  const label = formatInsightDensityBandLabel(props.insightDensityScore);

  if (band === null || label === null) {
    return null;
  }

  const showHonestyLine = props.showHonestyLine === true || isWorkingMode;

  return (
    <div
      className={cn("flex flex-col gap-1", props.className)}
      data-testid={`finding-insight-density-band-${props.findingId}`}
    >
      <StatusTag
        kind={densityBandKind(band.id)}
        label={label}
        data-testid={`finding-insight-density-band-tag-${props.findingId}`}
        className="w-fit"
        aria-label={
          showHonestyLine ? `${label}. ${INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE}` : label
        }
      />
      {showHonestyLine ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          {INSIGHT_DENSITY_TYPED_ENGINE_HONESTY_LINE}
        </p>
      ) : null}
    </div>
  );
}
