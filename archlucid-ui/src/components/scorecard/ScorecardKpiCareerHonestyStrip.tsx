"use client";

import type { ReactElement } from "react";

import { useScorecardKpiCareerHonesty } from "@/hooks/use-scorecard-kpi-career-honesty";
import type { ScorecardKpiCareerHonestyPresentation } from "@/lib/scorecard/scorecard-kpi-career-honesty";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ScorecardKpiCareerHonestyStripProps = {
  readonly className?: string;
  readonly isSample?: boolean;
  readonly scopedRunId?: string;
};

function ScorecardKpiCareerHonestyStripView(props: {
  readonly presentation: ScorecardKpiCareerHonestyPresentation;
  readonly className?: string;
}): ReactElement {
  const { presentation } = props;

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "p-4", props.className)}
      data-testid="scorecard-kpi-career-honesty-strip"
      role="status"
    >
      <p
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="scorecard-kpi-career-honesty-title"
      >
        {presentation.title}
      </p>
      <p
        className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="scorecard-kpi-career-honesty-body"
      >
        {presentation.body}
      </p>
    </div>
  );
}

/** CG-034 — rehearsal honesty above architecture scorecard KPI grid on Working. */
export function ScorecardKpiCareerHonestyStrip(props: ScorecardKpiCareerHonestyStripProps): ReactElement | null {
  const presentation = useScorecardKpiCareerHonesty({
    isSample: props.isSample,
    scopedRunId: props.scopedRunId,
  });

  if (presentation === null) {
    return null;
  }

  return <ScorecardKpiCareerHonestyStripView presentation={presentation} className={props.className} />;
}
