import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WizardStepEvidenceUpload } from "@/components/wizard/steps/WizardStepEvidenceUpload";

describe("WizardStepEvidenceUpload", () => {
  it("renders the dropzone and skip control", () => {
    render(
      <WizardStepEvidenceUpload
        pendingFile={null}
        onPendingFileChange={vi.fn()}
        onTrySampleData={vi.fn()}
        onSkipDemoData={vi.fn()}
      />,
    );

    expect(screen.getByTestId("wizard-evidence-upload-step")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-evidence-upload-dropzone")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-evidence-upload-try-sample")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-evidence-upload-skip-demo")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-evidence-source-brief")).toHaveTextContent("Available");
    expect(screen.getByTestId("wizard-evidence-source-azure-export")).toHaveTextContent("Fastest");
    expect(screen.getByTestId("wizard-evidence-source-aws-gcp-inventory")).toHaveTextContent("V1.1");
    expect(screen.getByTestId("wizard-evidence-source-generic-inventory-json")).toHaveTextContent("V1.1");
    expect(screen.getByTestId("wizard-evidence-source-structurizr-archimate-import")).toHaveTextContent("V1.1");
  });

  it("calls try sample handler", () => {
    const onTrySampleData = vi.fn();

    render(
      <WizardStepEvidenceUpload
        pendingFile={null}
        onPendingFileChange={vi.fn()}
        onTrySampleData={onTrySampleData}
        onSkipDemoData={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByTestId("wizard-evidence-upload-try-sample"));

    expect(onTrySampleData).toHaveBeenCalledTimes(1);
  });

  it("calls skip without requiring a file", () => {
    const onSkipDemoData = vi.fn();

    render(
      <WizardStepEvidenceUpload
        pendingFile={null}
        onPendingFileChange={vi.fn()}
        onTrySampleData={vi.fn()}
        onSkipDemoData={onSkipDemoData}
      />,
    );

    fireEvent.click(screen.getByTestId("wizard-evidence-upload-skip-demo"));

    expect(onSkipDemoData).toHaveBeenCalledTimes(1);
  });
});
