"use client";

import { Button } from "@/components/ui/button";
import {
  GOVERNANCE_INFRASTRUCTURE_DRIFT_RESUME_LAST_COMPARISON_ACTION_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_RESUME_LAST_COMPARISON_BODY,
  GOVERNANCE_INFRASTRUCTURE_DRIFT_RESUME_LAST_COMPARISON_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { OPERATOR_RESUME, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type DriftResumeLastComparisonRowProps = {
  readonly onResume: () => void;
};

export function DriftResumeLastComparisonRow(props: DriftResumeLastComparisonRowProps): React.JSX.Element {
  return (
    <section
      aria-labelledby="infra-drift-resume-last-comparison-heading"
      className={OPERATOR_RESUME.stripSpaced}
      data-testid="infra-drift-resume-last-comparison-row"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="infra-drift-resume-last-comparison-heading"
            className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
          >
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_RESUME_LAST_COMPARISON_TITLE}
          </h2>
          <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {GOVERNANCE_INFRASTRUCTURE_DRIFT_RESUME_LAST_COMPARISON_BODY}
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          data-testid="infra-drift-resume-last-comparison-open"
          onClick={props.onResume}
        >
          {GOVERNANCE_INFRASTRUCTURE_DRIFT_RESUME_LAST_COMPARISON_ACTION_LABEL}
        </Button>
      </div>
    </section>
  );
}
