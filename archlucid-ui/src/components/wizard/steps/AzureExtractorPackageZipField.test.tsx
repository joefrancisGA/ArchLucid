import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AzureExtractorPackageZipField } from "@/components/wizard/steps/AzureExtractorPackageZipField";
import { WizardFormTestHarness } from "@/components/wizard/wizard-form-test-utils";

describe("AzureExtractorPackageZipField (TB-495)", () => {
  it("uses CloudInventoryExtractorCommandPanel for baseline inventory script", () => {
    render(
      <WizardFormTestHarness>
        <AzureExtractorPackageZipField variant="baseline" />
      </WizardFormTestHarness>,
    );

    const panel = screen.getByTestId("wizard-baseline-extractor-panel");

    expect(panel).toHaveAttribute("data-platform", "azure");
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
});
