import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { INLINE_GUIDANCE_LABEL_CLASS } from "@/lib/design-tokens";

import {
  GovernanceWorkflowSubmitSection,
  type GovernanceWorkflowSubmitSectionProps,
} from "./GovernanceWorkflowSubmitSection";

vi.mock("@/components/AskRunIdPicker", () => ({
  AskRunIdPicker: (props: { value: string }) => <div data-testid="ask-run-id-picker">{props.value}</div>,
}));

function renderSubmitSection(overrides: Partial<GovernanceWorkflowSubmitSectionProps> = {}) {
  const props: GovernanceWorkflowSubmitSectionProps = {
    buyerPolishedShell: false,
    buyerSuppressGovernanceSubmitChrome: false,
    canMutateWorkflow: true,
    hideGovernanceQueryLoadCard: false,
    submitRunId: "run-1",
    setSubmitRunId: vi.fn(),
    submitManifestVersion: "",
    setSubmitManifestVersion: vi.fn(),
    submitSource: "test",
    setSubmitSource: vi.fn(),
    submitTarget: "",
    setSubmitTarget: vi.fn(),
    submitComment: "",
    setSubmitComment: vi.fn(),
    submitBusy: false,
    onSubmitApproval: vi.fn(),
    ...overrides,
  };

  return render(<GovernanceWorkflowSubmitSection {...props} />);
}

describe("GovernanceWorkflowSubmitSection", () => {
  it("renders Missing as a bold guidance label when required fields are empty", () => {
    renderSubmitSection();

    const readiness = screen.getByTestId("governance-submit-readiness");
    const missingLabel = within(readiness).getByText("Missing:");

    expect(missingLabel.tagName).toBe("STRONG");
    expect(missingLabel).toHaveClass(INLINE_GUIDANCE_LABEL_CLASS.split(" ")[0]);
    expect(readiness).toHaveTextContent("Missing: review record version, target environment.");
  });

  it("renders ready copy without a Missing label when required fields are complete", () => {
    renderSubmitSection({
      submitManifestVersion: "v1.0.0",
      submitTarget: "prod",
    });

    const readiness = screen.getByTestId("governance-submit-readiness");

    expect(readiness).toHaveTextContent("Ready to submit.");
    expect(within(readiness).queryByText("Missing:")).not.toBeInTheDocument();
    expect(within(readiness).queryByRole("strong")).not.toBeInTheDocument();
  });
});
