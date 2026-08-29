import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StagedProgressStepList } from "@/components/progress/StagedProgressStepList";

describe("StagedProgressStepList", () => {
  const steps = [
    { id: "first", label: "First step" },
    { id: "second", label: "Second step" },
    { id: "third", label: "Third step" },
  ];

  it("marks the active step with aria-current", () => {
    render(<StagedProgressStepList steps={steps} activeStepIndex={1} />);

    expect(screen.getByText(/Second step/)).toHaveAttribute("aria-current", "step");
    expect(screen.getByText(/First step/)).toHaveTextContent(/^✓ /);
    expect(screen.getByText(/Third step/)).toHaveTextContent(/^· /);
  });

  it("renders every step as complete when allComplete is true", () => {
    render(<StagedProgressStepList steps={steps} activeStepIndex={0} allComplete />);

    expect(screen.getByText(/First step/)).toHaveTextContent(/^✓ /);
    expect(screen.getByText(/Second step/)).toHaveTextContent(/^✓ /);
    expect(screen.getByText(/Third step/)).toHaveTextContent(/^✓ /);
  });
});
