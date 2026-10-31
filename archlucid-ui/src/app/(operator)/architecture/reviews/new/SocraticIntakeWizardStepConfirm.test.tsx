import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer/buyer-polish-copy";
import {
  EVIDENCE_STORED_IMAGE_DIAGRAM_NOT_READ,
} from "@/lib/evidence-gap-forecast";
import {
  GUIDED_INTAKE_CONFIRM_INTENT_NOT_STORED_YET,
  GUIDED_INTAKE_CONFIRM_OUTCOME_NOT_STORED_YET,
  GUIDED_INTAKE_CONFIRM_SYSTEM_NOT_STORED_YET,
  GUIDED_INTAKE_CONFIRMED_SCOPE_INFERRED_SUMMARY_HEADING,
  GUIDED_INTAKE_CONFIRMED_SCOPE_NOT_STORED,
  GUIDED_INTAKE_STEP2_SUBMIT_DESCRIPTION,
} from "@/lib/guided-intake-copy";
import { SCOPE_BRIEF_INFERRED_LINE_PREFIX } from "@/lib/architecture/architecture-scope-understanding-derive";

import { SocraticIntakeWizardStepConfirm } from "./SocraticIntakeWizardStepConfirm";

describe("SocraticIntakeWizardStepConfirm", () => {
  it("separates summary content from start-review actions in the card footer", () => {
    render(
      <SocraticIntakeWizardStepConfirm
        freeTextIntent="Vertex — Business outcome: faster and better."
        businessOutcome="faster and better"
        systemName="Vertex"
        guidedIntakeEvidencePresence={{
          hasArchitectureBrief: true,
          hasCloudInventory: false,
          hasInfrastructureAsCode: false,
          hasArchitectureDiagram: false,
          hasOperationalEvidence: false,
        }}
        guidedIntakeAttachmentFileNames={["sketch.png"]}
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
    expect(screen.getByTestId("guided-intake-confirmed-scope-not-stored")).toBeInTheDocument();
  });

  it("shows attachment honesty on confirm when only image uploads are present", () => {
    render(
      <SocraticIntakeWizardStepConfirm
        freeTextIntent="Vertex intent"
        businessOutcome="faster"
        systemName="Vertex"
        guidedIntakeEvidencePresence={{
          hasArchitectureBrief: true,
          hasCloudInventory: false,
          hasInfrastructureAsCode: false,
          hasArchitectureDiagram: false,
          hasOperationalEvidence: false,
        }}
        guidedIntakeAttachmentFileNames={["sketch.png"]}
        confirmedScopeLines={[]}
        submitError={null}
        policyPackCloudMismatch={null}
        busy={false}
        canSubmit
        onBack={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(screen.getByTestId("evidence-gap-forecast-attachment-honesty")).toHaveTextContent(
      EVIDENCE_STORED_IMAGE_DIAGRAM_NOT_READ,
    );
  });

  it("uses inferred scope heading and not-stored-yet copy for empty confirm fields (P-16, P-20)", () => {
    render(
      <SocraticIntakeWizardStepConfirm
        freeTextIntent="   "
        businessOutcome=""
        systemName="  "
        guidedIntakeEvidencePresence={{
          hasArchitectureBrief: true,
          hasCloudInventory: false,
          hasInfrastructureAsCode: false,
          hasArchitectureDiagram: false,
          hasOperationalEvidence: false,
        }}
        guidedIntakeAttachmentFileNames={[]}
        confirmedScopeLines={[`${SCOPE_BRIEF_INFERRED_LINE_PREFIX} edge API`]}
        submitError={null}
        policyPackCloudMismatch={null}
        busy={false}
        canSubmit
        onBack={() => undefined}
        onSubmit={() => undefined}
      />,
    );

    expect(screen.getByText(GUIDED_INTAKE_CONFIRMED_SCOPE_INFERRED_SUMMARY_HEADING)).toBeInTheDocument();
    expect(screen.getByText(GUIDED_INTAKE_CONFIRM_INTENT_NOT_STORED_YET)).toBeInTheDocument();
    expect(screen.getByText(GUIDED_INTAKE_CONFIRM_OUTCOME_NOT_STORED_YET)).toBeInTheDocument();
    expect(screen.getByText(GUIDED_INTAKE_CONFIRM_SYSTEM_NOT_STORED_YET)).toBeInTheDocument();
  });
});
