import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WizardStepBaselineMetrics } from "@/components/wizard/steps/WizardStepBaselineMetrics";

describe("WizardStepBaselineMetrics", () => {
  it("renders required hours input and confidence select", () => {
    render(
      <WizardStepBaselineMetrics
        reviewCycleHours=""
        confidence="unsure"
        fieldError={null}
        onReviewCycleHoursChange={vi.fn()}
        onConfidenceChange={vi.fn()}
      />,
    );

    expect(screen.getByTestId("wizard-baseline-metrics-step")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-baseline-review-cycle-hours")).toBeRequired();
    expect(screen.getByTestId("wizard-baseline-confidence")).toBeInTheDocument();
    expect(screen.queryByTestId("wizard-baseline-metrics-skip")).not.toBeInTheDocument();
  });
});
