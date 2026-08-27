import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION } from "@/lib/guided-intake-copy";

import { SocraticIntakeWizardStepConfirm } from "./SocraticIntakeWizardStepConfirm";

describe("SocraticIntakeWizardStepConfirm", () => {
  it("separates summary content from start-review actions in the card footer", () => {
    render(
      <SocraticIntakeWizardStepConfirm
        freeTextIntent="Vertex — Business outcome: faster and better."
        businessOutcome="faster and better"
        systemName="Vertex"
        guidedIntakeEvidencePresence={{
          architectureBrief: true,
          architectureDocument: false,
          cloudInventory: false,
          infrastructureAsCode: false,
          policyPackSelection: false,
        }}
        confirmedScopeLines={[]}
        submitError={null}
        policyPackCloudMismatch={null}
        busy={false}
        canSubmit
        onBack={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    const panel = screen.getByTestId("guided-intake-primary-panel");

    expect(screen.getByText(CREATE_REVIEW_PACKAGE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION)).toBeInTheDocument();
    expect(panel.querySelector('[class*="border-t"]')).toBeTruthy();
    expect(screen.getByTestId("socratic-submit")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back to questions" })).toBeInTheDocument();
  });
});
