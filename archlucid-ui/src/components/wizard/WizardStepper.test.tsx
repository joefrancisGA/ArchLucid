import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WizardStepper } from "./WizardStepper";

const sampleSteps = [
  { label: "Scope", description: "Tenant and project" },
  { label: "Context", description: "Upload context" },
  { label: "Review" },
];

describe("WizardStepper", () => {
  it("renders navigation with list items for each step", () => {
    render(
      <WizardStepper steps={sampleSteps} currentStep={0} completedSteps={[]} />,
    );

    expect(screen.getByRole("navigation", { name: "Wizard progress" })).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Scope")).toBeInTheDocument();
    expect(screen.getByText("Context")).toBeInTheDocument();
    expect(screen.getByText("Review")).toBeInTheDocument();
  });

  it("sets aria-current=step only on the active step", () => {
    render(
      <WizardStepper steps={sampleSteps} currentStep={1} completedSteps={[0]} />,
    );

    const items = screen.getAllByRole("listitem");
    expect(items[0]).not.toHaveAttribute("aria-current");
    expect(items[1]).toHaveAttribute("aria-current", "step");
    expect(items[2]).not.toHaveAttribute("aria-current");
  });

  it("renders step numbers 1-based in circles", () => {
    render(
      <WizardStepper steps={sampleSteps} currentStep={0} completedSteps={[]} />,
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
