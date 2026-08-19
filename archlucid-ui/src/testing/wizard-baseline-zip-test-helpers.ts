import { act, fireEvent, screen, waitFor } from "@testing-library/react";
import { expect } from "vitest";

async function expandAzureAdvancedEvidence(): Promise<void> {
  fireEvent.click(screen.getByTestId("wizard-azure-advanced-toggle"));
  await screen.findByTestId("wizard-baseline-zip-field-input", {}, { timeout: 5000 });
}

export async function uploadBaselineWizardZip(zipFile: File): Promise<void> {
  await expandAzureAdvancedEvidence();

  const zipInput = screen.getByTestId("wizard-baseline-zip-field-input");

  await act(async () => {
    fireEvent.change(zipInput, { target: { files: [zipFile] } });
  });

  await waitFor(() => {
    expect(screen.queryByTestId("wizard-azure-zip-error")).not.toBeInTheDocument();
  });
}
