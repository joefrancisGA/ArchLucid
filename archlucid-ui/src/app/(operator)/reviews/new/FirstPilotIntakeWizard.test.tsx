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
import { BUYER_NEW_REVIEW_TOAST_CATEGORY, BUYER_START_ARCHITECTURE_REVIEW_CTA } from "@/lib/buyer-polish-copy";
import { showError } from "@/lib/toast";
import { FOCUSED_PILOT_MODE_POLICY_REFERENCE } from "@/lib/focused-pilot-mode-policy-packs";

import { FirstPilotIntakeWizard, FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE } from "./FirstPilotIntakeWizard";

describe("FirstPilotIntakeWizard", () => {
  it("uses buyer-safe submit validation copy without evidence-file jargon", () => {
    expect(FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE).toBe(
      "Add a review title and upload at least one architecture document, or fill in the description.",
    );
    expect(FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE.toLowerCase()).not.toContain("evidence file");
  });

  it("enables start with title and evidence file without a long brief", async () => {
    createRun.mockResolvedValue({ run: { runId: "first-pilot-run-1" } });

    render(<FirstPilotIntakeWizard />);

    expect(screen.getByText("Create review package")).toBeInTheDocument();
    expect(screen.getByTestId("focused-pilot-policy-pack-applied-callout")).toBeTruthy();
    expect(screen.getByTestId("first-run-intake-step-guide")).toBeTruthy();

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API review" },
    });

    fireEvent.click(screen.getByTestId("first-pilot-upload-stub"));

    const startButton = screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA });
    expect(startButton).not.toBeDisabled();

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(createRun).toHaveBeenCalled();
    });

    const body = createRun.mock.calls[0][0] as {
      description: string;
      systemName: string;
      policyReferences: string[];
    };
    expect(body.systemName).toBe("Retail API review");
    expect(body.description).toContain("network-topology.pdf");
    expect(body.description.length).toBeGreaterThanOrEqual(100);
    expect(body.policyReferences).toContain(FOCUSED_PILOT_MODE_POLICY_REFERENCE);
    expect(push).toHaveBeenCalledWith(buildReviewGenerationRedirect("first-pilot-run-1", "quick-review"));
  });

  it("keeps review scope accordion collapsed by default", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.queryByText(/Review scope \(optional\)/i)).toBeTruthy();
    expect(screen.queryByText(/pilot mode/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("quick-review-proof-scope")).not.toBeInTheDocument();
  });

  it("uses buyer-safe toast category on submit errors", async () => {
    createRun.mockRejectedValue(new Error("Network down"));

    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API review" },
    });
    fireEvent.click(screen.getByTestId("first-pilot-upload-stub"));
    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));

    await waitFor(() => {
      expect(showError).toHaveBeenCalledWith(BUYER_NEW_REVIEW_TOAST_CATEGORY, "Network down");
    });
  });
});
