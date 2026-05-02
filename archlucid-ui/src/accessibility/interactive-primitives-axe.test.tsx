import { render } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import { describe, expect, it } from "vitest";

import { StatusPill } from "@/components/StatusPill";
import type { WizardStepDefinition } from "@/components/wizard/WizardStepper";
import { WizardStepper } from "@/components/wizard/WizardStepper";

expect.extend(toHaveNoViolations);

const sampleWizardSteps: WizardStepDefinition[] = [
  { label: "Identity", description: "Name the system." },
  { label: "Context", description: "Upload context." },
  { label: "Review", description: "Submit request." },
];

describe("interactive primitives — axe (Vitest)", () => {
  it("WizardStepper has no axe violations", async () => {
    const { container } = render(
      <WizardStepper steps={sampleWizardSteps} currentStep={1} completedSteps={[0]} />,
    );

    expect(await axe(container)).toHaveNoViolations();
  });

  it("StatusPill has no axe violations", async () => {
    const { container } = render(<StatusPill status="Running" domain="pipeline" />);

    expect(await axe(container)).toHaveNoViolations();
  });
});
