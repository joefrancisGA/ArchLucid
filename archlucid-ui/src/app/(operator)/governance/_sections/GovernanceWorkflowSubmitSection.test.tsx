import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GovernanceWorkflowSubmitSection } from "./GovernanceWorkflowSubmitSection";

function renderSubmitSection(
  overrides: Partial<React.ComponentProps<typeof GovernanceWorkflowSubmitSection>> = {},
) {
  const setSubmitManifestVersion = vi.fn();

  render(
    <GovernanceWorkflowSubmitSection
      buyerPolishedShell={false}
      buyerSuppressGovernanceSubmitChrome={false}
      canMutateWorkflow
      hideGovernanceQueryLoadCard={false}
      submitRunId="run-1"
      setSubmitRunId={vi.fn()}
      submitManifestVersion="1.0.0"
      setSubmitManifestVersion={setSubmitManifestVersion}
      maxPersistedManifestVersion={null}
      submitSource="test"
      setSubmitSource={vi.fn()}
      submitTarget="prod"
      setSubmitTarget={vi.fn()}
      submitComment=""
      setSubmitComment={vi.fn()}
      submitBusy={false}
      onSubmitApproval={vi.fn()}
      {...overrides}
    />,
  );

  return { setSubmitManifestVersion };
}

describe("GovernanceWorkflowSubmitSection manifest version", () => {
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
    expect(screen.getByTestId("governance-submit-version-validation")).toHaveTextContent(
      "numeric semver",
    );
  });

  it("allows submit when the version is valid and environments are set", () => {
    renderSubmitSection({
      submitManifestVersion: "3.4.1",
      maxPersistedManifestVersion: "3.4.1",
    });

    expect(screen.getByTestId("governance-submit-approval-button")).toBeEnabled();
    expect(screen.getByTestId("governance-submit-readiness")).toHaveTextContent("Ready to submit.");
  });

  it("lets the operator override the prefilled version", () => {
    const { setSubmitManifestVersion } = renderSubmitSection({
      submitManifestVersion: "1.0.0",
      maxPersistedManifestVersion: null,
    });

    fireEvent.change(screen.getByLabelText(/Review record version/i), {
      target: { value: "2.0.0" },
    });

    expect(setSubmitManifestVersion).toHaveBeenCalledWith("2.0.0");
  });
});
