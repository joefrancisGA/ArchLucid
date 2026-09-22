"use client";

import type { ReactElement } from "react";

import { useRoiTileCareerHonesty } from "@/hooks/use-roi-tile-career-honesty";
import type { RoiTileCareerHonestyPresentation } from "@/lib/roi/roi-tile-career-honesty";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type RoiTileCareerHonestyStripProps = {
  readonly className?: string;
  readonly isSample?: boolean;
  readonly scopedRunId?: string;
};

function RoiTileCareerHonestyStripView(props: {
  readonly presentation: RoiTileCareerHonestyPresentation;
  readonly className?: string;
}): ReactElement {
  const { presentation } = props;

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "p-4", props.className)}
      data-testid="roi-tile-career-honesty-strip"
      role="status"
    >
      <p
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="roi-tile-career-honesty-title"
      >
        {presentation.title}
      </p>
      <p
        className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="roi-tile-career-honesty-body"
      >
        {presentation.body}
      </p>
    </div>
  );
}

/** CG-035 — rehearsal honesty above ROI / value-report tiles on Working. */
export function RoiTileCareerHonestyStrip(props: RoiTileCareerHonestyStripProps): ReactElement | null {
  const presentation = useRoiTileCareerHonesty({
    isSample: props.isSample,
    scopedRunId: props.scopedRunId,
  });

  if (presentation === null) {
    return null;
  }

  return <RoiTileCareerHonestyStripView presentation={presentation} className={props.className} />;
}
