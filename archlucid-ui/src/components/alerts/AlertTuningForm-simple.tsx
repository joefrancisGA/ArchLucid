"use client";

import { Label } from "@/components/ui/label";
import { ALERT_TOOLING_FORM_SELECT_CLASS } from "@/lib/alert-simulation-form";
import type { Dispatch, SetStateAction } from "react";

const SIMPLE_RULE_TYPES = [
  { value: "CriticalRecommendationCount", label: "Critical / high recommendation count" },
  { value: "NewComplianceGapCount", label: "New compliance gap count" },
  { value: "CostIncreasePercent", label: "Cost increase %" },
  { value: "DeferredHighPriorityRecommendationAgeDays", label: "Deferred high-priority age (days)" },
  { value: "RejectedSecurityRecommendation", label: "Rejected security recommendation" },
  { value: "AcceptanceRateDrop", label: "Acceptance rate below %" },
];

export type AlertTuningFormSimpleProps = {
  readonly ruleType: string;
  readonly setRuleType: Dispatch<SetStateAction<string>>;
};

export function AlertTuningFormSimple(props: AlertTuningFormSimpleProps) {
  const { ruleType, setRuleType } = props;

  return (
    <div>
      <Label htmlFor="alert-tuning-simple-rule-type">Rule type (simple)</Label>
      <select
        id="alert-tuning-simple-rule-type"
        value={ruleType}
        onChange={(e) => setRuleType(e.target.value)}
        className={ALERT_TOOLING_FORM_SELECT_CLASS}
      >
        {SIMPLE_RULE_TYPES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
    </div>
  );
}
