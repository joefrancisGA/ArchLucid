import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepProgressMeter } from "@/components/ui/step-progress-meter";

describe("StepProgressMeter", () => {
  it("exposes the completion percentage and accessible name", () => {
    render(
      <StepProgressMeter
        completedCount={3}
        totalCount={7}
        label="First review progress"
        testId="meter"
      />,
    );

    const meter = screen.getByTestId("meter");

    expect(meter).toHaveAttribute("role", "progressbar");
    expect(meter).toHaveAttribute("aria-valuenow", "43");
    expect(meter).toHaveAttribute("aria-valuemin", "0");
    expect(meter).toHaveAttribute("aria-valuemax", "100");
    expect(meter).toHaveAccessibleName("First review progress");
  });

  it("prefers step wording over the raw percentage when value text is supplied", () => {
    render(
      <StepProgressMeter
        completedCount={0}
        totalCount={7}
        label="First review progress"
        valueText="0 of 7 steps complete"
        testId="meter"
      />,
    );

    expect(screen.getByTestId("meter")).toHaveAttribute("aria-valuetext", "0 of 7 steps complete");
  });
});
