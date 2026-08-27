import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { WIZARD_STICKY_PROGRESS_TEST_ID } from "@/lib/wizard-sticky-progress";

const admitDraftRequest = vi.fn();
const answerDraftQuestion = vi.fn();
const createDraftRequest = vi.fn();
const getDraftQuestions = vi.fn();
const getDraftRequest = vi.fn();
const patchDraftRequest = vi.fn();
const skipDraftQuestion = vi.fn();
const submitDraftRequest = vi.fn();
const routerPush = vi.fn();
const searchParamsGet = vi.hoisted(() => vi.fn(() => null as string | null));

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  useRouter: () => ({ push: routerPush }),
  useSearchParams: () => ({ get: (key: string) => searchParamsGet(key) }),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/components/architecture/ArchitectureScopeUnderstandingCheckPanel", async () => {
  const { ArchitectureScopeUnderstandingCheckPanelVitestMock } = await import(
    "@/testing/architecture-scope-understanding-check-vitest-mock"
  );

  return {
    ArchitectureScopeUnderstandingCheckPanel: ArchitectureScopeUnderstandingCheckPanelVitestMock,
  };
});

vi.mock("@/hooks/use-llm-monthly-budget-execution-gate", () => ({
  useLlmMonthlyBudgetExecutionGate: () => ({
    loading: false,
    status: null,
    blocksLlmExecution: false,
  }),
}));

vi.mock("@/lib/api/draft-intake-api", () => ({
  admitDraftRequest: (...args: unknown[]) => admitDraftRequest(...args),
  createDraftRequest: (...args: unknown[]) => createDraftRequest(...args),
  getDraftRequest: (...args: unknown[]) => getDraftRequest(...args),
  patchDraftRequest: (...args: unknown[]) => patchDraftRequest(...args),
  getDraftQuestions: (...args: unknown[]) => getDraftQuestions(...args),
  answerDraftQuestion: (...args: unknown[]) => answerDraftQuestion(...args),
  skipDraftQuestion: (...args: unknown[]) => skipDraftQuestion(...args),
  submitDraftRequest: (...args: unknown[]) => submitDraftRequest(...args),
}));

vi.mock("@/components/draft-intake/DraftIntakeActorEditor", () => ({
  DraftIntakeActorEditor: ({
    onChange,
  }: {
    onChange: (actorSet: {
      actors: Array<{
        label: string;
        kind: "Human";
        trustOrigin: "Internal";
        contract: "Sync";
        origin: "Asserted";
        confidence: 100;
      }>;
    }) => void;
  }) => (
    <div>
      <div data-testid="draft-intake-actor-editor-stub">Actor editor stub</div>
      <button
        type="button"
        data-testid="draft-intake-actor-stub-add"
        onClick={() => {
          onChange({
            actors: [
              {
                label: "Ops user",
                kind: "Human",
                trustOrigin: "Internal",
                contract: "Sync",
                origin: "Asserted",
                confidence: 100,
              },
            ],
          });
        }}
      >
        Stub add actor
      </button>
    </div>
  ),
}));

vi.mock("@/components/draft-intake/DraftIntakeDecisionReceiptCard", () => ({
  DraftIntakeDecisionReceiptCard: () => (
    <div data-testid="draft-intake-decision-receipt-stub">Decision receipt stub</div>
  ),
}));

vi.mock("@/lib/toast", () => ({
  showSuccess: vi.fn(),
  showError: vi.fn(),
}));

vi.mock("@/components/draft-intake/DraftIntakeReasoningPanel", () => ({
  DraftIntakeReasoningPanel: () => <div data-testid="draft-intake-reasoning-stub">Reasoning stub</div>,
}));

vi.mock("@/components/draft-intake/DraftIntakeAdvancedSection", () => ({
  DraftIntakeAdvancedSection: ({ children }: { children?: React.ReactNode }) => (
    <div data-testid="draft-intake-advanced-stub">{children}</div>
  ),
}));

