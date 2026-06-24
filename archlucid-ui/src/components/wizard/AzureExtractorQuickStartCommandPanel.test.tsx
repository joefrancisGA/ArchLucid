import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { AzureExtractorQuickStartCommandPanel } from "@/components/wizard/AzureExtractorQuickStartCommandPanel";

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

describe("AzureExtractorQuickStartCommandPanel", () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("renders command line and copies to clipboard", async () => {
    render(<AzureExtractorQuickStartCommandPanel testIdPrefix="quick-start-test" />);

    expect(screen.getByTestId("quick-start-test-command")).toBeInTheDocument();
    expect(screen.getByTestId("quick-start-test-copy")).toBeEnabled();

    fireEvent.click(screen.getByTestId("quick-start-test-copy"));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });
});
