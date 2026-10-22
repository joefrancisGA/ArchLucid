import { fireEvent, render, screen, within } from "@testing-library/react";
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
    submitManifestVersion: "1.0.0",
    setSubmitManifestVersion: vi.fn(),
    maxPersistedManifestVersion: null,
    submitSource: "test",
    setSubmitSource: vi.fn(),
    submitTarget: "prod",
    setSubmitTarget: vi.fn(),
    submitComment: "",
    setSubmitComment: vi.fn(),
    submitBusy: false,
    onSubmitApproval: vi.fn(),
    ...overrides,
  };

  return {
    ...render(<GovernanceWorkflowSubmitSection {...props} />),
    props,
  };
}

describe("GovernanceWorkflowSubmitSection", () => {
  it("renders Missing as a bold guidance label when required fields are empty", () => {
    renderSubmitSection({ submitTarget: "" });

    const readiness = screen.getByTestId("governance-submit-readiness");
    const missingLabel = within(readiness).getByText("Missing:");

    expect(missingLabel.tagName).toBe("STRONG");
    expect(missingLabel).toHaveClass(INLINE_GUIDANCE_LABEL_CLASS.split(" ")[0]);
    expect(readiness).toHaveTextContent("Missing: target environment.");
  });

  it("renders the persisted max version in a hidden field for client-side validation", () => {
    renderSubmitSection({ maxPersistedManifestVersion: "3.4.1" });

    expect(screen.getByTestId("governance-submit-max-manifest-version")).toHaveValue("3.4.1");
  });

  it("blocks submit when the version is below the persisted max", () => {
    renderSubmitSection({
      submitManifestVersion: "1.0.0",
      maxPersistedManifestVersion: "3.4.1",
    });

    expect(screen.getByTestId("governance-submit-approval-button")).toBeDisabled();
    expect(screen.getByTestId("governance-submit-version-validation")).toHaveTextContent(
      "cannot be lower than 3.4.1",
    );
  });

  it("blocks submit when the version is not numeric semver", () => {
    renderSubmitSection({
      submitManifestVersion: "v1.0.0",
      maxPersistedManifestVersion: null,
    });

    expect(screen.getByTestId("governance-submit-approval-button")).toBeDisabled();
    expect(screen.getByTestId("governance-submit-version-validation")).toHaveTextContent("numeric semver");
  });

  it("renders ready copy without a Missing label when required fields are complete", () => {
    renderSubmitSection({
      submitManifestVersion: "3.4.1",
      maxPersistedManifestVersion: "3.4.1",
      submitTarget: "prod",
    });

    const readiness = screen.getByTestId("governance-submit-readiness");

    expect(readiness).toHaveTextContent("Ready to submit.");
    expect(within(readiness).queryByText("Missing:")).not.toBeInTheDocument();
    expect(readiness.querySelector("strong")).toBeNull();
  });

  it("lets the operator override the prefilled version", () => {
    const setSubmitManifestVersion = vi.fn();

    renderSubmitSection({
      submitManifestVersion: "1.0.0",
      maxPersistedManifestVersion: null,
      setSubmitManifestVersion,
    });

    fireEvent.change(screen.getByLabelText(/Review record version/i), {
      target: { value: "2.0.0" },
    });

    expect(setSubmitManifestVersion).toHaveBeenCalledWith("2.0.0");
  });

  it("allows submit when the version is valid and environments are set", () => {
    renderSubmitSection({
      submitManifestVersion: "3.4.1",
      maxPersistedManifestVersion: "3.4.1",
    });

    expect(screen.getByTestId("governance-submit-approval-button")).toBeEnabled();
    expect(screen.getByTestId("governance-submit-readiness")).toHaveTextContent("Ready to submit.");
  });
});
