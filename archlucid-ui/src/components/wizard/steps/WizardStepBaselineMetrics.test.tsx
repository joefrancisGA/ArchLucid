import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WizardStepBaselineMetrics } from "@/components/wizard/steps/WizardStepBaselineMetrics";

describe("WizardStepBaselineMetrics", () => {
  it("renders hours input, confidence select, and skip control", () => {
    render(
      <WizardStepBaselineMetrics
        reviewCycleHours=""
        confidence="unsure"
        fieldError={null}
        onReviewCycleHoursChange={vi.fn()}
        onConfidenceChange={vi.fn()}
        onSkipForNow={vi.fn()}
      />,
    );

    expect(screen.getByTestId("wizard-baseline-metrics-step")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-baseline-review-cycle-hours")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-baseline-confidence")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-baseline-metrics-skip")).toBeInTheDocument();
  });

  it("calls skip without requiring hours", () => {
    const onSkipForNow = vi.fn();

    render(
      <WizardStepBaselineMetrics
        reviewCycleHours=""
        confidence="unsure"
        fieldError={null}
        onReviewCycleHoursChange={vi.fn()}
        onConfidenceChange={vi.fn()}
        onSkipForNow={onSkipForNow}
      />,
    );

    fireEvent.click(screen.getByTestId("wizard-baseline-metrics-skip"));

    expect(onSkipForNow).toHaveBeenCalledTimes(1);
  });
});
