"use client";

import type { ReactElement } from "react";

import { useErrorRecoveryCareerHonesty } from "@/hooks/use-error-recovery-career-honesty";
import type { ErrorRecoveryCareerHonestyPresentation } from "@/lib/error-recovery/error-recovery-career-honesty";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type ErrorRecoveryCareerHonestyStripProps = {
  readonly scopedRunId?: string;
  readonly className?: string;
};

function ErrorRecoveryCareerHonestyStripView(props: {
  readonly presentation: ErrorRecoveryCareerHonestyPresentation;
  readonly className?: string;
}): ReactElement {
  const { presentation } = props;

  return (
    <div
      className={cn(DESIGN_TOKENS.callout.info, "mt-3 p-3", props.className)}
      data-testid="error-recovery-career-honesty-strip"
      role="status"
    >
      <p
        className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
        data-testid="error-recovery-career-honesty-title"
      >
        {presentation.title}
      </p>
      <p
        className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="error-recovery-career-honesty-body"
      >
        {presentation.body}
      </p>
    </div>
  );
}

/** CG-096 — recovery surfaces on Working do not promise Career after Retry. */
export function ErrorRecoveryCareerHonestyStrip(
  props: ErrorRecoveryCareerHonestyStripProps,
): ReactElement | null {
  const presentation = useErrorRecoveryCareerHonesty({
    scopedRunId: props.scopedRunId,
  });

  if (presentation === null) {
    return null;
  }

  return <ErrorRecoveryCareerHonestyStripView presentation={presentation} className={props.className} />;
}
