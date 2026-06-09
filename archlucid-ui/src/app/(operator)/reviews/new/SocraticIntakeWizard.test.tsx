import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const admitDraftRequest = vi.fn();
const createDraftRequest = vi.fn();
const getDraftQuestions = vi.fn();
const patchDraftRequest = vi.fn();
const submitDraftRequest = vi.fn();
const routerPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: routerPush }),
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
  answerDraftQuestion: vi.fn(),
  skipDraftQuestion: vi.fn(),
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

vi.mock("@/components/draft-intake/DraftIntakeWhatIfBranchPanel", () => ({
  DraftIntakeWhatIfBranchPanel: () => <div data-testid="draft-intake-what-if-stub">What-if stub</div>,
}));

import { SocraticIntakeWizard } from "./SocraticIntakeWizard";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER,
  GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER,
} from "@/lib/guided-intake-copy";

describe("SocraticIntakeWizard", () => {
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
      draft: { draftId: "draft-1" },
      verdict: { kind: "Feasible", summary: "ok" },
    });
    getDraftQuestions.mockResolvedValue({
      draftId: "draft-1",
      status: "Admitted",
      selection: {
        allQuestions: [
          {
            questionKey: "l0.pillar.security",
            prompt: "How is data protected?",
            tier: "Must",
            answerKind: "FreeText",
            source: "L0Universal",
            ruleKeys: [],
          },
        ],
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
    expect(screen.getByTestId("draft-intake-what-if-stub")).toBeInTheDocument();
  });

  it("routes branch submit to run detail with parentRunId when parent already spawned", async () => {
    createDraftRequest.mockResolvedValue({ draftId: "draft-1" });
    patchDraftRequest.mockResolvedValue({ draftId: "draft-1", status: "Drafting" });
    admitDraftRequest.mockResolvedValue({
      admitted: true,
      pendingMustQuestions: [],
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
