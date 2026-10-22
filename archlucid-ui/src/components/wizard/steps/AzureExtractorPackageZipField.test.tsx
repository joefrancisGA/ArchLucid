import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/new",
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ replace: vi.fn() }),
}));

vi.mock("@/lib/toast", () => ({
  showError: vi.fn(),
  showSuccess: vi.fn(),
}));

import { showError } from "@/lib/toast";
import { AzureExtractorPackageZipField } from "@/components/wizard/steps/AzureExtractorPackageZipField";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";

describe("AzureExtractorPackageZipField (TB-495)", () => {
  it("uses CloudInventoryExtractorCommandPanel for baseline inventory script", async () => {
    render(
      <WizardFormTestHarness>
        <AzureExtractorPackageZipField variant="baseline" />
      </WizardFormTestHarness>,
    );

    fireEvent.click(screen.getByTestId("wizard-azure-advanced-toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("wizard-baseline-extractor-panel")).toHaveAttribute("data-platform", "azure");
    });

    expect(screen.getByText("Azure inventory script")).toBeInTheDocument();
  });

  it("uses CloudInventoryExtractorCommandPanel for ingest inventory script", () => {
    render(
      <WizardFormTestHarness>
        <AzureExtractorPackageZipField variant="ingest" />
      </WizardFormTestHarness>,
    );

    const panel = screen.getByTestId("wizard-ingest-extractor-panel");

    expect(panel).toHaveAttribute("data-platform", "azure");
    expect(screen.getByText("Azure inventory script")).toBeInTheDocument();
  });

  it("shows inline ZIP validation without dual toast (TB-2009)", async () => {
    render(
      <WizardFormTestHarness>
        <AzureExtractorPackageZipField variant="ingest" />
      </WizardFormTestHarness>,
    );

    const fileInput = screen.getByTestId("wizard-azure-zip-field-input");
    const file = new File([new Uint8Array([1, 2, 3])], "not-a-zip.zip", { type: "application/zip" });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("wizard-azure-zip-error")).toBeInTheDocument();
    });

    expect(showError).not.toHaveBeenCalled();
  });
});
