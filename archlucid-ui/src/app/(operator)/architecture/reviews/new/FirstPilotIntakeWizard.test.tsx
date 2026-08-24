import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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

vi.mock("@/components/architecture/ArchitectureScopeUnderstandingCheckPanel", async () => {
  const { ArchitectureScopeUnderstandingCheckPanelVitestMock } = await import(
    "@/testing/architecture-scope-understanding-check-vitest-mock"
  );

  return {
    ArchitectureScopeUnderstandingCheckPanel: ArchitectureScopeUnderstandingCheckPanelVitestMock,
  };
});

vi.mock("./QuickReviewWizardDeferredPanels", () => ({
  WizardEvidenceUploadZone: (props: { onFilesSelected?: (files: File[]) => void }) => (
    <>
      <button
        type="button"
        data-testid="first-pilot-upload-stub"
        onClick={() => {
          props.onFilesSelected?.([new File(["diagram"], "network-topology.pdf", { type: "application/pdf" })]);
        }}
      >
        Attach evidence stub
      </button>
      <button
        type="button"
        data-testid="first-pilot-upload-photo-stub"
        onClick={() => {
          props.onFilesSelected?.([new File(["image"], "photo.png", { type: "image/png" })]);
        }}
      >
        Attach photo stub
      </button>
    </>
  ),
}));

import { buildReviewGenerationRedirect } from "@/lib/review-generation-handoff";
import { BUYER_START_ARCHITECTURE_REVIEW_CTA, CREATE_REVIEW_PACKAGE_HEADING, NEW_REVIEW_SAMPLE_ESCAPE_CTA } from "@/lib/buyer/buyer-polish-copy";
import { REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD } from "@/lib/create-vs-review-intake-copy";
import { showError } from "@/lib/toast";
import { REVIEW_START_PREPARING_LABEL } from "@/lib/review-start-progress-copy";
import { FOCUSED_PILOT_MODE_POLICY_REFERENCE } from "@/lib/focused-pilot-mode-policy-packs";
import { satisfyAllQuickStartL0MustQuestions } from "@/testing/quick-start-l0-must-vitest-helpers";

import { FirstPilotIntakeWizard, FIRST_PILOT_INTAKE_SUBMIT_VALIDATION_MESSAGE } from "./FirstPilotIntakeWizard";

/** The intake gate (TB-2176) blocks start until the operator confirms the in-scope understanding. */
function confirmScopeUnderstanding(): void {
  fireEvent.click(screen.getByTestId("architecture-scope-understanding-confirm"));
}

