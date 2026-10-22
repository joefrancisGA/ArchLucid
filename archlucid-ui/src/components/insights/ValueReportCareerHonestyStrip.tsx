"use client";

import type { ReactElement } from "react";

import { useValueReportCareerHonesty } from "@/hooks/use-value-report-career-honesty";
import type { ValueReportCareerHonestyPresentation } from "@/lib/insights/value-report-career-honesty";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ValueReportCareerHonestyStripProps = {
  readonly className?: string;
  readonly isSample?: boolean;
  readonly scopedRunId?: string;
  readonly contributingRunIds?: readonly string[];
};

function ValueReportCareerHonestyStripView(props: {
  readonly presentation: ValueReportCareerHonestyPresentation;
  readonly className?: string;
}): ReactElement {
  const { presentation } = props;

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "p-4", props.className)}
      data-testid="value-report-career-honesty-strip"
      role="status"
    >
      <p
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="value-report-career-honesty-title"
      >
        {presentation.title}
      </p>
      <p
        className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="value-report-career-honesty-body"
      >
        {presentation.body}
      </p>
    </div>
  );
}

/** CG-090 — route-level sponsor value-report honesty on Working (deep links + period mix). */
export function ValueReportCareerHonestyStrip(
  props: ValueReportCareerHonestyStripProps,
): ReactElement | null {
  const presentation = useValueReportCareerHonesty({
    isSample: props.isSample,
    scopedRunId: props.scopedRunId,
    contributingRunIds: props.contributingRunIds,
  });

  if (presentation === null) {
    return null;
  }

  return <ValueReportCareerHonestyStripView presentation={presentation} className={props.className} />;
}
