import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WizardStepAzureContext } from "@/components/wizard/steps/WizardStepAzureContext";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";
import { DEV_SCOPE_TENANT_ID } from "@/lib/scope";

const writeTextMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("WizardStepAzureContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });
  });

  it("renders the optional enrichment heading", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext />
      </WizardFormTestHarness>,
    );

    expect(screen.getByRole("heading", { name: "Optional evidence enrichment" })).toBeInTheDocument();
  });

  it("renders helper copy indicating the brief is sufficient without uploading", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext />
      </WizardFormTestHarness>,
    );

    expect(
      screen.getByText(/continue with the pasted architecture brief without uploading anything/i),
    ).toBeInTheDocument();
  });

  it("renders the Azure ZIP disclosure toggle labeled 'Add Azure inventory ZIP'", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext />
      </WizardFormTestHarness>,
    );

    expect(screen.getByTestId("wizard-azure-optional-toggle")).toBeInTheDocument();
    expect(screen.getByText("Add Azure inventory ZIP")).toBeInTheDocument();
    expect(screen.getByText("optional")).toBeInTheDocument();
  });

  it("starts with the Azure ZIP section collapsed (aria-expanded=false)", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext />
      </WizardFormTestHarness>,
    );

    const toggle = screen.getByTestId("wizard-azure-optional-toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("expands the Azure ZIP section when the toggle is clicked", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext />
      </WizardFormTestHarness>,
    );

    const toggle = screen.getByTestId("wizard-azure-optional-toggle");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("shows the extractor command with the active tenant id prefilled and copies it", async () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext />
      </WizardFormTestHarness>,
    );

    fireEvent.click(screen.getByTestId("wizard-azure-optional-toggle"));

    await waitFor(() => {
      expect(screen.getByText(new RegExp(`-SubscriptionId '${DEV_SCOPE_TENANT_ID}'`))).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("wizard-azure-ingest-copy"));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
    });

    const copied = String(writeTextMock.mock.calls[0]?.[0] ?? "");

    expect(copied).toContain(`-SubscriptionId '${DEV_SCOPE_TENANT_ID}'`);
    expect(copied).toContain("-IncludeCost");
    expect(copied).toContain("Get-ArchLucidAzurePackage.ps1");
  });
});
