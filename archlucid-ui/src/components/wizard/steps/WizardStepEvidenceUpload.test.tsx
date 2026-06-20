import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("renders the source picker with honest V1.1 badges", () => {
    render(<WizardStepEvidenceUpload {...baseProps} />);

    expect(screen.getByTestId("wizard-evidence-upload-step")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-evidence-source-picker")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-evidence-source-brief")).toHaveTextContent("Available");
    expect(screen.getByTestId("wizard-evidence-source-azure-export")).toHaveTextContent("Fastest");
    expect(screen.getByTestId("wizard-evidence-source-aws-gcp-inventory")).toHaveTextContent("V1.1");
    expect(screen.getByTestId("wizard-evidence-source-generic-inventory-json")).toHaveTextContent("V1.1");
    expect(screen.getByTestId("wizard-evidence-source-structurizr-archimate")).toHaveTextContent("V1.1");
    expect(screen.getByTestId("wizard-evidence-upload-dropzone")).toBeInTheDocument();
  });

  it("shows the document upload zone when Documents is selected", () => {
    render(<WizardStepEvidenceUpload {...baseProps} />);

    fireEvent.click(screen.getByTestId("wizard-evidence-source-documents"));

    expect(screen.getByTestId("wizard-evidence-source-panel-documents")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-evidence-upload-zone")).toBeInTheDocument();
    expect(screen.queryByTestId("wizard-evidence-upload-dropzone")).not.toBeInTheDocument();
  });

  it("shows the brief path panel when Brief is selected", () => {
    render(<WizardStepEvidenceUpload {...baseProps} />);

    fireEvent.click(screen.getByTestId("wizard-evidence-source-brief"));

    expect(screen.getByTestId("wizard-evidence-source-panel-brief")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-evidence-brief-quick-review-link")).toHaveAttribute(
      "href",
      "/reviews/new?path=quick-review",
    );
  });

  it("calls try demo handler with selected scenario from the demo panel", () => {
    const onTryDemoData = vi.fn();

    render(<WizardStepEvidenceUpload {...baseProps} onTryDemoData={onTryDemoData} />);

    fireEvent.click(screen.getByTestId("wizard-evidence-source-demo"));
    fireEvent.click(screen.getByTestId("wizard-evidence-demo-scenario-finops-optimization-snapshot"));
    fireEvent.click(screen.getByTestId("wizard-evidence-upload-try-demo"));

    expect(onTryDemoData).toHaveBeenCalledWith("finops-optimization-snapshot");
  });

  it("calls skip without requiring a file", () => {
    const onSkipDemoData = vi.fn();

    render(<WizardStepEvidenceUpload {...baseProps} onSkipDemoData={onSkipDemoData} />);

    fireEvent.click(screen.getByTestId("wizard-evidence-upload-skip-step"));

    expect(onSkipDemoData).toHaveBeenCalledTimes(1);
  });
});
