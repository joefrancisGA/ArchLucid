import { fireEvent, render, screen } from "@testing-library/react";
import { useFormContext } from "react-hook-form";
import { describe, expect, it } from "vitest";

import { WizardStepIdentity } from "@/components/wizard/steps/WizardStepIdentity";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";
import { TooltipProvider } from "@/components/ui/tooltip";

function SystemNameErrorProbe() {
  const { trigger } = useFormContext();

  return (
    <div>
      <button type="button" onClick={() => void trigger("systemName")}>
        validate-system
      </button>
    </div>
  );
}

function IdentityHarness() {
  return (
    <TooltipProvider delayDuration={0}>
      <WizardFormTestHarness>
        <WizardStepIdentity />
        <SystemNameErrorProbe />
      </WizardFormTestHarness>
    </TooltipProvider>
  );
}

describe("WizardStepIdentity", () => {
  it("renders system name, environment, cloud provider controls, and manifest baseline behind Advanced Options", () => {
    render(<IdentityHarness />);

    expect(screen.getByLabelText("System name")).toBeInTheDocument();
    expect(screen.getByText("Environment")).toBeInTheDocument();
    expect(screen.getByText("Cloud target")).toBeInTheDocument();
    expect(screen.queryByLabelText("Prior review record version (optional)")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /advanced options/i }));

    expect(screen.getByLabelText("Prior review record version (optional)")).toBeInTheDocument();
  });

  it("shows None as the default cloud target and lists Azure, Aws, and Gcp options", () => {
    render(<IdentityHarness />);

    const cloudTrigger = screen.getByRole("combobox", { name: /cloud target/i });
    expect(cloudTrigger).toHaveTextContent("No cloud / evidence-only");

    fireEvent.click(cloudTrigger);

    expect(screen.getByRole("option", { name: /Microsoft Azure/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Amazon Web Services/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /Google Cloud Platform/i })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /No cloud \/ evidence-only/i })).toBeInTheDocument();
    expect(screen.queryByText(/V1\.1/i)).not.toBeInTheDocument();
  });

  it("shows multi-cloud inventory guidance in the cloud target footer hint", () => {
    render(<IdentityHarness />);

    expect(
      screen.getByText(/Cloud inventory ZIPs for AWS, Azure, or GCP/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Azure export accelerates/i)).not.toBeInTheDocument();
  });

  it("surfaces a validation error when system name is cleared and validated", async () => {
    render(<IdentityHarness />);

    const input = screen.getByLabelText("System name");
    fireEvent.change(input, { target: { value: "" } });
    fireEvent.blur(input);

    fireEvent.click(screen.getByRole("button", { name: "validate-system" }));

    expect(await screen.findByText(/System name is required/i)).toBeInTheDocument();
  });
});
