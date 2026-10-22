"use client";

import { cn } from "@/lib/utils";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { Button } from "@/components/ui/button";
import {
  ALERT_SIMULATION_BEHAVIOR_EMPTY_GETTING_STARTED,
  ALERT_SIMULATION_READINESS_RECENT_COUNT,
  ALERT_SIMULATION_READINESS_REVIEW_SCOPE,
  ALERT_SIMULATION_READINESS_THRESHOLD,
} from "@/lib/alert-simulation-form";
import {
  alertSimulationBehaviorEmptyLead,
  alertSimulationRunControlTitle,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  firstWhyDisabledCtaReason,
  whyDisabledIncompleteInput,
  type WhyDisabledCtaReason,
} from "@/lib/why-disabled-cta";

export const SIMPLE_RULE_TYPES = [
  { value: "CriticalRecommendationCount", label: "Critical / high recommendation count" },
  { value: "NewComplianceGapCount", label: "New compliance gap count" },
  { value: "CostIncreasePercent", label: "Cost increase %" },
  { value: "DeferredHighPriorityRecommendationAgeDays", label: "Deferred high-priority age (days)" },
  { value: "RejectedSecurityRecommendation", label: "Rejected security recommendation" },
  { value: "AcceptanceRateDrop", label: "Acceptance rate below %" },
] as const;

export const METRICS = [
  { value: "CriticalRecommendationCount", label: "Critical/high recommendation count" },
  { value: "NewComplianceGapCount", label: "New compliance gap count" },
  { value: "CostIncreasePercent", label: "Cost increase %" },
  { value: "DeferredHighPriorityRecommendationCount", label: "Deferred high-priority count" },
  { value: "RejectedSecurityRecommendationCount", label: "Rejected security recommendations" },
  { value: "AcceptanceRatePercent", label: "Acceptance rate %" },
] as const;

export const COND_OPS = [
  { value: "GreaterThanOrEqual", label: "≥" },
  { value: "GreaterThan", label: ">" },
  { value: "LessThanOrEqual", label: "≤" },
  { value: "LessThan", label: "<" },
] as const;

export const SEVERITIES = ["Info", "Warning", "High", "Critical"] as const;

export function SimulationBehaviorEmpty(): React.ReactElement {
  return (
    <div className="mt-2 grid max-w-xl gap-3">
      <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {alertSimulationBehaviorEmptyLead}
      </p>
      <GettingStartedSteps {...ALERT_SIMULATION_BEHAVIOR_EMPTY_GETTING_STARTED} />
    </div>
  );
}

export function resolveSimpleSimulationReadiness(
  hasSpecificReviewId: boolean,
  recentCountValid: boolean,
  thresholdValid: boolean,
  reviewScopeValid: boolean,
): WhyDisabledCtaReason | null {
  return firstWhyDisabledCtaReason([
    !thresholdValid ? whyDisabledIncompleteInput(ALERT_SIMULATION_READINESS_THRESHOLD) : null,
    !reviewScopeValid ? whyDisabledIncompleteInput(ALERT_SIMULATION_READINESS_REVIEW_SCOPE) : null,
    hasSpecificReviewId || recentCountValid
      ? null
      : whyDisabledIncompleteInput(ALERT_SIMULATION_READINESS_RECENT_COUNT),
  ]);
}

export type AlertSimulationRunButtonProps = {
  readonly testId: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly busy: boolean;
  readonly label: string;
  readonly readinessHintId?: string;
};

export function AlertSimulationRunButton(props: AlertSimulationRunButtonProps): React.ReactElement {
  return (
    <div className="inline-flex items-center gap-1 justify-self-start">
      <Button
        type="button"
        variant="primary"
        size="sm"
        data-testid={props.testId}
        onClick={props.onClick}
        disabled={props.disabled}
        aria-describedby={props.readinessHintId}
      >
        {props.busy ? "Running…" : props.label}
      </Button>
      <FieldHelpTooltip label={props.label} hint={alertSimulationRunControlTitle} />
    </div>
  );
}
