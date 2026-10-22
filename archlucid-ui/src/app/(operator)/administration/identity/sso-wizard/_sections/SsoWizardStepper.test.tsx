import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WIZARD_STICKY_PROGRESS_CLASS } from "@/lib/wizard-sticky-progress";

import { SsoWizardStepper } from "./SsoWizardStepper";

describe("SsoWizardStepper", () => {
  it("applies sticky progress chrome by default", () => {
    render(<SsoWizardStepper currentStep={0} completedSteps={[]} />);

    const nav = screen.getByTestId("sso-wizard-stepper");
    expect(nav.className).toContain("sticky");
    for (const token of WIZARD_STICKY_PROGRESS_CLASS.split(/\s+/).filter(Boolean)) {
      expect(nav.className.split(/\s+/)).toContain(token);
    }
  });

  it("omits sticky progress chrome when sticky is false", () => {
    render(<SsoWizardStepper currentStep={0} completedSteps={[]} sticky={false} />);

    const nav = screen.getByTestId("sso-wizard-stepper");
    expect(nav.className.split(/\s+/)).not.toContain("sticky");
  });

  it("renders completed steps as navigable buttons", () => {
    const onStepSelect = vi.fn();

    render(<SsoWizardStepper currentStep={2} completedSteps={[0, 1]} onStepSelect={onStepSelect} sticky={false} />);

    fireEvent.click(screen.getByTestId("sso-wizard-step-button-0"));
    expect(onStepSelect).toHaveBeenCalledWith(0);
    expect(screen.getByTestId("sso-wizard-step-announcement")).toHaveTextContent("Step 3 of 6");
  });

  it("lists Identity provider as step 0 before Protocol", () => {
    render(<SsoWizardStepper currentStep={0} completedSteps={[]} sticky={false} />);

    const labels = screen.getAllByRole("listitem").map((item) => item.textContent ?? "");
    expect(labels[0]).toMatch(/Identity provider/i);
    expect(labels[1]).toMatch(/Protocol/i);
  });
});
