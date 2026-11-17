import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { GuidedIntakeEvidenceSection } from "./GuidedIntakeEvidenceSection";

vi.mock("./QuickReviewWizardDeferredPanels", () => ({
  WizardEvidenceUploadZone: (props: {
    readonly onFilesSelected: (files: File[]) => void;
  }) => (
    <div data-testid="guided-intake-upload-stub">
      <button
        type="button"
        data-testid="guided-intake-upload-clear"
        onClick={() => {
          props.onFilesSelected([]);
        }}
      >
        Clear uploads
      </button>
      <button
        type="button"
        data-testid="guided-intake-upload-add"
        onClick={() => {
          props.onFilesSelected([new File(["x"], "operator-upload.pdf", { type: "application/pdf" })]);
        }}
      >
        Add upload
      </button>
    </div>
  ),
}));

describe("GuidedIntakeEvidenceSection", () => {
  it("keeps prior-package attachment labels visible when the operator clears step uploads", () => {
    const onEvidenceFilesChange = vi.fn();

    render(
      <GuidedIntakeEvidenceSection
        disabled={false}
        priorAttachedFileNames={["ARCHITECTURE_HANDBOOK.2026.08.06b.docx"]}
        onEvidenceFilesChange={onEvidenceFilesChange}
      />,
    );

    expect(screen.getByTestId("guided-intake-prior-attached-files")).toBeInTheDocument();
    expect(screen.getByText("ARCHITECTURE_HANDBOOK.2026.08.06b.docx")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("guided-intake-upload-add"));
    expect(onEvidenceFilesChange).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ name: "operator-upload.pdf" })]),
    );

    fireEvent.click(screen.getByTestId("guided-intake-upload-clear"));
    expect(onEvidenceFilesChange).toHaveBeenLastCalledWith([]);

    expect(screen.getByTestId("guided-intake-prior-attached-files")).toBeInTheDocument();
    expect(screen.getByText("ARCHITECTURE_HANDBOOK.2026.08.06b.docx")).toBeInTheDocument();
  });

  it("omits the prior-package block when no prior attachment names were prefilled", () => {
    render(
      <GuidedIntakeEvidenceSection
        disabled={false}
        priorAttachedFileNames={[]}
        onEvidenceFilesChange={vi.fn()}
      />,
    );

    expect(screen.queryByTestId("guided-intake-prior-attached-files")).not.toBeInTheDocument();
    expect(screen.getByTestId("guided-intake-evidence-section")).toBeInTheDocument();
  });
});