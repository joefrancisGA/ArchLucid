import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WizardStepConstraints } from "@/components/wizard/steps/WizardStepConstraints";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("WizardStepConstraints", () => {
  it("adds a constraint badge from the draft input and Add button", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <WizardFormTestHarness>
          <WizardStepConstraints />
        </WizardFormTestHarness>
      </TooltipProvider>,
    );

    const draft = screen.getByLabelText("Constraints");
    fireEvent.change(draft, { target: { value: "Must stay in West US" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Add" })[0]);

    expect(screen.getByText("Must stay in West US")).toBeInTheDocument();
  });

  it("removes a constraint when its badge remove control is clicked", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <WizardFormTestHarness
          values={{
            constraints: ["One", "Two"],
          }}
        >
          <WizardStepConstraints />
        </WizardFormTestHarness>
      </TooltipProvider>,
    );

    expect(screen.getByText("One")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remove One" }));
    expect(screen.queryByText("One")).not.toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("manages required capabilities and assumptions chip lists independently", () => {
    render(
      <TooltipProvider delayDuration={0}>
        <WizardFormTestHarness>
          <WizardStepConstraints />
        </WizardFormTestHarness>
      </TooltipProvider>,
    );

    const adds = screen.getAllByRole("button", { name: "Add" });
    expect(adds).toHaveLength(3);

    fireEvent.change(screen.getByLabelText("Required capabilities"), {
      target: { value: "HTTPS only" },
    });
    fireEvent.click(adds[1]);
    expect(screen.getByText("HTTPS only")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Assumptions"), { target: { value: "Team knows Azure" } });
    fireEvent.click(adds[2]);
    expect(screen.getByText("Team knows Azure")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove Team knows Azure" }));
    expect(screen.queryByText("Team knows Azure")).not.toBeInTheDocument();
  });
});
