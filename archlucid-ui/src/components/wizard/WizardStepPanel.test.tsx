import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WizardStepPanel } from "./WizardStepPanel";

describe("WizardStepPanel", () => {
  it("renders title as heading and body content", () => {
    render(
      <WizardStepPanel title="Project details" description="Choose scope">
        <p>Child content</p>
      </WizardStepPanel>,
    );

    expect(screen.getByRole("heading", { level: 2, name: "Project details" })).toBeInTheDocument();
    expect(screen.getByText("Choose scope")).toBeInTheDocument();
    expect(screen.getByText("Child content")).toBeInTheDocument();
  });

  it("omits description when not provided", () => {
    render(
      <WizardStepPanel title="Only title">
        <span>Inner</span>
      </WizardStepPanel>,
    );

    expect(screen.getByRole("heading", { name: "Only title" })).toBeInTheDocument();
    expect(screen.getByText("Inner")).toBeInTheDocument();
  });
});
