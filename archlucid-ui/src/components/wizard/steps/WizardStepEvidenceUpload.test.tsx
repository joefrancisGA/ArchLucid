import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { strToU8, zipSync } from "fflate";

import { WizardStepEvidenceUpload } from "@/components/wizard/steps/WizardStepEvidenceUpload";

describe("WizardStepEvidenceUpload", () => {
  const baseProps = {
    pendingFile: null,
    pendingDocumentFiles: [] as File[],
    onPendingFileChange: vi.fn(),
    onPendingDocumentFilesChange: vi.fn(),
    onTryDemoData: vi.fn(),
    onSkipDemoData: vi.fn(),
  };

  it("selects brief by default with brief panel and no cloud inventory upload on first render", () => {
    render(<WizardStepEvidenceUpload {...baseProps} />);

    expect(screen.getByTestId("wizard-evidence-source-brief")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("wizard-evidence-source-panel-brief")).toBeInTheDocument();
    expect(screen.queryByTestId("wizard-evidence-inventory-panel")).not.toBeInTheDocument();
  });

  it("renders Tier-1 inventory sources and AWS command panel when selected", () => {
    render(<WizardStepEvidenceUpload {...baseProps} />);

    expect(screen.getByTestId("wizard-evidence-source-aws-inventory")).toHaveTextContent("Fastest");
    expect(screen.getByTestId("wizard-evidence-source-gcp-inventory")).toHaveTextContent("Fastest");

    fireEvent.click(screen.getByTestId("wizard-evidence-source-azure-export"));

    expect(screen.getByTestId("wizard-evidence-inventory-panel")).toHaveAttribute("data-platform", "azure");
  });

  it("shows AWS inventory command when AWS source is selected", () => {
    render(<WizardStepEvidenceUpload {...baseProps} />);

    fireEvent.click(screen.getByTestId("wizard-evidence-source-aws-inventory"));

    expect(screen.getByTestId("wizard-evidence-inventory-panel")).toHaveAttribute("data-platform", "aws");
    expect(screen.getByTestId("wizard-evidence-inventory-command")).toHaveTextContent("Get-ArchLucidAwsPackage.ps1");
  });

  it("validates manifest and resources client-side before accepting ZIP", async () => {
    function Harness() {
      const [pendingFile, setPendingFile] = useState<File | null>(null);

      return (
        <WizardStepEvidenceUpload
          {...baseProps}
          pendingFile={pendingFile}
          onPendingFileChange={setPendingFile}
        />
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByTestId("wizard-evidence-source-azure-export"));

    const validZip = new File(
      [
        zipSync({
          "manifest.json": strToU8(
            JSON.stringify({
              schemaVersion: 1,
              scriptVersion: "1.0.0",
              collectionTimestamp: "2026-06-25T12:00:00.000Z",
              subscriptionId: "11111111-1111-1111-1111-111111111111",
              scope: "/subscriptions/11111111-1111-1111-1111-111111111111/resourceGroups/Rg",
            }),
          ),
          "resources.json": strToU8("[]"),
        }),
      ],
      "azure-pack.zip",
      { type: "application/zip" },
    );

    const input = screen.getByTestId("wizard-evidence-upload-dropzone-input");
    fireEvent.change(input, { target: { files: [validZip] } });

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-upload-selected")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("wizard-evidence-inventory-zip-error")).not.toBeInTheDocument();
  });

  it("shows cloud-agnostic demo source copy without Azure extractor package language", () => {
    render(<WizardStepEvidenceUpload {...baseProps} />);

    fireEvent.click(screen.getByTestId("wizard-evidence-source-demo"));

    expect(screen.getByTestId("wizard-evidence-source-panel-demo")).toHaveTextContent(
      "Choose a bundled example review scenario",
    );
    expect(screen.getByTestId("wizard-evidence-source-panel-demo").textContent?.toLowerCase()).not.toContain(
      "azure extractor package",
    );
  });

  it("shows evidence-quality context near skip evidence for now", () => {
    render(<WizardStepEvidenceUpload {...baseProps} />);

    fireEvent.click(screen.getByTestId("wizard-evidence-source-azure-export"));

    expect(screen.getByTestId("wizard-evidence-upload-skip-context")).toHaveTextContent(
      "Skipping evidence is OK — you can add files or cloud inventory from the review detail page after the review is created. Findings without evidence may have lower confidence.",
    );
    expect(screen.getByRole("button", { name: "Skip evidence for now" })).toBeInTheDocument();
  });

  it("shows structured validation error with cloud connections help link", async () => {
    render(<WizardStepEvidenceUpload {...baseProps} />);

    fireEvent.click(screen.getByTestId("wizard-evidence-source-azure-export"));

    const invalidZip = new File(
      [zipSync({ "readme.txt": strToU8("not an inventory zip") })],
      "bad.zip",
      { type: "application/zip" },
    );

    const input = screen.getByTestId("wizard-evidence-upload-dropzone-input");
    fireEvent.change(input, { target: { files: [invalidZip] } });

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-inventory-zip-error")).toBeInTheDocument();
    });

    expect(screen.getByTestId("tier1-inventory-zip-help-link")).toHaveAttribute("href", "/help/cloud-connections");
  });
});
