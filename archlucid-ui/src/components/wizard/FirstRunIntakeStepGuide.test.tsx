import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FirstRunIntakeStepGuide } from "@/components/wizard/FirstRunIntakeStepGuide";

describe("FirstRunIntakeStepGuide", () => {
  it("marks the diagram step current when title is ready but evidence is not", () => {
    render(<FirstRunIntakeStepGuide titleReady evidenceReady={false} />);

    expect(screen.getByTestId("first-run-intake-step-name")).toHaveAttribute("data-step-state", "complete");
    expect(screen.getByTestId("first-run-intake-step-diagram")).toHaveAttribute("data-step-state", "current");
    expect(screen.getByTestId("first-run-intake-step-brief")).toHaveAttribute("data-step-state", "upcoming");
  });
});
