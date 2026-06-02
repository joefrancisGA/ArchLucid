import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { WizardStepEvidenceUpload } from "@/components/wizard/steps/WizardStepEvidenceUpload";

describe("WizardStepEvidenceUpload", () => {
  it("renders the dropzone and skip control", () => {
    render(
      <WizardStepEvidenceUpload
        pendingFile={null}
        onPendingFileChange={vi.fn()}
        onSkipDemoData={vi.fn()}
      />,
    );

    expect(screen.getByTestId("wizard-evidence-upload-step")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-evidence-upload-dropzone")).toBeInTheDocument();
    expect(screen.getByTestId("wizard-evidence-upload-skip-demo")).toBeInTheDocument();
  });

  it("calls skip without requiring a file", () => {
    const onSkipDemoData = vi.fn();

    render(
      <WizardStepEvidenceUpload
        pendingFile={null}
        onPendingFileChange={vi.fn()}
        onSkipDemoData={onSkipDemoData}
      />,
    );

    fireEvent.click(screen.getByTestId("wizard-evidence-upload-skip-demo"));

    expect(onSkipDemoData).toHaveBeenCalledTimes(1);
  });
});