vi.mock("@/components/draft-intake/DraftIntakeWhatIfBranchPanel", () => ({
  DraftIntakeWhatIfBranchPanel: () => <div data-testid="draft-intake-what-if-stub">What-if stub</div>,
}));

vi.mock("./SocraticIntakeWizardDeferredPanels", async () => {
  const advancedRail = await import("./SocraticIntakeWizardAdvancedRail");
  const decisionReceipt = await import("@/components/draft-intake/DraftIntakeDecisionReceiptCard");

  return {
    SocraticIntakeWizardAdvancedRail: advancedRail.SocraticIntakeWizardAdvancedRail,
    DraftIntakeDecisionReceiptCard: decisionReceipt.DraftIntakeDecisionReceiptCard,
  };
});

import { ApiRequestError } from "@/lib/api-request-error";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_HELPER,
  GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER,
  GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER,
  GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS,
} from "@/lib/guided-intake-copy";
import { showError } from "@/lib/toast";
import {
  OPERATOR_HOME_EXAMPLE_DESCRIPTION,
  OPERATOR_HOME_EXAMPLE_SYSTEM_NAME,
} from "@/lib/operator/operator-home-example-request";

import { SocraticIntakeWizard } from "./SocraticIntakeWizard";

const sampleQuestion = {
  questionKey: "l0.pillar.security",
  prompt: "How is data protected?",
  tier: "Must" as const,
  answerKind: "FreeText" as const,
  source: "L0Universal" as const,
  ruleKeys: [],
};

const secondQuestion = {
  questionKey: "l0.pillar.reliability",
  prompt: "How is availability ensured?",
  tier: "Must" as const,
  answerKind: "FreeText" as const,
  source: "L0Universal" as const,
  ruleKeys: [],
};

const VALID_GUIDED_INTENT =
  "Modernize the claims intake workflow for analysts with governed REST APIs, FHIR validation, and HIPAA-aligned audit trails across enterprise tenants.";

// Scope is confirmed last: editing an intake field above re-derives the rows and reopens the gate.
function fillStep0ForAdmission(): void {
  fireEvent.change(screen.getByTestId("socratic-intent"), {
    target: { value: VALID_GUIDED_INTENT },
  });
  fireEvent.change(screen.getByTestId("socratic-outcome"), {
    target: { value: "Reduce manual triage time by thirty percent." },
  });
  fireEvent.click(screen.getByTestId("draft-intake-actor-stub-add"));
  fireEvent.click(screen.getByTestId("architecture-scope-understanding-confirm"));
}

function mockAdmittedDraftWithoutClarifications(): void {
  const admittedMustKeys = ["l0.pillar.security", "l0.pillar.reliability"];
  const allQuestions = [sampleQuestion, secondQuestion];

  createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
  patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
  admitDraftRequest.mockResolvedValue({
    admitted: true,
    pendingMustQuestions: [],
    requiredMustQuestionKeys: [],
    draft: {
      draftId: "draft-1",
      document: { requiredMustQuestionKeys: admittedMustKeys },
    },
    verdict: { kind: "Feasible", summary: "ok" },
  });
  getDraftQuestions.mockResolvedValue({
    draftId: "draft-1",
    status: "Admitted",
    selection: {
      allQuestions,
      requiredMustQuestionKeys: [],
      pendingMustQuestions: [],
    },
  });
  getDraftRequest.mockResolvedValue({
    draftId: "draft-1",
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    status: "Admitted",
    document: {
      freeTextIntent: VALID_GUIDED_INTENT,
      businessOutcome: "Reduce manual triage time by thirty percent.",
      actorSet: { actors: [] },
      requiredMustQuestionKeys: admittedMustKeys,
    },
    createdUtc: "2026-08-05T12:00:00Z",
    updatedUtc: "2026-08-05T12:00:00Z",
  });
}

