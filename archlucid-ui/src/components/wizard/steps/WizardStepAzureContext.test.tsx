import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WizardStepAzureContext } from "@/components/wizard/steps/WizardStepAzureContext";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";
import { WIZARD_CLOUD_PROVIDER_OPTIONS } from "@/lib/cloud-neutral-primary-copy";
import { DEV_SCOPE_TENANT_ID } from "@/lib/scope";

const writeTextMock = vi.fn().mockResolvedValue(undefined);

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("WizardStepAzureContext", () => {
  const baseProps = {
    pendingFile: null,
    onPendingFileChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(navigator, {
      clipboard: { writeText: writeTextMock },
    });
  });

  it("renders the optional enrichment heading", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext {...baseProps} />
      </WizardFormTestHarness>,
    );

    expect(screen.getByRole("heading", { name: "Optional evidence enrichment" })).toBeInTheDocument();
  });

  it("renders helper copy indicating the brief is sufficient without uploading", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext {...baseProps} />
      </WizardFormTestHarness>,
    );

    expect(
      screen.getByText(/continue with the pasted architecture brief without uploading anything/i),
    ).toBeInTheDocument();
  });

  it("renders the inventory ZIP disclosure toggle without Azure-only labeling", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext {...baseProps} />
      </WizardFormTestHarness>,
    );

    expect(screen.getByTestId("wizard-azure-optional-toggle")).toBeInTheDocument();
    expect(screen.getByText("Add cloud inventory ZIP")).toBeInTheDocument();
    expect(screen.queryByText("Add Azure inventory ZIP")).not.toBeInTheDocument();
    expect(screen.getByText("optional")).toBeInTheDocument();
  });

  it("starts with the inventory ZIP section collapsed (aria-expanded=false)", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext {...baseProps} />
      </WizardFormTestHarness>,
    );

    const toggle = screen.getByTestId("wizard-azure-optional-toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
  });

  it("expands the inventory ZIP section when the toggle is clicked", () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext {...baseProps} />
      </WizardFormTestHarness>,
    );

    const toggle = screen.getByTestId("wizard-azure-optional-toggle");

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  it("does not show the Azure inventory command when cloud target is None until a provider is selected", async () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext {...baseProps} />
      </WizardFormTestHarness>,
    );

    fireEvent.click(screen.getByTestId("wizard-azure-optional-toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-inventory-select-cloud-hint")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("wizard-cloud-inventory-ingest-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("wizard-cloud-inventory-ingest-command")).not.toBeInTheDocument();
  });

  it("shows the Azure inventory command after selecting Azure in the optional inventory picker", async () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext {...baseProps} />
      </WizardFormTestHarness>,
    );

    fireEvent.click(screen.getByTestId("wizard-azure-optional-toggle"));

    fireEvent.click(screen.getByTestId("wizard-inventory-cloud-target-select"));
    fireEvent.click(await screen.findByRole("option", { name: WIZARD_CLOUD_PROVIDER_OPTIONS.azure }));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-ingest-extractor-panel")).toHaveAttribute("data-platform", "azure");
    });

    expect(screen.getByTestId("wizard-ingest-extractor-command")).toHaveTextContent(
      new RegExp(`-SubscriptionId '${DEV_SCOPE_TENANT_ID}'`),
    );
  });

  it("shows the AWS Tier-1 ZIP upload panel when cloud target is Aws", async () => {
    render(
      <WizardFormTestHarness values={{ cloudProvider: "Aws" }}>
        <WizardStepAzureContext {...baseProps} />
      </WizardFormTestHarness>,
    );

    fireEvent.click(screen.getByTestId("wizard-azure-optional-toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("tier1-inventory-upload-panel-aws")).toBeInTheDocument();
    });

    expect(screen.getByTestId("wizard-enrichment-upload-dropzone")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-cloud-inventory-ingest-command")).toHaveTextContent(
      "Get-ArchLucidAwsPackage.ps1",
    );
  });

  it("shows the GCP Tier-1 ZIP upload panel when cloud target is Gcp", async () => {
    render(
      <WizardFormTestHarness values={{ cloudProvider: "Gcp" }}>
        <WizardStepAzureContext {...baseProps} />
      </WizardFormTestHarness>,
    );

    fireEvent.click(screen.getByTestId("wizard-azure-optional-toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("tier1-inventory-upload-panel-gcp")).toBeInTheDocument();
    });

    expect(screen.getByTestId("wizard-enrichment-upload-dropzone")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-cloud-inventory-ingest-command")).toHaveTextContent(
      "Get-ArchLucidGcpPackage.ps1",
    );
  });

  it("copies the active cloud inventory command", async () => {
    render(
      <WizardFormTestHarness values={{ cloudProvider: "Azure" }}>
        <WizardStepAzureContext {...baseProps} />
      </WizardFormTestHarness>,
    );

    fireEvent.click(screen.getByTestId("wizard-azure-optional-toggle"));

    fireEvent.click(screen.getByTestId("wizard-ingest-extractor-copy"));

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledTimes(1);
    });

    const copied = String(writeTextMock.mock.calls[0]?.[0] ?? "");

    expect(copied).toContain(`-SubscriptionId '${DEV_SCOPE_TENANT_ID}'`);
    expect(copied).toContain("Run-ArchLucidAzureExtractor.ps1");
  });
});
