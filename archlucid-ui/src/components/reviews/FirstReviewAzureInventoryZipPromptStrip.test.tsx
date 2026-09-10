import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { FirstReviewAzureInventoryZipPromptStrip } from "@/components/reviews/FirstReviewAzureInventoryZipPromptStrip";
import { firstReviewAzureInventoryZipPromptSkipStorageKey } from "@/lib/first-review/azure-inventory-zip-first-review-prompt";

describe("FirstReviewAzureInventoryZipPromptStrip", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the Azure inventory ZIP ask on an in-progress first review", () => {
    render(
      <FirstReviewAzureInventoryZipPromptStrip
        runId="run-1"
        architectureRequestId="req-1"
        manifestFinalized={false}
        azureInventoryEvidencePresent={false}
      />,
    );

    expect(screen.getByTestId("first-review-azure-inventory-zip-prompt")).toBeInTheDocument();
    expect(screen.getByText("Upload Azure inventory ZIP")).toBeInTheDocument();
    expect(screen.getByTestId("first-review-azure-inventory-zip-upload-link")).toHaveAttribute(
      "href",
      "/administration/extract-upload?runId=run-1",
    );
  });

  it("hides the prompt after skip is persisted for the architecture", () => {
    localStorage.setItem(firstReviewAzureInventoryZipPromptSkipStorageKey("req-1"), "1");

    render(
      <FirstReviewAzureInventoryZipPromptStrip
        runId="run-1"
        architectureRequestId="req-1"
        manifestFinalized={false}
        azureInventoryEvidencePresent={false}
      />,
    );

    expect(screen.queryByTestId("first-review-azure-inventory-zip-prompt")).toBeNull();
  });

  it("persists skip when the operator chooses Skip for now", () => {
    render(
      <FirstReviewAzureInventoryZipPromptStrip
        runId="run-1"
        architectureRequestId="req-1"
        manifestFinalized={false}
        azureInventoryEvidencePresent={false}
      />,
    );

    fireEvent.click(screen.getByTestId("first-review-azure-inventory-zip-skip"));

    expect(localStorage.getItem(firstReviewAzureInventoryZipPromptSkipStorageKey("req-1"))).toBe("1");
    expect(screen.queryByTestId("first-review-azure-inventory-zip-prompt")).toBeNull();
  });

  it("does not render when finalize already completed", () => {
    render(
      <FirstReviewAzureInventoryZipPromptStrip
        runId="run-1"
        architectureRequestId="req-1"
        manifestFinalized={true}
        azureInventoryEvidencePresent={false}
      />,
    );

    expect(screen.queryByTestId("first-review-azure-inventory-zip-prompt")).toBeNull();
  });
});