describe("SocraticIntakeWizard", () => {
  beforeEach(() => {
    searchParamsGet.mockImplementation(() => null);
    getDraftRequest.mockReset();
    routerPush.mockReset();
    window.sessionStorage.clear();
  });

  it("shows the saved architecture system name instead of the draft id in the banner", async () => {
    const sourceArchitectureId = "ef3f1b90-69e3-42be-bc2b-0533f5a6d84a";

    searchParamsGet.mockImplementation((key: string) => {
      if (key === "sourceArchitectureId") {
        return sourceArchitectureId;
      }

      return null;
    });

    getDraftRequest.mockResolvedValue({
      draftId: sourceArchitectureId,
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      status: "Drafting",
      document: {
        freeTextIntent: VALID_GUIDED_INTENT,
        systemName: "Claims intake modernization",
        businessOutcome: "Reduce manual triage time by thirty percent.",
        actorSet: {
          actors: [
            {
              label: "Claims analyst",
              kind: "Human",
              trustOrigin: "Internal",
              contract: "Sync",
              origin: "Asserted",
              confidence: 100,
            },
          ],
        },
      },
      createdUtc: "2026-08-05T12:00:00Z",
      updatedUtc: "2026-08-05T12:00:00Z",
    });

    render(<SocraticIntakeWizard />);

    await waitFor(() => {
      expect(getDraftRequest).toHaveBeenCalledWith(sourceArchitectureId);
    });

    const banner = await screen.findByTestId("socratic-source-architecture-banner");

    expect(banner).toHaveTextContent("Claims intake modernization");
    expect(banner).not.toHaveTextContent(sourceArchitectureId);
    expect(screen.getByRole("link", { name: "Claims intake modernization" })).toHaveAttribute(
      "href",
      `/architecture/architectures/${sourceArchitectureId}`,
    );
    const primaryPanel = screen.getByTestId("guided-intake-primary-panel");

    expect(primaryPanel).toBeInTheDocument();
    expect(banner.parentElement).toHaveClass("flex", "flex-col", "gap-4");
    expect(banner.parentElement).toContainElement(primaryPanel);
    expect(document.querySelector(".border-teal-200")).toBeNull();
    expect(document.querySelector(".border-sky-300")).toBeNull();
  });

  it("redirects to the linked review when the saved architecture draft is Submitted", async () => {
    const sourceArchitectureId = "5c0b5e6e-87aa-4eab-a477-c1fb45cc46f0";

    searchParamsGet.mockImplementation((key: string) =>
      key === "sourceArchitectureId" ? sourceArchitectureId : null,
    );

    getDraftRequest.mockResolvedValue({
      draftId: sourceArchitectureId,
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      status: "Submitted",
      spawnedRunId: "run-vertex-2",
      document: {
        freeTextIntent: VALID_GUIDED_INTENT,
        systemName: "Vertex 2",
        businessOutcome: "Reduce manual triage time by thirty percent.",
        actorSet: {
          actors: [
            {
              label: "Claims analyst",
              kind: "Human",
              trustOrigin: "Internal",
              contract: "Sync",
              origin: "Asserted",
              confidence: 100,
            },
          ],
        },
      },
      createdUtc: "2026-08-05T12:00:00Z",
      updatedUtc: "2026-08-05T12:00:00Z",
    });

    render(<SocraticIntakeWizard />);

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/architecture/reviews/run-vertex-2");
    });

    expect(screen.getByTestId("guided-intake-access-blocked-redirect")).toBeInTheDocument();
    expect(screen.queryByTestId("guided-intake-primary-panel")).toBeNull();
    expect(submitDraftRequest).not.toHaveBeenCalled();
  });

  it("redirects to the architecture draft when Submitted has no linked review yet", async () => {
    const sourceArchitectureId = "5c0b5e6e-87aa-4eab-a477-c1fb45cc46f0";

    searchParamsGet.mockImplementation((key: string) =>
      key === "sourceArchitectureId" ? sourceArchitectureId : null,
    );

    getDraftRequest.mockResolvedValue({
      draftId: sourceArchitectureId,
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      status: "Submitted",
      document: {
        freeTextIntent: VALID_GUIDED_INTENT,
        systemName: "Vertex 2",
        businessOutcome: "Reduce manual triage time by thirty percent.",
        actorSet: {
          actors: [
            {
              label: "Claims analyst",
              kind: "Human",
              trustOrigin: "Internal",
              contract: "Sync",
              origin: "Asserted",
              confidence: 100,
            },
          ],
        },
      },
      createdUtc: "2026-08-05T12:00:00Z",
      updatedUtc: "2026-08-05T12:00:00Z",
    });

    render(<SocraticIntakeWizard />);

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith(`/architecture/architectures/${sourceArchitectureId}`);
    });

    expect(screen.getByTestId("guided-intake-access-blocked-redirect")).toBeInTheDocument();
    expect(screen.queryByTestId("guided-intake-primary-panel")).toBeNull();
  });

  it("redirects to the linked review when the saved architecture draft is RunSpawned", async () => {
    const sourceArchitectureId = "5c0b5e6e-87aa-4eab-a477-c1fb45cc46f0";

    searchParamsGet.mockImplementation((key: string) =>
      key === "sourceArchitectureId" ? sourceArchitectureId : null,
    );

    getDraftRequest.mockResolvedValue({
      draftId: sourceArchitectureId,
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      status: "RunSpawned",
      spawnedRunId: "run-vertex-2",
      document: {
        freeTextIntent: VALID_GUIDED_INTENT,
        systemName: "Vertex 2",
        businessOutcome: "Reduce manual triage time by thirty percent.",
        actorSet: {
          actors: [
            {
              label: "Claims analyst",
              kind: "Human",
              trustOrigin: "Internal",
              contract: "Sync",
              origin: "Asserted",
              confidence: 100,
            },
          ],
        },
      },
      createdUtc: "2026-08-05T12:00:00Z",
      updatedUtc: "2026-08-05T12:00:00Z",
    });

    render(<SocraticIntakeWizard />);

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith("/architecture/reviews/run-vertex-2");
    });
  });

  it("keeps step 0 on one primary intake panel without colored banner cards (TB-1879)", () => {
    render(<SocraticIntakeWizard />);

    expect(screen.getByTestId("guided-intake-primary-panel")).toBeInTheDocument();
    expect(screen.getByTestId("socratic-admit")).toBeInTheDocument();
    expect(document.querySelectorAll("[data-testid='guided-intake-primary-panel']")).toHaveLength(1);
    expect(document.querySelector(".border-teal-200")).toBeNull();
    expect(document.querySelector(".border-sky-300")).toBeNull();
  });

  it("prefills guided intake from template=customer-intake-modernization without auto-submitting", () => {
    searchParamsGet.mockImplementation((key: string) =>
      key === "template" ? "customer-intake-modernization" : null,
    );

    render(<SocraticIntakeWizard />);

    expect(screen.getByTestId("review-intake-example-template-callout")).toBeInTheDocument();
    expect((screen.getByTestId("socratic-intent") as HTMLTextAreaElement).value).toBe(
      OPERATOR_HOME_EXAMPLE_DESCRIPTION,
    );
    expect((screen.getByTestId("socratic-system-name") as HTMLInputElement).value).toBe(
      OPERATOR_HOME_EXAMPLE_SYSTEM_NAME,
    );
    expect(screen.getByRole("button", { name: GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS })).toBeDisabled();
    expect(createDraftRequest).not.toHaveBeenCalled();
  });

  it("shows guided placeholders and Continue to clarifications on step 1", () => {
    render(<SocraticIntakeWizard />);

    expect(screen.getByTestId("socratic-intent")).toHaveAttribute(
      "placeholder",
      GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER,
    );
    expect(screen.getByTestId("socratic-outcome")).toHaveAttribute(
      "placeholder",
      GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER,
    );
    expect(screen.getByLabelText("Architecture Intent (required)")).toBeInTheDocument();
    expect(screen.getByTestId("socratic-intent-helper")).toHaveTextContent(
      GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_HELPER,
    );
    expect(screen.getByRole("button", { name: GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS })).toBeDisabled();
    expect(screen.getByTestId(WIZARD_STICKY_PROGRESS_TEST_ID)).toHaveTextContent(/step 1 of 3/i);
    const stickyChrome = screen.getByTestId(WIZARD_STICKY_PROGRESS_TEST_ID);
    expect(stickyChrome.className).toContain("sticky");
    expect(screen.getByRole("button", { name: GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS })).toBeInTheDocument();
    expect(screen.queryByTestId("draft-intake-claim-label-structural-admission")).not.toBeInTheDocument();
  });

  it("shows under-minimum intent helper copy and blocks continue until 100 characters", () => {
    render(<SocraticIntakeWizard />);

    fireEvent.change(screen.getByTestId("socratic-intent"), {
      target: { value: "Too short for guided intake." },
    });

    expect(screen.getByTestId("socratic-intent-helper")).toHaveTextContent(/\/ 100 characters/i);
    expect(screen.getByTestId("socratic-intent-helper")).toHaveTextContent(
      GUIDED_INTAKE_ARCHITECTURE_INTENT_MIN_HELPER,
    );
    expect(screen.getByRole("button", { name: GUIDED_INTAKE_CONTINUE_TO_CLARIFICATIONS })).toBeDisabled();

    fireEvent.change(screen.getByTestId("socratic-intent"), {
      target: { value: VALID_GUIDED_INTENT },
    });

    expect(screen.getByTestId("socratic-intent-helper")).toHaveTextContent(/characters\.$/);
    expect(screen.queryByText(/Minimum 10 characters/i)).not.toBeInTheDocument();
  });

  it("creates, patches, and admits a draft when intent and outcome are provided", async () => {
    createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [],
      requiredMustQuestionKeys: [],
      draft: { draftId: "draft-1" },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    getDraftQuestions.mockResolvedValue({
      draftId: "draft-1",
      status: "Admitted",
      selection: {
        allQuestions: [sampleQuestion],
        requiredMustQuestionKeys: [],
        pendingMustQuestions: [],
      },
    });

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    expect(screen.getByTestId("draft-intake-actor-editor-stub")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(createDraftRequest).toHaveBeenCalled();
      expect(patchDraftRequest).toHaveBeenCalledWith(
        "draft-1",
        expect.objectContaining({
          actorSet: expect.objectContaining({
            actors: expect.arrayContaining([
              expect.objectContaining({ origin: "Asserted", confidence: 100 }),
            ]),
          }),
        }),
      );
      expect(admitDraftRequest).toHaveBeenCalledWith("draft-1");
    });

    expect(screen.getByTestId(WIZARD_STICKY_PROGRESS_TEST_ID)).toHaveTextContent(/step 2 of 3/i);
    expect(screen.getByTestId("draft-intake-reasoning-stub")).toBeInTheDocument();
    expect(screen.getByTestId("draft-intake-advanced-stub")).toBeInTheDocument();
    expect(screen.getByTestId("draft-intake-what-if-stub")).toBeInTheDocument();
  });

  it("shows one required clarification at a time with progress copy", async () => {
    createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [sampleQuestion],
      requiredMustQuestionKeys: ["l0.pillar.security"],
      draft: { draftId: "draft-1" },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    getDraftQuestions.mockResolvedValue({
      draftId: "draft-1",
      status: "Admitted",
      selection: {
        allQuestions: [sampleQuestion],
        requiredMustQuestionKeys: ["l0.pillar.security"],
        pendingMustQuestions: [sampleQuestion],
      },
    });

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-question-progress")).toHaveTextContent(
        /required clarification 1 of 1/i,
      );
    });

    expect(screen.getAllByTestId("socratic-question")).toHaveLength(1);
    expect(screen.getByTestId("socratic-clarification-helper")).toHaveTextContent(
      /answer or skip each clarification\. you can review everything before starting the architecture review/i,
    );
    expect(screen.getByTestId("socratic-review-answers-hint")).toHaveTextContent(
      /handle all required clarifications before reviewing answers/i,
    );
    expect(screen.getByText(/your answers will be included when you review and submit/i)).toBeInTheDocument();
    expect(screen.getByTestId("socratic-questions-done")).toHaveTextContent(/review answers/i);
    expect(screen.getByTestId("socratic-questions-done")).toBeDisabled();

    const helper = screen.getByTestId("socratic-clarification-helper");
    const reviewButton = screen.getByTestId("socratic-questions-done");
    const stickyFooter = screen.getByTestId("wizard-sticky-footer");

    expect(helper.compareDocumentPosition(reviewButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(stickyFooter).toContainElement(reviewButton);
  });

  it("renders related resources in the wizard main column on the clarifications step", async () => {
    createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [sampleQuestion],
      requiredMustQuestionKeys: ["l0.pillar.security"],
      draft: { draftId: "draft-1" },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    getDraftQuestions.mockResolvedValue({
      draftId: "draft-1",
      status: "Admitted",
      selection: {
        allQuestions: [sampleQuestion],
        requiredMustQuestionKeys: ["l0.pillar.security"],
        pendingMustQuestions: [sampleQuestion],
      },
    });

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-clarifications-step")).toBeInTheDocument();
    });

    const clarificationsStep = screen.getByTestId("socratic-clarifications-step");
    const primaryPanel = screen.getByTestId("guided-intake-primary-panel");

    expect(clarificationsStep.className).not.toContain("pb-24");
    expect(primaryPanel.className).toContain("pb-24");

    const wizard = screen.getByTestId("socratic-intake-wizard");
    const mainColumn = wizard.firstElementChild as HTMLElement;
    const orientation = screen.getByTestId("reviews-new-orientation-top");

    expect(mainColumn).toContainElement(orientation);
    expect(mainColumn).toContainElement(clarificationsStep);
    expect(
      orientation.compareDocumentPosition(clarificationsStep) & Node.DOCUMENT_POSITION_PRECEDING,
    ).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Related resources" })).toBeInTheDocument();
  });

  it("advances from clarification 1 to clarification 2 after Save and continue", async () => {
    createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [sampleQuestion, secondQuestion],
      requiredMustQuestionKeys: ["l0.pillar.security", "l0.pillar.reliability"],
      draft: { draftId: "draft-1" },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    getDraftQuestions.mockResolvedValue({
      draftId: "draft-1",
      status: "Admitted",
      selection: {
        allQuestions: [sampleQuestion, secondQuestion],
        requiredMustQuestionKeys: ["l0.pillar.security", "l0.pillar.reliability"],
        pendingMustQuestions: [sampleQuestion, secondQuestion],
      },
    });

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-question-progress")).toHaveTextContent(
        /required clarification 1 of 2/i,
      );
    });

    fireEvent.change(screen.getByRole("textbox", { name: /how is data protected/i }), {
      target: { value: "Encrypt data at rest and in transit." },
    });
    fireEvent.click(screen.getByTestId("socratic-save-and-continue"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-question-progress")).toHaveTextContent(
        /required clarification 2 of 2/i,
      );
      expect(screen.getByText(secondQuestion.prompt)).toBeInTheDocument();
    });

    expect(answerDraftQuestion).not.toHaveBeenCalled();
    expect(screen.getByTestId("socratic-questions-done")).toBeDisabled();
  });

  it("shows dynamic show-all clarifications copy", async () => {
    createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [sampleQuestion, secondQuestion],
      requiredMustQuestionKeys: ["l0.pillar.security", "l0.pillar.reliability"],
      draft: { draftId: "draft-1" },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    getDraftQuestions.mockResolvedValue({
      draftId: "draft-1",
      status: "Admitted",
      selection: {
        allQuestions: [sampleQuestion, secondQuestion],
        requiredMustQuestionKeys: ["l0.pillar.security", "l0.pillar.reliability"],
        pendingMustQuestions: [sampleQuestion, secondQuestion],
      },
    });

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-view-all-clarifications")).toHaveTextContent(
        "Show all 2 clarifications",
      );
    });
  });

  it("saves locally with Save and continue then persists on Review answers", async () => {
    createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [sampleQuestion],
      requiredMustQuestionKeys: ["l0.pillar.security"],
      draft: { draftId: "draft-1" },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    getDraftQuestions
      .mockResolvedValueOnce({
        draftId: "draft-1",
        status: "Admitted",
        selection: {
          allQuestions: [sampleQuestion],
          requiredMustQuestionKeys: ["l0.pillar.security"],
          pendingMustQuestions: [sampleQuestion],
        },
      })
      .mockResolvedValueOnce({
        draftId: "draft-1",
        status: "Admitted",
        selection: {
          allQuestions: [sampleQuestion],
          requiredMustQuestionKeys: ["l0.pillar.security"],
          pendingMustQuestions: [],
        },
      });
    answerDraftQuestion.mockResolvedValue({ draftId: "draft-1", status: "Admitted" });

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-question")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByRole("textbox", { name: /how is data protected/i }), {
      target: { value: "Encrypt data at rest and in transit." },
    });

    fireEvent.click(screen.getByTestId("socratic-save-and-continue"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-questions-done")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("socratic-questions-done"));

    await waitFor(() => {
      expect(answerDraftQuestion).toHaveBeenCalledWith(
        "draft-1",
        "l0.pillar.security",
        "Encrypt data at rest and in transit.",
      );
      expect(screen.getByTestId("socratic-submit")).toBeInTheDocument();
    });
  });

  it("skips a clarification and enables review when all are handled", async () => {
    createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [sampleQuestion],
      requiredMustQuestionKeys: ["l0.pillar.security"],
      draft: { draftId: "draft-1" },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    getDraftQuestions
      .mockResolvedValueOnce({
        draftId: "draft-1",
        status: "Admitted",
        selection: {
          allQuestions: [sampleQuestion],
          requiredMustQuestionKeys: ["l0.pillar.security"],
          pendingMustQuestions: [sampleQuestion],
        },
      })
      .mockResolvedValueOnce({
        draftId: "draft-1",
        status: "Admitted",
        selection: {
          allQuestions: [sampleQuestion],
          requiredMustQuestionKeys: ["l0.pillar.security"],
          pendingMustQuestions: [],
        },
      });
    skipDraftQuestion.mockResolvedValue({ draftId: "draft-1", status: "Admitted" });

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-question")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Skip this clarification" }));

    await waitFor(() => {
      expect(skipDraftQuestion).toHaveBeenCalledWith("draft-1", "l0.pillar.security");
      expect(screen.getByTestId("socratic-questions-done")).toBeEnabled();
      expect(screen.queryByTestId("socratic-review-answers-hint")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("socratic-questions-done"));

    await waitFor(() => {
      expect(answerDraftQuestion).not.toHaveBeenCalled();
      expect(screen.getByTestId("socratic-submit")).toBeInTheDocument();
    });
  });

  it("enables Review answers when skip API succeeds but questions refresh is still stale", async () => {
    createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [sampleQuestion],
      requiredMustQuestionKeys: ["l0.pillar.security"],
      draft: { draftId: "draft-1" },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    // Admit refresh + post-skip refresh both still list the MUST as pending (lag).
    getDraftQuestions.mockResolvedValue({
      draftId: "draft-1",
      status: "Admitted",
      selection: {
        allQuestions: [sampleQuestion],
        requiredMustQuestionKeys: ["l0.pillar.security"],
        pendingMustQuestions: [sampleQuestion],
      },
    });
    skipDraftQuestion.mockResolvedValue({ draftId: "draft-1", status: "Admitted" });

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-question")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Skip this clarification" }));

    await waitFor(() => {
      expect(skipDraftQuestion).toHaveBeenCalledWith("draft-1", "l0.pillar.security");
      expect(screen.getByTestId("socratic-questions-done")).toBeEnabled();
    });

    fireEvent.click(screen.getByTestId("socratic-questions-done"));

    await waitFor(() => {
      expect(answerDraftQuestion).not.toHaveBeenCalled();
      expect(screen.getByTestId("socratic-submit")).toBeInTheDocument();
    });
  });

  it("shows handled clarification count when every required clarification is already answered", async () => {
    mockAdmittedDraftWithoutClarifications();

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-clarifications-answered-counter")).toHaveTextContent(
        "2 of 2 answered",
      );
    });
  });

  it("routes branch submit to run detail with parentRunId when parent already spawned", async () => {
    mockAdmittedDraftWithoutClarifications();
    submitDraftRequest.mockResolvedValue({
      draftId: "draft-1",
      status: "RunSpawned",
      runId: "branch-run",
      requestId: "req-branch",
      parentSpawnedRunId: "parent-run",
    });
    getDraftRequest.mockResolvedValue({
      draftId: "draft-1",
      tenantId: "tenant-1",
      workspaceId: "workspace-1",
      projectId: "project-1",
      status: "RunSpawned",
      spawnedRunId: "branch-run",
      document: {
        freeTextIntent: VALID_GUIDED_INTENT,
        businessOutcome: "Reduce manual triage time by thirty percent.",
        actorSet: { actors: [] },
      },
      createdUtc: "2026-08-05T12:00:00Z",
      updatedUtc: "2026-08-05T12:00:00Z",
    });

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-questions-done")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("socratic-questions-done"));
    fireEvent.click(screen.getByTestId("socratic-submit"));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith(
        "/architecture/reviews/branch-run?parentRunId=parent-run&autoCompare=1",
      );
    });
  });

  it("gates continue on scope confirmation so the brief carries scope before admission", async () => {
    mockAdmittedDraftWithoutClarifications();

    render(<SocraticIntakeWizard />);

    fireEvent.change(screen.getByTestId("socratic-intent"), { target: { value: VALID_GUIDED_INTENT } });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce manual triage time by thirty percent." },
    });
    fireEvent.click(screen.getByTestId("draft-intake-actor-stub-add"));

    expect(screen.getByTestId("socratic-admit")).toBeDisabled();
    expect(screen.getByTestId("socratic-advance-hint")).toHaveTextContent(/in-scope confirmation/i);

    fireEvent.click(screen.getByTestId("architecture-scope-understanding-confirm"));

    expect(screen.getByTestId("socratic-admit")).toBeEnabled();

    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(admitDraftRequest).toHaveBeenCalledWith("draft-1");
    });
  });

  it("submits an admitted draft without patching it again", async () => {
    mockAdmittedDraftWithoutClarifications();
    submitDraftRequest.mockResolvedValue({
      draftId: "draft-1",
      status: "RunSpawned",
      runId: "run-1",
      requestId: "req-1",
    });

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-questions-done")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("socratic-questions-done"));
    fireEvent.click(screen.getByTestId("socratic-submit"));

    await waitFor(() => {
      expect(submitDraftRequest).toHaveBeenCalledWith("draft-1");
    });

    // A patch here would be rejected: the draft is immutable in status Admitted.
    expect(patchDraftRequest).toHaveBeenCalledTimes(1);
  });

  it("shows a failed submit inline above the CTA instead of a toast", async () => {
    mockAdmittedDraftWithoutClarifications();
    submitDraftRequest.mockRejectedValue(
      new ApiRequestError("MUST question 'l0.pillar.security' must be answered before submit.", {
        problem: null,
        correlationId: "corr-1",
        httpStatus: 400,
      }),
    );

    render(<SocraticIntakeWizard />);

    fillStep0ForAdmission();
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-questions-done")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("socratic-questions-done"));
    fireEvent.click(screen.getByTestId("socratic-submit"));

    const inlineError = await screen.findByTestId("guided-intake-request-error");

    expect(inlineError).toHaveTextContent(/must be answered before submit/i);
    expect(showError).not.toHaveBeenCalled();
    expect(
      inlineError.compareDocumentPosition(screen.getByTestId("socratic-submit"))
        & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
