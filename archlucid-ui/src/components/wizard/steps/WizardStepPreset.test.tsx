import { fireEvent, render, screen, within } from "@testing-library/react";
import { useFormContext } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";

import { WizardStepPreset } from "@/components/wizard/steps/WizardStepPreset";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";
import { wizardPresets } from "@/lib/wizard-presets";
import type { WizardFormValues } from "@/lib/wizard-schema";

function FormValuesProbe() {
  const { watch } = useFormContext<WizardFormValues>();
  const systemName = watch("systemName");

  return <span data-testid="probe-system">{systemName}</span>;
}

describe("WizardStepPreset", () => {
  it("renders three preset cards plus start-from-scratch with labels and descriptions", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepPreset />
      </WizardFormTestHarness>,
    );

    expect(screen.getByRole("heading", { name: "Choose a starting point" })).toBeInTheDocument();

    for (const preset of wizardPresets) {
      expect(screen.getByText(preset.label)).toBeInTheDocument();
      expect(screen.getByText(preset.description)).toBeInTheDocument();
    }

    expect(screen.getByText("Start from scratch")).toBeInTheDocument();
    expect(screen.getByText("Reset the form to empty lists and placeholder text only.")).toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: "Select" })).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Use defaults" })).toBeInTheDocument();
  });

  it("calls onPresetSelect with the correct preset id when a preset Select is clicked", () => {
    const onPresetSelect = vi.fn();

    render(
      <WizardFormTestHarness>
        <WizardStepPreset onPresetSelect={onPresetSelect} />
      </WizardFormTestHarness>,
    );

    const greenfieldCard = screen.getByText("Greenfield web app").closest('[class*="rounded-xl"]');
    expect(greenfieldCard).toBeTruthy();
    const selectBtn = within(greenfieldCard as HTMLElement).getByRole("button", { name: "Select" });
    fireEvent.click(selectBtn);

    expect(onPresetSelect).toHaveBeenCalledTimes(1);
    expect(onPresetSelect).toHaveBeenCalledWith("greenfield-web-app");
  });

  it("merges preset values into the form when a preset is selected", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepPreset />
        <FormValuesProbe />
      </WizardFormTestHarness>,
    );

    const modernizeCard = screen.getByText("Modernize legacy system").closest('[class*="rounded-xl"]');
    expect(modernizeCard).toBeTruthy();
    fireEvent.click(within(modernizeCard as HTMLElement).getByRole("button", { name: "Select" }));

    expect(screen.getByTestId("probe-system")).toHaveTextContent("LegacyModernization");
  });

  it("Use defaults resets to buildDefaultWizardValues system name", () => {
    render(
      <WizardFormTestHarness
        values={{
          systemName: "CustomBefore",
        }}
      >
        <WizardStepPreset />
        <FormValuesProbe />
      </WizardFormTestHarness>,
    );

    expect(screen.getByTestId("probe-system")).toHaveTextContent("CustomBefore");

    fireEvent.click(screen.getByRole("button", { name: "Use defaults" }));

    expect(screen.getByTestId("probe-system")).toHaveTextContent("TargetSystem");
  });
});
