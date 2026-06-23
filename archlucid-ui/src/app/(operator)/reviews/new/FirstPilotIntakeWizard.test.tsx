import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const createRun = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createRun(...args),
}));

vi.mock("@/lib/first-tenant-funnel-telemetry", () => ({
  recordFirstTenantFunnelEvent: vi.fn(),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("./QuickReviewWizardDeferredPanels", () => ({
  WizardEvidenceUploadZone: (props: { onFilesSelected?: (files: File[]) => void }) => (
    <button
      type="button"
      data-testid="first-pilot-upload-stub"
      onClick={() => {
        props.onFilesSelected?.([new File(["diagram"], "network-topology.pdf", { type: "application/pdf" })]);
      }}
    >
      Attach evidence stub
    </button>
  ),
}));

import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";

import { FirstPilotIntakeWizard } from "./FirstPilotIntakeWizard";

describe("FirstPilotIntakeWizard", () => {
  it("enables start with title and evidence file without a long brief", async () => {
    createRun.mockResolvedValue({ run: { runId: "first-pilot-run-1" } });

    render(<FirstPilotIntakeWizard />);

    expect(screen.getByText("Create review package")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API review" },
    });

    fireEvent.click(screen.getByTestId("first-pilot-upload-stub"));

    const startButton = screen.getByRole("button", { name: "Start analysis" });
    expect(startButton).not.toBeDisabled();

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(createRun).toHaveBeenCalled();
    });

    const body = createRun.mock.calls[0][0] as { description: string; systemName: string };
    expect(body.systemName).toBe("Retail API review");
    expect(body.description).toContain("network-topology.pdf");
    expect(body.description.length).toBeGreaterThanOrEqual(100);
    expect(push).toHaveBeenCalledWith(buildReviewGenerationRedirect("first-pilot-run-1", "quick-review"));
  });

  it("keeps advanced configuration collapsed by default", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.queryByText(/Advanced configuration \(optional\)/i)).toBeTruthy();
    expect(screen.queryByTestId("quick-review-proof-scope")).not.toBeInTheDocument();
  });
});
