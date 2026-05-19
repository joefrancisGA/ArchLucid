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

  it("shows the extractor command with the active tenant id prefilled and copies it", async () => {
    render(
      <WizardFormTestHarness>
        <WizardStepAzureContext />
      </WizardFormTestHarness>,
    );

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
