import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const admitDraftRequest = vi.fn();
const answerDraftQuestion = vi.fn();
const createDraftRequest = vi.fn();
const getDraftQuestions = vi.fn();
const patchDraftRequest = vi.fn();
const skipDraftQuestion = vi.fn();
const submitDraftRequest = vi.fn();
const routerPush = vi.fn();
const searchParamsGet = vi.hoisted(() => vi.fn(() => null as string | null));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
  useSearchParams: () => ({ get: (key: string) => searchParamsGet(key) }),
}));

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
  patchDraftRequest: (...args: unknown[]) => patchDraftRequest(...args),
  getDraftQuestions: (...args: unknown[]) => getDraftQuestions(...args),
  answerDraftQuestion: (...args: unknown[]) => answerDraftQuestion(...args),
  skipDraftQuestion: (...args: unknown[]) => skipDraftQuestion(...args),
  submitDraftRequest: (...args: unknown[]) => submitDraftRequest(...args),
}));

vi.mock("@/components/draft-intake/DraftIntakeActorEditor", () => ({
  DraftIntakeActorEditor: () => <div data-testid="draft-intake-actor-editor-stub">Actor editor stub</div>,
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

import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER,
  GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER,
} from "@/lib/guided-intake-copy";
import {
  OPERATOR_HOME_EXAMPLE_DESCRIPTION,
  OPERATOR_HOME_EXAMPLE_SYSTEM_NAME,
} from "@/lib/operator-home-example-request";

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

describe("SocraticIntakeWizard", () => {
  beforeEach(() => {
    searchParamsGet.mockImplementation(() => null);
  });

  it("prefills guided intake from template=claims-intake-modernization without auto-submitting", () => {
    searchParamsGet.mockImplementation((key: string) =>
      key === "template" ? "claims-intake-modernization" : null,
    );

    render(<SocraticIntakeWizard />);

    expect(screen.getByTestId("review-intake-example-template-callout")).toBeInTheDocument();
    expect((screen.getByTestId("socratic-intent") as HTMLTextAreaElement).value).toBe(
      OPERATOR_HOME_EXAMPLE_DESCRIPTION,
    );
    expect((screen.getByTestId("socratic-system-name") as HTMLInputElement).value).toBe(
      OPERATOR_HOME_EXAMPLE_SYSTEM_NAME,
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
    expect(createDraftRequest).not.toHaveBeenCalled();
  });

  it("shows guided placeholders and Continue on step 1", () => {
    render(<SocraticIntakeWizard />);

    expect(screen.getByTestId("socratic-intent")).toHaveAttribute(
      "placeholder",
      GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER,
    );
    expect(screen.getByTestId("socratic-outcome")).toHaveAttribute(
      "placeholder",
      GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER,
    );
    expect(screen.getByLabelText("Architecture intent (required)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
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

    fireEvent.change(screen.getByTestId("socratic-intent"), {
      target: { value: "Modernize the claims intake workflow for analysts." },
    });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce manual triage time by thirty percent." },
    });
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

    expect(screen.getByTestId("socratic-intake-progress")).toHaveTextContent(/step 2 of 3/i);
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

    fireEvent.change(screen.getByTestId("socratic-intent"), {
      target: { value: "Modernize the claims intake workflow for analysts." },
    });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce manual triage time by thirty percent." },
    });
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
      /handle all required clarifications first/i,
    );
    expect(screen.getByText(/your answers will be included when you review and submit/i)).toBeInTheDocument();
    expect(screen.getByTestId("socratic-questions-done")).toHaveTextContent(/review answers/i);
    expect(screen.getByTestId("socratic-questions-done")).toBeDisabled();

    const helper = screen.getByTestId("socratic-clarification-helper");
    const reviewButton = screen.getByTestId("socratic-questions-done");

    expect(helper.compareDocumentPosition(reviewButton) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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

    fireEvent.change(screen.getByTestId("socratic-intent"), {
      target: { value: "Modernize the claims intake workflow for analysts." },
    });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce manual triage time by thirty percent." },
    });
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-question-progress")).toHaveTextContent(
        /required clarification 1 of 2/i,
      );
    });

    fireEvent.change(screen.getByLabelText(sampleQuestion.prompt), {
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

    fireEvent.change(screen.getByTestId("socratic-intent"), {
      target: { value: "Modernize the claims intake workflow for analysts." },
    });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce manual triage time by thirty percent." },
    });
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

    fireEvent.change(screen.getByTestId("socratic-intent"), {
      target: { value: "Modernize the claims intake workflow for analysts." },
    });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce manual triage time by thirty percent." },
    });
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-question")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText(sampleQuestion.prompt), {
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

    fireEvent.change(screen.getByTestId("socratic-intent"), {
      target: { value: "Modernize the claims intake workflow for analysts." },
    });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce manual triage time by thirty percent." },
    });
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

  it("routes branch submit to run detail with parentRunId when parent already spawned", async () => {
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
      selection: { allQuestions: [], requiredMustQuestionKeys: [], pendingMustQuestions: [] },
    });
    submitDraftRequest.mockResolvedValue({
      draftId: "draft-1",
      status: "RunSpawned",
      runId: "branch-run",
      requestId: "req-branch",
      parentSpawnedRunId: "parent-run",
    });

    render(<SocraticIntakeWizard />);

    fireEvent.change(screen.getByTestId("socratic-intent"), {
      target: { value: "Modernize the claims intake workflow for analysts." },
    });
    fireEvent.change(screen.getByTestId("socratic-outcome"), {
      target: { value: "Reduce manual triage time by thirty percent." },
    });
    fireEvent.click(screen.getByTestId("socratic-admit"));

    await waitFor(() => {
      expect(screen.getByTestId("socratic-questions-done")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("socratic-questions-done"));
    fireEvent.click(screen.getByTestId("socratic-submit"));

    await waitFor(() => {
      expect(routerPush).toHaveBeenCalledWith(
        "/reviews/branch-run?parentRunId=parent-run&autoCompare=1",
      );
    });
  });
});
