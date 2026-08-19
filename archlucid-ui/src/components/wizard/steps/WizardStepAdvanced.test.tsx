import { fireEvent, render, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WizardStepAdvanced } from "@/components/wizard/steps/WizardStepAdvanced";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";
import { TooltipProvider } from "@/components/ui/tooltip";

describe("WizardStepAdvanced", () => {
  it("keeps the Radix Advanced Options panel closed by default", () => {
    const { container, getByRole } = render(
      <TooltipProvider delayDuration={0}>
        <WizardFormTestHarness>
          <WizardStepAdvanced />
        </WizardFormTestHarness>
      </TooltipProvider>,
    );

    const advancedTrigger = getByRole("button", { name: /advanced options/i });
    expect(advancedTrigger.getAttribute("aria-expanded")).toBe("false");

    // Nested <details> sections mount only when the outer Radix collapsible is open.
    expect(container.querySelectorAll("details").length).toBe(0);

    fireEvent.click(advancedTrigger);
    const details = container.querySelectorAll("details");
    expect(details.length).toBeGreaterThanOrEqual(5);
    details.forEach((el) => {
      expect(el).not.toHaveAttribute("open");
    });
  });

  it("reveals nested policy reference input after opening Advanced Options and the policy section", () => {
    const { container, getByRole } = render(
      <TooltipProvider delayDuration={0}>
        <WizardFormTestHarness>
          <WizardStepAdvanced />
        </WizardFormTestHarness>
      </TooltipProvider>,
    );

    fireEvent.click(getByRole("button", { name: /advanced options/i }));

    const policyDetails = Array.from(container.querySelectorAll("details")).find((d) =>
      d.textContent?.includes("Policy references"),
    );
    expect(policyDetails).toBeTruthy();

    const summary = policyDetails!.querySelector("summary");
    expect(summary).toBeTruthy();
    fireEvent.click(summary!);

    const policyInput = document.getElementById("wizard-policy-draft");
    expect(policyInput).toBeTruthy();
    expect(policyInput).toBeVisible();
  });

  it("shows a count badge on the policy header after adding a reference", () => {
    const { container, getByRole } = render(
      <TooltipProvider delayDuration={0}>
        <WizardFormTestHarness>
          <WizardStepAdvanced />
        </WizardFormTestHarness>
      </TooltipProvider>,
    );

    fireEvent.click(getByRole("button", { name: /advanced options/i }));

    const policyDetails = Array.from(container.querySelectorAll("details")).find((d) =>
      d.textContent?.includes("Policy references"),
    );
    expect(policyDetails).toBeTruthy();
    fireEvent.click(policyDetails!.querySelector("summary")!);

    const policyInput = document.getElementById("wizard-policy-draft") as HTMLInputElement;
    fireEvent.change(policyInput, { target: { value: "policy-pack:enterprise-default" } });
    fireEvent.click(within(policyDetails as HTMLElement).getByRole("button", { name: "Add" }));

    const summaryBadge = policyDetails!.querySelector("summary .font-mono");
    expect(summaryBadge).toHaveTextContent("1");
  });
});
