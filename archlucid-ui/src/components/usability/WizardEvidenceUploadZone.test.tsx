import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  formatWizardEvidenceAttachmentSummary,
  WizardEvidenceUploadZone,
} from "./WizardEvidenceUploadZone";

describe("formatWizardEvidenceAttachmentSummary", () => {
  it("returns empty copy when no files are attached", () => {
    expect(formatWizardEvidenceAttachmentSummary(0)).toBe("");
    expect(formatWizardEvidenceAttachmentSummary(0, "architecture context optional")).toBe("");
  });

  it("pluralizes file count and appends an optional suffix", () => {
    expect(formatWizardEvidenceAttachmentSummary(1)).toBe("1 file attached");
    expect(formatWizardEvidenceAttachmentSummary(2, "architecture context optional")).toBe(
      "2 files attached — architecture context optional",
    );
  });
});

describe("WizardEvidenceUploadZone", () => {
  it("bolds the Accepted label in the description helper", () => {
    render(
      <WizardEvidenceUploadZone description="Diagram, PDF export, or architecture document. Accepted: PDF, DOCX." />,
    );

    const acceptedLabel = screen.getByText("Accepted:");
    expect(acceptedLabel.tagName).toBe("SPAN");
    expect(acceptedLabel).toHaveClass("font-semibold");
  });

  it("shows inline attachment summary instead of a toast when files are selected", async () => {
    render(
      <WizardEvidenceUploadZone attachmentSummarySuffix="architecture context optional" />,
    );

    const input = screen.getByLabelText(/browse files/i, { selector: "input" });
    const file = new File(["diagram"], "network-topology.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("wizard-evidence-upload-summary")).toHaveTextContent(
        "1 file attached — architecture context optional",
      );
    });
    expect(screen.getByTestId("wizard-evidence-upload-attachments")).toHaveTextContent(
      "network-topology.pdf",
    );
    expect(screen.getByRole("button", { name: "Remove network-topology.pdf" })).toBeInTheDocument();
  });
});
