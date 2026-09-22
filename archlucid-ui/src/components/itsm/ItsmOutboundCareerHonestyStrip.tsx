"use client";

import type { ReactElement } from "react";

import { useItsmOutboundCareerHonesty } from "@/hooks/use-itsm-outbound-career-honesty";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ItsmOutboundCareerHonestyStripProps = {
  readonly scopedRunId?: string;
  readonly className?: string;
};

/** CG-038 — rehearsal honesty before native ITSM create on Working. */
export function ItsmOutboundCareerHonestyStrip(props: ItsmOutboundCareerHonestyStripProps): ReactElement | null {
  const presentation = useItsmOutboundCareerHonesty({
    scopedRunId: props.scopedRunId,
  });

  if (presentation === null) {
    return null;
  }

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "p-3", props.className)}
      data-testid="itsm-outbound-career-honesty-strip"
      role="status"
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        {presentation.rowLabel} — ITSM tickets will include rehearsal honesty
      </p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        Summary is prefixed with {presentation.summaryPrefix.trim()} and the description includes mode/door stamps
        before sync.
      </p>
    </div>
  );
}
