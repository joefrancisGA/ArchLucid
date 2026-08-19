import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  WIZARD_STICKY_PROGRESS_CLASS,
  WIZARD_STICKY_PROGRESS_TEST_ID,
} from "@/lib/wizard-sticky-progress";

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
    expect(screen.getAllByText("Scope").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Context").length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Review").length).toBeGreaterThanOrEqual(1);
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

  it("applies sticky progress chrome by default", () => {
    render(
      <WizardStepper steps={sampleSteps} currentStep={0} completedSteps={[]} />,
    );

    const nav = screen.getByTestId(WIZARD_STICKY_PROGRESS_TEST_ID);
    expect(nav).toHaveAttribute("aria-label", "Wizard progress");
    expect(nav.className).toContain("sticky");
    for (const token of WIZARD_STICKY_PROGRESS_CLASS.split(/\s+/).filter(Boolean)) {
      expect(nav.className.split(/\s+/)).toContain(token);
    }
  });

  it("omits sticky progress chrome when sticky is false", () => {
    render(
      <WizardStepper steps={sampleSteps} currentStep={0} completedSteps={[]} sticky={false} />,
    );

    expect(screen.queryByTestId(WIZARD_STICKY_PROGRESS_TEST_ID)).not.toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: "Wizard progress" });
    expect(nav.className.split(/\s+/)).not.toContain("sticky");
  });

  it("exposes step position as visible and screen-reader text (P0-6)", () => {
    render(
      <WizardStepper steps={sampleSteps} currentStep={1} completedSteps={[0]} />,
    );

    expect(screen.getAllByText("Step 2 of 3")).toHaveLength(2);
    expect(screen.getByRole("navigation", { name: "Wizard progress" })).toHaveTextContent("Step 2 of 3");
  });
});