function prepareQuickStartEvidenceReady(): void {
  fireEvent.change(screen.getByTestId("first-pilot-title"), {
    target: { value: "Retail API modernization review" },
  });
  fireEvent.click(screen.getByTestId("first-pilot-upload-stub"));
  satisfyAllQuickStartL0MustQuestions();
  confirmScopeUnderstanding();
}

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

  it("states the evidence-or-context rule once on the workflow panel (TB-747, TB-1874)", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.getByTestId("first-pilot-intake-panel")).toBeInTheDocument();
    expect(screen.getAllByText(REVIEW_INTAKE_EVIDENCE_FIRST_PROGRESS_LEAD)).toHaveLength(1);
    expect(screen.queryByTestId("first-pilot-intake-progress")).not.toBeInTheDocument();
    expect(screen.queryByTestId("first-run-intake-step-guide")).not.toBeInTheDocument();
  });

  it("does not require Card chrome for the quick-start intake panel (TB-1874)", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.getByRole("heading", { name: CREATE_REVIEW_PACKAGE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("first-pilot-title")).toBeInTheDocument();
    expect(screen.getByTestId("first-pilot-start")).toBeInTheDocument();
  });

  it("names the remaining gap beside the start button and surfaces validation on click", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.getByTestId("first-pilot-readiness")).toHaveTextContent(
      "Add a review title and attach evidence or add architecture context (at least 100 characters) to start.",
    );
    const startButton = screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA });
    expect(startButton).toBeEnabled();
    expect(startButton).toHaveAttribute("aria-describedby", "first-pilot-readiness");

    fireEvent.click(startButton);
    expect(screen.getByTestId("first-pilot-validation-error")).toHaveTextContent(
      "Add a review title and attach evidence or add architecture context (at least 100 characters) to start.",
    );

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API modernization review" },
    });

    expect(screen.getByTestId("first-pilot-readiness")).toHaveTextContent(
      "Attach evidence or add architecture context to start.",
    );
    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));
    expect(screen.getByTestId("first-pilot-validation-error")).toHaveTextContent(
      "Attach evidence or add architecture context to start.",
    );
    expect(showError).not.toHaveBeenCalled();
  });

  it("accepts a short project title with attached evidence instead of requiring system-plus-decision wording", () => {
    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "#Al-Lucid" },
    });
    fireEvent.click(screen.getByTestId("first-pilot-upload-stub"));

    const readiness = screen.getByTestId("first-pilot-readiness");
    expect(readiness).not.toHaveTextContent(/system and the decision/i);
    expect(readiness).not.toHaveTextContent(/either attach architecture evidence or provide enough context/i);
  });

  it("surfaces intake readiness inline without toast (TB-2113)", () => {
    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API modernization review" },
    });

    expect(screen.getByTestId("first-pilot-readiness")).toBeInTheDocument();
    expect(screen.queryByTestId("first-pilot-validation-error")).not.toBeInTheDocument();
    expect(showError).not.toHaveBeenCalled();
  });

  it("does not accept a bare title as a substitute for evidence or context", () => {
    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API modernization review" },
    });
    fireEvent.change(screen.getByTestId("first-pilot-brief"), {
      target: { value: "Too short to review." },
    });

    expect(screen.getByTestId("first-pilot-readiness")).toHaveTextContent(
      /Architecture Context needs at least 100 characters \(20 so far\), or attach evidence instead\./i,
    );
    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));
    expect(screen.getByTestId("first-pilot-validation-error")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("first-pilot-brief"), {
      target: { value: "x".repeat(120) },
    });

    expect(screen.getByTestId("first-pilot-readiness")).toHaveTextContent(/required clarification/i);
    expect(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA })).toBeEnabled();
  });

  it("does not treat title plus evidence as sufficient without L0 MUST clarifications (TB-2283)", async () => {
    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API modernization review" },
    });
    fireEvent.click(screen.getByTestId("first-pilot-upload-stub"));
    confirmScopeUnderstanding();

    expect(screen.getByTestId("first-pilot-readiness")).toHaveTextContent(/required clarification/i);

    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));

    expect(createRun).not.toHaveBeenCalled();
    expect(screen.getByTestId("first-pilot-validation-error")).toBeInTheDocument();
  });

  it("encourages rich architecture context with a 100-character helper", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.getByLabelText(/Architecture context/i)).toBeInTheDocument();
    expect(screen.getByText(/100 characters minimum if you are not attaching evidence/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Add as much useful context as you can/i)).toBeInTheDocument();
    expect(screen.queryByText(/2–3 sentences/i)).toBeNull();
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
    expect(screen.getByTestId("first-pilot-write-destination")).toBeInTheDocument();
    expect(screen.getByTestId("new-review-sample-escape-inline")).toBeInTheDocument();

    prepareQuickStartEvidenceReady();

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
      requestSource?: string;
      wizardPresetUsed?: string;
      intakeQuestionAnswers?: Record<string, string>;
    };
    expect(body.systemName).toBe("Retail API modernization review");
    expect(body.description).toContain("network-topology.pdf");
    expect(body.description.length).toBeGreaterThanOrEqual(100);
    expect(body.policyReferences).toContain(FOCUSED_PILOT_MODE_POLICY_REFERENCE);
    expect(body.requestSource).toBe("wizard");
    expect(body.wizardPresetUsed).toBe("quick-review");
    expect(body.intakeQuestionAnswers?.["intake.pending-evidence-file-names"]).toBe("network-topology.pdf");
    expect(body.intakeQuestionAnswers?.["intake.operator-brief-character-count"]).toBe("0");
    expect(Object.keys(body.intakeQuestionAnswers ?? {}).length).toBeGreaterThanOrEqual(7);
    expect(push).toHaveBeenCalledWith(buildReviewGenerationRedirect("first-pilot-run-1", "quick-review"));
  });

  it("does not require a review standards confirmation checkbox before start", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.queryByTestId("first-pilot-review-standards-confirm-checkbox")).not.toBeInTheDocument();
    expect(screen.queryByTestId("first-pilot-review-standards-confirm")).not.toBeInTheDocument();
  });

  it("does not enable start for title plus unrelated image without limited-evidence acknowledgment (TB-2296)", async () => {
    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API modernization review" },
    });
    fireEvent.click(screen.getByTestId("first-pilot-upload-photo-stub"));
    satisfyAllQuickStartL0MustQuestions();
    confirmScopeUnderstanding();

    expect(screen.getByTestId("first-pilot-limited-evidence-ack")).toBeInTheDocument();
    expect(screen.getByTestId("first-pilot-readiness")).toHaveTextContent(/analyzable architecture evidence/i);

    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));
    expect(createRun).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("first-pilot-limited-evidence-ack-checkbox"));
    await waitFor(() => {
      expect(screen.queryByTestId("first-pilot-readiness")).toBeNull();
    });
  });

  it("shows loading feedback immediately after start is clicked", () => {
    createRun.mockImplementation(() => new Promise(() => undefined));

    render(<FirstPilotIntakeWizard />);

    prepareQuickStartEvidenceReady();
    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));

    expect(screen.getByTestId("first-pilot-review-start-progress")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: REVIEW_START_PREPARING_LABEL })).toHaveAttribute("aria-busy", "true");
  });

  it("enables start with title and a long brief without evidence files", async () => {
    createRun.mockResolvedValue({ run: { runId: "first-pilot-run-context" } });

    render(<FirstPilotIntakeWizard />);

    fireEvent.change(screen.getByTestId("first-pilot-title"), {
      target: { value: "Retail API modernization review" },
    });
    fireEvent.change(screen.getByTestId("first-pilot-brief"), {
      target: {
        value:
          "Modernize the retail API behind an API gateway with containerized services, PostgreSQL for orders, Redis cache, PCI-scoped payment flows, and EU data residency for customer profiles.",
      },
    });
    satisfyAllQuickStartL0MustQuestions();
    confirmScopeUnderstanding();

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

    prepareQuickStartEvidenceReady();
    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-submit-error")).toHaveTextContent(
        /document evidence upload failed/i,
      );
    });
    expect(push).not.toHaveBeenCalled();
  });

  it("keeps review standards selection collapsed by default", () => {
    render(<FirstPilotIntakeWizard />);

    const standardsSection = screen.getByTestId("first-pilot-standards-selection");
    expect(standardsSection).not.toHaveAttribute("open");
    expect(screen.queryByText(/pilot mode/i)).not.toBeInTheDocument();
    expect(
      within(standardsSection).getByTestId("pilot-mode-policy-pack-toggle-recommended"),
    ).not.toBeVisible();
  });

  it("offers review standards as two stated outcomes and drops the proof-dimension selector", () => {
    render(<FirstPilotIntakeWizard />);

    fireEvent.click(screen.getByText(/Review standards selection/i));

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
      target: { value: "Retail API modernization review" },
    });
    fireEvent.click(screen.getByTestId("first-pilot-upload-stub"));
    fireEvent.click(screen.getByText(/Review standards selection/i));
    fireEvent.click(screen.getByTestId("pilot-mode-policy-pack-toggle-all"));
    satisfyAllQuickStartL0MustQuestions();
    confirmScopeUnderstanding();
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

    prepareQuickStartEvidenceReady();
    fireEvent.click(screen.getByRole("button", { name: BUYER_START_ARCHITECTURE_REVIEW_CTA }));

    await waitFor(() => {
      expect(screen.getByTestId("first-pilot-submit-error")).toHaveTextContent(
        /could not start the architecture review/i,
      );
    });
    expect(showError).not.toHaveBeenCalled();
  });

  it("surfaces the completed sample package link beside the primary CTA", () => {
    render(<FirstPilotIntakeWizard />);

    expect(screen.getByTestId("first-pilot-intake-action-row")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: NEW_REVIEW_SAMPLE_ESCAPE_CTA })).toBeInTheDocument();
  });
});
