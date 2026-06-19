"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WizardStepPanel } from "@/components/wizard/WizardStepPanel";
import {
  WIZARD_BASELINE_CONFIDENCE_OPTIONS,
  type WizardBaselineConfidence,
} from "@/lib/wizard-baseline-confidence";

export type WizardStepBaselineMetricsProps = {
  reviewCycleHours: string;
  confidence: WizardBaselineConfidence;
  onReviewCycleHoursChange: (value: string) => void;
  onConfidenceChange: (value: WizardBaselineConfidence) => void;
  fieldError: string | null;
};

/** Required ROI baseline capture before review submit in pilot wizards (TB-238). */
export function WizardStepBaselineMetrics(props: WizardStepBaselineMetricsProps) {
  const {
    reviewCycleHours,
    confidence,
    onReviewCycleHoursChange,
    onConfidenceChange,
    fieldError,
  } = props;

  return (
    <WizardStepPanel
      title="Baseline metrics (for ROI reporting)"
      description="Capture how long architecture reviews take today so your first-value report can show time savings with buyer-provided labels."
    >
      <div className="space-y-4" data-testid="wizard-baseline-metrics-step">
        <div className="space-y-2">
          <Label htmlFor="wizard-baseline-review-cycle-hours">
            Current review cycle time (hours) <span className="text-red-600">*</span>
          </Label>
          <Input
            id="wizard-baseline-review-cycle-hours"
            inputMode="decimal"
            placeholder="e.g. 40"
            value={reviewCycleHours}
            required
            data-testid="wizard-baseline-review-cycle-hours"
            onChange={(event) => {
              onReviewCycleHoursChange(event.target.value);
            }}
          />
          <p className="m-0 text-xs text-neutral-600 dark:text-neutral-400">
            How many hours does a typical architecture review currently take your team (request to approved
            manifest)? Required for sponsor-ready ROI reporting in your first-value report.
          </p>
          {fieldError !== null ? (
            <p className="m-0 text-sm text-red-600" role="alert" data-testid="wizard-baseline-metrics-error">
              {fieldError}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="wizard-baseline-confidence">How confident are you in this estimate?</Label>
          <select
            id="wizard-baseline-confidence"
            className="flex h-10 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950"
            value={confidence}
            data-testid="wizard-baseline-confidence"
            onChange={(event) => {
              onConfidenceChange(event.target.value as WizardBaselineConfidence);
            }}
          >
            {WIZARD_BASELINE_CONFIDENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </WizardStepPanel>
  );
}
