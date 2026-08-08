import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const createRun = vi.fn();
const uploadDocuments = vi.fn();
const push = vi.fn();

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/api", () => ({
  createArchitectureRun: (...args: unknown[]) => createRun(...args),
}));

vi.mock("@/lib/wizard-pending-evidence-upload", () => ({
  uploadWizardPendingDocumentEvidence: (...args: unknown[]) => uploadDocuments(...args),
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
import { BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING } from "@/lib/buyer-polish-copy";
import { REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD } from "@/lib/create-vs-review-intake-copy";
import { showError } from "@/lib/toast";
import { FOCUSED_PILOT_MODE_POLICY_REFERENCE } from "@/lib/focused-pilot-mode-policy-packs";

import { FirstPilotIntakeWizard, FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE } from "./FirstPilotIntakeWizard";

describe("FirstPilotIntakeWizard", () => {
  beforeEach(() => {
    createRun.mockReset();
    uploadDocuments.mockReset();
    push.mockReset();
    vi.mocked(showError).mockReset();
  });

  it("uses buyer-safe submit validation copy without evidence-file jargon", () => {
    expect(FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE).toBe(
      "Add a review title and either attach architecture evidence or provide enough context in the description.",
    );
    expect(FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE.toLowerCase()).not.toContain("evidence file");
  });

  it("states the evidence-or-context rule once, on the form card (TB-747)", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.getAllByText(REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD)).toHaveLength(1);
    expect(screen.queryByTestId("first-pilot-intake-progress")).not.toBeInTheDocument();
    expect(screen.queryByTestId("first-run-intake-step-guide")).not.toBeInTheDocument();
  });

  it("names the remaining gap beside the disabled start button", () => {
    render(<FirstPilotIntakeWizard />);

    // An empty required field speaks for itself — no readiness line before the operator has typed anything.
    expect(screen.queryByTestId("first-pilot-readiness")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toBeDisabled();

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API review" },
    });

    expect(screen.getByTestId("first-pilot-readiness")).toHaveTextContent(
      "Attach evidence or add architecture context to start.",
    );
    expect(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toBeDisabled();
  });

  it("does not accept a bare title as a substitute for evidence or context", () => {
    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API review" },
    });
    fireEvent.change(screen.getByTestId("first-pilot-brief"), {
      target: { value: "Too short to review." },
    });

    expect(screen.getByTestId("first-pilot-readiness")).toHaveTextContent(
      "Architecture context needs at least 100 characters (20 so far), or attach evidence instead.",
    );
    expect(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toBeDisabled();

    fireEvent.change(screen.getByTestId("first-pilot-brief"), {
      target: { value: "x".repeat(120) },
    });

    expect(screen.queryByTestId("first-pilot-readiness")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toBeEnabled();
  });

  it("encourages rich architecture context without short-brief guidance", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.getByLabelText("Architecture context")).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add as much useful context as you can/i)).toBeInTheDocument();
    expect(screen.queryByText(/2–3 sentences/i)).toBeNull();
    // The evidence-or-context rule lives on the card lead and the readiness line, not a fourth static helper.
    expect(
      screen.queryByText(/If you do not upload files, provide enough context/i),
    ).not.toBeInTheDocument();
  });

  it("enables start with title and evidence file without a long brief", async () => {
    createRun.mockResolvedValue({ run: { runId: "first-pilot-run-1" } });
    uploadDocuments.mockResolvedValue({ ok: true });

    render(<FirstPilotIntakeWizard />);

    expect(screen.getByText(CREATE_REVIEW_PACKAGE_HEADING)).toBeInTheDocument();
    expect(screen.getByTestId("focused-pilot-policy-pack-applied-callout")).toBeTruthy();

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

    await waitFor(() => {
      expect(uploadDocuments).toHaveBeenCalledWith(
        "first-pilot-run-1",
        expect.arrayContaining([expect.objectContaining({ name: "network-topology.pdf" })]),
      );
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

  it("enables start with title and a long brief without evidence files", async () => {
    createRun.mockResolvedValue({ run: { runId: "first-pilot-run-context" } });

    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API review" },
    });
    fireEvent.change(screen.getByTestId("first-pilot-brief"), {
      target: {
        value:
          "Modernize the retail API behind an API gateway with containerized services, PostgreSQL for orders, Redis cache, PCI-scoped payment flows, and EU data residency for customer profiles.",
      },
    });

    const startButton = screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA });
    expect(startButton).not.toBeDisabled();

    fireEvent.click(startButton);

    await waitFor(() => {
      expect(createRun).toHaveBeenCalled();
    });

    expect(uploadDocuments).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(buildReviewGenerationRedirect("first-pilot-run-context", "quick-review"));
  });

  it("surfaces document upload failure without navigating away", async () => {
    createRun.mockResolvedValue({ run: { runId: "first-pilot-run-2" } });
    uploadDocuments.mockResolvedValue({
      ok: false,
      message: "Document evidence upload failed.",
      problem: null,
      correlationId: null,
    });

    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API review" },
    });
    fireEvent.click(screen.getByTestId("first-pilot-upload-stub"));
    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-submit-error")).toHaveTextContent(
        /document evidence upload failed/i,
      );
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("keeps review scope accordion collapsed by default", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.queryByText(/Review scope \(optional\)/i)).toBeTruthy();
    expect(screen.queryByText(/pilot mode/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("pilot-mode-policy-pack-toggle-recommended")).not.toBeInTheDocument();
  });

  it("offers review scope as two stated outcomes and drops the proof-dimension selector", () => {
    render(<FirstPilotIntakeWizard />);

    fireEvent.click(screen.getByRole("button", { name: /Review scope \(optional\)/i }));

    expect(screen.getByTestId("pilot-mode-policy-pack-toggle-recommended")).toBeChecked();
    expect(screen.getByTestId("pilot-mode-policy-pack-toggle-all")).not.toBeChecked();
    expect(screen.queryByTestId("quick-review-proof-scope")).not.toBeInTheDocument();
    expect(screen.queryByText(/What do you want proven/i)).not.toBeInTheDocument();
  });

  it("sends every proof dimension regardless of the review-scope choice", async () => {
    createRun.mockResolvedValue({ run: { runId: "first-pilot-run-scope" } });
    uploadDocuments.mockResolvedValue({ ok: true });

    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API review" },
    });
    fireEvent.click(screen.getByTestId("first-pilot-upload-stub"));
    fireEvent.click(screen.getByRole("button", { name: /Review scope \(optional\)/i }));
    fireEvent.click(screen.getByTestId("pilot-mode-policy-pack-toggle-all"));
    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));

    await waitFor(() => {
      expect(createRun).toHaveBeenCalled();
    });

    const body = createRun.mock.calls[0][0] as {
      requiredCapabilities: string[];
      policyReferences: string[];
    };
    expect(body.requiredCapabilities).toEqual(["cost-estimation", "policy-compliance", "architecture-topology"]);
    expect(body.policyReferences).not.toContain(FOCUSED_PILOT_MODE_POLICY_REFERENCE);
  });

  it("shows a buyer-safe inline error when submit fails", async () => {
    createRun.mockRejectedValue(new Error("Network down"));

    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API review" },
    });
    fireEvent.click(screen.getByTestId("first-pilot-upload-stub"));
    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-submit-error")).toHaveTextContent(
        /could not start the architecture review/i,
      );
    });
    expect(showError).not.toHaveBeenCalled();
  });
});
